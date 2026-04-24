import React, { useEffect, useState } from "react";
import {
  ShoppingBag, PlusCircle, CheckSquare, List,
  ClipboardList, Clock, CheckCircle2, XCircle,
  Tag, FolderOpen, PlusSquare,
  MessageSquare, Mail, MailOpen,
  Users, UserCheck, UserX,
  Settings, Lock, Bell, HelpCircle,
  ChevronRight, TrendingUp, Package
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
    <div className="font-sans bg-[#f5f5f5] min-h-screen -m-6 md:-m-8">

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a3a6e 0%, #1976d2 55%, #42a5f5 100%)" }}
      >
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 right-10 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Avatar + info */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden shadow-xl bg-white/10 shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=1976d2`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white text-xl font-bold">{username}</h2>
                <span className="text-[#4fc3f7] text-lg">✦</span>
              </div>
              <div className="text-white/70 text-[12px] mt-1">
                Total Revenue: <span className="text-white font-bold">USD ${loading ? "—" : fmt(stats.balance)}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[12px] text-white/70">
                Admin Level: <span className="text-yellow-300">⭐⭐⭐</span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-center">
            <div className="text-white/70 text-[13px] font-medium">Lifetime Revenue</div>
            <div className="text-white text-4xl font-black mt-1">
              USD ${loading ? "—" : fmt(stats.balance)}
            </div>
            <button
              onClick={() => setActiveTab?.("orders")}
              className="mt-3 px-8 py-2 bg-[#ff6b00] text-white text-[12px] font-bold rounded-sm hover:bg-[#e55f00] transition-colors uppercase tracking-wide"
            >
              VIEW ALL ORDERS
            </button>
          </div>

          {/* Stats box */}
          <div className="border border-white/20 rounded bg-white/10 backdrop-blur-sm overflow-hidden min-w-[180px]">
            <div className="px-5 py-4 border-b border-white/20 text-center">
              <div className="text-white text-2xl font-black">{loading ? "—" : stats.successRate}%</div>
              <div className="text-white/70 text-[11px] mt-1">Success Rate out of {stats.totalOrders} Orders</div>
            </div>
            <div className="px-5 py-4 text-center">
              <div className="text-white text-3xl font-black">{loading ? "—" : stats.processingOrders}</div>
              <div className="text-white/70 text-[11px] mt-1">Orders in Processing</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Links — Row 1 ── */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Products */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="📦" title="Products" color="#1976d2" />
          <div className="py-1">
            <NavLink icon={<List size={14}/>}       label="All Products"    onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<PlusCircle size={14}/>} label="Add New Product" onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<CheckSquare size={14}/>}label="Active Listings" onClick={() => setActiveTab?.("products")} />
            <NavLink icon={<Tag size={14}/>}         label="Manage Categories" onClick={() => setActiveTab?.("categories")} />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="🛒" title="Orders" color="#ff6b00" />
          <div className="py-1">
            <NavLink icon={<ClipboardList size={14}/>} label="All Orders"       onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<Clock size={14}/>}          label="Pending Orders"   onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<CheckCircle2 size={14}/>}   label="Delivered Orders" onClick={() => setActiveTab?.("orders")} />
            <NavLink icon={<XCircle size={14}/>}        label="Cancelled Orders" onClick={() => setActiveTab?.("orders")} />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="💬" title="Messages" color="#7b1fa2" />
          <div className="py-1">
            <NavLink icon={<MessageSquare size={14}/>} label="All Messages"    onClick={() => setActiveTab?.("messages")} />
            <NavLink icon={<MailOpen size={14}/>}       label="Unread Messages" onClick={() => setActiveTab?.("messages")} />
            <NavLink icon={<Mail size={14}/>}           label="Sent Messages"   onClick={() => setActiveTab?.("messages")} />
          </div>
        </div>

        {/* Users */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="👥" title="Users" color="#388e3c" />
          <div className="py-1">
            <NavLink icon={<Users size={14}/>}    label="All Customers"  onClick={() => setActiveTab?.("customers")} />
            <NavLink icon={<UserCheck size={14}/>} label="Active Users"   onClick={() => setActiveTab?.("customers")} />
            <NavLink icon={<UserX size={14}/>}     label="Banned / Flagged" onClick={() => setActiveTab?.("customers")} />
          </div>
        </div>
      </div>

      {/* ── Quick Links — Row 2 ── */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Categories */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="🗂️" title="Categories" color="#0288d1" />
          <div className="py-1">
            <NavLink icon={<FolderOpen size={14}/>} label="All Categories"    onClick={() => setActiveTab?.("categories")} />
            <NavLink icon={<PlusSquare size={14}/>}  label="Add New Category"  onClick={() => setActiveTab?.("categories")} />
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="⚙️" title="Settings" color="#555" />
          <div className="py-1">
            <NavLink icon={<Settings size={14}/>}  label="General Settings" onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<Lock size={14}/>}       label="Security"         onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<Bell size={14}/>}       label="Notifications"    onClick={() => setActiveTab?.("settings")} />
            <NavLink icon={<HelpCircle size={14}/>} label="Help & Support"   onClick={() => setActiveTab?.("settings")} />
          </div>
        </div>

        {/* Analytics snapshot */}
        <div className="bg-white border border-[#e0e0e0] rounded shadow-sm">
          <SectionHeader icon="📊" title="Quick Stats" color="#e91e63" />
          <div className="py-2 px-4 space-y-3">
            <StatRow label="Total Products" value={stats.totalProducts} color="#1976d2" />
            <StatRow label="Total Orders"   value={stats.totalOrders}   color="#ff6b00" />
            <StatRow label="Completed"      value={stats.completedOrders} color="#388e3c" />
            <StatRow label="Processing"     value={stats.processingOrders} color="#f57c00" />
            <StatRow label="Total Users"    value={stats.totalUsers}    color="#7b1fa2" />
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Bar ── */}
      <div className="mx-6 mb-6 bg-white border border-[#e0e0e0] rounded shadow-sm p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center divide-x divide-[#f0f0f0]">
          <StatTile label="Total Orders"   value={stats.totalOrders}    color="#1976d2" />
          <StatTile label="Completed"      value={stats.completedOrders} color="#388e3c" />
          <StatTile label="Processing"     value={stats.processingOrders} color="#ff6b00" />
          <StatTile label="Active Products" value={stats.totalProducts}  color="#7b1fa2" />
          <StatTile label="Registered Users" value={stats.totalUsers}   color="#e91e63" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, color }: { icon: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f0f0f0]">
      <span className="text-[18px]">{icon}</span>
      <span className="text-[14px] font-bold" style={{ color }}>{title}</span>
    </div>
  );
}

function NavLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#555] hover:bg-[#f5f5f5] hover:text-[#1976d2] transition-colors group"
    >
      <span className="text-[#bbb] group-hover:text-[#1976d2] transition-colors">{icon}</span>
      {label}
      <ChevronRight size={12} className="ml-auto text-[#ddd] group-hover:text-[#1976d2] transition-colors" />
    </button>
  );
}

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[#777]">{label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center px-2">
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[#999] font-medium mt-1 uppercase tracking-wide text-center">{label}</div>
    </div>
  );
}
