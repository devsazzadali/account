// AccountStoreOne — public payment configuration for checkout UIs.
// Only enabled + fully configured methods are reported, with public-safe
// fields only — secret keys never leave the server. Stripe is reported
// enabled only when real credentials exist (admin dashboard Settings →
// Payments, env as fallback) and the method is switched on: the UI must
// never fake a card flow. The session is still resolved so future
// per-user methods can be added without changing the route's shape.

import { fetchAuthUser } from "@/src/lib/auth-server";
import { getPaymentConfig } from "@/src/lib/settings-store";

export async function GET(req: Request) {
  await fetchAuthUser(req.headers.get("cookie"));
  const config = await getPaymentConfig();
  return Response.json(config);
}
