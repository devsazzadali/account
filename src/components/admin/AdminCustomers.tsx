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
    <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm relative">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Member Directory</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Manage your acquisition base</p>
            </div>
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all shadow-sm">Export Directory</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/20 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                <tr>
                    <th className="px-8 py-5">Member</th>
                    <th className="px-8 py-5">Communication</th>
                    <th className="px-8 py-5">Joined Date</th>
                    <th className="px-8 py-5">Order Vol</th>
                    <th className="px-8 py-5">Total Value</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {customers.map((customer, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform border border-slate-200 shadow-sm">
                                    <User size={18} />
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
                            </div>
                        </td>
                        <td className="px-8 py-5 font-bold text-slate-600 text-xs italic">{customer.email}</td>
                        <td className="px-8 py-5 font-bold text-slate-400 text-[10px]">{customer.joined}</td>
                        <td className="px-8 py-5 font-bold text-slate-900 text-sm">{customer.orders}</td>
                        <td className="px-8 py-5 font-bold text-primary-600 text-sm">{customer.spent}</td>
                        <td className="px-8 py-5 text-right">
                            <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreVertical size={16} /></button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        {/* Background Decoration */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
    </div>
  );
}
