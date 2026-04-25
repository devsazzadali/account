import React, { useEffect, useState, useRef } from "react";
import { Loader2, Search, RefreshCw, X, Send, CheckCircle2, Upload, Mail, MessageSquare, XCircle, AlertCircle, Info, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const MAIN_TABS = ["All", "Pending delivery", "Delivered", "Pending feedback", "Canceled"];
const SUB_TABS = ["New Order", "Delivering", "PREPARING", "ISSUEBE"];

export function AdminOrders({ setActiveTab: parentSetActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [activeMainTab, setActiveMainTab] = useState("All");
  const [activeSubTab, setActiveSubTab] = useState("New Order");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter state
  const [filterSeller, setFilterSeller] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterOrderNum, setFilterOrderNum] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterRemarks, setFilterRemarks] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => { 
    fetchOrders(); 
    const channel = supabase.channel('orders_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").select("*, products(title, image, category)").order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) { console.error(e.message); } finally { setLoading(false); }
  }

  async function updateOrderStatus(orderId: string, newStatus: string, credentials?: string) {
    if (!orderId) return;
    setUpdatingId(orderId);
    try {
      const payload: any = { status: newStatus };
      if (credentials !== undefined) payload.credentials = credentials;
      const { error } = await supabase.from("orders").update(payload).eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...payload } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev: any) => ({ ...prev, ...payload }));
    } catch (e: any) { alert("Error: " + e.message); } finally { setUpdatingId(null); }
  }

  const categories = ["All", ...new Set(orders.map(o => o.products?.category).filter(Boolean))];
  const sellers = ["All", ...new Set(orders.map(o => o.username).filter(Boolean))];

  const getCount = (tab: string) => {
    if (tab === "All") return orders.length;
    if (tab === "Pending delivery") return orders.filter(o => o.status === "Paid" || o.status === "Preparing" || o.status === "Delivering").length;
    if (tab === "Delivered") return orders.filter(o => o.status === "Delivered" || o.status === "Completed").length;
    if (tab === "Canceled") return orders.filter(o => o.status === "Cancelled").length;
    return 0;
  };

  const getSubCount = (sub: string) => {
    if (sub === "New Order") return orders.filter(o => o.status === "Paid" || o.status === "New Order").length;
    if (sub === "Delivering") return orders.filter(o => o.status === "Delivering").length;
    if (sub === "PREPARING") return orders.filter(o => o.status === "Preparing").length;
    return 0;
  };

  const filteredOrders = orders.filter(o => {
    // Main Tab Logic
    let matchMain = true;
    if (activeMainTab === "Pending delivery") matchMain = ["Paid", "Preparing", "Delivering"].includes(o.status);
    else if (activeMainTab === "Delivered") matchMain = ["Delivered", "Completed"].includes(o.status);
    else if (activeMainTab === "Canceled") matchMain = o.status === "Cancelled";
    
    // Sub Tab Logic (Only if Pending delivery is selected)
    let matchSub = true;
    if (activeMainTab === "Pending delivery") {
        if (activeSubTab === "New Order") matchSub = o.status === "Paid" || o.status === "New Order";
        else if (activeSubTab === "Delivering") matchSub = o.status === "Delivering";
        else if (activeSubTab === "PREPARING") matchSub = o.status === "Preparing";
    }

    const matchOrderNum = filterOrderNum === "" || (o.id || "").toLowerCase().includes(filterOrderNum.toLowerCase());
    const matchProduct = filterProduct === "" || (o.products?.title || "").toLowerCase().includes(filterProduct.toLowerCase());
    const matchSeller = filterSeller === "All" || o.username === filterSeller;
    const matchCategory = filterCategory === "All" || o.products?.category === filterCategory;
    const matchFrom = filterFrom === "" || new Date(o.created_at) >= new Date(filterFrom);
    const matchTo = filterTo === "" || new Date(o.created_at) <= new Date(filterTo + "T23:59:59");

    return matchMain && matchSub && matchOrderNum && matchProduct && matchSeller && matchCategory && matchFrom && matchTo;
  });

  return (
    <div className="bg-slate-50 min-h-screen text-slate-700 font-sans p-4">
      
      {/* ── Main Navigation Tabs ── */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6 pb-1 overflow-x-auto scrollbar-hide">
        {MAIN_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveMainTab(tab)}
            className={`pb-3 text-[13px] font-medium whitespace-nowrap transition-all relative ${
              activeMainTab === tab ? "text-red-500 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab} <span className="text-[11px] opacity-70">({getCount(tab)})</span>
            {activeMainTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />}
          </button>
        ))}
      </div>

      {/* ── Filter Matrix (As per screenshot) ── */}
      <div className="bg-white p-6 border border-slate-200 rounded-lg mb-6 shadow-sm">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black w-20 text-slate-900">game:</label>
            <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-[12px] focus:outline-none">
                {sellers.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black w-20 text-slate-900">category:</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-[12px] focus:outline-none">
                {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black w-20 text-slate-900">Order number:</label>
            <input value={filterOrderNum} onChange={e => setFilterOrderNum(e.target.value)} placeholder="Order number" className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-[12px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black w-20 text-slate-900">PRODUCT TITLE:</label>
            <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder="Product Title" className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-[12px] focus:outline-none" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black w-20 text-slate-900 whitespace-nowrap">Internal remarks:</label>
            <input value={filterRemarks} onChange={e => setFilterRemarks(e.target.value)} placeholder="Internal remarks" className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-[12px] focus:outline-none" />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <label className="text-[11px] font-black w-12 text-slate-900">From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-[12px]" />
            <label className="text-[11px] font-black px-2 text-slate-900">to</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-[12px]" />
          </div>
          <button onClick={fetchOrders} className="w-full bg-[#f85032] text-white py-1.5 rounded font-bold text-[12px] hover:opacity-90 transition-all uppercase tracking-widest">
            Search
          </button>
        </div>
      </div>

      {/* ── Sub-Tabs (Pills) ── */}
      <div className="flex gap-2 mb-6">
        {SUB_TABS.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubTab(sub)}
            className={`px-4 py-1.5 rounded text-[11px] font-bold border transition-all ${
              activeSubTab === sub 
              ? "bg-[#1890ff] text-white border-[#1890ff]" 
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            }`}
          >
            {sub}({getSubCount(sub)})
          </button>
        ))}
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-[#f2f4f8] border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-bold text-slate-600">Product</th>
              <th className="px-6 py-3 font-bold text-slate-600">Unit Price</th>
              <th className="px-6 py-3 font-bold text-slate-600">Type</th>
              <th className="px-6 py-3 font-bold text-slate-600">Status</th>
              <th className="px-6 py-3 font-bold text-slate-600">Internal remarks@</th>
              <th className="px-6 py-3 font-bold text-slate-600 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
                <tr><td colSpan={6} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" /></td></tr>
            ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-400">No matching orders found.</td></tr>
            ) : filteredOrders.map(order => (
              <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50 cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 leading-tight">{order.products?.title || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase">#{order.id.split('-')[0]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">${Number(order.total_price || 0).toFixed(2)}</td>
                <td className="px-6 py-4 text-slate-500">{order.products?.category || "Digital"}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 text-slate-400">—</td>
                <td className="px-6 py-4 font-black text-slate-900 text-right">${Number(order.total_price || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal (Keep current functionality but style as simple) */}
      <AnimatePresence>
        {selectedOrder && (
          <SoldDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={updateOrderStatus}
            isUpdating={updatingId === selectedOrder.id}
            setActiveTab={parentSetActiveTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Delivered": "text-emerald-600 bg-emerald-50 border-emerald-100",
    "Completed": "text-emerald-600 bg-emerald-50 border-emerald-100",
    "Paid": "text-blue-600 bg-blue-50 border-blue-100",
    "Preparing": "text-amber-600 bg-amber-50 border-amber-100",
    "Delivering": "text-purple-600 bg-purple-50 border-purple-100",
    "Cancelled": "text-red-600 bg-red-50 border-red-100",
  };
  const cls = map[status] || "text-slate-500 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold ${cls}`}>
      {status}
    </span>
  );
}

