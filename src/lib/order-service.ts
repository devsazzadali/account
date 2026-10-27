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
import { prisma, withTx } from "./db";
import {
  queueOrderReceived,
  queueAdminNewOrder,
  queuePaymentConfirmed,
  queueProcessingStarted,
  queueDelivered,
  queueOrderCompleted,
  queueCompletedOnRead,
  queueOrderCancelled,
  queueRefundIssued,
  queueDisputeOpened,
  queueAdminDisputeAlert,
  queueDisputeOutcome,
  queueAdminLowStock,
} from "./mailer";
import { LOW_STOCK_THRESHOLD } from "./email-templates";
import { orderCode } from "./order-ref";

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
  const product = await tx.product.findUnique({ where: { id: productId }, select: { useInventoryStock: true, fulfilmentType: true } });
  // SERVICE products always use the plain stock counter (no inventory).
  if (!product?.useInventoryStock || product.fulfilmentType === "service") return;
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

// ─── Low-stock admin alert (email) ───────────────────────────────────
// Fires ONCE per crossing: when a product's available inventory drops
// from above LOW_STOCK_THRESHOLD to at/below it, the admins get one
// warning email (see mailer.queueAdminLowStock). Restocking above the
// threshold re-arms the warning. Inventory-derived products only —
// SERVICE products hold no inventory by design.
async function maybeQueueLowStock(tx: Tx, productId: string | null | undefined, availableBefore: number, availableAfter: number) {
  if (!productId) return;
  if (!(availableBefore > LOW_STOCK_THRESHOLD && availableAfter <= LOW_STOCK_THRESHOLD)) return;
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { id: true, title: true, fulfilmentType: true, useInventoryStock: true },
  });
  if (product && product.useInventoryStock && product.fulfilmentType !== "service") {
    await queueAdminLowStock(tx, product, availableAfter);
  }
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

// ─── Service intake (fulfilment types) ─────────────────────────────────
// SERVICE products collect buyer details at checkout, BEFORE payment
// (Z2U's rule: the buyer bears the risk of the details they enter). The
// fields come from the category's intake_schema; required answers are
// validated here, server-side — the client form is only a convenience.
export interface IntakeField {
  key: string;
  label: string;
  type: string; // text | number | select | boolean | textarea
  required: boolean;
  options?: string[];
}

export function parseIntakeSchema(raw: unknown): IntakeField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({
      key: String(f.key || "").trim(),
      label: String(f.label || f.key || "").trim(),
      type: ["text", "number", "select", "boolean", "textarea"].includes(String(f.type)) ? String(f.type) : "text",
      required: f.required === true,
      options: Array.isArray(f.options) ? f.options.map((o) => String(o)) : undefined,
    }))
    .filter((f) => f.key.length > 0);
}

async function intakeSchemaForCategory(tx: Tx, categoryName: string | null): Promise<IntakeField[]> {
  if (!categoryName) return [];
  const cat = await tx.category.findFirst({ where: { name: categoryName }, select: { intakeSchema: true } });
  return parseIntakeSchema(cat?.intakeSchema);
}

/** Validate + normalise the buyer's intake answers against the schema.
 *  Returns only known keys with non-empty values. Throws 422 listing
 *  every missing required field by its buyer-facing label. */
function validateIntake(schema: IntakeField[], raw: unknown): Record<string, string> {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of schema) {
    const v = input[field.key];
    const value = v === null || v === undefined ? "" : String(v).trim();
    if (!value) {
      if (field.required) missing.push(field.label);
      continue;
    }
    if (field.type === "number" && Number.isNaN(Number(value))) {
      throw new ServiceError(`"${field.label}" must be a number`, 422);
    }
    if (field.type === "select" && field.options && field.options.length > 0 && !field.options.includes(value)) {
      throw new ServiceError(`"${field.label}" must be one of: ${field.options.join(", ")}`, 422);
    }
    out[field.key] = value;
  }
  if (missing.length > 0) {
    throw new ServiceError(`Please provide the required service details: ${missing.join(", ")}`, 422);
  }
  return out;
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

