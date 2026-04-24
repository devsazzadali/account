import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  Bell,
  Search,
  User,
  MessageSquare,
  ShieldCheck,
  Users,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminLayout({ children, activeTab, setActiveTab }: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const username = localStorage.getItem("username") || "Admin";

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Home" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "products", icon: Package, label: "Products" },
    { id: "messages", icon: MessageSquare, label: "Signals" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-slate-900 flex font-sans selection:bg-primary-100 selection:text-primary-900">
      {/* Sidebar - Shopify Premium Inspired */}
      <aside 
        className={`bg-[#ebebed] border-r border-[#d2d2d7]/30 flex flex-col z-50 relative shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-[64px]' : 'w-[240px]'}`}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center px-4 mb-4 mt-2">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 shadow-lg group relative overflow-hidden">
                    <ShieldCheck className="text-white" size={16} />
                </div>
                {!isSidebarCollapsed && (
                    <span className="font-bold text-sm tracking-tight text-slate-900 uppercase">Titan Store</span>
                )}
            </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 relative group ${
                activeTab === item.id 
                ? "bg-white text-slate-900 shadow-sm border border-slate-200" 
                : "text-slate-600 hover:bg-[#e3e3e8]"
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? "text-primary-600" : "text-slate-500 group-hover:text-slate-900"} />
              {!isSidebarCollapsed && (
                <span className="font-semibold text-[13px]">{item.label}</span>
              )}
              {activeTab === item.id && (
                <motion.div 
                    layoutId="shopifyIndicator"
                    className="absolute left-0 w-1 h-5 bg-primary-600 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-200 space-y-1">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-[#e3e3e8] transition-all"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </div>
                {!isSidebarCollapsed && <span className="text-xs font-semibold">Collapse menu</span>}
            </button>
            <button 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    <LogOut size={16} />
                </div>
                {!isSidebarCollapsed && <span className="text-xs font-semibold">View store</span>}
            </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-[#ebebed] border-b border-[#d2d2d7]/30 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 flex-1">
              <div className="relative w-full max-w-xl group">
                  <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full bg-[#f1f1f1] border border-slate-300 rounded-lg pl-10 pr-4 py-1.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                  />
                  <Search className="absolute left-3 top-2 text-slate-400" size={16} />
                  <div className="absolute right-3 top-2 flex items-center gap-1 opacity-40">
                      <kbd className="text-[10px] font-sans border rounded px-1">Ctrl</kbd>
                      <kbd className="text-[10px] font-sans border rounded px-1">K</kbd>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-600 hover:bg-[#e3e3e8] rounded-lg transition-all relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[#ebebed]"></span>
            </button>
            
            <div className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-300">
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#e3e3e8] transition-all">
                    <div className="w-7 h-7 rounded-md bg-slate-900 p-[1px] shadow-sm overflow-hidden border border-slate-700">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Admin" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 hidden sm:block">{username}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-[1200px] mx-auto"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
