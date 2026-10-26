// AccountStoreOne — order / payment / escrow / delivery state machine.
//
// THE money truth of the store. One canonical amount field: orders.total_price.
// States:
//   status (fulfilment): New Order → PREPARING → Delivering → Completed
//                        (+ Canceled | Refunded | Disputed)
//   paymentStatus:       unpaid → pending_verification → paid → refunded
//   escrowState:         pending_payment → in_escrow → completed |
//                        disputed | refunded
// Escrow story (honest, code-backed): once payment is verified the funds are
// "held" (escrowState=in_escrow, escrowHoldUntil = +48h). They are released
// when the buyer confirms receipt, an admin completes the order, or the 48h
// hold lapses after delivery (lazy release on read). A dispute freezes the
// order until an admin resolves it (refund to wallet, redeliver, or reject).
//
// All money movements are Prisma transactions. Wallet movements always write
// a wallet_transactions ledger row in the same transaction.

import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  queueOrderConfirmation,
  queuePaymentVerified,
  queueDelivered,
  queueDisputeOutcome,
  queueRefund,
} from "./mailer";

export const SERVICE_FEE = 0.5;
export const ESCROW_HOLD_MS = 48 * 60 * 60 * 1000;

type Tx = Prisma.TransactionClient;

// ─── Audit trail (P1) ────────────────────────────────────────────────────
// Every state transition writes an order_events row in the SAME
// transaction, so the timeline in Order Details can never disagree with
// the order's real state.
export async function logOrderEvent(
  tx: Tx,
  orderId: string,
  actor: "buyer" | "admin" | "system" | "stripe",
  event: string,
  detail?: string,
) {
  await tx.orderEvent.create({ data: { orderId, actor, event, detail: detail || null } });
}

// ─── Derived stock (P2) ─────────────────────────────────────────────────
// For products with useInventoryStock, products.stock is a DERIVED CACHE:
//   available inventory units − units reserved by unpaid orders.
// It is recomputed after every mutation that can change either input, so
// the storefront, checkout and admin always read ONE stock number.
export async function syncDerivedStock(tx: Tx, productId: string | null | undefined) {
  if (!productId) return;
  const product = await tx.product.findUnique({ where: { id: productId }, select: { useInventoryStock: true } });
  if (!product?.useInventoryStock) return;
  const [available, reserved] = await Promise.all([
    tx.inventory.count({ where: { productId, status: "available" } }),
    tx.order.aggregate({
      where: {
        productId,
        paymentStatus: { in: ["unpaid", "pending_verification"] },
        status: { notIn: ["Canceled", "Refunded"] },
      },
      _sum: { quantity: true },
    }),
  ]);
  const stock = Math.max(0, available - (reserved._sum.quantity || 0));
  await tx.product.update({ where: { id: productId }, data: { stock } });
}

// ─── Variants (P2) ───────────────────────────────────────────────────────
export interface ProductVariant {
  label: string;
  priceDelta: number;
  stock?: number | null;
}

export function parseVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is Record<string, unknown> => !!v && typeof v === "object")
    .map((v) => ({
      label: String(v.label || "").trim(),
      priceDelta: Number(v.priceDelta ?? v.price_delta ?? 0) || 0,
      stock: v.stock === null || v.stock === undefined ? null : Number(v.stock),
    }))
    .filter((v) => v.label.length > 0);
}

async function adjustVariantStock(tx: Tx, product: { id: string; variants: unknown; useInventoryStock: boolean }, label: string | null, delta: number) {
  if (!label || product.useInventoryStock) return;
  const variants = parseVariants(product.variants);
  const idx = variants.findIndex((v) => v.label === label);
  if (idx < 0 || variants[idx].stock === null || variants[idx].stock === undefined) return;
  variants[idx].stock = Math.max(0, (variants[idx].stock as number) + delta);
  await tx.product.update({ where: { id: product.id }, data: { variants: variants as unknown as Prisma.InputJsonValue } });
}

