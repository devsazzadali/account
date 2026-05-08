import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Clock,
  ShoppingBag, RefreshCw, DollarSign, BarChart2, Shield, ChevronRight
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface TxItem {
  id: string;
  type: "purchase" | "refund" | "topup";
  title: string;
  amount: number;
  created_at: string;
  status: string;
}

interface SpendPoint { month: string; total: number; }

const txColor = {
  purchase: { bg: "bg-red-50",     border: "border-red-100",     icon: <ArrowUpRight size={16} className="text-red-500" />,     text: "text-red-600",   sign: "-" },
  refund:   { bg: "bg-emerald-50", border: "border-emerald-100", icon: <ArrowDownLeft size={16} className="text-emerald-500" />, text: "text-emerald-600",sign: "+" },
  topup:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: <DollarSign size={16} className="text-blue-500" />,       text: "text-blue-600",  sign: "+" },
};

export function WalletDashboard() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [spendPoints, setSpendPoints] = useState<SpendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const username = localStorage.getItem("username") || "";

    const { data: orders } = await supabase
      .from("orders")
      .select("id, status, total_price, created_at, products(title)")
      .eq("username", username)
      .order("created_at", { ascending: false })
      .limit(20);

    if (orders) {
      // Build transaction list
      const txs: TxItem[] = orders.map((o: any) => ({
        id: o.id,
        type: o.status === "refunded" ? "refund" : "purchase",
        title: o.products?.title || "Digital Product",
        amount: Number(o.total_price),
        created_at: o.created_at,
        status: o.status,
      }));
      setTransactions(txs);
      setTotalOrders(orders.length);

      // Total spent (purchases only)
      const spent = orders
        .filter((o: any) => o.status !== "refunded")
        .reduce((acc: number, o: any) => acc + Number(o.total_price), 0);
      setTotalSpent(spent);

      // Build monthly spend chart for last 6 months
      const now = new Date();
      const monthly: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleString("default", { month: "short" });
        monthly[key] = 0;
      }
      orders.forEach((o: any) => {
        if (o.status !== "refunded") {
          const month = new Date(o.created_at).toLocaleString("default", { month: "short" });
          if (monthly[month] !== undefined) monthly[month] += Number(o.total_price);
        }
      });
      setSpendPoints(Object.entries(monthly).map(([month, total]) => ({ month, total })));
    }
    setLoading(false);
  }

  const maxSpend = Math.max(...spendPoints.map(p => p.total), 1);

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

      {/* Wallet Hero Card */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Total Spending</p>
              <p className="text-[10px] font-bold text-white/70">Your Activity Overview</p>
            </div>
          </div>
          <div className="text-4xl font-black text-white mb-1">${totalSpent.toFixed(2)}</div>
          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">USD · All Time</p>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: "Orders",       value: totalOrders,                  icon: <ShoppingBag size={14} /> },
              { label: "Delivered",    value: transactions.filter(t => t.status === "Completed").length, icon: <Shield size={14} /> },
              { label: "Avg. Order",   value: `$${totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00"}`, icon: <TrendingUp size={14} /> },
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

      {/* Spending Chart */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={16} className="text-primary-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Monthly Spending (6 Months)</h3>
        </div>
        {spendPoints.every(p => p.total === 0) ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-sm font-bold text-slate-300">No spending data yet</p>
          </div>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {spendPoints.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end" style={{ height: "96px" }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((p.total / maxSpend) * 96, p.total > 0 ? 4 : 0)}px` }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-xl ${p.total > 0 ? "bg-primary-500" : "bg-slate-100"}`}
                    title={`$${p.total.toFixed(2)}`}
                  />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase">{p.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Feed */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-primary-600" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Transaction History</h3>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{transactions.length} Records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto custom-scrollbar">
            {transactions.map((tx, i) => {
              const cfg = txColor[tx.type];
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all"
                >
                  <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{tx.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        {tx.type}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{timeAgo(tx.created_at)}</span>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${cfg.text} shrink-0`}>
                    {cfg.sign}${tx.amount.toFixed(2)}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