/** Assign up to `maxUnits` available inventory units to the order and
 *  attach their credentials. The first unit ever delivered fills the
 *  order's credential fields; later units append "Account N:" lines to
 *  the credential notes (the original auto-delivery format). Sets
 *  deliveredQuantity per batch; the FIRST delivery flips the order to
 *  "Delivering" and starts deliveredAt — so a partially delivered order
 *  enters the same 48h-confirm window as a full one, and the buyer can
 *  confirm the delivered part / cancel the remainder. sold increments
 *  per batch (delivered part stays sold even if the rest is cancelled).
 *  SERVICE products never touch inventory. Returns units assigned in
 *  THIS call. */
async function assignInventoryUnits(
  tx: Tx,
  order: { id: string; productId: string | null; quantity: number; deliveredQuantity: number; credentialUsername: string | null },
  maxUnits: number,
) {
  if (!order.productId) return 0;
  const product = await tx.product.findUnique({
    where: { id: order.productId },
    select: { fulfilmentType: true },
  });
  if (!product || product.fulfilmentType === "service") return 0;

  const remaining = order.quantity - order.deliveredQuantity;
  const want = Math.min(maxUnits, remaining);
  if (want <= 0) return 0;

  const availableBefore = await tx.inventory.count({ where: { productId: order.productId, status: "available" } });
  const items = await tx.inventory.findMany({
    where: { productId: order.productId, status: "available" },
    orderBy: { createdAt: "asc" },
    take: want,
  });
  if (items.length === 0) return 0;

  for (const item of items) {
    await tx.inventory.update({
      where: { id: item.id },
      data: { status: "assigned", orderId: order.id, assignedAt: new Date() },
    });
  }

  const hasCredentials = !!order.credentialUsername;
  const first = hasCredentials ? null : items[0];
  const restItems = hasCredentials ? items : items.slice(1);
  const notesParts: string[] = [];
  if (first) {
    if (first.additionalInfo) notesParts.push(first.additionalInfo);
    if (first.twoFactorSecret) notesParts.push(`2FA secret: ${first.twoFactorSecret}`);
    if (first.recoveryEmail) notesParts.push(`Recovery email: ${first.recoveryEmail}`);
  }
  restItems.forEach((item, i) => {
    const n = order.deliveredQuantity + (hasCredentials ? 0 : 1) + i + 1;
    notesParts.push(
      `Account ${n}: ${item.accountLogin} / ${item.accountPassword}` +
        (item.twoFactorSecret ? ` (2FA: ${item.twoFactorSecret})` : "") +
        (item.recoveryEmail ? ` (recovery: ${item.recoveryEmail})` : "") +
        (item.additionalInfo ? ` — ${item.additionalInfo}` : ""),
    );
  });

  const current = await tx.order.findUnique({
    where: { id: order.id },
    select: { credentialNotes: true },
  });
  const allNotes = [current?.credentialNotes, ...notesParts].filter(Boolean).join("\n");
  const newDelivered = order.deliveredQuantity + items.length;
  const fullyDelivered = newDelivered >= order.quantity;

  await tx.order.update({
    where: { id: order.id },
    data: {
      ...(first
        ? {
            credentialUsername: first.accountLogin,
            credentialPassword: first.accountPassword,
            // Dedicated 2FA vault fields (the notes text above stays as a fallback record).
            twoFactorSecret: first.twoFactorSecret || null,
            recoveryEmail: first.recoveryEmail || null,
          }
        : {}),
      credentialNotes: allNotes || null,
      deliveredQuantity: newDelivered,
      ...(order.deliveredQuantity === 0 ? { status: "Delivering", deliveredAt: new Date() } : {}),
    },
  });
  await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: items.length } } });
  await logOrderEvent(
    tx,
    order.id,
    "system",
    "delivered",
    fullyDelivered
      ? `Delivered all ${order.quantity} unit(s) from inventory`
      : `Partial delivery: ${newDelivered} of ${order.quantity} unit(s) delivered from inventory`,
  );
  await syncDerivedStock(tx, order.productId);
  await maybeQueueLowStock(tx, order.productId, availableBefore, availableBefore - items.length);
  return items.length;
}

