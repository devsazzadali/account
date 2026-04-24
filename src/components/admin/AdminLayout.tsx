import React, { useState } from "react";
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

  function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333] flex flex-col font-sans">

      {/* ── Header: Logo + Search + User ── */}
      <header className="bg-[#1a3a6e] sticky top-0 z-[200]">

        {/* Row 1: Logo | Search | Icons */}
        <div className="flex items-center gap-4 px-4 md:px-8 py-3">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0 mr-2"
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="w-8 h-8 bg-[#e4393c] rounded flex items-center justify-center text-white font-black text-[16px] leading-none">
              Z
            </div>
            <span className="text-white font-black text-[18px] tracking-tight hidden sm:block">
              2U <span className="text-white/50 font-normal text-[13px]">Admin</span>
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 flex items-stretch max-w-2xl">
            <input
              type="text"
              placeholder="Search for games, top-ups, items, game service and more"
              className="flex-1 px-4 py-2 text-[13px] text-[#333] focus:outline-none rounded-l border-none"
            />
            <button className="px-5 bg-[#e4393c] hover:bg-[#c0292b] text-white transition-colors rounded-r flex items-center gap-1.5 text-[13px] font-medium">
              <Search size={15} />
            </button>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-2">
            {/* Bell */}
            <button className="relative text-white/70 hover:text-white transition-colors p-1">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#e4393c] rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-[#1a3a6e]">
                3
              </span>
            </button>

            {/* Messages */}
            <button
              className="relative text-white/70 hover:text-white transition-colors p-1"
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare size={20} />
            </button>

            {/* Avatar */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveTab("settings")}
            >
              <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=1976d2`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-[13px] font-bold hidden md:block">{username}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 text-white/50 hover:text-white text-[12px] font-medium transition-colors border-l border-white/10 pl-3"
            >
              <LogOut size={14} />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden text-white/70 hover:text-white p-1"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Row 2: Nav Tabs */}
        <div className="bg-[#15305c] border-t border-white/10 overflow-x-auto hidden lg:block">
          <div className="flex items-center px-4 md:px-8">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-[13px] whitespace-nowrap border-b-2 transition-all ${
                  activeTab === item.id
                    ? "border-[#e4393c] text-white font-bold"
                    : "border-transparent text-white/55 hover:text-white font-medium hover:border-white/20"
                }`}
              >
                <item.icon size={13} />
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
              className="bg-[#15305c] border-t border-white/10 overflow-hidden lg:hidden"
            >
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-6 py-3 text-[14px] border-b border-white/5 transition-all ${
                    activeTab === item.id
                      ? "text-white font-bold bg-white/5"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1a3a6e] border-t border-white/10 flex justify-around items-center py-2 z-[200]">
        {menuItems.slice(0, 5).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
              activeTab === item.id ? "text-[#e4393c]" : "text-white/45 hover:text-white"
            }`}
          >
            <item.icon size={19} />
            <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
