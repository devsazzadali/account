import React, { useEffect, useState } from "react";
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
  ExternalLink,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { title: "Net Revenue", value: "$0.00", change: "+0%", positive: true, icon: <DollarSign size={20} />, color: "text-primary-600", bg: "bg-primary-50" },
    { title: "Active Sales", value: "0", change: "+0%", positive: true, icon: <ShoppingCart size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Total Inventory", value: "0", change: "+0", positive: true, icon: <Package size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Dispute Rate", value: "0.0%", change: "0%", positive: true, icon: <ShieldCheck size={20} />, color: "text-green-600", bg: "bg-green-50" },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
        setLoading(true);
        // Fetch stats
        const { data: orders } = await supabase.from('orders').select('total_price, status, created_at').order('created_at', { ascending: false });
        const { data: products } = await supabase.from('products').select('stock, title');

        const totalRevenue = orders?.reduce((acc, o) => acc + Number(o.total_price), 0) || 0;
        const activeSales = orders?.length || 0;
        const totalInventory = products?.reduce((acc, p) => acc + Number(p.stock), 0) || 0;

        setStats([
            { title: "Net Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+100%", positive: true, icon: <DollarSign size={20} />, color: "text-primary-600", bg: "bg-primary-50" },
            { title: "Active Sales", value: activeSales.toString(), change: "+100%", positive: true, icon: <ShoppingCart size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
            { title: "Total Inventory", value: totalInventory.toString(), change: `+${products?.length || 0}`, positive: true, icon: <Package size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
            { title: "Dispute Rate", value: "0.0%", change: "0%", positive: true, icon: <ShieldCheck size={20} />, color: "text-green-600", bg: "bg-green-50" },
        ]);

        // Fetch recent orders
        const { data: recent } = await supabase
            .from('orders')
            .select('*, products(title)')
            .order('created_at', { ascending: false })
            .limit(5);
        setRecentOrders(recent || []);

        // Low stock products
        const lowStock = products?.filter(p => p.stock < 5).slice(0, 3) || [];
        setLowStockProducts(lowStock);

    } catch (err: any) {
        console.error("Dashboard Fetch Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden shadow-sm">
          <div className="relative z-10">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 italic">Command Center</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Operational Oversight & Settlement Monitoring</p>
          </div>
          <div className="flex gap-3 relative z-10">
              <button onClick={fetchDashboardData} className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-3 rounded-2xl border border-slate-200 transition-all shadow-sm">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              </button>
              <button 
                onClick={() => setActiveTab?.('products')}
                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20"
              >
                  <Plus size={16} />
                  New Listing
              </button>
          </div>
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.bg} rounded-xl ${stat.color} transition-colors group-hover:scale-110 duration-500 border border-slate-100/50`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change}
              </div>
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.title}</h3>
              <div className="text-2xl font-display font-bold text-slate-900 leading-none">{stat.value}</div>
            </div>
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl ${stat.bg}`}></div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Sales Table */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Live Sales Feed</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Latest marketplace acquisitions</p>
                </div>
                <button className="p-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                    <ExternalLink size={16} className="text-slate-400" />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100 bg-slate-50/20">
                    <tr>
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-8 py-5">Receiver</th>
                        <th className="px-8 py-5">Asset</th>
                        <th className="px-8 py-5">Settlement</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">Synchronizing Transmission...</td></tr>
                    ) : recentOrders.length === 0 ? (
                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No Active Transmissions Found</td></tr>
                    ) : recentOrders.map((order, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5 font-bold text-slate-400 text-[10px] truncate max-w-[100px]">{order.id.split('-')[0].toUpperCase()}</td>
                            <td className="px-8 py-5 font-medium text-slate-600 text-xs truncate max-w-[150px]">{order.customer_email}</td>
                            <td className="px-8 py-5">
                                <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{order.products?.title || "Unknown Asset"}</div>
                                <div className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${
                                    order.status === "Delivered" ? "text-primary-600" : "text-yellow-600"
                                }`}>{order.status}</div>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-900 text-xs">${Number(order.total_price).toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          </div>

          {/* Alerts & Quick Actions */}
          <div className="space-y-6">
              {/* Critical Alerts */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-red-100 bg-red-50/30 relative overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200/50">
                          <AlertCircle size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Stock Alerts</h3>
                  </div>
                  <div className="space-y-4">
                      {lowStockProducts.length === 0 && (
                          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center py-4">All assets secured.</p>
                      )}
                      {lowStockProducts.map((p, i) => (
                          <div key={i} className="p-4 bg-white rounded-2xl border border-red-200/50 shadow-sm">
                              <div className="text-xs font-bold text-slate-900 mb-1 truncate">{p.title}</div>
                              <div className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Critical Stock: {p.stock} Units</div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* System Integrity */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">System Integrity</h3>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <Zap size={16} className="text-yellow-500" />
                              <span className="text-xs font-bold text-slate-900">Payment Gateway</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <ShieldCheck size={16} className="text-primary-600" />
                              <span className="text-xs font-bold text-slate-900">Escrow Protocol</span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                          <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-slate-600 border border-slate-200/50 shadow-sm">
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
