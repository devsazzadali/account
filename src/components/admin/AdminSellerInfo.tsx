"use client";

// AccountStoreOne — Seller Information (Z2U alignment P0).
// The page the client dwelled on in the reference video: store identity
// + an operations scoreboard. EVERY number here is computed server-side
// from orders / disputes / reviews (/api/store/stats → seller) — nothing
// is typed in or decorative. Single-seller store: no levels, no
// withdrawals, no platform discipline (those are marketplace machinery).

import React, { useEffect, useState } from "react";
import { Store, Mail, Loader2, CheckCircle2, AlertTriangle, Clock, ShoppingBag, Star, DollarSign, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

interface SellerStats {
  completion_rate: number | null;
  dispute_rate_7d: number | null;
  dispute_rate_30d: number | null;
  dispute_rate_all: number | null;
  orders_in_processing: number;
  total_orders: number;
  completed_orders: number;
  canceled_orders: number;
  paid_revenue: number;
  total_reviews: number;
  average_rating: number | null;
}

export function AdminSellerInfo({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [identity, setIdentity] = useState<any>(null);
  const [seller, setSeller] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch("/api/store/stats").then((r) => r.json()),
          fetch("/api/admin/settings", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
        ]);
        setSeller(statsRes?.seller || null);
        setIdentity({
          name: statsRes?.store_name,
          description: statsRes?.store_description,
          support_email: statsRes?.support_email,
          logo_url: statsRes?.store_logo_url,
          banner_url: statsRes?.store_banner_url,
          open: statsRes?.store_open,
          support_hours: statsRes?.support_hours,
          settings: settingsRes?.settings || null,
        });
      } catch {
        toast.error("Could not load seller information");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="py-32 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={36} /></div>;
  }

  const rate = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Store className="text-[#F4751F]" size={26} /> Seller Information
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Your store's public identity and its real operating record — every figure below is computed from your orders, disputes and reviews.
        </p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {identity?.banner_url && (
          <div className="h-36 w-full overflow-hidden border-b border-slate-100">
            <img src={identity.banner_url} alt="Store banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-8 flex flex-col md:flex-row gap-8">
          <div className="w-24 h-24 rounded-[1.8rem] bg-[#0C2254] flex items-center justify-center shrink-0 overflow-hidden border-4 border-white shadow-lg">
            {identity?.logo_url ? (
              <img src={identity.logo_url} alt="Store logo" className="w-full h-full object-cover" />
            ) : (
              <Store size={36} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-black text-slate-900">{identity?.name || "Account Store One"}</h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${identity?.open ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"}`}>
                {identity?.open ? <><Eye size={12} /> Store Open</> : <><EyeOff size={12} /> Store Hidden</>}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2 max-w-2xl">{identity?.description || "No store description set."}</p>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-[12px] font-bold text-slate-500">
              {identity?.support_email && (
                <span className="flex items-center gap-2"><Mail size={14} className="text-slate-400" /> {identity.support_email}</span>
              )}
              {identity?.support_hours && (
                <span className="flex items-center gap-2"><Clock size={14} className="text-slate-400" /> Support: {identity.support_hours}</span>
              )}
            </div>
            {setActiveTab && (
              <button onClick={() => setActiveTab("settings")} className="mt-5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                Edit in Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Operations scoreboard */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-6">Store Operation Information</h3>
        {!seller ? (
          <p className="text-sm text-slate-400 font-medium">Statistics unavailable right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScoreCell icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="Order Completion" value={rate(seller.completion_rate)} sub={`${seller.completed_orders} of ${seller.total_orders - seller.canceled_orders} non-canceled orders`} />
            <ScoreCell icon={<AlertTriangle size={18} className="text-red-500" />} label="Dispute Rate (7 days)" value={rate(seller.dispute_rate_7d)} sub="disputes ÷ orders, last 7 days" />
            <ScoreCell icon={<AlertTriangle size={18} className="text-amber-500" />} label="Dispute Rate (30 days)" value={rate(seller.dispute_rate_30d)} sub="disputes ÷ orders, last 30 days" />
            <ScoreCell icon={<AlertTriangle size={18} className="text-slate-400" />} label="Dispute Rate (all time)" value={rate(seller.dispute_rate_all)} sub="every dispute ÷ every order" />
            <ScoreCell icon={<Clock size={18} className="text-blue-500" />} label="Orders in Processing" value={String(seller.orders_in_processing)} sub="paid, awaiting delivery/confirm" />
            <ScoreCell icon={<ShoppingBag size={18} className="text-slate-500" />} label="Total Orders" value={String(seller.total_orders)} sub={`${seller.canceled_orders} canceled`} />
            <ScoreCell icon={<DollarSign size={18} className="text-emerald-600" />} label="Paid Revenue" value={`$${Number(seller.paid_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="verified payments only" />
            <ScoreCell icon={<Star size={18} className="text-amber-400" />} label="Review Average" value={seller.average_rating === null ? "—" : `${seller.average_rating} / 5`} sub={`${seller.total_reviews} review(s)`} />
          </div>
        )}
        <p className="text-[11px] text-slate-400 font-medium mt-6 leading-relaxed">
          Completion counts orders that reached Completed out of all non-canceled orders. Dispute rates count disputes opened in the window
          against orders placed in the same window. These are your store's own numbers — there is no platform score or seller level in a single-seller store.
        </p>
      </div>
    </div>
  );
}

function ScoreCell({ icon, label, value, sub }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">{icon}<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span></div>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-slate-400 mt-1.5 leading-snug">{sub}</div>
    </div>
  );
}
