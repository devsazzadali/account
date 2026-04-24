import React, { useEffect, useState } from "react";
import {
  User, Mail, Calendar, ShieldCheck, Search, Loader2,
  ExternalLink, ShieldAlert, Users, RefreshCw
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export function AdminCustomers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");

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
      (p.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "All" || p.role === filterRole.toLowerCase();
    return matchSearch && matchRole;
  });

  const adminCount = profiles.filter(p => p.role === "admin").length;
  const userCount = profiles.filter(p => p.role !== "admin").length;

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* Header */}
      <div className="px-6 py-5 border-b border-[#e0e0e0] bg-[#fafafa] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-[20px] font-bold text-[#333]">User Management</h2>
          <p className="text-[13px] text-[#999] mt-0.5">View and manage all registered users</p>
        </div>
        <button
          onClick={fetchProfiles}
          className="px-5 py-2.5 border border-[#ddd] text-[#555] text-[13px] font-bold rounded hover:bg-[#f5f5f5] transition-colors flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-0 border-b border-[#e0e0e0]">
        <div className="px-6 py-4 border-r border-[#e0e0e0]">
          <div className="text-[11px] text-[#999] font-medium uppercase tracking-wide">Total Users</div>
          <div className="text-[22px] font-black text-[#1976d2] mt-0.5">{profiles.length}</div>
        </div>
        <div className="px-6 py-4 border-r border-[#e0e0e0]">
          <div className="text-[11px] text-[#999] font-medium uppercase tracking-wide">Admins</div>
          <div className="text-[22px] font-black text-[#e4393c] mt-0.5">{adminCount}</div>
        </div>
        <div className="px-6 py-4">
          <div className="text-[11px] text-[#999] font-medium uppercase tracking-wide">Regular Users</div>
          <div className="text-[22px] font-black text-[#52c41a] mt-0.5">{userCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4 border-b border-[#e0e0e0] bg-[#fafafa] flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bbb]" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-4 py-2 border border-[#ddd] rounded text-[13px] focus:outline-none focus:border-[#e4393c] bg-white"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="border border-[#ddd] rounded px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#e4393c] w-full md:w-40"
        >
          <option>All</option>
          <option>Admin</option>
          <option>User</option>
        </select>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
            <tr>
              <th className="px-6 py-3 font-bold text-[#333]">User</th>
              <th className="px-6 py-3 font-bold text-[#333]">Role</th>
              <th className="px-6 py-3 font-bold text-[#333]">Joined</th>
              <th className="px-6 py-3 font-bold text-[#333]">Status</th>
              <th className="px-6 py-3 font-bold text-[#333] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f0]">
            {loading ? (
              <tr><td colSpan={5} className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#e4393c]" />
                <p className="text-[12px] text-[#999] mt-2">Loading users...</p>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-[#999]">
                <Users size={40} className="mx-auto text-[#ddd] mb-2" />
                <p className="text-[13px]">No users found</p>
              </td></tr>
            ) : filtered.map(profile => (
              <tr key={profile.id} className="hover:bg-[#fff8f8] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#e0e0e0] overflow-hidden shrink-0">
                      <img
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || "user"}`}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-[#333] group-hover:text-[#e4393c] transition-colors">
                        {profile.full_name || "Anonymous User"}
                      </div>
                      <div className="text-[11px] text-[#999]">@{profile.username || "unknown"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {profile.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#fff1f0] text-[#e4393c] border border-[#ffa39e]">
                      <ShieldCheck size={11} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#f0f2f5] text-[#555] border border-[#e0e0e0]">
                      <User size={11} /> User
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-[#555]">
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52c41a] animate-pulse" /> Verified
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-[#999] hover:text-[#1976d2] hover:bg-[#e6f7ff] rounded transition-colors" title="View Profile">
                      <ExternalLink size={15} />
                    </button>
                    <button className="p-2 text-[#999] hover:text-[#e4393c] hover:bg-[#fff1f0] rounded transition-colors" title="Flag User">
                      <ShieldAlert size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#e0e0e0] bg-[#fafafa] text-[12px] text-[#999]">
        Showing {filtered.length} of {profiles.length} users
      </div>
    </div>
  );
}
