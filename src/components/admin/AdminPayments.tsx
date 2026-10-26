"use client";

// AccountStoreOne — admin payment verification queue.
// Manual bKash/Nagad payments (order payments + wallet top-ups) land here
// as pending PaymentRequests. Approving settles the money server-side
// (order → paid + auto-delivery, or wallet credited with a ledger row);
// rejecting returns an order to "unpaid" so the buyer can resubmit.

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw, Wallet, ShoppingBag, Loader2, Download } from "lucide-react";
import { toast } from "react-hot-toast";

interface PaymentRequestRow {
  id: string;
  purpose: string;
  method: string;
  amount: number;
  trx_id: string;
  sender_number: string | null;
  status: string;
  created_at: string;
  order_id: string | null;
  order_title: string | null;
  user_email: string | null;
  username: string | null;
}

export function AdminPayments() {
  const [rows, setRows] = useState<PaymentRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("pending");
  const [outbox, setOutbox] = useState<{ configured: boolean; counts: Record<string, number> } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/outbox", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setOutbox({ configured: !!j.email_configured, counts: j.counts || {} }))
      .catch(() => {});
  }, []);

  async function exportFinance() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/finance-export", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?status=${filter}`, { credentials: "same-origin" });
      const json = await res.json();
      setRows(json.payment_requests || []);
    } catch {
      toast.error("Could not load payment requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function review(id: string, approve: boolean) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approve }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Review failed");
      toast.success(approve ? "Payment verified — money settled" : "Payment rejected");
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Verification</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Buyers who pay manually (bKash/Nagad) submit a Transaction ID here. Verify the money arrived, then approve — delivery and wallet credit happen automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {s}
            </button>
          ))}
          <button onClick={load} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportFinance} disabled={exporting} className="px-4 py-2.5 bg-[#0C2254] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
            <Download size={14} /> Finance CSV
          </button>
        </div>
      </div>

      {outbox && (
        <div className={`rounded-2xl border px-5 py-3.5 text-[12px] font-bold flex items-center justify-between flex-wrap gap-2 ${outbox.configured ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
          <span>
            Transactional email: {outbox.configured
              ? "provider configured — order emails are being sent."
              : "provider NOT configured (RESEND_API_KEY / STORE_FROM_EMAIL) — order emails stay queued, nothing is faked as sent."}
          </span>
          <span className="text-[11px] uppercase tracking-widest">
            Outbox · pending {outbox.counts.pending || 0} · sent {outbox.counts.sent || 0} · failed {outbox.counts.failed || 0}
          </span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">No {filter} payments</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map((r) => (
              <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/60 transition-colors">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${r.purpose === "topup" ? "bg-violet-50 border border-violet-100" : "bg-emerald-50 border border-emerald-100"}`}>
                  {r.purpose === "topup" ? <Wallet size={20} className="text-violet-600" /> : <ShoppingBag size={20} className="text-emerald-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900">${Number(r.amount).toFixed(2)}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{r.method}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{r.purpose === "topup" ? "Wallet top-up" : "Order payment"}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                    {r.purpose === "topup" ? `Top-up for ${r.username || r.user_email || "a customer"}` : `${r.order_title || "Order"} — ${r.user_email || r.username || ""}`}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    TrxID: <span className="font-bold text-slate-700">{r.trx_id}</span>
                    {r.sender_number && <> · From: <span className="font-bold text-slate-700">{r.sender_number}</span></>}
                    {" · "}{new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Verify & Settle
                    </button>
                    <button
                      disabled={busyId === r.id}
                      onClick={() => review(r.id, false)}
                      className="px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
                {r.status !== "pending" && (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${r.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{r.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
