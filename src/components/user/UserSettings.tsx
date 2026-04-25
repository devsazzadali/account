import React, { useState, useEffect } from "react";
import { User, Shield, Bell, CreditCard, Save, CheckCircle, Smartphone, Mail, Lock, Loader2, Camera, AlertCircle, Sparkles, Zap, ShieldCheck, Fingerprint, Key, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";

export function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || "");
      }
    }
    setLoading(false);
  }

  async function handleUpdateProfile() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Sync legacy localStorage
      localStorage.setItem("username", username);
      alert("Identity Protocol Synchronized Successfully.");
    } catch (e: any) {
      alert("Sync Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
        alert("Security Credentials Mismatch.");
        return;
    }
    setSaving(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
        setConfirmPassword("");
        alert("Access Key Rotated Successfully.");
    } catch (e: any) {
        alert("Security Protocol Error: " + e.message);
    } finally {
        setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath);

        setAvatarUrl(publicUrl);
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        alert("Neural Imaging Data Ingested.");
    } catch (e: any) {
        alert("Ingestion Error: " + e.message);
    } finally {
        setSaving(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: <Fingerprint size={18} /> },
    { id: "security", label: "Security Node", icon: <Key size={18} /> },
    { id: "billing", label: "Financial Node", icon: <Wallet size={18} /> },
    { id: "notifications", label: "Comms Matrix", icon: <Zap size={18} /> },
  ];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <Loader2 className="animate-spin text-[#1dbf73] w-12 h-12 mb-6" />
            <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em]">Decrypting Identity Matrix...</p>
        </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 lg:pb-0 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">System Configuration</h2>
                    {profile?.is_premium && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center gap-2"
                        >
                            <Sparkles size={12} /> Elite Tier
                        </motion.div>
                    )}
                </div>
                <p className="text-[15px] text-slate-500 font-medium">Manage your digital identity, security credentials, and communication nodes.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[12px] font-black text-slate-900 shadow-sm flex items-center gap-2">
                    <Shield size={14} className="text-[#1dbf73]" /> Status: Optimized
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Navigation Nodes */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 group ${
                            activeTab === tab.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/30 active:scale-95" 
                            : "bg-white text-slate-400 border-white hover:border-slate-200 hover:text-slate-600"
                        }`}
                    >
                        <span className={activeTab === tab.id ? "text-[#1dbf73]" : "group-hover:text-slate-900"}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Hub */}
            <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                    {activeTab === "profile" && (
                        <motion.div 
                            key="profile"
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 md:p-16 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                                
                                {/* Neural Image Sync */}
                                <div className="flex flex-col md:flex-row items-center gap-10 mb-16 relative z-10">
                                    <div className="relative group">
                                        <div className="w-36 h-36 rounded-[3rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden relative ring-4 ring-slate-50 transition-all group-hover:ring-[#1dbf73]/20">
                                            <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="User" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                <Camera className="mb-2" size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                                            </div>
                                        </div>
                                        <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-[1.2rem] bg-[#1dbf73] text-white flex items-center justify-center shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                                            <Sparkles size={18} />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight italic mb-1">{fullName || username}</h3>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3">
                                           <ShieldCheck size={14} className="text-[#1dbf73]" /> Verified Identity Node • {user.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Identity Matrix */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Identity Name</label>
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-[15px] font-bold text-slate-900 focus:border-[#1dbf73] focus:bg-white transition-all shadow-inner"
                                            placeholder="Enter your full legal name"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Global System Handle (@)</label>
                                        <input 
                                            type="text" 
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-[15px] font-bold text-slate-900 focus:border-[#1dbf73] focus:bg-white transition-all shadow-inner"
                                            placeholder="e.g. shadow_stalker_01"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Manifest (Bio)</label>
                                        <textarea 
                                            rows={5}
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            placeholder="Document your identity history and operational goals..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 text-[15px] font-bold text-slate-900 focus:border-[#1dbf73] focus:bg-white transition-all shadow-inner resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button 
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="px-12 py-6 bg-slate-900 text-white font-black text-[14px] uppercase tracking-[0.2em] rounded-[2rem] flex items-center gap-4 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/30 active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="text-[#1dbf73]" />}
                                        Commit Manifest
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "security" && (
                        <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 md:p-16 shadow-xl space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-red-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-30" />
                                
                                <div className="space-y-8 relative z-10">
                                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Lock size={18} className="text-[#1dbf73]" /> Rotate Security Keys
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Access Password</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm focus:border-[#1dbf73] transition-all shadow-inner" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Protocol</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm focus:border-[#1dbf73] transition-all shadow-inner" placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <button onClick={handleChangePassword} disabled={saving || !newPassword} className="px-10 py-5 bg-slate-900 text-white font-black text-[12px] uppercase tracking-widest rounded-[1.5rem] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl">
                                        Update Access Key <Key size={16} className="text-[#1dbf73]" />
                                    </button>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-[#1dbf73]/10 rounded-[1.5rem] flex items-center justify-center text-[#1dbf73] border border-[#1dbf73]/20">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-[18px] font-black tracking-tight flex items-center gap-2">Titan™ Security Core</h4>
                                            <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mt-1">Multi-Factor Encryption Active</p>
                                        </div>
                                    </div>
                                    <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg">Manage Core</button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "billing" && (
                        <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-[3rem] p-16 text-center shadow-xl">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <Wallet size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 italic">Financial Nodes</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">Payment encryption is managed via Stripe Secure Node. Your credit data is never cached on local servers.</p>
                            <button className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl">Initialize Secure Wallet</button>
                        </motion.div>
                    )}

                    {activeTab === "notifications" && (
                        <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-xl">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12 ml-4">Communication Config</h3>
                            <div className="space-y-6">
                                {[
                                    { title: "Registry Update Alerts", desc: "Real-time sync when product manifests are updated or stock depletes.", active: true },
                                    { title: "Direct Link Comm Signals", desc: "High-priority node for secure messages from administrators.", active: true },
                                    { title: "Neural Marketing Drops", desc: "Occasional data packets containing rare asset opportunities.", active: false }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-[#1dbf73]/30 transition-all group">
                                        <div className="max-w-[75%]">
                                            <h4 className="text-[16px] font-black text-slate-900 group-hover:text-[#1dbf73] transition-colors">{item.title}</h4>
                                            <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                        <div className={`w-16 h-8 rounded-full p-1.5 cursor-pointer transition-all ${item.active ? "bg-[#1dbf73]" : "bg-slate-200"}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${item.active ? "translate-x-8" : "translate-x-0"}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
}
