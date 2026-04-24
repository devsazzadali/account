import React, { useEffect, useState } from "react";
import { 
  Download, 
  ChevronDown, 
  Zap, 
  Loader2, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  XCircle,
  ShoppingBag
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function AdminOrders() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const statuses = ["Awaiting Verification", "Paid", "Delivered", "Cancelled"];

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(title, image)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
        
        if (error) throw error;
        
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
        alert("Update Error: " + err.message);
    } finally {
        setUpdatingId(null);
    }
  }

  const filteredOrders = orders.filter(o => {
      if (filter === "All") return true;
      if (filter === "Pending") return o.status === "Awaiting Verification";
      return o.status === filter;
  });

  return (
    <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                    <Zap size={12} fill="currentColor" />
                    Transaction Hub
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-900 italic">Order Ledger</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage and verify digital asset acquisitions in real-time.</p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={fetchOrders}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh Node
                </button>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Download size={16} />
                    Export Ledger
                </button>
            </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                    {["All", "Pending", "Paid", "Delivered", "Cancelled"].map((st) => (
                        <button 
                            key={st}
                            onClick={() => setFilter(st)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                filter === st 
                                ? "bg-slate-900 text-white shadow-lg" 
                                : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search transmissions by ID or Email..." 
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Asset Detail</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Date & ID</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Recipient</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Settlement</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading && orders.length === 0 ? (
                            <tr><td colSpan={5} className="p-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</span>
                                </div>
                            </td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={5} className="p-24 text-center text-slate-400 text-sm font-medium italic">No transmissions found in this frequency.</td></tr>
                        ) : filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            {order.products?.image ? (
                                                <img src={order.products.image} className="w-full h-full object-cover rounded-xl" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                    <ShoppingBag size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-900 block group-hover:text-primary-600 transition-colors truncate max-w-[200px]">
                                                {order.products?.title || "Unknown Asset"}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                                Units: {order.quantity} • {order.id.split('-')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="text-xs font-bold text-slate-700 mb-1">
                                        {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="text-sm font-bold text-slate-900 italic">
                                        {order.customer_email.split('@')[0]}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">
                                        {order.customer_email}
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="text-base font-display font-bold text-slate-900">${Number(order.total_price).toFixed(2)}</div>
                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Verified Gateway</div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="relative group/select">
                                        <select 
                                            value={order.status}
                                            disabled={updatingId === order.id}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className={`appearance-none w-full px-4 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer focus:outline-none focus:ring-4 ${
                                                order.status === 'Delivered' ? 'bg-green-50 border-green-100 text-green-700 focus:ring-green-500/10' :
                                                order.status === 'Paid' ? 'bg-primary-50 border-primary-100 text-primary-700 focus:ring-primary-500/10' :
                                                order.status === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-700 focus:ring-red-500/10' :
                                                'bg-amber-50 border-amber-100 text-amber-700 focus:ring-amber-500/10'
                                            }`}
                                        >
                                            {statuses.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            {updatingId === order.id ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
