import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  MessageSquare,
  Users,
  ChevronDown,
  BarChart3,
  Wallet
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
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "messages", icon: MessageSquare, label: "Messages" },
    { id: "orders", icon: ShoppingCart, label: "Orders" },
    { id: "products", icon: Package, label: "Products" },
    { id: "customers", icon: Users, label: "Users" },
    { id: "earnings", icon: Wallet, label: "Earnings" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#404145] flex flex-col font-sans selection:bg-[#1dbf73]/10 selection:text-[#1dbf73]">
      {/* Top Navigation - Fiverr Style */}
      <header className="h-[80px] bg-white border-b border-[#e4e5e7] px-8 flex justify-between items-center sticky top-0 z-[100]">
        <div className="flex items-center gap-12">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="text-2xl font-black text-[#404145] tracking-tight">
                    titan<span className="text-[#1dbf73]">.</span>
                </div>
            </div>
            
            <nav className="hidden lg:flex items-center gap-8">
                {menuItems.slice(0, 5).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`text-sm font-bold transition-all relative py-8 ${
                            activeTab === item.id 
                            ? "text-[#1dbf73]" 
                            : "text-[#62646a] hover:text-[#1dbf73]"
                        }`}
                    >
                        {item.label}
                        {activeTab === item.id && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1dbf73]"
                            />
                        )}
                    </button>
                ))}
            </nav>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 mr-4">
                <button className="p-2 text-[#62646a] hover:bg-[#f7f7f7] rounded-full transition-all relative">
                    <MessageSquare size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1dbf73] rounded-full border-2 border-white"></span>
                </button>
                <button className="p-2 text-[#62646a] hover:bg-[#f7f7f7] rounded-full transition-all relative">
                    <Bell size={20} />
                </button>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-[#e4e5e7]">
                <div className="text-right hidden sm:block">
                    <div className="text-[13px] font-bold text-[#404145]">{username}</div>
                    <div className="text-[11px] font-medium text-[#1dbf73]">Top Rated Seller</div>
                </div>
                <button className="w-10 h-10 rounded-full border-2 border-[#e4e5e7] p-0.5 hover:border-[#1dbf73] transition-all">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-8">
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation - iOS Floating Style */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 ios-glass border border-white/20 ios-rounded px-8 py-3 flex justify-between items-center z-[100] shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          {menuItems.slice(0, 4).map((item) => (
              <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 transition-all ${activeTab === item.id ? "text-[#1dbf73] scale-110" : "text-slate-400"}`}
              >
                  <item.icon size={20} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
              </button>
          ))}
      </div>
    </div>
  );
}
