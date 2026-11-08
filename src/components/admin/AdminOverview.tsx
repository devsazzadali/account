"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  ShoppingBag, 
  Zap, 
  Clock, 
  Package, 
  ArrowUpRight, 
  Settings, 
  Star,
  Activity,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Wifi,
  Lock,
  ArrowRightLeft,
  Info,
  User,
  Loader2
} from "lucide-react";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { motion } from "framer-motion";
import { lsGet, lsSet } from "@/src/lib/storage";
import { SalesByDayChart, type SalesDay } from "./SalesByDayChart";

interface AdminOverviewProps {
  setActiveTab: (tab: string) => void;
}

export function AdminOverview({ setActiveTab }: AdminOverviewProps) {
  const [stats, setStats] = useState({
    revenue: 0,
    transactions: 0,
    successRate: 0,
    awaitingAction: 0,
    registryDensity: 0,
    paidCount: 0,
    openDisputes: 0,
    lowStock: 0,
    inventoryAvailable: 0,
    storeOpen: true,
    reviewAverage: null as number | null,
    reviewCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  // Fix Round 6 (video-gap #8): real daily sales series from the stats
  // endpoint (paid orders by day, last 14 days).
  const [salesByDay, setSalesByDay] = useState<SalesDay[]>([]);
  const [productTitles, setProductTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const username = lsGet("username") || "ACCCOUNTSTOREONE";

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, recentRes, disputesRes, inventoryRes, storeStats] = await Promise.all([
        db.from("products").select("id, title, stock, is_active"),
        db.from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        db.from("disputes").select("id").eq("status", "open"),
        // Only the COUNT of available units is rendered — fetch just the
        // count head instead of up to 5,000 id rows (same number shown).
        db.from("inventory").select("count").eq("status", "available"),
        fetch("/api/store/stats").then((r) => r.json()).catch(() => null)
      ]);

      // Fix Round 5 (item 3): every order number on this page comes
      // from the ONE canonical server-side summary
      // (/api/store/stats → orders_summary, src/lib/order-summary.ts) —
      // the same numbers Store Information and Sold Orders show. This
      // page used to re-derive them in the browser from a full-table
      // fetch with its own status predicates (case-insensitive
      // 'completed' but exact-case 'Canceled'), which is how Home,
      // Sold Orders and Customers could disagree about the same store.
      // Money truth is unchanged: revenue counts PAID orders only.
      const summary = storeStats?.orders_summary || null;
      const totalRevenue = summary?.paidRevenue ?? 0;
      const totalOrders = summary?.total ?? 0;
      const successRate = summary?.successRate ?? 0;
      const awaitingAction = summary?.awaitingAction ?? 0;
      const paidCount = summary?.paidCount ?? 0;
      const products = productsRes.data || [];

      setStats({
        revenue: totalRevenue,
        transactions: totalOrders,
        successRate: successRate,
        awaitingAction: awaitingAction,
        registryDensity: products.filter((p: any) => p.is_active !== false).length,
        paidCount: paidCount,
        openDisputes: (disputesRes.data || []).length,
        lowStock: products.filter((p: any) => p.is_active !== false && (p.stock || 0) <= 3).length,
        inventoryAvailable: typeof inventoryRes.count === "number" ? inventoryRes.count : (inventoryRes.data || []).length,
        storeOpen: storeStats?.store_open !== false,
        reviewAverage: storeStats?.average_rating ?? null,
        reviewCount: storeStats?.total_reviews ?? 0
      });

      setSalesByDay(Array.isArray(storeStats?.sales_by_day) ? storeStats.sales_by_day : []);
      setRecentOrders(recentRes.data || []);
      // Orders carry product_id only — resolve display titles from the
      // products fetch so the activity ledger shows real product names
      // instead of "Unknown Asset" for every row.
      setProductTitles(Object.fromEntries((productsRes.data || []).map((p: any) => [p.id, p.title])));
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans pb-20">
      {/* Account banner — mirrors the reference desk's overview band:
          identity left, headline revenue + action center, bordered
          performance box right. Single-vendor: this is the owner's own
          store, so the figures are the store's own totals. */}
      <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8">
        <div className="max-w-[1400px] mx-auto rounded-[1.5rem] bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white relative overflow-hidden shadow-[0_24px_48px_-24px_rgba(17,115,69,0.55)]">
          <div className="absolute top-0 right-0 w-[420px] h-full bg-white/[0.07] blur-[100px] -mr-32 pointer-events-none" />
          <div className="relative z-10 flex flex-col xl:flex-row items-stretch xl:items-center gap-8 p-6 sm:p-8 lg:p-10">
            {/* Identity */}
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/25 p-1.5 shrink-0">
                <div className="w-full h-full rounded-xl bg-white/15 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl sm:text-3xl">{(username || "A").charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{username}</h1>
                  <span className="px-3 py-1 bg-white/15 border border-white/20 text-white text-[10px] font-semibold uppercase tracking-[0.18em] rounded-full">
                    System Administrator
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} className={stats.reviewAverage !== null && i <= Math.round(stats.reviewAverage) ? "text-amber-300 fill-amber-300" : "text-white/30"} />
                    ))}
                    <span className="ml-1.5 text-xs font-medium text-white/85">
                      {stats.reviewAverage === null ? "No reviews yet" : `${stats.reviewAverage} / 5 · ${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stats.storeOpen ? "bg-emerald-300" : "bg-red-300"}`} />
                    <span className="text-xs font-medium text-white/85">{stats.storeOpen ? "Store open for orders" : "Store hidden (closed)"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue + actions */}
            <div className="flex flex-col items-start xl:items-center gap-1 xl:flex-1">
              <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.28em]">Total Paid Revenue</span>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight flex items-start">
                <span className="text-lg mt-1.5 mr-1 text-white/70">$</span>
                {loading ? "---" : stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => setActiveTab("orders")}
                  className="px-6 py-2.5 bg-white text-primary-800 text-[11px] font-bold uppercase tracking-[0.16em] rounded-full shadow-lg shadow-black/10 hover:bg-primary-50 hover:-translate-y-px transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  View Orders <ArrowUpRight size={15} />
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="px-6 py-2.5 bg-white/10 border border-white/30 text-white text-[11px] font-bold uppercase tracking-[0.16em] rounded-full hover:bg-white/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  Settings <Settings size={15} />
                </button>
              </div>
            </div>

            {/* Performance box */}
            <div className="border border-white/25 bg-white/[0.06] rounded-2xl px-6 py-5 xl:w-[300px] shrink-0">
              <div className="text-xl font-bold leading-snug">
                {stats.successRate}% success rate
              </div>
              <div className="text-xs text-white/75 mt-1">
                out of {stats.transactions} orders · {stats.paidCount} paid
              </div>
              <div className="h-px bg-white/15 my-4" />
              <div className="text-sm font-semibold">
                {stats.awaitingAction} sold order{stats.awaitingAction === 1 ? "" : "s"} in processing
              </div>
              <div className="text-xs text-white/75 mt-0.5">Verify payment, deliver or resolve a dispute</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 mt-8 relative z-20">
        {/* Module launcher — the reference desk's overview card grid:
            one card per work area, plain link lists inside. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          <ModuleCard
            icon={<ShoppingBag size={18} />}
            title="Orders & Sales"
            links={[
              { label: "Sold Orders", tab: "orders" },
              { label: "Payment Verification", tab: "payments" },
              { label: "Customers", tab: "customers" },
            ]}
            setActiveTab={setActiveTab}
          />
          <ModuleCard
            icon={<Package size={18} />}
            title="Listings"
            links={[
              { label: "Create New Offers", tab: "products" },
              { label: "Active Offers", tab: "active_offers" },
              { label: "Categories", tab: "categories" },
            ]}
            setActiveTab={setActiveTab}
          />
          <ModuleCard
            icon={<Settings size={18} />}
            title="Store Management"
            links={[
              { label: "Store Information", tab: "store_info" },
              { label: "Storefront", tab: "storefront" },
              { label: "General Config", tab: "settings" },
            ]}
            setActiveTab={setActiveTab}
          />
          <ModuleCard
            icon={<Star size={18} />}
            title="Support & Growth"
            links={[
              { label: "Messages", tab: "messages" },
              { label: "Feedback", tab: "feedback" },
              { label: "Coupons", tab: "coupons" },
            ]}
            setActiveTab={setActiveTab}
          />
        </div>
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard
            icon={<ShoppingBag size={22} className="text-primary-600" />}
            iconBg="bg-primary-50"
            label="Total Orders"
            value={stats.transactions}
            badge={`${stats.paidCount} paid`}
            badgeColor="bg-primary-50 text-primary-700"
            subText="All orders ever placed"
          />
          <MetricCard
            icon={<Zap size={22} className="text-amber-500" />}
            iconBg="bg-amber-50"
            label="Completion Rate"
            value={`${stats.successRate}%`}
            badge="Real"
            badgeColor="bg-emerald-50 text-emerald-600"
            subText="Completed ÷ non-canceled"
          />
          <MetricCard
            icon={<Clock size={22} className="text-blue-500" />}
            iconBg="bg-blue-50"
            label="Pending Action"
            value={stats.awaitingAction}
            badge="Priority"
            badgeColor="bg-blue-50 text-blue-600"
            subText="Verify / deliver / dispute"
          />
          <MetricCard
            icon={<Package size={22} className="text-purple-500" />}
            iconBg="bg-purple-50"
            label="Live Products"
            value={stats.registryDensity}
            badge={`${stats.inventoryAvailable} in stock pool`}
            badgeColor="bg-purple-50 text-purple-600"
            subText="Active offers"
          />
        </div>

        {/* Sales by day (Fix Round 6, video-gap #8) */}
        <div className="mb-10">
          <SalesByDayChart days={salesByDay} />
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Transaction Feed */}
          <div className="lg:col-span-8 panel overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Activity size={18} />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Recent Orders</h3>
              </div>
              <button 
                onClick={() => setActiveTab("orders")}
                className="text-[11px] font-semibold text-slate-500 hover:text-primary-700 flex items-center gap-1.5 transition-colors"
              >
                Audit All <ChevronRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-16 sm:p-24 text-center text-slate-500 font-medium text-sm">Loading orders…</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-16 sm:p-24 text-center text-slate-500 font-medium text-sm">No orders yet</div>
              ) : (
                recentOrders.map((order) => (
                  <TransactionItem 
                    key={order.id}
                    title={productTitles[order.product_id] || order.product_title || "Unknown Asset"}
                    buyer={order.customer_name || order.username || "Anonymous"}
                    price={`$${(Number(order.total_price) || 0).toFixed(2)}`}
                    status={order.status || "Pending"}
                    time={new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Needs attention — every count below is a live query result,
              not a status decoration. */}
          <div className="lg:col-span-4 space-y-8">
            <div className="panel p-6 sm:p-8">
              <div className="w-full flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight">Needs Attention</h3>
              </div>

              <div className="space-y-4">
                <StatusMetric icon={<Clock size={14} />} label="Awaiting action" value={String(stats.awaitingAction)} badge={stats.awaitingAction > 0 ? "Open orders" : "Clear"} badgeColor={stats.awaitingAction > 0 ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"} />
                <StatusMetric icon={<AlertCircle size={14} />} label="Open disputes" value={String(stats.openDisputes)} badge={stats.openDisputes > 0 ? "Action needed" : "None"} badgeColor={stats.openDisputes > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"} />
                <StatusMetric icon={<Package size={14} />} label="Low-stock products" value={String(stats.lowStock)} badge="≤ 3 left" badgeColor="bg-amber-50 text-amber-600" />
                <StatusMetric icon={<Package size={14} />} label="Inventory available" value={String(stats.inventoryAvailable)} badge="Units" badgeColor="bg-purple-50 text-purple-600" />
              </div>

              <button
                onClick={() => setActiveTab("store_info")}
                className="btn-primary mt-8 w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.16em]"
              >
                View Store Information
              </button>
            </div>

            {!stats.storeOpen && (
              <div className="panel p-6 flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-0.5">Store is hidden</h4>
                  <p className="text-xs font-medium text-slate-500">No new orders until you reopen it in Settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, iconBg, label, value, badge, badgeColor, subText }: any) {
  return (
    <div className="panel panel-hover p-6 group">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
          {badge}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] mb-1.5">{label}</div>
        <div className="text-[28px] leading-8 font-bold text-slate-900 tracking-tight mb-2">{value}</div>
        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            {subText}
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ title, buyer, price, status, time }: any) {
  return (
    <div className="px-5 sm:px-8 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-primary-200 group-hover:text-primary-600 transition-all">
          <ShoppingBag size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5 group-hover:text-primary-700 transition-colors">{title}</h4>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <User size={10} /> {buyer}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8 text-right">
        <div>
          <div className="text-sm font-bold text-slate-900 mb-0.5">{price}</div>
          <div className="text-[10px] font-medium text-slate-400">{time}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${
          status?.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          status?.toLowerCase() === 'canceled' ? 'bg-red-50 text-red-600 border-red-100' :
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {status}
        </div>
      </div>
    </div>
  );
}

function StatusMetric({ icon, label, value, badge, badgeColor }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-primary-100 transition-all">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-primary-600 transition-colors">
          {icon}
        </div>
        <span className="text-[13px] font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-bold text-slate-900 tracking-tight">{value}</span>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${badgeColor}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}


function ModuleCard({ icon, title, links, setActiveTab }: any) {
  return (
    <div className="panel panel-hover p-5">
      <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
      </div>
      <div className="flex flex-col">
        {links.map((l: any) => (
          <button
            key={l.tab}
            onClick={() => setActiveTab(l.tab)}
            className="flex items-center justify-between py-2 text-[13px] font-medium text-slate-600 hover:text-primary-700 transition-colors text-left group"
          >
            {l.label}
            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
