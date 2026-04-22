import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ShoppingCart, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ThumbsUp, 
  Star, 
  Copy, 
  Check, 
  Crown, 
  MessageSquare, 
  Share2,
  ChevronRight,
  Shield,
  BadgeCheck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  title: string;
  sold: number;
  price: number;
  image: string;
  badge: string;
  description: string;
  features: string[];
  stock: number;
  deliveryTime: string;
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    // Simulated API call - normally would fetch from actual backend
    const mockProducts: Record<string, Product> = {
        "1": {
            id: 1,
            title: "HULU NO ADS 🔥 FAST DELIVERY 🔥 3 MONTHS SUBSCRIPTION",
            sold: 676,
            price: 3.00,
            image: "https://picsum.photos/seed/hulu/800/450",
            badge: "🔥 HOT",
            description: "Get access to Hulu (No Ads) plan for 3 months. Enjoy thousands of shows and movies without commercial breaks. This is a shared account with a private profile. Full warranty included for the duration of the subscription.",
            features: ["No Ads", "4K UHD Quality", "3 Months Warranty", "Fast Delivery", "Multiple Devices"],
            stock: 120,
            deliveryTime: "Instant"
        },
        "2": {
            id: 2,
            title: "Personal Account - NFLX 30days 4K UHD Premium - 1 Month-Need VPN",
            sold: 11886,
            price: 2.75,
            image: "https://picsum.photos/seed/netflix/800/450",
            badge: "NETFLIX",
            description: "Premium Netflix account for 30 days. Supports 4K UHD streaming. This account requires a VPN for certain regions. Private profile with your own name and PIN.",
            features: ["4K UHD", "4 Screens", "30 Days Warranty", "VPN Required", "Private Profile"],
            stock: 50,
            deliveryTime: "5-10 Minutes"
        },
        "5": {
            id: 5,
            title: "Disney+ Premium 12 Months Subscription [Private Account]",
            sold: 892,
            price: 15.50,
            image: "https://picsum.photos/seed/disney/800/450",
            badge: "Disney+",
            description: "Full 1 year access to Disney+. Access the worlds of Disney, Pixar, Marvel, Star Wars, and National Geographic. Private account that you can secure with your own password.",
            features: ["12 Months Warranty", "Private Account", "4K Streaming", "Unlimited Downloads", "Support 24/7"],
            stock: 15,
            deliveryTime: "Instant"
        }
    };

    const foundProduct = mockProducts[id || ""] || mockProducts["1"];
    setProduct(foundProduct);
    setLoading(false);
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-white mb-2">Digital Asset Not Found</h2>
        <p className="text-dark-50/40 mb-8">The requested item has been delisted or does not exist.</p>
        <Link to="/" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white pb-20">
      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-dark-50/30">
            <Link to="/" className="hover:text-primary-400 transition-colors">Marketplace</Link>
            <ChevronRight size={12} />
            <span className="text-dark-50/50">Accounts</span>
            <ChevronRight size={12} />
            <span className="text-primary-500/60 truncate max-w-[200px]">{product.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Visuals & Description */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-card rounded-3xl overflow-hidden border-white/5 relative">
                <div className="aspect-video relative group overflow-hidden">
                    <img 
                        src={product.image} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-6 left-6 bg-primary-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-xl z-10 flex items-center gap-2 border border-white/20">
                        <Zap size={12} fill="currentColor" />
                        {product.badge}
                    </div>
                </div>
            </div>

            {/* Seller Quick Info (Mobile Only) */}
            <div className="lg:hidden glass-card rounded-3xl p-6 border-white/5">
                 <SellerInfo />
            </div>

            {/* Tabs Section */}
            <div className="glass-card rounded-3xl border-white/5 overflow-hidden">
                <div className="flex border-b border-white/5 bg-white/2">
                    {["description", "reviews", "protection"].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-5 text-xs font-bold uppercase tracking-widest transition-all relative ${
                                activeTab === tab ? "text-primary-400" : "text-dark-50/30 hover:text-white"
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {activeTab === "description" && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <p className="text-dark-50/70 leading-relaxed text-sm">
                                    {product.description}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {product.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/2 p-3 rounded-xl border border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                                            <span className="text-sm font-medium text-white/90">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {activeTab === "reviews" && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-10"
                            >
                                <MessageSquare className="w-12 h-12 text-dark-50/20 mx-auto mb-4" />
                                <h4 className="text-white font-bold mb-1">Customer Feedback</h4>
                                <p className="text-dark-50/30 text-xs">This product has 120 verified reviews.</p>
                            </motion.div>
                        )}
                        {activeTab === "protection" && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex items-start gap-4 p-6 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                                    <ShieldCheck className="w-8 h-8 text-primary-400 shrink-0" />
                                    <div>
                                        <h4 className="text-primary-400 font-bold mb-2">Titan Guard™ Protection</h4>
                                        <p className="text-xs text-dark-50/60 leading-relaxed">
                                            Your purchase is covered by our comprehensive security protocol. We guarantee the delivery of the digital asset as described, or you receive a full refund. Funds are held in escrow until you confirm delivery.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </div>

          {/* Right Column: Pricing, Checkout & Seller */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Purchase Card */}
            <div className="glass-card rounded-3xl p-8 border-white/5 sticky top-24">
                <div className="mb-8">
                    <h1 className="text-xl font-bold text-white mb-4 leading-tight">{product.title}</h1>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-display font-bold text-white">${product.price.toFixed(2)}</span>
                            <span className="text-sm text-dark-50/20 line-through">${(product.price * 1.5).toFixed(2)}</span>
                        </div>
                        <div className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded border border-green-500/20">
                            -33% OFF
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-dark-50/30">
                        <span className="flex items-center gap-1.5"><ThumbsUp size={12} className="text-primary-400" /> 99% Positive</span>
                        <span>{product.sold} Sold</span>
                    </div>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold uppercase tracking-widest text-dark-50/40">Quantity</span>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >-</button>
                            <span className="font-bold text-sm min-w-[20px] text-center">{quantity}</span>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            >+</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-center">
                            <Zap size={16} className="mx-auto mb-2 text-yellow-400" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-dark-50/40">Delivery</div>
                            <div className="text-xs font-bold text-white mt-0.5">{product.deliveryTime}</div>
                        </div>
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-center">
                            <Clock size={16} className="mx-auto mb-2 text-blue-400" />
                            <div className="text-[10px] font-bold uppercase tracking-widest text-dark-50/40">Stock</div>
                            <div className="text-xs font-bold text-white mt-0.5">{product.stock} Units</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link 
                        to={`/checkout/${product.id}?quantity=${quantity}`} 
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 transition-all group"
                    >
                        <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" />
                        Purchase Securely
                    </Link>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleCopyLink}
                            className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            {copied ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
                            {copied ? "Copied" : "Share"}
                        </button>
                        <button className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                            <MessageSquare size={14} />
                            Contact
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 opacity-30 grayscale" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-30 grayscale" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Paypal" className="h-5 opacity-30 grayscale" />
                </div>
            </div>

            {/* Seller Card (Desktop Only) */}
            <div className="hidden lg:block glass-card rounded-3xl p-6 border-white/5">
                <SellerInfo />
            </div>

          </div>
        </div>
      </div>

      {/* Background Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
    </div>
  );
}

function SellerInfo() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark-50/40">Merchant Information</h3>
                <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                    <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                    Online
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-blue-600 p-[1px] shrink-0">
                    <div className="w-full h-full rounded-[15px] bg-dark-900 flex items-center justify-center overflow-hidden border border-white/10">
                         <Crown className="text-white/20" size={24} />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-white">AccountStoreOne</span>
                        <BadgeCheck size={16} className="text-primary-400" />
                    </div>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={10} className="text-yellow-400 fill-current" />
                        ))}
                        <span className="text-[10px] font-bold text-dark-50/40 ml-1">17.4k Reviews</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dark-50/30 mb-1">Member Since</div>
                    <div className="text-xs font-bold text-white">Aug 2021</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-dark-50/30 mb-1">Rank</div>
                    <div className="text-xs font-bold text-primary-400">Legendary</div>
                </div>
            </div>

            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                Visit Storefront
            </button>
        </div>
    );
}
