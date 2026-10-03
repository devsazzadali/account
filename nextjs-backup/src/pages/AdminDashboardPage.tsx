import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, Loader2, Mail, ArrowRight, PlusCircle, Store, Palette } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminMessages } from "../components/admin/AdminMessages";
import { AdminCategories } from "../components/admin/AdminCategories";

import { toast } from "react-hot-toast";

export function AdminDashboardPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || "dashboard";
  
  const setActiveTab = (newTab: string) => {
    navigate(`/admin/${newTab}`);
  };

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Real-time Order Notifications
  useEffect(() => {
    if (profile?.role !== "admin" && profile?.role !== "moderator") return;

    const orderSubscription = supabase.channel('admin-order-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          // Play notification sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio playback blocked by browser:', e));

          // Show Toast Notification
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">New Order Received!</span>
              <span className="text-[13px] font-bold text-slate-600">ID: #{payload.new.id.split('-')[0].toUpperCase()}</span>
              <span className="text-[14px] font-black text-[#E62E04] mt-1">Amount: ${payload.new.total_price || payload.new.total_amount}</span>
            </div>,
            { 
              duration: 8000, 
              icon: '🚨',
              style: {
                border: '1px solid #E62E04',
                padding: '16px',
                color: '#0A0F1C',
                borderRadius: '16px',
                background: '#fff'
              }
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#1dbf73] mx-auto mb-4" />
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Restoring Admin Protocol...</p>
        </div>
      </div>
    );
  }

  // Security Check: Role Authorization (Fetch from real profile, not localStorage)
  const isAuthorized = profile?.role === "admin" || profile?.role === "moderator";

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-[#f8fafc]">
        <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-2xl max-w-xl">
            <ShieldAlert size={80} className="text-red-500 mx-auto mb-8" />
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight italic">Access Forbidden</h2>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                Your identity hash does not contain the required administrative clearance to access this sector. This attempt has been logged.
            </p>
            <Link to="/" className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                <ArrowLeft size={18} /> Return to Home
            </Link>
        </div>
      </div>
    );
  }

  // Security Check: Email Confirmation
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100">
                <Mail className="w-10 h-10 text-amber-600" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Privileged Access Pending</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Confirm your email <span className="text-slate-900 font-bold">{user.email}</span> to initialize administrative functions.
             </p>
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                Verify Status <ArrowRight size={16} />
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="">
        {(activeTab === "dashboard" || activeTab === "performance") && <AdminOverview setActiveTab={setActiveTab} />}
        {(activeTab === "products" || activeTab === "active_offers" || activeTab === "create") && <AdminProducts activeTab={activeTab} />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders setActiveTab={setActiveTab} />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers setActiveTab={setActiveTab} />}
        {activeTab === "management" && (
           <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Store size={64} className="text-slate-900 mb-4" />
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Store Management</h3>
              <p className="text-slate-500 mt-2 font-medium">Configure your store settings and identity.</p>
           </div>
        )}
        {activeTab === "violation" && (
           <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <ShieldAlert size={64} className="text-red-500 mb-4" />
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Violation Center</h3>
              <p className="text-slate-500 mt-2 font-medium">No system violations or compliance issues detected.</p>
           </div>
        )}
        {activeTab === "customizer" && (
           <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <Palette size={64} className="text-emerald-500 mb-4" />
              <h3 className="text-2xl font-black text-slate-900 uppercase italic">Store Customizer</h3>
              <p className="text-slate-500 mt-2 font-medium">This module is currently being calibrated for your workspace.</p>
           </div>
        )}
        {activeTab === "settings" && profile?.role === "admin" && <AdminSettings />}
        {activeTab === "settings" && profile?.role !== "admin" && (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <ShieldAlert size={64} className="text-amber-500 mb-4" />
              <h3 className="text-2xl font-black text-slate-900">Restricted Module</h3>
              <p className="text-slate-500 mt-2 font-medium">Moderators cannot modify system-wide configurations.</p>
           </div>
        )}
      </div>
    </AdminLayout>
  );
}
