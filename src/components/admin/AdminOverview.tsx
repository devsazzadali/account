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
  Loader2,
  Calendar,
  ShoppingBag,
  User
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
    <div className="space-y-6">
      {/* Home Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
              <h2 className="text-xl font-bold text-slate-900">Home</h2>
              <p className="text-[13px] text-slate-500 font-medium">Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              <Calendar size={14} />
              Last 30 days: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Today
          </div>
      </div>

      {/* Today's Stats - Shopify Style */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Today's Performance</h3>
              <button onClick={fetchDashboardData} className="text-slate-400 hover:text-slate-900 transition-all">
                  <Loader2 size={16} className={loading ? "animate-spin" : ""} />
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {stats.map((stat, i) => (
                  <div key={i} className="p-6 hover:bg-slate-50/50 transition-all group">
                      <div className="flex justify-between items-start mb-1">
                          <span className="text-[12px] font-semibold text-slate-500">{stat.title}</span>
                          <span className={`text-[11px] font-bold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                              {stat.change}
                          </span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                      {/* Simple Sparkline Placeholder */}
                      <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "60%" }}
                            className={`h-full ${stat.positive ? "bg-primary-500" : "bg-red-500"}`}
                          />
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed / Chart */}
          <div className="lg:col-span-2 space-y-6">
              {/* Next Steps / Tasks */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-[14px] font-bold text-slate-900 mb-4">Next steps for your store</h3>
                  <div className="space-y-3">
                      {recentOrders.filter(o => o.status !== "Delivered").length > 0 && (
                        <div className="flex items-center gap-4 p-4 bg-primary-50/30 rounded-xl border border-primary-100">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
                                <ShoppingBag size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[13px] font-bold text-slate-900">Fulfill {recentOrders.filter(o => o.status !== "Delivered").length} orders</h4>
                                <p className="text-[12px] text-slate-500 font-medium">You have orders waiting for digital delivery.</p>
                            </div>
                            <button 
                                onClick={() => setActiveTab?.('orders')}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-900 hover:bg-slate-50 transition-all"
                            >
                                View Orders
                            </button>
                        </div>
                      )}
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600">
                              <Plus size={20} />
                          </div>
                          <div className="flex-1">
                              <h4 className="text-[13px] font-bold text-slate-900">Add more products</h4>
                              <p className="text-[12px] text-slate-500 font-medium">Expand your catalog to reach more customers.</p>
                          </div>
                          <button 
                             onClick={() => setActiveTab?.('products')}
                             className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-900 hover:bg-slate-50 transition-all"
                          >
                              Add Product
                          </button>
                      </div>
                  </div>
              </div>

              {/* Sales Chart Area */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[14px] font-bold text-slate-900">Total Sales</h3>
                      <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                      </div>
                  </div>
                  <div className="h-64 flex items-end gap-2 px-2">
                      {[40, 70, 45, 90, 65, 85, 100, 75, 55, 95, 80, 110].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                className="w-full bg-slate-100 rounded-t-sm group-hover:bg-primary-500 transition-colors relative"
                              >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                      ${h * 12}
                                  </div>
                              </motion.div>
                              <span className="text-[9px] font-bold text-slate-300">{i + 1}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Activity Sidebar */}
          <div className="space-y-6">
              {/* Recent Sales Feed */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                      {recentOrders.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-[12px] font-medium italic">No recent activity</div>
                      ) : recentOrders.slice(0, 5).map((order, i) => (
                          <div key={i} className="p-4 hover:bg-slate-50 transition-all flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                                  <User size={14} />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                  <p className="text-[12px] text-slate-900 leading-tight">
                                      <span className="font-bold">New order</span> from {order.customer_email.split('@')[0]}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{order.products?.title}</p>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight block mt-1">Just now</span>
                              </div>
                              <div className="text-[12px] font-bold text-slate-900">
                                  ${Number(order.total_price).toFixed(2)}
                              </div>
                          </div>
                      ))}
                  </div>
                  <button 
                    onClick={() => setActiveTab?.('orders')}
                    className="w-full p-3 text-[11px] font-bold text-primary-600 hover:bg-slate-50 border-t border-slate-100 transition-all"
                  >
                      View all activity
                  </button>
              </div>

              {/* Inventory Alerts */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-500" />
                      Inventory Alert
                  </h3>
                  <div className="space-y-4">
                      {lowStockProducts.length === 0 ? (
                          <p className="text-[11px] text-slate-400 font-medium italic text-center py-2">All items are in stock</p>
                      ) : lowStockProducts.slice(0, 3).map((p, i) => (
                          <div key={i} className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab?.('products')}>
                              <div className="overflow-hidden">
                                  <p className="text-[12px] font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{p.title}</p>
                                  <p className="text-[11px] text-slate-500 font-medium">{p.stock} remaining</p>
                              </div>
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
