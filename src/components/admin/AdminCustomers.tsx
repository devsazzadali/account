import React, { useEffect, useState } from "react";
import {
  User, Mail, Calendar, ShieldCheck, Search, Loader2,
  ExternalLink, ShieldAlert, Users, RefreshCw, MessageSquare,
  Edit2, Trash2, X, Check, Shield, Crown, Star
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function AdminCustomers({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => { fetchProfiles(); }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = profiles.filter(p => {
    const matchSearch = searchTerm === "" ||
      (p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "All" || p.role === filterRole.toLowerCase();
    return matchSearch && matchRole;
  });

  const adminCount = profiles.filter(p => p.role === "admin").length;
  const premiumCount = profiles.filter(p => p.is_premium).length;
  const userCount = profiles.length;

  async function handleUpdateUser(updatedData: any) {
    if (!selectedUser) return;
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", selectedUser.id);
      
      if (error) throw error;
      
      setProfiles(prev => prev.map(p => p.id === selectedUser.id ? { ...p, ...updatedData } : p));
      setSelectedUser({ ...selectedUser, ...updatedData });
      setIsEditing(false);
      alert("Identity Protocol Updated Successfully!");
    } catch (e: any) {
      alert("Access Control Error: " + e.message);
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">

      {/* Header */}
      <div className="px-8 py-8 bg-white border-b border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-[28px] font-black text-slate-900 tracking-tight">Identity Nexus</h2>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">Global authority for user permissions and tier management.</p>
          </div>
          <button
            onClick={fetchProfiles}
            className="px-6 py-2.5 bg-slate-900 text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Synchronize Node
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <StatCard label="Identities" value={userCount} color="text-slate-900" bg="bg-slate-100" />
          <StatCard label="Admin Privileges" value={adminCount} color="text-primary-600" bg="bg-primary-50" />
          <StatCard label="Premium Tier" value={premiumCount} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Active Nodes" value={profiles.length} color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      </div>

      {/* Table Section */}
      <div className="p-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
          {/* Filter Bar */}
          <div className="px-6 py-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/30">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search encrypted identity records..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:border-primary-600 transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="border border-slate-200 rounded-2xl px-4 py-3 text-[14px] font-black bg-white focus:outline-none focus:border-primary-600 min-w-[150px] shadow-sm uppercase tracking-tighter"
              >
                <option>All Roles</option>
                <option>Admin</option>
                <option>Moderator</option>
                <option>User</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Identity</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Access Tier</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Node Created</th>
                  <th className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="py-24 text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary-600" />
                    <p className="text-[13px] text-slate-400 mt-4 font-bold tracking-tight uppercase tracking-[0.2em]">Decrypting Ledger...</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="py-24 text-center">
                    <Users size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[16px] font-black text-slate-900">Zero Identities Detected</p>
                  </td></tr>
                ) : filtered.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedUser(profile)}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm relative">
                          <img
                            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || "user"}`}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                          <div className={`absolute bottom-0 right-0 w-3 h-3 ${profile.is_premium ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-white rounded-full`} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-[15px] group-hover:text-primary-600 transition-colors flex items-center gap-2">
                            {profile.full_name || "Anonymous"}
                            {profile.is_premium && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">@{profile.username || "unknown"} • {profile.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <RoleBadge role={profile.role} isPremium={profile.is_premium} />
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-bold text-[13px]">{new Date(profile.created_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Sync established</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem("selectedUserChat", profile.username);
                            setActiveTab?.("messages");
                          }}
                          className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" 
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedUser(profile); setIsEditing(true); }}
                          className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details / Edit Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-8 py-7 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                      <User size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black tracking-tight">{isEditing ? "Modify Identity Node" : "Identity Intelligence"}</h3>
                      <p className="text-[11px] text-white/50 font-bold uppercase tracking-[0.3em]">Sector 7G Identity • {selectedUser.id.slice(0,8).toUpperCase()}</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><X size={20} /></button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {isEditing ? (
                  <UserEditForm 
                    user={selectedUser} 
                    onSave={handleUpdateUser} 
                    onCancel={() => setIsEditing(false)} 
                    loading={editLoading}
                  />
                ) : (
                  <UserDetailsView 
                    user={selectedUser} 
                    onEdit={() => setIsEditing(true)} 
                    setActiveTab={setActiveTab} 
                    onClose={() => setSelectedUser(null)} 
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color, bg }: any) {
  return (
    <div className={`${bg} rounded-[2rem] p-6 border border-white shadow-sm`}>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{label}</div>
      <div className={`text-4xl font-black ${color}`}>{value}</div>
    </div>
  );
}

function RoleBadge({ role, isPremium }: { role: string, isPremium?: boolean }) {
  const map: Record<string, any> = {
    "admin": { cls: "bg-primary-50 text-primary-600 border-primary-200", icon: ShieldCheck, label: "Systems Admin" },
    "moderator": { cls: "bg-amber-50 text-amber-600 border-amber-200", icon: Shield, label: "Moderator" },
    "user": { cls: "bg-slate-100 text-slate-600 border-slate-200", icon: User, label: "Identity" },
  };
  const config = map[role?.toLowerCase()] || map["user"];
  const Icon = config.icon;
  return (
    <div className="flex flex-col gap-1.5 items-start">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${config.cls}`}>
        <Icon size={12} /> {config.label}
        </span>
        {isPremium && (
            <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                <Crown size={10} /> Premium Tier
            </span>
        )}
    </div>
  );
}

