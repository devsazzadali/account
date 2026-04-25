import React, { useEffect, useState } from "react";
import {
  ShoppingBag, PlusCircle, CheckSquare, List,
  ClipboardList, Clock, CheckCircle2, XCircle,
  Tag, FolderOpen, PlusSquare,
  MessageSquare, Mail, MailOpen,
  Users, UserCheck, UserX,
  Settings, Lock, Bell, HelpCircle,
  ChevronRight, TrendingUp, Package, ShoppingCart, LayoutDashboard
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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
      const processing = orders.filter(o => o.status === "Paid" || o.status === "Awaiting Verification").length;
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
    <div className="font-sans bg-slate-50 min-h-screen">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 rounded-3xl shadow-xl border border-primary-800 mb-8 mt-2">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-3xl" />

        <div className="relative px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Avatar + info */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white/10 shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=0f766e`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-2xl font-display font-bold">{username}</h2>
                <div className="bg-primary-500/50 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-primary-400">Admin</div>
              </div>
              <div className="text-primary-100 text-[13px] mt-1.5 font-medium">
                Total Revenue: <span className="text-white font-bold">USD ${loading ? "—" : fmt(stats.balance)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[12px] text-primary-200 font-medium">
                Store Level: <span className="text-yellow-400 text-[10px]">⭐⭐⭐</span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-center md:text-right flex-1 flex flex-col items-center md:items-end">
            <div className="text-primary-200 text-[13px] font-medium uppercase tracking-widest">Lifetime Revenue</div>
            <div className="text-white text-5xl font-black mt-1 tracking-tight font-display drop-shadow-sm">
              <span className="text-primary-300 text-3xl">$</span>{loading ? "—" : fmt(stats.balance)}
            </div>
            <button
              onClick={() => setActiveTab?.("orders")}
              className="mt-4 px-6 py-2.5 bg-white text-primary-700 text-[13px] font-bold rounded-xl hover:bg-primary-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              Manage Orders
            </button>
          </div>

          {/* Stats box */}
          <div className="hidden lg:flex border border-white/10 rounded-2xl bg-white/10 backdrop-blur-md overflow-hidden min-w-[200px] shadow-2xl">
            <div className="flex-1 px-6 py-5 border-r border-white/10 flex flex-col items-center justify-center">
              <div className="text-white text-3xl font-black font-display">{loading ? "—" : stats.successRate}%</div>
              <div className="text-primary-200 text-[11px] mt-1 font-medium text-center leading-tight">Success Rate<br/>(out of {stats.totalOrders} Orders)</div>
            </div>
            <div className="flex-1 px-6 py-5 flex flex-col items-center justify-center">
              <div className="text-white text-3xl font-black font-display">{loading ? "—" : stats.processingOrders}</div>
              <div className="text-primary-200 text-[11px] mt-1 font-medium text-center leading-tight">Orders in<br/>Processing</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Links — Row 1 ── */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Products */}
      {/* ── Quick Links — Row 1 ── */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Products */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<Package size={18} className="text-primary-500" />} title="Products" />
          <div className="py-2">
            <NavLink icon={<List size={14}/>}       label="All Products"    onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<PlusCircle size={14}/>} label="Add New Product" onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<CheckSquare size={14}/>}label="Active Listings" onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<Tag size={14}/>}         label="Manage Categories" onClick={() => setActiveTab?.("categories")} />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<ShoppingCart size={18} className="text-amber-500" />} title="Orders" />
          <div className="py-2">
            <NavLink icon={<ClipboardList size={14}/>} label="All Orders"       onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<Clock size={14}/>}          label="Pending Orders"   onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<CheckCircle2 size={14}/>}   label="Delivered Orders" onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<XCircle size={14}/>}        label="Cancelled Orders" onClick={() => setActiveTab?.("orders")} />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<MessageSquare size={18} className="text-indigo-500" />} title="Messages" />
          <div className="py-2">
            <NavLink icon={<MessageSquare size={14}/>} label="All Messages"    onClick={() => setActiveTab?.("messages")} />
            <NavLink icon={<MailOpen size={14}/>}       label="Unread Messages" onClick={() => setActiveTab?.("messages")} />
            <NavLink icon={<Mail size={14}/>}           label="Sent Messages"   onClick={() => setActiveTab?.("messages")} />
          </div>
        </div>

        {/* Users */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<Users size={18} className="text-emerald-500" />} title="Users" />
          <div className="py-2">
            <NavLink icon={<Users size={14}/>}    label="All Customers"  onClick={() => setActiveTab?.("customers")} />
            <NavLink icon={<UserCheck size={14}/>} label="Active Users"   onClick={() => setActiveTab?.("customers")} />
            <NavLink icon={<UserX size={14}/>}     label="Banned / Flagged" onClick={() => setActiveTab?.("customers")} />
          </div>
        </div>
      </div>

      {/* ── Quick Links — Row 2 ── */}
      <div className="px-6 md:px-8 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Categories */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<Tag size={18} className="text-sky-500" />} title="Categories" />
          <div className="py-2">
            <NavLink icon={<FolderOpen size={14}/>} label="All Categories"    onClick={() => setActiveTab?.("categories")} />
            <NavLink icon={<PlusSquare size={14}/>}  label="Add New Category"  onClick={() => setActiveTab?.("categories")} />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<Settings size={18} className="text-slate-500" />} title="Settings" />
          <div className="py-2">
            <NavLink icon={<Settings size={14}/>}  label="General Settings" onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<Lock size={14}/>}       label="Security"         onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<Bell size={14}/>}       label="Notifications"    onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<HelpCircle size={14}/>} label="Help & Support"   onClick={() => setActiveTab?.("settings")} />
          </div>
        </div>

        {/* Analytics snapshot */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <SectionHeader icon={<LayoutDashboard size={18} className="text-rose-500" />} title="Quick Stats" />
          <div className="py-3 px-5 space-y-3">
            <StatRow label="Total Products" value={stats.totalProducts} color="text-primary-600" />
            <StatRow label="Total Orders"   value={stats.totalOrders}   color="text-amber-600" />
            <StatRow label="Completed"      value={stats.completedOrders} color="text-emerald-600" />
            <StatRow label="Processing"     value={stats.processingOrders} color="text-sky-600" />
            <StatRow label="Total Users"    value={stats.totalUsers}    color="text-indigo-600" />
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Bar ── */}
      <div className="mx-6 md:mx-8 mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-x divide-slate-100">
          <StatTile label="Total Orders"   value={stats.totalOrders}    color="text-primary-600" />
          <StatTile label="Completed"      value={stats.completedOrders} color="text-emerald-500" />
          <StatTile label="Processing"     value={stats.processingOrders} color="text-amber-500" />
          <StatTile label="Active Products" value={stats.totalProducts}  color="text-indigo-500" />
          <StatTile label="Registered Users" value={stats.totalUsers}   color="text-rose-500" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
      <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">{icon}</div>
      <span className="text-[15px] font-bold text-slate-800 font-display">{title}</span>
    </div>
  );
}

function NavLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-2.5 text-left text-[14px] text-slate-600 hover:bg-primary-50 hover:text-primary-700 transition-colors group"
    >
      <span className="text-slate-400 group-hover:text-primary-600 transition-colors">{icon}</span>
      <span className="font-medium">{label}</span>
      <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-primary-600 transition-colors" />
    </button>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-[13px] bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center px-2">
      <div className={`text-3xl font-black font-display ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-wider text-center">{label}</div>
    </div>
  );
}