/** Back-compat wrapper: assign as many units as the order still needs. */
async function autoDeliver(
  tx: Tx,
  order: { id: string; productId: string | null; quantity: number; deliveredQuantity: number; credentialUsername: string | null },
) {
  return assignInventoryUnits(tx, order, order.quantity);
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
  await autoDeliver(tx, updated);
  const after = await tx.order.findUnique({ where: { id: orderId } });
  const deliveredQty = after?.deliveredQuantity ?? 0;
  const fullyDelivered = deliveredQty >= order.quantity;
  const partiallyDelivered = !fullyDelivered && deliveredQty > 0;
  await queuePaymentConfirmed(tx, updated);
  if (fullyDelivered) {
    await queueDelivered(tx, updated);
  } else if (partiallyDelivered) {
    await queueDelivered(tx, updated, { partial: true, deliveredQuantity: deliveredQty });
  } else {
    await queueProcessingStarted(tx, updated);
  }
  if (order.userId) {
    await notify(
      tx,
      order.userId,
      "Payment verified",
      fullyDelivered
        ? "Your payment was verified and your credentials are ready in the vault."
        : partiallyDelivered
          ? `Your payment was verified. ${deliveredQty} of ${order.quantity} unit(s) are ready in the vault; the rest will follow.`
          : "Your payment was verified. Your order is being prepared for delivery.",
      "payment",
    );
  }
  return after;
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
  /** SERVICE products only: the buyer's checkout intake answers. */
  intakeData?: unknown;
}) {
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  return withTx(async (tx) => {
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

    // SERVICE products: the category's intake form is REQUIRED and is
    // collected BEFORE payment (the order is created here, payment
    // follows) — missing required answers reject the order with 422.
    // Stored verbatim (normalised to known keys) on orders.intake_data.
    const isService = product.fulfilmentType === "service";
    let intake: Record<string, string> | null = null;
    if (isService) {
      const schema = await intakeSchemaForCategory(tx, product.category);
      intake = validateIntake(schema, input.intakeData);
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
    if (product.useInventoryStock && !isService) {
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
        intakeData: intake ?? undefined,
        couponCode,
        discountAmount: discount,
        status: "New Order",
        paymentStatus: "unpaid",
        escrowState: "pending_payment",
      },
    });
    if (product.useInventoryStock && !isService) await syncDerivedStock(tx, product.id);
    await logOrderEvent(tx, order.id, "buyer", "created", `Order placed × ${qty}${variant ? ` · ${variant.label}` : ""}${couponCode ? ` · coupon ${couponCode}` : ""}${isService ? " · service intake received" : ""}`);
    await queueOrderReceived(tx, order);
    await queueAdminNewOrder(tx, order);
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
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    if (order.paymentStatus === "paid") throw new ServiceError("Order is already paid", 409);
    if (order.status === "Canceled" || order.status === "Refunded") throw new ServiceError("Order is closed", 409);
    await debitWallet(tx, userId, dec(order.totalPrice), "purchase", { note: `Payment for order ${orderCode(order.id)}`, referenceId: order.id });
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
  return withTx(async (tx) => {
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
      await notifyAdmins(tx, "Payment awaiting verification", `${order.username || "A buyer"} submitted a ${method} payment (TrxID ${trxId}) for order ${orderCode(order.id)}.`, "payment");
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
  return withTx(async (tx) => {
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
async function refundOrderToWallet(
  tx: Tx,
  order: NonNullable<Awaited<ReturnType<typeof prisma.order.findUnique>>>,
  reason: string,
  // "cancel" → cancelled-&-refunded mail; "refund" → refund mail;
  // "none" → the dispute-outcome mail already covers the refund.
  emailMode: "cancel" | "refund" | "none" = "refund",
) {
  const wasDelivered =
    order.status === "Delivering" || order.status === "Completed" || order.deliveredQuantity > 0 || !!order.deliveredAt;
  if (order.userId) {
    await creditWallet(tx, order.userId, dec(order.totalPrice), "refund", { note: reason, referenceId: order.id });
  }
  // Credentials already exposed → stock units are consumed, never resold.
  await releaseAssignedInventory(tx, order.id, wasDelivered ? "used" : "available");
  if (order.productId) {
    const product = await tx.product.findUnique({ where: { id: order.productId } });
    if (product && (!product.useInventoryStock || product.fulfilmentType === "service")) {
      // Manual-counter stock: only the UNDELIVERED remainder was never
      // sold — that part of the reservation goes back (0 when the order
      // was fully delivered, the full quantity when nothing was).
      const restore = order.quantity - order.deliveredQuantity;
      if (restore > 0) {
        await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: restore } } });
        await adjustVariantStock(tx, product, order.variantLabel, restore);
      }
    }
  }
  await releaseCoupon(tx, order);
  const updated = await tx.order.update({
    where: { id: order.id },
    data: { status: "Refunded", paymentStatus: "refunded", escrowState: "refunded" },
  });
  await syncDerivedStock(tx, order.productId);
  await logOrderEvent(tx, order.id, "system", "refunded", reason);
  if (emailMode === "cancel") await queueRefundIssued(tx, updated, { cancelled: true });
  else if (emailMode === "refund") await queueRefundIssued(tx, updated);
  if (order.userId) await notify(tx, order.userId, "Refund issued", `$${dec(order.totalPrice).toFixed(2)} was refunded to your wallet.`, "payment");
  return updated;
}

export async function cancelOrder(orderId: string, actor: { userId: string; isAdmin: boolean }) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (!actor.isAdmin && order.userId !== actor.userId) throw new ServiceError("Not your order", 403);
    if (["Canceled", "Refunded", "Completed"].includes(order.status)) throw new ServiceError(`Order is already ${order.status.toLowerCase()}`, 409);

    if (order.paymentStatus === "paid") {
      // Paid orders are refunded to the wallet, never silently cancelled.
      return refundOrderToWallet(tx, order, `Refund for cancelled order ${orderCode(order.id)}`, "cancel");
    }
    // Unpaid / pending: reject any pending payment + restore reserved stock.
    await tx.paymentRequest.updateMany({ where: { orderId: order.id, status: "pending" }, data: { status: "rejected", adminNote: "Order cancelled", reviewedAt: new Date() } });
    if (order.productId) {
      const product = await tx.product.findUnique({ where: { id: order.productId } });
      if (product && (!product.useInventoryStock || product.fulfilmentType === "service")) {
        await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
        await adjustVariantStock(tx, product, order.variantLabel, order.quantity);
      }
    }
    await releaseCoupon(tx, order);
    const updated = await tx.order.update({ where: { id: order.id }, data: { status: "Canceled" } });
    await syncDerivedStock(tx, order.productId);
    await logOrderEvent(tx, order.id, actor.isAdmin ? "admin" : "buyer", "canceled", "Unpaid order canceled; reserved stock restored");
    await queueOrderCancelled(tx, updated);
    return updated;
  });
}

