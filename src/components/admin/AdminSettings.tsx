import React from "react";
import { Shield, Globe, CreditCard, Save } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stripe Configuration */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-primary-50 rounded-xl text-primary-600 border border-primary-100">
                    <CreditCard size={20} />
                </div>
                Financial Gateway
            </h3>
            <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Publishable Key</label>
                    <input 
                        type="password" 
                        defaultValue="pk_test_************************"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Secret Key</label>
                    <input 
                        type="password" 
                        defaultValue="sk_test_************************"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Webhook Secret</label>
                    <input 
                        type="password" 
                        defaultValue="whsec_************************"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                    />
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs">
                    <Save size={18} />
                    Synchronize Gateway
                </button>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-500/5 blur-3xl rounded-full"></div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <Globe size={20} />
                </div>
                Global Preferences
            </h3>
            <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Platform Name</label>
                    <input 
                        type="text" 
                        defaultValue="Account Store One"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Settlement Currency</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500 transition-all cursor-pointer appearance-none shadow-sm">
                        <option value="USD">USD - United States Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="BDT">BDT - Bangladeshi Taka</option>
                    </select>
                </div>
                <div className="pt-4 space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Security Protocols</h4>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">Maintenance Mode</span>
                        <div className="w-12 h-6 bg-slate-200 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                        <span className="text-sm font-bold text-slate-700">Automatic Payouts</span>
                        <div className="w-12 h-6 bg-primary-600 rounded-full p-1 cursor-pointer flex justify-end">
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full"></div>
        </div>
    </div>
  );
}
