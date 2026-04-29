import React, { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Mail, 
  XCircle, 
  Upload, 
  Clock, 
  AlertCircle, 
  Package, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  History,
  CheckCircle2,
  Trash2,
  Lock,
  Zap,
  Info,
  PlusCircle
} from "lucide-react";
import { motion } from "framer-motion";
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
  
  // Account Info States
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
    <div className="min-h-[800px] w-full bg-[#F0F2F5] pb-20 overflow-y-auto">
      {/* Breadcrumb */}
      <div className="px-8 py-4 flex items-center gap-2 text-slate-500 text-[13px] font-medium bg-white border-b border-slate-200">
          <History size={14} /> Home / Sold Details
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Sold Details</h2>

        {/* Stepper Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100">
          <div className="relative flex justify-between items-center max-w-4xl mx-auto">
            {/* Connection Lines */}
            <div className="absolute top-[18px] left-0 right-0 h-[3px] bg-slate-100" />
            <div 
              className="absolute top-[18px] left-0 h-[3px] bg-[#1dbf73] transition-all duration-700" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-4 transition-all duration-500 ${
                  idx + 1 <= currentStep ? "bg-[#1dbf73] border-[#E8F5E9] text-white" : "bg-white border-slate-100 text-slate-300"
                }`}>
                  {step.id}
                </div>
                <span className={`mt-3 text-[11px] font-bold uppercase tracking-tight text-center ${
                  idx + 1 <= currentStep ? "text-slate-900" : "text-slate-400"
                }`}>
                  {step.label}
                </span>
                {idx + 1 === currentStep && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-6"
                    >
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                    </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {/* Order Header Info */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                    <Package size={18} className="text-slate-400" />
                    Order number {orderIdShort}
                </div>
                <div className="bg-[#FF4D4F] text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 uppercase">
                    <Clock size={12} /> Exceeded the promised delivery time for {exceededHours} hours
                </div>
            </div>
            <div className="flex items-center gap-6 text-[13px] font-medium text-slate-500">
                <span>Order Date: {orderDate}</span>
                <span className="text-[#1890FF] font-bold uppercase">{status}</span>
            </div>
          </div>

          <div className="p-8">
            {/* Buyer/Action Info */}
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded overflow-hidden bg-white border border-slate-200">
                        <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${order.username}`} alt="buyer" />
                    </div>
                    <div>
                        <h4 className="text-[16px] font-bold text-slate-900">{order.username}</h4>
                        <p className="text-[12px] text-slate-500">buyer</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1DBF73] text-white rounded text-[13px] font-bold hover:bg-[#19a463] transition-all">
                            <MessageCircle size={14} /> Chat Now
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold hover:bg-slate-50 transition-all">
                            <Mail size={14} /> Contact buyers by mail
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold hover:bg-slate-50 transition-all">
                            <XCircle size={14} /> Cancel Order
                        </button>
                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-[13px] font-bold hover:bg-slate-50 transition-all">
                            <Upload size={14} /> Upload/View
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Details Section */}
            <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                    <span className="w-32 text-[14px] text-slate-500">Game</span>
                    <span className="text-[14px] text-slate-900 font-medium">: {product?.game || "Facebook"}</span>
                </div>
                <div className="flex items-start gap-4">
                    <span className="w-32 text-[14px] text-slate-500 pt-0.5">Product Title</span>
                    <div className="flex-1">
                        <span className="text-[14px] text-[#E62E04] font-bold leading-relaxed">: {product?.title}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="w-32 text-[14px] text-slate-500">Username</span>
                    <span className="text-[14px] text-slate-900 font-medium">: {order.username}</span>
                </div>

                <div className="pt-6">
                    {status === "New Order" && (
                        <button 
                            onClick={() => setShowConfirmModal(true)}
                            className="bg-[#E62E04] text-white px-16 py-3 rounded font-bold text-[15px] hover:bg-[#c52804] transition-all uppercase tracking-widest"
                        >
                            PREPARING
                        </button>
                    )}
                    {status === "PREPARING" && (
                        <button 
                            onClick={() => updateStatus("Delivering")}
                            className="bg-[#E62E04] text-white px-16 py-3 rounded font-bold text-[15px] hover:bg-[#c52804] transition-all uppercase tracking-widest"
                        >
                            START TRADING
                        </button>
                    )}
                </div>
            </div>

            {/* Order Information Table */}
            <div className="mt-12">
                <h3 className="text-[16px] font-bold text-slate-900 mb-4 uppercase tracking-tight">Order Information</h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#F8F9FA] border-b border-slate-200 font-bold text-slate-600">
                            <tr>
                                <th className="px-6 py-4">ProductID - (3015261)</th>
                                <th className="px-6 py-4">{product?.title} <span className="text-blue-500 flex items-center gap-1 inline-flex cursor-pointer"><Upload size={14} /> view snapshot</span></th>
                                <th className="px-6 py-4">Price/Unit</th>
                                <th className="px-6 py-4 text-right">USD {order.total_price || order.amount}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            <tr>
                                <td className="px-6 py-4 text-slate-500">Type</td>
                                <td className="px-6 py-4">
                                    <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-50 p-1">
                                        <img src="https://api.dicebear.com/7.x/identicon/svg?seed=facebook" alt="" />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">Amount</td>
                                <td className="px-6 py-4 text-right">USD {order.total_price || order.amount}</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 text-slate-500 uppercase">Quantity</td>
                                <td className="px-6 py-4">1</td>
                                <td className="px-6 py-4 text-slate-500">Service Fee</td>
                                <td className="px-6 py-4 text-right">8%</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td colSpan={2} className="px-6 py-4"></td>
                                <td className="px-6 py-4 text-slate-900 font-bold">Actual Amount Received</td>
                                <td className="px-6 py-4 text-right text-slate-900 font-bold">-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Account Info Form (Screenshot 2 style) */}
            <div className="mt-12 bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-[#333333] px-6 py-3 flex justify-between items-center">
                    <h3 className="text-white text-[14px] font-bold">Accounts Info</h3>
                    <PlusCircle size={18} className="text-white cursor-pointer" />
                </div>
                <div className="p-8 space-y-6">
                    <FormRow label="Login Account" required>
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Login Password" required>
                        <input type="password" className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="2FA Code">
                        <input placeholder="If not filled in (none)" className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400 placeholder:text-slate-300" />
                    </FormRow>
                    <FormRow label="cookies">
                        <input placeholder="If not filled in (none)" className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400 placeholder:text-slate-300" />
                    </FormRow>
                    <FormRow label="Secondary Password(Security Answer)">
                        <input placeholder="If not filled in (none)" className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400 placeholder:text-slate-300" />
                    </FormRow>
                    <FormRow label="Account registration information (Last Name)">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Account registration information (First Name)">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Bird mailbox security issue 1">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Secret Answer 1">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Bird mailbox security issue 2">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Secret Answer 2">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Bird mailbox security issue 3">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Secret Answer 3">
                        <input className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400" />
                    </FormRow>
                    <FormRow label="Additional information">
                        <textarea className="flex-1 border border-slate-300 rounded px-4 py-2 text-[14px] outline-none focus:border-red-400 min-h-[80px]" />
                    </FormRow>
                    
                    <div className="pt-4 flex flex-col gap-6">
                        <button className="w-24 bg-[#E62E04] text-white py-2 rounded font-bold text-[13px] hover:bg-[#c52804] transition-all">
                            Submit
                        </button>

                        {/* Trading Status Bar */}
                        <div className="bg-[#F8F9FA] border border-slate-200 rounded-lg p-6 space-y-4">
                            <div className="flex justify-between items-center text-[13px] font-bold text-slate-700">
                                <span>Trading Status 0/1 delivered</span>
                            </div>
                            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1dbf73] transition-all duration-1000" style={{ width: '0%' }} />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={() => updateStatus("Delivered")}
                                className="bg-[#E62E04] text-white px-10 py-2.5 rounded font-bold text-[14px] hover:bg-[#c52804] transition-all shadow-lg shadow-red-500/10 uppercase tracking-widest"
                            >
                                Confirm Delivered
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button 
            onClick={onBack}
            className="text-slate-500 font-bold text-[14px] hover:text-slate-900 transition-all flex items-center gap-2"
        >
            <ChevronRight className="rotate-180" size={16} /> Return to Order Console
        </button>
      </div>

      {/* Z2U Style Confirm Modal */}
      {showConfirmModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
              <div className="relative bg-white w-full max-w-[500px] shadow-2xl rounded overflow-hidden">
                  <div className="bg-[#333333] px-5 py-3 flex justify-between items-center">
                      <span className="text-white text-[15px] font-bold">Confirm</span>
                      <XCircle size={20} className="text-white cursor-pointer" onClick={() => setShowConfirmModal(false)} />
                  </div>
                  <div className="p-12 text-center">
                      <p className="text-[14px] text-slate-800 font-medium">Whether to confirm?</p>
                      <div className="mt-12 flex justify-center gap-24">
                          <button 
                            onClick={() => setShowConfirmModal(false)}
                            className="bg-[#E62E04] text-white px-8 py-2 rounded text-[13px] font-bold uppercase tracking-wider shadow-sm"
                          >
                              CANCEL
                          </button>
                          <button 
                            onClick={() => updateStatus("PREPARING")}
                            className="bg-[#1DBF73] text-white px-8 py-2 rounded text-[13px] font-bold uppercase tracking-wider shadow-sm"
                          >
                              CONFIRM
                          </button>
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
