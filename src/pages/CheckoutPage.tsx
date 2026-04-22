import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle, 
  Wallet, 
  Coins, 
  ArrowLeft, 
  Zap, 
  Shield, 
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

export function CheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuantity = parseInt(queryParams.get("quantity") || "1");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
        const mockProducts: Record<string, Product> = {
            "1": { id: 1, title: "HULU NO ADS 🔥 FAST DELIVERY 🔥 3 MONTHS", price: 3.00, image: "https://picsum.photos/seed/hulu/200/200" },
            "2": { id: 2, title: "Personal Account - NFLX 30days 4K UHD Premium", price: 2.75, image: "https://picsum.photos/seed/netflix/200/200" },
            "5": { id: 5, title: "Disney+ Premium 12 Months Subscription", price: 15.50, image: "https://picsum.photos/seed/disney/200/200" }
        };
        setProduct(mockProducts[productId || ""] || mockProducts["1"]);
        setLoading(false);
    }, 800);
  }, [productId]);

  const handlePlaceOrder = async () => {
    if (!email) {
        alert("Please enter your delivery email");
        return;
    }
    setProcessing(true);
    // Simulate API call
    setTimeout(() => {
        navigate(`/order/7782`);
    }, 2000);
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-dark-50/40 text-xs font-bold uppercase tracking-widest">Initializing Secure Checkout...</p>
        </div>
    );
  }

  if (!product) return <div className="p-8 text-center bg-dark-950 text-white">Digital Asset Not Found</div>;

  const serviceFee = 0.50;
  const subtotal = product.price * initialQuantity;
  const total = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-dark-950 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="text-3xl font-display font-bold text-white tracking-tight">Secure Checkout</h1>
                <div className="flex items-center gap-2 text-[10px] font-bold text-dark-50/30 uppercase tracking-widest mt-1">
                    <span>Marketplace</span>
                    <ChevronRight size={10} />
                    <span>Cart</span>
                    <ChevronRight size={10} />
                    <span className="text-primary-500">Settlement</span>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Section: Settlement Protocol */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Contact Info */}
                <div className="glass-card rounded-3xl p-8 border-white/5">
                    <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Zap size={18} />
                        </div>
                        Delivery Protocol
                    </h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Receiver Email Address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all" 
                                placeholder="you@example.com" 
                            />
                            <div className="flex items-center gap-2 px-1 text-[10px] text-dark-50/40 font-medium italic mt-1">
                                <AlertCircle size={10} />
                                Your digital asset will be transmitted to this destination.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Selection */}
                <div className="glass-card rounded-3xl p-8 border-white/5">
                    <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                            <CreditCard size={18} />
                        </div>
                        Financial Resolution
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PaymentMethod 
                            id="credit_card" 
                            selected={paymentMethod === "credit_card"} 
                            onSelect={setPaymentMethod}
                            icon={<CreditCard size={20} />}
                            label="Debit / Credit Card"
                            desc="Visa, Mastercard, Amex"
                        />
                        <PaymentMethod 
                            id="crypto" 
                            selected={paymentMethod === "crypto"} 
                            onSelect={setPaymentMethod}
                            icon={<Coins size={20} />}
                            label="Cryptocurrency"
                            desc="BTC, ETH, USDT (TRC20)"
                        />
                        <PaymentMethod 
                            id="paypal" 
                            selected={paymentMethod === "paypal"} 
                            onSelect={setPaymentMethod}
                            icon={<Wallet size={20} />}
                            label="PayPal Wallet"
                            desc="Instant clearance"
                        />
                        <div className="p-6 rounded-2xl border border-white/5 bg-white/2 opacity-40 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                            <Lock size={12} />
                            More Options Loading...
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Transaction Ledger */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                <div className="glass-card rounded-3xl p-8 border-white/5 shadow-2xl relative overflow-hidden">
                    <h2 className="text-sm font-bold text-dark-50/40 uppercase tracking-widest mb-6">Valuation Summary</h2>
                    
                    <div className="flex gap-4 mb-8">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{product.title}</h3>
                            <div className="text-[10px] text-primary-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                                <Zap size={10} fill="currentColor" />
                                Instant Delivery
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 text-sm">
                        <div className="flex justify-between items-center text-dark-50/40">
                            <span>Unit Valuation</span>
                            <span className="text-white font-bold">${product.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-dark-50/40">
                            <span>Quantity</span>
                            <span className="text-white font-bold">x{initialQuantity}</span>
                        </div>
                        <div className="flex justify-between items-center text-dark-50/40">
                            <span>Protocol Service Fee</span>
                            <span className="text-white font-bold">${serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-sm font-bold uppercase tracking-widest">Settlement Total</span>
                            <span className="text-2xl font-display font-bold text-primary-400">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handlePlaceOrder}
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 transition-all disabled:opacity-50 group"
                    >
                        {processing ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                                Execute Settlement
                            </>
                        )}
                    </button>

                    <div className="mt-6 flex flex-col items-center gap-3 p-4 bg-white/2 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-dark-50/30 uppercase tracking-widest">
                            <Shield size={12} className="text-green-500" />
                            Titan AES-256 Encrypted
                        </div>
                        <div className="flex items-center gap-4 opacity-20 grayscale">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-4" alt="Mastercard" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-3" alt="Paypal" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-primary-500/5 rounded-3xl border border-primary-500/10">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary-500/20 rounded-xl text-primary-400">
                             <Lock size={16} />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-widest">Encrypted Escrow</h4>
                            <p className="text-[10px] text-dark-50/50 leading-relaxed font-medium">Funds are held securely by the marketplace until the digital asset is successfully delivered and verified by the system.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethod({ id, selected, onSelect, icon, label, desc }: any) {
    return (
        <button 
            onClick={() => onSelect(id)}
            className={`flex flex-col gap-4 p-6 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                selected 
                ? "bg-primary-500/10 border-primary-500/50 shadow-lg shadow-primary-500/5" 
                : "bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10"
            }`}
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                selected ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-white/5 text-dark-50/40"
            }`}>
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold text-white mb-0.5">{label}</div>
                <div className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest">{desc}</div>
            </div>
            {selected && (
                <div className="absolute top-4 right-4 text-primary-400">
                    <CheckCircle size={20} fill="currentColor" fillOpacity={0.2} />
                </div>
            )}
        </button>
    );
}
