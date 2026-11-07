// AccountStoreOne — admin wallet adjustment (interim payment rail).
// POST /api/admin/wallet-adjust { userId, direction, amount, reason }
// GET  /api/admin/wallet-adjust?userId=... → { balance }
//
// FULL-ADMIN only (requireAdminStrict): moving customer money sits
// outside the manager (moderator) scope — managers are order-scoped.
//
// Purpose: until card payments are configured, a customer who paid the
// store offline (bank transfer, cash, another channel) is credited
// here so they can check out with their wallet. Honesty rules:
//   - every adjustment is a wallet_transactions ledger row typed
//     "admin_adjustment" whose note states the direction, the admin's
//     reason and the acting admin's identity — it is NEVER labelled a
//     card/payment top-up;
//   - an audit_logs row records actor, target wallet, before/after
//     balances, amount, direction and reason;
//   - amount must be > 0 and a reason is required;
//   - a debit can never drive the wallet negative;
//   - only the wallet's free balance is touched. Money held in escrow
//     lives on orders (escrow_state) and never sits in wallet.balance,
//     so escrow-held funds are structurally unreachable from here.

import { requireAdminStrict, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const gate = await requireAdminStrict(req);
  if (isResponse(gate)) return gate;

  const userId = new URL(req.url).searchParams.get("userId") || "";
  if (!userId) return Response.json({ error: "userId required" }, { status: 422 });
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  return Response.json({ balance: wallet ? String(wallet.balance) : "0" });
}

export async function POST(req: Request) {
  const gate = await requireAdminStrict(req);
  if (isResponse(gate)) return gate;

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "");
  const direction = body.direction === "debit" ? "debit" : body.direction === "credit" ? "credit" : null;
  const reason = String(body.reason || "").trim();
  const amountNum = Number(body.amount);

  if (!userId) return Response.json({ error: "userId required" }, { status: 422 });
  if (!direction) return Response.json({ error: "direction must be 'credit' or 'debit'" }, { status: 422 });
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return Response.json({ error: "Amount must be greater than zero" }, { status: 422 });
  }
  if (reason.length < 3) return Response.json({ error: "A reason is required for every wallet adjustment" }, { status: 422 });
  if (reason.length > 300) return Response.json({ error: "Reason is too long (max 300 characters)" }, { status: 422 });

  const target = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!target) return Response.json({ error: "Customer not found" }, { status: 404 });

  const amount = new Prisma.Decimal(amountNum.toFixed(2));
  const actorEmail = gate.profile.email || gate.user.email || "admin";

  try {
    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId, balance: 0 } });

      const before = new Prisma.Decimal(wallet.balance);
      if (direction === "debit" && before.lt(amount)) {
        throw Object.assign(
          new Error(`Debit exceeds the available balance ($${before.toFixed(2)})`),
          { status: 422 }
        );
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: direction === "credit" ? { increment: amount } : { decrement: amount } },
      });

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: direction === "credit" ? amount : amount.negated(),
          type: "admin_adjustment",
          status: "completed",
          note: `Admin ${direction} — ${reason} (by ${actorEmail})`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: gate.user.id,
          action: `wallet_${direction}`,
          targetTable: "wallets",
          targetId: wallet.id,
          oldData: { balance: before.toFixed(2), customer_id: userId, customer_email: target.email },
          newData: {
            balance: new Prisma.Decimal(updated.balance).toFixed(2),
            amount: amount.toFixed(2),
            direction,
            reason,
            ledger_transaction_id: ledger.id,
          },
        },
      });

      return { balance: new Prisma.Decimal(updated.balance).toFixed(2), transactionId: ledger.id };
    });
    return Response.json({ ok: true, ...result });
  } catch (e: any) {
    const status = typeof e?.status === "number" ? e.status : 500;
    return Response.json({ error: e?.message || "Adjustment failed" }, { status });
  }
}
