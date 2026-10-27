"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, Loader2, Mail, ArrowRight, PlusCircle, Store, Palette } from "lucide-react";
import { db } from "../lib/dbclient";
import { auth } from "../lib/auth-client";
import { motion } from "framer-motion";
import { AdminLayout } from "../components/admin/AdminLayout";
import { AdminOverview } from "../components/admin/AdminOverview";
import { AdminProducts } from "../components/admin/AdminProducts";
import { AdminOrders } from "../components/admin/AdminOrders";
import { AdminSettings } from "../components/admin/AdminSettings";
import { AdminStorefront } from "../components/admin/AdminStorefront";
import { AdminCustomers } from "../components/admin/AdminCustomers";
import { AdminMessages } from "../components/admin/AdminMessages";
import { AdminCategories } from "../components/admin/AdminCategories";
import { AdminPayments } from "../components/admin/AdminPayments";
import { AdminSellerInfo } from "../components/admin/AdminSellerInfo";
import { AdminFeedback } from "../components/admin/AdminFeedback";
import { AdminCoupons } from "../components/admin/AdminCoupons";


export function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const activeTab = (params?.tab as string) || "dashboard";
  
  const setActiveTab = (newTab: string) => {
    router.push(`/admin/${newTab}`);
  };

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      
      const { data: profileData } = await db
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // New-order alerts (sound + toast + bell badge) live in ONE place:
  // AdminLayout's order watcher. A second subscription used to live here
  // and played an externally-hosted MP3 (assets.mixkit.co) plus a duplicate
  // toast on every order — removed in the 2026-10-26 full-QA pass so the
  // admin gets exactly one alert, from a self-contained WebAudio chime.

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
            <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                <ArrowLeft size={18} /> Return to Home
            </Link>
        </div>
      </div>
    );
  }

  // NOTE (completion build): the old "email confirmation" gate was removed.
  // Access is governed by the profile role, enforced server-side in the
  // admin layout and in every API route — an unverified-email screen here
  // only locked legitimate admins out (Neon Auth verification is optional
  // and has its own flow).

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="">
        {(activeTab === "dashboard" || activeTab === "performance") && <AdminOverview setActiveTab={setActiveTab} />}
        {(activeTab === "products" || activeTab === "active_offers" || activeTab === "create") && <AdminProducts activeTab={activeTab} />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders setActiveTab={setActiveTab} />}
        {activeTab === "payments" && <AdminPayments />}
        {activeTab === "messages" && <AdminMessages />}
        {activeTab === "customers" && <AdminCustomers setActiveTab={setActiveTab} />}
        {activeTab === "seller_info" && <AdminSellerInfo setActiveTab={setActiveTab} />}
        {activeTab === "feedback" && <AdminFeedback />}
        {activeTab === "coupons" && <AdminCoupons />}
        {/* Retired placeholder sections (Z2U alignment P0): "management",
            "violation" and "customizer" were static text panels — the
            Violation Center implied a platform disciplining the seller,
            which does not exist in a single-seller store. Any stale link
            to them lands on Seller Information, a real screen. */}
        {(activeTab === "management" || activeTab === "violation" || activeTab === "customizer" || activeTab === "store_customize") && (
          <AdminSellerInfo setActiveTab={setActiveTab} />
        )}
        {activeTab === "storefront" && profile?.role === "admin" && <AdminStorefront />}
        {activeTab === "storefront" && profile?.role !== "admin" && (
           <div className="flex flex-col items-center justify-center py-32 text-center">
              <ShieldAlert size={64} className="text-amber-500 mb-4" />
              <h3 className="text-2xl font-black text-slate-900">Restricted Module</h3>
              <p className="text-slate-500 mt-2 font-medium">Moderators cannot modify system-wide configurations.</p>
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
