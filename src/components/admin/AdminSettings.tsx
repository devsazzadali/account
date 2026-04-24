import React from "react";
import { Shield, Globe, CreditCard, Save } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h2 className="text-xl font-bold text-slate-900">Settings</h2>
            <p className="text-[13px] text-slate-500 font-medium">Manage your store's configuration and security protocols.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Navigation Rail */}
            <div className="space-y-1">
                {["General", "Payments", "Security", "Notifications"].map((tab) => (
                    <button 
                        key={tab}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                            tab === "General" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Settings Content */}
            <div className="md:col-span-2 space-y-6">
                {/* Store Details Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Store Profile</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Platform Name</label>
                            <input 
                                type="text" 
                                defaultValue="Titan Digital Assets"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Support Email</label>
                            <input 
                                type="email" 
                                defaultValue="support@titanstore.io"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Gateway Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Financial Gateway</h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                                    <CreditCard size={16} className="text-slate-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Stripe</p>
                                    <p className="text-[11px] text-slate-500 font-medium">Automatic payouts enabled</p>
                                </div>
                            </div>
                            <button className="text-[12px] font-bold text-primary-600 hover:underline">Manage</button>
                        </div>
                        
                        <div className="pt-2">
                            <button className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-sm shadow-sm">
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Maintenance Mode Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Maintenance Mode</h3>
                        <p className="text-[12px] text-slate-500 font-medium">Limit store access to administrators only.</p>
                    </div>
                    <div className="w-10 h-5 bg-slate-200 rounded-full p-1 cursor-pointer transition-colors hover:bg-slate-300">
                        <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
