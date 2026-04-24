import React, { useEffect, useState } from "react";
import { Loader2, Search, RefreshCw, X, Send, CheckCircle2, Upload, Mail, MessageSquare, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AnimatePresence, motion } from "framer-motion";

const TAB_FILTERS = ["All", "New Order", "Delivering", "Preparing", "Delivered", "Cancelled"];

const STATUS_STEPS = ["New Order", "Preparing", "Delivering", "Waiting for confirmation", "Completed", "Evaluate"];

export function AdminOrders() {
  const [activeTab, setActiveTab] = useState("All");
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

  useEffect(() => { fetchOrders(); }, []);

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

  const tabCount = (tab: string) => {
    if (tab === "All") return orders.length;
    if (tab === "New Order") return orders.filter(o => o.status === "Awaiting Verification").length;
    return orders.filter(o => o.status === tab).length;
  };

  const filteredOrders = orders.filter(o => {
    const matchTab =
      activeTab === "All" ? true :
      activeTab === "New Order" ? o.status === "Awaiting Verification" :
      o.status === activeTab;

    const matchOrderNum = filterOrderNum === "" || o.id.toLowerCase().includes(filterOrderNum.toLowerCase());
    const matchProduct = filterProduct === "" || (o.products?.title || "").toLowerCase().includes(filterProduct.toLowerCase());
    const matchFrom = filterFrom === "" || new Date(o.created_at) >= new Date(filterFrom);
    const matchTo = filterTo === "" || new Date(o.created_at) <= new Date(filterTo + "T23:59:59");

    return matchTab && matchOrderNum && matchProduct && matchFrom && matchTo;
  });

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Tab bar */}
      <div className="border-b border-[#e0e0e0] flex items-center gap-0 overflow-x-auto">
        {TAB_FILTERS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab
                ? "border-[#e4393c] text-[#e4393c] font-bold"
                : "border-transparent text-[#555] hover:text-[#e4393c]"
            }`}
          >
            {tab}
            <span className={`ml-1.5 text-[11px] font-bold ${activeTab === tab ? "text-[#e4393c]" : "text-[#999]"}`}>
              ({tabCount(tab)})
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="border border-[#e0e0e0] m-4 rounded p-4 bg-[#fafafa]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">Seller:</label>
            <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#e4393c]">
              <option>All</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">Category:</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#e4393c]">
              <option>All</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">Order number:</label>
            <input value={filterOrderNum} onChange={e => setFilterOrderNum(e.target.value)} placeholder="Order number" className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e4393c]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">Product Title:</label>
            <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)} placeholder="Product Title" className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e4393c]" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">Internal remarks:</label>
            <input value={filterRemarks} onChange={e => setFilterRemarks(e.target.value)} placeholder="Internal remarks" className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e4393c]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">From:</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e4393c]" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-[#555] whitespace-nowrap">To:</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="flex-1 border border-[#ddd] rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e4393c]" />
          </div>
          <button onClick={fetchOrders} className="bg-[#e4393c] text-white rounded px-6 py-2 text-[13px] font-bold hover:bg-[#c0292b] transition-colors flex items-center gap-2 justify-center">
            <Search size={14} /> Search
          </button>
        </div>
      </div>

      {/* Sub-tab status pills */}
      <div className="flex gap-2 px-4 pb-3">
        {["New Order(0)", "Delivering(0)", "PREPARING(1)", "100.00$"].map((label, i) => (
          <span key={i} className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer border ${i === 2 ? "bg-[#e4393c] text-white border-[#e4393c]" : "bg-white text-[#555] border-[#ddd] hover:border-[#e4393c]"}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Order Table */}
      <div className="mx-4 border border-[#e0e0e0] rounded overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
            <tr>
              <th className="px-4 py-3 font-bold text-[#333]">Product</th>
              <th className="px-4 py-3 font-bold text-[#333]">Unit Price</th>
              <th className="px-4 py-3 font-bold text-[#333]">Type</th>
              <th className="px-4 py-3 font-bold text-[#333]">Status</th>
              <th className="px-4 py-3 font-bold text-[#333]">
                Internal remarks <span className="text-[#e4393c]">ⓘ</span>
              </th>
              <th className="px-4 py-3 font-bold text-[#333]">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e4393c]" />
              </td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-[#999] text-[13px]">No orders found.</td></tr>
            ) : filteredOrders.map(order => (
              <tr
                key={order.id}
                className="hover:bg-[#fff8f8] cursor-pointer transition-colors"
                onClick={() => setSelectedOrder(order)}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#f5f5f5] border border-[#e0e0e0] overflow-hidden shrink-0">
                      {order.products?.image
                        ? <img src={order.products.image} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-[#ccc] text-lg">📦</div>
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-[#333] text-[13px] leading-tight max-w-[220px] truncate">
                        {order.products?.title || "Unknown Product"}
                      </div>
                      <div className="text-[11px] text-[#999] mt-0.5">
                        #{order.id.split("-")[0].toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-[#333]">${Number(order.total_price).toFixed(2)}</td>
                <td className="px-4 py-4 text-[#555]">{order.products?.category || "Digital"}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-[#999] text-[12px]">—</td>
                <td className="px-4 py-4 font-bold text-[#e4393c]">${Number(order.total_price).toFixed(2)}</td>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Delivered": "text-[#52c41a] bg-[#f6ffed] border-[#b7eb8f]",
    "Completed": "text-[#52c41a] bg-[#f6ffed] border-[#b7eb8f]",
    "Paid": "text-[#1890ff] bg-[#e6f7ff] border-[#91d5ff]",
    "Preparing": "text-[#fa8c16] bg-[#fff7e6] border-[#ffd591]",
    "Delivering": "text-[#722ed1] bg-[#f9f0ff] border-[#d3adf7]",
    "Cancelled": "text-[#ff4d4f] bg-[#fff1f0] border-[#ffa39e]",
    "Awaiting Verification": "text-[#fa8c16] bg-[#fff7e6] border-[#ffd591]",
  };
  const cls = map[status] || "text-[#555] bg-[#f5f5f5] border-[#ddd]";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded border text-[11px] font-bold ${cls}`}>
      {status}
    </span>
  );
}

