import React from "react";
import { User, Mail, Calendar, MoreVertical, ShieldCheck, Search, Filter } from "lucide-react";

export function AdminCustomers() {
  const customers = [
    { name: "Jishan Ali", email: "jishan@titan.io", joined: "Jan 12, 2026", orders: 45, spent: "$1,240.00" },
    { name: "Alex Doe", email: "alex@gaming.net", joined: "Feb 05, 2026", orders: 12, spent: "$350.00" },
    { name: "Sarah Smith", email: "sarah@crypto.com", joined: "Feb 10, 2026", orders: 8, spent: "$45.00" },
    { name: "Titan Gamer", email: "titan@store.one", joined: "Feb 20, 2026", orders: 156, spent: "$4,295.50" },
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Customers</h2>
                <p className="text-[13px] text-slate-500 font-medium">Manage your acquisition base and view customer insights.</p>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all flex items-center gap-2">
                <Mail size={16} />
                Email customers
            </button>
        </div>

        {/* Customers Table - Shopify Style */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Search customers" 
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-400 transition-all"
                    />
                    <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                </div>
                <button className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-white transition-all flex items-center gap-2">
                    <Filter size={14} />
                    Filters
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 w-12 text-center">
                                <input type="checkbox" className="rounded border-slate-300" />
                            </th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Customer Name</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Location</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Orders</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Amount Spent</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {customers.map((customer, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 border-b border-slate-50 text-center">
                                    <input type="checkbox" className="rounded border-slate-300" />
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 font-bold text-xs uppercase tracking-tighter">
                                            {customer.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{customer.name}</div>
                                            <div className="text-[11px] text-slate-500 font-medium">{customer.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-xs font-medium text-slate-500 italic">
                                    Verified Protocol
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-sm font-medium text-slate-600">
                                    {customer.orders} orders
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-sm font-bold text-slate-900">
                                    {customer.spent}
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-right">
                                    <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
