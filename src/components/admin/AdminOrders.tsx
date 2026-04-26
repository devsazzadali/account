import React, { useEffect, useState } from "react";
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
  Package
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const MAIN_TABS = [
  { id: "All", label: "All", count: 6008 },
  { id: "Pending delivery", label: "Pending delivery", count: 2 },
  { id: "Delivered", label: "Delivered", count: 3945 },
  { id: "Pending feedback", label: "Pending feedback", count: 16 },
  { id: "Canceled", label: "Canceled", count: 2027 }
];

const SUB_TABS = ["New Order", "Delivering", "PREPARING", "ISSUE"];

export function AdminOrders() {
  const [activeMainTab, setActiveMainTab] = useState("Pending delivery");
  const [activeSubTab, setActiveSubTab] = useState("PREPARING");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('orders_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(title, image, category)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function calculateExceededTime(createdAt: string) {
    const created = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - created.getTime();
    const hours = (diff / (1000 * 60 * 60)).toFixed(2);
    return hours;
  }

  return (
    <div className="min-h-full bg-[#F6F6F7]">
      {/* ── Main Navigation Tabs ── */}
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
              {tab.label} ({tab.count})
              {activeMainTab === tab.id && (
                <motion.div layoutId="mainOrderTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E62E04]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        
        {/* ── Filter Matrix (Screenshot 3/4 Style) ── */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Game:</label>
                    <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all">
                        <option>All</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">category:</label>
                    <select className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all">
                        <option>All</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Order number:</label>
                    <input placeholder="Order number" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Product Title:</label>
                    <input placeholder="Product Title" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Internal remarks:</label>
                    <input placeholder="Internal remarks" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                </div>
                <div className="lg:col-span-2 flex items-center gap-2">
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500">From</label>
                        <input type="date" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                    </div>
                    <span className="mt-6 text-slate-400">to</span>
                    <div className="flex-1 space-y-1.5">
                        <label className="text-[12px] font-bold text-slate-500">to</label>
                        <input type="date" className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:border-red-400 outline-none transition-all" />
                    </div>
                </div>
                <button className="w-full bg-[#E62E04] text-white py-2.5 rounded-lg font-bold text-[14px] hover:bg-[#c52804] transition-all flex items-center justify-center gap-2">
                    Search
                </button>
            </div>
        </div>

        {/* ── Sub-Tabs (Buttons Style) ── */}
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
                    {tab}({tab === "Delivering" ? 1 : tab === "PREPARING" ? 1 : 0})
                </button>
            ))}
        </div>

        {/* ── Orders Table ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
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
                            <tr><td colSpan={6} className="py-20 text-center text-slate-400 text-sm font-medium">No orders found.</td></tr>
                        ) : orders.map(order => (
                            <React.Fragment key={order.id}>
                                {/* Order Header Row */}
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
                                {/* Order Content Row */}
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
                                        <span className="text-[12px] text-slate-400 italic font-medium">—</span>
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

      {/* Detail Modal (Sold Details) */}
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

    const currentStep = 2; // Default for 'Preparing'

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <History size={16} /> Home / Sold Details
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-8">
                        {/* Title */}
                        <h2 className="text-2xl font-bold text-slate-900">Sold Details</h2>

                        {/* Progress Tracker */}
                        <div className="bg-[#F8F9FA] rounded-xl p-8 border border-slate-100">
                            <div className="relative flex justify-between items-start max-w-4xl mx-auto">
                                {/* Line */}
                                <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200" />
                                <div className="absolute top-5 left-0 h-1 bg-[#4CAF50] transition-all duration-1000" style={{ width: `${((currentStep - 1) / (STATUS_STEPS.length - 1)) * 100}%` }} />
                                
                                {STATUS_STEPS.map((step, idx) => (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all ${
                                            idx + 1 <= currentStep ? "bg-[#4CAF50] border-[#E8F5E9] text-white" : "bg-white border-slate-100 text-slate-400"
                                        }`}>
                                            {step.id}
                                        </div>
                                        <span className={`mt-3 text-[12px] font-bold uppercase tracking-tight ${idx + 1 <= currentStep ? "text-slate-900" : "text-slate-400"}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Header Card */}
                        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
                                        <Package size={18} /> Order number {order.id.split('-')[0].toUpperCase()}
                                    </div>
                                    <div className="bg-[#FFEBEE] text-[#D32F2F] px-3 py-1 rounded text-[12px] font-bold flex items-center gap-2">
                                        <AlertCircle size={14} /> Exceeded the promised delivery time for {calculateExceededTime(order.created_at)} hourss
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                                    <span>Order Date: {new Date(order.created_at).toLocaleString('sv-SE').replace('T', ' ')}</span>
                                    <span className="bg-[#FFF3E0] text-[#EF6C00] px-3 py-1 rounded-full text-[12px] font-bold">Preparing</span>
                                </div>
                            </div>

                            {/* Buyer Info Row */}
                            <div className="bg-[#F8F9FA] rounded-lg p-5 flex flex-wrap items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full border border-white shadow-sm overflow-hidden bg-white flex items-center justify-center">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${order.username}`} alt="buyer" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-900">{order.username}</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase">buyer</p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button className="bg-[#26D374] text-white px-5 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-[#1faa5b] transition-all">
                                            <MessageCircle size={16} /> Chat Now
                                        </button>
                                        <button className="bg-white border border-slate-300 text-slate-600 px-5 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-slate-50 transition-all">
                                            <ShoppingBag size={16} /> Contact buyers by mail
                                        </button>
                                        <button className="bg-white border border-slate-300 text-slate-600 px-5 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 hover:bg-slate-50 transition-all">
                                            <XCircle size={16} /> Cancel Order
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Product Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-6">
                                <div className="space-y-6">
                                    <DetailItem label="Game" value="Facebook" />
                                    <DetailItem label="Product Title" value={order.products?.title} isLarge />
                                    <div className="pt-4">
                                        <button className="bg-[#E62E04] text-white px-10 py-3 rounded-lg font-black text-[16px] uppercase tracking-wider shadow-lg shadow-red-500/20 hover:bg-[#c52804] transition-all active:scale-95">
                                            START TRADING
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 h-fit">
                                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Credentials Ledger</h4>
                                    <div className="text-[14px] font-bold text-slate-900 bg-white p-4 rounded-lg border border-slate-200 min-h-[100px]">
                                        {order.credentials || "Awaiting authorization..."}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Information Section */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900">Order Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                <InfoBlock label="Order number" value={order.id.split('-')[0].toUpperCase()} />
                                <InfoBlock label="Total amount" value={`USD ${Number(order.total_price || order.amount).toFixed(2)}`} isBold />
                                <InfoBlock label="Order Date" value={new Date(order.created_at).toLocaleString()} />
                                <InfoBlock label="Payment Method" value="Digital Assets" />
                                <InfoBlock label="Promised Time" value="24 Hours" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Modal Actions */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white transition-all">Close</button>
                    <button className="px-8 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg">Authorize Protocol</button>
                </div>
            </motion.div>
        </div>
    );
}

function DetailItem({ label, value, isLarge }: any) {
    return (
        <div className="grid grid-cols-1 gap-1">
            <span className="text-[13px] font-bold text-slate-500">{label} :</span>
            <span className={`${isLarge ? 'text-[15px]' : 'text-[13px]'} font-bold text-slate-900 leading-relaxed`}>{value || "—"}</span>
        </div>
    );
}

function InfoBlock({ label, value, isBold }: any) {
    return (
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-[14px] ${isBold ? 'font-black text-[#E62E04]' : 'font-bold text-slate-900'}`}>{value}</p>
        </div>
    );
}
