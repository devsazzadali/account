import React, { useEffect, useState } from "react";
import { Loader2, Search, RefreshCw, X, Send, CheckCircle2, Upload, Mail, MessageSquare, XCircle, AlertCircle, Info, ShieldCheck } from "lucide-react";
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

    // Realtime subscription for live order updates
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    { label: "New Order", count: orders.filter(o => o.status === "New Order" || o.status === "Paid").length },
    { label: "Delivering", count: orders.filter(o => o.status === "Delivering").length },
    { label: "Preparing", count: orders.filter(o => o.status === "Preparing").length },
    { label: "Total Revenue", value: `$${orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0).toFixed(2)}` }
  ];

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Tab bar */}
      <div className="border-b border-slate-200 flex items-center gap-0 overflow-x-auto">
        {TAB_FILTERS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTabLocal(tab)}
            className={`px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab
                ? "border-primary-600 text-primary-600 font-bold"
                : "border-transparent text-slate-700 hover:text-primary-600"
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-[11px] font-bold ${activeTab === tab ? "text-primary-600" : "text-slate-400"}`}>
              ({tabCount(tab)})
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="border border-slate-200 m-4 rounded-2xl p-4 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Order #</label>
            <input value={filterOrderNum} onChange={e => setFilterOrderNum(e.target.value)} placeholder="Search ID..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Product Title</label>
            <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder="Search title..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all bg-white">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Seller</label>
            <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all bg-white">
              {sellers.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remarks</label>
            <input value={filterRemarks} onChange={e => setFilterRemarks(e.target.value)} placeholder="Search remarks..." className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">From Date</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">To Date</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:border-primary-600 transition-all" />
          </div>
        </div>
      </div>

      {/* Sub-tab status pills */}
      <div className="flex flex-wrap gap-3 px-4 pb-4">
        {statusPills.map((pill, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pill.label}</span>
            <span className="text-[13px] font-black text-primary-600">
              {pill.value !== undefined ? pill.value : pill.count}
            </span>
          </div>
        ))}
      </div>

      {/* Order Table */}
      <div className="mx-4 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Product Asset</th>
              <th className="px-4 py-3 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Unit Value</th>
              <th className="px-4 py-3 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Classification</th>
              <th className="px-4 py-3 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Current Status</th>
              <th className="px-4 py-3 font-bold text-slate-900 uppercase tracking-wider text-[10px]">Notes</th>
              <th className="px-4 py-3 font-bold text-primary-600 uppercase tracking-wider text-[10px]">Total (USD)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600" />
                <p className="text-[12px] text-slate-400 mt-3 font-medium">Fetching secure ledgers...</p>
              </td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-slate-400">
                <Search size={40} className="mx-auto text-slate-200 mb-3" />
                <p className="text-[14px] font-bold text-slate-900">No transactions detected</p>
                <p className="text-[12px] mt-1">Refine your filtration parameters</p>
              </td></tr>
            ) : filteredOrders.map(order => (
              <tr 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                      {order.products?.image
                        ? <img src={order.products.image} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📦</div>
                      }
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-[13px] leading-tight max-w-[220px] truncate group-hover:text-primary-600 transition-colors">
                        {order.products?.title || "Unknown Asset"}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        #{ (order.id || "").split("-")[0].toUpperCase() } · {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-slate-900">${Number(order.total_price || 0).toFixed(2)}</td>
                <td className="px-4 py-4 text-slate-600 font-medium">{order.products?.category || "Digital"}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-slate-400 text-[12px] font-medium">—</td>
                <td className="px-4 py-4 font-black text-primary-600 text-[14px]">${Number(order.total_price || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    "Delivered": "text-emerald-600 bg-emerald-50 border-emerald-200",
    "Completed": "text-emerald-600 bg-emerald-50 border-emerald-200",
    "Paid": "text-[#1890ff] bg-blue-50 border-[#91d5ff]",
    "Preparing": "text-amber-500 bg-[#fff7e6] border-[#ffd591]",
    "Delivering": "text-[#722ed1] bg-[#f9f0ff] border-[#d3adf7]",
    "Cancelled": "text-[#ff4d4f] bg-red-50 border-red-200",
    "Awaiting Verification": "text-amber-500 bg-[#fff7e6] border-[#ffd591]",
  };
  const cls = map[status] || "text-slate-700 bg-slate-50 border-slate-200";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${cls} shadow-sm`}>
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
    "New Order": "Paid",
    "Preparing": "Preparing",
    "Delivering": "Delivering",
    "Waiting for confirmation": "Delivered",
    "Completed": "Completed",
    "Evaluate": "Completed"
  };

  const [dmText, setDmText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dmSent, setDmSent] = useState(false);
  const dmInputRef = useRef<HTMLInputElement>(null);

  const STATUS_STEPS_FLOW = ["New Order", "Preparing", "Delivering", "Waiting for confirmation", "Completed", "Evaluate"];

  const currentStepIndex = (() => {
    const s = order.status;
    if (s === "New Order" || s === "Paid" || s === "Awaiting Verification") return 0;
    if (s === "Preparing") return 1;
    if (s === "Delivering") return 2;
    if (s === "Waiting for confirmation" || s === "Delivered") return 3;
    if (s === "Completed") return 4;
    if (s === "Evaluate") return 5;
    return -1;
  })();

  async function handleDeliver() {
    await onUpdate(order.id, "Delivered", JSON.stringify(credentialFields));
  }

  async function handleSaveCredentials() {
    await onUpdate(order.id, order.status, JSON.stringify(credentialFields));
    alert("Credentials saved successfully.");
  }

  const handleFieldChange = (field: string, value: string) => {
    setCredentialFields(prev => ({ ...prev, [field]: value }));
  };

  async function handleSendDm() {
    if (!dmText.trim()) {
      dmInputRef.current?.focus();
      return;
    }
    setIsSending(true);
    try {
      const targetUsername = order.username || order.customer_email?.split("@")[0] || "User";
      const { error } = await supabase.from("messages").insert({
        username: targetUsername,
        subject: `Order #${(order.id || "").split("-")[0].toUpperCase()}`,
        message: "[ADMIN_INITIATED]",
        reply: dmText,
        status: "unread",
        replied_at: new Date().toISOString(),
      });
      if (error) throw error;
      setDmText("");
      setDmSent(true);
      setTimeout(() => setDmSent(false), 3000);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSending(false);
    }
  }

  const fields = [
    "* Login Account", "* Login Password", "* 2FA Code", "* cookies",
    "Secondary Password(Security Answer)", "Account registration information (Last Name)",
    "Account registration information (First Name)", "Account registration information (Country)",
    "Account registration information (date of birth)", "Bind Email Address",
    "Bind Mailbox Password", "Bind mailbox security issue 1", "Secret Answer 1",
    "Bind mailbox security issue 2", "Secret Answer 2", "Bind mailbox security issue 3",
    "Secret Answer 3", "Additional information",
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50"
      />
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
        className="relative bg-white w-full max-w-4xl my-8 mx-4 rounded shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-[18px] font-display font-bold text-slate-900">Sold Details</h2>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-5 border-b border-slate-200 bg-white">
          <div className="flex items-center">
            {STATUS_STEPS_FLOW.map((step, i) => (
              <React.Fragment key={step}>
                <div 
                  className="flex flex-col items-center flex-1 cursor-pointer group"
                  onClick={() => onUpdate(order.id, stepToStatus[step] || step)}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                    i <= currentStepIndex
                      ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/20"
                      : "bg-white border-slate-200 text-slate-300 group-hover:border-primary-400"
                  }`}>
                    {i < currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-2 text-center leading-tight transition-colors ${i <= currentStepIndex ? "text-primary-600 font-bold" : "text-slate-400 group-hover:text-slate-600"}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS_FLOW.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-5 transition-all ${i < currentStepIndex ? "bg-primary-600" : "bg-slate-100"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Order Info Bar */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-[12px]">
          <span className="font-bold text-slate-900">Order number: <span className="text-primary-600">{order.id}</span></span>
          <span className="text-slate-400 ml-auto">Order Date: {new Date(order.created_at).toLocaleString()}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Buyer info + action buttons */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-[16px] shadow-lg shadow-primary-600/20">
              {(order.username || order.customer_email || "U")[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[14px] font-bold text-slate-900">{order.username || order.customer_email?.split("@")[0]}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Node</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const targetUser = order.username || order.customer_email?.split("@")[0];
                if (targetUser && setActiveTab) {
                   localStorage.setItem("selectedUserChat", targetUser);
                   setActiveTab("messages");
                   onClose();
                }
              }} 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-[12px] font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <MessageSquare size={14} /> Open Chat
            </button>
            <a 
              href={`mailto:${order.customer_email}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-bold hover:bg-slate-50 transition-all active:scale-95"
            >
              <Mail size={14} /> Contact By Mail
            </a>
            <button 
              onClick={() => { if(confirm("Cancel this order?")) onUpdate(order.id, "Cancelled"); }} 
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-red-500 rounded-xl text-[12px] font-bold hover:bg-red-50 transition-all active:scale-95"
            >
              <XCircle size={14} /> Cancel Order
            </button>
          </div>
        </div>

        {/* Product info */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30 flex justify-between items-center text-[13px]">
          <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-3">Game Instance:</span> <span className="font-bold text-slate-900">{order.products?.category || "—"}</span></div>
          <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-3">Asset Identity:</span> <span className="font-bold text-primary-600">{order.products?.title || "—"}</span></div>
        </div>

        {/* Accounts Info / Credential Form */}
        <div className="px-6 py-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-primary-400" />
                <span className="text-[13px] font-bold uppercase tracking-widest">Credential Protocol</span>
              </div>
            </div>
            <div className="p-6 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {fields.map((field, i) => (
                  <div key={i}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">{field}</label>
                    <input
                      value={credentialFields[field] || ""}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="w-full border-b border-slate-200 py-2 px-1 text-[13px] font-medium focus:outline-none focus:border-primary-600 bg-transparent transition-all placeholder:text-slate-300"
                      placeholder={field.startsWith("*") ? "Required field" : "Optional data node..."}
                    />
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <p className="text-[11px] text-slate-400 italic flex items-center gap-1.5">
                  <Info size={12} /> Credentials are encrypted and sent upon confirmation.
                </p>
                <button 
                  onClick={handleSaveCredentials}
                  disabled={isUpdating}
                  className="px-8 py-3 bg-primary-600 text-white text-[12px] font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 uppercase tracking-widest flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : "Authorize & Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Direct message & Confirm Delivered footer */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              ref={dmInputRef}
              value={dmText}
              onChange={e => setDmText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendDm()}
              placeholder="Send a direct message to customer..."
              className="flex-1 border border-slate-200 rounded px-3 py-2 text-[13px] focus:outline-none focus:border-primary-600"
            />
            <button
              onClick={handleSendDm}
              disabled={isSending || !dmText.trim()}
              className="px-4 py-2 bg-[#1890ff] text-white text-[12px] font-bold rounded hover:bg-[#096dd9] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send
            </button>
          </div>
          {dmSent && <p className="text-[11px] text-emerald-600 font-bold mb-2">✓ Message sent to customer's chat.</p>}

          <div className="flex justify-end">
            <button
              disabled={isUpdating}
              onClick={handleDeliver}
              className="px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm Delivered
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
