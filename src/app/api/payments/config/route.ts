// AccountStoreOne — public payment configuration for checkout UIs.
// Payment numbers are disclosed only to signed-in users (they are printed
// at checkout by design). Stripe is reported as enabled only when a real
// secret key exists in env — the UI must never fake a card flow.

import { fetchAuthUser } from "@/src/lib/auth-server";
import { getPaymentConfig } from "@/src/lib/settings-store";

export async function GET(req: Request) {
  const user = await fetchAuthUser(req.headers.get("cookie"));
  const config = await getPaymentConfig(!!user);
  return Response.json(config);
}
