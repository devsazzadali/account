import { Search, User, ShoppingCart, Menu, LayoutDashboard, ShoppingBag, Store, Gavel, Ticket, Megaphone, FileText, Tag, Share2, Settings, LogOut, ChevronDown, Bell, MessageSquare } from "lucide-react";
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 font-sans">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/" className="flex items-center">
            <span className="text-[#FF3333] font-bold text-2xl tracking-tighter">Account Store One</span>
          </Link>
        </div>

        {/* Search Bar - Added as requested */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full border border-gray-300 rounded pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-[#FF3333]"
                />
                <button className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-[#FF3333]">
                    <Search className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-gray-900 border border-gray-200 rounded px-2 py-1 bg-gray-50">
            <div className="w-4 h-4 rounded-full bg-green-600 border border-white ring-1 ring-gray-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-[#FF3333]"></div>
            </div>
            <span className="font-medium">EN</span>
            <span className="mx-1 text-gray-300">|</span>
            <span className="font-medium">USD</span>
          </div>

          {isLoggedIn ? (
            <>
                <div className="hidden md:flex items-center gap-3 text-gray-500">
                    <MessageSquare className="w-5 h-5 cursor-pointer hover:text-[#FF3333]" />
                    <div className="relative">
                        <Bell className="w-5 h-5 cursor-pointer hover:text-[#FF3333]" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                </div>

                {/* User Profile Dropdown */}
                <div className="relative group">
                    <button className="flex items-center gap-2 focus:outline-none py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-bold shadow-inner border-2 border-white ring-1 ring-gray-100">
                        {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden md:block text-left">
                            <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                {username} <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                {isAdmin ? "Admin Level" : "User Level"} <span className="text-yellow-500 text-[8px]">●</span>
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 top-full mt-0 w-72 bg-white rounded-lg shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right">
                        {/* Header Section - Only for Admin/Owner style */}
                        {isAdmin && (
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm">{username}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs pt-1 border-t border-gray-200 mt-1">
                                        <span className="text-gray-500">Total Sales</span>
                                        <span className="font-bold text-gray-900">$12,450.00</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-2">
                            <DropdownItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
                            {isAdmin ? (
                                <>
                                    <DropdownItem to="/seller/orders" icon={<Store size={16} className="text-red-500" />} label="Store Management" />
                                    <DropdownItem to="#" icon={<Gavel size={16} className="text-gray-400" />} label="Dispute Center" />
                                    <DropdownItem to="#" icon={<Ticket size={16} className="text-blue-400" />} label="Service Ticket" />
                                    <DropdownItem to="/admin" icon={<Settings size={16} className="text-gray-500" />} label="Settings (Admin)" />
                                </>
                            ) : (
                                <>
                                    <DropdownItem to="#" icon={<ShoppingBag size={16} className="text-yellow-500" />} label="My Orders" />
                                    <DropdownItem to="#" icon={<Ticket size={16} className="text-blue-400" />} label="Support Tickets" />
                                    <DropdownItem to="#" icon={<Settings size={16} className="text-gray-500" />} label="Settings" />
                                </>
                            )}
                        </div>

                        {/* Logout */}
                        <div className="p-2 border-t border-gray-100">
                            <button 
                                onClick={handleLogout}
                                className="w-full bg-[#FF3333] hover:bg-red-600 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                <LogOut size={14} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </>
          ) : (
            <Link to="/login" className="bg-[#FF3333] hover:bg-red-600 text-white px-5 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                <User className="w-4 h-4" />
                Login
            </Link>
          )}
          
          <button className="md:hidden text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Search - Visible only on mobile */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
            <input 
                type="text" 
                placeholder="Search..." 
                className="w-full border border-gray-300 rounded pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-[#FF3333]"
            />
            <button className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-[#FF3333]">
                <Search className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
}

function DropdownItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
    return (
        <Link to={to} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#FF3333] transition-colors">
            <span className="w-5 flex justify-center">{icon}</span>
            <span>{label}</span>
        </Link>
    )
}
