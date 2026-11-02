// AccountStoreOne — buyer self-service account deletion (Fix Round 7,
// item 9). POST /api/me/delete with { confirm: "DELETE" }.
//
// Semantics (exactly what happens, mirrored in the report):
//  • Refused while the wallet still holds money (409) or while any
//    order is not in a terminal state (409) — the buyer is told why.
//  • The PROFILE is anonymised in place: username → deleted_<id-prefix>,
//    full name → "Deleted user", email / bio / avatar cleared, premium
//    flag dropped. The row itself is KEPT because orders, wallet and
//    message rows reference it — deleting it would break the store's
//    records (and cascade-delete history the store must retain).
//  • Order rows are NOT touched: they carry their own order-time
//    snapshots (username / customer_email columns) which are the
//    store's sales records.
//  • The account is permanently blocked via
//    user_risk_profiles.is_blocked, and the personal notification feed
//    is wiped. If the same person signs in again through Neon Auth,
//    ensureProfile re-syncs only the email field from the auth record
//    (the auth account itself lives on the hosted Neon side and can
//    only be removed there); the anonymised username/name stay, and
//    the block keeps the account unusable.
//  • Admin accounts cannot self-delete here.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

const TERMINAL = ["completed", "canceled", "cancelled", "refunded", "delivered"];

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  if (ctx.profile.role === "admin") {
    return Response.json({ error: "Admin accounts cannot be deleted from here." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "DELETE") {
    return Response.json({ error: "Type DELETE to confirm account deletion." }, { status: 422 });
  }

  const userId = ctx.user.id;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (wallet && Number(wallet.balance) > 0) {
    return Response.json(
      { error: `Your wallet still holds $${Number(wallet.balance).toFixed(2)}. Please use the balance or contact support before deleting your account.` },
      { status: 409 },
    );
  }

  const orders = await prisma.order.findMany({ where: { userId }, select: { status: true } });
  const openOrders = orders.filter((o) => !TERMINAL.includes((o.status || "").toLowerCase())).length;
  if (openOrders > 0) {
    return Response.json(
      { error: `You still have ${openOrders} order(s) in progress. Account deletion is available once every order is completed, delivered or cancelled.` },
      { status: 409 },
    );
  }

  const tombstone = `deleted_${userId.slice(0, 8)}`;
  await prisma.profile.update({
    where: { id: userId },
    data: {
      username: tombstone,
      fullName: "Deleted user",
      email: null,
      bio: null,
      avatarUrl: null,
      isPremium: false,
    },
  });
  await prisma.userRiskProfile.upsert({
    where: { userId },
    update: { isBlocked: true },
    create: { userId, isBlocked: true },
  });
  await prisma.notification.deleteMany({ where: { userId } });

  return Response.json({ ok: true, username: tombstone });
}
