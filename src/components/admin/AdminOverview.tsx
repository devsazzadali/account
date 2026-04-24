import React, { useEffect, useState } from "react";
import { 
  Star, 
  Clock, 
  CheckCircle2, 
  Zap, 
  DollarSign,
  TrendingUp,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  History,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function AdminOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    fifteenDays: 0,
    thirtyDays: 0,
    oneYear: 0,
    lifetime: 0
  });
  const username = localStorage.getItem("username") || "Admin";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
        setLoading(true);
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();
        const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)).toISOString();

        const { data: allOrders, error } = await supabase
            .from('orders')
            .select('total_price, created_at, status, products(title)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const results = {
            fifteenDays: 0,
            thirtyDays: 0,
            oneYear: 0,
            lifetime: 0
        };

        allOrders?.forEach(order => {
            const price = Number(order.total_price) || 0;
            const createdDate = new Date(order.created_at);
            
            results.lifetime += price;
            if (createdDate >= new Date(fifteenDaysAgo)) results.fifteenDays += price;
            if (createdDate >= new Date(thirtyDaysAgo)) results.thirtyDays += price;
            if (createdDate >= new Date(oneYearAgo)) results.oneYear += price;
        });

        setStats(results);
        setRecentOrders(allOrders?.slice(0, 3) || []);

    } catch (err: any) {
        console.error("Analytics Error:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const salesPeriods = [
    { label: "Last 15 Days", value: stats.fifteenDays, icon: Activity, color: "text-[#1dbf73]" },
    { label: "Last 30 Days", value: stats.thirtyDays, icon: Calendar, color: "text-blue-500" },
    { label: "Last 1 Year", value: stats.oneYear, icon: History, color: "text-purple-500" },
    { label: "Lifetime Sales", value: stats.lifetime, icon: TrendingUp, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Left Column: Analytics Breakdown */}
      <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#e4e5e7] rounded-sm p-6 shadow-sm">
              <div className="flex flex-col items-center text-center pb-6 border-b border-[#e4e5e7]">
                  <div className="w-24 h-24 rounded-full border border-[#e4e5e7] p-1 mb-4 relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-[#1dbf73] border-2 border-white rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-bold text-[#404145]">{username}</h3>
                  <div className="text-[12px] font-bold text-[#1dbf73] uppercase tracking-widest mt-1">Main Administrator</div>
              </div>

              <div className="py-6 space-y-6">
                  <h4 className="text-[14px] font-bold text-[#404145] uppercase tracking-wider mb-4">Revenue Performance</h4>
                  {salesPeriods.map((period, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 hover:bg-[#f7f7f7] rounded transition-all group">
                          <div className={`w-10 h-10 rounded flex items-center justify-center bg-white border border-[#e4e5e7] ${period.color}`}>
                              <period.icon size={20} />
                          </div>
                          <div>
                              <div className="text-[12px] font-medium text-[#62646a]">{period.label}</div>
                              <div className="text-[16px] font-bold text-[#404145]">${period.value.toLocaleString()}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Right Column: Active Sales Feed */}
      <div className="lg:col-span-8 space-y-6">
          
          {/* Total Overview Card */}
          <div className="bg-[#404145] rounded-sm p-8 shadow-lg text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                  <TrendingUp size={240} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                      <h4 className="text-[14px] font-bold text-white/60 uppercase tracking-widest mb-1">Total Lifetime Revenue</h4>
                      <div className="text-4xl font-black">${stats.lifetime.toLocaleString()}</div>
                  </div>
                  <div className="h-12 w-px bg-white/10 hidden md:block"></div>
                  <div>
                      <h4 className="text-[14px] font-bold text-white/60 uppercase tracking-widest mb-1">Verified Sales</h4>
                      <div className="text-2xl font-bold">{recentOrders.length}+ Records</div>
                  </div>
              </div>
          </div>

          {/* Recent Sales Activity */}
          <div className="bg-white border border-[#e4e5e7] rounded-sm shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#e4e5e7] flex items-center justify-between">
                  <h4 className="text-[16px] font-bold text-[#404145]">Real-Time Sales Feed</h4>
                  <button onClick={() => setActiveTab?.('orders')} className="text-[#1dbf73] text-[14px] font-bold flex items-center gap-1 hover:underline">
                      View Ledger <ChevronRight size={16} />
                  </button>
              </div>
              
              <div className="divide-y divide-[#e4e5e7]">
                  {loading ? (
                      <div className="p-12 text-center text-[#b5b6ba]">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <span className="text-sm font-medium">Processing Analytics...</span>
                      </div>
                  ) : recentOrders.length === 0 ? (
                      <div className="p-12 text-center text-[#b5b6ba]">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                          <span className="text-sm font-medium">No sales data available</span>
                      </div>
                  ) : recentOrders.map((order, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-[#f7f7f7] transition-all group">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-[#efeff0] rounded flex items-center justify-center text-[#1dbf73]">
                                  <DollarSign size={24} />
                              </div>
                              <div>
                                  <div className="text-[14px] font-bold text-[#404145]">{order.products?.title || "Product Purchase"}</div>
                                  <div className="text-[11px] text-[#b5b6ba] font-bold mt-0.5 uppercase tracking-tighter">
                                      {new Date(order.created_at).toLocaleString()}
                                  </div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-[16px] font-bold text-[#404145]">${Number(order.total_price).toFixed(2)}</div>
                              <div className="text-[11px] font-bold text-[#1dbf73] uppercase tracking-widest mt-1">Verified</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}
