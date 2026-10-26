"use client";

// AccountStoreOne — wallet dashboard (REAL wallet, completion build).
// Balance and history come from /api/wallet: the balance is the wallets
// row, the history is the append-only wallet_transactions ledger. Top-ups
// use the same manual TrxID verification as order payments: the buyer
// sends money to the store number, submits the TrxID, and the balance is
// credited only after an admin approves it in the verification queue.
// Refunds from orders/disputes also land here as ledger credits.

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock,
  ShoppingBag, RefreshCw, DollarSign, Shield, Loader2, Copy, Check
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
  method: string;
  amount: number;
  trx_id: string;
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
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState("");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      if (cfg) {
        setPayConfig(cfg);
        if (!cfg.manual?.bkashNumber && cfg.manual?.nagadNumber) setMethod("nagad");
      }
    } catch {
      toast.error("Could not load wallet");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const manualNumber = method === "bkash" ? payConfig?.manual?.bkashNumber : payConfig?.manual?.nagadNumber;
  const totalIn = ledger.filter((t) => Number(t.amount) > 0).reduce((a, t) => a + Number(t.amount), 0);
  const totalOut = ledger.filter((t) => Number(t.amount) < 0).reduce((a, t) => a + Math.abs(Number(t.amount)), 0);

  async function submitTopup() {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter an amount"); return; }
    if (trxId.trim().length < 6) { toast.error("Enter the Transaction ID"); return; }
    if (senderNumber.trim().length < 6) { toast.error("Enter your sender number"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method, trxId: trxId.trim(), senderNumber: senderNumber.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Top-up failed");
      toast.success("Top-up submitted — balance updates after verification");
      setAmount(""); setTrxId(""); setSenderNumber("");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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

      {/* Top-up */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign size={16} className="text-primary-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Add Money (Manual Verification)</h3>
        </div>
        {payConfig && !payConfig.manual?.bkashNumber && !payConfig.manual?.nagadNumber ? (
          <p className="text-sm text-slate-400 font-medium">Top-ups are unavailable right now — the store has not published a payment number. Refunds still credit here automatically.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {payConfig?.manual?.bkashNumber && (
                <button onClick={() => setMethod("bkash")} className={`p-3.5 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${method === "bkash" ? "bg-primary-50 border-primary-300 text-primary-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>bKash</button>
              )}
              {payConfig?.manual?.nagadNumber && (
                <button onClick={() => setMethod("nagad")} className={`p-3.5 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${method === "nagad" ? "bg-primary-50 border-primary-300 text-primary-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>Nagad</button>
              )}
            </div>
            {manualNumber && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-slate-500">Send money to:</span>
                <span className="text-base font-black tracking-wider text-[#0C2254] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">{manualNumber}</span>
                <button onClick={() => { navigator.clipboard.writeText(manualNumber); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all">
                  {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" step="0.01" placeholder="Amount (USD)" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
              <input value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="Transaction ID (TrxID)" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
              <input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Your sender number" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
            </div>
            <button disabled={submitting} onClick={submitTopup} className="w-full py-3.5 bg-[#0C2254] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />} Submit Top-up for Verification
            </button>
            <p className="text-[10px] text-slate-400 font-medium">Your balance is credited only after the store verifies the Transaction ID — usually within a few hours.</p>
          </>
        )}

        {pending.length > 0 && (
          <div className="space-y-2 pt-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                <span className="text-xs font-bold text-amber-800">${Number(p.amount).toFixed(2)} via {p.method} · TrxID {p.trx_id}</span>
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
