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
  
  const [accountInfo, setAccountInfo] = useState({
    loginAccount: "",
    loginPassword: "",
    twoFactorCode: "",
    cookies: "",
    secondaryPassword: "",
    internalRemarks: order?.internal_remarks || ""
  });

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
                        <button onClick={() => alert("Chat feature coming soon")} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1DBF73] text-white rounded text-[13px] font-bold">
                            <MessageCircle size={14} /> Chat Now
                        </button>
                        <button onClick={() => alert("Mail feature coming soon")} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold">
                            <Mail size={14} /> Mail
                        </button>
                        <button onClick={() => alert("Cancel order feature coming soon")} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold">
                            <XCircle size={14} /> Cancel
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="w-32 text-[14px] text-slate-500">Category</span>
                    <span className="text-[14px] text-slate-900 font-medium">: {product?.game || product?.category || "N/A"}</span>
                </div>
                <div className="flex items-start gap-4">
                    <span className="w-32 text-[14px] text-slate-500 pt-0.5">Product Title</span>
                    <div className="flex-1 text-[14px] text-[#E62E04] font-bold leading-relaxed">: {product?.title || "N/A"}</div>
                </div>

                <div className="pt-6">
                    {status === "New Order" && (
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-[#E62E04] text-white px-16 py-3 rounded font-bold text-[15px] uppercase tracking-widest"
                        >
                            PREPARING
                        </button>
                    )}
                    {status === "PREPARING" && (
                        <button 
                            onClick={() => updateStatus("Delivering")}
                            className="bg-[#E62E04] text-white px-16 py-3 rounded font-bold text-[15px] uppercase tracking-widest"
                        >
                            START TRADING
                        </button>
                    )}
                </div>
            </div>

            {/* Account Info Form */}
            <div className="mt-12 bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-[#333333] px-6 py-3 flex justify-between items-center text-white">
                    <h3 className="text-[14px] font-bold">Accounts Info</h3>
                    <PlusCircle size={18} />
                </div>
                <div className="p-8 space-y-6">
                    <FormRow label="Login Account" required>
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none" />
                    </FormRow>
                    <FormRow label="Login Password" required>
                        <input type="password" className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none" />
                    </FormRow>
                    <FormRow label="2FA Code">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none" />
                    </FormRow>
                    <FormRow label="Secondary Password">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none" />
                    </FormRow>
                    <div className="pt-4">
                        <button className="bg-[#E62E04] text-white px-10 py-2 rounded font-bold text-[13px]">
                            Submit
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
              <div className="relative bg-white w-full max-w-[400px] rounded overflow-hidden shadow-2xl">
                  <div className="bg-[#333333] px-5 py-3 flex justify-between items-center text-white font-bold">
                      <span>Confirm</span>
                      <XCircle size={20} className="cursor-pointer" onClick={() => setShowConfirmModal(false)} />
                  </div>
                  <div className="p-10 text-center">
                      <p className="font-bold">Whether to confirm?</p>
                      <div className="mt-8 flex justify-center gap-10">
                          <button onClick={() => setShowConfirmModal(false)} className="px-6 py-2 bg-slate-100 rounded text-sm font-bold">CANCEL</button>
                          <button onClick={() => updateStatus("PREPARING")} className="px-6 py-2 bg-[#1DBF73] text-white rounded text-sm font-bold">CONFIRM</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

function FormRow({ label, required, children }: any) {
    return (
        <div className="flex items-center gap-4 max-w-2xl">
            <div className="w-48 text-[14px] text-slate-800 font-medium flex items-center gap-1">
                <span className="text-red-500">{required ? "*" : ""}</span> {label}
            </div>
            {children}
        </div>
    );
}
