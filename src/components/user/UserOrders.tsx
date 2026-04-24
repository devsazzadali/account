import React, { useEffect, useState } from "react";
import { Download, Search, ShoppingBag, ExternalLink } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
        setLoading(true);
        // In a real app, filter by current user's email or ID
        const userEmail = localStorage.getItem("username") + "@example.com"; // Placeholder logic
        
        const { data, error } = await supabase
            .from('orders')
            .select('*, products(title, image, category)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => 
    o.products?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-display font-bold text-slate-900 italic">Order Ledger</h2>
                <p className="text-sm text-slate-500">View and manage your digital asset acquisitions.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search orders..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                </div>
                <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                    <Download size={18} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                    <p className="font-bold uppercase tracking-widest text-[10px]">Accessing Secure Ledger...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <ShoppingBag size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Acquisitions Found</h3>
                    <p className="text-sm max-w-xs mx-auto">Your ledger is currently empty. Start exploring our premium assets to begin your collection.</p>
                </div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-primary-500/30 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                {order.products?.image ? (
                                    <img src={order.products.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ShoppingBag size={32} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded">
                                        {order.products?.category || 'Premium Asset'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        ID: #{order.id.split('-')[0].toUpperCase()}
                                    </span>
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                                    {order.products?.title || 'Unknown Product'}
                                </h4>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="font-bold text-slate-900">${Number(order.total_price).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                    order.status === 'Paid' || order.status === 'Completed' || order.status === 'Delivered'
                                    ? 'bg-green-50 text-green-600 border-green-100' 
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {order.status}
                                </div>
                                <button className="flex items-center gap-2 text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:text-primary-500 transition-colors group/btn">
                                    View Details
                                    <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}
