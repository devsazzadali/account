// AccountStoreOne — admin store settings (persisted in store_settings).
// GET  → all settings + per-key source (database | environment | default)
//        + integration status (booleans only — secrets are env-only and
//        are never returned or accepted here).
// PUT  → save the editable subset (every key in SETTING_KEYS).

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { getAllSettings, setSettings, SETTING_KEYS } from "@/src/lib/settings-store";
import { emailConfigured } from "@/src/lib/mailer";

const EDITABLE = new Set<string>(Object.values(SETTING_KEYS));

const ENV_KEYS: Record<string, string | undefined> = {
  store_name: process.env.STORE_NAME,
  support_email: process.env.STORE_SUPPORT_EMAIL,
  payment_number_bkash: process.env.STORE_BKASH_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_number_nagad: process.env.STORE_NAGAD_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_instructions: process.env.STORE_PAYMENT_INSTRUCTIONS,
};

async function payload() {
  const settings = await getAllSettings();
  const rows = await prisma.storeSetting.findMany().catch(() => []);
  const inDb = new Set(rows.map((r) => r.key));
  const sources: Record<string, string> = {};
  for (const key of Object.keys(settings)) {
    sources[key] = inDb.has(key) ? "database" : ENV_KEYS[key] ? "environment" : "default";
  }
  return {
    settings,
    sources,
    integrations: {
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        publishable_key_set: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhook_secret_set: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
      manual_payments: {
        bkash_configured: !!settings[SETTING_KEYS.bkashNumber],
        nagad_configured: !!settings[SETTING_KEYS.nagadNumber],
      },
      email: {
        configured: emailConfigured(),
        provider: process.env.RESEND_API_KEY ? "Resend" : null,
      },
      auth: { provider: "Neon Auth (self-hosted session verification)" },
      storage: { mode: "local disk", note: "uploads live under public/uploads — swap the adapter to Vercel Blob for production persistence" },
    },
  };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  return Response.json(await payload());
}

export async function PUT(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (EDITABLE.has(k) && typeof v === "string") values[k] = v;
    else if (EDITABLE.has(k) && typeof v === "boolean") values[k] = v ? "true" : "false";
  }
  await setSettings(values);
  return Response.json({ ok: true, ...(await payload()) });
}