function UserDetailsView({ user, onEdit, setActiveTab, onClose }: any) {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-8">
        <div className="w-28 h-28 rounded-[2.5rem] bg-slate-100 border-4 border-white overflow-hidden shadow-2xl relative">
           <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="" className="w-full h-full object-cover" />
           {user.is_premium && (
               <div className="absolute top-0 right-0 p-1.5 bg-amber-500 rounded-bl-2xl text-white shadow-xl">
                  <Crown size={14} />
               </div>
           )}
        </div>
        <div className="flex-1">
          <h4 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{user.full_name || "Anonymous Entity"}</h4>
          <p className="text-[16px] text-slate-500 font-medium mb-6">@{user.username} • {user.email}</p>
          <div className="flex flex-wrap gap-3">
             <RoleBadge role={user.role} isPremium={user.is_premium} />
             <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Verified Node</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoBlock label="Comm Line" value={user.email} icon={<Mail size={18} />} />
        <InfoBlock label="Identity Handle" value={`@${user.username}`} icon={<User size={18} />} />
        <InfoBlock label="Creation Epoch" value={new Date(user.created_at).toLocaleDateString()} icon={<Calendar size={18} />} />
        <InfoBlock label="Access Authority" value={user.role?.toUpperCase() || "IDENTITY"} icon={<Shield size={18} />} />
      </div>

      <div className="pt-8 flex gap-5">
        <button 
          onClick={onEdit}
          className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20"
        >
          <Edit2 size={18} /> Modify Identity
        </button>
        <button 
          onClick={() => {
            localStorage.setItem("selectedUserChat", user.username);
            setActiveTab?.("messages");
            onClose();
          }}
          className="flex-1 py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20"
        >
          <MessageSquare size={18} /> Direct Comms
        </button>
      </div>
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Identity Legal Name</label>
          <input 
            value={formData.full_name} 
            onChange={e => setFormData({...formData, full_name: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] focus:outline-none focus:border-primary-600 transition-all shadow-inner"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">System Handle</label>
          <input 
            value={formData.username} 
            onChange={e => setFormData({...formData, username: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-[14px] focus:outline-none focus:border-primary-600 transition-all shadow-inner"
          />
        </div>
        
        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Premium Status Toggle</label>
          <button 
            onClick={() => setFormData({...formData, is_premium: !formData.is_premium})}
            className={`w-full flex items-center justify-between p-5 rounded-[2rem] border-2 transition-all ${
              formData.is_premium 
                ? "bg-amber-50 border-amber-500 text-amber-700 shadow-lg shadow-amber-500/10" 
                : "bg-slate-50 border-slate-100 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.is_premium ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <Crown size={24} />
               </div>
               <div className="text-left">
                  <div className="font-black text-[13px] uppercase tracking-widest">Premium Membership Tier</div>
                  <div className="text-[11px] font-medium opacity-60">Grant access to high-priority features and exclusive tools.</div>
               </div>
            </div>
            <div className={`w-14 h-7 rounded-full p-1 transition-colors ${formData.is_premium ? 'bg-amber-500' : 'bg-slate-300'}`}>
               <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.is_premium ? 'translate-x-7' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        <div className="space-y-3 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Access Authority Level</label>
          <div className="grid grid-cols-3 gap-4">
             {["admin", "moderator", "user"].map(role => (
               <button 
                key={role}
                onClick={() => setFormData({...formData, role})}
                className={`py-4 px-6 rounded-[1.5rem] border-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                  formData.role === role 
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20" 
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                }`}
               >
                 {role}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="pt-10 flex gap-5">
        <button 
          onClick={onCancel}
          className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[13px] uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancel Op
        </button>
        <button 
          disabled={loading}
          onClick={() => onSave(formData)}
          className="flex-[2] py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} 
          Authorize Identity Update
        </button>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, icon }: any) {
  return (
    <div className="p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center gap-5">
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</div>
        <div className="text-[14px] font-bold text-slate-900 truncate max-w-[180px]">{value}</div>
      </div>
    </div>
  );
}
