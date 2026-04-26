import React, { useEffect, useState, useCallback } from "react";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  X, 
  MessageSquare, 
  AlertCircle, 
  ChevronRight,
  MoreVertical,
  Clock,
  ExternalLink,
  Filter,
  MessageCircle,
  User,
  ShoppingBag,
  History,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  ArrowRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const MAIN_TABS = [
  { id: "All", label: "All" },
  { id: "Preparing", label: "Pending delivery" },
  { id: "Delivered", label: "Delivered" },
  { id: "Pending feedback", label: "Pending feedback" },
  { id: "Canceled", label: "Canceled" }
];

const SUB_TABS = ["New Order", "Delivering", "PREPARING", "ISSUE"];

export function AdminOrders() {
  const [activeMainTab, setActiveMainTab] = useState("Preparing");
  const [activeSubTab, setActiveSubTab] = useState("PREPARING");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [counts, setCounts] = useState<any>({ All: 0, Preparing: 0, Delivered: 0, "Pending feedback": 0, Canceled: 0 });

  // Filter Form States
  const [filterGame, setFilterGame] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterOrderId, setFilterOrderId] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterRemarks, setFilterRemarks] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [games, setGames] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*, products!inner(title, image, category, game)")
        .order("created_at", { ascending: false });

      if (activeMainTab !== "All") {
        if (activeMainTab === "Preparing") {
            query = query.or('status.eq.Preparing,status.eq.PREPARING,status.eq.New Order,status.eq.Delivering');
        } else {
            query = query.eq("status", activeMainTab);
        }
      }

      if (activeMainTab === "Preparing" && activeSubTab !== "ISSUE") {
          query = query.eq("status", activeSubTab === "PREPARING" ? "Preparing" : activeSubTab);
      }

      if (filterGame !== "All") query = query.eq("products.game", filterGame);
      if (filterCategory !== "All") query = query.eq("products.category", filterCategory);
      if (filterOrderId) query = query.ilike("id", `%${filterOrderId}%`);
      if (filterTitle) query = query.ilike("products.title", `%${filterTitle}%`);
      if (filterFrom) query = query.gte("created_at", filterFrom);
      if (filterTo) query = query.lte("created_at", filterTo);

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
      fetchCounts();
    } catch (e: any) {
      console.error("Filter Error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [activeMainTab, activeSubTab, filterGame, filterCategory, filterOrderId, filterTitle, filterFrom, filterTo]);

  async function fetchCounts() {
      const { data } = await supabase.from('orders').select('status');
      if (data) {
          const c = { All: data.length, Preparing: 0, Delivered: 0, "Pending feedback": 0, Canceled: 0 };
          data.forEach((o: any) => {
              if (['Preparing', 'PREPARING', 'New Order', 'Delivering'].includes(o.status)) c.Preparing++;
              else if (o.status === 'Delivered') c.Delivered++;
              else if (o.status === 'Canceled') c.Canceled++;
          });
          setCounts(c);
      }
  }

  useEffect(() => {
    fetchOrders();
    supabase.from('products').select('game, category').then(({ data }) => {
        if (data) {
            setGames(Array.from(new Set(data.map(p => p.game).filter(Boolean))));
            setCategories(Array.from(new Set(data.map(p => p.category).filter(Boolean))));
        }
    });
    const channel = supabase.channel('orders_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  function calculateExceededTime(createdAt: string) {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    const hours = (diff / (1000 * 60 * 60)).toFixed(2);
    return hours;
  }

  return (
    <div className="min-h-full bg-[#F6F6F7]">
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="flex items-center gap-10 overflow-x-auto scrollbar-hide">
          {MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`pb-4 pt-6 text-[14px] font-bold whitespace-nowrap transition-all relative ${
                activeMainTab === tab.id ? "text-[#E62E04]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label} ({counts[tab.id] || 0})
              {activeMainTab === tab.id && (
                <motion.div layoutId="mainOrderTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E62E04]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        <form onSubmit={e => { e.preventDefault(); fetchOrders(); }} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">Game:</label>
                    <select value={filterGame} onChange={e => setFilterGame(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all">
                        <option value="All">All</option>
                        {games.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">category:</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all">
                        <option value="All">All</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">Order number:</label>
                    <input value={filterOrderId} onChange={e => setFilterOrderId(e.target.value)} placeholder="Order number" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">Product Title:</label>
                    <input value={filterTitle} onChange={e => setFilterTitle(e.target.value)} placeholder="Product Title" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">Internal remarks:</label>
                    <input value={filterRemarks} onChange={e => setFilterRemarks(e.target.value)} placeholder="Internal remarks" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
                <div className="lg:col-span-2 flex items-center gap-2">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">From</label>
                        <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                    </div>
                    <span className="mt-6 text-slate-400">to</span>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tighter">to</label>
                        <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                    </div>
                </div>
                <button type="submit" className="w-full bg-[#E62E04] text-white py-2.5 rounded-lg font-bold text-[14px] hover:bg-[#c52804] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 uppercase tracking-widest">
                    Search
                </button>
            </div>
        </form>

        <div className="flex gap-2">
            {SUB_TABS.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-4 py-1.5 rounded border text-[12px] font-bold transition-all ${
                        activeSubTab === tab 
                        ? "bg-white border-slate-400 text-slate-900" 
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#F8F9FA] border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600">Product</th>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600">Unit Price</th>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600">Type</th>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600">Status</th>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600 flex items-center gap-1">
                                Internal remarks <MoreVertical size={14} className="text-slate-400 cursor-help" />
                            </th>
                            <th className="px-6 py-3 text-[13px] font-bold text-slate-600 text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#E62E04]" /></td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-400 text-sm font-medium italic">No matching orders found in current protocol.</td></tr>
                        ) : orders.map(order => (
                            <React.Fragment key={order.id}>
                                <tr className="bg-[#FDFDFD] border-t-4 border-[#F6F6F7]">
                                    <td colSpan={6} className="px-6 py-2.5">
                                        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px]">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 font-medium text-slate-600">
                                                    <Package size={14} />
                                                    Order number : <span className="font-bold text-slate-900">{order.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-medium text-slate-600">
                                                    <User size={14} />
                                                    buyer : <span className="font-bold text-slate-900 flex items-center gap-1 cursor-pointer hover:text-blue-500">{order.username} <MessageSquare size={12} /></span>
                                                </div>
                                                <div className="flex items-center gap-2 font-medium text-slate-600">
                                                    <Clock size={14} />
                                                    Date: <span className="font-bold text-slate-900">{new Date(order.created_at).toLocaleString('sv-SE').replace('T', ' ')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                                <AlertCircle size={14} />
                                                Exceeded the promised delivery time for {calculateExceededTime(order.created_at)} hours
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <td className="px-6 py-5 max-w-md">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded border border-slate-200 shrink-0 overflow-hidden bg-slate-50">
                                                <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-2">{order.products?.title}</p>
                                                <p className="text-[11px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{order.products?.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[14px] font-bold text-slate-600">USD {order.total_price || order.amount}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shadow-sm">
                                            <img src="https://api.dicebear.com/7.x/identicon/svg?seed=facebook" className="w-full h-full object-cover" alt="type" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <StatusBadge status={order.status} />
                                            <button className="text-[12px] font-bold text-slate-900 hover:underline">Order Detail</button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-[12px] text-slate-400 italic font-medium">{order.internal_remarks || "—"}</span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-[15px] font-black text-slate-900 tracking-tight">USD {(order.total_price || order.amount).toFixed(2)}</span>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <SoldDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        "Preparing": "bg-[#FFF8E6] text-[#F9A825] border-[#FDE6A6]",
        "PREPARING": "bg-[#FFF8E6] text-[#F9A825] border-[#FDE6A6]",
        "Delivering": "bg-[#E3F2FD] text-[#1976D2] border-[#BBDEFB]",
        "Completed": "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
        "Canceled": "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
        "New Order": "bg-[#F3E5F5] text-[#7B1FA2] border-[#E1BEE7]",
    };
    const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`px-4 py-1 rounded-full border text-[11px] font-bold ${cls}`}>
            {status}
        </span>
    );
}

function SoldDetailsModal({ order, onClose }: any) {
    const STATUS_STEPS = [
        { id: 1, label: "New Order" },
        { id: 2, label: "PREPARING" },
        { id: 3, label: "Delivering" },
        { id: 4, label: "Waiting for confirmation" },
        { id: 5, label: "Completed" },
        { id: 6, label: "Evaluate" }
    ];

    const currentStep = order.status === 'Completed' ? 5 : order.status === 'Delivering' ? 3 : 2;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <History size={16} /> Home / Sold Details
                </div>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-8">
                        <h2 className="text-2xl font-black text-slate-900 italic tracking-tight">Sold Details</h2>
                        <div className="bg-[#F8F9FA] rounded-xl p-10 border border-slate-100 relative">
                            <div className="relative flex justify-between items-start max-w-4xl mx-auto">
                                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200" />
                                <div className="absolute top-5 left-0 h-1 bg-[#1dbf73] transition-all duration-1000 border-t-2 border-dashed border-white/30" style={{ width: `${((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                                {STATUS_STEPS.map((step, idx) => (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-4 transition-all ${idx + 1 <= currentStep ? "bg-[#1dbf73] border-[#E8F5E9] text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-100 text-slate-400"}`}>{step.id}</div>
                                        <span className={`mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-center max-w-[80px] ${idx + 1 <= currentStep ? "text-slate-900" : "text-slate-400"}`}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[15px] font-black text-slate-900 uppercase tracking-tighter italic">
                                        <Package size={20} className="text-[#E62E04]" /> Order number {order.id.split('-')[0].toUpperCase()}
                                    </div>
                                    <div className="bg-[#FFEBEE] text-[#D32F2F] px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-2 border border-red-100">
                                        <AlertCircle size={14} /> Exceeded time for {((new Date().getTime() - new Date(order.created_at).getTime())/(1000*60*60)).toFixed(2)} hours
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                    <span className="text-[12px] font-bold">Order Date: {new Date(order.created_at).toLocaleString()}</span>
                                    <span className="bg-[#FFF3E0] text-[#EF6C00] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#FFE0B2]">{order.status}</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6 border border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.username}`} alt="buyer" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight italic">{order.username}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Authorized Buyer</p>
                                    </div>
                                    <div className="flex gap-3 ml-6">
                                        <button className="bg-[#26D374] text-white px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#1faa5b] transition-all shadow-lg shadow-emerald-500/10"><MessageCircle size={16} /> Chat Now</button>
                                        <button className="bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"><ShoppingBag size={16} /> Contact by mail</button>
                                        <button className="bg-white border border-slate-200 text-red-500 px-6 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 transition-all shadow-sm border-dashed"><XCircle size={16} /> Cancel Order</button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-4">
                                <div className="md:col-span-8 space-y-6">
                                    <div className="flex items-center gap-6">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest w-24">Game</span>
                                        <span className="text-sm font-bold text-slate-900">: {order.products?.game || "Facebook"}</span>
                                    </div>
                                    <div className="flex items-start gap-6">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest w-24 pt-1">Product Title</span>
                                        <div className="flex-1">
                                            <p className="text-[15px] font-black text-slate-900 leading-relaxed">: {order.products?.title}</p>
                                            <div className="mt-8">
                                                <button className="bg-[#E62E04] text-white px-12 py-4 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 hover:bg-[#c52804] transition-all active:scale-95 flex items-center gap-3">
                                                    START TRADING <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:col-span-4">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 h-full">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Internal Ledger</h4>
                                        <p className="text-[13px] font-bold text-slate-700 leading-relaxed">{order.internal_remarks || "No encrypted remarks found."}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
                    <button onClick={onClose} className="px-10 py-3 rounded-2xl border border-slate-200 text-slate-400 font-black text-[12px] uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all">Close Console</button>
                </div>
            </motion.div>
        </div>
    );
}
