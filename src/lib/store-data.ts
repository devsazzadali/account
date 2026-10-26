// AccountStoreOne — server-side store data layer (Prisma / Neon).
//
// SERVER ONLY: imports the Prisma client (src/lib/db.ts) and must never be
// imported from a client component. Every function is failure-tolerant —
// if the database is unreachable or still empty (live data migration is a
// separate phase), it returns empty results so pages render their static
// shell instead of crashing.

import { cache } from "react";
import { prisma } from "./db";
import type {
  HomeData,
  ProductRating,
  StoreCategory,
  StoreProduct,
  StoreReview,
} from "./store-types";

type ProductRow = Awaited<ReturnType<typeof prisma.product.findFirst>>;

function toStoreProduct(
  row: NonNullable<ProductRow>,
  schema: { key: string; label: string }[] = []
): StoreProduct {
  const rawSpecs =
    row.specs && typeof row.specs === "object" && !Array.isArray(row.specs)
      ? (row.specs as Record<string, unknown>)
      : {};
  const labelFor = (key: string) =>
    schema.find((f) => f.key === key)?.label ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    image: row.image,
    stock: row.stock,
    category: row.category,
    badge: row.badge,
    sold: row.sold,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    deliveryEtaHours: row.deliveryEtaHours,
    minQuantity: row.minQuantity,
    specs: Object.entries(rawSpecs)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([key, v]) => ({ key, label: labelFor(key), value: String(v) })),
    variants: Array.isArray(row.variants)
      ? (row.variants as { label: string; priceDelta: number; stock?: number | null }[])
      : [],
  };
}

async function schemaForCategory(name: string | null) {
  if (!name) return [];
  try {
    const cat = await prisma.category.findFirst({ where: { name } });
    return Array.isArray(cat?.attributeSchema)
      ? (cat.attributeSchema as { key: string; label: string }[])
      : [];
  } catch {
    return [];
  }
}

/** Home page data: latest products, categories, recent reviews. */
export async function getHomeData(limit = 30): Promise<HomeData> {
  try {
    const [products, categories, reviews] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.review.findMany({
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
    return {
      products: products.map((p) => toStoreProduct(p)),
      categories: categories.map(
        (c): StoreCategory => ({ id: c.id, name: c.name, slug: c.slug }),
      ),
      reviews: reviews.map(
        (r): StoreReview => ({
          id: r.id,
          username: r.username,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
        }),
      ),
    };
  } catch (err) {
    console.error("[store-data] getHomeData failed, serving empty shell:", err);
    return { products: [], categories: [], reviews: [] };
  }
}

/** Single product by id, or null when missing / DB unavailable.
 *  Wrapped in React cache() so generateMetadata + the page share one
 *  query per request. */
export const getProductById = cache(async function getProductById(
  id: string,
): Promise<StoreProduct | null> {
  if (!id) return null;
  try {
    const row = await prisma.product.findUnique({ where: { id } });
    if (!row || !row.isActive) return null;
    return toStoreProduct(row, await schemaForCategory(row.category));
  } catch (err) {
    // e.g. a malformed (non-uuid) id makes Postgres reject the query —
    // treat any failure as "not found" for rendering purposes.
    console.error("[store-data] getProductById failed:", err);
    return null;
  }
});

/** Aggregate review rating for one product (for JSON-LD / metadata). */
export const getProductRating = cache(async function getProductRating(
  productId: string,
): Promise<ProductRating> {
  try {
    const agg = await prisma.review.aggregate({
      where: { productId, isHidden: false },
      _count: true,
      _avg: { rating: true },
    });
    return { count: agg._count, average: agg._avg.rating ?? 0 };
  } catch (err) {
    console.error("[store-data] getProductRating failed:", err);
    return { count: 0, average: 0 };
  }
});

/** All product ids + timestamps, for the sitemap. Empty on any failure. */
export async function getSitemapProducts(): Promise<
  { id: string; createdAt: Date }[]
> {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("[store-data] getSitemapProducts failed:", err);
    return [];
  }
}