export async function deliverManually(orderId: string, creds: { username: string; password: string; notes?: string; twoFactorSecret?: string; recoveryEmail?: string }) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet — verify payment before delivering", 409);
    if (!creds.username.trim() || !creds.password.trim()) throw new ServiceError("Username and password are required", 422);
    const productType = order.productId
      ? (await tx.product.findUnique({ where: { id: order.productId }, select: { fulfilmentType: true } }))?.fulfilmentType
      : null;
    if (productType === "service") {
      throw new ServiceError("This is a service order — complete it with a completion proof instead of credentials", 409);
    }
    const newlyDelivered = order.quantity - order.deliveredQuantity;
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        credentialUsername: creds.username.trim(),
        credentialPassword: creds.password.trim(),
        credentialNotes: creds.notes?.trim() || null,
        twoFactorSecret: creds.twoFactorSecret?.trim() || null,
        recoveryEmail: creds.recoveryEmail?.trim() || null,
        status: "Delivering",
        deliveredAt: order.deliveredAt ?? new Date(),
        deliveredQuantity: order.quantity,
      },
    });
    if (order.productId) {
      await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: Math.max(0, newlyDelivered) } } });
      // Inventory-derived products: a manual delivery consumes real units
      // so the derived stock can never oversell what was handed over.
      // Only the not-yet-delivered remainder consumes spares (units the
      // auto-delivery already assigned are not double-counted).
      const product = await tx.product.findUnique({ where: { id: order.productId }, select: { useInventoryStock: true } });
      if (product?.useInventoryStock) {
        const availableBefore = await tx.inventory.count({ where: { productId: order.productId, status: "available" } });
        const spare = await tx.inventory.findMany({
          where: { productId: order.productId, status: "available" },
          orderBy: { createdAt: "asc" },
          take: Math.max(0, newlyDelivered),
        });
        for (const item of spare) {
          await tx.inventory.update({ where: { id: item.id }, data: { status: "used", orderId: order.id, assignedAt: new Date() } });
        }
        await syncDerivedStock(tx, order.productId);
        await maybeQueueLowStock(tx, order.productId, availableBefore, availableBefore - spare.length);
      }
    }
    await logOrderEvent(tx, orderId, "admin", "delivered", "Credentials delivered manually by the store");
    await queueDelivered(tx, updated);
    if (order.userId) await notify(tx, order.userId, "Order delivered", "Your credentials are ready in the order vault.", "delivery");
    return updated;
  });
}