function SoldDetailModal({ order, onClose, onUpdate, isUpdating }: any) {
  const [creds, setCreds] = useState(order.credentials || "");
  const [dmText, setDmText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dmSent, setDmSent] = useState(false);

  const currentStepIndex = (() => {
    if (order.status === "Awaiting Verification" || order.status === "Paid") return 1;
    if (order.status === "Preparing") return 2;
    if (order.status === "Delivering") return 2;
    if (order.status === "Delivered" || order.status === "Completed") return 4;
    return 0;
  })();

  async function handleDeliver() {
    await onUpdate(order.id, "Delivered", creds);
  }

  async function handleSendDm() {
    if (!dmText.trim()) return;
    setIsSending(true);
    try {
      const targetUsername = order.customer_email.split("@")[0];
      const { error } = await supabase.from("messages").insert({
        username: targetUsername,
        subject: `Order #${order.id.split("-")[0].toUpperCase()}`,
        message: "[ADMIN_INITIATED]",
        reply: dmText,
        status: "replied",
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e0e0]">
          <h2 className="text-[18px] font-bold text-[#333]">Sold Details</h2>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#999]">
              <span className="text-[#333] font-medium mr-1">★</span>
              Rating options
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-[#f5f5f5] rounded transition-colors">
              <X size={18} className="text-[#999]" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-5 border-b border-[#e0e0e0] bg-white">
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                    i <= currentStepIndex
                      ? "bg-[#e4393c] border-[#e4393c] text-white"
                      : "bg-white border-[#ccc] text-[#ccc]"
                  }`}>
                    {i <= currentStepIndex ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1.5 text-center leading-tight ${i <= currentStepIndex ? "text-[#e4393c] font-bold" : "text-[#bbb]"}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-4 transition-all ${i < currentStepIndex ? "bg-[#e4393c]" : "bg-[#e0e0e0]"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Order Info Bar */}
        <div className="px-6 py-3 bg-[#fafafa] border-b border-[#e0e0e0] flex flex-wrap items-center gap-4 text-[12px]">
          <span className="font-bold text-[#333]">Order number: {order.id}</span>
          {order.status === "Delivering" && (
            <span className="text-[#e4393c] font-bold">⏰ Exceeded the promised delivery time for X hours</span>
          )}
          <span className="text-[#999]">Order Date: {new Date(order.created_at).toLocaleString()}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* Buyer info + action buttons */}
        <div className="px-6 py-4 border-b border-[#e0e0e0] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#e4393c]/10 flex items-center justify-center text-[#e4393c] font-bold text-[15px]">
              {order.customer_email[0].toUpperCase()}
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#333]">{order.customer_email.split("@")[0]}</div>
              <div className="text-[10px] text-[#999]">buyer</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-4">
            <button onClick={handleSendDm} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#52c41a] text-white rounded text-[12px] font-bold hover:bg-[#3da012] transition-colors">
              <MessageSquare size={13} /> Chat Now
            </button>
            <a href={`mailto:${order.customer_email}`} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ddd] text-[#555] rounded text-[12px] font-bold hover:bg-[#f5f5f5] transition-colors">
              <Mail size={13} /> Contact buyers by mail
            </a>
            <button onClick={() => onUpdate(order.id, "Cancelled")} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ddd] text-[#555] rounded text-[12px] font-bold hover:bg-[#f5f5f5] transition-colors">
              <XCircle size={13} /> Cancel Order
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#ddd] text-[#555] rounded text-[12px] font-bold hover:bg-[#f5f5f5] transition-colors">
              <Upload size={13} /> Upload/View
            </button>
          </div>
        </div>

        {/* Product info */}
        <div className="px-6 py-4 border-b border-[#e0e0e0] grid grid-cols-2 gap-4 text-[13px]">
          <div><span className="text-[#999]">Game:</span> <span className="font-medium text-[#333] ml-2">{order.products?.category || "—"}</span></div>
          <div><span className="text-[#999]">Product Title:</span> <span className="font-medium text-[#333] ml-2">{order.products?.title || "—"}</span></div>
        </div>

        {/* Accounts Info / Credential Form */}
        <div className="px-6 py-4">
          <div className="border border-[#e0e0e0] rounded">
            <div className="flex items-center justify-between px-4 py-3 bg-[#222] text-white rounded-t">
              <span className="text-[13px] font-bold">Accounts Info</span>
              <button className="w-6 h-6 rounded bg-white/20 text-white text-lg leading-none flex items-center justify-center hover:bg-white/30">+</button>
            </div>
            <div className="p-4 space-y-3">
              {[
                "* Login Account",
                "* Login Password",
                "* 2FA Code",
                "* cookies",
                "Secondary Password(Security Answer)",
                "Account registration information (Last Name)",
                "Account registration information (First Name)",
                "Account registration information (Country)",
                "Account registration information (date of birth)",
                "Bind Email Address",
                "Bind Mailbox Password",
                "Bind mailbox security issue 1",
                "Secret Answer 1",
                "Bind mailbox security issue 2",
                "Secret Answer 2",
                "Bind mailbox security issue 3",
                "Secret Answer 3",
                "Additional information",
              ].map((field, i) => (
                <div key={i}>
                  <label className="text-[12px] text-[#555] block mb-1">{field}</label>
                  <input
                    className="w-full border-b border-[#ddd] py-1.5 px-1 text-[13px] focus:outline-none focus:border-[#e4393c] bg-transparent transition-colors"
                    placeholder={field.startsWith("*") ? "" : "If not filled in (none)"}
                  />
                </div>
              ))}
              <div className="pt-2">
                <button className="px-5 py-2 bg-[#e4393c] text-white text-[13px] font-bold rounded hover:bg-[#c0292b] transition-colors">
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Direct message & Confirm Delivered footer */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <input
              value={dmText}
              onChange={e => setDmText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSendDm()}
              placeholder="Send a direct message to customer..."
              className="flex-1 border border-[#ddd] rounded px-3 py-2 text-[13px] focus:outline-none focus:border-[#e4393c]"
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
          {dmSent && <p className="text-[11px] text-[#52c41a] font-bold mb-2">✓ Message sent to customer's chat.</p>}

          <div className="flex justify-end">
            <button
              disabled={isUpdating}
              onClick={handleDeliver}
              className="px-6 py-2.5 bg-[#e4393c] text-white text-[13px] font-bold rounded hover:bg-[#c0292b] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
              Confirm Delivered
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-[#f0f0f0]">
            <p className="text-[11px] text-[#999]">Trading Status 0/1 delivered</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
