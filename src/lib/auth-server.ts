// AccountStoreOne — server-side auth (Neon Auth / Managed Better Auth).
//
// Sessions live in Neon Auth. Server code verifies a session by calling the
// Neon Auth `get-session` endpoint with the incoming request's cookies —
// no JWT parsing, no external auth SDK. Profiles (app-level user rows incl. role)
// live in our own `profiles` table and are created lazily on first sight
// of a Neon Auth user ("profile row created server-side at signup/login").

import { prisma } from "./db";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
}

const AUTH_BASE = process.env.NEON_AUTH_BASE_URL;

export async function fetchAuthUser(cookieHeader: string | null): Promise<AuthUser | null> {
  if (!AUTH_BASE || !cookieHeader) return null;
  try {
    const res = await fetch(`${AUTH_BASE}/get-session`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const u = data?.user;
    if (!u?.id) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      emailVerified: !!u.emailVerified,
      image: u.image ?? null,
    };
  } catch {
    return null;
  }
}

/** Create the app profile (+ empty wallet) for a Neon Auth user if missing. */
export async function ensureProfile(user: AuthUser) {
  const existing = await prisma.profile.findUnique({ where: { id: user.id } });
  if (existing) {
    // Keep the stored email in sync with the auth record.
    if (user.email && existing.email !== user.email) {
      return prisma.profile.update({ where: { id: user.id }, data: { email: user.email } });
    }
    return existing;
  }

  let username = (user.email?.split("@")[0] || "user").replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 24) || "user";
  const clash = await prisma.profile.findUnique({ where: { username } });
  if (clash) username = `${username}-${user.id.slice(0, 4)}`;

  const profile = await prisma.profile.create({
    data: {
      id: user.id,
      email: user.email,
      username,
      fullName: user.name || username,
      avatarUrl: user.image,
      role: "user",
    },
  });
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });
  return profile;
}

export interface SessionContext {
  user: AuthUser;
  profile: Awaited<ReturnType<typeof ensureProfile>>;
}

/** Resolve session + profile from a Request (route handlers). */
export async function getSessionContext(req: Request): Promise<SessionContext | null> {
  const user = await fetchAuthUser(req.headers.get("cookie"));
  if (!user) return null;
  const profile = await ensureProfile(user);
  return { user, profile };
}

export function unauthorized(message = "Authentication required"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Insufficient permissions"): Response {
  return Response.json({ error: message }, { status: 403 });
}

export async function requireUser(req: Request): Promise<SessionContext | Response> {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  return ctx;
}

export async function requireAdmin(req: Request): Promise<SessionContext | Response> {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  if (ctx.profile.role !== "admin" && ctx.profile.role !== "moderator") return forbidden();
  return ctx;
}

export function isResponse(v: SessionContext | Response): v is Response {
  return v instanceof Response;
}