// ─── Coupons (P5) ────────────────────────────────────────────────────────
// Validation + pricing are server-side only. A redemption is consumed at
// order creation and released again if the order is canceled/refunded.
export async function priceCoupon(
  tx: Tx,
  code: string,
  userId: string,
  product: { id: string; category: string | null },
  subtotal: Prisma.Decimal,
): Promise<{ coupon: NonNullable<Awaited<ReturnType<typeof prisma.coupon.findUnique>>>; discount: Prisma.Decimal }> {
  const coupon = await tx.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) throw new ServiceError("This coupon code is not valid", 422);
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new ServiceError("This coupon has expired", 422);
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) throw new ServiceError("This coupon has reached its usage limit", 422);
  if (coupon.scope === "product" && coupon.productId !== product.id) throw new ServiceError("This coupon does not apply to this product", 422);
  if (coupon.scope === "category" && coupon.category !== product.category) throw new ServiceError("This coupon does not apply to this category", 422);
  if (coupon.minSpend && subtotal.lt(dec(coupon.minSpend))) {
    throw new ServiceError(`This coupon needs a minimum spend of $${dec(coupon.minSpend).toFixed(2)}`, 422);
  }
  const priorUses = await tx.order.count({
    where: { userId, couponCode: coupon.code, status: { notIn: ["Canceled"] } },
  });
  if (priorUses >= coupon.perUserLimit) throw new ServiceError("You have already used this coupon", 422);
  let discount = coupon.type === "percent" ? subtotal.mul(dec(coupon.value)).div(100) : dec(coupon.value);
  if (discount.gt(subtotal)) discount = subtotal;
  discount = discount.toDecimalPlaces(2);
  return { coupon, discount };
}

async function releaseCoupon(tx: Tx, order: { couponCode: string | null }) {
  if (!order.couponCode) return;
  await tx.coupon.updateMany({
    where: { code: order.couponCode, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function dec(n: number | string | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(n as never);
}

async function notify(tx: Tx, userId: string | null, title: string, message: string, type: string) {
  if (!userId) return;
  await tx.notification.create({ data: { userId, title, message, type } });
}

async function notifyAdmins(tx: Tx, title: string, message: string, type: string) {
  const admins = await tx.profile.findMany({ where: { role: { in: ["admin", "moderator"] } }, select: { id: true } });
  for (const a of admins) await notify(tx, a.id, title, message, type);
}

async function getWalletForUpdate(tx: Tx, userId: string) {
  let wallet = await tx.wallet.findUnique({ where: { userId } });
  if (!wallet) wallet = await tx.wallet.create({ data: { userId, balance: 0 } });
  return wallet;
}

async function creditWallet(tx: Tx, userId: string, amount: Prisma.Decimal, type: string, opts: { method?: string; trxId?: string; note?: string; referenceId?: string } = {}) {
  const wallet = await getWalletForUpdate(tx, userId);
  await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type,
      status: "completed",
      method: opts.method,
      trxId: opts.trxId,
      note: opts.note,
      referenceId: opts.referenceId ?? null,
    },
  });
}

async function debitWallet(tx: Tx, userId: string, amount: Prisma.Decimal, type: string, opts: { note?: string; referenceId?: string } = {}) {
  const wallet = await getWalletForUpdate(tx, userId);
  if (dec(wallet.balance).lt(amount)) throw new ServiceError("Insufficient wallet balance", 402);
  await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } });
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: amount.negated(),
      type,
      status: "completed",
      method: "wallet",
      note: opts.note,
      referenceId: opts.referenceId ?? null,
    },
  });
}

/** Assign inventory to a paid order. Returns units assigned. */
async function autoDeliver(tx: Tx, order: { id: string; productId: string | null; quantity: number }) {
  if (!order.productId) return 0;
  const items = await tx.inventory.findMany({
    where: { productId: order.productId, status: "available" },
    orderBy: { createdAt: "asc" },
    take: order.quantity,
  });
  if (items.length === 0) return 0;

  for (const item of items) {
    await tx.inventory.update({
      where: { id: item.id },
      data: { status: "assigned", orderId: order.id, assignedAt: new Date() },
    });
  }

  const [first, ...rest] = items;
  const notesParts: string[] = [];
  if (first.additionalInfo) notesParts.push(first.additionalInfo);
  if (first.twoFactorSecret) notesParts.push(`2FA secret: ${first.twoFactorSecret}`);
  if (first.recoveryEmail) notesParts.push(`Recovery email: ${first.recoveryEmail}`);
  rest.forEach((item, i) => {
    notesParts.push(
      `Account ${i + 2}: ${item.accountLogin} / ${item.accountPassword}` +
        (item.twoFactorSecret ? ` (2FA: ${item.twoFactorSecret})` : "") +
        (item.additionalInfo ? ` — ${item.additionalInfo}` : ""),
    );
  });

  const fullyAssigned = items.length >= order.quantity;
  await tx.order.update({
    where: { id: order.id },
    data: {
      credentialUsername: first.accountLogin,
      credentialPassword: first.accountPassword,
      credentialNotes: notesParts.join("\n") || null,
      // Dedicated 2FA vault fields (the notes text above stays as a fallback record).
      twoFactorSecret: first.twoFactorSecret || null,
      recoveryEmail: first.recoveryEmail || null,
      ...(fullyAssigned ? { status: "Delivering", deliveredAt: new Date() } : {}),
    },
  });
  if (fullyAssigned) {
    await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: order.quantity } } });
    await logOrderEvent(tx, order.id, "system", "delivered", `Auto-delivered ${items.length} unit(s) from inventory`);
    await syncDerivedStock(tx, order.productId);
  }
  return items.length;
}

