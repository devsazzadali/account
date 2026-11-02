// AccountStoreOne — customer suspension control (Fix Round 7, item 7).
// POST /api/admin/risk { user_id, blocked } → toggles
// user_risk_profiles.is_blocked for one customer. Staff-gated
// (admin + moderator — suspension is a front-line support action);
// admin accounts themselves can never be suspended through here.
// Enforcement of the flag lives in order-service (order creation),
// the generic DB API (writes), and /api/me (dashboard notice).

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;

  const body = await req.json().catch(() => ({}));
  const userId = String(body.user_id || body.userId || "");
  const blocked = body.blocked === true;
  if (!userId) return Response.json({ error: "user_id required" }, { status: 422 });

  const target = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return Response.json({ error: "User not found" }, { status: 404 });
  if (target.role === "admin") {
    return Response.json({ error: "Admin accounts cannot be suspended" }, { status: 403 });
  }

  const row = await prisma.userRiskProfile.upsert({
    where: { userId },
    update: { isBlocked: blocked },
    create: { userId, isBlocked: blocked },
  });
  return Response.json({ user_id: userId, is_blocked: row.isBlocked });
}
