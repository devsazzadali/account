"use client";

import { Search, ThumbsUp, MinusCircle, Zap, Crown, Clock, Star, TrendingUp, Award, Plus, Minus, AlertCircle, ShieldCheck, Check, Briefcase, SlidersHorizontal } from "lucide-react";
import { deliveryInfo } from "../lib/fulfilment";
import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/dbclient";
import { auth } from "../lib/auth-client";

interface FeaturedItem {
  id: string;
  title: string;
  sold: number;
  price: number;
  image: string;
  badge: string;
  category?: string;
  stock?: number;
  /** Real delivery mode from the products table ("instant" | "manual" |
   *  "service") — drives the category view's Delivery Type filter. */
  fulfilmentType?: string;
}

const ProductCard: React.FC<{ item: FeaturedItem }> = ({ item }) => {
    const [quantity, setQuantity] = useState(1);
    const router = useRouter();

    const handleQuantityChange = (e: React.MouseEvent, change: number) => {
        e.preventDefault();
        e.stopPropagation();
        setQuantity(Math.max(1, quantity + change));
    };

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if the user clicked the quantity buttons or the buy button
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        router.push(`/product/${item.id}`);
    };

    return (
    <div
      onClick={handleCardClick}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-white shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-[0_24px_44px_-16px_rgba(15,23,42,0.20)] cursor-pointer"
    >
      {/* Cover — full-width 16/10 so the card composes at any column
          width (the old fixed 90px side thumb collapsed the text
          column in narrow grids, e.g. tablet with the sidebar). */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
         <img
            src={item.image || "https://picsum.photos/seed/default/400/225"}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transform transition-transform duration-700 group-hover:scale-[1.06]"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 via-transparent to-transparent pointer-events-none"></div>
         {item.badge && (
            <div className="absolute top-3 right-3 bg-primary-600 text-white text-[9px] px-2.5 py-1 font-bold shadow-lg z-10 rounded-full uppercase tracking-wider">
                {item.badge}
            </div>
         )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {item.category && (
            <div className="text-[10px] text-primary-600 font-bold uppercase tracking-[0.14em] mb-1.5 truncate">{item.category}</div>
        )}
        <h3 className="text-[15px] font-display font-semibold text-slate-900 line-clamp-2 group-hover:text-primary-700 transition-colors leading-snug" title={item.title}>
          {item.title}
        </h3>
        {/* F-27: delivery badges derive from the product's REAL
            fulfilmentType — a manual/service product is never
            labelled "Instant"/"Auto" (and vice versa). */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {(() => {
            const d = deliveryInfo(item.fulfilmentType);
            if (d.type === "instant") {
              return (
                <>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                    <Zap className="w-3 h-3 text-primary-500 fill-current" /> Instant
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                    <Clock className="w-3 h-3 text-blue-500" /> Auto
                  </span>
                </>
              );
            }
            if (d.type === "service") {
              return (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-1 rounded-md border border-violet-100">
                  <Briefcase className="w-3 h-3 text-violet-500" /> Service
                </span>
              );
            }
            return (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                <Clock className="w-3 h-3 text-amber-500" /> Manual
              </span>
            );
          })()}
        </div>

        <div className="mt-3.5 flex items-center gap-2.5 bg-slate-50 rounded-xl px-2.5 py-2 border border-slate-100">
            <div className="shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-white" />
                </div>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider leading-tight">Sold by</span>
                <span className="text-xs text-slate-900 font-semibold truncate leading-tight">Account Store One</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0 ml-auto" />
        </div>

        {/* Price leads the row now (label stacked over the figure, the
            way a price should read at a glance); the right side carries
            the offer's real sold count as quiet social proof instead of
            leaving the row half empty. */}
        <div className="mt-4 flex items-end justify-between gap-3">
            <div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.18em] leading-none mb-1.5">Price</div>
                <div className="font-display font-bold text-slate-900 text-2xl leading-none flex items-baseline gap-0.5">
                    <span className="text-primary-600 text-sm">$</span>
                    {item.price.toFixed(2)}
                </div>
            </div>
            {item.sold > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400 pb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-[11px] font-semibold whitespace-nowrap">{item.sold} sold</span>
                </div>
            )}
        </div>

        {/* Quantity and Buy Button — 44px-tall controls; the row wraps
            on narrow cards so nothing ever squeezes. */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 relative z-20">
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
                <button
                    onClick={(e) => handleQuantityChange(e, -1)}
                    aria-label="Decrease quantity"
                    className="w-11 h-11 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
                >
                    <Minus size={15} />
                </button>
                <span className="w-7 text-center text-[13px] font-bold text-slate-900">{quantity}</span>
                <button
                    onClick={(e) => handleQuantityChange(e, 1)}
                    aria-label="Increase quantity"
                    className="w-11 h-11 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
                >
                    <Plus size={15} />
                </button>
            </div>
            {item.stock !== undefined && item.stock <= 0 ? (
              <span className="flex-1 min-w-[128px] h-11 bg-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                Out of Stock
              </span>
            ) : (
              <Link
                href={`/checkout/${item.id}?quantity=${quantity}`}
                className="flex-1 min-w-[128px] h-11 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group/btn"
              >
                Buy Now
                <Zap className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform fill-current" />
              </Link>
            )}
        </div>
      </div>
    </div>
  );
};

interface MainContentProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  /** Server-rendered data from Prisma (SEO port). When provided, the
   *  component renders it immediately (including in SSR HTML) and skips
   *  the legacy client fetch. When undefined, behaviour is unchanged. */
  initialProducts?: StoreProduct[];
  initialCategories?: StoreCategory[];
  initialReviews?: StoreReview[];
  /** Storefront CMS: per-section visibility + resolved titles, and the
   *  admin-chosen ordering of the homepage sections. */
  sections: StorefrontSettings["sections"];
  sectionOrder: HomeSectionId[];
}

