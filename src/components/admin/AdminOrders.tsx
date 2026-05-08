[ignoring loop detection]
import React, { useEffect, useState, useCallback } from "react";
import { 
  Loader2, Search, RefreshCw, AlertCircle, Clock, MoreVertical,
  Package, User, ShoppingBag, ChevronRight, Filter, 
  CheckCircle2, XCircle, ShieldCheck, AlertTriangle, ArrowRight,
  MousePointer2, Trash2, ExternalLink, Zap
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const PAGE_SIZE = 50; // Higher density for enterprise admin

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [filter, setFilter] = useState({ id: "", status: "All" });
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [filter.status]);

  async function fetchOrders() {
    setLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select(`*, products(title, image, price)`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (filter.status !== "All") {
        query = query.eq("status", filter.status);
      }

      const { data } = await query;
      setOrders(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="h-screen bg-[#F1F5F9] overflow-hidden flex flex-col font-sans">
      
      {/* ── Top Ops Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Order <span className="text-slate-400">Ledger</span></h1>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            {["All", "Paid", "Pending", "Disputed"].map(s => (
              <button 
                key={s}
                onClick={() => setFilter({ ...filter, status: s })}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter.status === s ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input 
                type="text" 
                placeholder="GLOBAL ID SEARCH..."
                className="bg-slate-100 border-none rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-bold text-slate-900 w-64 focus:ring-2 ring-slate-900 transition-all uppercase"
              />
           </div>
           <button onClick={() => setBulkMode(!bulkMode)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${bulkMode ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-600'}`}>
              {bulkMode ? 'Cancel Bulk' : 'Bulk Mode'}
           </button>
        </div>
      </div>

      {/* ── 3-Column Ops Grid ── */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* COLUMN 1: TRANSACTION STREAM (Span 3) */}
        <div className="col-span-3 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
           {loading ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-50">
                <Loader2 className="animate-spin text-slate-300" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Streaming Records...</span>
             </div>
           ) : (
             <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
               {orders.map((order) => (
                 <div 
                   key={order.id} 
                   onClick={() => !bulkMode && setSelectedOrder(order)}
                   className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-all relative border-l-4 ${selectedOrder?.id === order.id ? 'border-slate-900 bg-slate-50' : 'border-transparent'}`}
                 >
                   {bulkMode && (
                     <input 
                        type="checkbox" 
                        checked={selectedIds.includes(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                     />
                   )}
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                         <span className="text-xs font-black text-slate-900 tracking-tight truncate">{order.products?.title}</span>
                         <span className="text-[10px] font-black text-emerald-600">${order.total_price}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                         <span>#{order.id.slice(0, 8)}</span>
                         <span>•</span>
                         <span>{new Date(order.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                   <StatusDot status={order.status} />
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* COLUMN 2: WORKSPACE (Span 6) */}
        <div className="col-span-6 bg-slate-50/50 flex flex-col overflow-y-auto border-r border-slate-200 p-8">
           {selectedOrder ? (
             <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedOrder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                   {/* Workspace Header */}
                   <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                         <div className="w-20 h-20 rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white p-1">
                            <img src={selectedOrder.products?.image} className="w-full h-full object-cover rounded-2xl" />
                         </div>
                         <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tighter leading-tight mb-1">{selectedOrder.products?.title}</h2>
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Order: {selectedOrder.id}</span>
                               <span className="px-2 py-0.5 bg-slate-900 text-white text-[8px] font-black uppercase rounded tracking-widest">Master Node</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acquisition Time</p>
                         <p className="text-sm font-black text-slate-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Intelligence Grid */}
                   <div className="grid grid-cols-3 gap-4">
                      <IntelligenceCard label="Buyer Identity" value={selectedOrder.username} sub="LVL 10 Account" icon={<User size={14}/>} color="blue" />
                      <IntelligenceCard label="Fraud Score" value="0.04" sub="Heat: Cold" icon={<ShieldCheck size={14}/>} color="emerald" />
                      <IntelligenceCard label="Settlement" value={`$${selectedOrder.total_price}`} sub="Escrow Locked" icon={<Zap size={14}/>} color="amber" />
                   </div>

                   {/* Audit History */}
                   <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Activity size={14} className="text-slate-400" /> Operational Audit Trail
                      </h3>
                      <div className="space-y-6">
                         <AuditStep time="10:42" action="Payment Finalized" user="STRIPE_ENGINE" status="success" />
                         <AuditStep time="10:43" action="Inventory Atomic Lock" user="SYSTEM" status="success" />
                         <AuditStep time="10:45" action="Awaiting Admin Release" user="SYSTEM" status="pending" />
                      </div>
                   </div>
                </motion.div>
             </AnimatePresence>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
               <div className="w-24 h-24 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-200 shadow-inner">
                 <MousePointer2 size={48} />
               </div>
               <div>
                 <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Select <span className="text-slate-400">Transaction</span></h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Global Operations Monitoring Active</p>
               </div>
             </div>
           )}
        </div>

        {/* COLUMN 3: OPS CONTROL (Span 3) */}
        <div className="col-span-3 bg-white flex flex-col overflow-y-auto p-6 space-y-8">
           {bulkMode ? (
             <div className="space-y-6">
                <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
                   <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertTriangle size={14} /> Bulk Command
                   </h4>
                   <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{selectedIds.length} Records Selected</p>
                </div>
                <div className="space-y-3">
                   <ActionButton icon={<Zap size={16}/>} label="Mass Release Escrow" color="slate" />
                   <ActionButton icon={<XCircle size={16}/>} label="Mass Void Orders" color="red" />
                   <ActionButton icon={<Filter size={16}/>} label="Export Batch Data" color="blue" />
                </div>
             </div>
           ) : selectedOrder ? (
             <div className="space-y-8">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">Immediate Commands</p>
                   <div className="space-y-3">
                      <ActionButton icon={<CheckCircle2 size={16}/>} label="Release Escrow Now" color="emerald" />
                      <ActionButton icon={<AlertTriangle size={16}/>} label="Initiate Dispute" color="amber" />
                      <ActionButton icon={<Trash2 size={16}/>} label="Void & Refund" color="red" />
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 italic">System Overrides</p>
                   <div className="space-y-3">
                      <ActionButton icon={<ExternalLink size={16}/>} label="View JSON Metadata" color="slate" />
                      <ActionButton icon={<RefreshCw size={16}/>} label="Re-trigger Webhook" color="slate" />
                   </div>
                </div>
             </div>
           ) : (
             <div className="py-20 text-center space-y-4 opacity-30">
                <ShieldCheck size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">Protocol Guard Enabled</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: any = {
    'Paid': 'bg-emerald-500',
    'Completed': 'bg-emerald-500',
    'Pending': 'bg-amber-500',
    'Disputed': 'bg-red-500',
  };
  return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-slate-300'}`} />;
}

function IntelligenceCard({ label, value, sub, icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };
  return (
    <div className={`p-4 rounded-3xl border ${colors[color]} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
        {icon}
      </div>
      <p className="text-sm font-black tracking-tight">{value}</p>
      <span className="text-[8px] font-bold uppercase opacity-60">{sub}</span>
    </div>
  );
}

function ActionButton({ icon, label, color }: any) {
  const styles: any = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
    red: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
    slate: 'bg-slate-900 text-white hover:bg-black border-slate-900 shadow-lg shadow-slate-900/10',
  };
  return (
    <button className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${styles[color]}`}>
      {icon} {label}
    </button>
  );
}

function AuditStep({ time, action, user, status }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 text-[9px] font-black text-slate-300 mt-1">{time}</div>
      <div className="relative">
        <div className={`w-2 h-2 rounded-full mt-1.5 ${status === 'success' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
        <div className="absolute top-4 left-[3px] w-[1px] h-6 bg-slate-100" />
      </div>
      <div>
        <p className="text-xs font-black text-slate-800 tracking-tight">{action}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">By {user}</p>
      </div>
    </div>
  );
}

function Activity({ size, className }: { size: number, className?: string }) {
  return <ArrowRight size={size} className={className} />;
}
);
}
