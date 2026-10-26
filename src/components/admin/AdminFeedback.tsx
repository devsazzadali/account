"use client";

// AccountStoreOne — Feedback desk (Z2U alignment P3).
// The seller-side reputation desk the client uses on Z2U: a score
// matrix (positive / neutral / negative × 7d / 30d / all), dimension
// averages (delivery speed, service quality, item description), and the
// review list with Reply + moderation. All numbers are computed here
// from the real reviews table; reviews themselves are bound to
// completed orders (see /api/reviews).

import React, { useEffect, useMemo, useState } from "react";
import { Star, Loader2, Reply, Eye, EyeOff, Trash2, MessageSquare } from "lucide-react";
import { db } from "../../lib/dbclient";
import { toast } from "react-hot-toast";

type Bucket = "positive" | "neutral" | "negative";
const bucketOf = (rating: number): Bucket => (rating >= 4 ? "positive" : rating === 3 ? "neutral" : "negative");

export function AdminFeedback() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Bucket | "hidden">("all");
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [revRes, prodRes] = await Promise.all([
        db.from("reviews").select("*").order("created_at", { ascending: false }).limit(500),
        db.from("products").select("id, title"),
      ]);
      setReviews(revRes.data || []);
      const map: Record<string, string> = {};
      for (const p of prodRes.data || []) map[p.id] = p.title;
      setProducts(map);
    } catch (e: any) {
      toast.error(e.message || "Could not load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const matrix = useMemo(() => {
    const now = Date.now();
    const windows: Record<string, number> = { "7d": 7 * 864e5, "30d": 30 * 864e5, all: Infinity };
    const out: Record<string, Record<Bucket, number>> = {};
    for (const [name, span] of Object.entries(windows)) {
      out[name] = { positive: 0, neutral: 0, negative: 0 };
      for (const r of reviews) {
        if (r.is_hidden) continue;
        if (now - new Date(r.created_at).getTime() <= span) out[name][bucketOf(r.rating)]++;
      }
    }
    return out;
  }, [reviews]);

  const dimensions = useMemo(() => {
    const dims = [
      { key: "delivery_rating", label: "Delivery Speed" },
      { key: "service_rating", label: "Service Quality" },
      { key: "description_rating", label: "Item Description" },
    ];
    return dims.map((d) => {
      const vals = reviews.filter((r) => !r.is_hidden && r[d.key]).map((r) => Number(r[d.key]));
      return { ...d, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, count: vals.length };
    });
  }, [reviews]);

  const visible = reviews.filter((r) => {
    if (filter === "hidden") return r.is_hidden;
    if (filter === "all") return true;
    return !r.is_hidden && bucketOf(r.rating) === filter;
  });

  async function patch(id: string, fields: Record<string, unknown>, okMsg: string) {
    setBusyId(id);
    try {
      const { error } = await db.from("reviews").update(fields).eq("id", id);
      if (error) throw error;
      toast.success(okMsg);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      const { error } = await db.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Review deleted");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const positivePct = (w: Record<Bucket, number>) => {
    const total = w.positive + w.neutral + w.negative;
    return total === 0 ? "—" : `${((w.positive / total) * 100).toFixed(1)}% positive`;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="text-[#F4751F]" size={26} /> Feedback
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Reviews are written by buyers from their completed orders — one review per order. Reply publicly, or hide a review that violates policy.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={36} /></div>
      ) : (
        <>
          {/* Score matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400">Feedback Score</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="px-6 py-3">Window</th><th className="px-3 py-3">Positive</th><th className="px-3 py-3">Neutral</th><th className="px-3 py-3">Negative</th><th className="px-3 py-3">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {([["Last 7 days", matrix["7d"]], ["Last 30 days", matrix["30d"]], ["All time", matrix.all]] as const).map(([label, w]) => (
                    <tr key={label}>
                      <td className="px-6 py-3.5 font-bold text-slate-700">{label}</td>
                      <td className="px-3 py-3.5 font-black text-emerald-600">{w.positive}</td>
                      <td className="px-3 py-3.5 font-black text-slate-500">{w.neutral}</td>
                      <td className="px-3 py-3.5 font-black text-red-500">{w.negative}</td>
                      <td className="px-3 py-3.5 font-bold text-slate-500">{positivePct(w)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-5">
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-400">Transaction Scores</div>
              {dimensions.map((d) => (
                <div key={d.key} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">{d.label}</span>
                  {d.avg === null ? (
                    <span className="text-xs font-bold text-slate-300">no scores yet</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="flex">{[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className={i <= Math.round(d.avg as number) ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                      ))}</span>
                      <span className="text-sm font-black text-slate-900">{d.avg.toFixed(1)}</span>
                      <span className="text-[10px] font-bold text-slate-400">({d.count})</span>
                    </span>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Hidden reviews are excluded from every score above and never shown on product pages.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {([
              ["all", `All reviews (${reviews.length})`],
              ["positive", `Positive (${reviews.filter((r) => !r.is_hidden && bucketOf(r.rating) === "positive").length})`],
              ["neutral", `Neutral (${reviews.filter((r) => !r.is_hidden && bucketOf(r.rating) === "neutral").length})`],
              ["negative", `Negative (${reviews.filter((r) => !r.is_hidden && bucketOf(r.rating) === "negative").length})`],
              ["hidden", `Hidden (${reviews.filter((r) => r.is_hidden).length})`],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === id ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Review list */}
          <div className="space-y-4">
            {visible.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 py-20 text-center text-slate-400 text-sm font-bold">No reviews in this view yet.</div>
            ) : visible.map((r) => (
              <div key={r.id} className={`bg-white rounded-[2rem] border shadow-sm p-6 ${r.is_hidden ? "border-red-100 opacity-70" : "border-slate-200"}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex">{[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={14} className={i <= r.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                      ))}</span>
                      <span className="text-sm font-black text-slate-900">{r.username || "Customer"}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                      {r.is_hidden && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100">Hidden</span>}
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{r.comment}</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-2">
                      {r.product_id ? (products[r.product_id] || "Product") : "Product"}
                      {r.order_id ? <> · Order #{String(r.order_id).slice(0, 8).toUpperCase()}</> : <> · legacy review (no linked order)</>}
                    </p>
                    {(r.delivery_rating || r.service_rating || r.description_rating) && (
                      <p className="text-[11px] font-bold text-slate-400 mt-1">
                        Delivery {r.delivery_rating || "—"} · Service {r.service_rating || "—"} · Description {r.description_rating || "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button disabled={busyId === r.id} onClick={() => patch(r.id, { is_hidden: !r.is_hidden }, r.is_hidden ? "Review is visible again" : "Review hidden from the storefront")} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50" title={r.is_hidden ? "Unhide" : "Hide"}>
                      {r.is_hidden ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button disabled={busyId === r.id} onClick={() => remove(r.id)} className="p-2.5 bg-white border border-red-100 rounded-xl text-red-400 hover:bg-red-50 transition-all disabled:opacity-50" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {r.admin_reply ? (
                  <div className="mt-4 bg-[#0C2254]/5 border border-[#0C2254]/10 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-[#0C2254] uppercase tracking-widest mb-1 flex items-center gap-1.5"><Reply size={11} /> Store reply{r.reply_at ? ` · ${new Date(r.reply_at).toLocaleDateString()}` : ""}</p>
                    <p className="text-sm text-slate-700 font-medium">{r.admin_reply}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={replyDraft[r.id] || ""}
                      onChange={(e) => setReplyDraft({ ...replyDraft, [r.id]: e.target.value })}
                      placeholder="Reply to this review (public)…"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-slate-400"
                    />
                    <button
                      disabled={busyId === r.id || !(replyDraft[r.id] || "").trim()}
                      onClick={() => patch(r.id, { admin_reply: (replyDraft[r.id] || "").trim(), reply_at: new Date().toISOString() }, "Reply published")}
                      className="px-4 py-2.5 bg-[#0C2254] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <Reply size={13} /> Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
