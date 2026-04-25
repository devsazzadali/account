import React, { useEffect, useState } from "react";
import { 
  Package, Clock, CheckCircle2, ChevronRight, MessageSquare, 
  Settings, ShoppingBag, Loader2, AlertCircle, ShieldAlert,
  Mail, ExternalLink, ArrowRight, ShieldCheck, Crown,
  LayoutDashboard, History, MessageCircle, Shield, LogOut
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserMessages } from "../components/user/UserMessages";
import { UserSettings } from "../components/user/UserSettings";

export function UserDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, orders, messages, security
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }
    setUser(session.user);
    
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('orders').select('*, products(*)').eq('username', session.user.user_metadata.username || session.user.email.split('@')[0]).order('created_at', { ascending: false })
    ]);

    setProfile(profileRes.data);
    setOrders(ordersRes.data || []);
    setLoading(false);
  }

  function handleLogout() {
    supabase.auth.signOut().then(() => {
        localStorage.clear();
        navigate("/login");
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  // Security Check: Email Confirmation
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100"><Mail className="w-10 h-10 text-amber-600" /></div>
             <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Identity Verification Required</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-8">Your account is restricted. Confirm your email <span className="text-slate-900 font-bold">{user.email}</span> to unlock the hub.</p>
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">Check Status <ArrowRight size={16} /></button>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Operational Hub", icon: LayoutDashboard },
    { id: "orders",    label: "Procurement History", icon: History },
    { id: "messages",  label: "Communication Desk", icon: MessageCircle },
    { id: "security",  label: "Security Node", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 md:pb-0">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* ── Left Sidebar (As per Screenshot) ── */}
        <aside className="w-full lg:w-[320px] bg-white border-r border-slate-200 p-8 flex flex-col shrink-0">
           {/* User Profile Card */}
           <div className="flex items-center gap-4 mb-10 p-4 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1dbf73] to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                 <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} className="w-full h-full object-cover rounded-2xl" alt="" />
              </div>
              <div className="min-w-0">
                 <h4 className="text-[16px] font-black text-slate-900 truncate">{profile?.full_name || profile?.username}</h4>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Session Active</span>
                 </div>
              </div>
           </div>

           {/* Navigation Nodes */}
           <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all group ${
                    activeTab === item.id 
                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                   <item.icon size={20} className={activeTab === item.id ? "text-[#1dbf73]" : "group-hover:text-slate-900"} />
                   {item.label}
                   {activeTab === item.id && <ChevronRight size={16} className="ml-auto text-white/50" />}
                </button>
              ))}
           </nav>

           {/* Footer Actions */}
           <div className="mt-auto pt-8 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[14px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                 <LogOut size={20} /> Sign Out
              </button>
           </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-h-screen custom-scrollbar">
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <OperationalOverview profile={profile} orders={orders} setActiveTab={setActiveTab} />}
                {activeTab === 'orders' && <OrderManifest orders={orders} />}
                {activeTab === 'messages' && <UserMessages />}
                {activeTab === 'security' && <UserSettings />}
              </motion.div>
           </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

function OperationalOverview({ profile, orders, setActiveTab }: any) {
  return (
    <div className="space-y-12">
       <header>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Operational Overview</h1>
          <p className="text-slate-500 font-medium italic">Welcome back, Agent <span className="text-[#1dbf73]">{profile?.username}</span>. Neural link stable.</p>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatNode label="Total Procurements" value={orders.length} icon={<Package size={24} />} color="text-slate-900" />
          <StatNode label="Active Sessions" value={orders.filter((o:any) => o.status !== 'Completed').length} icon={<Clock size={24} />} color="text-[#1dbf73]" />
          <StatNode label="Security Tier" value={profile?.is_premium ? "ELITE" : "BASIC"} icon={<Crown size={24} />} color="text-amber-500" />
       </div>

       <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-900">Recent Transactions</h3>
             <button onClick={() => setActiveTab('orders')} className="text-[12px] font-black text-[#1dbf73] uppercase tracking-widest flex items-center gap-2">Full Ledger <ArrowRight size={14} /></button>
          </div>
          <div className="space-y-4">
             {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0"><img src={order.products?.image} className="w-full h-full object-cover" alt="" /></div>
                      <div>
                         <div className="text-[14px] font-black text-slate-900">{order.products?.title}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{order.id.split('-')[0]}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[14px] font-black text-slate-900">${order.total_price}</div>
                      <div className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{order.status}</div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function OrderManifest({ orders }: any) {
  return (
    <div className="space-y-8">
       <header>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Procurement History</h1>
          <p className="text-slate-500 font-medium">Historical record of all successfully initialized digital assets.</p>
       </header>

       <div className="space-y-4">
          {orders.map((order: any) => (
             <div key={order.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:border-[#1dbf73]/50 transition-all group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                         <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900">{order.products?.title}</h4>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{order.id.split('-')[0].toUpperCase()}</span>
                            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>{order.status}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <div className="text-[18px] font-black text-slate-900">${order.total_price}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                      <Link to={`/order/${order.id}`} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#1dbf73] transition-all flex items-center gap-2">Access <ArrowRight size={16} /></Link>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}

function StatNode({ label, value, icon, color }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
       <div className={`${color} mb-4`}>{icon}</div>
       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
       <div className={`text-3xl font-black ${color}`}>{value}</div>
    </div>
  );
}
