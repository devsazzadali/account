"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogOut, Loader2, Mail, ArrowRight, PlusCircle, Store, Palette, RefreshCw } from "lucide-react";
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
import { AdminStoreInfo } from "../components/admin/AdminStoreInfo";
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
  // Fix round: a VALID session whose profile fetch exhausted its
  // retries is NOT "forbidden" — the old code conflated "profile fetch
  // failed" with "profile says non-staff" and flashed Access Forbidden
  // on ~1 in 5 loads. Unconfirmed restores now render an honest retry
  // screen; Forbidden is reserved for a loaded profile with a
  // non-staff role.
  const [profileUnconfirmed, setProfileUnconfirmed] = useState(false);
  const [restoreRun, setRestoreRun] = useState(0);

  useEffect(() => {
    // Session restore must ALWAYS resolve: on a hard load of an admin
    // sub-route, a stalled getSession/profile request used to leave
    // this page on the "Restoring Admin Protocol..." splash forever.
    // Every await below is timeout-raced and retried (session: 2
    // rounds; profile: 3 rounds), and loading is cleared in `finally`.
    // There is deliberately NO absolute fallback timer anymore — the
    // old 15s cap force-cleared `loading` while the profile was still
    // legitimately in flight, which is exactly how a slow-but-valid
    // session hit the Forbidden branch.
    let cancelled = false;
    const withTimeout = <T,>(p: Promise<T> | PromiseLike<T>, ms: number): Promise<T | null> =>
      Promise.race([
        Promise.resolve(p as Promise<T>),
        new Promise<null>((res) => setTimeout(() => res(null), ms)),
      ]);

    async function checkAuth() {
      setProfileUnconfirmed(false);
      try {
        let session: any = null;
        for (let attempt = 0; attempt < 2 && !session; attempt++) {
          const res: any = await withTimeout(auth.getSession() as any, 8000).catch(() => null);
          session = res?.data?.session ?? null;
        }
        if (!session) {
          router.push("/login");
          return;
        }
        if (cancelled) return;
        setUser(session.user);

        let profileData: any = null;
        for (let attempt = 0; attempt < 3 && !profileData; attempt++) {
          const res: any = await withTimeout(
            db.from('profiles').select('*').eq('id', session.user.id).single() as any,
            8000
          ).catch(() => null);
          profileData = res?.data ?? null;
        }
        if (!cancelled) {
          if (profileData) setProfile(profileData);
          else setProfileUnconfirmed(true);
        }
      } catch {
        if (!cancelled) router.push("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [restoreRun]);

  // Manager redirect (must stay above every early return — Rules of
  // Hooks): once the profile says "moderator", any tab other than
  // orders is replaced with the orders view.
  useEffect(() => {
    if (profile?.role === "moderator" && activeTab !== "orders") {
      router.replace("/admin/orders");
    }
  }, [profile, activeTab, router]);

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

  // The session is valid but the profile could not be confirmed after
  // the full retry policy — say so honestly and offer a retry instead
  // of blaming the user's clearance (fix round; see profileUnconfirmed).
  if (profileUnconfirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10 bg-[#f8fafc]">
        <div className="bg-white p-16 rounded-[3rem] border border-slate-200 shadow-2xl max-w-xl">
            <Loader2 size={64} className="text-primary-600 mx-auto mb-8 animate-spin" />
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight italic">Still connecting…</h2>
            <p className="text-slate-500 mb-10 font-medium leading-relaxed">
                You are signed in, but your admin profile could not be loaded — the connection to the store database is unusually slow right now. This is not an access problem.
            </p>
            <button
              onClick={() => { setLoading(true); setRestoreRun(r => r + 1); }}
              className="inline-flex items-center gap-3 px-10 py-5 bg-primary-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
                <RefreshCw size={18} /> Retry
            </button>
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
            <Link href="/" className="inline-flex items-center gap-3 px-10 py-5 bg-primary-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
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

  // Manager scope: a manager's console IS the orders view. Any other
  // tab (typed URL, stale link, dashboard default) bounces to orders —
  // the APIs behind those tabs deny managers server-side as well.
  const isManager = profile?.role === "moderator";

  if (isManager && activeTab !== "orders") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1dbf73] mx-auto mb-4" />
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Opening Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} role={profile?.role}>
      <div className="">
        {(activeTab === "dashboard" || activeTab === "performance") && <AdminOverview setActiveTab={setActiveTab} />}
        {(activeTab === "products" || activeTab === "active_offers" || activeTab === "create") && <AdminProducts activeTab={activeTab} />}
        {activeTab === "categories" && <AdminCategories />}
        {activeTab === "orders" && <AdminOrders setActiveTab={setActiveTab} />}
        {activeTab === "payments" && <AdminPayments />}
        {activeTab === "messages" && <AdminMessages setActiveTab={setActiveTab} />}
        {activeTab === "customers" && <AdminCustomers setActiveTab={setActiveTab} />}
        {activeTab === "store_info" && <AdminStoreInfo setActiveTab={setActiveTab} />}
        {activeTab === "feedback" && <AdminFeedback />}
        {activeTab === "coupons" && <AdminCoupons />}
        {/* Retired placeholder sections (Z2U alignment P0): "management",
            "violation" and "customizer" were static text panels — the
            Violation Center implied a platform disciplining the store,
            which does not exist in a single store. Any stale link
            to them lands on Store Information, a real screen. */}
        {(activeTab === "management" || activeTab === "violation" || activeTab === "customizer" || activeTab === "store_customize") && (
          <AdminStoreInfo setActiveTab={setActiveTab} />
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
