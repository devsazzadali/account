import React, { useEffect, useState } from "react";
import {
  ShoppingBag, PlusCircle, CheckSquare, List,
  ClipboardList, Clock, CheckCircle2, XCircle,
  Tag, FolderOpen, PlusSquare,
  MessageSquare, Mail, MailOpen,
  Users, UserCheck, UserX,
  Settings, Lock, Bell, HelpCircle,
  ChevronRight, TrendingUp, Package, ShoppingCart, LayoutDashboard,
  Zap, AlertCircle, ShieldCheck, DollarSign, Star, History as HistoryIcon,
  ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion } from "framer-motion";

interface Props {
  setActiveTab?: (tab: string) => void;
}

export function AdminOverview({ setActiveTab }: Props) {
  const [stats, setStats] = useState({
    balance: 0,
    successRate: 0,
    totalOrders: 0,
    processingOrders: 0,
    totalProducts: 0,
    completedOrders: 0,
    totalUsers: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => { fetchStats(); fetchActivity(); }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      const [ordersRes, productsRes, usersRes] = await Promise.all([
        supabase.from("orders").select("id, total_price, status"),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const orders = ordersRes.data || [];
      const total = orders.length;
      const completed = orders.filter(o => o.status === "Delivered" || o.status === "Completed").length;
      const processing = orders.filter(o => o.status === "Paid" || o.status === "Awaiting Verification" || o.status === "Preparing" || o.status === "Delivering").length;
      const balance = orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setStats({
        balance,
        successRate: rate,
        totalOrders: total,
        processingOrders: processing,
        totalProducts: productsRes.count || 0,
        completedOrders: completed,
        totalUsers: usersRes.count || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActivity() {
      const { data } = await supabase.from('orders').select('*, products(title)').order('created_at', { ascending: false }).limit(5);
      setRecentActivity(data || []);
  }

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="font-sans bg-[#F8FAFC] min-h-screen">
      
      {/* ── Admin Dashboard Header (Emerald Theme) ── */}
      <div className="bg-[#0f172a] text-white overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[600px] h-full bg-[#1dbf73]/5 skew-x-[-20deg] translate-x-20" />
          <div className="absolute top-10 right-20 w-32 h-32 bg-[#1dbf73]/10 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-8 py-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-10">
                  <div className="w-24 h-24 rounded-2xl border-2 border-[#1dbf73]/30 overflow-hidden shadow-2xl bg-white/5 shrink-0 relative group">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=0f172a`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <div>
                      <div className="flex items-center gap-4">
                          <h2 className="text-white text-3xl font-black tracking-tighter italic uppercase">{username}</h2>
                          <div className="bg-[#1dbf73] text-white text-[10px] uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">System Administrator</div>
                      </div>
                      <div className="flex items-center gap-8 mt-6">
                          <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Platform Integrity</span>
                              <div className="flex items-center gap-1 mt-1.5">
                                  {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                                  <span className="text-[13px] font-black ml-2 tracking-widest text-white/80">99.9% SECURE</span>
                              </div>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Operational Hub</span>
                              <span className="text-[15px] font-black mt-1 text-[#1dbf73] tracking-wider uppercase italic">Emerald Console</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-3">
                  <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">Gross Platform Revenue</span>
                  <div className="text-white text-4xl font-black tracking-tighter flex items-start gap-1">
                      <span className="text-xl mt-1 text-[#1dbf73]">$</span>
                      {loading ? "—" : fmt(stats.balance)}
                  </div>
                  <div className="flex gap-4 mt-8">
                      <button 
                        onClick={() => setActiveTab?.("orders")}
                        className="px-10 py-4 bg-[#1dbf73] text-white text-[13px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/30 hover:bg-[#19a463] active:scale-95 flex items-center gap-3"
                      >
                        Order Ledger <ArrowUpRight size={18} />
                      </button>
                      <button 
                        onClick={() => setActiveTab?.("settings")}
                        className="px-10 py-4 bg-white/5 border border-white/10 text-white text-[13px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-white hover:text-black flex items-center gap-3"
                      >
                        Console Config <Settings size={18} />
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6 space-y-8">
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard label="Total Transactions" value={stats.totalOrders} sub="Marketplace volume" icon={<ShoppingCart className="text-[#1dbf73]" size={28} />} trend="REAL-TIME" isUp />
              <MetricCard label="System Success" value={`${stats.successRate}%`} sub="Fulfillment accuracy" icon={<Zap className="text-amber-500" size={28} />} trend="LIVE" isUp />
              <MetricCard label="Awaiting Action" value={stats.processingOrders} sub="Pending verification" icon={<Clock className="text-blue-500" size={28} />} trend="ACTIVE" isUp={false} />
              <MetricCard label="Registry Density" value={stats.totalProducts} sub="Active digital assets" icon={<Package className="text-purple-500" size={28} />} trend="UPDATED" isUp />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Real Activity Ledger */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                  <div className="px-10 py-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-4">
                          <Activity size={24} className="text-[#1dbf73]" /> Transaction Feed
                      </h3>
                      <button onClick={() => setActiveTab?.("orders")} className="text-[12px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1dbf73] transition-colors flex items-center gap-2">View All <ChevronRight size={16} /></button>
                  </div>
                  <div className="p-0">
                      <div className="divide-y divide-slate-100">
                          {recentActivity.length > 0 ? recentActivity.map((order, i) => (
                              <div key={order.id} className="px-10 py-6 flex items-center gap-6 hover:bg-slate-50 transition-all group">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${order.status === 'Completed' ? "bg-emerald-50 text-[#1dbf73]" : "bg-blue-50 text-blue-500"}`}>
                                      <ShoppingBag size={24} />
                                  </div>
                                  <div className="flex-1">
                                      <p className="text-[15px] font-black text-slate-800 tracking-tight">{order.products?.title}</p>
                                      <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Buyer: {order.username}</span>
                                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                                          <span className="text-[11px] text-[#1dbf73] font-black uppercase tracking-widest">${order.total_price} USD</span>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.status === 'Completed' ? "bg-emerald-50 text-[#1dbf73]" : "bg-amber-50 text-amber-600"}`}>{order.status}</span>
                                      <p className="text-[10px] text-slate-400 font-bold mt-1.5">{new Date(order.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                  </div>
                              </div>
                          )) : (
                              <div className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[12px]">No Recent Transmissions</div>
                          )}
                      </div>
                  </div>
              </div>

              {/* System Health */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden h-fit">
                  <div className="px-10 py-7 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-4">
                          <ShieldCheck size={24} className="text-[#1dbf73]" /> Console Status
                      </h3>
                  </div>
                  <div className="p-10 space-y-10 text-center">
                      <div className="relative inline-flex items-center justify-center group">
                          <div className="absolute inset-0 bg-[#1dbf73]/5 rounded-full scale-150 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                          <svg className="w-40 h-40">
                              <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                              <circle className="text-[#1dbf73]" strokeWidth="10" strokeDasharray={439.8} strokeDashoffset={439.8 * 0.05} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                          </svg>
                          <div className="absolute flex flex-col">
                              <span className="text-4xl font-black text-slate-900 leading-none">95%</span>
                              <span className="text-[10px] font-black text-[#1dbf73] uppercase tracking-widest mt-2">Optimal</span>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <HealthItem label="Network Latency" value="12ms" status="PEAK" />
                          <HealthItem label="Security Firewall" value="ACTIVE" status="SAFE" />
                          <HealthItem label="Transaction Flow" value="High" status="BUSY" />
                      </div>
                      <div className="pt-6">
                         <div className="p-5 bg-slate-900 rounded-[2rem] border border-white/5 text-left flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                 <AlertCircle size={24} />
                             </div>
                             <div>
                                 <p className="text-[11px] font-black text-white uppercase tracking-widest">Global Protocol</p>
                                 <p className="text-[10px] text-white/50 font-bold mt-0.5">Monitoring Active 24/7</p>
                             </div>
                         </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, trend, isUp }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-[#1dbf73]/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    {React.cloneElement(icon as React.ReactElement, { size: 24 })}
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{value}</p>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 ${isUp ? 'bg-emerald-50 text-[#1dbf73]' : 'bg-red-50 text-red-500'}`}>
                        {isUp ? <TrendingUp size={10} /> : <AlertCircle size={10} />} {trend}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>
                </div>
            </div>
        </div>
    );
}

function HealthItem({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:border-[#1dbf73]/30 transition-all">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-[14px] font-black text-slate-900">{value}</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    status === 'SAFE' || status === 'PEAK' ? 'bg-emerald-50 text-[#1dbf73] border border-emerald-100' : 'bg-blue-50 text-blue-500 border border-blue-100'
                }`}>{status}</span>
            </div>
        </div>
    );
}
