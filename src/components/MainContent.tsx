import { Search, ThumbsUp, MinusCircle, Zap, Crown, Clock, Star, TrendingUp, Award, Plus, Minus, AlertCircle, ShieldCheck } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, REVIEWS } from "../data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

interface FeaturedItem {
  id: string;
  title: string;
  sold: number;
  price: number;
  image: string;
  badge: string;
  category?: string;
  stock?: number;
}

const ProductCard: React.FC<{ item: FeaturedItem }> = ({ item }) => {
    const [quantity, setQuantity] = useState(1);

    const handleQuantityChange = (e: React.MouseEvent, change: number) => {
        e.preventDefault();
        e.stopPropagation();
        setQuantity(Math.max(1, quantity + change));
    };

    return (
    <Link 
      to={`/product/${item.id}`} 
      className="group glass-card rounded-2xl p-4 hover:border-primary-500/50 transition-all duration-500 hover:-translate-y-1 block h-full relative overflow-hidden flex flex-col"
    >
      <div className="flex gap-4 flex-1">
        {/* Left Side: Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {item.category && (
                <div className="text-[10px] text-primary-400 font-medium uppercase tracking-wider mb-1.5 truncate">{item.category}</div>
            )}
            <h3 className="text-sm font-display font-semibold text-white line-clamp-2 mb-3 group-hover:text-primary-400 transition-colors leading-relaxed" title={item.title}>
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
               <span className="flex items-center gap-1 text-[10px] text-primary-100 bg-primary-500/20 px-2 py-0.5 rounded-md border border-primary-500/30">
                 <Zap className="w-3 h-3 text-primary-400 fill-current" /> Instant
               </span>
               <span className="flex items-center gap-1 text-[10px] text-blue-100 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                 <Clock className="w-3 h-3 text-blue-400" /> Auto
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 mt-2 bg-white/5 rounded-xl p-2 border border-white/5">
            <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-dark-50/70 truncate leading-tight mb-0.5">Verified Seller</span>
                <span className="text-xs text-white font-medium truncate">TitanGames_Global</span>
            </div>
          </div>
        </div>

        {/* Right Side: Image & Price */}
        <div className="flex flex-col items-end justify-between shrink-0 w-[90px]">
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden relative border border-white/10 bg-dark-900 group-hover:border-primary-500/30 transition-colors">
             <img 
                src={item.image || "https://picsum.photos/seed/default/400/225"} 
                alt={item.title}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-115" 
             />
             {item.badge && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-[9px] px-2 py-0.5 font-bold shadow-lg z-10 rounded-bl-lg uppercase">
                    {item.badge}
                </div>
             )}
          </div>
          <div className="mt-auto text-right w-full pt-4">
            <div className="text-[10px] text-dark-50/40 uppercase tracking-widest leading-none mb-1">Price</div>
            <div className="font-display font-bold text-white text-xl leading-none flex items-center justify-end gap-1">
                <span className="text-primary-400 text-sm">$</span>
                {item.price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity and Buy Button */}
      <div className="mt-5 flex items-center gap-2 relative z-20">
          <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 shrink-0">
              <button 
                  onClick={(e) => handleQuantityChange(e, -1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-dark-50/40 hover:text-white"
              >
                  <Minus size={14} />
              </button>
              <span className="w-8 text-center text-xs font-bold text-white">{quantity}</span>
              <button 
                  onClick={(e) => handleQuantityChange(e, 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-dark-50/40 hover:text-white"
              >
                  <Plus size={14} />
              </button>
          </div>
          <Link 
            to={`/checkout/${item.id}?quantity=${quantity}`}
            className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white text-[11px] font-bold uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group/btn"
          >
            Buy Now
            <Zap className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform fill-current" />
          </Link>
      </div>
    </Link>
  {
    id: 1002,
    title: "Spotify Premium Individual Upgrade | Lifetime Warranty",
    sold: 850,
    price: 5.00,
    image: "https://picsum.photos/seed/dummy2/200/200",
    badge: "BEST"
  },
  {
    id: 1003,
    title: "VPN Pro 1 Year Subscription | 5 Devices | High Speed",
    sold: 2000,
    price: 12.99,
    image: "https://picsum.photos/seed/dummy3/200/200",
    badge: "SALE"
  },
  {
    id: 1004,
    title: "Disney+ Bundle | No Ads | 6 Months Warranty",
    sold: 450,
    price: 7.99,
    image: "https://picsum.photos/seed/dummy4/200/200",
    badge: "NEW"
  }
];

interface MainContentProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export function MainContent({ selectedCategory, setSelectedCategory }: MainContentProps) {
  const [loading, setLoading] = useState(false);

  const featuredItems = useMemo(() => {
    return FEATURED_ITEMS.slice(0, 3);
  }, []);

  const trendingItems = useMemo(() => {
    return [...FEATURED_ITEMS].reverse().slice(0, 3);
  }, []);

  const categories = useMemo(() => CATEGORIES, []);
  const reviews = useMemo(() => REVIEWS, []);

  const products = useMemo(() => {
    if (selectedCategory === 'All') return FEATURED_ITEMS;
    return FEATURED_ITEMS.filter(p => p.category === selectedCategory || selectedCategory === 'Accounts');
  }, [selectedCategory]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Featured List - Only show if All Categories is selected */}
      <AnimatePresence mode="wait">
      {selectedCategory === 'All' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <TrendingUp className="w-5 h-5 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">Featured <span className="text-primary-400">List</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>

            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Zap className="w-5 h-5 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">Trending <span className="text-blue-400">Products</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>
          </motion.div>
      )}
      </AnimatePresence>

      {/* All Categories / Products List */}
      <div className="glass-card rounded-2xl p-8 mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        {selectedCategory === 'All' ? (
            <>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <Award className="w-5 h-5 text-primary-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">Browse <span className="text-primary-400">Categories</span></h2>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 mb-8 border-b border-white/5 scrollbar-hide">
                    {['Accounts', 'Items', 'Money', 'Boosting', 'Video Games', 'Top Up'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => handleCategoryClick(tab === 'Accounts' ? 'All' : tab)}
                            className={`${tab === 'Accounts' ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-50/50 hover:text-white'} pb-3 px-2 text-sm font-semibold whitespace-nowrap transition-all duration-300`}
                        >
                            {tab} {tab === 'Accounts' && <span className="ml-1 opacity-50">({FEATURED_ITEMS.length})</span>}
                        </button>
                    ))}
                </div>

                <div className="relative mb-10 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-50/30 group-focus-within:text-primary-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search across all premium accounts..." 
                        className="w-full bg-dark-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white placeholder:text-dark-50/30 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {categories.map((cat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleCategoryClick(cat.name)}
                            className="glass-card bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/10 hover:border-primary-500/30 transition-all duration-500 cursor-pointer relative group h-28"
                        >
                            <div className="absolute top-3 right-3 bg-primary-500/20 text-primary-300 text-[9px] px-2 py-0.5 rounded-full border border-primary-500/30 font-bold uppercase tracking-wider">
                                {cat.offers}
                            </div>
                            <span className="text-xs font-semibold text-white group-hover:text-primary-400 transition-colors uppercase tracking-widest">{cat.name}</span>
                        </div>
                    ))}
                </div>

                {/* Category Wise Products */}
                {categories.slice(0, 3).map((cat) => {
                    const catProducts = FEATURED_ITEMS.filter(p => p.category === cat.name);
                    if (catProducts.length === 0) return null;
                    return (
                        <div key={cat.name} className="mb-12 last:mb-0">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-bold text-white mb-1">{cat.name}</h3>
                                    <div className="h-1 w-12 bg-primary-500 rounded-full"></div>
                                </div>
                                <button 
                                    onClick={() => handleCategoryClick(cat.name)} 
                                    className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-widest flex items-center gap-2 group"
                                >
                                    Explore All
                                    <TrendingUp className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {catProducts.slice(0, 3).map((item) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </>
        ) : (
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar Filters */}
                <div className="w-full md:w-72 shrink-0 space-y-8">
                    <div>
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-primary-400">Search Offers</h3>
                        <div className="relative">
                            <input type="text" placeholder="Filter by name..." className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all" />
                            <Search className="absolute right-4 top-3.5 w-4 h-4 text-dark-50/30" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest text-primary-400">Price Range</h3>
                        <div className="flex gap-3 items-center">
                            <input type="text" placeholder="Min" className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all" />
                            <span className="text-dark-50/20">—</span>
                            <input type="text" placeholder="Max" className="w-full bg-dark-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 transition-all" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Account Type</h3>
                                <MinusCircle className="w-4 h-4 text-dark-50/30" />
                            </div>
                            <div className="space-y-3">
                                {['Premium Account', 'Fresh Instance', 'Verified Only', 'Special Edition'].map((type, i) => (
                                    <label key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border border-white/10 bg-dark-900 flex items-center justify-center group-hover:border-primary-500/50 transition-colors">
                                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                            </div>
                                            <span className="text-sm text-dark-50/60 group-hover:text-white transition-colors">{type}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-dark-50/20">0</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Product Grid */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                        <button 
                            onClick={() => handleCategoryClick('All')}
                            className="text-xs font-bold text-dark-50/40 hover:text-primary-400 flex items-center gap-2 uppercase tracking-widest transition-colors group"
                        >
                            <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-primary-500/10 transition-colors">
                                <TrendingUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                            </div>
                            Back to Dashboard
                        </button>
                        <div className="text-xs font-bold text-dark-50/20 uppercase tracking-widest">
                            Showing <span className="text-white">{products.length}</span> Results
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8 overflow-x-auto scrollbar-hide">
                         <div className="bg-primary-500/10 border-b-2 border-primary-500 px-6 py-3 text-sm font-bold text-primary-400 uppercase tracking-widest whitespace-nowrap">
                            Available Accounts
                         </div>
                         <div className="text-sm font-bold text-dark-50/30 hover:text-white px-6 py-3 uppercase tracking-widest cursor-pointer transition-colors whitespace-nowrap">
                            Subscriptions
                         </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((item) => (
                            <ProductCard key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="glass-card rounded-2xl p-8 mb-12">
        <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                    <Star className="w-5 h-5 text-primary-400 fill-current" />
                </div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Customer <span className="text-primary-400">Reviews</span></h2>
            </div>
            <div className="text-xs font-bold text-dark-50/30 uppercase tracking-widest">
                <span className="text-primary-400">{reviews.length}</span> Total Reviews
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {reviews.map((review, idx) => (
                <div key={idx} className="bg-dark-950/50 p-6 hover:bg-white/5 transition-all duration-300 flex flex-col justify-between group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {review.type === 'positive' ? (
                                <div className="flex items-center gap-1.5 text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary-500/20">
                                    <ThumbsUp className="w-3 h-3 fill-current" />
                                    <span>Recommended</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                                    <MinusCircle className="w-3 h-3" />
                                    <span>Issues</span>
                                </div>
                            )}
                        </div>
                        <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest">{review.date}</div>
                    </div>
                    
                    <p className="text-sm text-white/80 leading-relaxed mb-6 group-hover:text-white transition-colors line-clamp-3">
                        "{review.text}"
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-primary-400 border border-white/10">
                                {review.buyer.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white tracking-tight">{review.buyer}</span>
                                <span className="text-[9px] text-dark-50/40 uppercase tracking-widest font-bold">Verified Buyer</span>
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

        <div className="mt-10 flex justify-center">
            <button className="px-10 py-4 rounded-xl border border-primary-500/30 text-primary-400 text-xs font-bold uppercase tracking-widest hover:bg-primary-500/10 hover:border-primary-500/50 transition-all duration-300 shadow-lg shadow-primary-500/5">
                Load More Testimonials
            </button>
        </div>
      </div>
    </div>
  );
}
