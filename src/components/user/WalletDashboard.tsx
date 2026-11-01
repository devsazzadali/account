"use client";

// AccountStoreOne — wallet dashboard (REAL wallet, completion build).
// Balance and history come from /api/wallet: the balance is the wallets
// row, the history is the append-only wallet_transactions ledger. Top-ups
// are made BY CARD (R2, owner ruling 2026-11-01 — international store,
// card + wallet only): the buyer starts a Stripe Checkout session via
// /api/payments/stripe/topup-session and the balance is credited by the
// Stripe webhook when the payment confirms. Refunds from orders and
// disputes also land here as ledger credits.

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock,
  ShoppingBag, RefreshCw, DollarSign, CreditCard, Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface LedgerTx {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  description: string | null;
  created_at: string;
}

interface PendingTopup {
  id: string;
  amount: number;
  created_at: string;
}

const txStyle: Record<string, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  topup: { bg: "bg-blue-50", border: "border-blue-100", icon: <ArrowDownLeft size={16} className="text-blue-500" />, text: "text-blue-600" },
  refund: { bg: "bg-emerald-50", border: "border-emerald-100", icon: <ArrowDownLeft size={16} className="text-emerald-500" />, text: "text-emerald-600" },
  purchase: { bg: "bg-red-50", border: "border-red-100", icon: <ArrowUpRight size={16} className="text-red-500" />, text: "text-red-600" },
  adjustment: { bg: "bg-slate-50", border: "border-slate-100", icon: <DollarSign size={16} className="text-slate-500" />, text: "text-slate-600" },
};

export function WalletDashboard() {
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<LedgerTx[]>([]);
  const [pending, setPending] = useState<PendingTopup[]>([]);
  const [loading, setLoading] = useState(true);

  const [payConfig, setPayConfig] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [topupBusy, setTopupBusy] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [w, cfg] = await Promise.all([
        fetch("/api/wallet", { credentials: "same-origin" }).then((r) => r.json()),
        fetch("/api/payments/config").then((r) => r.json()).catch(() => null),
      ]);
      setBalance(Number(w.wallet?.balance ?? w.balance) || 0);
      setLedger(w.transactions || []);
      setPending(w.pending_topups || []);
      if (cfg) setPayConfig(cfg);
    } catch {
      toast.error("Could not load wallet");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const totalIn = ledger.filter((t) => Number(t.amount) > 0).reduce((a, t) => a + Number(t.amount), 0);
  const totalOut = ledger.filter((t) => Number(t.amount) < 0).reduce((a, t) => a + Math.abs(Number(t.amount)), 0);

  // Card top-up: ask the server for a Stripe Checkout session for this
  // amount, then hand the browser to Stripe. The balance moves only when
  // Stripe's webhook confirms the payment — never on this click.
  async function startCardTopup() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
    setTopupBusy(true);
    try {
      const res = await fetch("/api/payments/stripe/topup-session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Could not start the card top-up");
      window.location.href = json.url;
    } catch (err: any) {
      toast.error(err.message);
      setTopupBusy(false);
    }
  }

  function timeAgo(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <RefreshCw className="animate-spin text-primary-600" size={28} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Wallet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Balance hero */}
      <div className="relative bg-[#0C2254] rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4751F]/15 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Wallet Balance</p>
              <p className="text-[10px] font-bold text-white/70">Spendable on any order</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">${balance.toFixed(2)}</div>
          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">USD · Updated in real time</p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Total Credited", value: `$${totalIn.toFixed(2)}`, icon: <ArrowDownLeft size={14} /> },
              { label: "Total Spent", value: `$${totalOut.toFixed(2)}`, icon: <ShoppingBag size={14} /> },
              { label: "Pending Top-ups", value: pending.length, icon: <Clock size={14} /> },
            ].map((s, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-white/50 flex justify-center mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top-up (by card) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-primary-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Add Money (Card)</h3>
        </div>
        {payConfig && !payConfig.stripe?.enabled ? (
          <p className="text-sm text-slate-400 font-medium">Card top-ups are not available yet — card payments are being set up for this store. Refunds still credit here automatically.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" max="1000" step="0.01" placeholder="Amount (USD)" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
              <button disabled={topupBusy} onClick={startCardTopup} className="px-6 py-3.5 bg-[#0C2254] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {topupBusy ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />} Add Money by Card
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">You will be redirected to Stripe's secure checkout to pay by card. Your balance is credited as soon as Stripe confirms the payment.</p>
          </>
        )}

        {pending.length > 0 && (
          <div className="space-y-2 pt-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold text-amber-800">${Number(p.amount).toFixed(2)} top-up request</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Clock size={11} /> Awaiting verification</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-primary-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Wallet Ledger</h3>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ledger.length} Records</span>
        </div>
        {ledger.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">No wallet activity yet</p>
            <p className="text-[11px] text-slate-300 mt-1">Top-ups, purchases and refunds will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto custom-scrollbar">
            {ledger.map((tx, i) => {
              const cfg = txStyle[tx.type] || txStyle.adjustment;
              const amt = Number(tx.amount);
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all">
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{tx.description || tx.type}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.type} · {timeAgo(tx.created_at)}{tx.balance_after !== null && ` · Balance $${Number(tx.balance_after).toFixed(2)}`}</p>
                  </div>
                  <span className={`text-sm font-black ${cfg.text}`}>{amt >= 0 ? "+" : "−"}${Math.abs(amt).toFixed(2)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
