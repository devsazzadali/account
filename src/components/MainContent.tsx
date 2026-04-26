import { Search, ThumbsUp, MinusCircle, Zap, Crown, Clock, Star, TrendingUp, Award, Plus, Minus, AlertCircle, ShieldCheck } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
// import { CATEGORIES, REVIEWS } from "../data/mockData";
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
      className="group ios-card p-4 hover:border-[#1dbf73]/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 block h-full relative overflow-hidden flex flex-col"
    >
      <div className="flex gap-4 flex-1">
        {/* Left Side: Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {item.category && (
                <div className="text-[10px] text-primary-600 font-medium uppercase tracking-wider mb-1.5 truncate">{item.category}</div>
            )}
            <h3 className="text-sm font-display font-semibold text-slate-900 line-clamp-2 mb-3 group-hover:text-primary-600 transition-colors leading-relaxed" title={item.title}>
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
               <span className="flex items-center gap-1 text-[10px] text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">
                 <Zap className="w-3 h-3 text-primary-500 fill-current" /> Instant
               </span>
               <span className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                 <Clock className="w-3 h-3 text-blue-500" /> Auto
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 mt-2 bg-slate-50 rounded-xl p-2 border border-slate-100">
            <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-500 truncate leading-tight mb-0.5">Verified Seller</span>
                <span className="text-xs text-slate-900 font-medium truncate">TitanGames_Global</span>
            </div>
          </div>
        </div>

        {/* Right Side: Image & Price */}
        <div className="flex flex-col items-end justify-between shrink-0 w-[90px]">
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden relative border border-slate-200 bg-slate-100 group-hover:border-primary-500/30 transition-colors">
             <img 
                src={item.image || "https://picsum.photos/seed/default/400/225"} 
                alt={item.title}
                className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
             />
             {item.badge && (
                <div className="absolute top-0 right-0 bg-primary-600 text-white text-[9px] px-2 py-0.5 font-bold shadow-lg z-10 rounded-bl-lg uppercase">
                    {item.badge}
                </div>
             )}
          </div>
          <div className="mt-auto text-right w-full pt-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Price</div>
            <div className="font-display font-bold text-slate-900 text-xl leading-none flex items-center justify-end gap-1">
                <span className="text-primary-600 text-sm">$</span>
                {item.price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity and Buy Button */}
      <div className="mt-5 flex items-center gap-2 relative z-20">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1 shrink-0">
              <button 
                  onClick={(e) => handleQuantityChange(e, -1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
              >
                  <Minus size={14} />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-900">{quantity}</span>
              <button 
                  onClick={(e) => handleQuantityChange(e, 1)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
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
  );
};

interface MainContentProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery?: string;
}

