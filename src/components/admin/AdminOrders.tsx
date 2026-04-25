import React, { useEffect, useState, useRef } from "react";
import { Loader2, Search, RefreshCw, X, Send, CheckCircle2, Upload, Mail, MessageSquare, XCircle, AlertCircle, Info, ShieldCheck, ChevronRight, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const TAB_FILTERS = ["All", "New Order", "Delivering", "Preparing", "Delivered", "Cancelled"];

const STATUS_STEPS = ["New Order", "Preparing", "Delivering", "Waiting for confirmation", "Completed", "Evaluate"];

export function AdminOrders({ setActiveTab: parentSetActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [activeTab, setActiveTabLocal] = useState("All");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
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
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const categories = ["All", ...new Set(orders.map(o => o.products?.category).filter(Boolean))];
  const sellers = ["All", ...new Set(orders.map(o => o.username).filter(Boolean))];

  const tabCount = (tab: string) => {
    if (tab === "All") return orders.length;
    if (tab === "New Order") return orders.filter(o => o.status === "New Order" || o.status === "Awaiting Verification" || o.status === "Paid").length;
    return orders.filter(o => o.status === tab).length;
  };

  const filteredOrders = orders.filter(o => {
    const matchTab =
      activeTab === "All" ? true :
      activeTab === "New Order" ? (o.status === "New Order" || o.status === "Awaiting Verification" || o.status === "Paid") :
      o.status === activeTab;
    const matchOrderNum = filterOrderNum === "" || (o.id || "").toLowerCase().includes(filterOrderNum.toLowerCase());
    const matchProduct = filterProduct === "" || (o.products?.title || "").toLowerCase().includes(filterProduct.toLowerCase());
    const matchSeller = filterSeller === "All" || o.username === filterSeller;
    const matchCategory = filterCategory === "All" || o.products?.category === filterCategory;
    const matchFrom = filterFrom === "" || new Date(o.created_at) >= new Date(filterFrom);
    const matchTo = filterTo === "" || new Date(o.created_at) <= new Date(filterTo + "T23:59:59");
    return matchTab && matchOrderNum && matchProduct && matchSeller && matchCategory && matchFrom && matchTo;
  });

  const statusPills = [
    { label: "Pending", count: orders.filter(o => o.status === "New Order" || o.status === "Paid").length },
    { label: "Active", count: orders.filter(o => o.status === "Delivering" || o.status === "Preparing").length },
    { label: "Revenue", value: `$${orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0).toFixed(0)}` }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Header Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {TAB_FILTERS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTabLocal(tab)}
              className={`px-5 py-4 text-[13px] font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab ? "border-primary-600 text-primary-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {tabCount(tab)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-8">
        
        {/* Filters and Stats */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
           <div className="flex-1 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><Filter size={18} className="text-primary-600" /> Matrix Filters</h3>
                 <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors"><ChevronRight size={20} className={showMobileFilters ? "rotate-90 transition-transform" : ""} /></button>
              </div>
              <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-col`}>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Hash</label>
                   <input value={filterOrderNum} onChange={e => setFilterOrderNum(e.target.value)} placeholder="Order ID..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600 transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                   <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder="Search title..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600 transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier</label>
                   <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600 transition-all">
                     {categories.map(c => <option key={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Buyer</label>
                   <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600 transition-all">
                     {sellers.map(s => <option key={s}>{s}</option>)}
                   </select>
                </div>
              </div>
           </div>
           
           <div className="lg:w-[320px] flex flex-row lg:flex-col gap-4">
              {statusPills.map((pill, i) => (
                <div key={i} className="flex-1 bg-white border border-slate-200 rounded-[1.5rem] md:rounded-[2rem] p-4 lg:p-6 shadow-sm flex flex-col justify-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{pill.label}</span>
                   <span className="text-xl md:text-2xl font-black text-primary-600">{pill.value || pill.count}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Orders Feed */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
           {/* Desktop Table */}
           <div className="hidden md:block overflow-x-auto">
             <table className="w-full text-left text-[14px]">
               <thead className="bg-slate-50/50 border-b border-slate-200">
                 <tr>
                   <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Asset Node</th>
                   <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Buyer</th>
                   <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                   <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Value (USD)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" /></td></tr>
                  ) : filteredOrders.map(order => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative group-hover:scale-105 transition-transform">
                                <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div>
                                <div className="font-black text-slate-900 group-hover:text-primary-600 transition-colors">{order.products?.title || "Unknown Asset"}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">#{order.id.split('-')[0]} • {new Date(order.created_at).toLocaleDateString()}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-[10px] uppercase">{(order.username||'U')[0]}</div>
                             <span className="font-bold text-slate-700">{order.username}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5"><StatusBadge status={order.status} /></td>
                       <td className="px-6 py-5 text-right font-black text-primary-600 text-[15px]">${Number(order.total_price || 0).toFixed(2)}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>

           {/* Mobile List View */}
           <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary-600" /></div>
              ) : filteredOrders.map(order => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="p-4 active:bg-slate-50 transition-colors">
                   <div className="flex gap-4 mb-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                         <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-1">#{order.id.split('-')[0]}</div>
                         <h4 className="text-[14px] font-black text-slate-900 truncate">{order.products?.title}</h4>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[13px] font-black text-slate-900">${order.total_price}</span>
                            <StatusBadge status={order.status} />
                         </div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                      <span>Buyer: {order.username}</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Detail Modal */}
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
    "Paid": "text-primary-600 bg-primary-50 border-primary-100",
    "Preparing": "text-amber-600 bg-amber-50 border-amber-100",
    "Delivering": "text-purple-600 bg-purple-50 border-purple-100",
    "Cancelled": "text-red-600 bg-red-50 border-red-100",
  };
  const cls = map[status] || "text-slate-500 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${cls}`}>
      {status}
    </span>
  );
}

function SoldDetailModal({ order, onClose, onUpdate, isUpdating, setActiveTab }: any) {
  const [credentialFields, setCredentialFields] = useState<Record<string, string>>(() => {
    try {
      return typeof order.credentials === 'string' ? JSON.parse(order.credentials) : (order.credentials || {});
    } catch (e) {
      return { "Login Account": order.credentials || "" };
    }
  });

  const stepToStatus: Record<string, string> = {
    "New Order": "Paid", "Preparing": "Preparing", "Delivering": "Delivering",
    "Waiting for confirmation": "Delivered", "Completed": "Completed", "Evaluate": "Completed"
  };

  const [dmText, setDmText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dmSent, setDmSent] = useState(false);

  const STATUS_STEPS_FLOW = ["New Order", "Preparing", "Delivering", "Waiting for confirmation", "Completed", "Evaluate"];

  const currentStepIndex = (() => {
    const s = order.status;
    if (s === "New Order" || s === "Paid" || s === "Awaiting Verification") return 0;
    if (s === "Preparing") return 1;
    if (s === "Delivering") return 2;
    if (s === "Waiting for confirmation" || s === "Delivered") return 3;
    if (s === "Completed") return 4;
    return 5;
  })();

  const handleFieldChange = (field: string, value: string) => {
    setCredentialFields(prev => ({ ...prev, [field]: value }));
  };

  async function handleSendDm() {
    if (!dmText.trim()) return;
    setIsSending(true);
    try {
      const targetUsername = order.username || order.customer_email?.split("@")[0] || "User";
      await supabase.from("messages").insert({
        username: targetUsername,
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

  const fields = [
    "* Login Account", "* Login Password", "* 2FA Code", "* cookies",
    "Secondary Password(Security Answer)", "Bind Email Address",
    "Bind Mailbox Password", "Additional information",
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="relative bg-white w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div>
             <h2 className="text-xl font-black tracking-tight">Order Intelligence</h2>
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Hash: {order.id.split('-')[0]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
           {/* Flow Steps */}
           <div className="flex items-center mb-12 overflow-x-auto pb-4 scrollbar-hide">
              {STATUS_STEPS_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                   <div className="flex flex-col items-center shrink-0 w-24">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-black transition-all ${
                        i <= currentStepIndex ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20" : "bg-white border-slate-200 text-slate-300"
                      }`}>
                         {i < currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
                      </div>
                      <span className={`text-[9px] mt-2 font-black uppercase tracking-tighter text-center ${i <= currentStepIndex ? "text-primary-600" : "text-slate-400"}`}>{step}</span>
                   </div>
                   {i < STATUS_STEPS_FLOW.length - 1 && (
                     <div className={`h-0.5 flex-1 min-w-[20px] -mt-5 ${i < currentStepIndex ? "bg-primary-600" : "bg-slate-100"}`} />
                   )}
                </React.Fragment>
              ))}
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left: Product & Credentials */}
              <div className="space-y-8">
                 <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                       <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                       <h4 className="text-[16px] font-black text-slate-900 leading-tight">{order.products?.title}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[13px] font-black text-primary-600">${order.total_price}</span>
                          <StatusBadge status={order.status} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Secure Credentials</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {fields.map((field, i) => (
                         <div key={i} className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{field}</label>
                            <input value={credentialFields[field]||""} onChange={(e)=>handleFieldChange(field, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600" placeholder="..." />
                         </div>
                       ))}
                    </div>
                    <button onClick={() => onUpdate(order.id, order.status, JSON.stringify(credentialFields))} disabled={isUpdating} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                       {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Save Protocol
                    </button>
                 </div>
              </div>

              {/* Right: Buyer & Communication */}
              <div className="space-y-8">
                 <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center font-black text-xl">{(order.username||'U')[0]}</div>
                          <div>
                             <div className="text-lg font-black">{order.username}</div>
                             <div className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">Verified Identity</div>
                          </div>
                       </div>
                       <div className="space-y-4 mb-8">
                          <div className="flex justify-between text-[11px] font-bold"><span className="text-white/40">Email Node:</span><span>{order.customer_email}</span></div>
                          <div className="flex justify-between text-[11px] font-bold"><span className="text-white/40">Total LTV:</span><span className="text-primary-400">$1,420.00</span></div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={()=>{localStorage.setItem("selectedUserChat", order.username); setActiveTab("messages"); onClose();}} className="flex-1 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-50 transition-all">Direct Comms</button>
                          <button onClick={()=>onUpdate(order.id, "Cancelled")} className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Revoke Order</button>
                       </div>
                    </div>
                 </div>

                 <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare size={14} /> Brief Message</h5>
                    <div className="flex gap-2">
                       <input value={dmText} onChange={e=>setDmText(e.target.value)} placeholder="Quick update..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] focus:border-primary-600" />
                       <button onClick={handleSendDm} disabled={isSending||!dmText.trim()} className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all"><Send size={18} /></button>
                    </div>
                    {dmSent && <p className="text-[10px] text-emerald-600 font-bold mt-2 ml-1">✓ Transmitted Successfully</p>}
                 </div>

                 <button 
                  onClick={()=>onUpdate(order.id, "Delivered", JSON.stringify(credentialFields))}
                  disabled={isUpdating}
                  className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black text-[14px] uppercase tracking-[0.2em] hover:bg-primary-700 shadow-2xl shadow-primary-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    {isUpdating ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle2 size={24} />}
                    Finalize Delivery
                 </button>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
