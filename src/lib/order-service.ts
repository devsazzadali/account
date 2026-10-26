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

export const SERVICE_FEE = 0.5;
export const ESCROW_HOLD_MS = 48 * 60 * 60 * 1000;

type Tx = Prisma.TransactionClient;

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
      ...(fullyAssigned ? { status: "Delivering" } : {}),
    },
  });
  if (fullyAssigned) {
    await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: order.quantity } } });
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
      escrowState: "in_escrow",
      escrowHoldUntil: new Date(Date.now() + ESCROW_HOLD_MS),
      status: order.status === "New Order" ? "PREPARING" : order.status,
    },
  });
  const assigned = await autoDeliver(tx, updated);
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
}) {
  const qty = Math.max(1, Math.floor(input.quantity || 1));
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: input.productId } });
    if (!product) throw new ServiceError("Product not found", 404);
    if (product.stock <= 0) throw new ServiceError("This product is out of stock", 409);
    if (qty > product.stock) throw new ServiceError(`Only ${product.stock} unit(s) left in stock`, 409);

    await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: qty } } });
    const total = dec(product.price).mul(qty).add(SERVICE_FEE);
    const order = await tx.order.create({
      data: {
        productId: product.id,
        userId: input.userId,
        username: input.username,
        customerEmail: input.customerEmail || input.email,
        quantity: qty,
        totalPrice: total,
        status: "New Order",
        paymentStatus: "unpaid",
        escrowState: "pending_payment",
      },
    });
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
    // Nothing was delivered: the stock reserved at order time goes back.
    await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
  }
  const updated = await tx.order.update({
    where: { id: order.id },
    data: { status: "Refunded", paymentStatus: "refunded", escrowState: "refunded" },
  });
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
    if (order.productId) await tx.product.update({ where: { id: order.productId }, data: { stock: { increment: order.quantity } } });
    return tx.order.update({ where: { id: order.id }, data: { status: "Canceled" } });
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
      },
    });
    if (order.productId) await tx.product.update({ where: { id: order.productId }, data: { sold: { increment: order.quantity } } });
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
    return updated as unknown as T;
  }
  return order;
}

export async function markStripePaid(sessionId: string) {
  const order = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
  if (!order) throw new ServiceError("No order for this Stripe session", 404);
  return prisma.$transaction((tx) => markPaidAndDeliver(tx, order.id, "stripe"));
}
