// AccountStoreOne — store settings (admin-editable, persisted in Neon).
// Resolution order: `store_settings` table → environment → built-in default.
// SECRETS ARE NEVER STORED HERE — Stripe keys etc. live in env only.
// The store's manual-payment numbers come from settings/env, never from
// hardcoded values in code.

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
  bkashNumber: "payment_number_bkash",
  nagadNumber: "payment_number_nagad",
  paymentInstructions: "payment_instructions",
  notifyNewOrder: "notify_new_order",
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
  payment_number_bkash: process.env.STORE_BKASH_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_number_nagad: process.env.STORE_NAGAD_NUMBER || process.env.STORE_PAYMENT_NUMBER,
  payment_instructions: process.env.STORE_PAYMENT_INSTRUCTIONS,
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
  payment_number_bkash: "",
  payment_number_nagad: "",
  payment_instructions:
    "Send the exact order total to the number shown, then submit your Transaction ID and the number you sent from. An admin verifies every payment by hand before delivery.",
  notify_new_order: "true",
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

export async function getSetting(key: string): Promise<string> {
  const all = await getAllSettings();
  return all[key] ?? "";
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

/** Public payment configuration for the checkout UI. Numbers are only
 *  disclosed to signed-in buyers (they are shown at checkout by design). */
export async function getPaymentConfig(forSignedInUser: boolean) {
  const s = await getAllSettings();
  const bkash = s[SETTING_KEYS.bkashNumber];
  const nagad = s[SETTING_KEYS.nagadNumber];
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
  return {
    store_open: s[SETTING_KEYS.storeOpen] !== "false",
    manual: {
      enabled: !!(bkash || nagad),
      bkashNumber: forSignedInUser ? bkash || null : null,
      nagadNumber: forSignedInUser ? nagad || null : null,
      instructions: s[SETTING_KEYS.paymentInstructions],
    },
    stripe: { enabled: stripeEnabled },
    wallet: { enabled: true },
  };
}

/** Whether the storefront is accepting new orders (Hide Shop switch). */
export async function isStoreOpen(): Promise<boolean> {
  const v = await getSetting(SETTING_KEYS.storeOpen);
  return v !== "false";
}

/** ── Storefront CMS resolver ─────────────────────────────────────────────
 * Reads the raw settings map and resolves every admin-editable storefront
 * value, falling back to the built-in design copy/structure whenever the
 * admin has not customized a field (empty string = "use the design
 * default"). Read at request time — admin changes appear immediately,
 * no redeploy needed. */
export const HOME_SECTION_IDS: HomeSectionId[] = ["featured", "trending", "categories", "reviews"];

export const STOREFRONT_DESIGN = {
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
