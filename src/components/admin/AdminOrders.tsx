import React, { useState } from "react";
import { Filter, Search, Download, ChevronDown } from "lucide-react";

export function AdminOrders() {
  const [filter, setFilter] = useState("All");

  const orders = [
    { id: "#ORD-7782", customer: "Jishan Ali", product: "Netflix Premium", payment: "Paid", delivery: "Delivered", date: "Feb 26, 2026" },
    { id: "#ORD-7781", customer: "Alex Doe", product: "Spotify Master", payment: "Paid", delivery: "Pending", date: "Feb 25, 2026" },
    { id: "#ORD-7780", customer: "Sarah Smith", product: "NordVPN Key", payment: "Pending", delivery: "Pending", date: "Feb 25, 2026" },
    { id: "#ORD-7779", customer: "Titan Gamer", product: "Disney+ Bundle", payment: "Paid", delivery: "Delivered", date: "Feb 24, 2026" },
  ];

  return (
    <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Transaction Ledger</h3>
                <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Monitor fulfillment and payment status</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none bg-white/5 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-xs font-bold uppercase tracking-widest text-dark-50/60 focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer"
                    >
                        <option value="All">All Transactions</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-dark-50/30 pointer-events-none" size={14} />
                </div>
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                    <Download size={18} />
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Customer</th>
                    <th className="px-8 py-5">Product</th>
                    <th className="px-8 py-5">Payment</th>
                    <th className="px-8 py-5">Delivery</th>
                    <th className="px-8 py-5 text-right">Timestamp</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {orders.filter(o => filter === "All" || o.payment === filter || o.delivery === filter).map((order, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5 font-bold text-dark-50/40 text-xs tracking-tight">{order.id}</td>
                        <td className="px-8 py-5 font-bold text-white text-sm">{order.customer}</td>
                        <td className="px-8 py-5 font-medium text-dark-50/60 text-sm">{order.product}</td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            order.payment === "Paid" ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                            {order.payment}
                            </span>
                        </td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            order.delivery === "Delivered" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}>
                            {order.delivery}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right font-medium text-dark-50/40 text-xs">{order.date}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