// ─── Fulfilment types: progress, proofs, service + partial delivery ────
// Every transition below writes an order_events row in the same
// transaction (the buyer order page renders its timeline from them).

/** Admin posts a work-in-progress note on a paid order. The note lands
 *  in the order timeline (event "progress") and as a buyer notification —
 *  this is how SERVICE orders report their state (Z2U-style). */
export async function addOrderProgress(orderId: string, note: string) {
  const text = (note || "").trim();
  if (!text) throw new ServiceError("A progress note is required", 422);
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet", 409);
    if (["Completed", "Canceled", "Refunded", "Disputed"].includes(order.status)) {
      throw new ServiceError(`Cannot post progress on a ${order.status.toLowerCase()} order`, 409);
    }
    await logOrderEvent(tx, orderId, "admin", "progress", text);
    if (order.userId) await notify(tx, order.userId, "Order update", text, "order");
    return tx.order.findUnique({ where: { id: orderId } });
  });
}

/** Attach a delivery proof (uploaded file URL and/or a written note) to
 *  an order. kind "completion" proofs are what unlock service delivery. */
export async function addDeliveryProof(
  orderId: string,
  input: { fileUrl?: string; note?: string; kind?: string; createdBy?: string },
) {
  const fileUrl = (input.fileUrl || "").trim() || null;
  const note = (input.note || "").trim() || null;
  if (!fileUrl && !note) throw new ServiceError("Attach a proof file or write a proof note", 422);
  const kind = input.kind === "progress" ? "progress" : "completion";
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (["Canceled", "Refunded", "Completed"].includes(order.status)) {
      throw new ServiceError(`Cannot add proof to a ${order.status.toLowerCase()} order`, 409);
    }
    const proof = await tx.deliveryProof.create({
      data: { orderId, fileUrl, note, kind, createdBy: input.createdBy || null },
    });
    await logOrderEvent(
      tx,
      orderId,
      "admin",
      "proof_added",
      `${kind === "completion" ? "Completion" : "Progress"} proof attached${note ? `: ${note}` : ""}`,
    );
    return proof;
  });
}

/** Complete a SERVICE order. Requires at least one completion proof on
 *  file (a file or a written completion note — either may be supplied
 *  with this call as `note`). On success the order enters "Delivering"
 *  exactly like credential delivery: buyer confirms, or the existing
 *  48h escrow rule completes it. */
export async function deliverServiceOrder(orderId: string, input: { note?: string; createdBy?: string } = {}) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet — verify payment before delivering", 409);
    const product = order.productId
      ? await tx.product.findUnique({ where: { id: order.productId }, select: { fulfilmentType: true } })
      : null;
    if (product?.fulfilmentType !== "service") {
      throw new ServiceError("This order is not for a service product", 409);
    }
    if (order.status === "Delivering" && order.deliveredQuantity >= order.quantity) {
      throw new ServiceError("This service order is already delivered", 409);
    }
    if (!["PREPARING", "Delivering", "New Order"].includes(order.status)) {
      throw new ServiceError(`Cannot deliver an order in status ${order.status}`, 409);
    }
    const note = (input.note || "").trim();
    const existingProofs = await tx.deliveryProof.count({ where: { orderId, kind: "completion" } });
    if (existingProofs === 0 && !note) {
      throw new ServiceError("A completion proof is required before a service can be marked delivered — attach a proof file or a written completion note", 422);
    }
    if (note) {
      await tx.deliveryProof.create({
        data: { orderId, note, kind: "completion", createdBy: input.createdBy || null },
      });
    }
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "Delivering", deliveredAt: order.deliveredAt ?? new Date(), deliveredQuantity: order.quantity },
    });
    await tx.product.update({ where: { id: order.productId as string }, data: { sold: { increment: order.quantity - order.deliveredQuantity } } });
    await logOrderEvent(tx, orderId, "admin", "delivered", "Service completed — completion proof on file, awaiting buyer confirmation");
    await queueDelivered(tx, updated);
    if (order.userId) await notify(tx, order.userId, "Service delivered", "Your service is complete. Please review the proof on your order page and confirm receipt.", "delivery");
    return updated;
  });
}

