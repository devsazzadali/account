import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, Copy, Download, Home, ShoppingBag, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Order {
  id: number;
  productTitle: string;
  productImage: string;
  total: number;
  status: string;
  date: string;
  deliveryContent: string;
}

export function OrderPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulated fetch
    setTimeout(() => {
        setOrder({
            id: 7782,
            productTitle: "HULU NO ADS 🔥 FAST DELIVERY 🔥 3 MONTHS SUBSCRIPTION",
            productImage: "https://picsum.photos/seed/hulu/200/200",
            total: 3.00,
            status: "Completed",
            date: new Date().toISOString(),
            deliveryContent: "HULU-PRM-UX-9928-1120-XQZP"
        });
        setLoading(false);
    }, 1000);
  }, [orderId]);

  const handleCopy = () => {
    if (order) {
        navigator.clipboard.writeText(order.deliveryContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-dark-50/40 text-xs font-bold uppercase tracking-widest">Resolving Transaction...</p>
        </div>
    );
  }

  if (!order) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
            <Link to="/" className="text-primary-400 hover:underline">Return to Marketplace</Link>
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
        <div className="glass-card rounded-3xl border-white/5 overflow-hidden shadow-2xl">
          {/* Success Header */}
          <div className="bg-primary-500/10 p-12 text-center border-b border-primary-500/10 relative overflow-hidden">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/30"
              >
                  <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl font-display font-bold text-white mb-2">Payment Confirmed!</h1>
              <p className="text-primary-400/80 font-medium">Your digital asset is ready for deployment.</p>
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 blur-[80px] rounded-full -z-10"></div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
              {/* Delivery Content */}
              <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-dark-50/40 flex items-center gap-2">
                        <Zap size={14} className="text-yellow-400" />
                        Instant Access Credentials
                    </h2>
                    <span className="text-[10px] font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">ORDER #{order.id}</span>
                  </div>
                  <div className="bg-white/2 border border-white/5 rounded-2xl p-6 relative group">
                      <div className="text-[10px] font-bold text-dark-50/20 uppercase tracking-widest mb-3">Product Key / Access Token</div>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                          <code className="flex-1 bg-dark-900/50 border border-white/10 rounded-xl px-6 py-4 font-mono text-lg text-primary-400 break-all text-center md:text-left">
                              {order.deliveryContent}
                          </code>
                          <button 
                            onClick={handleCopy}
                            className={`p-4 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${
                                copied 
                                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                              {copied ? "Copied" : "Copy"}
                          </button>
                      </div>
                      <div className="mt-4 text-[10px] text-dark-50/30 font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                          <Download size={12} />
                          <span>A copy has been dispatched to your registered email.</span>
                      </div>
                  </div>
              </section>

              {/* Order Summary */}
              <section className="pt-8 border-t border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-dark-50/40 mb-6">Asset Specification</h3>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img src={order.productImage} alt={order.productTitle} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                          <div className="text-lg font-bold text-white mb-1">{order.productTitle}</div>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                              <div className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest">Resolution Date: <span className="text-white ml-1">{new Date(order.date).toLocaleDateString()}</span></div>
                              <div className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest">Status: <span className="text-green-400 ml-1">{order.status}</span></div>
                          </div>
                      </div>
                      <div className="text-2xl font-display font-bold text-white">
                          ${order.total.toFixed(2)}
                      </div>
                  </div>
              </section>

              {/* Actions & Protection */}
              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center text-primary-400">
                          <ShieldCheck size={20} />
                      </div>
                      <div>
                          <div className="text-xs font-bold text-white">Titan Guaranteed™</div>
                          <div className="text-[10px] text-dark-50/40 font-bold uppercase tracking-widest">Protected Transaction</div>
                      </div>
                  </div>
                  <Link 
                    to="/" 
                    className="group flex items-center gap-2 text-primary-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                  >
                      <Home size={14} />
                      Return to Marketplace
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
              </div>
          </div>
        </div>
        
        {/* Support Section */}
        <div className="mt-8 text-center">
            <p className="text-dark-50/30 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Encountered an issue?</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-dark-50/60 hover:text-white transition-all">
                <MessageSquare size={14} />
                Contact Command Support
            </button>
        </div>
      </motion.div>
    </div>
  );
}
