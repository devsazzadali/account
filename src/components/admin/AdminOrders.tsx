import React, { useEffect, useState, useCallback } from "react";
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
import { supabase } from "../../lib/supabase";
import { AdminOrderDetails } from "./AdminOrderDetails";

export function AdminOrders({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [activeTab, setLocalTab] = useState("All");
  const [counts, setCounts] = useState<any>({ All: 0, Pending: 0, Waiting: 0, Completed: 0, Canceled: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  
  // Filter States
  const [filters, setFilters] = useState({
    game: "All",
    category: "All",
    orderNumber: "",
    productTitle: "",
    remarks: "",
    fromDate: "",
    toDate: ""
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch Categories
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      setCategories(catData || []);

      // Fetch Orders with Joined Data
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          product_title,
          product_image
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Calculate counts
      const countsMap = {
        All: data?.length || 0,
        Pending: data?.filter(o => o.status === 'pending').length || 0,
        Waiting: data?.filter(o => o.status === 'waiting').length || 0,
        Completed: data?.filter(o => o.status === 'completed').length || 0,
        Canceled: data?.filter(o => o.status === 'canceled' || o.status === 'cancelled').length || 0,
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

  const filteredOrders = orders.filter(order => {
    // Status Tab Filter
    const matchesTab = activeTab === "All" || 
                      (activeTab === "Pending" && order.status === "pending") ||
                      (activeTab === "Waiting" && order.status === "waiting") ||
                      (activeTab === "Completed" && order.status === "completed") ||
                      (activeTab === "Canceled" && (order.status === "canceled" || order.status === "cancelled"));
    
    if (!matchesTab) return false;

    // Advanced Filters
    const matchesGame = filters.game === "All" || order.game_type === filters.game;
    const matchesCategory = filters.category === "All" || order.category === filters.category;
    const matchesOrderNum = !filters.orderNumber || order.id.toLowerCase().includes(filters.orderNumber.toLowerCase());
    const matchesTitle = !filters.productTitle || (order.product_title && order.product_title.toLowerCase().includes(filters.productTitle.toLowerCase()));
    const matchesRemarks = !filters.remarks || (order.remarks && order.remarks.toLowerCase().includes(filters.remarks.toLowerCase()));
    
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
    setFilters({
      game: "All",
      category: "All",
      orderNumber: "",
      productTitle: "",
      remarks: "",
      fromDate: "",
      toDate: ""
    });
  };

  if (selectedOrder) {
    return <AdminOrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  const tabs = [
    { id: "All", label: `All (${counts.All})` },
    { id: "Pending", label: `Pending Delivery (${counts.Pending})` },
    { id: "Waiting", label: `Waiting Confirmation (${counts.Waiting})` },
    { id: "Completed", label: `Completed (${counts.Completed})` },
    { id: "Canceled", label: `Canceled (${counts.Canceled})` },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-20">
      {/* Header Tabs Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[1400px] mx-auto px-8 flex items-center gap-8 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLocalTab(tab.id)}
              className={`py-4 text-[11px] font-black uppercase tracking-[0.15em] transition-all border-b-2 whitespace-nowrap relative ${
                activeTab === tab.id 
                ? "border-[#E62E04] text-[#E62E04]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-0 bottom-[-2px] h-[2px] bg-[#E62E04] shadow-[0_0_10px_rgba(230,46,4,0.4)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 pt-8 space-y-6">
        {/* Filter Section */}
        <div className="bg-white p-8 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <FilterField label="GAME:">
              <select 
                value={filters.game}
                onChange={(e) => setFilters({...filters, game: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-[#E62E04] transition-all"
              >
                <option value="All">All</option>
                <option value="Free Fire">Free Fire</option>
                <option value="PUBG">PUBG</option>
                <option value="Valorant">Valorant</option>
              </select>
            </FilterField>
            <FilterField label="CATEGORY:">
              <select 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-[#E62E04] transition-all"
              >
                <option value="All">All</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </FilterField>
            <FilterField label="ORDER NUMBER:">
              <input 
                type="text" 
                placeholder="Order number" 
                value={filters.orderNumber}
                onChange={(e) => setFilters({...filters, orderNumber: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium placeholder:text-slate-400 outline-none focus:border-[#E62E04] transition-all" 
              />
            </FilterField>
            <FilterField label="PRODUCT TITLE:">
              <input 
                type="text" 
                placeholder="Product Title" 
                value={filters.productTitle}
                onChange={(e) => setFilters({...filters, productTitle: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium placeholder:text-slate-400 outline-none focus:border-[#E62E04] transition-all" 
              />
            </FilterField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <FilterField label="INTERNAL REMARKS:">
              <input 
                type="text" 
                placeholder="Internal remarks" 
                value={filters.remarks}
                onChange={(e) => setFilters({...filters, remarks: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium placeholder:text-slate-400 outline-none focus:border-[#E62E04] transition-all" 
              />
            </FilterField>
            <div className="col-span-2 flex items-center gap-4">
              <div className="flex-1">
                <FilterField label="FROM">
                  <input 
                    type="date" 
                    value={filters.fromDate}
                    onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:border-[#E62E04] transition-all" 
                  />
                </FilterField>
              </div>
              <span className="text-sm font-medium text-slate-400 mt-6">to</span>
              <div className="flex-1">
                <FilterField label="TO">
                  <input 
                    type="date" 
                    value={filters.toDate}
                    onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                    className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:border-[#E62E04] transition-all" 
                  />
                </FilterField>
              </div>
            </div>
            <div>
              <button 
                onClick={fetchInitialData}
                className="w-full h-11 bg-[#E62E04] text-white font-bold text-[13px] uppercase rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-sm"
              >
                SEARCH
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Section */}
        <div className="flex items-center gap-3 mt-4 mb-2">
            <button className="px-5 py-2 border border-slate-300 rounded text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 transition-colors">
                New Order
            </button>
            <button className="px-5 py-2 border border-slate-300 rounded text-sm font-bold text-slate-400 bg-white hover:text-slate-800 transition-colors uppercase">
                Preparing
            </button>
            <button className="px-5 py-2 border border-slate-300 rounded text-sm font-bold text-slate-400 bg-white hover:text-slate-800 transition-colors">
                Delivering
            </button>
        </div>

        {/* Orders Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-12 gap-4 text-xs font-bold text-slate-600 bg-slate-50">
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
                  <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-[#E62E04] animate-spin mx-auto mb-6" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-32 text-center flex flex-col items-center justify-center">
                   <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 text-slate-300">
                      <ShoppingBag size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-[#0A0F1C] italic tracking-tight mb-2 uppercase">NO ACTIVE ORDERS</h3>
                   <p className="text-[14px] font-medium text-slate-400">No results found matching your current protocol filters.</p>
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

  return (
    <div onClick={onDetail} className="group hover:bg-slate-50/50 transition-all duration-300 cursor-pointer">
      <div className="px-6 py-6 grid grid-cols-12 gap-4 items-center">
        {/* Product (col-span-4) */}
        <div className="col-span-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative">
            <img src={order.product_image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=200&auto=format&fit=crop"} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-[13px] leading-tight truncate mb-1">{order.product_title || 'Netflix Premium 1 Month'}</h4>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                {showWarning && <AlertCircle size={10} className="text-[#E62E04]" />}
            </div>
          </div>
        </div>

        {/* Unit Price (col-span-2) */}
        <div className="col-span-2">
          <span className="text-[13px] font-bold text-slate-900">${(order.total_amount || 0).toLocaleString()}</span>
        </div>

        {/* Type (col-span-1) */}
        <div className="col-span-1 flex justify-center text-slate-400">
           <Package size={18} />
        </div>

        {/* Status (col-span-2) */}
        <div className="col-span-2">
           <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
              isCanceled ? 'bg-red-50 text-[#E62E04] border-red-100' :
              order.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              'bg-amber-50 text-amber-600 border-amber-100'
           }`}>
             {isCanceled ? 'Terminated' : order.status}
           </span>
        </div>

        {/* Internal Remarks (col-span-2) */}
        <div className="col-span-2">
           <p className="text-[12px] font-medium text-slate-500 truncate pr-4">
               {order.remarks ? `"${order.remarks}"` : '-'}
           </p>
        </div>

        {/* Total Amount (col-span-1) */}
        <div className="col-span-1 text-right">
           <p className="text-[14px] font-bold text-slate-900">${(order.total_amount || 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-[#E62E04]" />
          {label}
      </label>
      {children}
    </div>
  );
}
