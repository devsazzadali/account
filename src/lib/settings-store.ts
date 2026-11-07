// AccountStoreOne — store settings (admin-editable, persisted in Neon).
// Resolution order: `store_settings` table → environment → built-in default.
// Payment credentials (Stripe/PayPal) may be stored here by the admin from
// the dashboard (Settings → Payments): they are WRITE-ONLY through the
// settings API (never echoed by any endpoint — see SECRET_SETTING_KEYS in
// the admin settings route) and resolve settings-first with env as the
// fallback, exactly like the mailer's Resend key.
// This store is INTERNATIONAL ONLY (owner ruling 2026-11-07): no
// Bangladeshi mobile-money rail exists anywhere in settings or config —
// the old manual number fields were removed, not renamed.

import { prisma } from "./db";
import type { HomeSectionId, StorefrontSettings } from "./store-types";

export const SETTING_KEYS = {
  storeName: "store_name",
  storeDescription: "store_description",
  supportEmail: "support_email",
  storeLogoUrl: "store_logo_url",
  storeBannerUrl: "store_banner_url",
  storeOpen: "store_open",
  supportHours: "support_hours",
  // Absolute base for links inside transactional emails (mailer reads
  // it into the store identity; falls back to env SITE_URL, then the
  // canonical domain constant). Point it at the live deployment.
  siteUrl: "site_url",
  // ── Payment methods (admin-managed from Settings → Payments) ──
  // Credentials resolve settings → env (see getStripeConfig /
  // getPayPalConfig below). Secret values are write-only via the admin
  // settings API and are never returned by any endpoint.
  stripePublishableKey: "stripe_publishable_key",
  stripeSecretKey: "stripe_secret_key",
  stripeWebhookSecret: "stripe_webhook_secret",
  stripeEnabled: "stripe_enabled",
  paypalClientId: "paypal_client_id",
  paypalClientSecret: "paypal_client_secret",
  paypalEnabled: "paypal_enabled",
  notifyNewOrder: "notify_new_order",
  // ── Review baseline (imported shop history) ──
  // The store's pre-existing review history lives on the marketplace
  // shop it was imported from; only a small sample of individual
  // reviews is stored as rows (marked with the "Z2U · " username
  // prefix, display-only). These three keys hold the shop's official
  // aggregates so /api/store/stats can combine them with reviews
  // created locally, without double-counting the imported sample.
  reviewBaselineCount: "review_baseline_count",
  reviewBaselineAvg: "review_baseline_avg",
  reviewBaselinePositivePct: "review_baseline_positive_pct",
  // ── Storefront CMS (hero, announcement bar, homepage sections) ──
  heroEnabled: "hero_enabled",
  heroBadgeText: "hero_badge_text",
  heroHeadline: "hero_headline",
  heroSubheadline: "hero_subheadline",
  heroImageUrl: "hero_image_url",
  heroCtaPrimaryText: "hero_cta_primary_text",
  heroCtaPrimaryLink: "hero_cta_primary_link",
  heroCtaSecondaryText: "hero_cta_secondary_text",
  heroCtaSecondaryLink: "hero_cta_secondary_link",
  announcementEnabled: "announcement_enabled",
  announcementText: "announcement_text",
  announcementLink: "announcement_link",
  sectionFeaturedEnabled: "section_featured_enabled",
  sectionFeaturedTitle: "section_featured_title",
  sectionTrendingEnabled: "section_trending_enabled",
  sectionTrendingTitle: "section_trending_title",
  sectionCategoriesEnabled: "section_categories_enabled",
  sectionCategoriesTitle: "section_categories_title",
  sectionReviewsEnabled: "section_reviews_enabled",
  sectionReviewsTitle: "section_reviews_title",
  sectionAboutEnabled: "section_about_enabled",
  sectionAboutTitle: "section_about_title",
  homeSectionOrder: "home_section_order",
  footerTagline: "footer_tagline",
} as const;

const ENV_FALLBACKS: Record<string, string | undefined> = {
  store_name: process.env.STORE_NAME,
  support_email: process.env.STORE_SUPPORT_EMAIL,
};

