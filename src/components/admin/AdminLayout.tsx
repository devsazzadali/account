import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Menu,
  Bell,
  Search,
  User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "products", icon: Package, label: "Products" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "customers", icon: Users, label: "Customers" },
    { id: "transactions", icon: CreditCard, label: "Transactions" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white flex overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="bg-dark-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 relative shrink-0 transition-all duration-300"
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
                <span className="font-display font-bold text-xl">A</span>
            </div>
            {!isSidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display font-bold text-lg tracking-tight whitespace-nowrap"
              >
                Gravity<span className="text-primary-400">Admin</span>
              </motion.span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-300 relative group ${
                activeTab === item.id 
                ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                : "text-dark-50/40 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-primary-400" : "group-hover:text-white transition-colors"} />
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-semibold text-sm tracking-wide"
                >
                  {item.label}
                </motion.span>
              )}
              {activeTab === item.id && !isSidebarCollapsed && (
                <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute right-2 w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-dark-50/40 hover:text-white hover:bg-white/5 transition-all"
            >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                {!isSidebarCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Collapse Menu</span>}
            </button>
            <button className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-dark-50/40 hover:text-red-400 hover:bg-red-500/5 transition-all group">
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                {!isSidebarCollapsed && <span className="text-xs font-bold uppercase tracking-widest">Logout</span>}
            </button>
        </div>
      </motion.aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-dark-950/50 backdrop-blur-md border-b border-white/5 px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4 md:hidden">
              <button className="p-2 text-dark-50 hover:text-white"><Menu size={24} /></button>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full group">
                  <input 
                    type="text" 
                    placeholder="Search global records..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                  />
                  <Search className="absolute left-4 top-3 text-dark-50/20 group-focus-within:text-primary-400 transition-colors" size={18} />
              </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-dark-50/40 hover:text-white transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-dark-950"></span>
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{username}</div>
                    <div className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">Admin Access</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-blue-500 p-[1px]">
                    <div className="w-full h-full rounded-[11px] bg-dark-900 flex items-center justify-center overflow-hidden border border-white/10">
                        <User className="text-white/40" size={20} />
                    </div>
                </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-7xl mx-auto"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-600/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}
