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
import { AdminOrderDetails } from "./AdminOrderDetails";

const MAIN_TABS = [
  { id: "All", label: "All" },
  { id: "Pending Delivery", label: "Pending Delivery" },
  { id: "Waiting Confirmation", label: "Waiting Confirmation" },
  { id: "Completed", label: "Completed" },
  { id: "Canceled", label: "Canceled" }
];

const SUB_TABS = ["New Order", "PREPARING", "Delivering"];

export function AdminOrders() {
  const [activeMainTab, setActiveMainTab] = useState("Pending Delivery");
  const [activeSubTab, setActiveSubTab] = useState("New Order");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [counts, setCounts] = useState<any>({ All: 0, "Pending Delivery": 0, "Waiting Confirmation": 0, Completed: 0, Canceled: 0 });
  const [error, setError] = useState<string | null>(null);

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
      console.log("Fetching orders for tab:", activeMainTab, "subTab:", activeSubTab);
      let query = supabase
        .from("orders")
        .select(`
            *,
            products(title, image, category, game)
        `)
        .order("created_at", { ascending: false });

      if (activeMainTab !== "All") {
        if (activeMainTab === "Pending Delivery") {
            query = query.or('status.eq.New Order,status.eq.PREPARING,status.eq.Delivering');
            if (activeSubTab) {
                query = query.eq("status", activeSubTab);
            }
        } else if (activeMainTab === "Waiting Confirmation") {
            query = query.eq("status", "Waiting Confirmation");
        } else {
            query = query.eq("status", activeMainTab);
        }
      }

      if (filterGame !== "All") query = query.eq("products.game", filterGame);
      if (filterCategory !== "All") query = query.eq("products.category", filterCategory);
      if (filterOrderId) query = query.ilike("id", `%${filterOrderId}%`);
      if (filterTitle) query = query.ilike("products.title", `%${filterTitle}%`);
      if (filterFrom) query = query.gte("created_at", filterFrom);
      if (filterTo) query = query.lte("created_at", filterTo);

      const { data, error } = await query;
      if (error) {
          console.error("Supabase Query Error:", error);
          throw error;
      }
      console.log("Orders received:", data?.length);
      setOrders(data || []);
      fetchCounts();
    } catch (e: any) {
      console.error("Filter Error:", e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeMainTab, activeSubTab, filterGame, filterCategory, filterOrderId, filterTitle, filterFrom, filterTo]);

  async function fetchCounts() {
      const { data, error } = await supabase.from('orders').select('status');
      if (error) console.error("Counts Fetch Error:", error);
      if (data) {
          console.log("Raw count data:", data);
          const c = { All: data.length, "Pending Delivery": 0, "Waiting Confirmation": 0, Completed: 0, Canceled: 0 };
          data.forEach((o: any) => {
              if (['New Order', 'PREPARING', 'Delivering'].includes(o.status)) c["Pending Delivery"]++;
              else if (o.status === 'Waiting Confirmation') c["Waiting Confirmation"]++;
              else if (o.status === 'Completed') c.Completed++;
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

  if (selectedOrder) {
      return <AdminOrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
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

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-6">
                <AlertCircle size={20} />
                <div className="flex-1">
                    <p className="text-xs font-black uppercase">System Linkage Error</p>
                    <p className="text-[13px] font-bold">{error}</p>
                </div>
                <button onClick={() => { setError(null); fetchOrders(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[11px] font-black uppercase">Retry Connection</button>
            </div>
        )}

        <div className="flex gap-2">
            {activeMainTab === "Pending Delivery" && SUB_TABS.map(tab => (
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
                            <tr>
                                <td colSpan={6} className="py-32 text-center bg-white">
                                    <ShoppingBag className="mx-auto text-slate-200 mb-4" size={64} />
                                    <h4 className="text-xl font-black text-slate-900 uppercase italic">No Active Orders</h4>
                                    <p className="text-slate-400 mt-2 font-medium">No results found matching your current protocol filters.</p>
                                </td>
                            </tr>
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
        "Waiting Confirmation": "bg-blue-50 text-blue-600 border-blue-100",
    };
    const cls = map[status] || "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`px-4 py-1 rounded-full border text-[11px] font-bold ${cls}`}>
            {status}
        </span>
    );
}
