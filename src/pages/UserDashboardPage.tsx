import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  MessageSquare, 
  CreditCard, 
  Heart, 
  Store, 
  PlusCircle, 
  List, 
  Settings, 
  Megaphone, 
  DollarSign, 
  Info, 
  AlertTriangle, 
  Phone, 
  Gavel, 
  FileText, 
  Clock, 
  CheckCircle, 
  Bell, 
  Mail, 
  FileOutput, 
  Ticket, 
  Share2, 
  Users,
  ChevronRight,
  ShieldCheck,
  Shield,
  Zap,
  ArrowRight,
  Activity,
  User as UserIcon,
  HelpCircle,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";

export function UserDashboardPage() {
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username") || "User";
  const isAdmin = userRole === "admin";

  const [loading, setLoading] = useState(true);
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
        // In a real app, we would filter by user_id
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Hero Header */}
      <div className="relative pt-12 pb-24 border-b border-slate-200 overflow-hidden bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center gap-8"
            >
                <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary-500 to-blue-500 p-[2px] shadow-2xl shadow-primary-500/10 group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-[1.9rem] bg-white flex items-center justify-center overflow-hidden border border-slate-100">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary-600 border-4 border-slate-50 flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>

                <div className="text-center md:text-left flex-1">
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-4 mb-3">
                        <h1 className="text-4xl font-display font-bold tracking-tight text-slate-900 italic">Hello, {username}</h1>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            isAdmin ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-blue-50 text-blue-600 border-blue-100"
                        }`}>
                            {isAdmin ? "Titan Elite" : "Premium Member"}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-lg mb-6 leading-relaxed">
                        Welcome to your personalized portal. Monitor your acquisitions, track deliveries, and manage your high-tier digital assets with absolute security.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-12">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asset Value</div>
                            <div className="text-2xl font-display font-bold text-slate-900">
                                {loading ? "---" : `$${stats.assetValue.toLocaleString()}`}
                                <span className="text-sm text-slate-400">.00</span>
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
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link to="/admin" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all">
                            <Activity size={20} />
                            Admin Console
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 max-w-7xl -mt-12 relative z-20">
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {/* Section: Orders */}
          <DashboardSection title="Order Nexus" icon={<ShoppingBag className="text-primary-600" />}>
            <DashboardLink to="/dashboard" icon={<List size={18} />} label="All Digital Acquisitions" count={stats.totalOrders} />
            <DashboardLink to="/dashboard" icon={<Clock size={18} />} label="Awaiting Delivery" count={stats.activeOrders} highlight />
            <DashboardLink to="/dashboard" icon={<CheckCircle size={18} />} label="Verified Completions" count={stats.completedOrders} />
            <DashboardLink to="/admin" icon={<Gavel size={18} />} label="Dispute Center" color="hover:text-red-500" />
          </DashboardSection>

          {/* Section: Support */}
          <DashboardSection title="Command Support" icon={<Ticket className="text-blue-600" />}>
            <DashboardLink to="/admin" icon={<PlusCircle size={18} />} label="Initialize Support Ticket" />
            <DashboardLink to="/admin" icon={<MessageSquare size={18} />} label="Encrypted Messages" count={0} />
            <DashboardLink to="/admin" icon={<HelpCircle size={18} />} label="Platform Resource Hub" />
            <DashboardLink to="/admin" icon={<Phone size={18} />} label="Priority Concierge" />
          </DashboardSection>

          {/* Section: Settings */}
          <DashboardSection title="System Config" icon={<Settings className="text-purple-600" />}>
            <DashboardLink to="/admin" icon={<UserIcon size={18} />} label="Identity Profile" />
            <DashboardLink to="/admin" icon={<Shield size={18} />} label="Titan™ Security Protocol" highlight />
            <DashboardLink to="/admin" icon={<CreditCard size={18} />} label="Valuation Methods" />
            <DashboardLink to="/admin" icon={<Bell size={18} />} label="Communication Preferences" />
          </DashboardSection>

          {/* Recent Activity Mini-Tab */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <Activity size={20} className="text-primary-600" />
                    Live Transmission Log
                </h3>
                <button className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-500">View Full Ledger</button>
            </div>
            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                        <Loader2 className="animate-spin mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Scanning Ledger...</span>
                    </div>
                ) : recentActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                        <ShoppingBag size={40} className="mb-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Transmissions Found</span>
                    </div>
                ) : recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-primary-100 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-primary-600 transition-colors overflow-hidden">
                                {item.products?.image ? (
                                    <img src={item.products.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <ShoppingBag size={18} />
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{item.products?.title || 'Unknown Asset'}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">${Number(item.total_price).toFixed(2)}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-widest ${item.status === 'Paid' || item.status === 'Completed' ? 'text-primary-600' : 'text-yellow-600'}`}>
                                {item.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


// Helper Components

function DashboardSection({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white border-slate-200 border rounded-3xl overflow-hidden h-full group hover:border-primary-200 transition-all shadow-sm">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
        <div className="p-2 bg-white rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100">
            {icon}
        </div>
        <span className="text-lg font-bold text-slate-900 tracking-tight">{title}</span>
      </div>
      <div className="p-4">
        <ul className="flex flex-col gap-2">
          {children}
        </ul>
      </div>
    </div>
  );
}

function DashboardLink({ to, icon, label, count, color, highlight }: { to: string, icon: React.ReactNode, label: string, count?: number, color?: string, highlight?: boolean }) {
  return (
    <li>
      <Link to={to} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group/link ${
        highlight ? "bg-primary-50 border border-primary-100" : "hover:bg-slate-50"
      }`}>
        <div className="flex items-center gap-4">
            <div className={`text-slate-400 group-hover/link:text-primary-600 transition-colors ${color}`}>
                {icon}
            </div>
            <span className={`text-sm font-semibold transition-colors ${highlight ? "text-primary-600" : "text-slate-600 group-hover/link:text-slate-900"}`}>
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
