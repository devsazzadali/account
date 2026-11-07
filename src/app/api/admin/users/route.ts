// AccountStoreOne — staff account creation (full-admin only).
// POST /api/admin/users { name, email, password } → creates a MANAGER
// account: a real Neon Auth user (the auth service hashes the password —
// this route never sees or stores a plaintext credential beyond handing
// it to the auth sign-up call) plus an app profile with role
// "moderator", the order-management-only staff role.
//
// Deactivation / reactivation of a manager uses the existing suspension
// toggle (POST /api/admin/risk): a suspended manager loses staff access
// at every gate (see requireAdmin / isDeactivatedManager). Password
// resets for managers go through the standard forgot-password email
// flow — there is deliberately no admin-side password overwrite here.

import { requireAdminStrict, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

const AUTH_BASE = process.env.NEON_AUTH_BASE_URL;

export async function POST(req: Request) {
  const gate = await requireAdminStrict(req);
  if (isResponse(gate)) return gate;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name) return Response.json({ error: "Manager name is required" }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email address is required" }, { status: 422 });
  }
  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters" }, { status: 422 });
  }

  const existingProfile = await prisma.profile.findFirst({ where: { email } });
  if (existingProfile) {
    return Response.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Find-or-create the Neon Auth user. The auth schema lives outside the
  // Prisma datamodel, so the lookup is a raw read; creation goes through
  // the auth service's own sign-up endpoint (server-to-server, the same
  // mechanism the browser sign-up uses) so the credential is hashed and
  // stored by the auth layer.
  let authUserId: string | null = null;
  const found = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM neon_auth."user" WHERE lower(email) = ${email} LIMIT 1
  `.catch(() => [] as { id: string }[]);
  if (found.length > 0) {
    authUserId = found[0].id;
  } else {
    if (!AUTH_BASE) return Response.json({ error: "Auth is not configured" }, { status: 500 });
    // The auth service requires an Origin header on sign-up (same
    // treatment the /api/auth proxy gives browser calls: the app's own
    // origin, which the auth project's trusted-origin rules accept).
    const res = await fetch(`${AUTH_BASE}/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: new URL(req.url).origin },
      body: JSON.stringify({ email, password, name }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.user?.id) {
      const message =
        (typeof json?.message === "string" && json.message) ||
        (typeof json?.error?.message === "string" && json.error.message) ||
        "Could not create the auth account";
      return Response.json({ error: message }, { status: 400 });
    }
    authUserId = String(json.user.id);
  }

  // App profile with the manager role (mirrors ensureProfile's username
  // derivation so staff accounts look like every other account).
  let username = (email.split("@")[0] || "manager").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 24) || "manager";
  const clash = await prisma.profile.findUnique({ where: { username } });
  if (clash) username = `${username}-${authUserId.slice(0, 4)}`;

  const profile = await prisma.profile.create({
    data: {
      id: authUserId,
      email,
      username,
      fullName: name,
      role: "moderator",
    },
  });
  await prisma.wallet.upsert({
    where: { userId: authUserId },
    update: {},
    create: { userId: authUserId, balance: 0 },
  });

  return Response.json(
    {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.fullName,
        username: profile.username,
        role: profile.role,
      },
    },
    { status: 201 },
  );
}
