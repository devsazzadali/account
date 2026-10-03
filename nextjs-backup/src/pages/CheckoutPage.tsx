import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck, CreditCard, Lock, CheckCircle, Wallet, Coins,
  ArrowLeft, Zap, Shield, AlertCircle, ChevronRight, Loader2,
  Package, Mail, CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import { PageLoader } from "../components/SkeletonUI";

interface Product { id: string; title: string; price: number; image: string; }

const STEPS = [
  { id: 1, label: "Review Order",    icon: Package },
  { id: 2, label: "Payment",         icon: CreditCard },
  { id: 3, label: "Confirmation",    icon: CheckCheck },
];

export function CheckoutPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qty = parseInt(new URLSearchParams(location.search).get("quantity") || "1");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (!error) setProduct(data);
      setLoading(false);
    };
    fetchProduct();
  }, [productId]);

  const serviceFee = 0.50;
  const subtotal = (product?.price || 0) * qty;
  const total = subtotal + serviceFee;

  const handlePlaceOrder = async () => {
    if (!email.trim()) { toast.error("Please enter your delivery email"); return; }
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const username = session?.user?.email?.split("@")[0] || email.split("@")[0] || "Guest";
      const { data, error } = await supabase.from("orders").insert({
        product_id: product?.id,
        customer_email: email,
        username,
        quantity: qty,
        total_price: total,
        status: "New Order",
      }).select().single();
      if (error) throw error;
      setStep(3);
      setTimeout(() => navigate(`/order/${data.id}`), 2500);
    } catch (err: any) {
      toast.error("Order error: " + err.message);
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader label="Initializing Secure Checkout..." />;
  if (!product) return <div className="p-8 text-center">Product not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-primary-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">

        {/* Back + Title */}
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Secure Checkout</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
              <Lock size={10} className="text-primary-600" /> TitanGuard Escrow Protection Active
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 mx-10" />
          <motion.div
            className="absolute top-5 left-0 h-0.5 bg-primary-500 mx-10"
            animate={{ width: `${((step - 1) / (STEPS.length - 1)) * (100 - (20 / STEPS.length))}%` }}
            transition={{ duration: 0.5 }}
          />
          {STEPS.map(s => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                <motion.div
                  animate={{
                    backgroundColor: done ? "#17995c" : active ? "#1dbf73" : "#f1f5f9",
                    borderColor: done || active ? "#1dbf73" : "#e2e8f0",
                  }}
                  className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center shadow-sm"
                >
                  {done ? (
                    <CheckCircle size={18} className="text-white" />
                  ) : (
                    <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
                  )}
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${active ? "text-primary-600" : done ? "text-slate-500" : "text-slate-300"}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Order Summary */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Package size={14} className="text-primary-600" /> Order Review
                  </h3>
                  <div className="flex gap-5">
                    <img src={product.image} className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-sm" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-relaxed mb-2">{product.title}</h4>
                      <span className="inline-block text-[10px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-lg">
                        x{qty} Unit{qty > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* What You Get */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <CheckCheck size={14} className="text-emerald-600" /> What You Get
                  </h3>
                  <div className="space-y-3">
                    {["Full account credentials (email + password)", "Instant automated delivery", "48-hour escrow buyer protection", "Lifetime warranty & replacement guarantee"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle size={12} className="text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Escrow Explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6 flex gap-4">
                  <ShieldCheck size={24} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-blue-900 mb-1">Escrow Protection</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Your payment is held securely for 48 hours. If the product doesn't match the description, you get a full refund automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Sidebar */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-lg sticky top-24 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Price Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal ({qty}x)</span>
                      <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Service Fee</span>
                      <span className="font-bold text-slate-900">${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Buyer Protection</span>
                      <span className="font-bold text-emerald-600">FREE</span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex justify-between">
                      <span className="font-black text-slate-900 text-sm uppercase tracking-wide">Total</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-primary-600">${total.toFixed(2)}</span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">USD · VAT Included</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setStep(2)} className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                  <div className="flex justify-center gap-4">
                    {[<Shield size={12} />, <Lock size={12} />, <ShieldCheck size={12} />].map((icon, i) => (
                      <div key={i} className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-slate-300">{icon}</span>
                        {["SSL", "PCI", "Escrow"][i]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-7 space-y-6">
                {/* Delivery email */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Mail size={14} className="text-primary-600" /> Delivery Email
                  </h3>
                  <input
                    type="email"
                    placeholder="Enter your email for delivery"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 font-bold mt-3 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={11} className="text-primary-600" /> Credentials will be sent here instantly after payment.
                  </p>
                </div>

                {/* Payment methods */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-600" /> Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "credit_card", label: "Credit / Debit", icon: <CreditCard size={18} /> },
                      { id: "crypto",      label: "Cryptocurrency", icon: <Coins size={18} /> },
                      { id: "wallet",      label: "Digital Wallet", icon: <Wallet size={18} /> },
                      { id: "stripe",      label: "Stripe",         icon: <ShieldCheck size={18} /> },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${paymentMethod === m.id ? "bg-primary-50 border-primary-300 text-primary-700 ring-1 ring-primary-400/30 shadow-md" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"}`}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-lg sticky top-24 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Total</h3>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-slate-900">Total</span>
                    <span className="text-3xl font-black text-primary-600">${total.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={processing}
                    onClick={handlePlaceOrder}
                    className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : <><Zap size={18} fill="currentColor" /> Confirm & Pay</>}
                  </button>
                  <button onClick={() => setStep(1)} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
                    ← Back to Review
                  </button>
                  <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                    By confirming you agree to our Terms and Escrow Protection Policy.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-6"
              >
                <CheckCircle size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Order Confirmed!</h2>
              <p className="text-slate-500 text-sm mb-4">Your credentials are being prepared. Redirecting to order tracking...</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest">
                <Loader2 size={14} className="animate-spin" /> Redirecting...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
