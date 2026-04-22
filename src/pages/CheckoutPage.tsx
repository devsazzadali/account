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
  ChevronRight,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

interface Product {
  id: string;
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
    async function fetchProduct() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            if (error) throw error;
            setProduct(data);
        } catch (err: any) {
            console.error("Error fetching product:", err.message);
        } finally {
            setLoading(false);
        }
    }
    if (productId) fetchProduct();
  }, [productId]);

  const handlePlaceOrder = async () => {
    if (!email) {
        alert("Please enter your delivery email");
        return;
    }
    setProcessing(true);
    
    try {
        const subtotal = (product?.price || 0) * initialQuantity;
        const total = subtotal + 0.50;

        console.log("Placing order for product:", product?.id, "Email:", email);

        const { data, error } = await supabase
            .from('orders')
            .insert({
                product_id: product?.id,
                customer_email: email,
                quantity: initialQuantity,
                total_price: total,
                status: 'Paid'
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }
        
        if (!data) {
            throw new Error("Order created but no data returned");
        }

        console.log("Order created successfully:", data.id);
        
        // Success - redirect to order page
        navigate(`/order/${data.id}`);
    } catch (err: any) {
        console.error("Checkout Finalization Error:", err);
        alert("Settlement Error: " + (err.message || "Unknown error occurred"));
        setProcessing(false);
    }
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
                
                {/* 1. Account Selection */}
                <div className="glass-card rounded-[2rem] border border-white/5 p-8 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                            <Lock size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-widest">Delivery Protocol</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-[0.2em] mb-3 block">Recipient Portal (Email)</label>
                            <input 
                                type="email" 
                                placeholder="Your primary delivery address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                            />
                            <p className="text-[9px] text-dark-50/20 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={10} /> Credentials will be transmitted to this address immediately.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Payment Gateway Selection */}
                <div className="glass-card rounded-[2rem] border border-white/5 p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-widest">Payment Gateway</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: "credit_card", name: "Credit / Debit Card", icon: <CreditCard size={20} /> },
                            { id: "crypto", name: "Cryptocurrency", icon: <Coins size={20} /> },
                            { id: "wallet", name: "Digital Wallet", icon: <Wallet size={20} /> },
                            { id: "stripe", name: "Stripe Connect", icon: <CheckCircle size={20} /> }
                        ].map((method) => (
                            <button 
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id)}
                                className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                                    paymentMethod === method.id 
                                    ? "bg-primary-500/10 border-primary-500/50 text-white" 
                                    : "bg-white/2 border-white/5 text-dark-50/40 hover:bg-white/5 hover:border-white/10"
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={paymentMethod === method.id ? "text-primary-400" : ""}>{method.icon}</div>
                                    <span className="text-xs font-bold uppercase tracking-widest">{method.name}</span>
                                </div>
                                {paymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Security Badges */}
                <div className="flex flex-wrap gap-4 pt-4">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-dark-50/30 uppercase tracking-widest px-4 py-2 border border-white/5 rounded-full">
                        <Shield size={12} className="text-green-500" /> SSL Encrypted
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-dark-50/30 uppercase tracking-widest px-4 py-2 border border-white/5 rounded-full">
                        <ShieldCheck size={12} className="text-primary-500" /> TitanGuard Protection
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-dark-50/30 uppercase tracking-widest px-4 py-2 border border-white/5 rounded-full">
                        <Lock size={12} className="text-blue-500" /> PCI Compliance
                    </div>
                </div>
            </div>

            {/* Right Section: Order Recap */}
            <div className="lg:col-span-4 sticky top-24">
                <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5 bg-white/2">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Asset Verification</h3>
                        <p className="text-[9px] text-dark-50/30 uppercase tracking-[0.2em] font-bold">Review your acquisition</p>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                <img src={product.image || "https://picsum.photos/seed/default/200/200"} className="w-full h-full object-cover" alt={product.title} />
                            </div>
                            <div className="flex flex-col justify-between py-1">
                                <h4 className="text-xs font-bold text-white leading-relaxed line-clamp-2">{product.title}</h4>
                                <div className="text-[10px] font-bold text-primary-400">x{initialQuantity} Unit</div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex justify-between text-xs">
                                <span className="text-dark-50/40 font-medium">Subtotal</span>
                                <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-dark-50/40 font-medium">Service Protocol Fee</span>
                                <span className="text-white font-bold">${serviceFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-4 border-t border-white/5">
                                <span className="text-sm font-bold text-white uppercase tracking-widest">Total Settlement</span>
                                <div className="text-right">
                                    <div className="text-xl font-display font-bold text-primary-400 leading-none">${total.toFixed(2)}</div>
                                    <div className="text-[9px] text-dark-50/20 font-bold uppercase mt-1">VAT Included</div>
                                </div>
                            </div>
                        </div>

                        <button 
                            disabled={processing}
                            onClick={handlePlaceOrder}
                            className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-[1.02] active:scale-[0.98] rounded-2xl text-white text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            {processing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Processing Settlement...
                                </>
                            ) : (
                                <>
                                    <Zap size={18} fill="currentColor" />
                                    Confirm Acquisition
                                </>
                            )}
                        </button>

                        <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                             <p className="text-[9px] text-dark-50/40 font-medium leading-relaxed text-center">
                                By confirming this acquisition, you agree to the Digital Asset Protocol Terms and TitanGuard Secure Escrow conditions.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
