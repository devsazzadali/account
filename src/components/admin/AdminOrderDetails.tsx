import React, { useState } from "react";
import { 
  MessageCircle, 
  Mail, 
  XCircle, 
  Upload, 
  Clock, 
  Package, 
  ChevronRight,
  History,
  Zap,
  PlusCircle,
  Loader2,
  CheckCircle,
  Settings,
  X,
  ArrowRight,
  Activity
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";

interface OrderDetailsProps {
  order: any;
  onBack: () => void;
}

const STEPS = [
  { id: 1, label: "New Order" },
  { id: 2, label: "PREPARING" },
  { id: 3, label: "Delivering" },
  { id: 4, label: "Waiting for confirmation" },
  { id: 5, label: "Completed" },
  { id: 6, label: "Evaluate" }
];

function MetadataItem({ label, value }: any) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</div>
      <div className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{value}</div>
    </div>
  );
}

function LedgerItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      <span className="text-[13px] font-black text-slate-900">{value}</span>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text", required = false, placeholder = "" }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
        {required && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        {label}
      </label>
      <input 
        type={type}
        value={value || ""} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full h-12 px-5 bg-slate-50/50 border border-slate-200 rounded-2xl text-[14px] font-bold outline-none focus:border-[#E62E04] focus:ring-4 focus:ring-red-500/5 transition-all" 
      />
    </div>
  );
}

