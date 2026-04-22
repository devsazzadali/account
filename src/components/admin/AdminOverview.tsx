import React from "react";
import { DollarSign, ShoppingCart, Package, Users, ArrowUpRight, ArrowDownRight, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";

export function AdminOverview() {
  const stats = [
    { title: "Total Revenue", value: "$48,295.50", change: "+24.5%", positive: true, icon: <DollarSign size={24} />, color: "text-primary-400", bg: "bg-primary-500/10" },
    { title: "Total Orders", value: "1,245", change: "+12.2%", positive: true, icon: <ShoppingCart size={24} />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Total Products", value: "156", change: "+5.1%", positive: true, icon: <Package size={24} />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { title: "Total Customers", value: "8,492", change: "-2.4%", positive: false, icon: <Users size={24} />, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bg} rounded-2xl ${stat.color} transition-colors group-hover:scale-110 duration-500`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-dark-50/30 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</h3>
              <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
            </div>
            {/* Background Accent */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 blur-2xl ${stat.bg}`}></div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Recent Transactions</h3>
                <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Latest marketplace activity</p>
            </div>
            <button className="text-xs font-bold text-primary-400 hover:text-primary-300 uppercase tracking-widest">View All Ledger</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Order ID</th>
                    <th className="px-8 py-5">Customer Email</th>
                    <th className="px-8 py-5">Product Name</th>
                    <th className="px-8 py-5">Valuation</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                {[
                    { id: "#ORD-7782", email: "jishan@titan.io", product: "Netflix Premium UHD", price: "$14.99", status: "Delivered" },
                    { id: "#ORD-7781", email: "alex@gaming.net", product: "Spotify Master Key", price: "$29.00", status: "Paid" },
                    { id: "#ORD-7780", email: "sarah@crypto.com", product: "NordVPN Private Key", price: "$12.00", status: "Pending" },
                    { id: "#ORD-7779", email: "titan@store.one", product: "Disney+ Bundle", price: "$19.99", status: "Delivered" },
                ].map((order, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5 font-bold text-dark-50/40 text-xs tracking-tight">{order.id}</td>
                        <td className="px-8 py-5 font-medium text-white/80 text-sm">{order.email}</td>
                        <td className="px-8 py-5 font-bold text-white text-sm">{order.product}</td>
                        <td className="px-8 py-5 font-bold text-white text-sm">{order.price}</td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            order.status === "Delivered" ? "bg-primary-500/10 text-primary-400 border-primary-500/20" : 
                            order.status === "Paid" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : 
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}>
                            {order.status}
                            </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                            <button className="p-2 text-dark-50/20 hover:text-white transition-colors"><MoreVertical size={16} /></button>
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
