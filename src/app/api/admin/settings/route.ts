// AccountStoreOne — admin store settings (persisted in store_settings).
// GET  → all settings + per-key source (database | environment | default)
//        + integration status (booleans/sources only — secret values
//        are never returned).
// PUT  → save the editable subset (every key in SETTING_KEYS). Payment
//        secrets are WRITE-ONLY here: a non-empty value is stored, an
//        empty value changes nothing, and `<key>__clear: true` deletes
//        the stored row. They are never echoed back.

import { requireAdminStrict, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { getAllSettings, setSettings, getStripeConfig, getPayPalConfig, SETTING_KEYS } from "@/src/lib/settings-store";
import { getEmailConfig } from "@/src/lib/mailer";

const EDITABLE = new Set<string>(Object.values(SETTING_KEYS));

const ENV_KEYS: Record<string, string | undefined> = {
  store_name: process.env.STORE_NAME,
  support_email: process.env.STORE_SUPPORT_EMAIL,
};

/** Keys that may exist in store_settings but must never be echoed to
 *  the client: getAllSettings() returns every stored row, including
 *  secret material such as the Resend API key (the mailer reads it
 *  from settings) and the payment credentials the admin saves from
 *  Settings → Payments. The settings API reports only their *presence*
 *  (see the integrations block) — never a value. */
const SECRET_SETTING_KEYS = new Set([
  "resend_api_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "paypal_client_secret",
]);

/** Payment secrets the admin may write (never read) through PUT. */
const PAYMENT_SECRET_KEYS = ["stripe_secret_key", "stripe_webhook_secret", "paypal_client_secret"];

async function payload() {
  const allSettings = await getAllSettings();
  const settings: Record<string, string> = {};
  for (const [k, v] of Object.entries(allSettings)) {
    if (!SECRET_SETTING_KEYS.has(k)) settings[k] = v;
  }
  const rows = await prisma.storeSetting.findMany().catch(() => []);
  const inDb = new Set(rows.map((r) => r.key));
  const sources: Record<string, string> = {};
  for (const key of Object.keys(settings)) {
    sources[key] = inDb.has(key) ? "database" : ENV_KEYS[key] ? "environment" : "default";
  }
  // Email status reflects the EFFECTIVE mailer config (store_settings
  // key first, env fallback) — the same resolution getEmailConfig()
  // uses to actually send. Only non-secret facts are exposed: whether
  // a key exists, the provider, and the From identity. The key value
  // itself is never returned.
  const emailCfg = await getEmailConfig().catch(() => null);
  const stripeCfg = await getStripeConfig().catch(() => null);
  const paypalCfg = await getPayPalConfig().catch(() => null);
  const keySource = (src: "settings" | "environment" | null | undefined) =>
    src === "settings" ? "store_settings" : src ?? null;
  return {
    settings,
    sources,
    integrations: {
      stripe: {
        configured: !!stripeCfg?.configured,
        enabled: !!stripeCfg?.enabled,
        toggle_on: !!stripeCfg?.toggleOn,
        publishable_key_set: !!stripeCfg?.publishableKey,
        webhook_secret_set: !!stripeCfg?.webhookSecret,
        key_source: keySource(stripeCfg?.secretSource),
        webhook_source: keySource(stripeCfg?.webhookSource),
      },
      paypal: {
        configured: !!paypalCfg?.configured,
        credentials_ready: !!paypalCfg?.enabled,
        toggle_on: !!paypalCfg?.toggleOn,
        client_id_set: !!paypalCfg?.clientId,
        client_secret_set: !!paypalCfg?.clientSecret,
        key_source: keySource(paypalCfg?.secretSource),
        // No PayPal checkout flow exists yet — the public payment
        // config reports PayPal disabled until it does.
        checkout_integrated: false,
      },
      email: {
        configured: !!emailCfg?.configured,
        provider: emailCfg?.configured ? "Resend" : null,
        from: emailCfg?.from ?? null,
        key_source: emailCfg?.configured
          ? inDb.has("resend_api_key")
            ? "store_settings"
            : "environment"
          : null,
      },
      auth: { provider: "Neon Auth (self-hosted session verification)" },
      storage: { mode: "local disk", note: "uploads live under public/uploads — swap the adapter to Vercel Blob for production persistence" },
    },
  };
}

export async function GET(req: Request) {
  const gate = await requireAdminStrict(req); // Fix Round 7: settings/payment config are full-admin only (no moderator access)
  if (isResponse(gate)) return gate;
  return Response.json(await payload());
}

/** ── Input hygiene for admin-editable settings ──────────────────────────
 * Everything the admin can type lands on public pages, so: plain text only
 * (HTML tags stripped, control characters removed), per-field length caps,
 * URLs restricted to http(s) or site-relative paths, booleans strict, and
 * the homepage section order must be a permutation of the known sections. */
const BOOL_KEYS = new Set([
  "store_open", "notify_new_order", "hero_enabled", "announcement_enabled",
  "section_featured_enabled", "section_trending_enabled",
  "section_categories_enabled", "section_reviews_enabled", "section_about_enabled",
  "stripe_enabled", "paypal_enabled",
]);
const URL_KEYS = new Set([
  "store_logo_url", "store_banner_url", "hero_image_url",
  "hero_cta_primary_link", "hero_cta_secondary_link", "announcement_link",
  "site_url",
]);
const TEXT_LIMITS: Record<string, number> = {
  store_name: 80, store_description: 600, support_email: 160, support_hours: 120,
  site_url: 200,
  stripe_publishable_key: 255, paypal_client_id: 255,
  hero_badge_text: 80, hero_headline: 120, hero_subheadline: 300,
  hero_cta_primary_text: 40, hero_cta_secondary_text: 40,
  announcement_text: 200, footer_tagline: 300,
  section_featured_title: 60, section_trending_title: 60,
  section_categories_title: 60, section_reviews_title: 60, section_about_title: 60,
};
const SECTION_IDS = ["featured", "trending", "categories", "reviews"];

function cleanText(v: string, max: number): string {
  return v
    .replace(/<[^>]*>/g, "") // no markup — plain text only
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ") // keep \n, \t
    .slice(0, max);
}

function validUrl(v: string): boolean {
  if (!v) return true; // empty = unset
  if (v.startsWith("/") && !v.startsWith("//")) return true; // site-relative
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PUT(req: Request) {
  const gate = await requireAdminStrict(req); // Fix Round 7: settings/payment config are full-admin only (no moderator access)
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const values: Record<string, string> = {};
  // Payment secrets are write-only (see header): a non-empty value is
  // stored (trimmed, capped), an empty/absent value leaves the stored
  // secret untouched, and `<key>__clear: true` deletes the stored row
  // (an env fallback, if one exists, then applies again).
  for (const k of PAYMENT_SECRET_KEYS) {
    if ((body || {})[`${k}__clear`] === true) {
      await prisma.storeSetting.deleteMany({ where: { key: k } });
    } else if (typeof (body || {})[k] === "string" && (body[k] as string).trim()) {
      values[k] = (body[k] as string).trim().slice(0, 512);
    }
  }
  for (const [k, v] of Object.entries(body || {})) {
    if (!EDITABLE.has(k)) continue;
    if (SECRET_SETTING_KEYS.has(k)) continue; // secrets never pass through the generic path — payment secrets are handled write-only above; the email key is not accepted here at all
    if (typeof v === "boolean") {
      values[k] = v ? "true" : "false";
      continue;
    }
    if (typeof v !== "string") continue;
    if (BOOL_KEYS.has(k)) {
      if (v !== "true" && v !== "false") {
        return Response.json({ error: `${k} must be "true" or "false"` }, { status: 400 });
      }
      values[k] = v;
    } else if (k === "home_section_order") {
      const parts = v.split(",").map((x) => x.trim()).filter(Boolean);
      const ok =
        parts.length === SECTION_IDS.length &&
        new Set(parts).size === SECTION_IDS.length &&
        parts.every((p) => SECTION_IDS.includes(p));
      if (!ok) {
        return Response.json({ error: "home_section_order must list each homepage section exactly once" }, { status: 400 });
      }
      values[k] = parts.join(",");
    } else if (URL_KEYS.has(k)) {
      const url = v.trim();
      if (!validUrl(url)) {
        return Response.json({ error: `${k} must be an http(s) URL or a site-relative path` }, { status: 400 });
      }
      values[k] = url;
    } else {
      values[k] = cleanText(v, TEXT_LIMITS[k] ?? 300);
    }
  }
  await setSettings(values);
  return Response.json({ ok: true, ...(await payload()) });
}