// Keeping the SoldDetailModal logic mostly the same but simplifying UI to match the legacy vibe
function SoldDetailModal({ order, onClose, onUpdate, isUpdating, setActiveTab }: any) {
    const [credentialFields, setCredentialFields] = useState<Record<string, string>>(() => {
      try { return typeof order.credentials === 'string' ? JSON.parse(order.credentials) : (order.credentials || {}); } catch (e) { return { "Login Account": order.credentials || "" }; }
    });
    const [dmText, setDmText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [dmSent, setDmSent] = useState(false);
    const STATUS_STEPS_FLOW = ["New Order", "Preparing", "Delivering", "Waiting for confirmation", "Completed"];
  
    const currentStepIndex = (() => {
      const s = order.status;
      if (s === "New Order" || s === "Paid" || s === "Awaiting Verification") return 0;
      if (s === "Preparing") return 1;
      if (s === "Delivering") return 2;
      if (s === "Waiting for confirmation" || s === "Delivered") return 3;
      return 4;
    })();
  
    const fields = ["* Login Account", "* Login Password", "* 2FA Code", "* cookies", "Secondary Password", "Bind Email", "Bind Mailbox Pass", "Extra Info"];
  
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div onClick={onClose} className="fixed inset-0 bg-black/60" />
        <div className="relative bg-white w-full max-w-4xl h-[90vh] rounded overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h2 className="text-lg font-bold text-slate-900">Sold Details - Order #{order.id.split('-')[0]}</h2>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded transition-colors"><X size={20} /></button>
          </div>
  
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
             {/* Simple Steps */}
             <div className="flex items-center justify-between px-10">
                {STATUS_STEPS_FLOW.map((step, i) => (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold ${i <= currentStepIndex ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                       {i+1}
                    </div>
                    <span className={`text-[10px] mt-2 font-bold ${i <= currentStepIndex ? "text-blue-600" : "text-slate-400"}`}>{step}</span>
                  </div>
                ))}
             </div>
  
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="p-4 bg-slate-50 rounded border border-slate-200">
                      <h4 className="text-sm font-bold mb-4">Credentials Protocol</h4>
                      <div className="grid grid-cols-1 gap-4">
                         {fields.map(f => (
                            <div key={f} className="flex items-center gap-2">
                               <label className="text-[11px] font-bold w-24 text-slate-500">{f}:</label>
                               <input value={credentialFields[f]||""} onChange={e=>setCredentialFields({...credentialFields, [f]:e.target.value})} className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-[12px]" />
                            </div>
                         ))}
                      </div>
                      <button onClick={()=>onUpdate(order.id, order.status, JSON.stringify(credentialFields))} disabled={isUpdating} className="w-full mt-6 bg-slate-900 text-white py-2 rounded font-bold text-[12px] hover:opacity-90">Save Changes</button>
                   </div>
                </div>
  
                <div className="space-y-6">
                   <div className="p-4 bg-slate-50 rounded border border-slate-200">
                      <h4 className="text-sm font-bold mb-4">Customer Details</h4>
                      <div className="space-y-2 text-[12px]">
                         <div className="flex justify-between"><span className="text-slate-400">Username:</span><span className="font-bold">{order.username}</span></div>
                         <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="font-bold">{order.customer_email}</span></div>
                      </div>
                      <div className="mt-6 flex gap-2">
                         <button onClick={()=>{localStorage.setItem("selectedUserChat", order.username); setActiveTab?.("messages"); onClose();}} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold text-[11px]">Chat Now</button>
                         <button onClick={()=>onUpdate(order.id, "Delivered")} className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-[11px]">Mark Delivered</button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
}
