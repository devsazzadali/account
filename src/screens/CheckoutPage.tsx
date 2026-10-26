"use client";

// AccountStoreOne — checkout.
// Real payment state machine (completion build):
//   1. The order is created server-side via POST /api/orders, which checks
//      and reserves stock. The order starts UNPAID.
//   2a. Manual rail (bKash/Nagad): the buyer sends money to the store
//       number shown here, then submits TrxID + sender number. The order
//       becomes "pending_verification" until an admin approves it in the
//       Payment Verification queue — only then is it paid and delivered.
//   2b. Wallet rail: balance is debited in the same transaction; the
//       order is paid immediately and auto-delivery runs.
//   2c. Stripe rail: only offered when the store has configured Stripe
//       keys; otherwise the option is shown as unavailable, never faked.
// An unpaid order NEVER displays as paid anywhere in the app.

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck, CreditCard, Lock, CheckCircle, Wallet,
  ArrowLeft, Zap, Shield, AlertCircle, ChevronRight, Loader2,
  Package, Mail, CheckCheck, Smartphone, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../lib/auth-client";
import { toast } from "react-hot-toast";
import { PageLoader } from "../components/SkeletonUI";

interface Product { id: string; title: string; price: number; image: string; stock: number; }

interface PaymentConfig {
  manual: {
    enabled: boolean;
    bkashNumber: string | null;
    nagadNumber: string | null;
    instructions: string;
  };
  stripe: { enabled: boolean };
}

const STEPS = [
  { id: 1, label: "Review Order",    icon: Package },
  { id: 2, label: "Payment",         icon: CreditCard },
  { id: 3, label: "Confirmation",    icon: CheckCheck },
];

