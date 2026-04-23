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
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Financial Transmission</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Monitor all digital asset valuations</p>
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                <Download size={18} />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/20 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                <tr>
                    <th className="px-8 py-5">Transmission ID</th>
                    <th className="px-8 py-5">Amount</th>
                    <th className="px-8 py-5">Protocol</th>
                    <th className="px-8 py-5">Resolution</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {txns.map((txn, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 font-bold text-slate-400 text-[10px] tracking-tight flex items-center gap-2">
                            {txn.id}
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-900 text-sm">{txn.amount}</td>
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-primary-600 border border-slate-200 shadow-sm">
                                    <CreditCard size={14} />
                                </div>
                                <span className="text-xs font-bold text-slate-600">{txn.method}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                            txn.status === "Successful" ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-yellow-50 text-yellow-600 border-yellow-100"
                            }`}>
                            {txn.status}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-slate-400 text-[10px]">{txn.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
}
