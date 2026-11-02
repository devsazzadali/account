"use client";

// AccountStoreOne — Sales by day chart (Fix Round 6, video-gap #8).
// Renders the REAL daily series from /api/store/stats → sales_by_day
// (paid orders bucketed by order date, last 14 days, zero-filled
// server-side). Pure CSS bars — no chart dependency. When the whole
// window has no paid sales the chart says so plainly instead of
// drawing a fake baseline.

import React from "react";
import { TrendingUp } from "lucide-react";

export interface SalesDay {
  date: string; // yyyy-mm-dd (UTC)
  orders: number;
  revenue: number;
}

export function SalesByDayChart({ days, compact = false }: { days: SalesDay[]; compact?: boolean }) {
  const totalOrders = days.reduce((a, d) => a + d.orders, 0);
  const totalRevenue = days.reduce((a, d) => a + d.revenue, 0);
  const max = Math.max(0, ...days.map((d) => d.revenue));
  const label = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  };

  return (
    <div className={compact ? "" : "bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] px-8 py-6"}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest italic">Sales — Last 14 Days</h3>
        </div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {totalOrders} paid order{totalOrders === 1 ? "" : "s"} · ${totalRevenue.toFixed(2)}
        </span>
      </div>

      {totalOrders === 0 ? (
        <p className="text-sm text-slate-400 font-medium py-6 text-center">
          No paid sales in the last 14 days yet — the chart fills in as orders are paid.
        </p>
      ) : (
        <div>
          <div className={`flex items-end gap-1.5 ${compact ? "h-24" : "h-36"}`}>
            {days.map((d) => (
              <div
                key={d.date}
                className="flex-1 flex flex-col items-center justify-end h-full group"
                title={`${label(d.date)} — ${d.orders} order${d.orders === 1 ? "" : "s"}, $${d.revenue.toFixed(2)}`}
              >
                <span className="text-[9px] font-black text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${d.revenue.toFixed(0)}
                </span>
                <div
                  className={`w-full rounded-t-md transition-all ${d.revenue > 0 ? "bg-[#0C2254] group-hover:bg-[#F4751F]" : "bg-slate-100"}`}
                  style={{ height: `${max > 0 ? Math.max(3, (d.revenue / max) * 100) : 3}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-2">
            {days.map((d, i) => (
              <div key={d.date} className="flex-1 text-center text-[9px] font-bold text-slate-400 uppercase">
                {i % 2 === 0 || days.length <= 7 ? label(d.date).split(" ")[0] + " " + label(d.date).split(" ")[1] : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
