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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Palette,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminLayout({ children, activeTab, setActiveTab }: AdminLayoutProps) {
  const username = localStorage.getItem("username") || "Admin";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
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
    supabase.auth.signOut().then(() => {
      localStorage.clear();
      navigate("/login");
    });
  }

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-slate-900 flex font-sans selection:bg-red-100 selection:text-red-900">
      
      {/* ── Sidebar - Seller Center Red Theme ── */}
      <aside 
        className={`bg-white border-r border-slate-200 flex flex-col z-[500] relative shrink-0 transition-all duration-300 shadow-xl shadow-slate-200/50 ${isSidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}`}
      >
        {/* Sidebar Header - Seller Center Red */}
        <div className="h-16 flex items-center px-4 bg-[#E62E04] text-white shrink-0 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-white/10 rounded-xl border border-white/20">
                    <ShieldCheck className="text-white" size={24} />
                </div>
                {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className="font-black text-[15px] tracking-tight whitespace-nowrap uppercase leading-none">Seller Center</span>
                        <span className="text-[10px] font-bold text-white/60 tracking-widest mt-1">OPERATIONAL NODE</span>
                    </div>
                )}
            </div>
        </div>

        {/* User Quick Info */}
        {!isSidebarCollapsed && (
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" />
                </div>
                <div className="min-w-0">
                    <div className="text-[13px] font-black text-slate-900 truncate uppercase">{username}</div>
                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Certified Seller
                    </div>
                </div>
            </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <MenuItem 
            id="dashboard" 
            label="Home" 
            icon={<LayoutDashboard size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="orders" 
            label="Sold Orders" 
            icon={<ShoppingCart size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            badge="2"
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="products" 
            label="Create New Offers" 
            icon={<Plus size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="active_offers" 
            label="Active Offers" 
            icon={<Package size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />
          
          <div className="pt-6 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${isSidebarCollapsed ? 'hidden' : 'block'}`} />
          </div>

          <CollapsibleMenu 
            label="Store Management" 
            icon={<Settings size={20} />} 
            collapsed={isSidebarCollapsed}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            items={[
                { id: "categories", label: "Categories" },
                { id: "settings", label: "General Config" },
                { id: "performance", label: "Performance Hub" },
                { id: "store_customize", label: "Store Customizer" }
            ]}
          />
          
          <div className="pt-6 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${isSidebarCollapsed ? 'hidden' : 'block'}`} />
          </div>

          <MenuItem 
            id="messages" 
            label="Messages" 
            icon={<MessageSquare size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            badge={unreadCount > 0 ? String(unreadCount) : undefined}
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="customers" 
            label="Seller Information" 
            icon={<Users size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="violation" 
            label="Violation Center" 
            icon={<AlertCircle size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />
          <MenuItem 
            id="store_customize" 
            label="Store Customizer" 
            icon={<Palette size={20} />} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            collapsed={isSidebarCollapsed}
          />

          <div className="pt-4 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${isSidebarCollapsed ? 'hidden' : 'block'}`} />
          </div>

          <a 
            href="/" 
            target="_blank"
            className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all group`}
          >
            <div className="shrink-0 group-hover:scale-110 transition-transform"><Store size={20} /></div>
            {!isSidebarCollapsed && (
                <span className="font-black text-[13px] uppercase tracking-wide whitespace-nowrap">Visit Store</span>
            )}
            {!isSidebarCollapsed && <ExternalLink size={14} className="ml-auto opacity-40" />}
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/30">
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all group"
            >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </div>
                {!isSidebarCollapsed && <span className="text-[12px] font-black uppercase tracking-widest group-hover:text-slate-900 transition-colors">Collapse menu</span>}
            </button>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-[#E62E04] transition-all group"
            >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <LogOut size={18} />
                </div>
                {!isSidebarCollapsed && <span className="text-[12px] font-black uppercase tracking-widest">Terminate Session</span>}
            </button>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-6 flex-1">
              <div className="relative w-full max-w-xl group">
                  <input 
                    type="text" 
                    placeholder="Scan ledgers by ID, product name, or seller hash..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50 transition-all"
                  />
                  <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-[#E62E04] transition-colors" size={18} />
                  <div className="absolute right-3 top-2.5 flex items-center gap-1 opacity-20 group-focus-within:opacity-40 transition-opacity">
                      <kbd className="text-[10px] font-sans border border-slate-400 rounded px-1.5 py-0.5">Ctrl</kbd>
                      <kbd className="text-[10px] font-sans border border-slate-400 rounded px-1.5 py-0.5">K</kbd>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-6 ml-6">
              {/* Exit to Site */}
              <button 
                  onClick={() => navigate("/")}
                  className="flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-slate-900 tracking-wide mr-2 transition-colors"
              >
                  <ChevronLeft size={16} /> EXIT TO SITE
              </button>

              {/* Messages Icon */}
              <button 
                onClick={() => setActiveTab("messages")}
                className="relative text-[#14b8a6] hover:text-teal-600 transition-colors flex items-center justify-center"
              >
                  <MessageSquare size={20} />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#14b8a6] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 0 ? unreadCount : 1}
                  </span>
              </button>

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-200 transition-all ml-2" onClick={() => setActiveTab("settings")}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function MenuItem({ id, label, icon, activeTab, setActiveTab, badge, collapsed }: any) {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                isActive 
                ? "bg-red-50 text-[#E62E04] shadow-sm shadow-red-500/5" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
        >
            <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {icon}
            </div>
            {!collapsed && (
                <span className={`font-black text-[13px] uppercase tracking-wide whitespace-nowrap transition-all ${isActive ? 'translate-x-1' : ''}`}>
                    {label}
                </span>
            )}
            {badge && !collapsed && (
                <span className="ml-auto px-2 py-0.5 bg-[#E62E04] text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/30">
                    {badge}
                </span>
            )}
            {isActive && !collapsed && (
                <motion.div 
                    layoutId="activePill"
                    className="absolute left-0 w-1.5 h-6 bg-[#E62E04] rounded-r-full"
                />
            )}
        </button>
    );
}

function CollapsibleMenu({ label, icon, collapsed, activeTab, setActiveTab, items }: any) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group`}
            >
                <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
                {!collapsed && (
                    <>
                        <span className="font-black text-[13px] uppercase tracking-wide whitespace-nowrap flex-1 text-left">{label}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>
            {!collapsed && isOpen && (
                <div className="pl-12 pr-4 space-y-1 py-1">
                    {items.map((item: any) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left py-2 text-[12px] font-bold transition-all tracking-wide uppercase ${
                                activeTab === item.id ? 'text-[#E62E04]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