/** Shared "payment is now verified" transition + auto-delivery attempt. */
async function markPaidAndDeliver(tx: Tx, orderId: string, paymentMethod: string) {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ServiceError("Order not found", 404);
  if (order.paymentStatus === "paid") return order; // idempotent
  const updated = await tx.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      paymentMethod,
      paidAt: new Date(),
      escrowState: "in_escrow",
      escrowHoldUntil: new Date(Date.now() + ESCROW_HOLD_MS),
      status: order.status === "New Order" ? "PREPARING" : order.status,
    },
  });
  await logOrderEvent(tx, orderId, paymentMethod === "stripe" ? "stripe" : "system", "payment_verified", `Paid via ${paymentMethod}`);
  const assigned = await autoDeliver(tx, updated);
  await queuePaymentVerified(tx, updated, assigned >= order.quantity);
  if (assigned >= order.quantity) await queueDelivered(tx, updated);
  if (order.userId) {
    await notify(tx, order.userId, "Payment verified", assigned >= order.quantity ? "Your payment was verified and your credentials are ready in the vault." : "Your payment was verified. Your order is being prepared for delivery.", "payment");
  }
  return tx.order.findUnique({ where: { id: orderId } });
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function createOrder(input: {
  userId: string;
  username: string;
  email: string;
  productId: string;
  quantity: number;
  customerEmail?: string;
  variantLabel?: string;
  couponCode?: string;
}) {
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  return prisma.$transaction(async (tx) => {
    // Hide Shop (P0): a closed store takes no new orders. Existing orders
    // keep flowing (payment, delivery, disputes) — only creation stops.
    const open = await tx.storeSetting.findUnique({ where: { key: "store_open" } });
    if (open?.value === "false") throw new ServiceError("The store is temporarily closed and is not accepting new orders right now.", 503);

    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new ServiceError("Product not found", 404);
    if (!product.isActive) throw new ServiceError("This product is no longer available", 409);
    if (qty < product.minQuantity) {
      throw new ServiceError(`Minimum order quantity for this product is ${product.minQuantity}`, 422);
    }

    // Variant ("Custom Program") selection: adjusts the unit price and
    // may carry its own stock pool for manually-stocked products.
    let variant: ProductVariant | null = null;
    if (input.variantLabel) {
      variant = parseVariants(product.variants).find((v) => v.label === input.variantLabel) || null;
      if (!variant) throw new ServiceError("That variant is no longer available", 422);
    }
    const unitPrice = dec(product.price).add(variant ? variant.priceDelta : 0);
    if (unitPrice.lt(0)) throw new ServiceError("Invalid variant price", 422);

    // Stock. Two models, one visible number:
    //  - manual products: products.stock is the counter, decremented here
    //    (reservation) and restored on cancel.
    //  - inventory-derived products: sellable = available inventory −
    //    units reserved by unpaid orders (syncDerivedStock's formula);
    //    nothing is decremented here, the cache is re-synced instead.
    if (product.useInventoryStock) {
      const [available, reserved] = await Promise.all([
        tx.inventory.count({ where: { productId: product.id, status: "available" } }),
        tx.order.aggregate({
          where: {
            productId: product.id,
            paymentStatus: { in: ["unpaid", "pending_verification"] },
            status: { notIn: ["Canceled", "Refunded"] },
          },
          _sum: { quantity: true },
        }),
      ]);
      const sellable = available - (reserved._sum.quantity || 0);
      if (sellable <= 0) throw new ServiceError("This product is out of stock", 409);
      if (qty > sellable) throw new ServiceError(`Only ${sellable} unit(s) left in stock`, 409);
    } else {
      if (product.stock <= 0) throw new ServiceError("This product is out of stock", 409);
      if (qty > product.stock) throw new ServiceError(`Only ${product.stock} unit(s) left in stock`, 409);
      if (variant && variant.stock !== null && variant.stock !== undefined && qty > variant.stock) {
        throw new ServiceError(`Only ${variant.stock} unit(s) left for this variant`, 409);
      }
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: qty } } });
      if (variant) await adjustVariantStock(tx, product, variant.label, -qty);
    }

    const subtotal = unitPrice.mul(qty);
    let discount = dec(0);
    let couponCode: string | null = null;
    if (input.couponCode && input.couponCode.trim()) {
      const priced = await priceCoupon(tx, input.couponCode, input.userId, product, subtotal);
      discount = priced.discount;
      couponCode = priced.coupon.code;
      await tx.coupon.update({ where: { id: priced.coupon.id }, data: { usedCount: { increment: 1 } } });
    }
    const total = subtotal.sub(discount).add(SERVICE_FEE);
    const order = await tx.order.create({
      data: {
        productId: product.id,
        userId: input.userId,
        username: input.username,
        customerEmail: input.customerEmail || input.email,
        quantity: qty,
        totalPrice: total,
        variantLabel: variant?.label || null,
        couponCode,
        discountAmount: discount,
        status: "New Order",
        paymentStatus: "unpaid",
        escrowState: "pending_payment",
      },
    });
    if (product.useInventoryStock) await syncDerivedStock(tx, product.id);
    await logOrderEvent(tx, order.id, "buyer", "created", `Order placed × ${qty}${variant ? ` · ${variant.label}` : ""}${couponCode ? ` · coupon ${couponCode}` : ""}`);
    await queueOrderConfirmation(tx, order, product.title);
    await notifyAdmins(tx, "New order", `${input.username} ordered ${product.title} × ${qty} ($${total.toFixed(2)}) — awaiting payment.`, "order");
    return order;
  });
}

