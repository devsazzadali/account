import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  MessageSquare, 
  CreditCard, 
  PlusCircle, 
  List, 
  Settings, 
  Clock, 
  CheckCircle, 
  Bell, 
  Ticket, 
  Activity, 
  User as UserIcon,
  HelpCircle,
  Loader2,
  Zap,
  ShieldCheck,
  Shield,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Phone,
  Gavel
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { UserOrders } from "../components/user/UserOrders";
import { UserSettings } from "../components/user/UserSettings";
import { UserMessages } from "../components/user/UserMessages";

export function UserDashboardPage() {
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username") || "User";
  const isAdmin = userRole === "admin";

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    assetValue: 0,
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    try {
        setLoading(true);
        // In a real app, we would filter by user_id or email
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, products(title, image)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders) {
            const totalValue = orders.reduce((acc, o) => acc + Number(o.total_price), 0);
            const active = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed').length;
            const completed = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;

            setStats({
                assetValue: totalValue,
                totalOrders: orders.length,
                activeOrders: active,
                completedOrders: completed
            });
            setRecentActivity(orders.slice(0, 3));
        }
    } catch (err: any) {
        console.error("Dashboard Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="container mx-auto px-4 max-w-7xl pt-12 relative z-10">
        
        {/* User Hero Section */}
        <div className="mb-12">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center gap-8 bg-white/50 backdrop-blur-md p-8 rounded-[3rem] border border-white shadow-xl shadow-slate-200/50"
            >
                <div className="relative group">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary-500 to-blue-500 p-[2px] shadow-2xl shadow-primary-500/10 group-hover:rotate-3 transition-transform duration-500">
                        <div className="w-full h-full rounded-[2.4rem] bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-600 border-4 border-white flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>

                <div className="text-center md:text-left flex-1">
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 mb-3">
                        <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900 italic">Hello, {username}</h1>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100`}>
                            Premium Member
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-lg mb-6 leading-relaxed">
                        Manage your acquisitions, track deliveries, and configure your identity in our high-tier digital marketplace.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asset Value</div>
                            <div className="text-2xl font-display font-bold text-slate-900">
                                {loading ? "---" : `$${stats.assetValue.toLocaleString()}`}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</div>
                            <div className="text-2xl font-display font-bold text-slate-900">{loading ? "---" : stats.totalOrders}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Protection Status</div>
                            <div className="text-2xl font-display font-bold text-primary-600 flex items-center gap-2">
                                <ShieldCheck size={24} />
                                Active
                            </div>
                        </div>
                    </div>
                </div>
                
                {isAdmin && (
                    <div className="flex flex-col gap-3">
                        <Link to="/admin" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all text-sm">
                            <Activity size={18} />
                            Admin Console
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>

        {/* Dashboard Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-10 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 w-fit mx-auto md:mx-0 shadow-sm">
            <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard size={18} />} label="Overview" />
            <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")} icon={<ShoppingBag size={18} />} label="My Orders" />
            <TabButton active={activeTab === "messages"} onClick={() => setActiveTab("messages")} icon={<MessageSquare size={18} />} label="Support Signals" />
            <TabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={18} />} label="Settings" />
            <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block"></div>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Section: Quick Actions */}
                        <div className="lg:col-span-1 space-y-6">
                            <DashboardSection title="Order Nexus" icon={<ShoppingBag className="text-primary-600" />}>
                                <DashboardTabLink onClick={() => setActiveTab("orders")} icon={<List size={18} />} label="All Digital Acquisitions" count={stats.totalOrders} />
                                <DashboardTabLink onClick={() => setActiveTab("orders")} icon={<Clock size={18} />} label="Awaiting Delivery" count={stats.activeOrders} highlight />
                                <DashboardTabLink onClick={() => setActiveTab("orders")} icon={<CheckCircle size={18} />} label="Verified Completions" count={stats.completedOrders} />
                            </DashboardSection>

                            <DashboardSection title="Command Support" icon={<Ticket className="text-blue-600" />}>
                                <DashboardTabLink onClick={() => setActiveTab("messages")} icon={<PlusCircle size={18} />} label="Initialize Support Signal" />
                                <DashboardTabLink onClick={() => setActiveTab("messages")} icon={<MessageSquare size={18} />} label="Signal History" highlight />
                                <DashboardTabLink onClick={() => setActiveTab("overview")} icon={<HelpCircle size={18} />} label="Platform Resource Hub" />
                            </DashboardSection>
                        </div>

                        {/* Recent Activity Mini-Tab */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm h-full">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                        <Activity size={20} className="text-primary-600" />
                                        Live Transmission Log
                                    </h3>
                                    <button 
                                        onClick={() => setActiveTab("orders")}
                                        className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-500"
                                    >
                                        View Full Ledger
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                            <Loader2 className="animate-spin mb-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Scanning Ledger...</span>
                                        </div>
                                    ) : recentActivity.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center">
                                            <ShoppingBag size={48} className="mb-4 mx-auto" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">No Transmissions Found</span>
                                        </div>
                                    ) : recentActivity.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary-100 transition-all group shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors overflow-hidden shadow-sm">
                                                    {item.products?.image ? (
                                                        <img src={item.products.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <ShoppingBag size={20} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{item.products?.title || 'Unknown Asset'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                        {new Date(item.created_at).toLocaleDateString()} • ID: {item.id.split('-')[0].toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">${Number(item.total_price).toFixed(2)}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${item.status === 'Paid' || item.status === 'Completed' || item.status === 'Delivered' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {item.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "orders" && <UserOrders />}
                {activeTab === "messages" && <UserMessages />}
                {activeTab === "settings" && <UserSettings />}
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}


// Helper Components

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active 
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
        >
            {icon}
            {label}
        </button>
    );
}

function DashboardSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white border-slate-200 border rounded-[2rem] overflow-hidden group hover:border-primary-200 transition-all shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
        <div className="p-2 bg-white rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100">
            {icon}
        </div>
        <span className="text-base font-bold text-slate-900 tracking-tight">{title}</span>
      </div>
      <div className="p-3">
        <ul className="flex flex-col gap-1">
          {children}
        </ul>
      </div>
    </div>
  );
}

function DashboardTabLink({ onClick, icon, label, count, highlight }: { onClick: () => void, icon: React.ReactNode, label: string, count?: number, highlight?: boolean }) {
    return (
      <li>
        <button onClick={onClick} className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group/link ${
          highlight ? "bg-primary-50 border border-primary-100" : "hover:bg-slate-50"
        }`}>
          <div className="flex items-center gap-4">
              <div className={`text-slate-400 group-hover/link:text-primary-600 transition-colors`}>
                  {icon}
              </div>
              <span className={`text-xs font-bold transition-colors ${highlight ? "text-primary-600" : "text-slate-600 group-hover/link:text-slate-900"}`}>
                  {label}
              </span>
          </div>
          {count !== undefined && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 group-hover/link:bg-primary-100 group-hover/link:text-primary-600 transition-all`}>
                  {count}
              </span>
          )}
        </button>
      </li>
    );
}

function DashboardLink({ to, icon, label, count, color, highlight }: { to: string, icon: React.ReactNode, label: string, count?: number, color?: string, highlight?: boolean }) {
  return (
    <li>
      <Link to={to} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 group/link ${
        highlight ? "bg-primary-50 border border-primary-100" : "hover:bg-slate-50"
      }`}>
        <div className="flex items-center gap-4">
            <div className={`text-slate-400 group-hover/link:text-primary-600 transition-colors ${color}`}>
                {icon}
            </div>
            <span className={`text-xs font-bold transition-colors ${highlight ? "text-primary-600" : "text-slate-600 group-hover/link:text-slate-900"}`}>
                {label}
            </span>
        </div>
        {count !== undefined && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 group-hover/link:bg-primary-100 group-hover/link:text-primary-600 transition-all`}>
                {count}
            </span>
        )}
      </Link>
    </li>
  );
}


function Crown({ size, className }: { size: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
        </svg>
    );
}
