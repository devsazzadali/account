import React, { useEffect, useState } from "react";
import { Search, Info, Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function SoldOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSoldOrders();
  }, []);

  async function fetchSoldOrders() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(title)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching sold orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-sans text-slate-900">
      <div className="container mx-auto px-4 max-w-7xl py-12">
        {/* Breadcrumb */}
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">
            Home / <span className="text-primary-600">My Orders (Selling)</span>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50/50 border-b border-slate-100 p-8">
                <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
                        <ShoppingBag size={20} />
                    </div>
                    Sold Orders Ledger
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-1">{orders.length} Transmission Entries Found</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                        <tr>
                            <th className="px-8 py-5 w-1/3">Product Acquisition</th>
                            <th className="px-8 py-5 text-center">Unit Price</th>
                            <th className="px-8 py-5 text-center">Protocol Status</th>
                            <th className="px-8 py-5 text-right">Settlement</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <Loader2 className="animate-spin text-primary-600" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolving Ledger Node...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                        <ShoppingBag size={48} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Sold Orders Found in Registry</span>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="text-[9px] text-slate-400 mb-2 font-bold uppercase tracking-tighter">
                                        ID: <span className="text-slate-900">{order.id.split('-')[0].toUpperCase()}</span> &nbsp; | &nbsp; BUYER: <span className="text-primary-600">{order.customer_email}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                        {order.products?.title || "Asset Terminated"}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                        {new Date(order.created_at).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className="text-sm font-bold text-slate-900">${Number(order.total_price / (order.quantity || 1)).toFixed(2)}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">USD</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl border ${
                                        order.status === 'Paid' || order.status === 'Completed' || order.status === 'Delivered'
                                        ? "bg-primary-50 text-primary-600 border-primary-100 shadow-sm shadow-primary-500/5" 
                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-base font-display font-bold text-slate-900">${Number(order.total_price).toFixed(2)}</div>
                                    <div className="text-[9px] text-slate-400 font-bold uppercase">Settled</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
