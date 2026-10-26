"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingCart, Zap, Clock, ThumbsUp, Star, Copy, Check, Crown,
  MessageSquare, Share2, ChevronRight, Shield, ShieldCheck, BadgeCheck, AlertCircle, Plus, Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../lib/dbclient";
import { auth } from "../lib/auth-client";
import { SellerTrustCard, StockIntelligence, DeliveryTimeline, TrustBadges } from "../components/ProductTrustSystem";
import { StoreClosedBanner } from "../components/StoreClosedBanner";
import { PageLoader } from "../components/SkeletonUI";

interface Product {
  id: string;
  title: string;
  sold: number;
  price: number;
  image: string;
  badge: string;
  description: string;
  stock: number;
  category?: string;
  // Z2U alignment P2 (optional — older payloads may lack them).
  deliveryEtaHours?: number | null;
  minQuantity?: number;
  specs?: { key: string; label: string; value: string }[];
  variants?: { label: string; priceDelta: number; stock?: number | null }[];
  // Fulfilment types (camelCase from the server page, snake_case from
  // the client-fetch fallback — both read below).
  fulfilmentType?: string;
  fulfilment_type?: string;
  warrantyDays?: number | null;
  warranty_days?: number | null;
}

export function ProductDetailsPage({
  initialProduct,
}: {
  /** Server-rendered product from Prisma (SEO port). When provided, the
   *  screen renders it immediately — including in the SSR HTML — and the
   *  legacy client fetch is skipped. */
  initialProduct?: Product | null;
} = {}) {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState<Product | null>(
    initialProduct ?? null,
  );
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState<any[]>([]);
  const [variantLabel, setVariantLabel] = useState("");

  useEffect(() => {
    if (!id) return;
    db.from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }: any) => setReviews(data || []));
  }, [id]);

  // Reviews are written from the completed order (P3) — the open
  // product-page form is gone; see the note under the review list.

  useEffect(() => {
    async function fetchProduct() {
        try {
            setLoading(true);
            const { data, error } = await db
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProduct(data);
        } catch (err: any) {
            console.error("Fetch error:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    if (id && !initialProduct) fetchProduct();
  }, [id, initialProduct]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Variants / quantity rules (P2): the selected variant adjusts the
  // unit price and may cap stock; quantity never goes below the
  // product's minimum order quantity.
  const variants = product?.variants || [];
  const activeVariant = variants.find((v) => v.label === variantLabel) || variants[0] || null;
  const unitPrice = (product?.price || 0) + (activeVariant ? Number(activeVariant.priceDelta) || 0 : 0);
  const minQty = Math.max(1, product?.minQuantity || 1);
  const fulfilment = product?.fulfilmentType || product?.fulfilment_type || "manual";
  const warrantyDays = product?.warrantyDays ?? product?.warranty_days ?? null;
  const stockCap = activeVariant && activeVariant.stock != null ? Number(activeVariant.stock) : (product?.stock || 0);
  const qty = Math.min(Math.max(quantity, minQty), Math.max(stockCap, minQty));

  if (loading) return <PageLoader label="Synchronizing Asset Data..." />;

  if (error || !product) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Asset Not Found</h2>
              <p className="text-slate-400 text-sm mb-8">The digital asset protocol you are looking for has been moved or delisted.</p>
              <Link href="/" className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Return to Hub</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Link href="/" className="hover:text-primary-600 transition-colors">Marketplace</Link>
              <ChevronRight size={12} />
              <span className="text-primary-600">{product.category || "Gaming Assets"}</span>
              <ChevronRight size={12} />
              <span className="truncate max-w-[200px] text-slate-900">{product.title}</span>
          </div>
      </div>

      <StoreClosedBanner />

      <div className="container mx-auto px-4 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Visuals */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-[2.5rem] overflow-hidden border border-slate-200 bg-white aspect-video group shadow-xl"
            >
              <img src={product.image || "https://picsum.photos/seed/default/800/450"} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-60"></div>
              
              <div className="absolute top-6 left-6">
                <span className="bg-primary-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary-500/20">
                    {product.badge || "Verified"}
                </span>
              </div>

              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                 <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
                    <Zap size={14} className="text-primary-600 fill-current" />
                    Instant Clearance
                 </div>
                 <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
                    <ShieldCheck size={14} className="text-blue-600" />
                    TitanGuard Secured
                 </div>
              </div>
            </motion.div>

            {/* Tabs Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 min-h-[300px] shadow-sm">
                <div className="flex gap-8 border-b border-slate-100 mb-8">
                    {["description", "delivery", "warranty"].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] relative transition-colors ${
                                activeTab === tab ? "text-primary-600" : "text-slate-400 hover:text-slate-900"
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 shadow-[0_0_10px_rgba(20,184,166,0.3)]" />
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-slate-500 leading-relaxed font-medium"
                    >
                        {activeTab === "description" && (
                            <div className="space-y-6">
                                <p className="text-slate-700 text-lg font-medium whitespace-pre-wrap">
                                    {product.description ? product.description.split('--- Properties ---')[0].trim() : "Detailed digital asset specification is currently being synchronized."}
                                </p>
                                
                                {/* Specification list (P2): real per-category
                                    spec values first; the legacy description
                                    "--- Properties ---" block still renders
                                    for older listings. No invented claims. */}
                                {product.specs && product.specs.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {product.specs.map((s) => (
                                            <div key={s.key} className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest">{s.label}</span>
                                                <span className="text-slate-900 text-xs font-bold text-right">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : product.description?.includes('--- Properties ---') ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {product.description.split('--- Properties ---')[1].trim().split('\n').filter(Boolean).map((prop, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                <BadgeCheck size={18} className="text-primary-600 shrink-0" />
                                                <span className="text-slate-900 text-xs font-bold">{prop.trim()}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        )}
                        {activeTab === "delivery" && (
                            <div className="p-8 bg-primary-50 rounded-3xl border border-primary-100">
                                <h4 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-primary-600" />
                                    Automated Transmission
                                </h4>
                                <p className="text-slate-600">As soon as your payment is verified, the credentials appear in the Credential Vault on your order page. When the item is in stock delivery is automatic; otherwise the store delivers manually. Your payment stays held in escrow until you confirm receipt — open a dispute from the order page if anything is wrong.</p>
                            </div>
                        )}
                        {activeTab === "warranty" && (
                            <div className="space-y-4">
                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                                    <Shield size={24} className="text-blue-600 shrink-0" />
                                    <div>
                                        <h4 className="text-slate-900 font-bold mb-1">Buyer Protection</h4>
                                        <p className="text-xs text-slate-600">Covered by the store's Buyer Protection: if the delivered credentials don't work, open a dispute on your order page and the store will replace the item or refund you to your wallet. See the Buyer Protection page for the full policy.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Customer Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium mb-6">No reviews yet — be the first to review this product after your purchase.</p>
                ) : (
                    <div className="space-y-4 mb-8">
                        {reviews.map((r) => (
                            <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-900">{r.username || "Customer"}</span>
                                    <span className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} size={11} className={i <= r.rating ? "text-yellow-500 fill-current" : "text-slate-300"} />
                                        ))}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">{r.comment}</p>
                                {r.admin_reply && (
                                    <div className="mt-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Store reply</p>
                                        <p className="text-[13px] text-slate-700 font-medium">{r.admin_reply}</p>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{(r.created_at || "").slice(0, 10)}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Bought this item?</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Reviews are tied to real purchases: once your order is completed, you can rate it — including delivery speed and service — right from the order page.
                    </p>
                    <Link href="/dashboard" className="inline-block mt-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        Go to My Orders
                    </Link>
                </div>
            </div>
          </div>

          {/* Right Column: Order Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 relative overflow-hidden shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/5 blur-[60px] rounded-full"></div>
              
              <div className="relative z-10">
                <h1 className="text-3xl font-display font-bold text-slate-900 mb-4 leading-tight">{product.title}</h1>
                
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={14} className="text-primary-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sold || 0}+ Acquisitions</span>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-[10px] text-primary-600 font-bold uppercase tracking-[0.3em] mb-2">Market Settlement</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-display font-bold text-slate-900">${unitPrice.toFixed(2)}</span>
                        <span className="text-slate-400 text-xs font-bold uppercase">USD</span>
                    </div>
                    {product.deliveryEtaHours ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <Clock size={13} className="text-primary-600" /> Delivery within ~{product.deliveryEtaHours} hours of payment verification
                        </p>
                    ) : null}
                    {/* Fulfilment type + warranty (fulfilment types build) */}
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        {fulfilment === "instant" ? (
                            <><Zap size={13} className="text-primary-600" /> Instant delivery — credentials arrive automatically right after payment is verified</>
                        ) : fulfilment === "service" ? (
                            <><MessageSquare size={13} className="text-primary-600" /> Service — details required at checkout; the store performs the work and posts progress + proof on your order</>
                        ) : (
                            <><Clock size={13} className="text-primary-600" /> Manual delivery — the store sends your credentials after payment is verified</>
                        )}
                    </p>
                    {warrantyDays ? (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-[11px] font-bold">
                            <ShieldCheck size={13} /> {`${warrantyDays}-day warranty`}
                        </span>
                    ) : null}
                </div>

                {/* Variant selector (P2) */}
                {variants.length > 0 && (
                    <div className="mb-6">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-2.5">Option</div>
                        <div className="flex flex-wrap gap-2">
                            {variants.map((v) => {
                                const active = (activeVariant?.label || "") === v.label;
                                const p = product.price + (Number(v.priceDelta) || 0);
                                return (
                                    <button
                                        key={v.label}
                                        onClick={() => { setVariantLabel(v.label); setQuantity(minQty); }}
                                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                                    >
                                        {v.label} · ${p.toFixed(2)}
                                        {v.stock != null && v.stock <= 0 ? " · sold out" : ""}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Stock Intelligence */}
                <div className="mb-6">
                  <StockIntelligence stock={stockCap} />
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity{minQty > 1 ? ` (min ${minQty})` : ""}</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setQuantity(Math.max(minQty, qty - 1))} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Minus size={16} /></button>
                            <span className="text-lg font-bold text-slate-900 w-6 text-center">{qty}</span>
                            <button onClick={() => setQuantity(Math.min(stockCap || minQty, qty + 1))} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Plus size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    {stockCap <= 0 ? (
                        <span className="w-full bg-slate-100 text-slate-400 font-bold py-5 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest cursor-not-allowed">
                            Out of Stock
                        </span>
                    ) : (
                        <Link
                            href={`/checkout/${product.id}?quantity=${qty}${activeVariant ? `&variant=${encodeURIComponent(activeVariant.label)}` : ""}`}
                            className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 transition-all text-sm uppercase tracking-widest"
                        >
                            <Zap size={20} fill="currentColor" />
                            Buy Now — ${(unitPrice * qty).toFixed(2)}
                        </Link>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                         <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm">
                            <MessageSquare size={16} /> Contact Seller
                         </button>
                         <button 
                            onClick={handleCopyLink}
                            className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                         >
                            {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />} 
                            {copied ? "Copied!" : "Share"}
                         </button>
                    </div>
                </div>

                {/* Trust Badges */}
                <TrustBadges />
              </div>
            </div>

            {/* Delivery Timeline */}
            <DeliveryTimeline />

            {/* Seller Trust Card */}
            <SellerTrustCard />
          </div>
        </div>
      </div>
    </div>
  );
}
