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
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

interface AdminOverviewProps {
  setActiveTab: (tab: string) => void;
}

export function AdminOverview({ setActiveTab }: AdminOverviewProps) {
  const [stats, setStats] = useState({
    revenue: 0,
    transactions: 0,
    successRate: 0,
    awaitingAction: 0,
    registryDensity: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "ACCCOUNTSTOREONE";

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersRes, productsRes, recentRes] = await Promise.all([
        supabase.from("orders").select("total_amount, status"),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5)
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status?.toLowerCase() === 'completed').length;
      const awaitingAction = orders.filter(o => ['pending', 'preparing', 'waiting'].includes(o.status?.toLowerCase())).length;
      const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;

      setStats({
        revenue: totalRevenue,
        transactions: totalOrders,
        successRate: successRate,
        awaitingAction: awaitingAction,
        registryDensity: productsRes.count || 0
      });

      setRecentOrders(recentRes.data || []);
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
      {/* Hero Header Section */}
      <div className="bg-[#0A0F1C] text-white pt-8 px-8 pb-20 lg:pt-12 lg:px-12 lg:pb-28 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-[#E62E04]/5 blur-[120px] -mr-40" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E62E04]/5 blur-[100px] -ml-20 -mb-20" />

        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Profile Image Container */}
            <div className="w-20 h-20 rounded-[1.8rem] border-4 border-[#E62E04]/20 p-1.5 shadow-2xl bg-[#111827]">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden bg-white/5 flex items-center justify-center border border-white/10">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=0A0F1C`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="text-center lg:text-left">
              <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic text-white">{username}</h1>
                <div className="px-4 py-1.5 bg-[#E62E04] text-white text-[9px] font-black uppercase tracking-[0.25em] rounded-xl shadow-xl shadow-red-500/30">
                  System Administrator
                </div>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5">Platform Integrity</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                    ))}
                    <span className="ml-2 text-[12px] font-black text-white uppercase tracking-tighter">99.9% SECURE</span>
                  </div>
                </div>

                <div className="w-[1px] h-8 bg-white/10 hidden lg:block" />

                <div className="flex flex-col">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mb-1.5">Operational Hub</span>
                  <div className="flex items-center gap-2.5">
                    <Activity size={16} className="text-[#E62E04]" />
                    <span className="text-[14px] font-black text-[#E62E04] uppercase italic tracking-widest">Red Console v2.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-1">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Global Platform Revenue</span>
            <div className="text-5xl lg:text-6xl font-black tracking-tighter text-white flex items-start">
              <span className="text-xl mt-2 mr-1 text-[#E62E04]">$</span>
              {loading ? "---" : stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setActiveTab("orders")}
                className="px-8 py-3.5 bg-[#E62E04] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-2xl shadow-red-500/40 hover:bg-red-700 transition-all flex items-center gap-3 active:scale-95"
              >
                Order Ledger <ArrowUpRight size={16} />
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className="px-8 py-3.5 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white hover:text-[#0A0F1C] transition-all flex items-center gap-3 active:scale-95"
              >
                Config <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-8 lg:px-10 -mt-12 relative z-20">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard 
            icon={<ShoppingBag size={22} className="text-[#E62E04]" />}
            iconBg="bg-red-50"
            label="Transactions"
            value={stats.transactions}
            badge="Live Feed"
            badgeColor="bg-red-50 text-[#E62E04]"
            subText="Registry Volume"
          />
          <MetricCard 
            icon={<Zap size={22} className="text-amber-500" />}
            iconBg="bg-amber-50"
            label="Sync Accuracy"
            value={`${stats.successRate}%`}
            badge="Stable"
            badgeColor="bg-emerald-50 text-emerald-600"
            subText="Protocol Success"
          />
          <MetricCard 
            icon={<Clock size={22} className="text-blue-500" />}
            iconBg="bg-blue-50"
            label="Pending Action"
            value={stats.awaitingAction}
            badge="Priority"
            badgeColor="bg-blue-50 text-blue-600"
            subText="Awaiting Verify"
          />
          <MetricCard 
            icon={<Package size={22} className="text-purple-500" />}
            iconBg="bg-purple-50"
            label="Registry Size"
            value={stats.registryDensity}
            badge="Updated"
            badgeColor="bg-purple-50 text-purple-600"
            subText="Active Assets"
          />
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Transaction Feed */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Activity size={18} />
                </div>
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest italic">Live Activity Ledger</h3>
              </div>
              <button 
                onClick={() => setActiveTab("orders")}
                className="text-[9px] font-black text-slate-400 hover:text-[#E62E04] uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
              >
                Audit All <ChevronRight size={12} />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">Syncing with registry...</div>
              ) : recentOrders.length === 0 ? (
                <div className="p-24 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No active telemetry detected</div>
              ) : (
                recentOrders.map((order) => (
                  <TransactionItem 
                    key={order.id}
                    title={order.product_title || "Unknown Asset"}
                    buyer={order.customer_name || order.username || "Anonymous"}
                    price={`$${(Number(order.total_amount) || 0).toFixed(2)}`}
                    status={order.status || "Pending"}
                    time={new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              )}
            </div>
          </div>

          {/* Console Status */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-8">
              <div className="w-full flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest italic">System Integrity</h3>
              </div>

              {/* Indicator */}
              <div className="relative w-48 h-48 flex items-center justify-center mx-auto mb-10">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="86" fill="none" stroke="#F1F5F9" strokeWidth="12" />
                  <circle 
                    cx="96" cy="96" r="86" 
                    fill="none" 
                    stroke="#E62E04" 
                    strokeWidth="12" 
                    strokeDasharray={540}
                    strokeDashoffset={540 - (540 * 0.95)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">95%</span>
                  <span className="text-[10px] font-black text-[#E62E04] uppercase tracking-[0.3em] mt-1.5">Optimal</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                <StatusMetric icon={<Wifi size={14} />} label="Latency" value="12ms" badge="Fast" badgeColor="bg-emerald-50 text-emerald-600" />
                <StatusMetric icon={<Lock size={14} />} label="Security" value="Shielded" badge="Active" badgeColor="bg-red-50 text-[#E62E04]" />
                <StatusMetric icon={<ArrowRightLeft size={14} />} label="Traffic" value="Stable" badge="Medium" badgeColor="bg-blue-50 text-blue-600" />
              </div>
            </div>

            <div className="bg-[#0A0F1C] rounded-[2rem] p-6 border border-white/5 shadow-2xl shadow-slate-900/30 flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-all">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-white uppercase tracking-[0.2em] mb-0.5">Global Firewall</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight">Active 24/7 Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, iconBg, label, value, badge, badgeColor, subText }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_50px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 group">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${badgeColor}`}>
          {badge}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</div>
        <div className="text-3xl font-black text-slate-900 tracking-tighter mb-3">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2 italic">
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            {subText}
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ title, buyer, price, status, time }: any) {
  return (
    <div className="px-8 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-[#E62E04]/30 group-hover:text-[#E62E04] transition-all">
          <ShoppingBag size={18} />
        </div>
        <div>
          <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-tight mb-0.5 group-hover:text-[#E62E04] transition-colors">{title}</h4>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <User size={10} /> {buyer}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8 text-right">
        <div>
          <div className="text-[13px] font-black text-slate-900 mb-0.5">{price}</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{time}</div>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
          status?.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          status?.toLowerCase() === 'canceled' ? 'bg-red-50 text-[#E62E04] border-red-100' :
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
    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-[#E62E04]/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="text-slate-400 group-hover:text-[#E62E04] transition-colors">
          {icon}
        </div>
        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[12px] font-black text-slate-900 tracking-tight">{value}</span>
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${badgeColor}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}
