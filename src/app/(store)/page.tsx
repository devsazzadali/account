import type { Metadata } from "next";
import { StorePage } from "@/src/screens/StorePage";
import { JsonLd } from "@/src/components/seo/JsonLd";
import { getHomeData } from "@/src/lib/store-data";
import { getStorefrontSettings } from "@/src/lib/settings-store";
import {
  SITE_DESCRIPTION,
  organizationJsonLd,
  websiteJsonLd,
  productListJsonLd,
} from "@/src/lib/seo";

// Store data changes as products are added — render per request so the
// SSR HTML always carries the current catalog (SEO port, 2026-10-26).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Account Store One | Premium Marketplace" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Account Store One | Premium Marketplace",
    description: SITE_DESCRIPTION,
    url: "/",
    // NOTE: a page-level openGraph replaces the layout's wholesale in
    // Next 15 (images are NOT inherited), so they are repeated here.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Account Store One — Premium Marketplace",
      },
    ],
  },
};

export default async function HomePage() {
  // Server-side fetch via Prisma. Degrades to empty arrays while the
  // products table is still empty (live-data migration is a later phase),
  // in which case the client screen falls back to its existing behaviour.
  const data = await getHomeData();
  // Storefront CMS — resolved per request so admin edits show immediately.
  const cms = await getStorefrontSettings();

  const schemas: Record<string, unknown>[] = [
    organizationJsonLd(),
    websiteJsonLd(),
  ];
  if (data.products.length > 0) {
    schemas.push(productListJsonLd(data.products.slice(0, 12)));
  }

  return (
    <>
      <JsonLd data={schemas} />
      <StorePage initialData={data} cms={cms} />
    </>
  );
}
