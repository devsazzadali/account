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

/** ── Input hygiene for admin-editable settings ──────────────────────────
 * Everything the admin can type lands on public pages, so: plain text only
 * (HTML tags stripped, control characters removed), per-field length caps,
 * URLs restricted to http(s) or site-relative paths, booleans strict, and
 * the homepage section order must be a permutation of the known sections. */
const BOOL_KEYS = new Set([
  "store_open", "notify_new_order", "hero_enabled", "announcement_enabled",
  "section_featured_enabled", "section_trending_enabled",
  "section_categories_enabled", "section_reviews_enabled", "section_about_enabled",
]);
const URL_KEYS = new Set([
  "store_logo_url", "store_banner_url", "hero_image_url",
  "hero_cta_primary_link", "hero_cta_secondary_link", "announcement_link",
]);
const TEXT_LIMITS: Record<string, number> = {
  store_name: 80, store_description: 600, support_email: 160, support_hours: 120,
  payment_number_bkash: 32, payment_number_nagad: 32, payment_instructions: 1000,
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
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(body || {})) {
    if (!EDITABLE.has(k)) continue;
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
