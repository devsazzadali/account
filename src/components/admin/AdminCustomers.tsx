import React, { useEffect, useState } from "react";
import { 
  User, 
  Mail, 
  Calendar, 
  MoreVertical, 
  ShieldCheck, 
  Search, 
  Filter, 
  Loader2,
  Trash2,
  Shield,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export function AdminCustomers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setProfiles(data || []);
    } catch (err: any) {
        console.error("Error fetching profiles:", err.message);
    } finally {
        setLoading(false);
    }
  }

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                    <Shield size={12} />
                    Identity Console
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-900 italic">User Base</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage your acquisition base and view global identity insights.</p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                  onClick={fetchProfiles}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                >
                    <Loader2 size={14} className={loading ? "animate-spin" : ""} />
                    Refresh Node
                </button>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-2">
                    <Mail size={16} />
                    Broadcast Protocol
                </button>
            </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search identities by name or username..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-white transition-all flex items-center justify-center gap-2">
                        <Filter size={16} />
                        Filter Roles
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Identity Detail</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Access Level</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Joined Date</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Status</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading && profiles.length === 0 ? (
                            <tr><td colSpan={5} className="p-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Identity Records...</span>
                                </div>
                            </td></tr>
                        ) : filteredProfiles.length === 0 ? (
                            <tr><td colSpan={5} className="p-24 text-center">
                                <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                    <User size={48} className="text-slate-200" />
                                    <span className="text-sm font-bold text-slate-400">No Identities Discovered</span>
                                </div>
                            </td></tr>
                        ) : filteredProfiles.map((profile) => (
                            <tr key={profile.id} className="hover:bg-slate-50/80 transition-all group">
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            <img 
                                                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'user'}`} 
                                                className="w-full h-full object-cover rounded-xl" 
                                                alt="" 
                                            />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-slate-900 block group-hover:text-primary-600 transition-colors">
                                                {profile.full_name || "Anonymous User"}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                                @{profile.username || "identity_unverified"}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                        profile.role === 'admin' 
                                        ? "bg-primary-50 text-primary-700 border border-primary-100" 
                                        : "bg-slate-50 text-slate-600 border border-slate-100"
                                    }`}>
                                        {profile.role === 'admin' ? <ShieldCheck size={10} /> : <User size={10} />}
                                        {profile.role || 'user'}
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                        <Calendar size={14} className="text-slate-300" />
                                        {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-glow shadow-green-500/50 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Verified</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 border-b border-slate-50 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2.5 text-slate-400 hover:text-primary-600 hover:bg-white border border-transparent hover:border-slate-200 shadow-sm rounded-xl transition-all">
                                            <ExternalLink size={16} />
                                        </button>
                                        <button className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 shadow-sm rounded-xl transition-all">
                                            <ShieldAlert size={16} />
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
  );
}
