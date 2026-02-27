import { Search, ThumbsUp, MinusCircle, Zap, Crown, Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface FeaturedItem {
  id: number;
  title: string;
  sold: number;
  price: number;
  image: string;
  badge: string;
  category?: string;
}

interface Category {
  name: string;
  offers: number;
}

interface Review {
  type: string;
  text: string;
  buyer: string;
  date: string;
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
      className="group bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-all duration-300 hover:-translate-y-1 block h-full relative overflow-hidden flex flex-col"
    >
      <div className="flex gap-3 flex-1">
        {/* Left Side: Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {item.category && (
                <div className="text-[10px] text-gray-500 mb-1 truncate">{item.category}</div>
            )}
            <h3 className="text-[13px] font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-[#FF3333] transition-colors leading-snug" title={item.title}>
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1 mb-2">
               <span className="flex items-center gap-0.5 text-[10px] text-green-700 bg-green-50 px-1 py-0.5 rounded border border-green-100">
                 <Zap className="w-3 h-3 fill-current" /> Instant
               </span>
               <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                 <Clock className="w-3 h-3" /> Auto
               </span>
            </div>
          </div>
          
          <div className="flex items-start gap-2 mt-1">
            <div className="mt-0.5">
                <Crown className="w-4 h-4 text-yellow-500 fill-current" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-gray-500 truncate leading-none mb-1">AccountStoreOne</span>
                <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-2 h-0.5 bg-yellow-400 rounded-full"></div>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Right Side: Image & Price */}
        <div className="flex flex-col items-end justify-between shrink-0 w-[80px]">
          <div className="w-[80px] h-[80px] rounded-md overflow-hidden relative border border-gray-100 bg-gray-50">
             <img 
                src={item.image} 
                alt={item.title}
                className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" 
             />
             {item.badge && (
                <div className="absolute top-0 right-0 bg-[#FF3333] text-white text-[9px] px-1 font-bold shadow-sm z-10">
                    {item.badge}
                </div>
             )}
          </div>
          <div className="mt-auto text-right w-full">
            <div className="text-[10px] text-gray-400 leading-none mb-0.5">from</div>
            <div className="font-bold text-gray-900 text-base leading-none">${item.price.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Quantity and Buy Button */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="flex items-center border border-gray-200 rounded h-7">
              <button 
                onClick={(e) => handleQuantityChange(e, -1)}
                className="px-2 text-gray-500 hover:bg-gray-50 hover:text-[#FF3333] h-full flex items-center"
              >
                -
              </button>
              <span className="text-xs font-medium w-6 text-center">{quantity}</span>
              <button 
                onClick={(e) => handleQuantityChange(e, 1)}
                className="px-2 text-gray-500 hover:bg-gray-50 hover:text-[#FF3333] h-full flex items-center"
              >
                +
              </button>
          </div>
          <Link 
            to={`/checkout/${item.id}?quantity=${quantity}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FF3333] hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors flex-1 text-center"
          >
            Buy
          </Link>
      </div>
    </Link>
)};

const DUMMY_PRODUCTS: FeaturedItem[] = [
  {
    id: 1001,
    title: "Netflix Premium 4K UHD | 1 Month | Private Account",
    sold: 1250,
    price: 3.50,
    image: "https://picsum.photos/seed/dummy1/200/200",
    badge: "HOT"
  },
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
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<FeaturedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<FeaturedItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, trendingRes, categoriesRes, reviewsRes, productsRes] = await Promise.all([
          fetch('/api/store/featured'),
          fetch('/api/store/trending'),
          fetch('/api/store/categories'),
          fetch('/api/store/reviews'),
          fetch('/api/products')
        ]);

        const featuredData = await featuredRes.json();
        const trendingData = await trendingRes.json();
        const categoriesData = await categoriesRes.json();
        const reviewsData = await reviewsRes.json();
        const productsData = await productsRes.json();

        setFeaturedItems(Array.isArray(featuredData) ? featuredData : []);
        setTrendingItems(Array.isArray(trendingData) ? trendingData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching main content data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setLoading(true);
    try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(categoryName)}`);
        const data = await res.json();
        setProducts(data);
    } catch (error) {
        console.error("Error fetching filtered products:", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-w-0 animate-pulse">
        <div className="h-64 bg-gray-200 rounded mb-8"></div>
        <div className="h-64 bg-gray-200 rounded mb-8"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Featured List - Only show if All Categories is selected */}
      {selectedCategory === 'All' && (
          <>
            <div className="mb-8">
                <h2 className="text-lg font-medium text-[#111111] mb-4">Featured List</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-lg font-medium text-[#111111] mb-4">Trending Products</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendingItems.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
                </div>
            </div>
          </>
      )}

      {/* All Categories / Products List */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-6 mb-8">
        {selectedCategory === 'All' ? (
            <>
                <h2 className="text-lg font-medium text-[#111111] mb-6">All Categories</h2>
                <div className="border-b border-gray-200 mb-6 flex gap-4 overflow-x-auto">
                    {['Accounts', 'Items', 'Money', 'Boosting', 'Video Games', 'Top Up'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => handleCategoryClick(tab === 'Accounts' ? 'All' : tab)}
                            className={`${tab === 'Accounts' ? 'text-[#FF3333] border-b-2 border-[#FF3333]' : 'text-gray-500 hover:text-gray-700'} pb-2 px-1 text-sm font-medium whitespace-nowrap transition-colors`}
                        >
                            {tab} {tab === 'Accounts' && `(${products.length})`}
                        </button>
                    ))}
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Find all products in Accounts" 
                        className="w-full border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-gray-400"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {categories.map((cat, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleCategoryClick(cat.name)}
                            className="bg-[#F5F1E6] rounded p-4 flex flex-col items-center justify-center text-center hover:bg-[#ebe5d5] transition-colors cursor-pointer relative group h-24"
                        >
                            <div className="absolute top-2 right-2 bg-[#B8A88A] text-white text-[10px] px-1.5 py-0.5 rounded opacity-80 group-hover:opacity-100">
                                {cat.offers} Offers
                            </div>
                            <span className="text-xs font-medium text-gray-700 mt-2">{cat.name}</span>
                        </div>
                    ))}
                </div>

                {/* Category Wise Products */}
                {categories.map((cat) => {
                    const catProducts = products.filter(p => p.category === cat.name);
                    if (catProducts.length === 0) return null;
                    return (
                        <div key={cat.name} className="mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-[#111111]">{cat.name}</h2>
                                <button 
                                    onClick={() => handleCategoryClick(cat.name)} 
                                    className="text-sm text-[#FF3333] hover:underline font-medium"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {catProducts.map((item) => (
                                    <ProductCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </>
        ) : (
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Sidebar Filters */}
                <div className="w-full md:w-64 shrink-0 space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Product Name</h3>
                        <div className="relative">
                            <input type="text" placeholder="Search offers" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                            <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Price range (USD)</h3>
                        <div className="flex gap-2 items-center">
                            <input type="text" placeholder="From" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                            <span className="text-gray-400">-</span>
                            <input type="text" placeholder="to" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 cursor-pointer">
                            <h3 className="text-sm font-medium text-gray-700">Accounts Type</h3>
                            <MinusCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            {['Boosted Account', 'Fresh Account', 'Unique Account', 'Premium Edition'].map((type, i) => (
                                <label key={i} className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#FF3333] focus:ring-[#FF3333]" />
                                        <span>{type}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">{Math.floor(Math.random() * 100)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 cursor-pointer">
                            <h3 className="text-sm font-medium text-gray-700">Full Access</h3>
                            <MinusCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            {['yes', 'no'].map((type, i) => (
                                <label key={i} className="flex items-center justify-between text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded border-gray-300 text-[#FF3333] focus:ring-[#FF3333]" />
                                        <span>{type}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">{Math.floor(Math.random() * 100)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">RP Rank</h3>
                        <div className="flex gap-2 items-center">
                            <input type="text" placeholder="From" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                            <span className="text-gray-400">-</span>
                            <input type="text" placeholder="to" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Money(M)</h3>
                        <div className="flex gap-2 items-center">
                            <input type="text" placeholder="From" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                            <span className="text-gray-400">-</span>
                            <input type="text" placeholder="to" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF3333]" />
                        </div>
                    </div>
                </div>

                {/* Right Product Grid */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <div className="flex gap-4">
                             <button 
                                onClick={() => handleCategoryClick('All')}
                                className="text-xs text-gray-500 hover:text-[#FF3333] flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to AccountStoreOne store offers
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                         <div className="flex gap-1">
                            <div className="bg-white border border-gray-200 rounded-t px-4 py-2 text-sm font-medium text-[#FF3333] border-t-2 border-t-[#FF3333] relative top-[1px] z-10">
                                Accounts ({products.length})
                            </div>
                         </div>
                         <div className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                            <span>Sort: Default</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.length > 0 ? (
                            products.map((item) => (
                                <ProductCard key={item.id} item={item} />
                            ))
                        ) : (
                            DUMMY_PRODUCTS.map((item) => (
                                <ProductCard key={item.id} item={item} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-medium text-[#111111] mb-6">Customer Reviews</h2>
        
        <div className="bg-gray-50 rounded p-4 mb-4 text-sm text-gray-500">
            All reviews 17439
        </div>

        <div className="space-y-0">
            {reviews.map((review, idx) => (
                <div key={idx} className="flex items-start gap-4 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors px-2">
                    <div className="shrink-0 mt-1">
                        {review.type === 'positive' ? (
                            <div className="flex items-center gap-1 text-[#00C975] text-xs">
                                <ThumbsUp className="w-3 h-3" />
                                <span>Positive</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-[#FF3333] text-xs">
                                <MinusCircle className="w-3 h-3" />
                                <span>Negative</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 mb-1 line-clamp-2">{review.text}</p>
                        <div className="text-[10px] text-gray-400">{review.text.split('.').pop()?.trim() || 'Product'}</div>
                    </div>
                    <div className="shrink-0 text-right">
                        <div className="text-xs text-gray-900 font-medium mb-1">buyer</div>
                        <div className="text-xs text-gray-600 mb-1">{review.buyer}</div>
                        <div className="text-[10px] text-gray-400">{review.date}</div>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center">
            <button className="border border-[#FF3333] text-[#FF3333] px-8 py-2 rounded-full text-sm hover:bg-red-50 transition-colors">
                Loading More
            </button>
        </div>
      </div>
    </div>
  );
}