const DEFAULTS: Record<string, string> = {
  store_name: "Account Store One",
  store_description:
    "Premium digital accounts and subscriptions, delivered by a single verified seller with escrow buyer protection.",
  support_email: "",
  store_logo_url: "",
  store_banner_url: "",
  store_open: "true",
  support_hours: "",
  site_url: "https://www.accountstoreone.com",
  // Payment toggles default ON so a method goes live the moment real
  // credentials exist (dashboard or env) — the resolvers still report a
  // method disabled until its credentials are actually present.
  stripe_enabled: "true",
  stripe_publishable_key: "",
  paypal_enabled: "true",
  paypal_client_id: "",
  notify_new_order: "true",
  // No imported review history by default — stats fall back to local
  // reviews only until a baseline is recorded in settings.
  review_baseline_count: "0",
  review_baseline_avg: "",
  review_baseline_positive_pct: "",
  // Storefront CMS — toggles + section order have explicit defaults so the
  // admin UI renders them; CMS *text* keys stay unset by default ("" = the
  // resolver falls back to the built-in design copy).
  hero_enabled: "true",
  announcement_enabled: "false",
  section_featured_enabled: "true",
  section_trending_enabled: "true",
  section_categories_enabled: "true",
  section_reviews_enabled: "true",
  section_about_enabled: "true",
  home_section_order: "featured,trending,categories,reviews",
};

export async function getAllSettings(): Promise<Record<string, string>> {
  const out: Record<string, string> = { ...DEFAULTS };
  for (const [k, v] of Object.entries(ENV_FALLBACKS)) if (v) out[k] = v;
  try {
    const rows = await prisma.storeSetting.findMany();
    for (const r of rows) out[r.key] = r.value;
  } catch {
    // DB unavailable — env/defaults still give a coherent storefront.
  }
  return out;
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    await prisma.storeSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

/** ── Payment method resolvers ────────────────────────────────────────────
 * Credentials resolve settings-first, env as fallback (the mailer's
 * pattern). A method counts as ENABLED only when its admin toggle is on
 * AND its required credentials actually exist — presence of credentials
 * alone never fakes an "on", and a toggle alone never does either. */
const clean = (v: string | undefined) => (v ?? "").trim();

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  toggleOn: boolean;
  configured: boolean;
  enabled: boolean;
  secretSource: "settings" | "environment" | null;
  webhookSource: "settings" | "environment" | null;
}

function resolveStripe(s: Record<string, string>): StripeConfig {
  const fromSettings = clean(s[SETTING_KEYS.stripeSecretKey]);
  const secretKey = fromSettings || clean(process.env.STRIPE_SECRET_KEY);
  const publishableKey =
    clean(s[SETTING_KEYS.stripePublishableKey]) || clean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  const webhookFromSettings = clean(s[SETTING_KEYS.stripeWebhookSecret]);
  const webhookSecret = webhookFromSettings || clean(process.env.STRIPE_WEBHOOK_SECRET);
  const toggleOn = s[SETTING_KEYS.stripeEnabled] !== "false";
  const configured = !!secretKey;
  return {
    secretKey,
    publishableKey,
    webhookSecret,
    toggleOn,
    configured,
    enabled: toggleOn && configured,
    secretSource: fromSettings ? "settings" : secretKey ? "environment" : null,
    webhookSource: webhookFromSettings ? "settings" : webhookSecret ? "environment" : null,
  };
}

export async function getStripeConfig(): Promise<StripeConfig> {
  return resolveStripe(await getAllSettings());
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  toggleOn: boolean;
  configured: boolean;
  /** Toggle on AND credentials present. NOTE: this is the ADMIN-side
   *  readiness only — the public config still reports PayPal disabled
   *  until a real checkout flow exists (see getPaymentConfig). */
  enabled: boolean;
  secretSource: "settings" | "environment" | null;
}

function resolvePaypal(s: Record<string, string>): PayPalConfig {
  const clientId = clean(s[SETTING_KEYS.paypalClientId]) || clean(process.env.PAYPAL_CLIENT_ID);
  const fromSettings = clean(s[SETTING_KEYS.paypalClientSecret]);
  const clientSecret = fromSettings || clean(process.env.PAYPAL_CLIENT_SECRET);
  const toggleOn = s[SETTING_KEYS.paypalEnabled] !== "false";
  const configured = !!(clientId && clientSecret);
  return {
    clientId,
    clientSecret,
    toggleOn,
    configured,
    enabled: toggleOn && configured,
    secretSource: fromSettings ? "settings" : clientSecret ? "environment" : null,
  };
}

export async function getPayPalConfig(): Promise<PayPalConfig> {
  return resolvePaypal(await getAllSettings());
}

/** Public payment configuration for the checkout UI. Only methods that
 *  are enabled AND fully configured are reported, and only public-safe
 *  fields are exposed (a publishable key is public by design; secret
 *  keys never leave the server). */
