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
