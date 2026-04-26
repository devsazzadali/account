import React, { useEffect, useState } from "react";
import { Download, Search, ShoppingBag, ExternalLink, Copy, CheckCircle2, Package, Clock, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchOrders();
  }, [activeFilter]);

  async function fetchOrders() {
    try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        let query = supabase
            .from('orders')
            .select('*, products(title, image, category)')
            .eq('username', localStorage.getItem('username') || '') // More reliable than email prefix
            .order('created_at', { ascending: false });
        
        if (activeFilter === "Success") {
            query = query.eq('status', 'Completed');
        } else if (activeFilter === "Processing") {
            query = query.or('status.eq.Preparing,status.eq.Delivering,status.eq.Paid');
        }
        
        const { data, error } = await query;
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return o.id.toLowerCase().includes(term) || 
           (o.products?.title && o.products.title.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-8 font-sans pb-20">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#1dbf73]">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Assets</p>
                        <p className="text-xl font-black text-slate-900">{orders.length}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Processing</p>
                        <p className="text-xl font-black text-slate-900">{orders.filter(o => o.status !== 'Completed' && o.status !== 'Canceled').length}</p>
                    </div>
                </div>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
                        <p className="text-xl font-black text-slate-900">{orders.length > 0 ? Math.round((orders.filter(o => o.status === 'Completed').length / orders.length) * 100) : 0}%</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 w-full md:w-auto">
                {["All", "Success", "Processing"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${
                            activeFilter === tab 
                            ? "bg-[#1dbf73] text-white shadow-lg shadow-emerald-500/20" 
                            : "text-slate-400 hover:text-slate-900"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by Order ID or Product..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-[#1dbf73] transition-all"
                />
            </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw className="animate-spin text-[#1dbf73] mx-auto mb-4" size={32} />
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Syncing Procurement Ledger...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-lg font-black text-slate-900">No Orders Detected</p>
                    <p className="text-sm text-slate-400 font-medium">Your procurement history is currently empty.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={order.id} 
                        className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-[#1dbf73]/30 transition-all group overflow-hidden relative"
                    >
                        <div className="flex flex-col lg:flex-row items-center gap-8">
                            {/* Product Image */}
                            <div className="w-24 h-24 rounded-[1.5rem] border border-slate-100 overflow-hidden shrink-0 shadow-lg relative">
                                <img src={order.products?.image} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
                                        order.status === 'Completed' ? "bg-emerald-50 text-[#1dbf73] border-emerald-100" :
                                        order.status === 'Canceled' ? "bg-red-50 text-red-500 border-red-100" :
                                        "bg-blue-50 text-blue-500 border-blue-100"
                                    }`}>
                                        {order.status}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{order.products?.category}</span>
                                </div>
                                <h4 className="text-[17px] font-black text-slate-900 mb-2 leading-tight group-hover:text-[#1dbf73] transition-colors">{order.products?.title}</h4>
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-[12px] text-slate-400 font-medium">
                                    <span className="flex items-center gap-1.5"><Package size={14} /> ID: <span className="text-slate-900 font-bold">#{order.id.split('-')[0].toUpperCase()}</span></span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(order.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">${Number(order.total_price).toFixed(2)}</div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:text-[#1dbf73] hover:bg-emerald-50 rounded-2xl transition-all border border-slate-100">
                                        <Download size={18} />
                                    </button>
                                    <Link to={`/checkout?order=${order.id}`} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-[#1dbf73] transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2">
                                        Details <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Status Line */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${
                             order.status === 'Completed' ? "bg-[#1dbf73]" :
                             order.status === 'Canceled' ? "bg-red-500" :
                             "bg-blue-500"
                        }`} />
                    </motion.div>
                ))
            )}
        </div>
    </div>
  );
}
