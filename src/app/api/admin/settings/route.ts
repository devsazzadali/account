// AccountStoreOne — admin store settings (persisted in store_settings).
// GET  → all settings + integration status (Stripe configured? auth base?)
// PUT  → save the editable subset. Secrets are env-only and never accepted.

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { getAllSettings, setSettings, SETTING_KEYS } from "@/src/lib/settings-store";

const EDITABLE = new Set<string>(Object.values(SETTING_KEYS));

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const settings = await getAllSettings();
  return Response.json({
    settings,
    integrations: {
      stripe: { configured: !!process.env.STRIPE_SECRET_KEY, webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET },
      neonAuth: { configured: !!process.env.NEON_AUTH_BASE_URL },
    },
  });
}

export async function PUT(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (EDITABLE.has(k) && typeof v === "string") values[k] = v;
  }
  await setSettings(values);
  return Response.json({ ok: true, settings: await getAllSettings() });
}
