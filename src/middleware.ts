// AccountStoreOne — route protection (edge).
// Presence of the Neon Auth session cookie gates the private areas; the
// real authorization (session validity + role + ownership) is enforced
// again inside every API route and in the admin server wrapper.
// /seller/* is retired: this is a single-seller store, so seller surfaces
// redirect into the admin console.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIES = ["__Secure-neon-auth.session_token", "neon-auth.session_token"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/seller")) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/checkout/:path*", "/order/:path*", "/seller/:path*"],
};
