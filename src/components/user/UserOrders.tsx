import React, { useEffect, useState } from "react";
import { Download, Search, ShoppingBag, ExternalLink, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function UserOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
        setLoading(true);
        // Using username instead of email for now as that's what we store in messages etc.
        const username = localStorage.getItem("username") || ""; 
        
        let query = supabase.from('orders').select('*, products(title, image, category)').order('created_at', { ascending: false });
        
        // If we want to filter to only this user's orders, we need a way to match it.
        // For now, fetching all or fetching by email. If username is used in email:
        if (username) {
            query = query.ilike('customer_email', `${username}@%`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setOrders(data || []);
    } catch (err: any) {
        console.error("Error fetching orders:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return o.id.toLowerCase().includes(term) || 
           (o.products?.title && o.products.title.toLowerCase().includes(term));
  });

  const handleCopyId = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
        {/* Header (My Orders text might be injected from parent, but we can assume it's here or handled) */}
        
        {/* Search */}
        <div className="relative border border-slate-200 rounded">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white text-sm focus:outline-none"
            />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200 mt-2">
            <button className="text-[14px] font-medium text-[#E62E04] border-b-2 border-[#E62E04] pb-2 px-1">All</button>
            <button className="text-[14px] font-medium text-slate-600 hover:text-slate-900 pb-2 px-1">Success</button>
            <button className="text-[14px] font-medium text-slate-600 hover:text-slate-900 pb-2 px-1">Processing</button>
        </div>

        {/* Orders List */}
        <div className="space-y-4 pt-2">
            {loading ? (
                <div className="py-12 text-center text-slate-400">Loading...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No orders found.</div>
            ) : (
                filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-1 mb-2 cursor-pointer text-[#14b8a6] hover:text-teal-600 transition-colors">
                            <span className="text-[12px] font-bold uppercase tracking-wide">
                                {order.status === 'Completed' ? 'Success' : order.status === 'Paid' ? 'Processing' : order.status}
                            </span>
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        
                        <div className="flex justify-between items-start">
                            <div className="pr-4">
                                <h4 className="text-[13px] text-slate-800 leading-snug mb-1">
                                    {order.products?.title || 'Structure Facebook ads | 4 ID verified old facebook | 2 Verified Business Manager'}
                                </h4>
                                <div className="text-[14px] text-[#E62E04] font-medium mb-3">
                                    ${Number(order.total_price).toFixed(2)} USD
                                </div>
                                <div className="text-[12px] text-slate-500 space-y-0.5">
                                    <div>Order number: <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-slate-700 ml-1 rounded-[2px]">{order.id.split('-')[0].toUpperCase()}</span></div>
                                    <div>Payment time: {new Date(order.created_at).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false }).replace(',', '')}</div>
                                </div>
                            </div>
                            <div className="text-[11px] text-slate-400 shrink-0">
                                {new Date(order.created_at).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false }).replace(',', '')}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}