async function releaseAssignedInventory(tx: Tx, orderId: string, toStatus: "available" | "used" | "flagged") {
  await tx.inventory.updateMany({
    where: { orderId },
    data: { status: toStatus, ...(toStatus === "available" ? { orderId: null, assignedAt: null } : {}) },
  });
}

export async function payOrderWithWallet(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    if (order.paymentStatus === "paid") throw new ServiceError("Order is already paid", 409);
    if (order.status === "Canceled" || order.status === "Refunded") throw new ServiceError("Order is closed", 409);
    await debitWallet(tx, userId, dec(order.totalPrice), "purchase", { note: `Payment for order ${order.id.slice(0, 8)}`, referenceId: order.id });
    return markPaidAndDeliver(tx, orderId, "wallet");
  });
}

export async function submitManualPayment(input: {
  orderId?: string;
  userId: string;
  method: string;
  trxId: string;
  senderNumber?: string;
  amount?: number; // top-ups only
}) {
  const method = input.method === "nagad" ? "nagad" : "bkash";
  const trxId = (input.trxId || "").trim();
  if (trxId.length < 6) throw new ServiceError("Please enter a valid Transaction ID", 422);
  return prisma.$transaction(async (tx) => {
    if (input.orderId) {
      const order = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new ServiceError("Order not found", 404);
      if (order.userId !== input.userId) throw new ServiceError("Not your order", 403);
      if (order.paymentStatus === "paid") throw new ServiceError("Order is already paid", 409);
      if (order.status === "Canceled" || order.status === "Refunded") throw new ServiceError("Order is closed", 409);
      const existing = await tx.paymentRequest.findFirst({ where: { orderId: order.id, status: "pending" } });
      if (existing) throw new ServiceError("A payment for this order is already awaiting verification", 409);
      const pr = await tx.paymentRequest.create({
        data: {
          userId: input.userId,
          orderId: order.id,
          purpose: "order",
          method,
          amount: order.totalPrice,
          trxId,
          senderNumber: input.senderNumber || null,
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "pending_verification", paymentMethod: method } });
      await logOrderEvent(tx, order.id, "buyer", "payment_submitted", `${method} TrxID ${trxId}`);
      await notifyAdmins(tx, "Payment awaiting verification", `${order.username || "A buyer"} submitted a ${method} payment (TrxID ${trxId}) for order ${order.id.slice(0, 8)}.`, "payment");
      return pr;
    }
    // Wallet top-up
    const amount = dec(input.amount || 0);
    if (amount.lte(0)) throw new ServiceError("Enter a top-up amount greater than zero", 422);
    const pr = await tx.paymentRequest.create({
      data: { userId: input.userId, purpose: "topup", method, amount, trxId, senderNumber: input.senderNumber || null },
    });
    await notifyAdmins(tx, "Wallet top-up awaiting verification", `A ${method} top-up of $${amount.toFixed(2)} (TrxID ${trxId}) was submitted.`, "payment");
    return pr;
  });
}

