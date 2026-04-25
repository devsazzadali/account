import React, { useEffect, useState } from "react";
import { 
  Package, Clock, CheckCircle2, ChevronRight, MessageSquare, 
  Settings, ShoppingBag, Loader2, AlertCircle, ShieldAlert,
  Mail, ExternalLink, ArrowRight, ShieldCheck, Crown
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function UserDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
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
    
    // Fetch profile and orders
    const [profileRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).single(),
      supabase.from('orders').select('*, products(*)').eq('username', session.user.user_metadata.username || session.user.email.split('@')[0]).order('created_at', { ascending: false })
    ]);

    setProfile(profileRes.data);
    setOrders(ordersRes.data || []);
    setLoading(false);
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
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100">
                <Mail className="w-10 h-10 text-amber-600" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Identity Verification Required</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Your account is currently restricted. Please check your inbox at <span className="text-slate-900 font-bold">{user.email}</span> and click the confirmation link to unlock your operational hub.
             </p>
             <div className="space-y-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                >
                   Check Status <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => supabase.auth.resend({ type: 'signup', email: user.email })}
                  className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                   Resend Verification Protocol
                </button>
             </div>
             <p className="mt-8 text-[11px] text-slate-400 font-medium">
                Need help? Contact <a href="mailto:support@accountstore.com" className="text-primary-600 hover:underline">Support Core</a>
             </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tight">Operational Hub</h1>
                 {profile?.is_premium && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 flex items-center gap-1">
                       <Crown size={12} /> Premium Tier
                    </span>
                 )}
              </div>
              <p className="text-slate-500 font-medium">Welcome back, <span className="text-slate-900 font-bold">{profile?.username}</span>. System is optimized and ready.</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 Network Connected
              </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
           <StatBox label="Total Procurements" value={orders.length} icon={<Package size={20} />} color="text-slate-900" />
           <StatBox label="Active Sessions" value={orders.filter(o => o.status !== 'Completed').length} icon={<Clock size={20} />} color="text-primary-600" />
           <StatBox label="Finalized Orders" value={orders.filter(o => o.status === 'Completed').length} icon={<CheckCircle2 size={20} />} color="text-emerald-600" />
           <StatBox label="Loyalty Tier" value={profile?.is_premium ? "Elite" : "Standard"} icon={<Crown size={20} />} color="text-amber-600" />
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           
           {/* Left: Orders Feed */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">Order Manifest</h3>
                 <div className="flex gap-2">
                    <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>Recent</TabButton>
                    <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')}>History</TabButton>
                 </div>
              </div>

              {orders.length === 0 ? (
                 <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-sm">
                    <ShoppingBag size={64} className="mx-auto text-slate-100 mb-6" />
                    <h4 className="text-xl font-black text-slate-900 mb-2">No Transactions Detected</h4>
                    <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Your procurement history is empty. Start exploring our premium assets.</p>
                    <Link to="/" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">Browse Market</Link>
                 </div>
              ) : (
                 <div className="space-y-4">
                    {orders.map((order, idx) => (
                       <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0, y: 20 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-primary-600/20 transition-all group"
                       >
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                             <div className="flex gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                   <img src={order.products?.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                   <div className="text-[11px] font-black text-primary-600 uppercase tracking-widest mb-1">
                                      #{order.id.split('-')[0].toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                                   </div>
                                   <h4 className="text-[17px] font-black text-slate-900 mb-1 leading-tight">{order.products?.title}</h4>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[13px] font-black text-slate-900">${order.total_price}</span>
                                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                         order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                         order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                                         'bg-amber-50 text-amber-600 border border-amber-100'
                                      }`}>
                                         {order.status}
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <Link to={`/order/${order.id}`} className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center gap-2">
                                   Access Asset <ChevronRight size={16} />
                                </Link>
                             </div>
                          </div>
                       </motion.div>
                    ))}
                 </div>
              )}
           </div>

           {/* Right: Identity Sidebar */}
           <div className="space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-600/30 transition-all duration-700" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                          <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black tracking-tight">{profile?.full_name || profile?.username}</h4>
                          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">ID: {user?.id.slice(0,8).toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="space-y-5 mb-8">
                       <ProfileStat icon={<ShieldCheck size={18} />} label="Security Level" value={profile?.role === 'admin' ? "Full Control" : "Standard Node"} />
                       <ProfileStat icon={<Crown size={18} />} label="Membership" value={profile?.is_premium ? "Premium Tier" : "Basic Tier"} />
                       <ProfileStat icon={<Mail size={18} />} label="Comm Node" value={user?.email} />
                    </div>
                    <button onClick={() => navigate('/settings')} className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                       <Settings size={16} /> Security Settings
                    </button>
                 </div>
              </div>

              {/* Support Banner */}
              <div className="bg-primary-600 rounded-[3rem] p-8 text-white shadow-xl shadow-primary-600/20 relative overflow-hidden group">
                 <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <h4 className="text-xl font-black mb-2 tracking-tight">Need Assistance?</h4>
                 <p className="text-white/80 text-[13px] font-medium mb-6 leading-relaxed">Our support engineers are available 24/7 to help you with your procurements.</p>
                 <button className="px-6 py-3 bg-white text-primary-600 rounded-xl text-[12px] font-black uppercase tracking-widest hover:shadow-lg transition-all flex items-center gap-2">
                    <MessageSquare size={16} /> Open Ticket
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, color }: any) {
   return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
         <div className="text-slate-400 mb-3">{icon}</div>
         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
         <div className={`text-2xl font-black ${color}`}>{value}</div>
      </div>
   );
}

function ProfileStat({ icon, label, value }: any) {
   return (
      <div className="flex items-center gap-4">
         <div className="text-white/40">{icon}</div>
         <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-0.5">{label}</div>
            <div className="text-[13px] font-bold truncate max-w-[150px]">{value}</div>
         </div>
      </div>
   );
}

function TabButton({ children, active, onClick }: any) {
   return (
      <button 
         onClick={onClick}
         className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            active ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
         }`}
      >
         {children}
      </button>
   );
}