export function MainContent({ selectedCategory, setSelectedCategory, searchQuery }: MainContentProps) {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<FeaturedItem[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbReviews, setDbReviews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
        try {
            setLoading(true);
            const [prodRes, catRes, revRes] = await Promise.all([
                supabase.from('products').select('*').order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(6)
            ]);

            if (prodRes.error) throw prodRes.error;
            setAllProducts(prodRes.data || []);
            setDbCategories(catRes.data || []);
            setDbReviews(revRes.data || []);
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

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Featured List / Search Results */}
      <AnimatePresence mode="wait">
      {searchQuery ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12"
          >
             <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <Search className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Search <span className="text-primary-600">Results</span></h2>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Found <span className="text-primary-600">{products.length}</span> Matching Offers
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((item) => (
                        <ProductCard key={item.id} item={item} />
                    ))}
                </div>
             )}
          </motion.div>
      ) : selectedCategory === 'All' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Featured <span className="text-primary-600">List</span></h2>
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
                        <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Trending <span className="text-blue-600">Products</span></h2>
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

      {/* All Categories / Products List - Hide when searching */}
      {!searchQuery && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/5 blur-[100px] rounded-full pointer-events-none"></div>
          
          {selectedCategory === 'All' ? (
            <>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                        <Award className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Browse <span className="text-primary-600">Categories</span></h2>
                </div>

                <div className="flex gap-6 overflow-x-auto pb-4 mb-8 border-b border-slate-100 scrollbar-hide">
                    {['Accounts', 'Items', 'Money', 'Boosting', 'Video Games', 'Top Up'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => handleCategoryClick(tab === 'Accounts' ? 'All' : tab)}
                            className={`${tab === 'Accounts' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-900'} pb-3 px-2 text-sm font-semibold whitespace-nowrap transition-all duration-300`}
                        >
                            {tab} {tab === 'Accounts' && <span className="ml-1 opacity-50">({allProducts.length})</span>}
                        </button>
                    ))}
                </div>

                <div className="relative mb-10 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search across all premium accounts..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 focus:bg-white transition-all duration-300 shadow-sm"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {categories.map((cat, idx) => (
                        <div 
                            key={cat.id || idx} 
                            onClick={() => handleCategoryClick(cat.name)}
                            className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white hover:border-primary-500/30 hover:shadow-md transition-all duration-500 cursor-pointer relative group h-28 shadow-sm"
                        >
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-primary-600 transition-colors uppercase tracking-widest">{cat.name}</span>
                        </div>
                    ))}
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
                                    className="text-xs font-bold text-primary-600 hover:text-primary-500 uppercase tracking-widest flex items-center gap-2 group"
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
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest text-primary-600">Search Offers</h3>
                        <div className="relative">
                            <input type="text" placeholder="Filter by name..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm" />
                            <Search className="absolute right-4 top-3.5 w-4 h-4 text-slate-300" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest text-primary-600">Price Range</h3>
                        <div className="flex gap-3 items-center">
                            <input type="text" placeholder="Min" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm" />
                            <span className="text-slate-300">—</span>
                            <input type="text" placeholder="Max" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary-500/50 transition-all shadow-sm" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Account Type</h3>
                                <MinusCircle className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="space-y-3">
                                {['Premium Account', 'Fresh Instance', 'Verified Only', 'Special Edition'].map((type, i) => (
                                    <label key={i} className="flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded border border-slate-200 bg-slate-50 flex items-center justify-center group-hover:border-primary-500 transition-colors shadow-inner">
                                                <div className="w-2.5 h-2.5 bg-primary-500 rounded-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                            </div>
                                            <span className="text-sm text-slate-500 group-hover:text-slate-900 transition-colors">{type}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300">0</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Product Grid */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                        <button 
                            onClick={() => handleCategoryClick('All')}
                            className="text-xs font-bold text-slate-400 hover:text-primary-600 flex items-center gap-2 uppercase tracking-widest transition-colors group"
                        >
                            <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-primary-50 transition-colors">
                                <TrendingUp className="w-3.5 h-3.5 rotate-[-90deg]" />
                            </div>
                            Back to Dashboard
                        </button>
                        <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                            Showing <span className="text-slate-900">{products.length}</span> Results
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8 overflow-x-auto scrollbar-hide border-b border-slate-100">
                         <div className="border-b-2 border-primary-600 px-6 py-3 text-sm font-bold text-primary-600 uppercase tracking-widest whitespace-nowrap">
                            Available Accounts
                         </div>
                         <div className="text-sm font-bold text-slate-400 hover:text-slate-900 px-6 py-3 uppercase tracking-widest cursor-pointer transition-colors whitespace-nowrap">
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
      )}

      {/* Customer Reviews */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-12 shadow-sm">
        <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-500/10 rounded-lg border border-primary-500/20">
                    <Star className="w-5 h-5 text-primary-600 fill-current" />
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Customer <span className="text-primary-600">Reviews</span></h2>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="text-primary-600">{reviews.length}</span> Total Reviews
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
            {reviews.map((review, idx) => (
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

        <div className="mt-10 flex justify-center">
            <button className="px-10 py-4 rounded-xl border border-primary-200 text-primary-600 text-xs font-bold uppercase tracking-widest hover:bg-primary-50 hover:border-primary-500 transition-all duration-300 shadow-sm">
                Load More Testimonials
            </button>
        </div>
      </div>
    </div>
  );
}
