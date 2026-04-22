import { Search, User, ShoppingCart, Menu, LayoutDashboard, ShoppingBag, Store, Gavel, Ticket, Megaphone, FileText, Tag, Share2, Settings, LogOut, ChevronDown, Bell, MessageSquare, Crown } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export function Header() {
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username") || "User";
  const isLoggedIn = !!userRole;
  const isAdmin = userRole === "admin";

  const handleLogout = () => {
      localStorage.removeItem("userRole");
      localStorage.removeItem("username");
      window.location.href = "/login";
  };

  return (
    <header className="glass border-b border-white/5 sticky top-0 z-50 font-sans transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="bg-primary-500/10 p-1.5 rounded-lg border border-primary-500/20 group-hover:bg-primary-500/20 transition-colors">
               <Crown className="w-5 h-5 text-primary-400" />
            </span>
            <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-primary-50 transition-colors">
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
                    className="w-full bg-dark-900/50 border border-white/10 rounded-full pl-5 pr-12 py-2 text-sm text-dark-50 placeholder-dark-50/50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 focus:ring-1 focus:ring-primary-500/50 transition-all duration-300"
                />
                <button className="absolute right-1 top-1 h-[calc(100%-8px)] px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-full flex items-center justify-center transition-colors">
                    <Search className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 text-sm text-dark-50/80 cursor-pointer hover:text-white border border-white/10 rounded-full px-3 py-1.5 bg-dark-900/50 transition-colors">
            <div className="w-4 h-4 rounded-full bg-primary-600 border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-blue-500"></div>
            </div>
            <span className="font-medium text-xs">EN</span>
            <span className="text-white/20">|</span>
            <span className="font-medium text-xs">USD</span>
          </div>

          {isLoggedIn ? (
            <>
                <div className="hidden md:flex items-center gap-4 text-dark-50/70">
                    <button className="hover:text-primary-400 transition-colors hover:animate-float">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <div className="relative hover:animate-float">
                        <button className="hover:text-primary-400 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-950 animate-pulse"></div>
                    </div>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-3 focus:outline-none py-2 px-1">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-semibold text-white flex items-center justify-end gap-2">
                                {username}
                            </div>
                            <div className="text-[10px] text-primary-400/80 font-medium tracking-wider uppercase">
                                {isAdmin ? "Administrator" : "Member"}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 border-2 border-white/10 ring-2 ring-transparent group-hover:ring-primary-500/30 transition-all">
                        {username.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-2 w-72 glass-card rounded-xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform origin-top-right translate-y-2 group-hover:translate-y-0 overflow-hidden shadow-2xl">
                        {/* Header Section */}
                        <div className="p-5 border-b border-white/10 bg-dark-900/40">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
                                {username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-white mb-0.5">{username}</div>
                                    <div className="text-xs text-primary-400 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        Online
                                    </div>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-sm">
                                    <span className="text-dark-50/70">Monthly Revenue</span>
                                    <span className="font-bold text-white">$12,450.00</span>
                                </div>
                            )}
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 space-y-1">
                            <DropdownItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
                            {isAdmin ? (
                                <>
                                    <DropdownItem to="/seller/orders" icon={<Store size={18} className="text-primary-400" />} label="Store Management" />
                                    <DropdownItem to="#" icon={<Gavel size={18} className="text-orange-400" />} label="Dispute Center" />
                                    <DropdownItem to="#" icon={<Ticket size={18} className="text-blue-400" />} label="Service Tickets" />
                                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                                    <DropdownItem to="/admin" icon={<Settings size={18} className="text-dark-50/70" />} label="System Settings" />
                                </>
                            ) : (
                                <>
                                    <DropdownItem to="#" icon={<ShoppingBag size={18} className="text-primary-400" />} label="My Orders" />
                                    <DropdownItem to="#" icon={<Ticket size={18} className="text-blue-400" />} label="Support Tickets" />
                                    <div className="h-px bg-white/5 my-2 mx-2"></div>
                                    <DropdownItem to="#" icon={<Settings size={18} className="text-dark-50/70" />} label="Account Settings" />
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        <div className="p-3 border-t border-white/5 bg-dark-900/60">
                            <button 
                                onClick={handleLogout}
                                className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </>
          ) : (
            <Link to="/login" className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40">
                <User className="w-4 h-4" />
                Sign In
            </Link>
          )}
          
          <button className="md:hidden text-dark-50 hover:text-white transition-colors">
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
                className="w-full bg-dark-900/50 border border-white/10 rounded-full pl-5 pr-12 py-2 text-sm text-dark-50 placeholder-dark-50/50 focus:outline-none focus:border-primary-500/50 focus:bg-dark-900 transition-all"
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
        <Link to={to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-50/80 hover:text-white hover:bg-white/5 transition-all group">
            <span className="w-6 flex justify-center text-dark-50/50 group-hover:text-primary-400 transition-colors">
                {icon}
            </span>
            <span className="font-medium">{label}</span>
        </Link>
    )
}
