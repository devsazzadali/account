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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
        if (!orderId) {
            setError("No Order ID provided");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log("Fetching order:", orderId);
            
            const { data, error: supabaseError } = await supabase
                .from('orders')
                .select('*, products(title, image)')
                .eq('id', orderId)
                .single();

            if (supabaseError) throw supabaseError;
            if (!data) throw new Error("Order not found");
            
            setOrder(data);
        } catch (err: any) {
            console.error("Error fetching order:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }
    fetchOrder();
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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Resolving Transaction...</p>
        </div>
    );
  }

  if (error || !order) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{error === "Order not found" ? "Order Not Found" : "Transaction Error"}</h2>
            <p className="text-slate-400 text-sm mb-8 font-medium">{error || "The transaction record you are looking for does not exist in our ledger."}</p>
            <Link to="/" className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Return to Hub</Link>
        </div>
    );
  }

  // Safe ID display
  const displayId = typeof order.id === 'string' && order.id.includes('-') 
    ? order.id.split('-')[0].toUpperCase() 
    : String(order.id).substring(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto relative z-10"
      >
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl">
          {/* Success Header */}
          <div className="bg-primary-50 p-12 text-center border-b border-slate-100 relative overflow-hidden">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20"
              >
                  <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-2 italic">Settlement Successful</h1>
              <p className="text-primary-600 font-bold uppercase tracking-widest text-[10px]">Your digital asset is authorized for deployment.</p>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 blur-[80px] rounded-full -z-10"></div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
              {/* Delivery Content */}
              <section>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                        <Zap size={14} className="text-yellow-500" />
                        Asset Access Portal
                    </h2>
                    <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100 uppercase tracking-widest">LOG #{displayId}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 relative group shadow-inner">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-4">Digital Key / Credentials</div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <code className="text-xl md:text-2xl font-mono font-bold text-slate-900 tracking-wider break-all text-center sm:text-left">
                            {order.credentials || "PENDING_DELIVERY_SYNC"}
                        </code>
                        <button 
                            onClick={handleCopy}
                            className="shrink-0 p-4 bg-white text-primary-600 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-md border border-slate-100 flex items-center gap-2"
                        >
                            {copied ? <span className="text-xs font-bold uppercase tracking-widest">Copied!</span> : <Copy size={20} />}
                        </button>
                      </div>
                  </div>
                  <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">This key has been transmitted to {order.customer_email}</p>
              </section>

              {/* Order Recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-b border-slate-100">
                  <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                          <img src={order.products?.image || "https://picsum.photos/seed/default/200/200"} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex flex-col justify-center">
                          <h3 className="text-xs font-bold text-slate-900 mb-1">{order.products?.title || "Premium Digital Asset"}</h3>
                          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Settlement Complete</p>
                      </div>
                  </div>
                  <div className="flex flex-col justify-center text-left md:text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Valuation</div>
                      <div className="text-3xl font-display font-bold text-slate-900">${Number(order.total_price).toFixed(2)}</div>
                  </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link 
                    to="/" 
                    className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                  >
                      <Home size={18} />
                      Return to Hub
                  </Link>
                  <button className="flex-1 py-4 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20">
                      <ShoppingBag size={18} />
                      Purchase Summary
                  </button>
              </div>

              {/* Support Info */}
              <div className="flex items-center justify-center gap-6 pt-6 opacity-40 group cursor-default">
                  <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      <ShieldCheck size={14} className="text-primary-600" />
                      TitanGuard Secured
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      24/7 Deployment Support
                  </div>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