export async function getPaymentConfig() {
  const s = await getAllSettings();
  const stripe = resolveStripe(s);
  const paypal = resolvePaypal(s);
  return {
    store_open: s[SETTING_KEYS.storeOpen] !== "false",
    stripe: {
      enabled: stripe.enabled,
      publishable_key: stripe.enabled ? stripe.publishableKey || null : null,
    },
    paypal: {
      // Credentials can be stored today, but there is no PayPal checkout
      // flow yet — reporting enabled here would advertise a method
      // buyers cannot actually complete, so it stays false until the
      // checkout integration lands. `configured` only reports that
      // credentials are on file.
      enabled: false,
      configured: paypal.configured,
    },
    wallet: { enabled: true },
  };
}

/** ── Storefront CMS resolver ─────────────────────────────────────────────
 * Reads the raw settings map and resolves every admin-editable storefront
 * value, falling back to the built-in design copy/structure whenever the
 * admin has not customized a field (empty string = "use the design
 * default"). Read at request time — admin changes appear immediately,
 * no redeploy needed. */
const HOME_SECTION_IDS: HomeSectionId[] = ["featured", "trending", "categories", "reviews"];

const STOREFRONT_DESIGN = {
  heroBadge: "Discover Premium Excellence",
  heroSubheadline:
    "Elevate your digital presence with our curated selection of verified, high-tier accounts. Experience pure exclusivity.",
  featuredTitle: "Featured List",
  trendingTitle: "Trending Products",
  categoriesTitle: "Browse Categories",
  reviewsTitle: "Customer Reviews",
  aboutTitle: "About the store",
  footerTagline:
    "Premium digital accounts and subscriptions from a single verified seller — every order protected by escrow until delivery is confirmed.",
} as const;

const cmsText = (v: string | undefined, fallback: string) => {
  const t = (v ?? "").trim();
  return t || fallback;
};
const cmsBool = (v: string | undefined) => v !== "false";

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const s = await getAllSettings();
  const K = SETTING_KEYS;

  const rawOrder = (s[K.homeSectionOrder] ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is HomeSectionId => (HOME_SECTION_IDS as string[]).includes(x));
  const sectionOrder: HomeSectionId[] = [
    ...new Set([...rawOrder, ...HOME_SECTION_IDS]),
  ];

  const cta = (text: string | undefined, link: string | undefined) => {
    const t = (text ?? "").trim();
    if (!t) return null;
    return { text: t, link: (link ?? "").trim() || "#" };
  };

  return {
    brand: {
      name: cmsText(s[K.storeName], "Account Store One"),
      logoUrl: (s[K.storeLogoUrl] ?? "").trim() || null,
      description: s[K.storeDescription] ?? "",
      footerTagline: cmsText(s[K.footerTagline], STOREFRONT_DESIGN.footerTagline),
    },
    announcement: {
      enabled: s[K.announcementEnabled] === "true",
      text: (s[K.announcementText] ?? "").trim(),
      link: (s[K.announcementLink] ?? "").trim(),
    },
    hero: {
      enabled: cmsBool(s[K.heroEnabled]),
      badgeText: cmsText(s[K.heroBadgeText], STOREFRONT_DESIGN.heroBadge),
      headline: (s[K.heroHeadline] ?? "").trim() || null,
      subheadline: cmsText(s[K.heroSubheadline], STOREFRONT_DESIGN.heroSubheadline),
      // The hero background historically followed the store banner — keep
      // that behavior unless a dedicated hero image is set.
      imageUrl: (s[K.heroImageUrl] ?? "").trim() || (s[K.storeBannerUrl] ?? "").trim() || null,
      primaryCta: cta(s[K.heroCtaPrimaryText], s[K.heroCtaPrimaryLink]),
      secondaryCta: cta(s[K.heroCtaSecondaryText], s[K.heroCtaSecondaryLink]),
    },
    sections: {
      featured: {
        enabled: cmsBool(s[K.sectionFeaturedEnabled]),
        title: cmsText(s[K.sectionFeaturedTitle], STOREFRONT_DESIGN.featuredTitle),
      },
      trending: {
        enabled: cmsBool(s[K.sectionTrendingEnabled]),
        title: cmsText(s[K.sectionTrendingTitle], STOREFRONT_DESIGN.trendingTitle),
      },
      categories: {
        enabled: cmsBool(s[K.sectionCategoriesEnabled]),
        title: cmsText(s[K.sectionCategoriesTitle], STOREFRONT_DESIGN.categoriesTitle),
      },
      reviews: {
        enabled: cmsBool(s[K.sectionReviewsEnabled]),
        title: cmsText(s[K.sectionReviewsTitle], STOREFRONT_DESIGN.reviewsTitle),
      },
      about: {
        enabled: cmsBool(s[K.sectionAboutEnabled]),
        title: cmsText(s[K.sectionAboutTitle], STOREFRONT_DESIGN.aboutTitle),
      },
    },
    sectionOrder,
  };
}
