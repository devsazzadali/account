"use client";

// AccountStoreOne — store profile sidebar.
// Every number here comes from /api/store/stats (real aggregates over the
// reviews / orders / disputes tables). The previous version rendered a
// hard-coded fictional seller ("TitanGames_Global", 45,290 reviews) —
// replaced as part of the completion build: no fake numbers anywhere.

import { MessageCircle, ThumbsUp, Crown, ShieldCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface StoreStats {
  store_name: string;
  description: string;
  total_reviews: number;
  average_rating: number | null;
  positive_pct: number | null;
  completed_orders: number;
  dispute_rate_90d: number | null;
}

export function Sidebar() {
  const [stats, setStats] = useState<StoreStats | null>(null);

  useEffect(() => {
    fetch("/api/store/stats")
      .then((r) => r.json())
      .then((j) => setStats(j.stats || null))
      .catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <div className="w-full md:w-[280px] shrink-0 space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[400px] shadow-sm"></div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 h-[100px] shadow-sm"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full md:w-[280px] shrink-0">
      {/* Store Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-100 mb-3 relative group-hover:border-primary-300 transition-colors duration-300 shadow-xl shadow-primary-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center text-slate-800 font-bold">
              <div className="flex flex-col items-center">
                <Crown className="w-10 h-10 text-primary-600 mb-1 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[10px] tracking-wider uppercase text-primary-700">StoreOne</span>
              </div>
            </div>
          </div>
          <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">{stats.store_name}</h2>
          <div className="flex items-center gap-1.5 mt-2 text-primary-600">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Verified Store</span>
          </div>
        </div>

        <button className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 mb-6 transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transform hover:-translate-y-0.5">
          <MessageCircle className="w-4 h-4" />
          Contact Store
        </button>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Completed orders</span>
            <span className="text-slate-900 font-medium">{stats.completed_orders}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Dispute rate</span>
            <span className="text-slate-900 font-medium">
              {stats.dispute_rate_90d === null ? "—" : `${stats.dispute_rate_90d}%`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider -mt-2 mb-2">(last 90 days)</div>

          <div className="h-px bg-slate-100 my-3"></div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total reviews</span>
            <span className="text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100">{stats.total_reviews}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Average rating</span>
            <div className="flex items-center gap-1.5 text-slate-900">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <span className="font-medium">{stats.average_rating === null ? "—" : stats.average_rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Positive reviews</span>
            <div className="flex items-center gap-1.5 text-primary-600">
              <ThumbsUp className="w-3.5 h-3.5 fill-current" />
              <span className="font-medium">{stats.positive_pct === null ? "—" : `${stats.positive_pct}%`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
          About the store
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed break-words font-light">
          {stats.description}
        </p>
      </div>

      {/* Buyer protection card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="font-display font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
          Buyer Protection
        </h3>
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 shadow-sm">
          <div className="bg-primary-50 p-2 rounded-lg border border-primary-100">
            <ShieldCheck className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">Escrow-held payments</div>
            <div className="text-xs text-primary-600 font-bold uppercase tracking-wider">Release on delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
}
