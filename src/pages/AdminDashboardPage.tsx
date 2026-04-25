import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, Loader2, Mail, ArrowRight } from "lucide-react";
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

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem("userRole");
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  // Security Check: Role Authorization
  if (userRole !== "admin" && userRole !== "moderator") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10 bg-white m-10 rounded-3xl border border-slate-200 shadow-xl">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h2 className="text-3xl font-black mb-3 tracking-tight">Security Protocol Violation</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto font-medium">Your current identity node does not have high-level administrative or moderator authorization.</p>
        <Link to="/" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">Return to Sector 7G (Home)</Link>
      </div>
    );
  }

  // Security Check: Email Confirmation (Even for Admins/Mods)
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="p-10 text-center">
             <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-amber-100">
                <Mail className="w-10 h-10 text-amber-600" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Privileged Access Pending</h2>
             <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Your administrative session cannot be initialized until your email <span className="text-slate-900 font-bold">{user.email}</span> is confirmed. 
             </p>
             <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
             >
                Verify Node Status <ArrowRight size={16} />
             </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="p-4">
        {activeTab === "dashboard" && <AdminOverview setActiveTab={setActiveTab} />}
        {activeTab === "products" && <AdminProducts />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders setActiveTab={setActiveTab} />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers setActiveTab={setActiveTab} />}
        {activeTab === "settings" && userRole === "admin" && <AdminSettings />}
        {activeTab === "settings" && userRole !== "admin" && (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <ShieldAlert size={48} className="text-amber-500 mb-4" />
              <h3 className="text-xl font-black text-slate-900">Restricted Module</h3>
              <p className="text-slate-500 mt-1">Moderators cannot modify system-wide configurations.</p>
           </div>
        )}
      </div>
    </AdminLayout>
  );
}
