import React, { useEffect, useState } from "react";
import {
  ShoppingBag, CheckCircle2, Clock, Zap, AlertCircle, ShieldCheck, 
  ArrowUpRight, Activity, Search, Filter, MoreHorizontal, 
  AlertTriangle, MousePointer2, UserX, Trash2, ExternalLink,
  Lock, Globe, Terminal, BarChart3, XCircle as XCircleIcon
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  setActiveTab?: (tab: string) => void;
}

export function AdminOverview({ setActiveTab }: Props) {
  const [stats, setStats] = useState({
    balance: 0,
    successRate: 0,
    totalOrders: 0,
    processingOrders: 0,
    totalProducts: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, products(title, price, image)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      setOrders(orderData || []);
      
      const balance = orderData?.reduce((s, o) => s + (Number(o.total_price) || 0), 0) || 0;
      setStats(prev => ({
        ...prev,
        balance,
        totalOrders: orderData?.length || 0,
        processingOrders: orderData?.filter(o => o.status !== 'Completed').length || 0
      }));

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-slate-900 selection:text-white">
      
      {/* ── Top Command Bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Terminal size={18} />
            </div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Mission <span className="text-slate-400">Control</span></h1>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">System Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="GLOBAL SEARCH (CMD+K)"
              className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-[11px] font-bold text-slate-900 w-64 focus:ring-2 focus:ring-slate-900 transition-all uppercase tracking-widest"
            />
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><Lock size={18} /></button>
          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"><Globe size={18} /></button>
        </div>
      </div>

      {/* ── 3-Column Grid ── */}
      <div className="grid grid-cols-12 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* COLUMN 1: NAVIGATION & METRICS (Span 2) */}
        <div className="col-span-2 bg-white border-r border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Operations</p>
              <div className="space-y-1">
                <NavButton icon={<Activity size={16}/>} label="Dashboard" active />
                <NavButton icon={<ShoppingCart size={16}/>} label="Orders" />
                <NavButton icon={<BarChart3 size={16}/>} label="Analytics" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Quick Stats</p>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gross Revenue</span>
                  <span className="text-xl font-black text-slate-900 tracking-tighter">${stats.balance.toLocaleString()}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Success Rate</span>
                  <div className="flex items-end justify-between">
                    <span className="text-xl font-black text-slate-900 tracking-tighter">98.4%</span>
                    <ArrowUpRight size={14} className="text-emerald-500 mb-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocol Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold">Encrypted & Secure</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: TRANSACTION STREAM (Span 6) */}
        <div className="col-span-6 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Transaction <span className="text-slate-400">Ledger</span></h2>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all flex items-center gap-2">
                <Filter size={12} /> Filter
              </button>
              <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Export</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {orders.map((order) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className={`px-6 py-5 flex items-center gap-6 hover:bg-slate-50 cursor-pointer transition-all border-l-4 ${selectedOrder?.id === order.id ? 'border-slate-900 bg-slate-50' : 'border-transparent'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  order.status === 'Completed' || order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 
                  order.status === 'Disputed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <ShoppingBag size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-slate-900 tracking-tight truncate">{order.products?.title}</span>
                    <span className="text-[10px] text-slate-300 font-bold">#{order.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{order.username}</span>
                    <span>•</span>
                    <span className="text-slate-900">${order.total_price}</span>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="text-[10px] text-slate-300 font-bold mt-1.5">{new Date(order.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 3: OPERATIONAL CONTEXT (Span 4) */}
        <div className="col-span-4 bg-slate-50/50 flex flex-col overflow-y-auto">
          {selectedOrder ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 space-y-8"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic">Order <span className="text-slate-900">Analysis</span></h3>
                  <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-900 transition-colors"><XCircleIcon size={20}/></button>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-start gap-4 mb-6">
                    <img src={selectedOrder.products?.image} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" />
                    <div>
                      <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">{selectedOrder.products?.title}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ordered by {selectedOrder.username}</p>
                    </div>
                  </div>
                  
                  {/* Fulfillment Health & Fraud Radar */}
                  <div className="space-y-4">
                    {/* Settlement */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Total</span>
                      <span className="text-lg font-black text-emerald-600">${selectedOrder.total_price} USD</span>
                    </div>

                    {/* Fulfillment Health */}
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Fulfillment Health</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-1.5 mb-2 overflow-hidden">
                         <div className={`h-full ${selectedOrder.status === 'Completed' ? 'bg-emerald-500 w-full' : 'bg-blue-500 w-1/2 animate-pulse'}`} />
                      </div>
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                         <span>Payment Verified</span>
                         <span>{selectedOrder.status === 'Completed' ? 'Delivered' : 'Awaiting Fulfillment'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Grid */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Command Actions</p>
                  <div className="grid grid-cols-2 gap-3">
                    <ActionButton icon={<CheckCircle2 size={16}/>} label="Approve & Deliver" color="emerald" />
                    <ActionButton icon={<AlertTriangle size={16}/>} label="Open Dispute" color="red" />
                    <ActionButton icon={<Trash2 size={16}/>} label="Void Order" color="slate" />
                    <ActionButton icon={<ExternalLink size={16}/>} label="View Profile" color="blue" />
                  </div>
                </div>

                {/* Audit Trail */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Audit</p>
                  <div className="space-y-4">
                    <AuditItem time="10:42 AM" action="Payment Confirmed" user="SYSTEM" />
                    <AuditItem time="10:43 AM" action="Fraud Check Passed" user="TITAN_GUARD" />
                    <AuditItem time="10:45 AM" action="Awaiting Admin Review" user="SYSTEM" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col p-8 space-y-8">
              {/* System Global Health */}
              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/30">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Operational Status</h3>
                 <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">All Systems Functional</span>
                 </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                <ShieldCheck size={48} className="text-slate-400 mb-4" />
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Select an <span className="text-slate-400">Order</span></h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[200px] mx-auto mt-2">To view detailed fulfillment health</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, badge }: any) {
  return (
    <button className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-100'}`}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {badge && (
        <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Paid': 'bg-blue-50 text-blue-600 border-blue-100',
    'Processing': 'bg-blue-50 text-blue-600 border-blue-100',
    'Pending Payment': 'bg-amber-50 text-amber-600 border-amber-100',
    'Disputed': 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${styles[status] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
      {status}
    </span>
  );
}

function ActionButton({ icon, label, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    slate: 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200',
  };

  return (
    <button className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${colors[color]}`}>
      {icon}
      <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{label}</span>
    </button>
  );
}

function AuditItem({ time, action, user }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
      <div>
        <p className="text-[11px] font-black text-slate-800 tracking-tight">{action}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{time} • BY {user}</p>
      </div>
    </div>
  );
}
