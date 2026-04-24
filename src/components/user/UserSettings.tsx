import React, { useState } from "react";
import { User, Shield, Bell, CreditCard, Save, CheckCircle, Smartphone, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const username = localStorage.getItem("username") || "User";

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: <User size={16} /> },
    { id: "security", label: "Security Protocol", icon: <Shield size={16} /> },
    { id: "billing", label: "Valuation Methods", icon: <CreditCard size={16} /> },
    { id: "notifications", label: "Comms Config", icon: <Bell size={16} /> },
  ];

  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 italic">System Configuration</h2>
            <p className="text-sm text-slate-500">Manage your identity and platform security parameters.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="space-y-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id 
                            ? "bg-white text-primary-600 shadow-sm border border-slate-200" 
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                    >
                        <span className={activeTab === tab.id ? "text-primary-600" : "text-slate-400"}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
                {activeTab === "profile" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 p-[2px]">
                                        <div className="w-full h-full rounded-[0.9rem] bg-white flex items-center justify-center overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="User" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 transition-all">
                                        <Smartphone size={14} />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{username}</h3>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Premium Member • ID: 8829-QX</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        defaultValue={username}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <input 
                                            type="email" 
                                            defaultValue={`${username.toLowerCase()}@example.com`}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
                                        />
                                        <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bio / Profile Notes</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Add a brief description of yourself..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Account Protection</h4>
                                <p className="text-xs text-blue-700/70 mt-1 leading-relaxed">Your account is currently protected by Titan™ Shield. All high-value transactions require secondary biometric or MFA verification.</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "security" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-slate-900">
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Password Access</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Last updated 14 days ago</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 text-xs font-bold text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100">Update</button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                                        <Smartphone size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication</h4>
                                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                            <CheckCircle size={10} />
                                            Enabled via Authenticator App
                                        </p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors border border-transparent">Manage</button>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Authorized Sessions</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <Smartphone size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">iPhone 15 Pro • Dhaka, BD</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Current Session</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "billing" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                         <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Linked Payment Methods</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 border-2 border-primary-500 bg-primary-50/20 rounded-2xl relative overflow-hidden group cursor-pointer">
                                    <div className="absolute top-0 right-0 p-4">
                                        <CheckCircle size={20} className="text-primary-600" />
                                    </div>
                                    <div className="flex flex-col h-full justify-between">
                                        <div className="mb-8">
                                            <CreditCard size={32} className="text-primary-600 mb-4" />
                                            <p className="text-lg font-mono font-bold text-slate-900 tracking-wider">•••• •••• •••• 4492</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Method</p>
                                            <p className="text-sm font-bold text-slate-900">Exp: 12/28</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <button className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/10 transition-all group">
                                    <div className="p-3 bg-slate-50 rounded-full group-hover:bg-primary-100 transition-colors">
                                        <CreditCard size={24} />
                                    </div>
                                    <span className="text-sm font-bold">Add New Method</span>
                                </button>
                            </div>
                         </div>
                    </motion.div>
                )}

                {activeTab === "notifications" && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm"
                    >
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Communication Matrix</h3>
                        <div className="space-y-4">
                            {[
                                { title: "Order Status Updates", desc: "Receive real-time notifications for delivery completions." },
                                { title: "Security Alerts", desc: "Critical alerts regarding login attempts and account changes." },
                                { title: "Asset Opportunities", desc: "Be the first to know about high-tier account drops." },
                                { title: "Marketing & Digest", desc: "Weekly trends and platform updates." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${i < 3 ? "bg-primary-600" : "bg-slate-200"}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${i < 3 ? "translate-x-6" : "translate-x-0"}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    </div>
  );
}