import { useSearch } from "./SearchContext";
import type {
  StoreProduct,
  StoreCategory,
  StoreReview,
  StorefrontSettings,
  HomeSectionId,
} from "../lib/store-types";

/** Section heading with the design's two-tone treatment: all words but
 *  the last in ink, the last word accented. With the design's default
 *  titles this reproduces the original headings exactly. A spaceless
 *  single-token title ("FeaturedList") is camel-split first, so it can
 *  never render glued (F-21). */
function SplitTitle({ title, accentClassName }: { title: string; accentClassName: string }) {
  let parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    parts = title
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/\s+/)
      .filter(Boolean);
  }
  if (parts.length <= 1) return <>{title}</>;
  return (
    <>
      {parts.slice(0, -1).join(" ")}{" "}
      <span className={accentClassName}>{parts[parts.length - 1]}</span>
    </>
  );
}

function toFeaturedItem(p: StoreProduct): FeaturedItem {
  return {
    id: p.id,
    title: p.title,
    sold: p.sold,
    price: p.price,
    image: p.image ?? "",
    badge: p.badge ?? "",
    category: p.category ?? undefined,
    stock: p.stock,
    fulfilmentType: p.fulfilmentType,
  };
}

/** The real delivery modes a product can have (products.fulfilment_type).
 *  The category filter offers these — with live counts — instead of the
 *  old decorative "Account Type" list, which mapped to no data at all. */
const DELIVERY_TYPES = [
  { id: "instant", label: "Instant Delivery" },
  { id: "manual", label: "Manual Delivery" },
  { id: "service", label: "Service" },
] as const;

/** Map a Prisma-shaped review onto the shape this component renders. */
function toUiReview(r: StoreReview) {
  return {
    buyer: r.username ?? "Anonymous",
    text: r.comment ?? "",
    date: r.createdAt.slice(0, 10),
    type: r.rating >= 4 ? "positive" : "negative",
  };
}