export async function reviewPaymentRequest(prId: string, approve: boolean, adminNote?: string) {
  return prisma.$transaction(async (tx) => {
    const pr = await tx.paymentRequest.findUnique({ where: { id: prId } });
    if (!pr) throw new ServiceError("Payment request not found", 404);
    if (pr.status !== "pending") throw new ServiceError("This payment was already reviewed", 409);

    const updated = await tx.paymentRequest.update({
      where: { id: prId },
      data: { status: approve ? "approved" : "rejected", adminNote: adminNote || null, reviewedAt: new Date() },
    });

    if (pr.purpose === "order" && pr.orderId) {
      if (approve) {
        await markPaidAndDeliver(tx, pr.orderId, pr.method);
      } else {
        const order = await tx.order.findUnique({ where: { id: pr.orderId } });
        if (order && order.paymentStatus === "pending_verification") {
          await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "unpaid" } });
          await logOrderEvent(tx, order.id, "admin", "payment_rejected", adminNote || "Payment could not be verified");
          await syncDerivedStock(tx, order.productId);
          if (order.userId) await notify(tx, order.userId, "Payment not verified", "We could not verify your payment. Please check the Transaction ID and submit again, or contact support.", "payment");
        }
      }
    } else if (pr.purpose === "topup" && pr.userId) {
      if (approve) {
        await creditWallet(tx, pr.userId, dec(pr.amount), "topup", { method: pr.method, trxId: pr.trxId, note: `Top-up via ${pr.method} (TrxID ${pr.trxId})` });
        await notify(tx, pr.userId, "Wallet topped up", `$${dec(pr.amount).toFixed(2)} was added to your wallet.`, "payment");
      } else {
        await notify(tx, pr.userId, "Top-up not verified", "We could not verify your top-up payment. Please check the Transaction ID and try again.", "payment");
      }
    }
    return updated;
  });
}

/** Refund a paid order to the buyer's wallet (shared by cancel/dispute/admin refund). */
async function refundOrderToWallet(tx: Tx, order: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>, reason: string) {
  const wasDelivered = order.status === "Delivering" || order.status === "Completed";
  if (order.userId) {
    await creditWallet(tx, order.userId, dec(order.totalPrice), "refund", { note: reason, referenceId: order.id });
  }
  // Credentials already exposed → stock units are consumed, never resold.
  await releaseAssignedInventory(tx, order.id, wasDelivered ? "used" : "available");
  if (!wasDelivered && order.productId) {
    const product = await tx.product.findUnique({ where: { id: order.productId } });
    if (product && !product.useInventoryStock) {
      // Nothing was delivered: the stock reserved at order time goes back.
      await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
      await adjustVariantStock(tx, product, order.variantLabel, order.quantity);
    }
  }
  await releaseCoupon(tx, order);
  const updated = await tx.order.update({
    where: { id: order.id },
    data: { status: "Refunded", paymentStatus: "refunded", escrowState: "refunded" },
  });
  await syncDerivedStock(tx, order.productId);
  await logOrderEvent(tx, order.id, "system", "refunded", reason);
  await queueRefund(tx, updated);
  if (order.userId) await notify(tx, order.userId, "Refund issued", `$${dec(order.totalPrice).toFixed(2)} was refunded to your wallet.`, "payment");
  return updated;
}

