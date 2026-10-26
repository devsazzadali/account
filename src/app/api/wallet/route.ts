// AccountStoreOne — wallet read + top-up submission.
// GET  /api/wallet → { wallet: { balance }, transactions: [...] } for the user.
// POST /api/wallet { method, trx_id, sender_number, amount } → creates a
// pending top-up PaymentRequest; the balance moves only when an admin
// verifies it (see /api/admin/payments).

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow, serializeRows } from "@/src/lib/serialize";
import { submitManualPayment, ServiceError } from "@/src/lib/order-service";

export async function GET(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const wallet = await prisma.wallet.upsert({
    where: { userId: ctx.user.id },
    update: {},
    create: { userId: ctx.user.id, balance: 0 },
  });
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const pendingTopups = await prisma.paymentRequest.findMany({
    where: { userId: ctx.user.id, purpose: "topup", status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  return Response.json({
    wallet: serializeRow(wallet as unknown as Record<string, unknown>),
    transactions: serializeRows(transactions as unknown as Record<string, unknown>[]),
    pending_topups: serializeRows(pendingTopups as unknown as Record<string, unknown>[]),
  });
}

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  try {
    const pr = await submitManualPayment({
      userId: ctx.user.id,
      method: String(body.method || "bkash"),
      trxId: String(body.trx_id || body.trxId || ""),
      senderNumber: body.sender_number || body.senderNumber,
      amount: Number(body.amount || 0),
    });
    return Response.json({ ok: true, payment_request: serializeRow(pr as unknown as Record<string, unknown>) }, { status: 201 });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    return Response.json({ error: err instanceof Error ? err.message : "Top-up failed" }, { status: 500 });
  }
}