export function CheckoutPage() {
  const params = useParams();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const router = useRouter();
  const searchParams = useSearchParams();
  const qty = Math.max(1, parseInt(searchParams.get("quantity") || "1") || 1);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("bkash");
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState("");
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [paidViaWallet, setPaidViaWallet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!productId) return;
    (async () => {
      const [prodRes, cfgRes, meRes] = await Promise.all([
        fetch(`/api/db/products?id=eq.${productId}`).then((r) => r.json()).catch(() => null),
        fetch("/api/payments/config").then((r) => r.json()).catch(() => null),
        auth.getSession().catch(() => ({ data: { session: null } })),
      ]);
      const row = prodRes?.data?.[0];
      if (row) setProduct(row);
      if (cfgRes) {
        setPayConfig(cfgRes);
        if (!cfgRes.manual?.bkashNumber && cfgRes.manual?.nagadNumber) setPaymentMethod("nagad");
      }
      const session = (meRes as any)?.data?.session;
      if (session?.user?.email) setEmail(session.user.email);
      if (session) {
        const w = await fetch("/api/wallet").then((r) => r.json()).catch(() => null);
        if (w) setWalletBalance(Number(w.wallet?.balance ?? w.balance) || 0);
      }
      setLoading(false);
    })();
  }, [productId]);

  const serviceFee = 0.50;
  const subtotal = (product?.price || 0) * qty;
  const total = subtotal + serviceFee;
  const outOfStock = !product || product.stock <= 0 || qty > product.stock;
  const manualNumber = paymentMethod === "bkash" ? payConfig?.manual.bkashNumber : paymentMethod === "nagad" ? payConfig?.manual.nagadNumber : null;
  const walletSufficient = walletBalance !== null && walletBalance >= total;

  async function api(path: string, body?: any) {
    const res = await fetch(path, {
      method: body ? "POST" : "GET",
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }

  const handlePlaceOrder = async () => {
    if (!email.trim()) { toast.error("Please enter your delivery email"); return; }
    if (outOfStock) { toast.error("This product is out of stock"); return; }
    if ((paymentMethod === "bkash" || paymentMethod === "nagad")) {
      if (!manualNumber) { toast.error("This payment method is not available right now"); return; }
      if (trxId.trim().length < 6) { toast.error("Enter the Transaction ID from your payment"); return; }
      if (senderNumber.trim().length < 6) { toast.error("Enter the number you sent the money from"); return; }
    }
    if (paymentMethod === "wallet" && !walletSufficient) { toast.error("Insufficient wallet balance — top up from your dashboard first"); return; }
    if (paymentMethod === "stripe" && !payConfig?.stripe.enabled) { toast.error("Card payments are not configured for this store yet"); return; }

    setProcessing(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (!session) {
        toast.error("Please sign in to complete your purchase");
        router.push(`/login?next=${encodeURIComponent(`/checkout/${productId}?quantity=${qty}`)}`);
        return;
      }

      let orderId = createdOrderId;
      if (!orderId) {
        const created = await api("/api/orders", {
          product_id: product!.id,
          quantity: qty,
          customer_email: email,
          payWithWallet: paymentMethod === "wallet",
        });
        orderId = created.order.id;
        setCreatedOrderId(orderId);
        if (paymentMethod === "wallet") setPaidViaWallet(true);
      }

      if (paymentMethod === "bkash" || paymentMethod === "nagad") {
        await api(`/api/orders/${orderId}`, { action: "submit_payment", method: paymentMethod, trxId: trxId.trim(), senderNumber: senderNumber.trim() });
      }
      if (paymentMethod === "stripe") {
        const s = await api("/api/payments/stripe/session", { orderId });
        if (s.url) { window.location.href = s.url; return; }
      }
      setStep(3);
      setTimeout(() => router.push(`/order/${orderId}`), 2500);
    } catch (err: any) {
      toast.error(err.message || "Order failed");
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader label="Initializing Secure Checkout..." />;
  if (!product) return <div className="p-8 text-center">Product not found.</div>;

  const methods: { id: string; label: string; icon: React.ReactNode; disabled?: boolean; note?: string }[] = [
    ...(payConfig?.manual.bkashNumber ? [{ id: "bkash", label: "bKash", icon: <Smartphone size={18} /> }] : []),
    ...(payConfig?.manual.nagadNumber ? [{ id: "nagad", label: "Nagad", icon: <Smartphone size={18} /> }] : []),
    { id: "wallet", label: "Store Wallet", icon: <Wallet size={18} />, note: walletBalance === null ? "Sign in to use" : `Balance $${walletBalance.toFixed(2)}` },
    { id: "stripe", label: "Card (Stripe)", icon: <CreditCard size={18} />, disabled: !payConfig?.stripe.enabled, note: payConfig?.stripe.enabled ? undefined : "Not configured yet" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-primary-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition-all">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Secure Checkout</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
              <Lock size={10} className="text-primary-600" /> Escrow Buyer Protection Active
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
                    backgroundColor: done ? "#17995c" : active ? "#0C2254" : "#f1f5f9",
                    borderColor: done || active ? "#0C2254" : "#e2e8f0",
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

        {outOfStock && step < 3 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-[2rem] p-6 flex gap-4">
            <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-red-900 mb-1">Out of stock</h4>
              <p className="text-[12px] text-red-700 leading-relaxed">This product has no stock available for the requested quantity right now. Please check back later or pick another product.</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Package size={14} className="text-primary-600" /> Order Review
                  </h3>
                  <div className="flex gap-5">
                    <img src={product.image} className="w-20 h-20 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-sm" alt={product.title} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-relaxed mb-2">{product.title}</h4>
                      <span className="inline-block text-[10px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-lg">
                        x{qty} Unit{qty > 1 ? "s" : ""}
                      </span>
                      <span className={`ml-2 inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border ${product.stock > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-red-500 bg-red-50 border-red-100"}`}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <CheckCheck size={14} className="text-emerald-600" /> What You Get
                  </h3>
                  <div className="space-y-3">
                    {["Full account credentials (email + password) in your order vault", "Automatic delivery when the item is in stock", "48-hour escrow buyer protection after delivery", "Replacement or wallet refund if the credentials don't work"].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <CheckCircle size={12} className="text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6 flex gap-4">
                  <ShieldCheck size={24} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-black text-blue-900 mb-1">Escrow Protection</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Your payment is held in escrow until delivery. After delivery you have 48 hours to confirm receipt or open a dispute — disputes are resolved with a replacement or a refund to your store wallet.
                    </p>
                  </div>
                </div>
              </div>

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
                        <p className="text-[9px] text-slate-400 font-bold uppercase">USD</p>
                      </div>
                    </div>
                  </div>
                  <button disabled={outOfStock} onClick={() => setStep(2)} className="w-full py-4 bg-[#0C2254] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                  <div className="flex justify-center gap-4">
                    {[<Shield key="a" size={12} />, <Lock key="b" size={12} />, <ShieldCheck key="c" size={12} />].map((icon, i) => (
                      <div key={i} className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="text-slate-300">{icon}</span>
                        {["SSL", "Verified", "Escrow"][i]}
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
                    <AlertCircle size={11} className="text-primary-600" /> Your credentials appear in the secure vault on your order page after payment verification.
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-600" /> Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {methods.map(m => (
                      <button
                        key={m.id}
                        disabled={m.disabled}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all ${m.disabled ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed" : paymentMethod === m.id ? "bg-primary-50 border-primary-300 text-primary-700 ring-1 ring-primary-400/30 shadow-md" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"}`}
                      >
                        <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest">{m.icon} {m.label}</span>
                        {m.note && <span className="text-[9px] font-bold normal-case tracking-normal opacity-70">{m.note}</span>}
                      </button>
                    ))}
                  </div>

                  {(paymentMethod === "bkash" || paymentMethod === "nagad") && manualNumber && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        1. Send <span className="text-slate-900 font-black">${total.toFixed(2)}</span> via {paymentMethod === "bkash" ? "bKash" : "Nagad"} (Send Money) to:
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black tracking-wider text-[#0C2254] bg-white border border-slate-200 rounded-2xl px-5 py-3">{manualNumber}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(manualNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                          className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-900 transition-all"
                        >
                          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                      {payConfig?.manual.instructions && (
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{payConfig.manual.instructions}</p>
                      )}
                      <p className="text-xs font-bold text-slate-700">2. Then enter your payment details:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                          placeholder="Transaction ID (TrxID)"
                          className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold tracking-wide focus:outline-none focus:border-primary-500 transition-all"
                        />
                        <input
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          placeholder="Your sender number"
                          className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold tracking-wide focus:outline-none focus:border-primary-500 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        The store verifies every Transaction ID manually. Your order shows "Awaiting Verification" until it is approved — delivery follows automatically.
                      </p>
                    </div>
                  )}

                  {paymentMethod === "wallet" && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                      {walletBalance === null ? (
                        <p className="text-xs font-bold text-slate-500">Sign in to pay with your store wallet.</p>
                      ) : walletSufficient ? (
                        <p className="text-xs font-bold text-slate-700 leading-relaxed">
                          Your wallet balance is <span className="text-slate-900 font-black">${walletBalance.toFixed(2)}</span> — the full total will be debited and your order paid instantly.
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-red-500 leading-relaxed">
                          Wallet balance ${walletBalance.toFixed(2)} is below the ${total.toFixed(2)} total. Top up your wallet from your account dashboard first.
                        </p>
                      )}
                    </div>
                  )}

                  {paymentMethod === "stripe" && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6">
                      <p className="text-xs font-bold text-slate-500 leading-relaxed">
                        {payConfig?.stripe.enabled
                          ? "You will be redirected to Stripe's secure checkout to pay by card."
                          : "Card payments are not configured for this store yet. Please use bKash/Nagad or your store wallet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-lg sticky top-24 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Order Total</h3>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black text-slate-900">Total</span>
                    <span className="text-3xl font-black text-primary-600">${total.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={processing || outOfStock}
                    onClick={handlePlaceOrder}
                    className="w-full py-5 bg-[#0C2254] text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {processing ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : paymentMethod === "wallet" ? <><Wallet size={18} /> Pay from Wallet</> : paymentMethod === "stripe" ? <><CreditCard size={18} /> Continue to Stripe</> : <><Zap size={18} fill="currentColor" /> Place Order & Submit Payment</>}
                  </button>
                  <button onClick={() => setStep(1)} className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">
                    ← Back to Review
                  </button>
                  <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                    By confirming you agree to our Terms and Buyer Protection policy.
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
                className="w-24 h-24 rounded-full bg-[#0C2254] flex items-center justify-center shadow-2xl mb-6"
              >
                <CheckCircle size={48} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Order Placed!</h2>
              <p className="text-slate-500 text-sm mb-4 max-w-md">
                {paidViaWallet
                  ? "Paid from your wallet. Redirecting to your order — your credentials are in the vault."
                  : "Your payment details were submitted for verification. Once the store confirms your payment, delivery happens automatically. Redirecting to your order…"}
              </p>
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
