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
  PlusCircle
} from "lucide-react";
import { supabase } from "../../lib/supabase";

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

export function AdminOrderDetails({ order, onBack }: OrderDetailsProps) {
  const [status, setStatus] = useState(order?.status || "New Order");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [accountInfo, setAccountInfo] = useState(order?.account_info || {
    loginAccount: "",
    loginPassword: "",
    twoFactorCode: "",
    cookies: "",
    secondaryPassword: "",
    internalRemarks: order?.internal_remarks || ""
  });
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

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
      alert(e.message);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  }

  async function handleSaveAccountInfo() {
      setIsSubmittingInfo(true);
      try {
          const { error } = await supabase
            .from('orders')
            .update({ account_info: accountInfo })
            .eq('id', order.id);
          
          if (error) throw error;
          alert("Account Information Saved Successfully!");
      } catch (e: any) {
          alert("Failed to save info: " + e.message);
      } finally {
          setIsSubmittingInfo(false);
      }
  }

  const handleChatNow = () => {
      if (order.username) {
          localStorage.setItem("selectedUserChat", order.username);
          alert("User selected for chat! Please navigate to the Messages tab.");
      }
  };

  const exceededHours = order.created_at 
    ? ((new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60)).toFixed(2)
    : "0.00";

  const orderIdShort = (order.id || "").toString().split("-")[0].toUpperCase() || "N/A";
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString() : "N/A";

  return (
    <div className="min-h-screen w-full bg-[#F0F2F5] pb-20 overflow-y-auto">
      {/* Breadcrumb */}
      <div className="px-8 py-4 flex items-center gap-2 text-slate-500 text-[13px] font-medium bg-white border-b border-slate-200">
          <History size={14} /> Home / Sold Details
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Sold Details</h2>
            <button onClick={onBack} className="text-[#1890FF] text-sm font-bold">Back to List</button>
        </div>

        {/* Stepper Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100">
          <div className="relative flex justify-between items-center max-w-4xl mx-auto">
            <div className="absolute top-[18px] left-0 right-0 h-[3px] bg-slate-100" />
            <div 
              className="absolute top-[18px] left-0 h-[3px] bg-[#1dbf73] transition-all duration-700" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-4 ${
                  idx + 1 <= currentStep ? "bg-[#1dbf73] border-[#E8F5E9] text-white" : "bg-white border-slate-100 text-slate-300"
                }`}>
                  {step.id}
                </div>
                <span className={`mt-3 text-[11px] font-bold uppercase tracking-tight text-center ${
                  idx + 1 <= currentStep ? "text-slate-900" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                    <Package size={18} className="text-slate-400" />
                    Order number {orderIdShort}
                </div>
                <div className="bg-[#FF4D4F] text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 uppercase">
                    <Clock size={12} /> Exceeded for {exceededHours} hours
                </div>
            </div>
            <div className="flex items-center gap-6 text-[13px] font-medium text-slate-500">
                <span>Order Date: {orderDate}</span>
                <span className="text-[#1890FF] font-bold uppercase">{status}</span>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded overflow-hidden bg-white border border-slate-200">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${order.username || 'buyer'}`} alt="buyer" />
                    </div>
                    <div>
                        <h4 className="text-[16px] font-bold text-slate-900">{order.username || 'Buyer'}</h4>
                        <p className="text-[12px] text-slate-500">buyer</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button onClick={handleChatNow} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1DBF73] text-white rounded text-[13px] font-bold shadow-sm">
                            <MessageCircle size={14} /> Chat Now
                        </button>
                        <a href={`mailto:${order.email || ''}`} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold shadow-sm">
                            <Mail size={14} /> Contact buyers by mail
                        </a>
                        <button onClick={() => { if(window.confirm('Are you sure you want to cancel this order?')) updateStatus('Canceled'); }} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold shadow-sm">
                            <XCircle size={14} /> Cancel Order
                        </button>
                        {currentStep >= 3 && (
                            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold shadow-sm">
                                <Upload size={14} /> Upload/View
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="w-32 text-[13px] font-bold text-slate-600">Game</span>
                    <span className="text-[13px] text-slate-900 font-bold">: {product?.game || product?.category || "N/A"}</span>
                </div>
                <div className="flex items-start gap-4">
                    <span className="w-32 text-[13px] font-bold text-slate-600 pt-0.5">Product Title</span>
                    <div className="flex-1 text-[13px] text-slate-900 font-bold leading-relaxed">: {product?.title || "N/A"}</div>
                </div>
                <div className="flex items-start gap-4">
                    <span className="w-32 text-[13px] font-bold text-slate-600 pt-0.5">Username</span>
                    <div className="flex-1 text-[13px] text-slate-900 font-bold leading-relaxed">: {order?.username || "buyer"}</div>
                </div>

                <div className="pt-6">
                    {status === "New Order" && (
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-[#D9363E] text-white px-10 py-2 rounded text-[12px] font-bold uppercase tracking-wide"
                        >
                            PREPARING
                        </button>
                    )}
                    {status === "PREPARING" && (
                        <button 
                            onClick={() => updateStatus("Delivering")}
                            className="bg-[#D9363E] text-white px-10 py-2 rounded text-[12px] font-bold uppercase tracking-wide"
                        >
                            START TRADING
                        </button>
                    )}
                </div>
            </div>

                {/* Order Information Section */}
                <div className="pt-8 mt-6 border-t border-slate-100">
                    <h3 className="text-[14px] font-bold text-slate-900 mb-6">Order Information</h3>
                    <div className="grid grid-cols-12 gap-4 text-[12px]">
                        <div className="col-span-3 space-y-6 text-slate-500">
                            <div>ProductID - (<span className="text-[#1890FF] hover:underline cursor-pointer">{product?.id?.toString()?.substring(0,7) || "3015251"}</span>)</div>
                            <div>Type</div>
                            <div className="uppercase">QUANTITY</div>
                        </div>
                        <div className="col-span-5 space-y-6 text-slate-900 font-medium">
                            <div><span className="text-[#1890FF] hover:underline cursor-pointer">{product?.title}</span> <span className="text-slate-500 font-normal ml-2 flex items-center gap-1 inline-flex"><Upload size={12}/> view snapshot</span></div>
                            <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden border border-slate-200"><img src={product?.image || "https://api.dicebear.com/7.x/identicon/svg"} className="w-full h-full object-cover" /></div>
                            <div>1</div>
                        </div>
                        <div className="col-span-4 space-y-4 text-right">
                            <div className="flex justify-between"><span className="text-slate-500">Price/Unit</span><span className="font-bold text-slate-900">USD {order?.total_price || 10}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-slate-900">USD {(order?.total_price || 10).toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Service Fee</span><span className="font-bold text-slate-900">8%</span></div>
                            <div className="flex justify-between pt-4 mt-2"><span className="font-bold text-slate-900">Actual Amount Received</span><span className="font-bold text-slate-900">-</span></div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Account Info Form */}
            {currentStep >= 2 && (
            <div className="mt-8">
                <div className="border border-slate-200 rounded overflow-hidden shadow-sm">
                    <div className="bg-[#111111] px-4 py-2.5 flex justify-between items-center text-white">
                        <h3 className="text-[14px] font-bold">Accounts Info</h3>
                        <span className="text-xl leading-none cursor-pointer">-</span>
                    </div>
                    <div className="p-6 bg-white space-y-5">
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1"><span className="text-red-500">*</span> Login Account</div>
                            <input value={accountInfo?.loginAccount || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), loginAccount: e.target.value})} className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1"><span className="text-red-500">*</span> Login Password</div>
                            <input value={accountInfo?.loginPassword || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), loginPassword: e.target.value})} type="password" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1"><span className="text-red-500">*</span> 2FA Code</div>
                            <input value={accountInfo?.twoFactorCode || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), twoFactorCode: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1"><span className="text-red-500">*</span> cookies</div>
                            <input value={accountInfo?.cookies || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), cookies: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Secondary Password(Security Answer)</div>
                            <input value={accountInfo?.secondaryPassword || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), secondaryPassword: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Account registration information (Last Name)</div>
                            <input value={accountInfo?.lastName || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), lastName: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Account registration information (First Name)</div>
                            <input value={accountInfo?.firstName || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), firstName: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Bird mailbox Password</div>
                            <input value={accountInfo?.birdPassword || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), birdPassword: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Bird mailbox security issue 1</div>
                            <input value={accountInfo?.birdIssue1 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), birdIssue1: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Secret Answer 1</div>
                            <input value={accountInfo?.secretAnswer1 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), secretAnswer1: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Bird mailbox security issue 2</div>
                            <input value={accountInfo?.birdIssue2 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), birdIssue2: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Secret Answer 2</div>
                            <input value={accountInfo?.secretAnswer2 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), secretAnswer2: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Bird mailbox security issue 3</div>
                            <input value={accountInfo?.birdIssue3 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), birdIssue3: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Secret Answer 3</div>
                            <input value={accountInfo?.secretAnswer3 || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), secretAnswer3: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="text-[12px] font-bold text-slate-700 flex items-center gap-1">Additional information</div>
                            <input value={accountInfo?.additionalInfo || ""} onChange={(e) => setAccountInfo({...(accountInfo || {}), additionalInfo: e.target.value})} placeholder="If not filled in (none)" className="w-full max-w-xl border border-slate-300 rounded px-3 py-2 text-[14px] outline-none focus:border-[#E62E04]" />
                        </div>

                        <div className="pt-4 flex items-center justify-between">
                            <button onClick={handleSaveAccountInfo} disabled={isSubmittingInfo} className="bg-[#E62E04] text-white px-6 py-2 rounded font-bold text-[12px] hover:bg-[#c92503] transition-all disabled:opacity-50 flex items-center gap-2">
                                {isSubmittingInfo && <Loader2 size={14} className="animate-spin" />} Submit
                            </button>
                        </div>
                    </div>
                </div>

                {/* Confirm Delivered Button */}
                {currentStep >= 3 && (
                    <>
                        <div className="flex justify-end mt-4 border border-slate-200 bg-white p-4 shadow-sm rounded">
                            <button 
                                onClick={() => updateStatus("Waiting for confirmation")}
                                className="bg-[#D9363E] text-white px-8 py-2.5 rounded text-[13px] font-bold uppercase tracking-wide hover:bg-[#c92503] transition-all"
                            >
                                Confirm Delivered
                            </button>
                        </div>

                        {/* Trading Status */}
                        <div className="mt-8">
                            <h3 className="text-[14px] font-bold text-slate-900 mb-4">Trading Status 0/1 delivered</h3>
                            <div className="w-full h-[1px] bg-slate-200 rounded overflow-hidden">
                                <div className="w-0 h-full bg-[#1dbf73]"></div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            )}
          </div>
        </div>
      {showConfirmModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
              <div className="relative bg-white w-full max-w-[450px] rounded shadow-2xl overflow-hidden">
                  <div className="bg-[#111111] px-4 py-3 flex justify-between items-center text-white text-[14px] font-bold">
                      <span>Confirm</span>
                      <span className="text-xl leading-none cursor-pointer hover:text-red-500 font-normal" onClick={() => setShowConfirmModal(false)}>&times;</span>
                  </div>
                  <div className="p-8">
                      <p className="text-[13px] text-slate-800 mb-10 font-bold">Whether to confirm?</p>
                      <div className="flex justify-center gap-6">
                          <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 bg-[#FF0000] text-white rounded text-[12px] font-bold uppercase tracking-wide">CANCEL</button>
                          <button onClick={() => updateStatus("PREPARING")} className="px-6 py-2 bg-[#1DBF73] text-white rounded text-[12px] font-bold uppercase tracking-wide">CONFIRM</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
