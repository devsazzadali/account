"use client";

import React, { useEffect, useState } from "react";
import {
  User, Mail, Calendar, ShieldCheck, Search, Loader2,
  ExternalLink, ShieldAlert, Users, RefreshCw, MessageSquare,
  Edit2, Trash2, X, Check, Shield, Crown, Star
} from "lucide-react";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { lsGet, lsSet } from "@/src/lib/storage";


export function AdminCustomers({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  // Fix Round 7 (item 7): suspension state per user id, from
  // user_risk_profiles.is_blocked — shown in the list and the drill-in.
  const [riskMap, setRiskMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showCreateManager, setShowCreateManager] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const [{ data, error }, riskRes] = await Promise.all([
        db.from("profiles").select("*").order("created_at", { ascending: false }),
        db.from("user_risk_profiles").select("user_id, is_blocked"),
      ]);
      if (error) throw error;
      setProfiles(data || []);
      const map: Record<string, boolean> = {};
      for (const r of riskRes.data || []) map[r.user_id] = !!r.is_blocked;
      setRiskMap(map);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSuspend(user: any, next: boolean) {
    try {
      const res = await fetch("/api/admin/risk", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, blocked: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setRiskMap((prev) => ({ ...prev, [user.id]: next }));
      toast.success(next ? `${user.username || "Customer"} suspended — they can no longer order or write.` : `${user.username || "Customer"} reactivated.`);
    } catch (e: any) {
      toast.error("Could not update suspension: " + e.message);
    }
  }

  const filtered = profiles.filter(p => {
    const matchSearch = searchTerm === "" ||
      (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "All" || p.role === (filterRole === "Manager" ? "moderator" : filterRole.toLowerCase());
    return matchSearch && matchRole;
  });

  const adminCount = profiles.filter(p => p.role === "admin").length;
  const premiumCount = profiles.filter(p => p.is_premium).length;

  async function handleUpdateUser(updatedData: any) {
    if (!selectedUser) return;
    setEditLoading(true);
    try {
      const { error } = await db
        .from("profiles")
        .update(updatedData)
        .eq("id", selectedUser.id);
      
      if (error) throw error;
      
      setProfiles(prev => prev.map(p => p.id === selectedUser.id ? { ...p, ...updatedData } : p));
      setSelectedUser({ ...selectedUser, ...updatedData });
      setIsEditing(false);
      toast.success("Updated!");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">

      {/* Header */}
      <div className="px-4 md:px-8 py-6 md:py-8 bg-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-[24px] md:text-[28px] font-black text-slate-900 tracking-tight">Customers</h2>
            <p className="text-[12px] md:text-[14px] text-slate-500 font-medium">User permissions and tier management.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowCreateManager(true)}
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
            >
              <Shield size={16} /> Create Manager
            </button>
            <button
              onClick={fetchProfiles}
              className="w-full md:w-auto px-6 py-2.5 bg-primary-600 text-white text-[13px] font-bold rounded-xl hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-6 md:mt-8">
          <StatCard label="Total" value={profiles.length} bg="bg-slate-100" />
          <StatCard label="Admins" value={adminCount} color="text-primary-600" bg="bg-primary-50" />
          <StatCard label="Premium" value={premiumCount} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Users" value={profiles.length - adminCount} color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="panel overflow-hidden">
          {/* Filter Bar */}
          <div className="px-4 md:px-6 py-4 md:py-6 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-primary-600 transition-all shadow-sm"
              />
            </div>
            <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="w-full md:w-auto border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-bold bg-white focus:outline-none"
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>User</option>
            </select>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Identity</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Access Tier</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Joined</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="py-24 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-600" />
                  </td></tr>
                ) : filtered.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedUser(profile)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full bg-primary-600 flex items-center justify-center"><span className="text-white font-black text-sm uppercase">{(profile.username || "?").charAt(0)}</span></div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${profile.is_premium ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-white rounded-full`} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-[14px] group-hover:text-primary-600 transition-colors flex items-center gap-2">
                            {profile.full_name || "Anonymous"}
                            {profile.is_premium && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[200px]">@{profile.username} • {profile.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <RoleBadge role={profile.role} isPremium={profile.is_premium} />
                      {riskMap[profile.id] && (
                        <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600">Suspended</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-slate-700 font-bold text-[13px]">{new Date(profile.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); lsSet("selectedUserChat", profile.username); setActiveTab?.("messages"); }} className="p-2 text-slate-400 hover:text-primary-600"><MessageSquare size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(profile); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-primary-600"><Edit2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
             {loading ? (
                <div className="py-24 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-600" /></div>
             ) : filtered.map(profile => (
               <div key={profile.id} className="p-4 bg-white active:bg-slate-50 transition-colors" onClick={() => setSelectedUser(profile)}>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-primary-600 flex items-center justify-center"><span className="text-white font-black text-base uppercase">{(profile.username || "?").charAt(0)}</span></div>
                        )}
                        {profile.is_premium && <div className="absolute top-0 right-0 p-1 bg-amber-500 text-white rounded-bl-lg shadow-sm"><Crown size={10} /></div>}
                     </div>
                     <div className="min-w-0">
                        <div className="font-black text-slate-900 text-[15px] truncate">{profile.full_name || "Anonymous"}</div>
                        <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">@{profile.username}</div>
                     </div>
                     <div className="ml-auto">
                        <RoleBadge role={profile.role} />
                     </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{new Date(profile.created_at).toLocaleDateString()}</span>
                     <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); lsSet("selectedUserChat", profile.username); setActiveTab?.("messages"); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-lg"><MessageSquare size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedUser(profile); setIsEditing(true); }} className="p-2.5 bg-slate-100 text-slate-600 rounded-lg"><Edit2 size={16} /></button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Detail / Edit Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 md:px-8 py-5 md:py-7 bg-primary-600 text-white flex justify-between items-center">
                <h3 className="text-lg md:text-xl font-black tracking-tight">{isEditing ? "Modify Node" : "Intelligence"}</h3>
                <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-2 hover:bg-white/10 rounded-xl"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                {isEditing ? (
                  <UserEditForm user={selectedUser} onSave={handleUpdateUser} onCancel={() => setIsEditing(false)} loading={editLoading} />
                ) : (
                  <UserDetailsView user={selectedUser} suspended={!!riskMap[selectedUser.id]} onToggleSuspend={handleToggleSuspend} onEdit={() => setIsEditing(true)} setActiveTab={setActiveTab} onClose={() => setSelectedUser(null)} />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Manager Modal */}
      <AnimatePresence>
        {showCreateManager && (
          <CreateManagerModal
            onClose={() => setShowCreateManager(false)}
            onCreated={() => { setShowCreateManager(false); fetchProfiles(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateManagerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      toast.error("Name, a valid email and a password of 8+ characters are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not create the manager account");
      toast.success(`Manager account created for ${json.user?.email || email.trim()} — they can sign in now.`);
      onCreated();
    } catch (e: any) {
      toast.error("Could not create manager: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg panel shadow-2xl overflow-hidden">
        <div className="px-6 md:px-8 py-5 md:py-6 bg-primary-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-black tracking-tight flex items-center gap-2"><Shield size={18} /> Create Manager</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl"><X size={20} /></button>
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            A manager signs in with this email and password and gets the <strong className="text-slate-800">orders console only</strong> —
            orders, delivery, escrow and disputes. Products, payments, settings and customers stay admin-only.
            Suspend the account here in Customers to deactivate it instantly.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Store Manager One" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-600" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="manager@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-600" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Initial Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-600" />
          </div>
          <div className="pt-2 flex gap-3">
            <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest">Cancel</button>
            <button disabled={busy} onClick={handleCreate} className="flex-[2] py-4 bg-primary-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2">
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Create Manager Account"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, color, bg }: any) {
  return (
    <div className={`${bg} rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-white shadow-sm`}>
      <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 md:mb-3">{label}</div>
      <div className={`text-2xl md:text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function RoleBadge({ role, isPremium }: { role?: string, isPremium?: boolean }) {
  const map: Record<string, any> = {
    "admin": { cls: "bg-primary-50 text-primary-600", label: "Admin" },
    "moderator": { cls: "bg-amber-50 text-amber-600", label: "Manager" },
    "user": { cls: "bg-slate-100 text-slate-600", label: "User" },
  };
  const normalizedRole = role ? role.toLowerCase() : "user";
  const config = map[normalizedRole as keyof typeof map] || map["user"];
  return (
    <div className="flex flex-col items-start gap-1">
       <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${config.cls}`}>
        {config.label}
       </span>
    </div>
  );
}

function UserDetailsView({ user, suspended, onToggleSuspend, onEdit, setActiveTab, onClose }: any) {
  // Fix Round 7 (item 7): the drill-in — this customer's orders, spend
  // and wallet, loaded per customer when the detail opens.
  const [orders, setOrders] = useState<any[] | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [busySuspend, setBusySuspend] = useState(false);
  // Wallet adjustment (full-admin rail): credit/debit with a mandatory
  // reason; the API records it as an "admin_adjustment" ledger row.
  const [adjDirection, setAdjDirection] = useState<"credit" | "debit">("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjBusy, setAdjBusy] = useState(false);

  async function applyAdjustment() {
    const amt = Number(adjAmount);
    if (!amt || amt <= 0) { toast.error("Enter an amount greater than zero"); return; }
    if (adjReason.trim().length < 3) { toast.error("A reason is required for every adjustment"); return; }
    setAdjBusy(true);
    try {
      const res = await fetch("/api/admin/wallet-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, direction: adjDirection, amount: amt, reason: adjReason.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Adjustment failed");
      setWallet((w: any) => ({ ...(w || {}), balance: j.balance }));
      setAdjAmount("");
      setAdjReason("");
      toast.success(`Wallet ${adjDirection === "credit" ? "credited" : "debited"} — new balance $${Number(j.balance).toFixed(2)}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdjBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [oRes, wRes] = await Promise.all([
        db.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        db.from("wallets").select("*").eq("user_id", user.id).single(),
      ]);
      if (cancelled) return;
      setOrders(oRes.data || []);
      setWallet(wRes.data || null);
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  const num = (v: any) => Number(v ?? 0) || 0;
  const spend = (orders || [])
    .filter((o) => String(o.payment_status).toLowerCase() === "paid" && !["canceled", "cancelled"].includes(String(o.status).toLowerCase()))
    .reduce((s, o) => s + num(o.total_price), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-slate-100 border-4 border-white overflow-hidden shadow-xl shrink-0">
           {user.avatar_url ? (
             <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-primary-600 flex items-center justify-center"><span className="text-white font-black text-2xl uppercase">{(user.username || "?").charAt(0)}</span></div>
           )}
        </div>
        <div className="min-w-0">
          <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-1 truncate">{user.full_name || "Anonymous"}</h4>
          <p className="text-[14px] text-slate-500 font-medium truncate">@{user.username}</p>
          {suspended && <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-600">Suspended — cannot order or write</span>}
          {user.role === "moderator" && (
            <p className="mt-2 text-[11px] font-bold text-slate-400 leading-relaxed">Manager account — orders console only. Suspending this account deactivates its console access immediately; unsuspending restores it.</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Node</div>
           <div className="text-[13px] font-bold text-slate-900 truncate">{user.email}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Membership</div>
           <div className="text-[13px] font-bold text-slate-900">{user.is_premium ? "Premium Tier" : "Basic Node"}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Orders · Lifetime Spend</div>
           <div className="text-[13px] font-bold text-slate-900">{orders === null ? "Loading…" : `${orders.length} orders · $${spend.toFixed(2)} paid`}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Wallet Balance</div>
           <div className="text-[13px] font-bold text-slate-900">{wallet === null ? "—" : `$${num(wallet.balance).toFixed(2)}`}</div>
        </div>
      </div>

      {orders !== null && orders.length > 0 && (
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2 ml-1">Recent Orders</div>
          <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 bg-white">
                <span className="text-[12px] font-black text-slate-800">{o.id}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{o.status} · {o.payment_status}</span>
                <span className="text-[12px] font-black text-slate-900">${num(o.total_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 flex flex-col sm:flex-row gap-4">
        <button onClick={onEdit} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
          <Edit2 size={16} /> Edit Profile
        </button>
        <button onClick={() => { lsSet("selectedUserChat", user.username); setActiveTab?.("messages"); onClose(); }} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
          <MessageSquare size={16} /> Send Message
        </button>
        {user.role !== "admin" && (
          <button
            disabled={busySuspend}
            onClick={async () => { setBusySuspend(true); await onToggleSuspend(user, !suspended); setBusySuspend(false); }}
            className={`flex-1 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${suspended ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            <ShieldAlert size={16} /> {busySuspend ? "Working…" : suspended ? "Unsuspend" : "Suspend"}
          </button>
        )}
      </div>

      {user.role !== "admin" && (
        <div className="p-5 bg-primary-50/60 rounded-2xl border border-primary-100 space-y-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-primary-700 mb-1">Wallet Adjustment — Admin Only</div>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
              Credit a customer who paid the store offline, or debit a correction. Every adjustment is recorded in the
              customer&apos;s ledger as an <span className="text-slate-800">admin adjustment</span> with your reason and your
              identity — never as a card top-up — and written to the audit log. Only the free wallet balance is touched;
              money held in escrow is never affected.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAdjDirection("credit")}
              className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${adjDirection === "credit" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              Credit
            </button>
            <button
              onClick={() => setAdjDirection("debit")}
              className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${adjDirection === "debit" ? "bg-red-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              Debit
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount (USD)"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all"
            />
            <input
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              type="text"
              maxLength={300}
              placeholder="Reason (required) — e.g. Bank transfer received"
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all"
            />
          </div>
          <button
            onClick={applyAdjustment}
            disabled={adjBusy}
            className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {adjBusy ? <Loader2 size={14} className="animate-spin" /> : null}
            Apply {adjDirection === "credit" ? "Credit" : "Debit"}
          </button>
        </div>
      )}
    </div>
  );
}

function UserEditForm({ user, onSave, onCancel, loading }: any) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    username: user.username || "",
    role: user.role || "user",
    is_premium: user.is_premium || false
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
          <input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-600" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Premium Tier</label>
          <button onClick={() => setFormData({...formData, is_premium: !formData.is_premium})} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${formData.is_premium ? 'bg-amber-50 border-amber-500 text-primary-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
             <span className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><Crown size={14} /> Premium Membership</span>
             <div className={`w-10 h-5 rounded-full p-1 ${formData.is_premium ? 'bg-amber-500' : 'bg-slate-300'}`}>
                <div className={`w-3 h-3 bg-white rounded-full transition-all ${formData.is_premium ? 'translate-x-5' : 'translate-x-0'}`} />
             </div>
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">System Role</label>
          <div className="grid grid-cols-3 gap-2">
             {["admin", "moderator", "user"].map(role => (
               <button key={role} onClick={() => setFormData({...formData, role})} className={`py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${formData.role === role ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-400 border-slate-100"}`}>
                 {role === "moderator" ? "Manager" : role}
               </button>
             ))}
          </div>
        </div>
      </div>
      <div className="pt-6 flex gap-3">
        <button onClick={onCancel} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest">Cancel</button>
        <button disabled={loading} onClick={() => onSave(formData)} className="flex-[2] py-4 bg-primary-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-700 shadow-lg shadow-primary-600/20">
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

