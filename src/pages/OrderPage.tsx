import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck, Zap, CheckCircle, Clock, Package, Eye, EyeOff,
  Copy, Check, AlertTriangle, Lock, ArrowLeft, Loader2, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";
import { PageLoader } from "../components/SkeletonUI";

interface Order {
  id: string;
  status: string;
  total_price: number;
  quantity: number;
  created_at: string;
  customer_email: string;
  products?: { title: string; image: string; };
  credential_username?: string;
  credential_password?: string;
  credential_notes?: string;
}

const STATUS_TIMELINE = ["New Order", "PREPARING", "Delivering", "Completed"];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  "New Order":  { label: "Payment Verified",  color: "text-blue-600",    bg: "bg-blue-50 border-blue-200",    icon: <CheckCircle size={16} /> },
  "PREPARING":  { label: "Preparing Delivery", color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",  icon: <Clock size={16} /> },
  "Delivering": { label: "Sending Credentials",color: "text-primary-600", bg: "bg-primary-50 border-primary-200",icon: <Zap size={16} /> },
  "Completed":  { label: "Delivered",          color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200",icon: <CheckCircle size={16} /> },
  "disputed":   { label: "Under Dispute",      color: "text-red-600",     bg: "bg-red-50 border-red-200",      icon: <AlertTriangle size={16} /> },
};

export function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, image)")
        .eq("id", orderId)
        .single();
      if (!error) setOrder(data);
      setLoading(false);
    };

    fetchOrder();

    // Real-time subscription
    const channel = supabase
      .channel(`order_${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, (payload) => {
        setOrder(prev => prev ? { ...prev, ...payload.new } : null);
        toast.success("Order status updated!");
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) return <PageLoader label="Loading Order..." />;
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  const stepIndex = STATUS_TIMELINE.indexOf(order.status);
  const cfg = statusConfig[order.status] || statusConfig["New Order"];
  const hasCredentials = order.status === "Completed" || order.status === "Delivering";

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Fixed top banner */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Tracking</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{orderId?.slice(0, 12).toUpperCase()}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
            {cfg.icon} {cfg.label}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Product Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center gap-5">
          <img src={order.products?.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-sm" />
          <div className="flex-1">
            <h2 className="text-sm font-black text-slate-900 leading-tight mb-1">{order.products?.title}</h2>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Qty: {order.quantity}</span>
              <span>•</span>
              <span className="text-primary-600">${order.total_price.toFixed(2)}</span>
              <span>•</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Timeline</h3>
          <div className="space-y-0">
            {STATUS_TIMELINE.map((status, i) => {
              const isDone = i <= stepIndex;
              const isActive = i === stepIndex;
              const sCfg = statusConfig[status];
              return (
                <div key={status} className="flex items-start gap-4 relative">
                  {/* Vertical line */}
                  {i < STATUS_TIMELINE.length - 1 && (
                    <div className={`absolute left-5 top-10 w-0.5 h-8 ${isDone && i < stepIndex ? "bg-primary-300" : "bg-slate-100"}`} />
                  )}
                  {/* Node */}
                  <motion.div
                    animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isDone ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-50 border-slate-200 text-slate-300"}`}
                  >
                    {isDone ? <CheckCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                  </motion.div>
                  {/* Label */}
                  <div className="pb-8">
                    <p className={`text-sm font-black ${isDone ? "text-slate-900" : "text-slate-300"}`}>
                      {sCfg?.label}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? "text-primary-600" : "text-slate-300"}`}>
                      {isActive ? "In Progress..." : isDone ? "Complete" : "Pending"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credential Vault */}
        {hasCredentials ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-emerald-600 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {revealed ? <ShieldCheck size={20} className="text-white" /> : <Lock size={20} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Credential Vault</h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                    {revealed ? "Credentials Visible — Keep Secure" : "Tap to unlock your account access"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRevealed(!revealed)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/30"
              >
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                {revealed ? "Hide" : "Reveal"}
              </button>
            </div>

            <AnimatePresence>
              {revealed ? (
                <motion.div
                  key="revealed"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-6 space-y-4"
                >
                  {[
                    { label: "Email / Username", value: order.credential_username || "user@example.com", field: "Username" },
                    { label: "Password", value: order.credential_password || "••••••••••••", field: "Password" },
                  ].map(cred => (
                    <div key={cred.field} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{cred.label}</p>
                      <div className="flex items-center justify-between gap-3">
                        <code className="text-sm font-mono font-bold text-slate-900 break-all">{cred.value}</code>
                        <button
                          onClick={() => copyToClipboard(cred.value, cred.field)}
                          className="shrink-0 p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-primary-600 border border-slate-200"
                        >
                          {copiedField === cred.field ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {order.credential_notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-sm text-amber-800">{order.credential_notes}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <Lock size={28} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Credentials are encrypted and secure</p>
                  <p className="text-[10px] text-slate-300 mt-1">Click "Reveal" above to unlock your account access</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Waiting state */
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 text-center shadow-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary-600 mx-auto mb-4"
            />
            <h3 className="text-sm font-black text-slate-900 mb-1">Preparing Your Credentials</h3>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Your account is being verified and packaged for secure delivery. This typically takes less than 60 seconds.
            </p>
          </div>
        )}

        {/* Escrow Protection Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-5 flex gap-4">
          <ShieldCheck size={22} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-blue-900 mb-1">48-Hour Escrow Protection Active</h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              If you're not satisfied, open a dispute within 48 hours for a full refund. Your money is held securely until you confirm delivery.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