export async function cancelOrder(orderId: string, actor: { userId: string; isAdmin: boolean }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (!actor.isAdmin && order.userId !== actor.userId) throw new ServiceError("Not your order", 403);
    if (["Canceled", "Refunded", "Completed"].includes(order.status)) throw new ServiceError(`Order is already ${order.status.toLowerCase()}`, 409);

    if (order.paymentStatus === "paid") {
      // Paid orders are refunded to the wallet, never silently cancelled.
      return refundOrderToWallet(tx, order, `Refund for cancelled order ${order.id.slice(0, 8)}`);
    }
    // Unpaid / pending: reject any pending payment + restore reserved stock.
    await tx.paymentRequest.updateMany({ where: { orderId: order.id, status: "pending" }, data: { status: "rejected", adminNote: "Order cancelled", reviewedAt: new Date() } });
    if (order.productId) {
      const product = await tx.product.findUnique({ where: { id: order.productId } });
      if (product && !product.useInventoryStock) {
        await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
        await adjustVariantStock(tx, product, order.variantLabel, order.quantity);
      }
    }
    await releaseCoupon(tx, order);
    const updated = await tx.order.update({ where: { id: order.id }, data: { status: "Canceled" } });
    await syncDerivedStock(tx, order.productId);
    await logOrderEvent(tx, order.id, actor.isAdmin ? "admin" : "buyer", "canceled", "Unpaid order canceled; reserved stock restored");
    return updated;
  });
}

export async function deliverManually(orderId: string, creds: { username: string; password: string; notes?: string; twoFactorSecret?: string; recoveryEmail?: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet — verify payment before delivering", 409);
    if (!creds.username.trim() || !creds.password.trim()) throw new ServiceError("Username and password are required", 422);
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        credentialUsername: creds.username.trim(),
        credentialPassword: creds.password.trim(),
        credentialNotes: creds.notes?.trim() || null,
        twoFactorSecret: creds.twoFactorSecret?.trim() || null,
        recoveryEmail: creds.recoveryEmail?.trim() || null,
        status: "Delivering",
        deliveredAt: new Date(),
      },
    });
    if (order.productId) {
      await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: order.quantity } } });
      // Inventory-derived products: a manual delivery consumes real units
      // so the derived stock can never oversell what was handed over.
      const product = await tx.product.findUnique({ where: { id: order.productId }, select: { useInventoryStock: true } });
      if (product?.useInventoryStock) {
        const spare = await tx.inventory.findMany({
          where: { productId: order.productId, status: "available" },
          orderBy: { createdAt: "asc" },
          take: order.quantity,
        });
        for (const item of spare) {
          await tx.inventory.update({ where: { id: item.id }, data: { status: "used", orderId: order.id, assignedAt: new Date() } });
        }
        await syncDerivedStock(tx, order.productId);
      }
    }
    await logOrderEvent(tx, orderId, "admin", "delivered", "Credentials delivered manually by the store");
    await queueDelivered(tx, updated);
    if (order.userId) await notify(tx, order.userId, "Order delivered", "Your credentials are ready in the order vault.", "delivery");
    return updated;
  });
}

async function completeOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ServiceError("Order not found", 404);
  if (order.status !== "Delivering") throw new ServiceError("Only a delivered order can be completed", 409);
  const updated = await tx.order.update({
    where: { id: orderId },
    data: { status: "Completed", escrowState: "completed", fundsReleasedAt: new Date() },
  });
  await logOrderEvent(tx, orderId, "system", "completed", "Escrow released — order completed");
  if (order.userId) await notify(tx, order.userId, "Order completed", "Your order is complete. Escrow funds have been released.", "order");
  return updated;
}

export async function confirmReceipt(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    return completeOrder(tx, orderId);
  });
}

export async function adminCompleteOrder(orderId: string) {
  return prisma.$transaction((tx) => completeOrder(tx, orderId));
}

export async function adminRefundOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Only a paid order can be refunded", 409);
    return refundOrderToWallet(tx, order, `Admin refund for order ${order.id.slice(0, 8)}`);
  });
}

// ─── Disputes ──────────────────────────────────────────────────────────────

