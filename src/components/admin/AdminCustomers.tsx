import React from "react";
import { User, Mail, Calendar, MoreVertical, ShieldCheck } from "lucide-react";

export function AdminCustomers() {
  const customers = [
    { name: "Jishan Ali", email: "jishan@titan.io", joined: "Jan 12, 2026", orders: 45, spent: "$1,240.00" },
    { name: "Alex Doe", email: "alex@gaming.net", joined: "Feb 05, 2026", orders: 12, spent: "$350.00" },
    { name: "Sarah Smith", email: "sarah@crypto.com", joined: "Feb 10, 2026", orders: 8, spent: "$45.00" },
    { name: "Titan Gamer", email: "titan@store.one", joined: "Feb 20, 2026", orders: 156, spent: "$4,295.50" },
  ];

  return (
    <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Member Directory</h3>
                <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Manage your acquisition base</p>
            </div>
            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-dark-50/60 hover:text-white transition-all">Export Directory</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Member</th>
                    <th className="px-8 py-5">Communication</th>
                    <th className="px-8 py-5">Joined Date</th>
                    <th className="px-8 py-5">Order Vol</th>
                    <th className="px-8 py-5">Total Value</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {customers.map((customer, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                                    <User size={18} />
                                </div>
                                <span className="font-bold text-white text-sm">{customer.name}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5 font-medium text-dark-50/60 text-sm italic">{customer.email}</td>
                        <td className="px-8 py-5 font-medium text-dark-50/40 text-xs">{customer.joined}</td>
                        <td className="px-8 py-5 font-bold text-white text-sm">{customer.orders}</td>
                        <td className="px-8 py-5 font-bold text-primary-400 text-sm">{customer.spent}</td>
                        <td className="px-8 py-5 text-right">
                            <button className="p-2 text-dark-50/20 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
