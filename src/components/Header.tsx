import { Search, User, ShoppingCart, Menu, LayoutDashboard, ShoppingBag, Store, Gavel, Ticket, Megaphone, FileText, Tag, Share2, Settings, LogOut, ChevronDown, Bell, MessageSquare, Crown, ShieldCheck, MailWarning } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchValue, setSearchValue] = useState("");
  const [revenue, setRevenue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        // Clear local storage on sign out
        localStorage.removeItem("userRole");
        localStorage.removeItem("username");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      // Sync legacy localStorage for existing components
      localStorage.setItem("userRole", data.role || "user");
      localStorage.setItem("username", data.username || "User");
    }
  }

  useEffect(() => {
    async function fetchRevenue() {
        if (profile?.role !== "admin") return;
        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const { data, error } = await supabase.from('orders').select('total_price').gte('created_at', firstDay);
            if (error) throw error;
            if (data) {
                const total = data.reduce((acc, o) => acc + Number(o.total_price), 0);
                setRevenue(total);
            }
        } catch (err) { console.error("Revenue error:", err); }
    }
    fetchRevenue();
  }, [profile]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const isEmailConfirmed = user?.email_confirmed_at;

  return (
    <header className="glass border-b border-slate-200 sticky top-0 z-50 font-sans transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="bg-primary-500/10 p-1.5 rounded-lg border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
               <Crown className="w-5 h-5 text-primary-600" />
            </span>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors">
              Account<span className="text-gradient">Store</span>
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full group">
                <input 
                    type="text" 
                    placeholder="Search for premium accounts..." 
                    value={searchValue}
                    onChange={handleSearchChange}
                    className="w-full bg-slate-100 border border-slate-200 rounded-full pl-5 pr-12 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 transition-all duration-300"
                />
                <button className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center transition-colors">
                    <Search className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {user && !isEmailConfirmed && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-black text-amber-700 animate-pulse uppercase tracking-widest">
               <MailWarning size={14} /> Verify Email
            </div>
          )}

          <div className="hidden md:flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 border border-slate-200 rounded-full px-3 py-1.5 bg-slate-100/50 transition-colors">
            <div className="w-4 h-4 rounded-full bg-primary-600 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500"></div>
            </div>
            <span className="font-medium text-xs">EN</span>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-xs">USD</span>
          </div>

          {user ? (
            <>
                <div className="hidden md:flex items-center gap-4 text-slate-500">
                    <button className="hover:text-primary-600 transition-colors hover:animate-float">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="relative hover:animate-float">
                        <button className="hover:text-primary-600 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-3 focus:outline-none py-2 px-1">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-black text-slate-900 flex items-center justify-end gap-2">
                                {profile?.username || user.email.split('@')[0]}
                                {profile?.is_premium && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-[10px] text-primary-600 font-bold tracking-wider uppercase flex items-center justify-end gap-1">
                                {profile?.role === "admin" ? "Systems Admin" : profile?.is_premium ? "Premium Member" : "Standard Tier"}
                            </div>
                        </div>
                        <div className={`w-10 h-10 rounded-xl ${profile?.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/30' : 'bg-gradient-to-br from-primary-500 to-blue-600 shadow-primary-500/20'} flex items-center justify-center text-white font-black shadow-lg border-2 border-white ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all`}>
                        {(profile?.username || user.email).charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right translate-y-2 group-hover:translate-y-0 overflow-hidden shadow-2xl">
                        {/* Header Section */}
                        <div className={`p-5 border-b border-slate-100 ${profile?.is_premium ? 'bg-amber-50/50' : 'bg-slate-50/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl ${profile?.is_premium ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-amber-500/20' : 'bg-gradient-to-br from-primary-500 to-blue-600 shadow-primary-500/20'} flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white`}>
                                {(profile?.username || user.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-black text-slate-900 truncate flex items-center gap-2">
                                       {profile?.username || user.email.split('@')[0]}
                                       {profile?.is_premium && <Crown size={14} className="text-amber-500 shrink-0" />}
                                    </div>
                                    <div className="text-[10px] text-primary-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Session Active
                                    </div>
                                </div>
                            </div>
                            {profile?.role === "admin" && (
                                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[11px] font-bold">
                                    <span className="text-slate-400 uppercase tracking-widest">Monthly Revenue</span>
                                    <span className="text-slate-900">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 space-y-1 bg-white">
                            <DropdownItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Operational Hub" />
                            {profile?.role === "admin" ? (
                                <>
                                    <DropdownItem to="/seller/orders" icon={<Store size={18} className="text-primary-600" />} label="Store Console" />
                                    <DropdownItem to="/admin" icon={<Gavel size={18} className="text-orange-500" />} label="Dispute Matrix" />
                                    <DropdownItem to="/admin" icon={<Ticket size={18} className="text-blue-500" />} label="Service Grid" />
                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                    <DropdownItem to="/admin" icon={<Settings size={18} className="text-slate-500" />} label="Core Settings" />
                                </>
                            ) : (
                                <>
                                    <DropdownItem to="/dashboard" icon={<ShoppingBag size={18} className="text-primary-600" />} label="Procurement History" />
                                    <DropdownItem to="/dashboard" icon={<Ticket size={18} className="text-blue-500" />} label="Communication Desk" />
                                    <div className="h-px bg-slate-100 my-2 mx-2"></div>
                                    <DropdownItem to="/dashboard" icon={<Settings size={18} className="text-slate-500" />} label="Security Node" />
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={handleLogout}
                                className="w-full bg-slate-900 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-slate-900/20"
                            >
                                <LogOut size={14} />
                                Terminate Session
                            </button>
                        </div>
                    </div>
                </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
               <Link to="/login" className="hidden lg:block text-slate-600 hover:text-primary-600 font-bold text-sm px-4 py-2 transition-colors">
                  Login
               </Link>
               <Link to="/signup" className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
                  <User className="w-4 h-4" />
                  Initialize Account
               </Link>
            </div>
          )}
          
          <button className="md:hidden text-slate-600 hover:text-slate-900 transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative w-full">
            <input 
                type="text" 
                placeholder="Search premium accounts..." 
                value={searchValue}
                onChange={handleSearchChange}
                className="w-full bg-slate-100 border border-slate-200 rounded-full pl-5 pr-12 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
            />
            <button className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 bg-primary-600 text-white rounded-full flex items-center justify-center">
                <Search className="w-4 h-4" />
            </button>
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all group">
            <span className="w-6 flex justify-center text-slate-400 group-hover:text-primary-600 transition-colors">
                {icon}
            </span>
            <span className="font-bold">{label}</span>
        </Link>
    )
}
