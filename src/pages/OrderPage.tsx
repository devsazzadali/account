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
  account_info?: any;
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
  const [confirming, setConfirming] = useState(false);

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

  async function handleConfirmReceipt() {
      if (!orderId || !window.confirm("Are you sure you have received and verified the account?")) return;
      
      setConfirming(true);
      try {
          const { error } = await supabase
            .from('orders')
            .update({ status: "Waiting for confirmation" })
            .eq('id', orderId);
          
          if (error) throw error;
          setOrder(prev => prev ? { ...prev, status: "Waiting for confirmation" } : null);
          alert("Thank you! The admin will verify and complete the order shortly.");
      } catch (err: any) {
          alert("Error: " + err.message);
      } finally {
          setConfirming(false);
      }
  }

  const handleCopy = (text: string) => {
    if (text) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
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

  const displayId = typeof order.id === 'string' && order.id.includes('-') 
    ? order.id.split('-')[0].toUpperCase() 
    : String(order.id).substring(0, 8).toUpperCase();

  const isDelivered = order.status === 'Delivering' || order.status === 'Waiting for confirmation' || order.status === 'Completed' || order.status === 'Evaluate';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto relative z-10"
      >
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl">
          <div className={`p-12 text-center border-b border-slate-100 relative overflow-hidden ${
              isDelivered ? 'bg-emerald-50' : 
              order.status === 'Canceled' ? 'bg-red-50' : 'bg-slate-50'
          }`}>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
                    isDelivered ? 'bg-emerald-600 shadow-emerald-500/20' : 
                    order.status === 'Canceled' ? 'bg-red-600 shadow-red-500/20' : 'bg-slate-800 shadow-slate-900/20'
                }`}
              >
                  {isDelivered ? <CheckCircle className="w-10 h-10 text-white" /> : 
                   order.status === 'Canceled' ? <AlertCircle className="w-10 h-10 text-white" /> : 
                   <Loader2 className="w-10 h-10 text-white animate-spin" />}
              </motion.div>
              
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
                  {order.status === 'Delivering' ? 'Account Delivered!' : 
                   order.status === 'Waiting for confirmation' ? 'Awaiting Verification' :
                   order.status === 'Completed' ? 'Settlement Successful' :
                   order.status === 'Canceled' ? 'Transaction Cancelled' : 'Order Processing'}
              </h1>
              <p className={`font-black uppercase tracking-widest text-[10px] ${
                  isDelivered ? 'text-emerald-600' : 
                  order.status === 'Canceled' ? 'text-red-600' : 'text-slate-500'
              }`}>
                  {order.status === 'Delivering' ? 'Your digital asset is ready. Please verify the details below.' : 
                   order.status === 'Waiting for confirmation' ? 'Thank you for confirming. Admin is performing final verification.' :
                   order.status === 'Completed' ? 'Transaction finalized. Thank you for choosing us.' :
                   order.status === 'Canceled' ? 'This order has been voided by the administration.' : 'Your asset is being prepared by our deployment team.'}
              </p>
          </div>

          <div className="p-8 md:p-12 space-y-12">
              
              {/* Transaction Timeline */}
              <section className="relative px-4">
                  <div className="absolute left-[35px] top-6 bottom-6 w-0.5 bg-slate-100"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                      <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center shrink-0 z-10 text-white">
                              <ShoppingBag size={16} />
                          </div>
                          <div>
                              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 01</div>
                              <div className="text-sm font-bold text-slate-900">Order Placed</div>
                          </div>
                      </div>
                      
                      <div className={`flex gap-4 items-center ${isDelivered ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white transition-all ${isDelivered ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-200'}`}>
                              <ShieldCheck size={16} />
                          </div>
                          <div>
                              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 02</div>
                              <div className="text-sm font-bold text-slate-900">Delivered</div>
                          </div>
                      </div>

                      <div className={`flex gap-4 items-center ${order.status === 'Completed' ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 text-white transition-all ${order.status === 'Completed' ? 'bg-emerald-600 shadow-lg shadow-emerald-500/30' : 'bg-slate-200'}`}>
                              <CheckCircle size={16} />
                          </div>
                          <div>
                              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Step 03</div>
                              <div className="text-sm font-bold text-slate-900">Completed</div>
                          </div>
                      </div>
                  </div>
              </section>

              {/* Secure Delivery Content */}
              {isDelivered && order.account_info && (
                  <section className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                            <Zap size={18} className="text-yellow-500 fill-yellow-500" />
                            Account Credentials
                        </h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          {Object.entries(order.account_info).map(([key, value]) => {
                              if (!value) return null;
                              // Format keys for readability
                              const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                  <div key={key} className="flex flex-col gap-1.5 group">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formattedKey}</span>
                                      <div className="flex items-center justify-between gap-4 p-3.5 bg-white border border-slate-200 rounded-xl group-hover:border-emerald-300 transition-all">
                                          <span className="text-[13px] font-bold text-slate-900 truncate">{String(value)}</span>
                                          <button onClick={() => handleCopy(String(value))} className="text-slate-400 hover:text-emerald-600 transition-colors">
                                              <Copy size={14} />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      {order.status === 'Delivering' && (
                          <div className="mt-12 pt-10 border-t border-slate-200 text-center">
                              <p className="text-sm text-slate-500 font-medium mb-6">Have you checked the account details and verified everything is correct?</p>
                              <button 
                                onClick={handleConfirmReceipt}
                                disabled={confirming}
                                className="px-12 py-4 bg-emerald-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto"
                              >
                                  {confirming ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle size={18} /> Confirm Receipt & Done</>}
                              </button>
                          </div>
                      )}
                  </section>
              )}

              {/* Order Recap */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-10 border-t border-slate-100">
                  <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl border border-slate-200 overflow-hidden shrink-0 shadow-md">
                          <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-slate-900 mb-1 leading-tight">{order.products?.title}</h3>
                          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>ID: #{displayId}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>QTY: 1</span>
                          </div>
                      </div>
                  </div>
                  <div className="text-center md:text-right">
                      <div className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Settlement</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tight">${Number(order.total_price).toFixed(2)}</div>
                  </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/dashboard" 
                    className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
                  >
                      <Home size={18} />
                      Return to Hub
                  </Link>
                  <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                      <AlertCircle size={18} />
                      Support Center
                  </button>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
