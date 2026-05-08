import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ShoppingCart, Zap, Clock, ThumbsUp, Star, Copy, Check, Crown,
  MessageSquare, Share2, ChevronRight, Shield, BadgeCheck, AlertCircle, Plus, Minus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { SellerTrustCard, StockIntelligence, DeliveryTimeline, TrustBadges } from "../components/ProductTrustSystem";
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
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    async function fetchProduct() {
        try {
            setLoading(true);
            const { data, error } = await supabase
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
    if (id) fetchProduct();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <PageLoader label="Synchronizing Asset Data..." />;

  if (error || !product) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Asset Not Found</h2>
              <p className="text-slate-400 text-sm mb-8">The digital asset protocol you are looking for has been moved or delisted.</p>
              <Link to="/" className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Return to Hub</Link>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Breadcrumbs */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Link to="/" className="hover:text-primary-600 transition-colors">Marketplace</Link>
              <ChevronRight size={12} />
              <span className="text-primary-600">{product.category || "Gaming Assets"}</span>
              <ChevronRight size={12} />
              <span className="truncate max-w-[200px] text-slate-900">{product.title}</span>
          </div>
      </div>

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
                                
                                {/* Dynamic Z2U Properties */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.description?.includes('--- Properties ---') ? (
                                        product.description.split('--- Properties ---')[1].trim().split('\n').map((prop, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                <BadgeCheck size={18} className="text-primary-600 shrink-0" />
                                                <span className="text-slate-900 text-xs font-bold">{prop.trim()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        /* Fallback for legacy products */
                                        ["Full Access Guaranteed", "Global Region Unlocked", "Instant Transfer", "Verified Clean Record"].map((f, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                                <BadgeCheck size={18} className="text-primary-600 shrink-0" />
                                                <span className="text-slate-900 text-xs font-bold">{f}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === "delivery" && (
                            <div className="p-8 bg-primary-50 rounded-3xl border border-primary-100">
                                <h4 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-primary-600" />
                                    Automated Transmission
                                </h4>
                                <p className="text-slate-600">Upon successful settlement, the digital asset credentials will be transmitted directly to your secure portal and registered email address. Typical resolution time: <strong>Millisecond clearance.</strong></p>
                            </div>
                        )}
                        {activeTab === "warranty" && (
                            <div className="space-y-4">
                                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                                    <Shield size={24} className="text-blue-600 shrink-0" />
                                    <div>
                                        <h4 className="text-slate-900 font-bold mb-1">Lifetime Governance</h4>
                                        <p className="text-xs text-slate-600">This asset is covered by our full-term warranty protocol. Any divergence from specification will result in immediate replacement or credits.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
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
                        <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-yellow-500 fill-current" />)}
                        </div>
                        <span className="text-xs font-bold text-slate-400">5.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={14} className="text-primary-600" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.sold || 0}+ Acquisitions</span>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="text-[10px] text-primary-600 font-bold uppercase tracking-[0.3em] mb-2">Market Settlement</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-display font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        <span className="text-slate-400 text-xs font-bold uppercase">USD</span>
                    </div>
                </div>

                {/* Stock Intelligence */}
                <div className="mb-6">
                  <StockIntelligence stock={product.stock || 0} />
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quantity</span>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Minus size={16} /></button>
                            <span className="text-lg font-bold text-slate-900 w-6 text-center">{quantity}</span>
                            <button onClick={() => setQuantity(quantity+1)} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><Plus size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <Link 
                        to={`/checkout/${product.id}?quantity=${quantity}`}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 transition-all text-sm uppercase tracking-widest"
                    >
                        <Zap size={20} fill="currentColor" />
                        Buy Now — ${(product.price * quantity).toFixed(2)}
                    </Link>
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