/** Admin delivers MORE inventory units to a partially delivered order
 *  (e.g. stock arrived after the first batch). */
export async function deliverMoreUnits(orderId: string, units: number) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet", 409);
    if (!["PREPARING", "Delivering"].includes(order.status)) {
      throw new ServiceError(`Cannot deliver more units to a ${order.status.toLowerCase()} order`, 409);
    }
    if (order.deliveredQuantity >= order.quantity) throw new ServiceError("This order is already fully delivered", 409);
    const want = Math.max(1, Math.floor(units || 1));
    const assigned = await assignInventoryUnits(tx, order, want);
    if (assigned === 0) throw new ServiceError("No inventory available for this product right now", 409);
    const fresh = await tx.order.findUnique({ where: { id: orderId } });
    const full = (fresh?.deliveredQuantity ?? 0) >= order.quantity;
    if (full && fresh) await queueDelivered(tx, fresh);
    else if (fresh) await queueDelivered(tx, fresh, { partial: true, deliveredQuantity: fresh.deliveredQuantity });
    if (order.userId) {
      await notify(
        tx,
        order.userId,
        "More units delivered",
        full
          ? "All units of your order are now delivered — see your order vault."
          : `${fresh?.deliveredQuantity} of ${order.quantity} unit(s) are now delivered.`,
        "delivery",
      );
    }
    return fresh;
  });
}

/** Buyer confirms the DELIVERED PART of a partially delivered order.
 *  The order stays open (escrow still held) until the remainder is
 *  delivered or cancelled — confirmation is recorded as an event so it
 *  can happen exactly once. */
export async function confirmPartialReceipt(orderId: string, userId: string) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet", 409);
    if (order.deliveredQuantity <= 0) throw new ServiceError("Nothing has been delivered on this order yet", 409);
    if (order.deliveredQuantity >= order.quantity) {
      throw new ServiceError("This order is fully delivered — use Confirm Receipt to complete it", 409);
    }
    if (!["PREPARING", "Delivering"].includes(order.status)) {
      throw new ServiceError(`Cannot confirm a partial delivery on a ${order.status.toLowerCase()} order`, 409);
    }
    const already = await tx.orderEvent.findFirst({ where: { orderId, event: "partial_confirmed" } });
    if (already) throw new ServiceError("You already confirmed the delivered part of this order", 409);
    await logOrderEvent(tx, orderId, "buyer", "partial_confirmed", `Buyer confirmed receipt of ${order.deliveredQuantity} of ${order.quantity} unit(s)`);
    await notifyAdmins(tx, "Partial delivery confirmed", `Buyer confirmed ${order.deliveredQuantity} of ${order.quantity} unit(s) on order ${orderCode(order.id)}.`, "order");
    return tx.order.findUnique({ where: { id: orderId } });
  });
}

/** Cancel the UNDELIVERED remainder of a partially delivered order and
 *  refund it pro-rata to the buyer's wallet. The delivered part stays
 *  sold; the order completes (escrow released on the delivered part).
 *  Refund = (total − $0.50 service fee) × remaining ÷ quantity — the fee
 *  was earned by processing the order; coupons are NOT released (the
 *  delivered part consumed the redemption). */
