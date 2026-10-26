// AccountStoreOne — SEO constants + JSON-LD builders.
// Server-side only helpers for metadata and structured data.

export const SITE_URL = "https://www.accountstoreone.com";
export const SITE_NAME = "Account Store One";
export const SITE_TAGLINE = "Premium Marketplace";
export const SITE_DESCRIPTION =
  "Buy verified premium accounts and subscriptions — Netflix, Spotify, IPTV, gaming accounts and more — with instant delivery, escrow buyer protection and 24/7 support.";
export const OG_IMAGE = "/opengraph-image";
/** Default currency across the store (matches the live site). */
export const CURRENCY = "USD";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Organization + OnlineStore structured data for the home page. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon"),
    description: SITE_DESCRIPTION,
    slogan: "Verified premium accounts, delivered instantly.",
  };
}

/** WebSite structured data with a SearchAction for sitelinks search box. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface ProductJsonLdInput {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  category: string | null;
  rating?: { count: number; average: number } | null;
}

/** Product + Offer structured data for a product page. */
export function productJsonLd(p: ProductJsonLdInput) {
  const url = absoluteUrl(`/product/${p.id}`);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: p.title,
    url,
    description:
      p.description?.split("--- Properties ---")[0].trim() ||
      `${p.title} — premium digital account with instant delivery and buyer protection from ${SITE_NAME}.`,
    category: p.category ?? "Digital Accounts",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: CURRENCY,
      price: p.price.toFixed(2),
      availability:
        p.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };
  if (p.image) data.image = [absoluteUrl(p.image)];
  if (p.rating && p.rating.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.rating.average.toFixed(1),
      reviewCount: p.rating.count,
    };
  }
  return data;
}

/** BreadcrumbList structured data. Items are root-relative paths. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** ItemList of products for the home page (only emitted when data exists). */
export function productListJsonLd(
  products: { id: string; title: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured premium accounts",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/product/${p.id}`),
      name: p.title,
    })),
  };
}
