import React from "react";
import { CreditCard, ArrowUpRight, Download, ExternalLink } from "lucide-react";

export function AdminTransactions() {
  const txns = [
    { id: "TXN_77829901", amount: "$14.99", method: "Stripe", status: "Successful", date: "Feb 26, 2026 14:32" },
    { id: "TXN_77818802", amount: "$29.00", method: "Stripe", status: "Successful", date: "Feb 25, 2026 09:12" },
    { id: "TXN_77807703", amount: "$12.00", method: "Stripe", status: "Pending", date: "Feb 25, 2026 08:45" },
    { id: "TXN_77796604", amount: "$19.99", method: "Stripe", status: "Successful", date: "Feb 24, 2026 23:58" },
  ];

  return (
    <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Financial Transmission</h3>
                <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Monitor all digital asset valuations</p>
            </div>
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                <Download size={18} />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Transmission ID</th>
                    <th className="px-8 py-5">Amount</th>
                    <th className="px-8 py-5">Protocol</th>
                    <th className="px-8 py-5">Resolution</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {txns.map((txn, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5 font-bold text-dark-50/40 text-xs tracking-tight flex items-center gap-2">
                            {txn.id}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-8 py-5 font-bold text-white text-sm">{txn.amount}</td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-primary-500/10 flex items-center justify-center text-primary-400">
                                    <CreditCard size={12} />
                                </div>
                                <span className="text-xs font-semibold text-dark-50/60">{txn.method}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            txn.status === "Successful" ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                            {txn.status}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-dark-50/40 text-xs">{txn.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
