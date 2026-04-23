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
  ShieldCheck
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
    { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
    { id: "products", icon: Package, label: "Manage Accounts" },
    { id: "orders", icon: ShoppingCart, label: "Sales History" },
    { id: "settings", icon: Settings, label: "Configuration" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 280 }}
        className="bg-white backdrop-blur-xl border-r border-slate-200 flex flex-col z-50 relative shrink-0 transition-all duration-300 shadow-sm"
      >
        {/* Sidebar Header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
                <ShieldCheck className="text-white" size={20} />
            </div>
            {!isSidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-display font-bold text-lg tracking-tight whitespace-nowrap text-slate-900"
              >
                Titan<span className="text-primary-600">Control</span>
              </motion.span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-8 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-300 relative group ${
                activeTab === item.id 
                ? "bg-primary-50 text-primary-600 border border-primary-100 shadow-sm" 
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-primary-600" : "group-hover:text-slate-900 transition-colors"} />
              {!isSidebarCollapsed && (
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="font-bold text-xs uppercase tracking-widest"
                >
                  {item.label}
                </motion.span>
              )}
              {activeTab === item.id && !isSidebarCollapsed && (
                <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute right-2 w-1.5 h-1.5 bg-primary-600 rounded-full shadow-[0_0_10px_rgba(13,148,136,0.5)]"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
            >
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Minimize</span>}
            </button>
            <button 
                onClick={() => window.location.href = "/"}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group"
            >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                {!isSidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Exit Portal</span>}
            </button>
        </div>
      </motion.aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4 md:hidden">
              <button className="p-2 text-slate-600 hover:text-slate-900"><Menu size={24} /></button>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full group">
                  <input 
                    type="text" 
                    placeholder="Search accounts, orders, or logs..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                  />
                  <Search className="absolute left-4 top-3 text-slate-300 group-focus-within:text-primary-600 transition-colors" size={16} />
              </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all relative shadow-sm hover:shadow-md">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary-600 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900 leading-none mb-1">{username}</div>
                    <div className="text-[9px] text-primary-600 font-bold uppercase tracking-widest">Root Authority</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 p-[1px] border border-slate-200 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Admin" className="w-full h-full object-cover" />
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
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary-500/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}
