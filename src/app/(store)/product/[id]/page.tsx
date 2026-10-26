import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailsPage } from "@/src/screens/ProductDetailsPage";
import { JsonLd } from "@/src/components/seo/JsonLd";
import { getProductById, getProductRating } from "@/src/lib/store-data";
import { productJsonLd, breadcrumbJsonLd, OG_IMAGE } from "@/src/lib/seo";

// Product data must be fresh (stock/price) — render per request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function cleanDescription(description: string | null): string {
  return (description ?? "").split("--- Properties ---")[0].trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
      description:
        "This product is no longer available on Account Store One. Browse the marketplace for verified premium accounts and subscriptions.",
      robots: { index: false, follow: true },
    };
  }

  const raw =
    cleanDescription(product.description) ||
    `Buy ${product.title} — verified premium digital account with instant delivery, escrow buyer protection and 24/7 support on Account Store One.`;
  const description = raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
  const title = `${product.title} — Buy Online`;

  return {
    title,
    description,
    keywords: product.category
      ? [product.title, product.category, "buy account", "instant delivery"]
      : undefined,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: `${product.title} | Account Store One`,
      description,
      url: `/product/${product.id}`,
      // Page-level openGraph replaces the layout's in Next 15 — always
      // set images explicitly, falling back to the site OG image.
      images: [{ url: product.image ?? OG_IMAGE, alt: product.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | Account Store One`,
      description,
      images: [product.image ?? OG_IMAGE],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const rating = await getProductRating(product.id);

  const crumbs: { name: string; path: string }[] = [
    { name: "Marketplace", path: "/" },
  ];
  if (product.category) {
    // Category landing pages don't exist as routes yet (see
    // SEO_PORT_REPORT.md) — the crumb points at the storefront until
    // they are built.
    crumbs.push({ name: product.category, path: "/" });
  }
  crumbs.push({ name: product.title, path: `/product/${product.id}` });

  return (
    <>
      <JsonLd
        data={[
          productJsonLd({
            id: product.id,
            title: product.title,
            description: product.description,
            image: product.image,
            price: product.price,
            stock: product.stock,
            category: product.category,
            rating: rating.count > 0 ? rating : null,
          }),
          breadcrumbJsonLd(crumbs),
        ]}
      />
      <ProductDetailsPage
        initialProduct={{
          id: product.id,
          title: product.title,
          sold: product.sold,
          price: product.price,
          image: product.image ?? "",
          badge: product.badge ?? "",
          description: product.description ?? "",
          stock: product.stock,
          category: product.category ?? undefined,
          fulfilmentType: product.fulfilmentType,
          warrantyDays: product.warrantyDays,
        }}
      />
    </>
  );
}
