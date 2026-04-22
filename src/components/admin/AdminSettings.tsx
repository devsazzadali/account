import React from "react";
import { Shield, Globe, CreditCard, Save } from "lucide-react";

export function AdminSettings() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stripe Configuration */}
        <div className="glass-card rounded-3xl border border-white/5 p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <CreditCard className="text-primary-400" />
                Stripe Configuration
            </h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Publishable Key</label>
                    <input 
                        type="password" 
                        defaultValue="pk_test_************************"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Secret Key</label>
                    <input 
                        type="password" 
                        defaultValue="sk_test_************************"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Webhook Secret</label>
                    <input 
                        type="password" 
                        defaultValue="whsec_************************"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                </div>
                <button className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Save size={18} />
                    Synchronize Gateway
                </button>
            </div>
        </div>

        {/* General Settings */}
        <div className="glass-card rounded-3xl border border-white/5 p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Globe className="text-blue-400" />
                Global Preferences
            </h3>
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Platform Name</label>
                    <input 
                        type="text" 
                        defaultValue="Account Store One"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dark-50/30 uppercase tracking-widest px-1">Settlement Currency</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-primary-500/50 transition-all cursor-pointer appearance-none">
                        <option value="USD">USD - United States Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="BDT">BDT - Bangladeshi Taka</option>
                    </select>
                </div>
                <div className="pt-4 space-y-4">
                    <h4 className="text-[10px] font-bold text-dark-50/20 uppercase tracking-widest px-1">Security Protocols</h4>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                        <span className="text-sm font-medium text-white/70">Maintenance Mode</span>
                        <div className="w-12 h-6 bg-white/10 rounded-full p-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                        <span className="text-sm font-medium text-white/70">Automatic Payouts</span>
                        <div className="w-12 h-6 bg-primary-500 rounded-full p-1 cursor-pointer flex justify-end">
                            <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
