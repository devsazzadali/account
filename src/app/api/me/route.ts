// AccountStoreOne — current session endpoint.
// GET  /api/me → { user, profile } (profile row is created on first sight)
// PATCH /api/me → update own profile (username / full_name / avatar_url).
//                Role changes are admin-only and never accepted here.

import { getSessionContext, unauthorized, isUserBlocked } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow } from "@/src/lib/serialize";

export async function GET(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  // Fix Round 7 (customer suspend): the buyer dashboard reads this
  // flag and replaces itself with a suspension notice; enforcement
  // proper lives server-side (orders + API writes reject regardless).
  const suspended =
    ctx.profile.role === "user" ? await isUserBlocked(ctx.user.id) : false;
  return Response.json({
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      email_confirmed_at: ctx.user.emailVerified ? new Date().toISOString() : null,
    },
    profile: {
      ...serializeRow(ctx.profile as unknown as Record<string, unknown>),
      suspended,
    },
  });
}

export async function PATCH(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.username === "string" && body.username.trim()) {
    const wanted = body.username.trim();
    const clash = await prisma.profile.findUnique({ where: { username: wanted } });
    if (clash && clash.id !== ctx.user.id) {
      return Response.json({ error: "That username is taken" }, { status: 409 });
    }
    data.username = wanted;
  }
  if (typeof body.full_name === "string") data.fullName = body.full_name;
  if (typeof body.fullName === "string") data.fullName = body.fullName;
  if (typeof body.avatar_url === "string") data.avatarUrl = body.avatar_url;
  if (typeof body.avatarUrl === "string") data.avatarUrl = body.avatarUrl;
  const updated = await prisma.profile.update({ where: { id: ctx.user.id }, data });
  return Response.json({ profile: serializeRow(updated as unknown as Record<string, unknown>) });
}
