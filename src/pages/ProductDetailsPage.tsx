import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ShieldCheck, Zap, Clock, ThumbsUp, Star, Copy, Check } from "lucide-react";

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

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: "center center",
    transform: "scale(1)",
  });
  const [copied, setCopied] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(2.5)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl animate-pulse">
        <div className="h-96 bg-gray-200 rounded mb-8"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link to="/" className="text-[#FF3333] hover:underline mt-4 inline-block">
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Image Section */}
          <div className="space-y-4">
            <div 
                className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative cursor-zoom-in group"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
              <img 
                src={product.image} 
                alt={product.title} 
                className="w-full h-full object-cover transition-transform duration-200 ease-out"
                style={zoomStyle}
              />
              <div className="absolute top-4 left-4 bg-[#FF3333] text-white px-3 py-1 rounded font-bold pointer-events-none z-10">
                {product.badge}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-100 rounded cursor-pointer hover:ring-2 ring-[#FF3333]">
                        <img src={product.image} alt="Thumbnail" className="w-full h-full object-cover opacity-70 hover:opacity-100" />
                    </div>
                ))}
            </div>
          </div>

          {/* Details Section */}
          <div>
            <div className="flex justify-between items-start gap-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">{product.title}</h1>
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#FF3333] transition-colors border border-gray-200 rounded px-2 py-1 shrink-0 bg-gray-50 hover:bg-white"
                    title="Copy Product Link"
                >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? <span className="text-green-500">Copied</span> : "Copy Link"}
                </button>
            </div>
            
            <div className="flex items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-gray-500 ml-1">(120 Reviews)</span>
                </div>
                <div className="text-gray-300">|</div>
                <div className="text-[#00C975] font-medium">{product.sold} Sold</div>
            </div>

            <div className="bg-gray-50 rounded p-4 mb-6 border border-gray-100">
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-[#FF3333]">${product.price.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 mb-1 line-through">${(product.price * 1.2).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <Zap className="w-4 h-4" />
                    <span>Instant Delivery</span>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">Secure Payment</div>
                        <div className="text-xs text-gray-500">100% Secure transaction</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">Delivery Time</div>
                        <div className="text-xs text-gray-500">{product.deliveryTime}</div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center border border-gray-300 rounded w-32">
                    <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 border-r border-gray-300"
                    >
                        -
                    </button>
                    <input 
                        type="text" 
                        value={quantity} 
                        readOnly
                        className="w-full text-center text-sm font-medium text-gray-900 focus:outline-none"
                    />
                    <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 border-l border-gray-300"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <Link to={`/checkout/${product.id}?quantity=${quantity}`} className="flex-1 bg-[#FF3333] hover:bg-red-600 text-white font-bold py-3 rounded shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now
                </Link>
                <button className="px-4 border border-gray-300 rounded hover:bg-gray-50 text-gray-600">
                    <ThumbsUp className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>

        {/* Description Tabs */}
        <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-200">
                <button className="px-6 py-3 text-sm font-medium text-[#FF3333] border-b-2 border-[#FF3333]">Description</button>
                <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Reviews</button>
                <button className="px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700">Guide</button>
            </div>
            <div className="p-6">
                <p className="text-gray-600 leading-relaxed mb-4">
                    {product.description}
                </p>
                <h3 className="font-bold text-gray-900 mb-3">Features:</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    {product.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}
