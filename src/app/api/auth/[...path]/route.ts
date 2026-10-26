// AccountStoreOne — Neon Auth proxy.
// The browser talks to same-origin /api/auth/*; every call is forwarded to
// the branch's Managed Better Auth service (NEON_AUTH_BASE_URL). Session
// cookies set by Neon Auth are passed back to the browser (with any Domain
// attribute stripped so the cookie binds to this app's origin).

const AUTH_BASE = process.env.NEON_AUTH_BASE_URL;

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!AUTH_BASE) {
    return Response.json({ error: "Auth is not configured (NEON_AUTH_BASE_URL missing)" }, { status: 500 });
  }
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const target = `${AUTH_BASE}/${path.join("/")}${url.search}`;

  const headers = new Headers();
  for (const name of ["content-type", "cookie", "origin", "user-agent", "accept"]) {
    const v = req.headers.get(name);
    if (v) headers.set(name, v);
  }
  if (!headers.has("origin")) {
    headers.set("origin", url.origin);
  }

  const init: RequestInit = { method: req.method, headers, redirect: "manual" };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, init);

  const resHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) resHeaders.set("content-type", contentType);
  const location = upstream.headers.get("location");
  if (location) resHeaders.set("location", location);

  const setCookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    resHeaders.append("set-cookie", cookie.replace(/;\s*Domain=[^;]+/i, ""));
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, { status: upstream.status, headers: resHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
