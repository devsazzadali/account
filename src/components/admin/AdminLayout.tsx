import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  Users,
  Tag,
  Search,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard",  icon: LayoutDashboard, label: "Overview" },
  { id: "orders",     icon: ShoppingCart,    label: "Orders" },
  { id: "products",   icon: Package,         label: "Products" },
  { id: "categories", icon: Tag,             label: "Categories" },
  { id: "messages",   icon: MessageSquare,   label: "Messages" },
  { id: "customers",  icon: Users,           label: "Users" },
  { id: "settings",   icon: Settings,        label: "Settings" },
];

export function AdminLayout({ children, activeTab, setActiveTab }: AdminLayoutProps) {
  const username = localStorage.getItem("username") || "Admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s for header badge
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');
      
      if (!error) setUnreadCount(count || 0);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  }

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* ── Header: Logo + Search + User ── */}
      <header className="bg-white sticky top-0 z-[200] border-b border-slate-200 shadow-sm">

        {/* Row 1: Logo | Search | Icons */}
        <div className="flex items-center gap-4 px-4 md:px-8 py-3">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0 mr-2 group"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-black text-[16px] leading-none border border-primary-100 group-hover:bg-primary-100 transition-colors">
              <ShieldCheck size={18} className="text-primary-600" />
            </div>
            <span className="text-slate-900 font-bold text-[18px] tracking-tight hidden sm:block font-display">
              Admin <span className="text-slate-400 font-normal text-[13px]">Console</span>
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 flex items-stretch max-w-2xl ml-4">
            <div className="relative w-full flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, products, users..."
                className="w-full pl-10 pr-4 py-2 text-[13px] text-slate-900 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none rounded-xl transition-all"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-2">
            {/* Bell */}
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Messages */}
            <button
              className="relative text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-50"
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare size={20} />
            </button>

            {/* Avatar */}
            <div
              className="flex items-center gap-2 cursor-pointer pl-2 border-l border-slate-200 ml-1"
              onClick={() => setActiveTab("settings")}
            >
              <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shadow-sm">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=0f766e`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-slate-700 text-[13px] font-medium hidden md:block">{username}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 text-slate-400 hover:text-red-500 text-[12px] font-medium transition-colors pl-3 border-l border-slate-200 ml-1"
            >
              <LogOut size={16} />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-slate-500 hover:text-slate-800 p-1 ml-1"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Row 2: Nav Tabs */}
        <div className="bg-slate-50/50 border-t border-slate-100 overflow-x-auto hidden lg:block">
          <div className="flex items-center px-4 md:px-8">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] whitespace-nowrap border-b-2 transition-all ${
                  activeTab === item.id
                    ? "border-primary-600 text-primary-600 font-semibold bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800 font-medium hover:border-slate-300 hover:bg-white/50"
                }`}
              >
                <item.icon size={15} className={activeTab === item.id ? "text-primary-600" : "text-slate-400"} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-t border-slate-100 overflow-hidden lg:hidden shadow-lg"
            >
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-3.5 text-[14px] border-b border-slate-50 transition-all ${
                    activeTab === item.id
                      ? "text-primary-600 font-semibold bg-primary-50/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? "text-primary-600" : "text-slate-400"} />
                  {item.label}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-6 py-3.5 text-[14px] text-red-500 font-medium bg-red-50/30 border-b border-slate-50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex justify-around items-center py-2 z-[200] pb-safe">
        {menuItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 transition-all rounded-lg ${
              activeTab === item.id ? "text-primary-600 bg-primary-50" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? "text-primary-600" : "text-slate-400"} />
            <span className={`text-[10px] tracking-tight ${activeTab === item.id ? "font-bold" : "font-medium"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
