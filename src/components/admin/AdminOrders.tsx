import React, { useEffect, useState } from "react";
import { Download, ChevronDown, Zap, Loader2 } from "lucide-react";
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
    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Transaction Ledger</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Monitor fulfillment and payment status</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <select 
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-2xl pl-4 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 focus:outline-none focus:border-primary-500 transition-all cursor-pointer shadow-sm"
                    >
                        <option value="All">All Transactions</option>
                        <option value="Paid">Settled</option>
                        <option value="Pending">Escrow</option>
                        <option value="Delivered">Transmitted</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-slate-300 pointer-events-none" size={14} />
                </div>
                <button onClick={fetchOrders} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            {loading ? (
                <div className="p-20 text-center">
                    <Loader2 size={48} className="animate-spin text-primary-500 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">Accessing Transaction Log...</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-bold uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="px-8 py-5">Order ID</th>
                        <th className="px-8 py-5">Receiver</th>
                        <th className="px-8 py-5">Digital Asset</th>
                        <th className="px-8 py-5">Financials</th>
                        <th className="px-8 py-5">Protocol</th>
                        <th className="px-8 py-5 text-right">Timestamp</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5 font-bold text-slate-400 text-[10px] tracking-tight truncate max-w-[100px]">{order.id}</td>
                            <td className="px-8 py-5">
                                <div className="text-xs font-bold text-slate-900">{order.customer_email}</div>
                                <div className="text-[10px] text-slate-400 font-medium">Verified Account</div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                    <Zap size={12} className="text-primary-600" />
                                    <span className="font-bold text-slate-700 text-xs truncate max-w-[200px]">{order.products?.title || "Asset Placeholder"}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <span className="text-slate-900 text-xs font-bold">${Number(order.total_price).toFixed(2)}</span>
                                <div className={`mt-1 text-[9px] font-bold uppercase tracking-widest ${
                                order.status === "Paid" ? "text-primary-600" : "text-yellow-600"
                                }`}>{order.status}</div>
                            </td>
                            <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                                order.status === "Delivered" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"
                                }`}>
                                {order.status}
                                </span>
                            </td>
                            <td className="px-8 py-5 text-right font-bold text-slate-400 text-[10px]">{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
}
