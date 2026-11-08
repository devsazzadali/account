"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { orderCode } from "../../lib/order-ref";
import { 
  Search, 
  RefreshCw, 
  MoreVertical, 
  Eye, 
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingBag,
  Package,
  ArrowRight,
  Zap,
  Calendar,
  User,
  ExternalLink,
  PackageCheck,
  CreditCard,
  ArrowUpRight,
  FileText,
  Loader2
} from "lucide-react";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { AdminOrderDetails } from "./AdminOrderDetails";
import { lsGet, lsRemove } from "@/src/lib/storage";

export function AdminOrders({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setLocalTab] = useState("All");
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [counts, setCounts] = useState<any>({ All: 0, Pending: 0, Waiting: 0, Completed: 0, Disputed: 0, Canceled: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  
  // Filter States
  const [filters, setFilters] = useState({
    game: "All",
    category: "All",
    productTitle: "",
    remarks: "",
    fromDate: "",
    toDate: ""
  });

  // QA3 D4: controlled order-number filter state. The filter input binds to
  // this, and the topbar order scan sets it BEFORE a refetch re-renders with
  // the stale empty value — React restores controlled inputs to their state
  // value on re-render, so binding to a plain ref keeps the value stable.
  const orderNumberRef = useRef("");
  const [orderNumberTick, setOrderNumberTick] = useState(0);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch Categories
      const { data: catData } = await db
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      setCategories(catData || []);

      // Fetch Orders with Joined Data (product embed → display fields)
      const { data, error } = await db
        .from("orders")
        .select("*, products(title, image, price, delivery_eta_hours, category, game_type)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = (data || []).map((o: any) => ({
        ...o,
        product_title: o.products?.title || "Product",
        product_image: o.products?.image || null,
        // Unit price paid (QA3 D1): derived exactly from the order's own
        // numbers — subtotal = total + discount − service fee ($0.50) —
        // divided by quantity. Falls back to the product's current list
        // price only if the order math is unavailable.
        unit_price: o.quantity
          ? (Number(o.total_price || 0) + Number(o.discount_amount || 0) - 0.5) / Number(o.quantity)
          : (o.products?.price ?? null),
        product_eta_hours: o.products?.delivery_eta_hours ?? null,
        // Game & Category filters (video-gap #2): orders carry neither
        // field — both live on the ordered product, so map them from the
        // embed onto the row and filter on these.
        product_category: o.products?.category ?? null,
        product_game_type: o.products?.game_type ?? null,
      }));
      setOrders(rows);

      // Fix Round 6 (item 5) / QA3: a Messages → Order History click (or
      // the topbar order scan) hands over an order id — open its detail
      // directly on arrival.
      const openId = lsGet("openOrderId");
      if (openId) {
        lsRemove("openOrderId");
        const target = rows.find((r: any) => r.id === openId);
        if (target) setSelectedOrder(target);
      }
      const scanQ = lsGet("orderScanQuery");
      if (scanQ) {
        lsRemove("orderScanQuery");
        orderNumberRef.current = scanQ;
        setOrderNumberTick((t) => t + 1);
      }

      // Fix Round 5 (item 3): tab counts come from the ONE canonical
      // server-side summary (/api/store/stats → orders_summary,
      // src/lib/order-summary.ts) — the same numbers Admin Home and
      // Store Information show. The row-filter predicates below mirror
      // the summary's definitions exactly (case-insensitive terminal
      // states), so a count can never disagree with the list it labels.
      // The local computation remains only as a fallback if the stats
      // endpoint is unreachable.
      const stats = await fetch("/api/store/stats").then((r) => r.json()).catch(() => null);
      const s = stats?.orders_summary;
      const lc = (o: any) => (o.status || "").toLowerCase();
      const countsMap = s ? {
        All: s.total,
        Pending: s.pending,
        Waiting: s.waiting,
        Completed: s.completed,
        Disputed: s.disputed,
        Canceled: s.canceled,
      } : {
        All: rows.length,
        Pending: rows.filter(o => o.payment_status === 'pending_verification' || (o.payment_status === 'unpaid' && lc(o) === 'new order')).length,
        Waiting: rows.filter(o => o.payment_status === 'paid' && (lc(o) === 'preparing' || lc(o) === 'delivering')).length,
        Completed: rows.filter(o => lc(o) === 'completed').length,
        Disputed: rows.filter(o => lc(o) === 'disputed').length,
        Canceled: rows.filter(o => lc(o) === 'canceled' || lc(o) === 'cancelled').length,
      };
      setCounts(countsMap);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // QA3 D4: pick up topbar order scans while the Orders screen is already
  // mounted. AdminLayout raises a window event on Enter (localStorage alone
  // would only be seen on the next mount/refetch).
  useEffect(() => {
    const onScan = () => {
      const scanQ = lsGet("orderScanQuery");
      if (scanQ) {
        lsRemove("orderScanQuery");
        orderNumberRef.current = scanQ;
        setOrderNumberTick((t) => t + 1);
      }
    };
    window.addEventListener("orderScanRequested", onScan);
    return () => window.removeEventListener("orderScanRequested", onScan);
  }, []);

  void orderNumberTick; // re-render trigger for order-number filter changes
  const filteredOrders = orders.filter(order => {
    // Status Tab Filter — definitions mirror the canonical summary
    // (src/lib/order-summary.ts); terminal states compare
    // case-insensitively so legacy lowercase rows land in their tab.
    const st = (order.status || "").toLowerCase();
    const matchesTab = activeTab === "All" ||
                      (activeTab === "Pending" && (order.payment_status === "pending_verification" || (order.payment_status === "unpaid" && st === "new order"))) ||
                      (activeTab === "Waiting" && order.payment_status === "paid" && (st === "preparing" || st === "delivering")) ||
                      (activeTab === "Completed" && st === "completed") ||
                      (activeTab === "Disputed" && st === "disputed") ||
                      (activeTab === "Canceled" && (st === "canceled" || st === "cancelled"));

    if (!matchesTab) return false;
    if (subStatus && st !== subStatus.toLowerCase()) return false;

    // Advanced Filters
    const matchesGame = filters.game === "All" || order.product_game_type === filters.game;
    const matchesCategory = filters.category === "All" || order.product_category === filters.category;
    const matchesOrderNum = !orderNumberRef.current || order.id.toLowerCase().includes(orderNumberRef.current.toLowerCase());
    const matchesTitle = !filters.productTitle || (order.product_title && order.product_title.toLowerCase().includes(filters.productTitle.toLowerCase()));
    const matchesRemarks = !filters.remarks || (order.internal_remarks && order.internal_remarks.toLowerCase().includes(filters.remarks.toLowerCase()));
    
    // Date Filters
    let matchesDate = true;
    if (filters.fromDate) {
      matchesDate = matchesDate && new Date(order.created_at) >= new Date(filters.fromDate);
    }
    if (filters.toDate) {
      const toDateEnd = new Date(filters.toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(order.created_at) <= toDateEnd;
    }

    return matchesGame && matchesCategory && matchesOrderNum && matchesTitle && matchesRemarks && matchesDate;
  });

  const resetFilters = () => {
    orderNumberRef.current = "";
    setOrderNumberTick((t) => t + 1);
    setFilters({
      game: "All",
      category: "All",
      productTitle: "",
      remarks: "",
      fromDate: "",
      toDate: ""
    });
  };

  if (selectedOrder) {
    return <AdminOrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} setActiveTab={setActiveTab} />;
  }

  const tabs = [
    { id: "All", label: `All (${counts.All})` },
    { id: "Pending", label: `Pending Delivery (${counts.Pending})` },
    { id: "Waiting", label: `Waiting Confirmation (${counts.Waiting})` },
    { id: "Completed", label: `Completed (${counts.Completed})` },
    { id: "Disputed", label: `Disputed (${counts.Disputed})` },
    { id: "Canceled", label: `Canceled (${counts.Canceled})` },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Page head — mirrors the reference desk: screen title with a
            live result count beside it. */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Sold Orders</h1>
            <p className="text-[13px] font-medium text-slate-500 mt-1">{loading ? "Loading…" : `${filteredOrders.length} Result${filteredOrders.length === 1 ? "" : "s"}`}</p>
          </div>
        </div>
        {/* Filter Section */}
        <div className="panel p-5 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <FilterField label="Game">
              <select 
                value={filters.game}
                onChange={(e) => setFilters({...filters, game: e.target.value})}
                className="field w-full h-11 px-4 rounded-xl text-[13px]"
              >
                <option value="All">All</option>
                {/* Game options come from the catalog actually on order
                    (video-gap #2) — never a hard-coded list. */}
                {Array.from(new Set(orders.map((o: any) => o.product_game_type).filter(Boolean))).sort().map((g: any) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Category">
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="field w-full h-11 px-4 rounded-xl text-[13px]"
              >
                <option value="All">All</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Order Number">
              <input 
                type="text" 
                placeholder="Order number" 
                key={orderNumberTick}
                defaultValue={orderNumberRef.current}
                onChange={(e) => { orderNumberRef.current = e.target.value; setOrderNumberTick((t) => t + 1); }}
                className="field w-full h-11 px-4 rounded-xl text-[13px]" 
              />
            </FilterField>
            <FilterField label="Product Title">
              <input 
                type="text" 
                placeholder="Product Title" 
                value={filters.productTitle}
                onChange={(e) => setFilters({...filters, productTitle: e.target.value})}
                className="field w-full h-11 px-4 rounded-xl text-[13px]" 
              />
            </FilterField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <FilterField label="Internal Remarks">
              <input 
                type="text" 
                placeholder="Internal remarks" 
                value={filters.remarks}
                onChange={(e) => setFilters({...filters, remarks: e.target.value})}
                className="field w-full h-11 px-4 rounded-xl text-[13px]" 
              />
            </FilterField>
            <div className="col-span-2 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <FilterField label="From">
                  <input 
                    type="date" 
                    value={filters.fromDate}
                    onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                    className="field w-full h-11 px-4 rounded-xl text-[13px]" 
                  />
                </FilterField>
              </div>
              <span className="text-sm font-medium text-slate-400 mt-6">to</span>
              <div className="flex-1 min-w-0">
                <FilterField label="To">
                  <input 
                    type="date" 
                    value={filters.toDate}
                    onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                    className="field w-full h-11 px-4 rounded-xl text-[13px]" 
                  />
                </FilterField>
              </div>
            </div>
            <div>
              <button 
                onClick={fetchInitialData}
                className="btn-primary w-full h-11 font-bold text-[13px] uppercase tracking-wider rounded-xl"
              >
                SEARCH
              </button>
            </div>
          </div>
        </div>

        {/* Status tabs with counts — same position as the reference
            desk: directly under the filter panel, above the table. */}
        <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLocalTab(tab.id)}
              className={`py-3 text-[13px] font-semibold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Fulfilment sub-filter — wired to the real status column */}
        <div className="flex items-center gap-3 mt-4 mb-2 flex-wrap">
            {["New Order", "PREPARING", "Delivering"].map((s) => (
              <button
                key={s}
                onClick={() => setSubStatus(subStatus === s ? null : s)}
                className={`px-4 py-2 border rounded-full text-[13px] font-semibold transition-colors ${
                  subStatus === s
                    ? "border-primary-600 text-primary-700 bg-primary-50"
                    : "border-slate-300 text-slate-500 bg-white hover:text-slate-900 hover:border-slate-400"
                }`}
              >
                {s === "PREPARING" ? "Preparing" : s}
              </button>
            ))}
            {subStatus && (
              <button onClick={() => setSubStatus(null)} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800">
                Clear
              </button>
            )}
        </div>

        {/* Orders Table Section */}
        <div className="panel overflow-hidden">
            <div className="hidden md:grid px-6 py-3.5 border-b border-slate-100 grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/70">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1 text-center">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Internal remarks <span className="text-slate-400 ml-1">⋮</span></div>
              <div className="col-span-1 text-right">Total Amount</div>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-32 text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin mx-auto mb-6" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-16 sm:p-24 text-center flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                      <ShoppingBag size={32} />
                   </div>
                   <h3 className="text-lg font-semibold text-slate-900 tracking-tight mb-2">No orders found</h3>
                   <p className="text-sm font-medium text-slate-500">No orders match the current filters.</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onDetail={() => setSelectedOrder(order)} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

function OrderRow({ order, onDetail }: { order: any, onDetail: () => void, key?: any }) {
  const isCanceled = order.status === 'canceled' || order.status === 'cancelled';
  
  // Calculate delay warning
  const created = new Date(order.created_at);
  const hoursPassed = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60));
  const showWarning = hoursPassed > 2 && !isCanceled && order.status !== 'completed';

  // Delivery ETA (P1): paid but not yet delivered past the product's
  // promised window (created + delivery_eta_hours).
  const etaOverdue = order.payment_status === 'paid' &&
    !order.delivered_at &&
    order.product_eta_hours != null &&
    Date.now() > created.getTime() + Number(order.product_eta_hours) * 3600_000 &&
    !['Completed', 'Canceled', 'Refunded'].includes(order.status);

  return (
    <div onClick={onDetail} className="group hover:bg-slate-50/50 transition-all duration-300 cursor-pointer">
      <div className="px-4 sm:px-6 py-5 flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-4 md:items-center">
        {/* Product (col-span-4) */}
        <div className="md:col-span-4 flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative">
            <img src={order.product_image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200&auto=format&fit=crop"} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-[13px] leading-tight truncate mb-1">{order.product_title || 'Netflix Premium 1 Month'}</h4>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>#{orderCode(order.id)}</span>
                {showWarning && <AlertCircle size={10} className="text-amber-500" />}
            </div>
          </div>
        </div>

        {/* Unit Price (col-span-2) — price per unit paid, not the total */}
        <div className="md:col-span-2">
          <span className="text-[13px] font-bold text-slate-900">${Number(order.unit_price ?? order.total_price ?? 0).toFixed(2)}</span>
          {Number(order.quantity) > 1 && (
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">× {order.quantity}</span>
          )}
        </div>

        {/* Type (col-span-1) */}
        <div className="hidden md:flex md:col-span-1 justify-center text-slate-400">
           <Package size={18} />
        </div>

        {/* Status (col-span-2) — fulfilment state + payment state */}
        <div className="md:col-span-2 flex flex-row flex-wrap md:flex-col items-start gap-1.5">
           <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
              isCanceled ? 'bg-red-50 text-red-600 border-red-100' :
              order.status === 'completed' || order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              order.status === 'Disputed' ? 'bg-red-50 text-red-600 border-red-100' :
              'bg-amber-50 text-amber-600 border-amber-100'
           }`}>
             {isCanceled ? 'Terminated' : order.status}
           </span>
           <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
              order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              order.payment_status === 'pending_verification' ? 'bg-blue-50 text-blue-600 border-blue-100' :
              order.payment_status === 'refunded' ? 'bg-slate-100 text-slate-500 border-slate-200' :
              'bg-slate-50 text-slate-400 border-slate-100'
           }`}>
             {order.payment_status === 'pending_verification' ? 'Verifying' : order.payment_status || 'unpaid'}
           </span>
           {etaOverdue && (
             <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">
               ETA passed
             </span>
           )}
        </div>

        {/* Internal Remarks (col-span-2) */}
        <div className="md:col-span-2 min-w-0">
           <p className="text-[12px] font-medium text-slate-500 truncate pr-4">
               {order.internal_remarks ? `"${order.internal_remarks}"` : '-'}
           </p>
        </div>

        {/* Total Amount (col-span-1) */}
        <div className="md:col-span-1 md:text-right">
           <p className="text-[14px] font-bold text-slate-900">${Number(order.total_price || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] ml-1 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-primary-500/50" />
          {label}
      </label>
      {children}
    </div>
  );
}
