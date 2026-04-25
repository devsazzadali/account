import React, { useState, useEffect } from "react";
import { User, Shield, Bell, CreditCard, Save, CheckCircle, Smartphone, Mail, Lock, Loader2, Camera, AlertCircle } from "lucide-react";
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
      
      // Update local storage for legacy header support
      localStorage.setItem("username", username);
      alert("Identity Protocol Updated Successfully!");
    } catch (e: any) {
      alert("Sync Error: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
        alert("Password mismatch detected in protocol.");
        return;
    }
    setSaving(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setNewPassword("");
        setConfirmPassword("");
        alert("Security Credentials Updated.");
    } catch (e: any) {
        alert("Security Error: " + e.message);
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
        alert("Neural Imaging Sync Complete!");
    } catch (e: any) {
        alert("Upload Error: " + e.message);
    } finally {
        setSaving(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: <User size={16} /> },
    { id: "security", label: "Security Protocol", icon: <Shield size={16} /> },
    { id: "billing", label: "Valuation Methods", icon: <CreditCard size={16} /> },
    { id: "notifications", label: "Comms Config", icon: <Bell size={16} /> },
  ];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
            <Loader2 className="animate-spin text-primary-600 w-10 h-10 mb-4" />
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Decrypting Personal Matrix...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">System Configuration</h2>
                <p className="text-sm text-slate-500 font-medium">Manage your identity and platform security parameters.</p>
            </div>
            {profile?.is_premium && (
               <div className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                  Premium Tier Active
               </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${
                            activeTab === tab.id 
                            ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20" 
                            : "bg-white text-slate-400 border-white hover:border-slate-200"
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
                {activeTab === "profile" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                                <div className="relative group">
                                    <div className="w-28 h-28 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden relative">
                                        <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="User" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                    <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-xl border-4 border-white">
                                        <Camera size={16} />
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{fullName || username}</h3>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 flex items-center justify-center md:justify-start gap-2">
                                       Node ID: {user.id.slice(0,8).toUpperCase()} • Tier: {profile?.is_premium ? 'Premium' : 'Standard'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Display Name</label>
                                    <input 
                                        type="text" 
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-primary-600 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Handle (@)</label>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-primary-600 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Bio</label>
                                    <textarea 
                                        rows={4}
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        placeholder="Add encrypted notes to your profile..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-primary-600 transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button 
                                    onClick={handleUpdateProfile}
                                    disabled={saving}
                                    className="px-10 py-5 bg-slate-900 text-white font-black text-[13px] uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Commit Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "security" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-10">
                            <div className="space-y-6">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Security Credentials</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:border-primary-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Protocol</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:border-primary-600" />
                                    </div>
                                </div>
                                <button onClick={handleChangePassword} disabled={saving || !newPassword} className="px-8 py-4 bg-primary-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-primary-700 transition-all">Update Access Key</button>
                            </div>

                            <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary-400">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[14px] font-black">Titan™ MFA</h4>
                                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Two-Factor Encryption Active</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase">Configure</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "billing" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                         <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center">
                            <CreditCard size={48} className="mx-auto text-slate-100 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 mb-2">Financial Nodes</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Payment encryption is managed via Stripe Secure Node. No local data is stored.</p>
                            <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest">Connect Wallet</button>
                         </div>
                    </motion.div>
                )}

                {activeTab === "notifications" && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 ml-2">Communication Matrix</h3>
                        <div className="space-y-6">
                            {[
                                { title: "Order Status Protocols", desc: "Real-time sync for procurement completions." },
                                { title: "Security Breach Alerts", desc: "High-priority nodes for login attempts." },
                                { title: "Asset Infiltration Drops", desc: "First-access nodes for rare account listings." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <div className="max-w-[70%]">
                                        <h4 className="text-[14px] font-black text-slate-900">{item.title}</h4>
                                        <p className="text-[12px] text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                                    </div>
                                    <div className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all ${i < 2 ? "bg-emerald-500" : "bg-slate-200"}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${i < 2 ? "translate-x-7" : "translate-x-0"}`}></div>
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
