// AccountStoreOne — serializable store types shared between server
// components (Prisma data layer) and client screens. Plain JSON-safe shapes
// only (no Decimal/Date objects) so they can cross the server→client
// boundary as props.

export interface StoreProduct {
  id: string;
  title: string;
  /** USD price as a plain number (Prisma Decimal converted server-side). */
  price: number;
  image: string | null;
  stock: number;
  category: string | null;
  badge: string | null;
  sold: number;
  description: string | null;
  createdAt: string; // ISO string
  // Z2U alignment P1/P2: delivery promise, min quantity, spec values
  // (label resolved server-side from the category's attribute schema),
  // sellable variants ([{ label, priceDelta, stock? }]).
  deliveryEtaHours: number | null;
  minQuantity: number;
  specs: { key: string; label: string; value: string }[];
  variants: { label: string; priceDelta: number; stock?: number | null }[];
  // Fulfilment types: how this product is delivered + warranty promise.
  fulfilmentType: "instant" | "manual" | "service";
  warrantyDays: number | null;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string | null;
}

export interface StoreReview {
  id: string;
  username: string | null;
  rating: number;
  comment: string | null;
  createdAt: string; // ISO string
}

export interface HomeData {
  products: StoreProduct[];
  categories: StoreCategory[];
  reviews: StoreReview[];
}

export interface ProductRating {
  count: number;
  average: number; // 0 when count is 0
}

/** ── Storefront CMS (admin-editable storefront, resolved server-side) ──
 * Every value falls back to the current design copy when the admin has not
 * customized it, so the default look is preserved exactly. `headline: null`
 * means "render the built-in stylized hero headline". Section titles are
 * always resolved to a concrete string (design copy when unset). */
export type HomeSectionId = "featured" | "trending" | "categories" | "reviews";

export interface CmsSectionConfig {
  enabled: boolean;
  /** Resolved title (design copy when the admin has not overridden it). */
  title: string;
}

export interface StorefrontSettings {
  brand: {
    name: string;
    logoUrl: string | null;
    description: string;
    footerTagline: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    link: string;
  };
  hero: {
    enabled: boolean;
    badgeText: string;
    /** null → built-in stylized headline ("Account" + gradient "Store"). */
    headline: string | null;
    subheadline: string;
    imageUrl: string | null;
    primaryCta: { text: string; link: string } | null;
    secondaryCta: { text: string; link: string } | null;
  };
  sections: Record<HomeSectionId | "about", CmsSectionConfig>;
  sectionOrder: HomeSectionId[];
}
