import React, { useEffect, useState, useRef } from "react";
import { Loader2, Search, RefreshCw, X, Send, CheckCircle2, Upload, Mail, MessageSquare, XCircle, AlertCircle, Info, ShieldCheck, Gamepad2, Layers, Hash, Calendar, MessageCircle, DollarSign, User } from "lucide-react";
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
    let matchMain = true;
    if (activeMainTab === "Pending delivery") matchMain = ["Paid", "Preparing", "Delivering"].includes(o.status);
    else if (activeMainTab === "Delivered") matchMain = ["Delivered", "Completed"].includes(o.status);
    else if (activeMainTab === "Canceled") matchMain = o.status === "Cancelled";
    
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
    <div className="bg-slate-50 min-h-screen text-slate-700 font-sans">
      
      {/* ── Main Navigation Tabs ── */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 mb-6">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {MAIN_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={`pb-4 pt-6 text-[13px] font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${
                activeMainTab === tab ? "text-[#1dbf73]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab} <span className={`ml-1 text-[10px] ${activeMainTab === tab ? "opacity-100" : "opacity-40"}`}>({getCount(tab)})</span>
              {activeMainTab === tab && (
                <motion.div layoutId="orderTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#1dbf73] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* ── Filter Matrix (Upgraded Design) ── */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <FilterItem label="Game Source" icon={<Gamepad2 size={14} />}>
              <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all appearance-none cursor-pointer">
                  {sellers.map(s => <option key={s}>{s}</option>)}
              </select>
            </FilterItem>
            <FilterItem label="Category Node" icon={<Layers size={14} />}>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all appearance-none cursor-pointer">
                  {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </FilterItem>
            <FilterItem label="Order Hash" icon={<Hash size={14} />}>
              <input value={filterOrderNum} onChange={e => setFilterOrderNum(e.target.value)} placeholder="Search order ID..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
            </FilterItem>
            <FilterItem label="Product Identity" icon={<Search size={14} />}>
              <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder="Search product title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
            </FilterItem>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <FilterItem label="Internal Protocol Remarks" icon={<MessageCircle size={14} />}>
              <input value={filterRemarks} onChange={e => setFilterRemarks(e.target.value)} placeholder="Search remarks..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
            </FilterItem>
            <FilterItem label="Temporal Window (From)" icon={<Calendar size={14} />}>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
            </FilterItem>
            <FilterItem label="Temporal Window (To)" icon={<Calendar size={14} />}>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
            </FilterItem>
            <button onClick={fetchOrders} className="w-full bg-[#1dbf73] text-white py-4 rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-[#19a463] transition-all shadow-xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-2">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Search Registry
            </button>
          </div>
        </div>

        {/* ── Sub-Tabs (Pills - Website Themed) ── */}
        <div className="flex flex-wrap gap-3">
          {SUB_TABS.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubTab(sub)}
              className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${
                activeSubTab === sub 
                ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20" 
                : "bg-white text-slate-400 border-white hover:border-slate-200"
              }`}
            >
              {sub} <span className="opacity-50 ml-1">({getSubCount(sub)})</span>
            </button>
          ))}
        </div>

        {/* ── Data Table (Premium Site Style) ── */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Product Asset</th>
                  <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Unit Value</th>
                  <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Classification</th>
                  <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Registry Status</th>
                  <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-widest text-[10px]">Notes</th>
                  <th className="px-8 py-5 font-black text-[#1dbf73] uppercase tracking-widest text-[10px] text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <Loader2 className="animate-spin mx-auto text-[#1dbf73] w-10 h-10 mb-4" />
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Decrypting Secure Ledger...</p>
                    </td></tr>
                ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan={6} className="py-32 text-center">
                        <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                            <Search size={32} />
                        </div>
                        <p className="text-[14px] font-black text-slate-900">No Transactions Detected</p>
                        <p className="text-[12px] text-slate-400 mt-1 font-medium">Try refining your temporal window or search hash.</p>
                    </td></tr>
                ) : filteredOrders.map(order => (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50/50 cursor-pointer group transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 leading-tight truncate group-hover:text-[#1dbf73] transition-colors">{order.products?.title || "Unknown Asset"}</div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">#{order.id.split('-')[0].toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-slate-700">${Number(order.total_price || 0).toFixed(2)}</td>
                    <td className="px-8 py-5 font-bold text-slate-500 uppercase tracking-tighter text-[12px]">{order.products?.category || "Digital"}</td>
                    <td className="px-8 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-8 py-5 text-slate-300 text-[12px] font-medium">—</td>
                    <td className="px-8 py-5 font-black text-[#1dbf73] text-[16px] text-right">${Number(order.total_price || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal (Premium Fiverr Style) */}
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

function FilterItem({ label, icon, children }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                {icon} {label}
            </label>
            {children}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Delivered": "text-emerald-600 bg-emerald-50 border-emerald-100",
    "Completed": "text-emerald-600 bg-emerald-50 border-emerald-100",
    "Paid": "text-[#1dbf73] bg-emerald-50 border-emerald-100",
    "Preparing": "text-amber-600 bg-amber-50 border-amber-100",
    "Delivering": "text-purple-600 bg-purple-50 border-purple-100",
    "Cancelled": "text-red-600 bg-red-50 border-red-100",
  };
  const cls = map[status] || "text-slate-500 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
}

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

    async function handleSendDm() {
        if (!dmText.trim()) return;
        setIsSending(true);
        try {
          await supabase.from("messages").insert({
            username: order.username,
            subject: `Order #${(order.id || "").split("-")[0].toUpperCase()}`,
            message: "[ADMIN_INITIATED]",
            reply: dmText,
            status: "unread",
            replied_at: new Date().toISOString(),
          });
          setDmText("");
          setDmSent(true);
          setTimeout(() => setDmSent(false), 3000);
        } catch (e: any) { alert(e.message); } finally { setIsSending(false); }
    }
  
    const fields = ["* Login Account", "* Login Password", "* 2FA Code", "* cookies", "Secondary Password", "Bind Email", "Bind Mailbox Pass", "Extra Info"];
  
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
          
          {/* Modal Header */}
          <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-900 text-white shrink-0">
             <div>
                <h2 className="text-2xl font-black tracking-tight">Order Intelligence Protocol</h2>
                <div className="flex items-center gap-3 mt-1 opacity-50">
                   <span className="text-[10px] font-bold uppercase tracking-widest">Instance Hash: {order.id.toUpperCase()}</span>
                   <span className="w-1 h-1 bg-white rounded-full" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleString()}</span>
                </div>
             </div>
             <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={24} /></button>
          </div>
  
          <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
             {/* Progress Matrix */}
             <div className="flex items-center justify-between px-10 max-w-4xl mx-auto">
                {STATUS_STEPS_FLOW.map((step, i) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center group relative cursor-pointer" onClick={() => onUpdate(order.id, step === "New Order" ? "Paid" : step === "Waiting for confirmation" ? "Delivered" : step)}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black transition-all border-2 ${
                        i <= currentStepIndex ? "bg-[#1dbf73] border-[#1dbf73] text-white shadow-lg shadow-emerald-500/20" : "bg-white border-slate-100 text-slate-300"
                        }`}>
                        {i < currentStepIndex ? <CheckCircle2 size={18} /> : i + 1}
                        </div>
                        <span className={`text-[10px] mt-3 font-black uppercase tracking-tighter whitespace-nowrap ${i <= currentStepIndex ? "text-[#1dbf73]" : "text-slate-400"}`}>{step}</span>
                    </div>
                    {i < STATUS_STEPS_FLOW.length - 1 && (
                        <div className={`h-1 flex-1 mx-2 -mt-7 min-w-[30px] rounded-full transition-all ${i < currentStepIndex ? "bg-[#1dbf73]" : "bg-slate-100"}`} />
                    )}
                  </React.Fragment>
                ))}
             </div>
  
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Protocol Section */}
                <div className="space-y-8">
                   <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#1dbf73]" /> Secure Credential Matrix
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                         {fields.map(f => (
                            <div key={f} className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{f}</label>
                               <input value={credentialFields[f]||""} onChange={e=>setCredentialFields({...credentialFields, [f]:e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[13px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" placeholder="..." />
                            </div>
                         ))}
                      </div>
                      <button onClick={()=>onUpdate(order.id, order.status, JSON.stringify(credentialFields))} disabled={isUpdating} className="w-full mt-10 bg-slate-900 text-white py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
                        {isUpdating ? <Loader2 size={18} className="animate-spin" /> : "Authorize & Commit Protocol"}
                      </button>
                   </div>
                </div>
  
                {/* Interaction Section */}
                <div className="space-y-8">
                   <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="relative z-10">
                        <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                            <User size={16} /> Buyer Identity Node
                        </h4>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 border border-white/10 flex items-center justify-center font-black text-2xl">{(order.username||'U')[0]}</div>
                            <div>
                                <h3 className="text-xl font-black">{order.username}</h3>
                                <p className="text-[12px] text-white/50 font-bold">{order.customer_email}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={()=>{localStorage.setItem("selectedUserChat", order.username); setActiveTab?.("messages"); onClose();}} className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                                <MessageSquare size={16} /> Open Comms
                            </button>
                            <button onClick={()=>onUpdate(order.id, "Delivered")} className="flex-1 bg-[#1dbf73] text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#19a463] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={16} /> Finalize
                            </button>
                        </div>
                      </div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                   </div>

                   <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Brief Encrypted Message</h4>
                      <div className="flex gap-3">
                         <input value={dmText} onChange={e=>setDmText(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleSendDm()} placeholder="Type quick update..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-[14px] font-bold text-slate-900 focus:border-[#1dbf73] transition-all" />
                         <button onClick={handleSendDm} disabled={isSending || !dmText.trim()} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all">
                            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                         </button>
                      </div>
                      {dmSent && <p className="text-[11px] text-emerald-500 font-black mt-3 ml-1 uppercase tracking-widest">✓ Node Transmitted</p>}
                   </div>

                   <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4">
                      <AlertCircle className="text-amber-500 shrink-0" size={20} />
                      <p className="text-[12px] text-amber-700 font-bold leading-relaxed italic">
                        "Protocol Reminder: All digital assets must be verified for 2FA clearance before marking as Delivered."
                      </p>
                   </div>
                </div>
             </div>
          </div>
          </motion.div>
      </div>
    );
}
