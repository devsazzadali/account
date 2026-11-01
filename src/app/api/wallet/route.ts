// AccountStoreOne — wallet read + top-up submission.
// GET  /api/wallet → { wallet: { balance }, transactions: [...] } for the user.
// POST /api/wallet → CLOSED (R2, owner ruling 2026-11-01): this store is
// international — wallet top-ups are made BY CARD through
// /api/payments/stripe/topup-session. The old manual top-up submission
// (send money to a store number, submit a transaction ID, wait for an
// admin to verify) is refused here with a 410 so no client can still
// create one.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow, serializeRows } from "@/src/lib/serialize";

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

export async function POST() {
  return Response.json(
    { error: "Manual top-ups are closed. Add money to your wallet by card — use the Add Money option on your wallet page." },
    { status: 410 },
  );
}
