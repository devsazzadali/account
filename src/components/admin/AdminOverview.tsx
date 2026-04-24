import React, { useEffect, useState } from "react";
import { 
  Star, 
  Clock, 
  CheckCircle2, 
  Zap, 
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
        setLoading(true);
        const { data: orders } = await supabase.from('orders').select('total_price, status, created_at').order('created_at', { ascending: false });
        
        const totalRevenue = orders?.reduce((acc, o) => acc + Number(o.total_price), 0) || 0;
        setRevenue(totalRevenue);

        const { data: recent } = await supabase
            .from('orders')
            .select('*, products(title)')
            .order('created_at', { ascending: false })
            .limit(3);
        setRecentOrders(recent || []);

    } catch (err: any) {
        console.error("Dashboard Fetch Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const sellerStats = [
    { label: "Response Rate", value: "100%", color: "bg-[#1dbf73]" },
    { label: "Delivered on Time", value: "100%", color: "bg-[#1dbf73]" },
    { label: "Order Completion", value: "98%", color: "bg-[#1dbf73]" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left Column: User Profile & Stats */}
      <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#e4e5e7] rounded-sm p-6 shadow-sm">
              <div className="flex flex-col items-center text-center pb-6 border-b border-[#e4e5e7]">
                  <div className="w-24 h-24 rounded-full border border-[#e4e5e7] p-1 mb-4 relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#1dbf73] border-2 border-white rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-bold text-[#404145]">{username}</h3>
                  <div className="flex items-center gap-1 mt-1">
                      <div className="flex text-[#ffbe5b]">
                          {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                      </div>
                      <span className="text-[13px] font-bold text-[#404145]">5.0</span>
                      <span className="text-[13px] text-[#b5b6ba]">(1k+ reviews)</span>
                  </div>
              </div>

              <div className="py-6 space-y-4">
                  {sellerStats.map((stat, i) => (
                      <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[14px]">
                              <span className="text-[#62646a] font-medium">{stat.label}</span>
                              <span className="text-[#404145] font-bold">{stat.value}</span>
                          </div>
                          <div className="h-1 bg-[#efeff0] rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: stat.value }}
                                className={`h-full ${stat.color}`}
                              />
                          </div>
                      </div>
                  ))}
              </div>

              <div className="pt-6 border-t border-[#e4e5e7] space-y-4">
                  <div className="flex justify-between text-[14px]">
                      <span className="text-[#62646a] font-medium">Earned in April</span>
                      <span className="text-[#404145] font-bold">${revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[14px]">
                      <span className="text-[#62646a] font-medium">Response Time</span>
                      <span className="text-[#404145] font-bold">1 Hour</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Right Column: Active Orders & Actions */}
      <div className="lg:col-span-8 space-y-6">
          
          {/* Earnings Card */}
          <div className="bg-white border border-[#e4e5e7] rounded-sm p-8 shadow-sm flex items-center justify-between">
              <div>
                  <h4 className="text-[16px] font-bold text-[#404145] mb-1">Total Balance</h4>
                  <div className="text-3xl font-bold text-[#1dbf73]">${revenue.toLocaleString()}</div>
              </div>
              <button 
                onClick={() => setActiveTab?.('earnings')}
                className="px-6 py-3 border-2 border-[#404145] text-[#404145] font-bold rounded-md hover:bg-[#404145] hover:text-white transition-all text-sm"
              >
                  Withdraw Funds
              </button>
          </div>

          {/* Active Orders */}
          <div className="bg-white border border-[#e4e5e7] rounded-sm shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#e4e5e7] flex items-center justify-between">
                  <h4 className="text-[16px] font-bold text-[#404145]">Active Orders</h4>
                  <button onClick={() => setActiveTab?.('orders')} className="text-[#1dbf73] text-[14px] font-bold flex items-center gap-1 hover:underline">
                      View All <ChevronRight size={16} />
                  </button>
              </div>
              
              <div className="divide-y divide-[#e4e5e7]">
                  {loading ? (
                      <div className="p-12 text-center text-[#b5b6ba]">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <span className="text-sm font-medium">Fetching orders...</span>
                      </div>
                  ) : recentOrders.length === 0 ? (
                      <div className="p-12 text-center text-[#b5b6ba]">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <span className="text-sm font-medium">No active orders found</span>
                      </div>
                  ) : recentOrders.map((order) => (
                      <div key={order.id} className="p-6 flex items-center justify-between hover:bg-[#f7f7f7] transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#efeff0] rounded flex items-center justify-center text-[#b5b6ba]">
                                  <Zap size={24} />
                              </div>
                              <div>
                                  <div className="text-[14px] font-bold text-[#404145] group-hover:text-[#1dbf73] transition-colors">{order.products?.title}</div>
                                  <div className="text-[12px] text-[#62646a] font-medium mt-0.5">Buyer: {order.customer_email.split('@')[0]}</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-[14px] font-bold text-[#404145]">${Number(order.total_price).toFixed(2)}</div>
                              <div className={`text-[11px] font-bold uppercase tracking-wider mt-1 ${order.status === 'Delivered' ? 'text-[#1dbf73]' : 'text-[#ffbe5b]'}`}>
                                  {order.status}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Quick Actions / Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1dbf73] rounded-sm p-6 text-white relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={120} />
                  </div>
                  <h4 className="text-lg font-bold mb-2">Boost your sales</h4>
                  <p className="text-sm text-white/80 mb-6 font-medium leading-relaxed">Share your profile on social media to reach more buyers and increase your revenue.</p>
                  <button className="bg-white text-[#1dbf73] px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all">
                      Promote Gigs
                  </button>
              </div>
              <div className="bg-white border border-[#e4e5e7] rounded-sm p-6 relative group">
                  <h4 className="text-lg font-bold text-[#404145] mb-2">Need help?</h4>
                  <p className="text-sm text-[#62646a] mb-6 font-medium leading-relaxed">Check out our guides on how to become a top-rated seller in no time.</p>
                  <button className="border-2 border-[#404145] text-[#404145] px-4 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-[#404145] hover:text-white transition-all">
                      Read Guides
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}