export function MainContent({
  selectedCategory,
  setSelectedCategory,
  initialProducts,
  initialCategories,
  initialReviews,
  sections,
  sectionOrder,
}: MainContentProps) {
  const orderOf = (id: HomeSectionId) => sectionOrder.indexOf(id) + 1;
  const { searchQuery, setSearchQuery } = useSearch();
  // Server data only short-circuits the legacy client fetch when it
  // actually contains products; while the Neon products table is still
  // empty (pre data-migration) the component keeps its previous behaviour.
  const hasServerData = (initialProducts?.length ?? 0) > 0;
  const [loading, setLoading] = useState(!hasServerData);
  const [allProducts, setAllProducts] = useState<FeaturedItem[]>(() =>
    (initialProducts ?? []).map(toFeaturedItem),
  );
  const [dbCategories, setDbCategories] = useState<any[]>(
    () => initialCategories ?? [],
  );
  const [dbReviews, setDbReviews] = useState<any[]>(() =>
    (initialReviews ?? []).map(toUiReview),
  );

  // Category-view filters (F-05) — all applied client-side over the
  // products already loaded for the view: name substring, price bounds,
  // delivery-type checkboxes, and the Accounts / Subscriptions tabs.
  const [nameFilter, setNameFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [deliverySel, setDeliverySel] = useState<string[]>([]);
  const [kindTab, setKindTab] = useState<"accounts" | "subscriptions">("accounts");
  // Mobile category view: the filter column stays collapsed behind the
  // Filters button below md (always visible on md+, where the class
  // swap below is overridden by md:block).
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Reviews paging (F-23): reveal loaded reviews in steps; the button
  // disappears once everything loaded is on screen.
  const [reviewsShown, setReviewsShown] = useState(4);

  useEffect(() => {
    // Server-rendered data was passed in — nothing to fetch client-side.
    if (hasServerData) {
      setLoading(false);
      return;
    }
    async function fetchData() {
        try {
            setLoading(true);
            const [prodRes, catRes, revRes] = await Promise.all([
                // Fix Round 6 (video-gap #9): storefront honours the
                // admin-set manual display order (sort_order asc),
                // newest first only as the tiebreak.
                db.from('products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
                db.from('categories').select('*').order('name', { ascending: true }),
                db.from('reviews').select('*').order('created_at', { ascending: false }).limit(6)
            ]);

            if (prodRes.error) throw prodRes.error;
            setAllProducts((prodRes.data || []).map((r: any) => ({
                ...r,
                fulfilmentType: r.fulfilment_type ?? r.fulfilmentType ?? undefined,
            })));
            setDbCategories(catRes.data || []);
            setDbReviews((revRes.data || []).map((r: any) => ({
                buyer: r.username || "Anonymous",
                text: r.comment || "",
                date: (r.created_at || "").slice(0, 10),
                type: r.rating >= 4 ? "positive" : "negative",
            })));
        } catch (err: any) {
            console.error("Fetch Error:", err.message);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, []);

  const featuredItems = useMemo(() => {
    return allProducts.slice(0, 3);
  }, [allProducts]);

  const trendingItems = useMemo(() => {
    return [...allProducts].reverse().slice(0, 3);
  }, [allProducts]);

  const categories = useMemo(() => {
      if (dbCategories.length > 0) return dbCategories;
      // Fallback if DB empty (optional, but requested to remove demo results)
      return [];
  }, [dbCategories]);

  // Per-category product counts for the home category tiles. Counting
  // source of truth (Fix Round 5): products carry their category as a
  // NAME string, so the real count for a category is the loaded
  // products grouped by that name — the same grouping the "Category
  // Wise Products" sections below already render from. Derived from
  // the same allProducts list the storefront displays (active,
  // unexpired listings), so a tile's count matches what opening the
  // category can actually show.
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of allProducts) {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [allProducts]);
  const reviews = useMemo(() => dbReviews, [dbReviews]);

  const products = useMemo(() => {
    let filtered = allProducts;
    
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return filtered;
    }

    if (selectedCategory === 'All') return allProducts;
    return allProducts.filter(p => p.category === selectedCategory || selectedCategory === 'Accounts');
  }, [selectedCategory, allProducts, searchQuery]);

  // Live counts for the Delivery Type filter — computed from the
  // products in the current category view, so they always reflect real
  // stock (the old panel hard-coded 0 next to invented types).
  const deliveryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const t = p.fulfilmentType ?? "manual";
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  // Category-view default tab (live spot-check fix, 2026-11-02): when a
  // category view opens, land on the first tab that actually has offers
  // for that category. The tabs split the category's offers into
  // non-subscription ("Available Accounts") vs subscription (the
  // Streaming category's offers, see visibleProducts) — a category
  // whose offers are ALL subscriptions must not greet the visitor with
  // the empty Accounts tab. Applied once per category entry: going
  // back to 'All' re-arms it, and a manual tab switch during the visit
  // is never overridden. When both tabs have offers — or neither does —
  // the standing default ("accounts") is kept.
  const kindDefaultAppliedFor = useRef<string | null>(null);
  useEffect(() => {
    if (selectedCategory === "All") {
      kindDefaultAppliedFor.current = null;
      return;
    }
    // Wait until the view's product list has actually loaded, and
    // never fight the search view (the category view is hidden then).
    if (searchQuery || loading) return;
    if (kindDefaultAppliedFor.current === selectedCategory) return;
    const subsCount = products.reduce(
      (n, p) => n + (p.category === "Streaming" ? 1 : 0),
      0,
    );
    setKindTab(
      products.length - subsCount === 0 && subsCount > 0
        ? "subscriptions"
        : "accounts",
    );
    kindDefaultAppliedFor.current = selectedCategory;
  }, [selectedCategory, products, loading, searchQuery]);

  // The category grid after every filter is applied (F-05). Products
  // without delivery metadata count as "manual" (the schema default).
  // "Subscriptions" means the Streaming category — the store's only
  // subscription offers; "Available Accounts" is everything else.
  const visibleProducts = useMemo(() => {
    let list = products.filter((p) =>
      kindTab === "subscriptions" ? p.category === "Streaming" : p.category !== "Streaming",
    );
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    const min = parseFloat(priceMin);
    if (!Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    const max = parseFloat(priceMax);
    if (!Number.isNaN(max)) list = list.filter((p) => p.price <= max);
    if (deliverySel.length > 0) {
      list = list.filter((p) => deliverySel.includes(p.fulfilmentType ?? "manual"));
    }
    return list;
  }, [products, kindTab, nameFilter, priceMin, priceMax, deliverySel]);

  const filtersActive =
    nameFilter.trim() !== "" || priceMin !== "" || priceMax !== "" || deliverySel.length > 0;

  const clearFilters = () => {
    setNameFilter("");
    setPriceMin("");
    setPriceMax("");
    setDeliverySel([]);
  };

  const toggleDelivery = (id: string) =>
    setDeliverySel((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  // Empty-state copy (F-26) — distinguishes an empty category from
  // filters that excluded everything.
  const emptyMessage =
    products.length === 0
      ? `No offers are listed under ${selectedCategory} yet. Try another category from the storefront.`
      : filtersActive
        ? "No offers match the current filters. Clear them to see everything in this category."
        : kindTab === "subscriptions"
          ? "No subscription offers in this view — subscriptions are the Streaming category. Switch to Available Accounts, or open the Streaming category."
          : kindTab === "accounts" && products.every((p) => p.category === "Streaming")
            ? "Every offer in this category is a subscription — switch to the Subscriptions tab to see them."
            : "Nothing to show in this view right now.";

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Search Results (homepage sections render below in CMS order) */}
      <AnimatePresence mode="wait">
      {searchQuery ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
             {/* The query stays editable here (F-06): typing in the hero
                 box switches to this view, so the search box must live
                 here too — clearing it returns to the storefront. */}
             <div className="relative mb-8 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search premium accounts, categories..."
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all duration-300 shadow-sm"
                />
             </div>
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <Search className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Search <span className="text-primary-600">Results</span></h2>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Found{" "}<span className="text-primary-600">{products.length}</span>{" "}Matching Offers
                </div>
             </div>
             
             {products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center flex flex-col items-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No results found for "{searchQuery}"</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Try checking your spelling or using more general keywords to find what you're looking for.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {products.map((item) => (
                        <ProductCard key={item.id} item={item} />
                    ))}
                </div>
             )}
          </motion.div>
      ) : null}
      </AnimatePresence>

      {/* Featured List — homepage section (CMS: visibility, title, order) */}
      {!searchQuery && selectedCategory === 'All' && sections.featured.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ order: orderOf("featured") }}
          >
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight"><SplitTitle title={sections.featured.title} accentClassName="text-primary-600" /></h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {featuredItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>
          </motion.div>
      )}

      {/* Trending Products — homepage section (CMS: visibility, title, order) */}
      {!searchQuery && selectedCategory === 'All' && sections.trending.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ order: orderOf("trending") }}
          >
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight"><SplitTitle title={sections.trending.title} accentClassName="text-blue-600" /></h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {trendingItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>
          </motion.div>
      )}

      {/* All Categories / Products List - Hide when searching. In the
          'All' view this card is the CMS "categories" homepage section
          (toggleable + orderable); in a category view it is the product
          listing itself and always renders. */}
      {!searchQuery && (selectedCategory !== 'All' || sections.categories.enabled) && (
        <div className="bg-white rounded-[1.75rem] border border-slate-200 p-4 sm:p-6 lg:p-8 mb-12 relative overflow-hidden shadow-sm" style={{ order: orderOf("categories") }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          {selectedCategory === 'All' ? (
            <>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <Award className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight"><SplitTitle title={sections.categories.title} accentClassName="text-primary-600" /></h2>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 mb-8 border-b border-slate-100 scrollbar-hide">
                    {['Accounts', 'Items', 'Money', 'Boosting', 'Video Games', 'Top Up'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleCategoryClick(tab === 'Accounts' ? 'All' : tab === 'Top Up' ? 'Game Top Up' : tab)}
                            className={`${tab === 'Accounts' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-900'} py-3 px-2 min-h-[44px] text-sm font-semibold whitespace-nowrap transition-all duration-300`}
                        >
                            {tab} {tab === 'Accounts' && <span className="ml-1 opacity-50">({allProducts.length})</span>}
                        </button>
                    ))}
                </div>

                {/* F-06: bound to the same SearchContext the header
                    modal drives, so this box and the modal behave
                    identically. Typing switches to the Search Results
                    view, where the query stays editable. */}
                <div className="relative mb-10 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search across all premium accounts..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 focus:bg-white transition-all duration-300 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {categories.map((cat, idx) => {
                        const count = categoryCounts.get(cat.name) ?? 0;
                        return (
                        <div
                            key={cat.id || idx}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white hover:border-primary-500/30 hover:shadow-md transition-all duration-500 cursor-pointer relative group h-28 shadow-sm"
                        >
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-widest">{cat.name}</span>
                            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{count} {count === 1 ? "product" : "products"}</span>
                        </div>
                        );
                    })}
                </div>

                {/* Category Wise Products */}
                {categories.slice(0, 3).map((cat) => {
                    const catProducts = allProducts.filter(p => p.category === cat.name);
                    if (catProducts.length === 0) return null;
                    return (
                        <div key={cat.name} className="mb-12 last:mb-0">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-bold text-slate-900 mb-1">{cat.name}</h3>
                                    <div className="h-1 w-12 bg-primary-600 rounded-full"></div>
                                </div>
                                <button 
                                    onClick={() => handleCategoryClick(cat.name)} 
                                    className="text-xs font-bold text-primary-600 hover:text-primary-500 uppercase tracking-widest flex items-center gap-2 group py-2.5 px-1 -mr-1 min-h-[44px]"
                                >
                                    Explore All
                                    <TrendingUp className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                {catProducts.slice(0, 3).map((item) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </>
        ) : (
            <div className="flex flex-col gap-6">
                {/* Results header — full width, so on mobile the products
                    lead and the filters collapse behind the Filters
                    button instead of filling the first screen. */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <button
                        onClick={() => handleCategoryClick('All')}
                        className="min-h-[44px] text-xs font-bold text-slate-400 hover:text-primary-600 flex items-center gap-2 uppercase tracking-widest transition-colors group"
                    >
                        <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-primary-50 transition-colors">
                            <TrendingUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                        </div>
                        Back to Store
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Showing{" "}<span className="text-slate-900">{visibleProducts.length}</span>{" "}Results
                        </div>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                            className="md:hidden min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-primary-600" />
                            Filters{filtersActive ? ` (${(nameFilter.trim() ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + deliverySel.length})` : ""}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar Filters — every control is live (F-05) */}
                <div className={`${filtersOpen ? "block" : "hidden"} md:block w-full md:w-72 shrink-0`}>
                  <div className="space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest text-primary-600">Search Offers</h3>
                        <div className="relative">
                            <input
                                type="text"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                placeholder="Filter by name..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm"
                            />
                            <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-300" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest text-primary-600">Price Range</h3>
                        <div className="flex gap-3 items-center">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={priceMin}
                                onChange={(e) => setPriceMin(e.target.value)}
                                placeholder="Min"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm"
                            />
                            <span className="text-slate-300">—</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={priceMax}
                                onChange={(e) => setPriceMax(e.target.value)}
                                placeholder="Max"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Delivery Type</h3>
                                <MinusCircle className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="space-y-3">
                                {DELIVERY_TYPES.map((t) => {
                                    const checked = deliverySel.includes(t.id);
                                    return (
                                        <label key={t.id} className="flex items-center justify-between group cursor-pointer py-2">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={checked}
                                                    onChange={() => toggleDelivery(t.id)}
                                                />
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-inner ${checked ? "border-primary-500 bg-primary-500" : "border-slate-200 bg-slate-50 group-hover:border-primary-500"}`}>
                                                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className={`text-sm transition-colors ${checked ? "text-slate-900 font-medium" : "text-slate-500 group-hover:text-slate-900"}`}>{t.label}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">{deliveryCounts[t.id] ?? 0}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed mt-4">
                                Filter by how an offer is delivered. Counts reflect the offers in this category.
                            </p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Right Product Grid */}
                <div className="flex-1 min-w-0">
                    {/* Segmented pill control (was an underline tab row
                        whose second tab clipped off the phone screen —
                        "SUBS…" — and read as broken). Both options now
                        fit side by side at 360px; the active pill is a
                        raised white thumb on a slate track. */}
                    <div className="flex p-1 gap-1 mb-8 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-hide">
                         <button
                            type="button"
                            onClick={() => setKindTab("accounts")}
                            aria-pressed={kindTab === "accounts"}
                            className={`flex-1 min-h-[44px] px-3 sm:px-6 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                                kindTab === "accounts"
                                    ? "bg-white text-primary-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                         >
                            Available Accounts
                         </button>
                         <button
                            type="button"
                            onClick={() => setKindTab("subscriptions")}
                            aria-pressed={kindTab === "subscriptions"}
                            className={`flex-1 min-h-[44px] px-3 sm:px-6 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                                kindTab === "subscriptions"
                                    ? "bg-white text-primary-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                            }`}
                         >
                            Subscriptions
                         </button>
                    </div>

                    {visibleProducts.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-16 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">No offers found</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto">{emptyMessage}</p>
                            {filtersActive && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-6 px-6 py-3 rounded-xl bg-primary-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-primary-500 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                            {visibleProducts.map((item) => (
                                <ProductCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
                </div>
            </div>
        )}
      </div>
      )}

      {/* Customer Reviews — homepage section (CMS: visibility, title, order) */}
      {sections.reviews.enabled && (
      <div className="bg-white rounded-[1.75rem] border border-slate-200 p-4 sm:p-6 lg:p-8 mb-12 shadow-sm" style={{ order: orderOf("reviews") }}>
        <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                    <Star className="w-5 h-5 text-primary-600 fill-current" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight"><SplitTitle title={sections.reviews.title} accentClassName="text-primary-600" /></h2>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="text-primary-600">{reviews.length}</span>{" "}Recent Reviews
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            {reviews.slice(0, reviewsShown).map((review, idx) => (
                <div key={idx} className="bg-white p-6 hover:bg-slate-50 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {review.type === 'positive' ? (
                                <div className="flex items-center gap-1.5 text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary-100">
                                    <ThumbsUp className="w-3 h-3 fill-current" />
                                    <span>Recommended</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-100">
                                    <MinusCircle className="w-3 h-3" />
                                    <span>Issues</span>
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{review.date}</div>
                    </div>
                    
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 group-hover:text-slate-900 transition-colors line-clamp-3 italic">
                        "{review.text}"
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-primary-600 border border-slate-200">
                                {review.buyer.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-900 tracking-tight">{review.buyer}</span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Verified Buyer</span>
                            </div>
                        </div>
                        <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(i => (
                                <Star key={i} className="w-3 h-3 text-primary-500 fill-current" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* F-23: the button pages in more of the loaded reviews and is
            hidden once everything is shown; with no reviews at all, an
            honest empty state replaces it. */}
        {reviews.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-400 font-medium">
                No reviews yet — reviews appear here once buyers rate completed orders.
            </p>
        ) : reviewsShown < reviews.length ? (
            <div className="mt-10 flex justify-center">
                <button
                    type="button"
                    onClick={() => setReviewsShown((s) => s + 4)}
                    className="px-10 py-4 rounded-xl border border-primary-200 text-primary-600 text-xs font-bold uppercase tracking-widest hover:bg-primary-50 hover:border-primary-500 transition-all duration-300 shadow-sm"
                >
                    Load More Testimonials
                </button>
            </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