export function AdminOrderDetails({ order, onBack }: OrderDetailsProps) {
  const [status, setStatus] = useState(order?.status || "New Order");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [accountInfo, setAccountInfo] = useState(order?.account_info || {});
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!order) return null;

  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  const currentStep = STEPS.findIndex(s => s.label.toUpperCase() === status.toUpperCase()) + 1 || 1;

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
      if (error) throw error;
      setStatus(newStatus);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setShowDeliverModal(false);
      setShowCancelModal(false);
    }
  }

  async function handleConfirmDeliver() {
      setIsSubmittingInfo(true);
      try {
          const { error } = await supabase
            .from('orders')
            .update({ 
                account_info: accountInfo,
                status: "Delivering" 
            })
            .eq('id', order.id);
          
          if (error) throw error;
          setStatus("Delivering");
          setShowDeliverModal(false);
          toast.success("Account Information Sent to Customer!");
      } catch (e: any) {
          toast.error("Failed to deliver info: " + e.message);
      } finally {
          setIsSubmittingInfo(false);
      }
  }

  const handleChatNow = () => {
      if (order.username) {
          localStorage.setItem("selectedUserChat", order.username);
          toast.success("User selected for chat! Please navigate to the Messages tab.");
      }
  };

  const exceededHoursVal = order.created_at 
    ? (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)
    : 0;
  const exceededHours = exceededHoursVal.toFixed(2);
  const showWarning = exceededHoursVal > 24;

  const orderIdShort = (order.id || "").toString().split("-")[0].toUpperCase() || "N/A";
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : "N/A";

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-24 overflow-y-auto">
      {/* Breadcrumb Header */}
      <div className="px-10 py-6 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">
          <History size={14} className="text-[#E62E04]" /> 
          <span>Sold Protocol</span>
          <ChevronRight size={14} /> 
          <span className="text-slate-900 italic">Registry Entry</span>
        </div>
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#E62E04] hover:text-white transition-all active:scale-95"
        >
          Return to Ledger
        </button>
      </div>

      <div className="max-w-[1300px] mx-auto p-10 space-y-10">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Registry Details</h2>
            <div className="flex items-center gap-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Entry Secured</span>
            </div>
        </div>

        {/* Modernized Stepper */}
        <div className="bg-white rounded-[2.5rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200/60 overflow-hidden relative">
          <div className="relative flex justify-between items-center max-w-5xl mx-auto px-4">
            <div className="absolute top-[22px] left-0 right-0 h-[4px] bg-slate-100 rounded-full" />
            <div 
              className="absolute top-[22px] left-0 h-[4px] bg-[#E62E04] transition-all duration-1000 ease-in-out rounded-full shadow-[0_0_15px_rgba(230,46,4,0.4)]" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black border-4 transition-all duration-500 ${
                  idx + 1 <= currentStep 
                  ? "bg-[#E62E04] border-red-50 text-white scale-110 shadow-lg shadow-red-500/20" 
                  : "bg-white border-slate-100 text-slate-300 group-hover:border-red-100 group-hover:text-red-300"
                }`}>
                  {idx + 1 <= currentStep && idx + 1 < STEPS.length ? (
                    <CheckCircle size={20} />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-center max-w-[100px] leading-tight transition-colors ${
                  idx + 1 <= currentStep ? "text-slate-900 italic" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Registry Summary Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-[16px] font-black text-slate-900 uppercase italic">
                    <Package size={22} className="text-[#E62E04]" />
                    ID {orderIdShort}
                </div>
                {showWarning && (
                  <div className="bg-red-50 text-[#E62E04] px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 uppercase tracking-widest border border-red-100">
                      <Clock size={14} /> Priority Warning: {exceededHours}h Delay
                  </div>
                )}
            </div>
            <div className="flex items-center gap-8 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2">Timestamp <span className="text-slate-900 italic">{orderDate}</span></span>
                <span className={`px-4 py-2 rounded-xl border ${
                   status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                   status === 'Canceled' ? 'bg-red-50 text-[#E62E04] border-red-100' :
                   'bg-amber-50 text-amber-600 border-amber-100'
                }`}>{status}</span>
            </div>
          </div>

          <div className="p-10">
            <div className="flex items-center justify-between bg-slate-50/50 p-10 rounded-[2rem] border border-slate-200/60 shadow-inner">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden bg-white border-4 border-white shadow-xl">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${order.username || 'buyer'}`} alt="buyer" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Registry Buyer</div>
                        <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{order.username || 'Anonymous'}</h4>
                    </div>
                    <div className="flex gap-3 ml-10">
                        <button onClick={handleChatNow} className="flex items-center gap-3 px-6 py-3 bg-[#E62E04] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95">
                            <MessageCircle size={16} /> Open Channel
                        </button>
                        <a href={`mailto:${order.email || ''}`} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                            <Mail size={16} /> SMTP Link
                        </a>
                        <button onClick={() => setShowCancelModal(true)} className="flex items-center gap-3 px-6 py-3 bg-white border border-red-100 text-[#E62E04] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">
                            <XCircle size={16} /> Terminate
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest italic mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#E62E04]" />
                        Registry Metadata
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <MetadataItem label="Protocol Asset" value={product?.game || product?.category || "N/A"} />
                            <MetadataItem label="Entry Title" value={product?.title || "N/A"} />
                        </div>
                        <div className="space-y-6">
                            <MetadataItem label="Registry User" value={order?.username || "Anonymous"} />
                            <MetadataItem label="Registry Level" value="System Administrator" />
                        </div>
                    </div>

                    <div className="pt-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Operational Actions</div>
                        <div className="flex gap-4">
                            {status === "New Order" && (
                                <button 
                                    onClick={() => setShowConfirmModal(true)}
                                    className="px-10 py-4 bg-[#0A0F1C] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    INITIALIZE PREPARATION
                                </button>
                            )}
                            {status === "PREPARING" && (
                                <button 
                                    onClick={() => updateStatus("Delivering")}
                                    className="px-10 py-4 bg-[#E62E04] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 hover:bg-red-700 transition-all active:scale-95"
                                >
                                    COMMENCE TRADE
                                </button>
                            )}
                            {status === "Waiting for confirmation" && (
                                <button 
                                    onClick={() => updateStatus("Completed")}
                                    className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-900/40 hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    FINALIZE REGISTRY
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Registry Info Sidebar */}
                <div className="col-span-12 lg:col-span-4 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-200/60">
                    <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest italic mb-8">Financial Ledger</h3>
                    <div className="space-y-6">
                        <LedgerItem label="Asset Valuation" value={`$${(order?.total_price || 0).toLocaleString()}`} />
                        <LedgerItem label="Quantity Unit" value="01 Registry Entry" />
                        <LedgerItem label="Service Protocol (8%)" value={`$${((order?.total_price || 0) * 0.08).toFixed(2)}`} />
                        <div className="pt-6 mt-6 border-t border-slate-200">
                             <div className="flex justify-between items-center">
                                  <span className="text-[11px] font-black text-slate-900 uppercase">Settlement Amount</span>
                                  <span className="text-2xl font-black text-[#E62E04] tracking-tighter">${((order?.total_price || 0) * 0.92).toFixed(2)}</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Info Form Section */}
            {currentStep >= 2 && (
            <div className="mt-16">
                <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="bg-[#0A0F1C] px-10 py-6 flex justify-between items-center text-white">
                        <div className="flex items-center gap-4">
                            <Zap size={18} className="text-amber-500" />
                            <h3 className="text-[13px] font-black uppercase tracking-[0.2em] italic">Encrypted Asset Credentials</h3>
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/50">SECURE V2</div>
                    </div>
                    <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-10">
                        <FormInput label="Login Registry / Email" value={accountInfo?.loginAccount} onChange={(v) => setAccountInfo({...accountInfo, loginAccount: v})} required />
                        <FormInput label="Passcode Registry" value={accountInfo?.loginPassword} onChange={(v) => setAccountInfo({...accountInfo, loginPassword: v})} type="password" required />
                        <FormInput label="2FA Protocol Code" value={accountInfo?.twoFactorCode} onChange={(v) => setAccountInfo({...accountInfo, twoFactorCode: v})} placeholder="Scan fallback..." />
                        <FormInput label="Cookie Registry Payload" value={accountInfo?.cookies} onChange={(v) => setAccountInfo({...accountInfo, cookies: v})} placeholder="JSON / String..." />
                        <div className="col-span-2 pt-6">
                            <button onClick={() => setShowDeliverModal(true)} disabled={isSubmittingInfo} className="px-12 py-4 bg-[#E62E04] text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl shadow-red-500/30 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-3">
                                {isSubmittingInfo ? <Loader2 size={18} className="animate-spin" /> : <>TRANSMIT DATA <ArrowRight size={16} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Preparing Modal */}
      {showConfirmModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
              <div className="relative bg-white w-full max-w-[400px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                  <div className="bg-[#0A0F1C] px-6 py-4 flex justify-between items-center text-white text-[11px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Settings size={14} className="text-[#E62E04]" /> Protocol Initialize</span>
                      <button onClick={() => setShowConfirmModal(false)} className="hover:text-[#E62E04] transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-10 text-center">
                      <div className="w-16 h-16 bg-red-50 text-[#E62E04] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <Activity size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2 uppercase italic tracking-tight">Commence Preparation?</h3>
                      <p className="text-[12px] text-slate-500 mb-10 font-bold uppercase tracking-tight leading-relaxed">System will transition to <span className="text-[#E62E04]">PREPARING</span> status. Verify all registry entries before proceeding.</p>
                      <div className="flex gap-4">
                          <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
                          <button onClick={() => updateStatus("PREPARING")} className="flex-1 py-4 bg-[#E62E04] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all">Confirm</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Deliver Account Info Modal */}
      {showDeliverModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeliverModal(false)} />
              <div className="relative bg-white w-full max-w-[450px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
                  <div className="bg-[#0A0F1C] px-6 py-4 flex justify-between items-center text-white text-[11px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Zap size={14} className="text-amber-500" /> Data Transmission</span>
                      <button onClick={() => setShowDeliverModal(false)} className="hover:text-[#E62E04] transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-10 text-center">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <Zap size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2 uppercase italic tracking-tight">Transmit Credentials?</h3>
                      <p className="text-[12px] text-slate-500 mb-10 font-bold uppercase tracking-tight leading-relaxed">This action will relay sensitive account data to the buyer. Status will transition to <span className="text-blue-500">DELIVERING</span>.</p>
                      <div className="flex gap-4">
                          <button onClick={() => setShowDeliverModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Hold</button>
                          <button 
                            onClick={handleConfirmDeliver} 
                            disabled={isSubmittingInfo}
                            className="flex-1 py-4 bg-[#E62E04] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                          >
                              {isSubmittingInfo ? <Loader2 size={16} className="animate-spin" /> : "TRANSMIT"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowCancelModal(false)} />
              <div className="relative bg-white w-full max-w-[450px] rounded-3xl shadow-2xl overflow-hidden border border-red-100">
                  <div className="bg-[#0A0F1C] px-6 py-4 flex justify-between items-center text-white text-[11px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-2"><XCircle size={14} className="text-red-500" /> Protocol Termination</span>
                      <button onClick={() => setShowCancelModal(false)} className="hover:text-[#E62E04] transition-colors"><X size={18} /></button>
                  </div>
                  <div className="p-10 text-center">
                      <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <XCircle size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2 uppercase italic tracking-tight">Terminate Entry?</h3>
                      <p className="text-[12px] text-slate-500 mb-10 font-bold uppercase tracking-tight leading-relaxed">Are you absolutely certain? This operation will <span className="text-[#E62E04]">CANCEL</span> the registry entry permanently.</p>
                      <div className="flex gap-4">
                          <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
                          <button 
                            onClick={() => updateStatus("Canceled")} 
                            disabled={loading}
                            className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                          >
                              {loading ? <Loader2 size={16} className="animate-spin" /> : "TERMINATE"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