export async function cancelRemainder(orderId: string, actor: { userId: string; isAdmin: boolean }) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (!actor.isAdmin && order.userId !== actor.userId) throw new ServiceError("Not your order", 403);
    if (order.paymentStatus !== "paid") throw new ServiceError("Order is not paid yet — cancel the order instead", 409);
    if (!["PREPARING", "Delivering"].includes(order.status)) {
      throw new ServiceError(`Cannot cancel a remainder on a ${order.status.toLowerCase()} order`, 409);
    }
    if (order.deliveredQuantity <= 0) throw new ServiceError("Nothing has been delivered yet — cancel or refund the whole order instead", 409);
    if (order.deliveredQuantity >= order.quantity) throw new ServiceError("This order is fully delivered — nothing left to cancel", 409);

    const remaining = order.quantity - order.deliveredQuantity;
    const refund = dec(order.totalPrice).sub(SERVICE_FEE).mul(remaining).div(order.quantity).toDecimalPlaces(2);
    if (refund.gt(0) && order.userId) {
      await creditWallet(tx, order.userId, refund, "refund", {
        note: `Partial refund — ${remaining} undelivered unit(s) of order ${orderCode(order.id)} cancelled`,
        referenceId: order.id,
      });
    }
    if (order.productId) {
      const product = await tx.product.findUnique({ where: { id: order.productId } });
      if (product && (!product.useInventoryStock || product.fulfilmentType === "service")) {
        // Manual-counter products reserved the full quantity at order
        // time: the undelivered remainder goes back on the shelf.
        await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: remaining } } });
        await adjustVariantStock(tx, product, order.variantLabel, remaining);
      }
      await syncDerivedStock(tx, order.productId);
    }
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "Completed", escrowState: "completed", fundsReleasedAt: new Date() },
    });
    await logOrderEvent(
      tx,
      orderId,
      actor.isAdmin ? "admin" : "buyer",
      "partial_canceled",
      `Remainder cancelled: ${remaining} undelivered unit(s) refunded $${refund.toFixed(2)} to wallet; ${order.deliveredQuantity} delivered unit(s) stay sold`,
    );
    if (refund.gt(0)) await queueRefundIssued(tx, updated, { amount: Number(refund), partial: true });
    if (order.userId) {
      await notify(
        tx,
        order.userId,
        "Remainder cancelled",
        `The remaining ${remaining} unit(s) of your order were cancelled and $${refund.toFixed(2)} was refunded to your wallet. The delivered part is yours to keep.`,
        "payment",
      );
    }
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
  await queueOrderCompleted(tx, updated);
  return updated;
}

export async function confirmReceipt(orderId: string, userId: string) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.userId !== userId) throw new ServiceError("Not your order", 403);
    return completeOrder(tx, orderId);
  });
}

export async function adminCompleteOrder(orderId: string) {
  return withTx((tx) => completeOrder(tx, orderId));
}

export async function adminRefundOrder(orderId: string) {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.paymentStatus !== "paid") throw new ServiceError("Only a paid order can be refunded", 409);
    return refundOrderToWallet(tx, order, `Admin refund for order ${orderCode(order.id)}`);
  });
}

// ─── Disputes ──────────────────────────────────────────────────────────────

export async function openDispute(orderId: string, userId: string, reason: string) {
  if (!reason.trim()) throw new ServiceError("Please describe the problem", 422);
  return withTx(async (tx) => {
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
    await notifyAdmins(tx, "Dispute opened", `A dispute was opened for order ${orderCode(orderId)}: ${reason.trim().slice(0, 120)}`, "alert");
    await queueDisputeOpened(tx, order, reason.trim());
    await queueAdminDisputeAlert(tx, order, reason.trim());
    return dispute;
  });
}

export async function resolveDispute(orderId: string, resolution: "refunded" | "replaced" | "rejected") {
  return withTx(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { dispute: true } });
    if (!order) throw new ServiceError("Order not found", 404);
    if (order.status !== "Disputed" || !order.dispute) throw new ServiceError("No open dispute on this order", 409);

    if (resolution === "refunded") {
      const updated = await refundOrderToWallet(tx, order, `Dispute refund for order ${orderCode(order.id)}`, "none");
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
        data: { credentialUsername: null, credentialPassword: null, credentialNotes: null, twoFactorSecret: null, recoveryEmail: null, deliveredQuantity: 0, status: "PREPARING", escrowState: "in_escrow" },
      });
      const productType = order.productId
        ? (await tx.product.findUnique({ where: { id: order.productId }, select: { fulfilmentType: true } }))?.fulfilmentType
        : null;
      if (productType === "service") {
        // A service has nothing to re-assign: it goes back to PREPARING
        // and the store performs the work again (progress + proof).
        await tx.dispute.update({ where: { orderId }, data: { status: "resolved", resolution: "replaced" } });
        await logOrderEvent(tx, orderId, "admin", "dispute_resolved", "Resolved: service will be performed again");
        await queueDisputeOutcome(tx, order, "replaced");
        if (order.userId) await notify(tx, order.userId, "Service will be redone", "Your dispute was accepted — the service will be performed again. Watch the order page for progress.", "delivery");
        return tx.order.findUnique({ where: { id: orderId } });
      }
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
    await queueCompletedOnRead(updated);
    return updated as unknown as T;
  }
  return order;
}

export async function markStripePaid(sessionId: string) {
  const order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
  if (!order) throw new ServiceError("No order for this Stripe session", 404);
  return withTx((tx) => markPaidAndDeliver(tx, order.id, "stripe"));
}
