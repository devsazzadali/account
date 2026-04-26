import React, { useEffect, useState } from "react";
import {
  ShoppingBag, PlusCircle, CheckSquare, List,
  ClipboardList, Clock, CheckCircle2, XCircle,
  Tag, FolderOpen, PlusSquare,
  MessageSquare, Mail, MailOpen,
  Users, UserCheck, UserX,
  Settings, Lock, Bell, HelpCircle,
  ChevronRight, TrendingUp, Package, ShoppingCart, LayoutDashboard,
  Zap, AlertCircle, ShieldCheck, DollarSign, Star
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
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => { fetchStats(); }, []);

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
      const processing = orders.filter(o => o.status === "Paid" || o.status === "Awaiting Verification" || o.status === "Preparing").length;
      const balance = orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0);
      const rate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

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

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="font-sans bg-[#F6F6F7] min-h-screen">
      
      {/* ── Seller Dashboard Header ── */}
      <div className="bg-[#1A1A1A] text-white overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[600px] h-full bg-[#E62E04]/5 skew-x-[-20deg] translate-x-20" />
          <div className="absolute top-10 right-20 w-32 h-32 bg-[#E62E04]/20 rounded-full blur-[100px]" />

          <div className="max-w-[1400px] mx-auto px-8 py-12 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-8">
                  <div className="w-28 h-28 rounded-2xl border-4 border-[#E62E04]/30 overflow-hidden shadow-2xl bg-white/5 shrink-0 relative group">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=1a1a1a`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Settings size={24} className="text-white" />
                      </div>
                  </div>
                  <div>
                      <div className="flex items-center gap-4">
                          <h2 className="text-white text-3xl font-black tracking-tight uppercase">{username}</h2>
                          <div className="bg-[#E62E04] text-white text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded border border-white/10">Certified Merchant</div>
                      </div>
                      <div className="flex items-center gap-6 mt-4">
                          <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Platform Standing</span>
                              <div className="flex items-center gap-1 mt-1">
                                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= 5 ? "text-[#FFD700] fill-[#FFD700]" : "text-white/20"} />)}
                                  <span className="text-[12px] font-bold ml-2">5.00 / 5.00</span>
                              </div>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div className="flex flex-col">
                              <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Store Level</span>
                              <span className="text-[14px] font-black mt-1 text-[#26D374]">GOLDEN ELITE</span>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="flex flex-col items-center lg:items-end gap-2">
                  <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.3em]">Total Revenue Assets</span>
                  <div className="text-white text-6xl font-black tracking-tighter flex items-start gap-1">
                      <span className="text-2xl mt-2 text-[#E62E04]">$</span>
                      {loading ? "—" : fmt(stats.balance)}
                  </div>
                  <div className="flex gap-4 mt-6">
                      <button 
                        onClick={() => setActiveTab?.("orders")}
                        className="px-8 py-3 bg-[#E62E04] text-white text-[13px] font-black uppercase tracking-widest rounded transition-all shadow-xl shadow-red-500/20 hover:bg-[#c52804] active:scale-95"
                      >
                        Manage Ledger
                      </button>
                      <button 
                        onClick={() => setActiveTab?.("settings")}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white text-[13px] font-black uppercase tracking-widest rounded transition-all hover:bg-white hover:text-black"
                      >
                        Profile Nodes
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-8 space-y-8">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard 
                label="Active Sales Hub" 
                value={stats.totalOrders} 
                sub="Total transactions"
                icon={<ShoppingCart className="text-[#E62E04]" size={24} />}
              />
              <MetricCard 
                label="Success Protocol" 
                value={`${stats.successRate}%`} 
                sub="Resolution frequency"
                icon={<Zap className="text-[#26D374]" size={24} />}
              />
              <MetricCard 
                label="Fulfillment Queue" 
                value={stats.processingOrders} 
                sub="Awaiting verification"
                icon={<Clock className="text-[#FFA000]" size={24} />}
              />
              <MetricCard 
                label="Inventory Density" 
                value={stats.totalProducts} 
                sub="Digital asset count"
                icon={<Package className="text-[#00B0FF]" size={24} />}
              />
          </div>

          {/* Warning Banner */}
          <div className="bg-[#FFF9E6] border border-[#FDE6A6] rounded-lg p-5 flex items-start gap-4">
              <div className="bg-[#FF9800] rounded-full p-1 mt-0.5">
                  <AlertCircle size={16} className="text-white" />
              </div>
              <div className="space-y-1">
                  <p className="text-[14px] text-[#856404] font-bold">Important Security Protocol</p>
                  <p className="text-[13px] text-[#856404] font-medium leading-relaxed">
                      All sellers must strictly adhere to platform regulations. Violation points will result in immediate asset freeze. For details, view the <span className="text-blue-600 underline font-bold cursor-pointer">Merchant Service Agreement</span>.
                  </p>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity Ledger */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                          <History size={20} className="text-[#E62E04]" /> Activity Feed
                      </h3>
                      <button className="text-[12px] font-bold text-slate-400 hover:text-slate-900">View History</button>
                  </div>
                  <div className="p-0">
                      <div className="divide-y divide-slate-50">
                          {[1,2,3,4,5].map(i => (
                              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                  <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? "bg-[#26D374]" : "bg-[#E62E04]"}`} />
                                  <div className="flex-1">
                                      <p className="text-[13px] font-bold text-slate-800">Order #TXN_992{i} verified for clearance</p>
                                      <p className="text-[11px] text-slate-400 font-medium">Instance processed by Protocol Alpha</p>
                                  </div>
                                  <span className="text-[11px] font-bold text-slate-400">2{i}m ago</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Account Health */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                  <div className="px-6 py-5 border-b border-slate-100">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                          <ShieldCheck size={20} className="text-[#26D374]" /> Health Status
                      </h3>
                  </div>
                  <div className="p-8 space-y-8 text-center">
                      <div className="relative inline-flex items-center justify-center">
                          <svg className="w-32 h-32">
                              <circle className="text-slate-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                              <circle className="text-[#26D374]" strokeWidth="8" strokeDasharray={364.4} strokeDashoffset={364.4 * 0.05} strokeLinecap="round" stroke="currentColor" fill="transparent" r="58" cx="64" cy="64" />
                          </svg>
                          <div className="absolute flex flex-col">
                              <span className="text-3xl font-black text-slate-900 leading-none">95%</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Optimal</span>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <HealthItem label="Delivery Time" value="1.2h" status="FAST" />
                          <HealthItem label="Chat Response" value="4m" status="GOOD" />
                          <HealthItem label="Order Volume" value="High" status="PEAK" />
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-[#E62E04]/5 transition-colors">
                    {icon}
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <p className="text-2xl font-black text-slate-900">{value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{sub}</p>
                </div>
            </div>
        </div>
    );
}

function HealthItem({ label, value, status }: any) {
    return (
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[12px] font-bold text-slate-500">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-[13px] font-black text-slate-900">{value}</span>
                <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] text-[9px] font-black rounded uppercase tracking-widest">{status}</span>
            </div>
        </div>
    );
}

function History({ size, className }: any) {
    return <Clock size={size} className={className} />;
}
