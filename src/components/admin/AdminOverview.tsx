import React from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Zap, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  Settings as SettingsIcon,
  Search,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";

export function AdminOverview() {
  const stats = [
    { title: "Net Revenue", value: "$12,845.00", change: "+18.2%", positive: true, icon: <DollarSign size={20} />, color: "text-primary-400", bg: "bg-primary-500/10" },
    { title: "Active Sales", value: "84", change: "+5.4%", positive: true, icon: <ShoppingCart size={20} />, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Total Inventory", value: "342", change: "+12", positive: true, icon: <Package size={20} />, color: "text-purple-400", bg: "bg-purple-500/10" },
    { title: "Dispute Rate", value: "0.2%", change: "-0.1%", positive: true, icon: <ShieldCheck size={20} />, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/2 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-3xl font-display font-bold text-white mb-2">Command Center</h2>
              <p className="text-dark-50/40 text-xs font-bold uppercase tracking-[0.2em]">Operational Oversight & Settlement Monitoring</p>
          </div>
          <div className="flex gap-3 relative z-10">
              <button className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20">
                  <Plus size={16} />
                  New Listing
              </button>
              <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/10 transition-all">
                  Generate Report
              </button>
          </div>
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[80px] rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bg} rounded-xl ${stat.color} transition-colors group-hover:scale-110 duration-500`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.positive ? "text-green-400" : "text-red-400"}`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-dark-50/30 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.title}</h3>
              <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 blur-2xl ${stat.bg}`}></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sales Table */}
          <div className="lg:col-span-2 glass-card rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Live Sales Feed</h3>
                    <p className="text-[10px] text-dark-50/30 uppercase tracking-widest font-bold">Latest marketplace acquisitions</p>
                </div>
                <button className="p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                    <ExternalLink size={16} className="text-dark-50/40" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-dark-50/20 text-[9px] font-bold uppercase tracking-widest border-b border-white/5">
                    <tr>
                        <th className="px-8 py-5">Order</th>
                        <th className="px-8 py-5">Destination</th>
                        <th className="px-8 py-5">Asset</th>
                        <th className="px-8 py-5">Settlement</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                    {[
                        { id: "#7782", email: "jishan@titan.io", product: "Valorant Radiant", price: "$450.00", status: "Delivered" },
                        { id: "#7781", email: "alex@gaming.net", product: "LOL Master", price: "$12.50", status: "Paid" },
                        { id: "#7780", email: "sarah@crypto.com", product: "GTA Modded", price: "$35.00", status: "Processing" },
                        { id: "#7779", email: "titan@store.one", product: "Roblox 100k", price: "$850.00", status: "Delivered" },
                    ].map((order, i) => (
                        <tr key={i} className="hover:bg-white/2 transition-colors">
                            <td className="px-8 py-5 font-bold text-dark-50/40 text-[10px]">{order.id}</td>
                            <td className="px-8 py-5 font-medium text-white/60 text-xs">{order.email}</td>
                            <td className="px-8 py-5">
                                <div className="text-xs font-bold text-white">{order.product}</div>
                                <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                                    order.status === "Delivered" ? "text-primary-400" : "text-yellow-400"
                                }`}>{order.status}</div>
                            </td>
                            <td className="px-8 py-5 font-bold text-white text-xs">{order.price}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Alerts & Quick Actions */}
          <div className="space-y-6">
              {/* Critical Alerts */}
              <div className="glass-card rounded-[2rem] p-8 border border-white/5 bg-red-500/5 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                          <AlertCircle size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Stock Alerts</h3>
                  </div>
                  <div className="space-y-4">
                      <div className="p-4 bg-dark-900/50 rounded-2xl border border-red-500/20">
                          <div className="text-xs font-bold text-white mb-1">Valorant Smurfs</div>
                          <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Low Stock: 2 Units Left</div>
                      </div>
                      <div className="p-4 bg-dark-900/50 rounded-2xl border border-white/5">
                          <div className="text-xs font-bold text-white mb-1">GTA Modded</div>
                          <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest">Optimal: 15 Units</div>
                      </div>
                  </div>
              </div>

              {/* System Integrity */}
              <div className="glass-card rounded-[2rem] p-8 border border-white/5">
                  <h3 className="text-[10px] font-bold text-dark-50/30 uppercase tracking-[0.2em] mb-6">System Integrity</h3>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Zap size={16} className="text-yellow-400" />
                              <span className="text-xs font-bold text-white">Payment Gateway</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <ShieldCheck size={16} className="text-primary-400" />
                              <span className="text-xs font-bold text-white">Escrow Protocol</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                      </div>
                      <div className="pt-4 border-t border-white/5">
                          <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                              Run Diagnostics
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