export async function openDispute(orderId: string, userId: string, reason: string) {
  if (!reason.trim()) throw new ServiceError("Please describe the problem", 422);
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    if (order.paymentStatus !== "paid") throw new ServiceError("Only paid orders can be disputed", 409);
    if (!["PREPARING", "Delivering", "Completed"].includes(order.status)) throw new ServiceError("This order cannot be disputed in its current state", 409);
    const existing = await tx.dispute.findUnique({ where: { orderId } });
    if (existing && existing.status !== "resolved" && existing.status !== "closed") throw new ServiceError("A dispute is already open for this order", 409);
    const dispute = existing
      ? await tx.dispute.update({ where: { orderId }, data: { reason: reason.trim(), status: "open", resolution: null, prevStatus: order.status } })
      : await tx.dispute.create({ data: { orderId, userId, reason: reason.trim(), prevStatus: order.status } });
    await tx.order.update({ where: { id: orderId }, data: { status: "Disputed", escrowState: "disputed", disputedAt: new Date() } });
    await logOrderEvent(tx, orderId, "buyer", "dispute_opened", reason.trim().slice(0, 200));
    await notifyAdmins(tx, "Dispute opened", `A dispute was opened for order ${orderId.slice(0, 8)}: ${reason.trim().slice(0, 120)}`, "alert");
    return dispute;
  });
}

export async function resolveDispute(orderId: string, resolution: "refunded" | "replaced" | "rejected") {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { dispute: true } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.status !== "Disputed" || !order.dispute) throw new ServiceError("No open dispute on this order", 409);

    if (resolution === "refunded") {
      const updated = await refundOrderToWallet(tx, order, `Dispute refund for order ${order.id.slice(0, 8)}`);
      await tx.dispute.update({ where: { orderId }, data: { status: "resolved", resolution: "refunded" } });
      await logOrderEvent(tx, orderId, "admin", "dispute_resolved", "Resolved: refunded to wallet");
      await queueDisputeOutcome(tx, order, "refunded");
      return updated;
    }
    if (resolution === "replaced") {
      // Retire the old credentials and assign fresh stock.
      await releaseAssignedInventory(tx, order.id, "flagged");
      const fresh = await tx.order.update({
        where: { id: orderId },
        data: { credentialUsername: null, credentialPassword: null, credentialNotes: null, twoFactorSecret: null, recoveryEmail: null, status: "PREPARING", escrowState: "in_escrow" },
      });
      const assigned = await autoDeliver(tx, fresh);
      if (assigned < order.quantity) throw new ServiceError("No replacement stock available for this product", 409);
      await tx.dispute.update({ where: { orderId }, data: { status: "resolved", resolution: "replaced" } });
      await logOrderEvent(tx, orderId, "admin", "dispute_resolved", "Resolved: replacement delivered");
      await queueDisputeOutcome(tx, order, "replaced");
      await queueDelivered(tx, order);
      if (order.userId) await notify(tx, order.userId, "Replacement delivered", "Fresh credentials were delivered for your disputed order.", "delivery");
      return tx.order.findUnique({ where: { id: orderId } });
    }
    // rejected → restore the pre-dispute state
    const back = order.dispute.prevStatus || "Delivering";
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: back, escrowState: back === "Completed" ? "completed" : "in_escrow" },
    });
    await tx.dispute.update({ where: { orderId }, data: { status: "resolved", resolution: "rejected" } });
    await logOrderEvent(tx, orderId, "admin", "dispute_resolved", "Resolved: dispute rejected, order restored");
    await queueDisputeOutcome(tx, order, "rejected");
    if (order.userId) await notify(tx, order.userId, "Dispute reviewed", "Your dispute was reviewed and closed. If you still need help, contact support.", "alert");
    return updated;
  });
}

// ─── Escrow lazy release + Stripe ─────────────────────────────────────────

export async function maybeReleaseEscrow<T extends { id: string; status: string; escrowState: string; escrowHoldUntil: Date | null }>(order: T): Promise<T> {
  if (order.escrowState === "in_escrow" && order.status === "Delivering" && order.escrowHoldUntil && order.escrowHoldUntil.getTime() < Date.now()) {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "Completed", escrowState: "completed", fundsReleasedAt: new Date() },
    });
    await prisma.orderEvent
      .create({ data: { orderId: order.id, actor: "system", event: "completed", detail: "Escrow hold lapsed after delivery — auto-completed" } })
      .catch(() => {});
    return updated as unknown as T;
  }
  return order;
}

export async function markStripePaid(sessionId: string) {
  const order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
  if (!order) throw new ServiceError("No order for this Stripe session", 404);
  return prisma.$transaction((tx) => markPaidAndDeliver(tx, order.id, "stripe"));
}
