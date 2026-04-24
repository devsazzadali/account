import React, { useEffect, useState } from "react";
import { Download, ChevronDown, Zap, Loader2, Search } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminOrders() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(title)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => {
      if (filter === "All") return true;
      return o.status === filter;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-slate-900">Orders</h2>
                <p className="text-[13px] text-slate-500 font-medium">Manage and fulfill your customer's digital acquisitions.</p>
            </div>
            <button 
               onClick={fetchOrders}
               className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            >
                <Download size={18} />
            </button>
        </div>

        {/* Orders Table - Shopify Style */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                <div className="flex gap-2">
                    {["All", "Paid", "Pending", "Delivered"].map((st) => (
                        <button 
                            key={st}
                            onClick={() => setFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filter === st ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
                <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Filter orders" 
                      className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:border-slate-400 transition-all"
                    />
                    <Search className="absolute left-3 top-2 text-slate-400" size={14} />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 w-12 text-center">
                                <input type="checkbox" className="rounded border-slate-300" />
                            </th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Order</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Date</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Customer</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Total</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Payment</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">Fulfillment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={7} className="p-20 text-center text-slate-400 text-sm font-medium">Loading orders...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={7} className="p-20 text-center text-slate-400 text-sm font-medium">No orders found</td></tr>
                        ) : filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-4 border-b border-slate-50 text-center">
                                    <input type="checkbox" className="rounded border-slate-300" />
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-sm font-bold text-slate-900">
                                    #{order.id.split('-')[0].toUpperCase()}
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-xs font-medium text-slate-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50">
                                    <div className="text-sm font-bold text-slate-900">{order.customer_email.split('@')[0]}</div>
                                    <div className="text-[11px] text-slate-500 font-medium truncate max-w-[150px]">{order.customer_email}</div>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50 text-sm font-bold text-slate-900">
                                    ${Number(order.total_price).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                        order.status === "Paid" || order.status === "Delivered" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {order.status === "Paid" || order.status === "Delivered" ? "Paid" : "Pending"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-b border-slate-50">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                        order.status === "Delivered" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                                    }`}>
                                        {order.status === "Delivered" ? "Fulfilled" : "Unfulfilled"}
                                    </span>
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
