"use client";

import React, { useState, useEffect } from "react";
import { User, Shield, Bell, CreditCard, Save, CheckCircle, Smartphone, Mail, Lock, Loader2, Camera, AlertCircle, Sparkles, Zap, ShieldCheck, Fingerprint, Key, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";
import { lsGet, lsSet } from "@/src/lib/storage";

export function UserSettings({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  // F-16: the identity badge must tell the truth about verification —
  // this mirrors the header pill's resend (same auth call, same states).
  const [verifyState, setVerifyState] = useState<"idle" | "sending" | "sent">("idle");

  // Fix Round 7 (item 9): Delete Account — type-to-confirm flow; the
  // server (/api/me/delete) anonymises the profile and blocks the
  // account; orders stay on the store's records.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (deleteText !== "DELETE" || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/me/delete", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Deletion failed");
      toast.success("Your account has been deleted.");
      await auth.signOut().catch(() => {});
      window.location.assign("/");
    } catch (e: any) {
      toast.error(e.message);
      setDeleting(false);
    }
  }

  const emailVerified = !!user?.email_confirmed_at;

  async function handleResendVerification() {
    if (!user?.email || verifyState === "sending") return;
    setVerifyState("sending");
    const { error } = await auth.sendVerificationEmail(user.email);
    if (error) {
      setVerifyState("idle");
      toast.error(`Verification email could not be sent: ${error.message}`);
    } else {
      setVerifyState("sent");
      toast.success(`Verification email sent to ${user.email} — check your inbox.`);
    }
  }

  // F-19: MANAGE CORE goes to the real security controls on this page —
  // the Rotate Security Keys (password) form above it.
  function handleManageCore() {
    const el = document.getElementById("security-keys-form");
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = document.getElementById("current-password-input") as HTMLInputElement | null;
    if (input) setTimeout(() => input.focus({ preventScroll: true }), 350);
  }

  // F-19: INITIALIZE SECURE WALLET goes to the real Wallet panel.
  function handleOpenWallet() {
    if (onNavigate) onNavigate("wallet");
    else window.location.assign("/dashboard?tab=wallet");
  }

  useEffect(() => {
    fetchUserData();
  }, []);

  async function fetchUserData() {
    setLoading(true);
    const { data: { session } } = await auth.getSession();
    if (session) {
      setUser(session.user);
      const { data, error } = await db
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
      const { error } = await db
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
      lsSet("username", username);
      toast.success("Profile saved.");
    } catch (e: any) {
      toast.error("Could not save: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
        toast.error("New passwords don't match.");
        return;
    }
    if (!currentPassword) {
        toast.error("Enter your current password to set a new one.");
        return;
    }
    setSaving(true);
    try {
        const { error } = await auth.updateUser({ password: newPassword, currentPassword } as any);
        if (error) throw error;
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Password updated.");
    } catch (e: any) {
        toast.error("Could not update password: " + e.message);
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

        const { error: uploadError } = await db.storage
            .from('profiles')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = db.storage
            .from('profiles')
            .getPublicUrl(filePath);

        setAvatarUrl(publicUrl);
        await db.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
        toast.success("Profile photo updated.");
    } catch (e: any) {
        toast.error("Upload failed: " + e.message);
    } finally {
        setSaving(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: <Fingerprint size={18} /> },
    { id: "security", label: "Password & Security", icon: <Key size={18} /> },
    { id: "billing", label: "Billing", icon: <Wallet size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Zap size={18} /> },
  ];

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
            <Loader2 className="animate-spin text-primary-600 w-12 h-12 mb-6" />
            <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em]">Loading your settings…</p>
        </div>
    );
  }

  return (
    <div className="space-y-10 pb-24 lg:pb-0 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Account &amp; Security</h2>
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
                <p className="text-[15px] text-slate-500 font-medium">Manage your profile, password and notification preferences.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Settings sections */}
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-4 px-8 py-5 rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 group ${
                            activeTab === tab.id 
                            ? "bg-primary-600 text-white border-primary-600 shadow-2xl shadow-primary-600/25 active:scale-95"
                            : "bg-white text-slate-400 border-white hover:border-slate-200 hover:text-slate-600"
                        }`}
                    >
                        <span className={activeTab === tab.id ? "text-primary-100" : "group-hover:text-slate-900"}>{tab.icon}</span>
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
                                
                                {/* Profile photo */}
                                <div className="flex flex-col md:flex-row items-center gap-10 mb-16 relative z-10">
                                    <div className="relative group">
                                        <div className="w-36 h-36 rounded-[3rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden relative ring-4 ring-slate-50 transition-all group-hover:ring-primary-100">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-primary-600 flex items-center justify-center"><span className="text-white font-black text-5xl uppercase">{(username || "U").charAt(0)}</span></div>
                                            )}
                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                                <Camera className="mb-2" size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                                            </div>
                                        </div>
                                        <input type="file" onChange={handleAvatarUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                                        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-[1.2rem] bg-primary-600 text-white flex items-center justify-center shadow-xl border-4 border-white group-hover:scale-110 transition-transform">
                                            <Sparkles size={18} />
                                        </div>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight italic mb-1">{fullName || username}</h3>
                                        {emailVerified ? (
                                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3">
                                             <ShieldCheck size={14} className="text-primary-600" /> Email Verified • {user.email}
                                          </p>
                                        ) : (
                                          <div className="flex flex-col items-center md:items-start gap-2.5">
                                            <p className="text-[11px] text-amber-600 font-bold uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3">
                                               <AlertCircle size={14} className="text-amber-500" /> Email Not Verified • {user.email}
                                            </p>
                                            <button
                                              onClick={handleResendVerification}
                                              disabled={verifyState === "sending"}
                                              className="px-4 py-2 min-h-[44px] bg-amber-50 border border-amber-200 rounded-full text-[10px] font-black text-amber-700 uppercase tracking-widest hover:bg-amber-100 transition-colors disabled:opacity-60 flex items-center gap-2"
                                            >
                                              {verifyState === "sending" ? <Loader2 size={12} className="animate-spin" /> : verifyState === "sent" ? <CheckCircle size={12} /> : <Mail size={12} />}
                                              {verifyState === "sending" ? "Sending…" : verifyState === "sent" ? "Email Sent" : "Resend Verification Email"}
                                            </button>
                                          </div>
                                        )}
                                    </div>
                                </div>

                                {/* Profile fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-[15px] font-bold text-slate-900 focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                                            placeholder="Enter your full legal name"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-[15px] font-bold text-slate-900 focus:border-primary-500 focus:bg-white transition-all shadow-inner"
                                            placeholder="Your username"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio</label>
                                        <textarea
                                            rows={5}
                                            value={bio}
                                            onChange={e => setBio(e.target.value)}
                                            placeholder="A short bio that appears on your profile…"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 text-[15px] font-bold text-slate-900 focus:border-primary-500 focus:bg-white transition-all shadow-inner resize-none"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={handleUpdateProfile}
                                        disabled={saving}
                                        className="px-12 py-6 bg-primary-600 text-white font-black text-[14px] uppercase tracking-[0.2em] rounded-[2rem] flex items-center gap-4 hover:opacity-90 transition-all shadow-2xl shadow-primary-600/25 active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="text-white" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "security" && (
                        <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 md:p-16 shadow-xl space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-red-50 rounded-full blur-3xl -mr-40 -mt-40 opacity-30" />
                                
                                <div className="space-y-8 relative z-10" id="security-keys-form">
                                    <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Lock size={18} className="text-primary-600" /> Change Password
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                            <input id="current-password-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm focus:border-primary-500 transition-all shadow-inner" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm focus:border-primary-500 transition-all shadow-inner" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] px-8 py-5 text-sm focus:border-primary-500 transition-all shadow-inner" placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <button onClick={handleChangePassword} disabled={saving || !newPassword} className="px-10 py-5 bg-primary-600 text-white font-black text-[12px] uppercase tracking-widest rounded-[1.5rem] hover:opacity-90 transition-all flex items-center gap-3 shadow-xl">
                                        Update Password <Key size={16} className="text-white" />
                                    </button>
                                </div>

                                <div className="p-8 bg-primary-700 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white border border-white/20">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-[18px] font-black tracking-tight flex items-center gap-2">Password &amp; Security</h4>
                                            <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mt-1">Keep your account safe with a strong password</p>
                                        </div>
                                    </div>
                                    <button onClick={handleManageCore} className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-50 transition-all shadow-lg">Change Password</button>
                                </div>
                            </div>

                            {/* Fix Round 7 (item 9): danger zone — Delete Account */}
                            <div className="bg-white border-2 border-red-100 rounded-[3rem] p-10 md:p-16 shadow-xl">
                                <h4 className="text-[12px] font-black text-red-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4">
                                    <AlertCircle size={18} /> Danger Zone
                                </h4>
                                <p className="text-[14px] text-slate-500 font-medium leading-relaxed max-w-xl mb-8">
                                    Deleting your account removes your name, username and profile details and
                                    permanently closes the account. Your past orders stay on the store&rsquo;s
                                    records. Deletion is not possible while your wallet holds a balance or an
                                    order is still in progress. This cannot be undone.
                                </p>
                                <button onClick={() => { setDeleteText(""); setDeleteOpen(true); }} className="px-10 py-5 bg-red-600 text-white font-black text-[12px] uppercase tracking-widest rounded-[1.5rem] hover:bg-red-700 transition-all shadow-xl">
                                    Delete My Account
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "billing" && (
                        <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-[3rem] p-16 text-center shadow-xl">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100">
                                <Wallet size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3">Billing &amp; Payments</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">Card payments are processed by Stripe — your card data never touches our servers. Your store wallet balance, top-ups and ledger live in the Wallet panel.</p>
                            <button onClick={handleOpenWallet} className="px-10 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-widest hover:opacity-90 transition-all shadow-2xl">Open My Wallet</button>
                        </motion.div>
                    )}

                    {activeTab === "notifications" && (
                        <motion.div key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-xl">
                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-4">Notifications</h3>
                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed ml-4 mb-10 max-w-xl">
                                These are transactional notifications about your own orders, wallet and support
                                conversations — they appear in the bell at the top of the page and can&rsquo;t be
                                switched off, so you never miss news about your money.
                            </p>
                            <div className="space-y-6">
                                {[
                                    { title: "Order Updates", desc: "A notification when your order is placed, paid, delivered, completed, cancelled or refunded." },
                                    { title: "Support Replies", desc: "A notification when our support team replies to your message." },
                                    { title: "Wallet Credits", desc: "A notification whenever money lands in your wallet — a card top-up or a refund." }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4 p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                                        <div className="max-w-[75%]">
                                            <h4 className="text-[16px] font-black text-slate-900">{item.title}</h4>
                                            <p className="text-[13px] text-slate-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                        <span className="shrink-0 px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Always on</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Fix Round 7 (item 9): Delete Account confirm modal */}
        <AnimatePresence>
            {deleteOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !deleting && setDeleteOpen(false)} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8">
                        <h3 className="text-xl font-black text-slate-900 mb-2">Delete your account?</h3>
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">
                            Your profile details will be removed and the account permanently closed.
                            Past orders remain on the store&rsquo;s records. Type <span className="font-black text-red-600">DELETE</span> to confirm.
                        </p>
                        <input
                            value={deleteText}
                            onChange={(e) => setDeleteText(e.target.value)}
                            placeholder="Type DELETE"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-red-400 mb-6"
                        />
                        <div className="flex gap-3">
                            <button disabled={deleting} onClick={() => setDeleteOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest">Keep Account</button>
                            <button disabled={deleteText !== "DELETE" || deleting} onClick={handleDeleteAccount} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2">
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : "Delete Forever"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}

