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
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4 font-bold uppercase tracking-widest text-[10px]">
            Home / My Orders(Selling)
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-gray-800">📦</span> Sold Orders
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{orders.length} Results Found</p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 w-1/3">Product Acquisition</th>
                            <th className="px-6 py-4 text-center">Unit Price</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Total Settlement</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-gray-300" />
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Resolving Ledger...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-20">
                                        <ShoppingBag size={48} className="text-gray-400" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Sold Orders Yet</span>
                                    </div>
                                </td>
                            </tr>
                        ) : orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="text-[10px] text-gray-400 mb-1 font-bold">
                                        LOG: <span className="text-gray-600">{order.id.split('-')[0].toUpperCase()}</span> &nbsp; buyer: <span className="text-blue-500">{order.customer_email}</span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-800 line-clamp-1">
                                        {order.products?.title || "Asset Terminated"}
                                    </div>
                                    <div className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                                        {new Date(order.created_at).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center text-sm font-bold text-gray-600">${Number(order.total_price / order.quantity).toFixed(2)}</td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                        order.status === 'Paid' || order.status === 'Completed' || order.status === 'Delivered'
                                        ? "bg-green-100 text-green-700" 
                                        : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right font-bold text-gray-900">${Number(order.total_price).toFixed(2)}</td>
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
