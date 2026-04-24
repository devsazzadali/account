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
  ShoppingBag,
  User,
  Mail,
  ShieldCheck,
  Package,
  Send,
  X,
  Eye
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function AdminOrders() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

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

  async function updateOrderStatus(orderId: string, newStatus: string, credentials?: string) {
    setUpdatingId(orderId);
    try {
        const updateData: any = { status: newStatus };
        if (credentials) updateData.credentials = credentials;

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);
        
        if (error) throw error;
        
        setOrders(orders.map(o => o.id === orderId ? { ...o, ...updateData } : o));
        if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, ...updateData });
        }
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
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading && orders.length === 0 ? (
                            <tr><td colSpan={6} className="p-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Ledger...</span>
                                </div>
                            </td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={6} className="p-24 text-center text-slate-400 text-sm font-medium italic">No transmissions found in this frequency.</td></tr>
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
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group/btn"
                                    >
                                        <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Detail</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Order Detail Modal */}
        <AnimatePresence>
            {selectedOrder && (
                <OrderDetailModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    onUpdate={updateOrderStatus}
                    isUpdating={updatingId === selectedOrder.id}
                />
            )}
        </AnimatePresence>
    </div>
  );
}

function OrderDetailModal({ order, onClose, onUpdate, isUpdating }: any) {
    const [creds, setCreds] = useState(order.credentials || "");

    const handleDeliver = () => {
        onUpdate(order.id, 'Delivered', creds);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[850px]"
            >
                {/* Left Side: Order Info */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar border-r border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <div className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.3em] mb-1">Transactional Detail</div>
                            <h3 className="text-3xl font-display font-bold text-slate-900 italic">LOG #{order.id.split('-')[0].toUpperCase()}</h3>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-10">
                        {/* Status Timeline */}
                        <div className="relative">
                            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100"></div>
                            <div className="space-y-8 relative">
                                <TimelineStep 
                                    active={true} 
                                    title="Order Initialized" 
                                    desc={`Transaction detected on ${new Date(order.created_at).toLocaleString()}`}
                                    icon={<CheckCircle2 size={14} className="text-white" />}
                                />
                                <TimelineStep 
                                    active={order.status !== 'Awaiting Verification'} 
                                    title="Payment Verification" 
                                    desc={order.status === 'Awaiting Verification' ? "Scanning payment gateways..." : "Settlement verified successfully."}
                                    icon={order.status === 'Awaiting Verification' ? <Clock size={14} className="text-white" /> : <ShieldCheck size={14} className="text-white" />}
                                />
                                <TimelineStep 
                                    active={order.status === 'Delivered'} 
                                    title="Asset Deployment" 
                                    desc={order.status === 'Delivered' ? "Assets transmitted to recipient." : "Awaiting deployment command."}
                                    icon={<Package size={14} className="text-white" />}
                                />
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Recipient Profile</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">{order.customer_email.split('@')[0]}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Buyer ID</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                                        <Mail size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 truncate">{order.customer_email}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Contact Vector</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Asset Summary */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                             <div className="absolute -right-8 -bottom-8 opacity-10">
                                 <ShoppingBag size={120} />
                             </div>
                             <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Contract Asset</h4>
                             <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 bg-white/10 rounded-2xl border border-white/10 p-1">
                                     <img src={order.products?.image} className="w-full h-full object-cover rounded-xl" alt="" />
                                 </div>
                                 <div className="flex-1">
                                     <div className="text-lg font-bold italic">{order.products?.title}</div>
                                     <div className="text-xs font-medium text-white/60">Valuation: ${order.total_price} • Quantity: {order.quantity}</div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Deployment Console */}
                <div className="w-full md:w-[350px] bg-slate-50 p-8 md:p-12 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-primary-600 uppercase tracking-[0.2em]">Deployment Console</span>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Master Status Override</label>
                                <div className="space-y-3">
                                    {["Awaiting Verification", "Paid", "Cancelled"].map((s) => (
                                        <button 
                                            key={s}
                                            disabled={isUpdating}
                                            onClick={() => onUpdate(order.id, s)}
                                            className={`w-full py-4 px-6 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-left transition-all border ${
                                                order.status === s 
                                                ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                                                : "bg-white text-slate-500 border-slate-200 hover:border-primary-500/50"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Asset Credentials / Keys</label>
                                <textarea 
                                    value={creds}
                                    onChange={(e) => setCreds(e.target.value)}
                                    placeholder="Enter secure account credentials or license keys here..."
                                    className="w-full h-40 bg-white border border-slate-200 rounded-2xl p-6 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none shadow-inner"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button 
                            disabled={isUpdating || !creds}
                            onClick={handleDeliver}
                            className="w-full py-5 bg-primary-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
                        >
                            {isUpdating ? <Loader2 size={18} className="animate-spin" /> : (
                                <>
                                    <Send size={18} />
                                    Execute Deployment
                                </>
                            )}
                        </button>
                        <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">Executing will notify the recipient via secure channel.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function TimelineStep({ active, title, desc, icon }: any) {
    return (
        <div className={`flex gap-6 ${active ? "opacity-100" : "opacity-30"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${active ? "bg-primary-600 shadow-lg shadow-primary-500/30 scale-110" : "bg-slate-200"}`}>
                {icon}
            </div>
            <div className="pt-0.5">
                <div className={`text-xs font-bold transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}>{title}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</div>
            </div>
        </div>
    );
}
