import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Copy, Home, ShoppingBag, ArrowRight, ShieldCheck, Zap, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

interface Order {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  credentials?: string;
  customer_email?: string;
  products?: {
    title: string;
    image: string;
  }
}

export function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*, products(title, image)')
                .eq('id', orderId)
                .single();
            if (error) throw error;
            setOrder(data);
        } catch (err: any) {
            console.error("Error fetching order:", err.message);
        } finally {
            setLoading(false);
        }
    }
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleCopy = () => {
    if (order?.credentials) {
        navigator.clipboard.writeText(order.credentials);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-dark-50/40 text-xs font-bold uppercase tracking-widest">Resolving Transaction...</p>
        </div>
    );
  }

  if (!order) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
            <p className="text-dark-50/40 text-sm mb-8">The transaction record you are looking for does not exist in our ledger.</p>
            <Link to="/" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Return to Hub</Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          {/* Success Header */}
          <div className="bg-primary-500/10 p-12 text-center border-b border-white/5 relative overflow-hidden">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30"
              >
                  <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-display font-bold text-white mb-2 italic">Settlement Successful</h1>
              <p className="text-primary-400 font-bold uppercase tracking-widest text-[10px]">Your digital asset is authorized for deployment.</p>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full -z-10"></div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
              {/* Delivery Content */}
              <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-dark-50/40 flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        Asset Access Portal
                    </h2>
                    <span className="text-[9px] font-bold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20">LOG #{order.id.split('-')[0].toUpperCase()}</span>
                  </div>
                  <div className="bg-dark-900/50 border border-white/5 rounded-3xl p-8 relative group">
                      <div className="text-[9px] font-bold text-dark-50/20 uppercase tracking-[0.3em] mb-4">Digital Key / Credentials</div>
                      <div className="flex items-center justify-between gap-6">
                        <code className="text-xl font-mono font-bold text-white tracking-wider truncate">
                            {order.credentials || "PENDING_DELIVERY_SYNC"}
                        </code>
                        <button 
                            onClick={handleCopy}
                            className="shrink-0 p-3 bg-primary-500/10 text-primary-400 rounded-xl hover:bg-primary-500 hover:text-white transition-all shadow-lg shadow-primary-500/10"
                        >
                            {copied ? "Copied!" : <Copy size={20} />}
                        </button>
                      </div>
                  </div>
                  <p className="mt-4 text-[9px] text-dark-50/30 font-bold uppercase tracking-widest text-center">This key has been transmitted to {order.customer_email}</p>
              </section>

              {/* Order Recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-b border-white/5">
                  <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden shrink-0">
                          <img src={order.products?.image || "https://picsum.photos/seed/default/200/200"} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                          <h3 className="text-xs font-bold text-white mb-1">{order.products?.title}</h3>
                          <p className="text-[10px] text-dark-50/40 font-bold uppercase tracking-widest">Settlement Complete</p>
                      </div>
                  </div>
                  <div className="flex flex-col justify-center text-right">
                      <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest mb-1">Total Valuation</div>
                      <div className="text-2xl font-display font-bold text-white">${Number(order.total_price).toFixed(2)}</div>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link 
                    to="/" 
                    className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                      <Home size={18} />
                      Return to Hub
                  </Link>
                  <button className="flex-1 py-4 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-lg shadow-primary-500/10">
                      <ShoppingBag size={18} />
                      Purchase Summary
                  </button>
              </div>

              {/* Support Info */}
              <div className="flex items-center justify-center gap-6 pt-6 opacity-30 group cursor-default">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-primary-400" />
                      TitanGuard Secured
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/20"></div>
                  <div className="text-[9px] font-bold uppercase tracking-widest">
                      24/7 Deployment Support
                  </div>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
