// AccountStoreOne — server-side auth (Neon Auth / Managed Better Auth).
//
// Sessions live in Neon Auth. Server code verifies a session by calling the
// Neon Auth `get-session` endpoint with the incoming request's cookies —
// no JWT parsing, no external auth SDK. Profiles (app-level user rows incl. role)
// live in our own `profiles` table and are created lazily on first sight
// of a Neon Auth user ("profile row created server-side at signup/login").
//
// Perf (ধাপ ৫): React's per-request `cache()` dedupes the get-session
// round-trip and the profile lookup across every route handler and
// layout segment that resolves the same request's session — the session
// is still verified against Neon Auth once per HTTP request (never
// cached across requests), and ensureProfile's writes still happen on
// every call exactly as before.

import { cache } from "react";
import { prisma } from "./db";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
}

const AUTH_BASE = process.env.NEON_AUTH_BASE_URL;

// Bounded + retried (fix round): the admin gate crashed valid sessions
// into "Access Forbidden" / /login when Neon Auth answered slowly — the
// bare fetch had NO timeout and collapsed every transport error into
// "no session". Each attempt is abort-bounded at 10s; a failed attempt
// is retried twice (1.5s, then 3s backoff) before the session counts as
// absent. A definitive answer from Neon Auth (non-OK status, or a 200
// payload without a user) is NOT retried — the session really is absent
// or expired. Success still verifies against Neon Auth once per request
// semantically (retries only fire on transport failure/timeout), and
// the React cache() dedupe below is unchanged.
const SESSION_ATTEMPT_TIMEOUT_MS = 10000;
const SESSION_RETRY_BACKOFF_MS = [1500, 3000];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAuthUserUncached(cookieHeader: string | null): Promise<AuthUser | null> {
  if (!AUTH_BASE || !cookieHeader) return null;
  for (let attempt = 0; attempt <= SESSION_RETRY_BACKOFF_MS.length; attempt++) {
    if (attempt > 0) await sleep(SESSION_RETRY_BACKOFF_MS[attempt - 1]);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SESSION_ATTEMPT_TIMEOUT_MS);
    try {
      const res = await fetch(`${AUTH_BASE}/get-session`, {
        headers: { cookie: cookieHeader },
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (!res.ok) return null; // Neon Auth answered: no valid session.
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
      // Transport error or our own timeout abort: retry per policy.
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export const fetchAuthUser = cache(fetchAuthUserUncached);

const findProfileById = cache((id: string) => prisma.profile.findUnique({ where: { id } }));

/** Create the app profile (+ empty wallet) for a Neon Auth user if missing. */
export async function ensureProfile(user: AuthUser) {
  const existing = await findProfileById(user.id);
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
  // One-time welcome notification (R3) — this create branch runs exactly
  // once per account, so the welcome can never repeat. Best-effort: it
  // must never break sign-in.
  await prisma.notification
    .create({
      data: {
        userId: user.id,
        title: "Welcome to Account Store One",
        message:
          "Your account is ready. Pay by card or from your wallet, track every order from your dashboard, and message support any time — every payment is held in escrow until you confirm delivery.",
        type: "support",
      },
    })
    .catch(() => {});
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

export async function requireAdmin(req: Request): Promise<SessionContext | Response> {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  if (ctx.profile.role !== "admin" && ctx.profile.role !== "moderator") return forbidden();
  // Manager deactivation: a suspended manager (user_risk_profiles.is_blocked,
  // toggled by a full admin from Customers) loses staff access immediately —
  // the suspension flag is the deactivation switch for the manager role.
  if (ctx.profile.role === "moderator" && (await isUserBlocked(ctx.user.id))) {
    return forbidden("This manager account is deactivated");
  }
  return ctx;
}

/**
 * True when the session belongs to a DEACTIVATED manager (role moderator
 * with the suspension flag set). Staff surfaces that don't go through
 * requireAdmin (order detail endpoint, generic DB API) use this to drop
 * a deactivated manager back to plain-customer standing.
 */
export async function isDeactivatedManager(ctx: SessionContext): Promise<boolean> {
  if (ctx.profile.role !== "moderator") return false;
  return isUserBlocked(ctx.user.id);
}

/**
 * Fix Round 7 (roles matrix): full admins ONLY. Moderators are staff
 * with a deliberately smaller surface — store settings, payment
 * configuration, coupon deletion and user role changes sit behind
 * this gate, never behind requireAdmin.
 */
export async function requireAdminStrict(req: Request): Promise<SessionContext | Response> {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  if (ctx.profile.role !== "admin") return forbidden("Admin access required");
  return ctx;
}

/**
 * Fix Round 7 (customer suspend): the suspension flag is
 * user_risk_profiles.is_blocked — the schema's existing block
 * mechanism, previously written by nothing. Enforcement points:
 * order creation, generic-API writes, /api/me (dashboard notice).
 * A lookup failure must never lock anyone out, so errors read as
 * "not blocked".
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
  try {
    const rp = await prisma.userRiskProfile.findUnique({
      where: { userId },
      select: { isBlocked: true },
    });
    return !!rp?.isBlocked;
  } catch {
    return false;
  }
}

export function isResponse(v: SessionContext | Response): v is Response {
  return v instanceof Response;
}
