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
          {/* Dynamic Header based on Status */}
          <div className={`p-12 text-center border-b border-slate-100 relative overflow-hidden ${
              order.status === 'Delivered' ? 'bg-primary-50' : 
              order.status === 'Cancelled' ? 'bg-red-50' : 'bg-slate-50'
          }`}>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    order.status === 'Delivered' ? 'bg-primary-600 shadow-primary-500/20' : 
                    order.status === 'Cancelled' ? 'bg-red-600 shadow-red-500/20' : 'bg-slate-800 shadow-slate-900/20'
                }`}
              >
                  {order.status === 'Delivered' ? <CheckCircle className="w-10 h-10 text-white" /> : 
                   order.status === 'Cancelled' ? <AlertCircle className="w-10 h-10 text-white" /> : 
                   <Loader2 className="w-10 h-10 text-white animate-spin" />}
              </motion.div>
              
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-2 italic">
                  {order.status === 'Delivered' ? 'Settlement Successful' : 
                   order.status === 'Awaiting Verification' ? 'Verifying Payment' :
                   order.status === 'Cancelled' ? 'Transaction Cancelled' : 'Processing Order'}
              </h1>
              <p className={`font-bold uppercase tracking-widest text-[10px] ${
                  order.status === 'Delivered' ? 'text-primary-600' : 
                  order.status === 'Cancelled' ? 'text-red-600' : 'text-slate-500'
              }`}>
                  {order.status === 'Delivered' ? 'Your digital asset is authorized for deployment.' : 
                   order.status === 'Awaiting Verification' ? 'Please wait while we confirm your payment securely.' :
                   order.status === 'Cancelled' ? 'This order has been voided by the administration.' : 'Your asset is being prepared for secure transfer.'}
              </p>
              
              {/* Background Glow */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[80px] rounded-full -z-10 ${
                  order.status === 'Delivered' ? 'bg-primary-500/20' : 
                  order.status === 'Cancelled' ? 'bg-red-500/20' : 'bg-slate-500/10'
              }`}></div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
              
              {/* Z2U Style Transaction Timeline */}
              <section className="relative px-4">
                  <div className="absolute left-[35px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
                  <div className="space-y-8 relative">
                      <div className="flex gap-6">
                          <div className="w-10 h-10 rounded-full bg-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center shrink-0 z-10 text-white">
                              <ShoppingBag size={16} />
                          </div>
                          <div className="pt-2">
                              <div className="text-sm font-bold text-slate-900">Order Placed</div>
                              <div className="text-xs text-slate-500 font-medium mt-1">{new Date(order.created_at).toLocaleString()}</div>
                          </div>
                      </div>
                      
                      <div className={`flex gap-6 ${order.status !== 'Awaiting Verification' ? 'opacity-100' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white transition-all ${order.status !== 'Awaiting Verification' ? 'bg-primary-600 shadow-lg shadow-primary-500/30' : 'bg-slate-300'}`}>
                              <ShieldCheck size={16} />
                          </div>
                          <div className="pt-2">
                              <div className="text-sm font-bold text-slate-900">Payment Verified</div>
                              <div className="text-xs text-slate-500 font-medium mt-1">
                                  {order.status !== 'Awaiting Verification' ? 'Funds secured in escrow.' : 'Awaiting gateway confirmation...'}
                              </div>
                          </div>
                      </div>

                      <div className={`flex gap-6 ${order.status === 'Delivered' ? 'opacity-100' : 'opacity-40'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white transition-all ${order.status === 'Delivered' ? 'bg-primary-600 shadow-lg shadow-primary-500/30' : 'bg-slate-300'}`}>
                              <CheckCircle size={16} />
                          </div>
                          <div className="pt-2">
                              <div className="text-sm font-bold text-slate-900">Asset Delivered</div>
                              <div className="text-xs text-slate-500 font-medium mt-1">
                                  {order.status === 'Delivered' ? 'Credentials securely transmitted.' : 'Pending admin deployment.'}
                              </div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Secure Delivery Content */}
              {order.status === 'Delivered' && (
                  <section>
                      <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Zap size={14} className="text-yellow-500" />
                            Secure Vault
                        </h2>
                        <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100 uppercase tracking-widest">LOG #{displayId}</span>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative group shadow-inner">
                          <div className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] mb-4">Digital Key / Credentials</div>
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <code className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider break-all text-center sm:text-left">
                                {order.credentials || "PENDING_DELIVERY_SYNC"}
                            </code>
                            <button 
                                onClick={handleCopy}
                                className="shrink-0 p-4 bg-white/10 text-white rounded-2xl hover:bg-primary-600 transition-all shadow-md border border-white/5 flex items-center gap-2"
                            >
                                {copied ? <span className="text-xs font-bold uppercase tracking-widest">Copied!</span> : <Copy size={20} />}
                            </button>
                          </div>
                      </div>
                      <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">Do not share these credentials with anyone.</p>
                  </section>
              )}

              {/* Order Recap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-t border-b border-slate-100">
                  <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                          <img src={order.products?.image || "https://picsum.photos/seed/default/200/200"} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex flex-col justify-center">
                          <h3 className="text-xs font-bold text-slate-900 mb-1">{order.products?.title || "Premium Digital Asset"}</h3>
                          <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">ID: {displayId}</p>
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
                    to="/dashboard" 
                    className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                  >
                      <Home size={18} />
                      Dashboard
                  </Link>
                  <Link 
                    to="/dashboard?tab=support"
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                  >
                      <AlertCircle size={18} />
                      Open Dispute
                  </Link>
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
