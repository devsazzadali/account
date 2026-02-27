import React from "react";
import { 
  ShoppingBag, 
  MessageSquare, 
  CreditCard, 
  Heart, 
  Store, 
  PlusCircle, 
  List, 
  Settings, 
  Megaphone, 
  DollarSign, 
  Info, 
  AlertTriangle, 
  Phone, 
  Gavel, 
  FileText, 
  Clock, 
  CheckCircle, 
  Bell, 
  Mail, 
  FileOutput, 
  Ticket, 
  Share2, 
  Users,
  ChevronRight,
  ShieldCheck,
  Shield
} from "lucide-react";

export function UserDashboardPage() {
  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username") || "User";
  const isAdmin = userRole === "admin";

  if (!isAdmin) {
      // CUSTOMER DASHBOARD
      return (
        <div className="bg-[#F0F2F5] min-h-screen pb-12">
            <div className="bg-white border-b border-gray-200 py-8">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Welcome, {username}</h1>
                            <p className="text-gray-500 text-sm">Manage your orders and account settings</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-7xl mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard title="My Orders" icon={<ShoppingBag className="text-blue-500" />}>
                        <DashboardLink icon={<List size={16} />} label="All Orders" />
                        <DashboardLink icon={<Clock size={16} />} label="Pending" />
                        <DashboardLink icon={<CheckCircle size={16} />} label="Completed" />
                    </DashboardCard>

                    <DashboardCard title="Support" icon={<Ticket className="text-green-500" />}>
                        <DashboardLink icon={<PlusCircle size={16} />} label="New Ticket" />
                        <DashboardLink icon={<List size={16} />} label="My Tickets" />
                    </DashboardCard>

                    <DashboardCard title="Settings" icon={<Settings className="text-gray-500" />}>
                        <DashboardLink icon={<Users size={16} />} label="Profile" />
                        <DashboardLink icon={<Settings size={16} />} label="Account Security" />
                    </DashboardCard>
                </div>
            </div>
        </div>
      );
  }

  // ADMIN / OWNER DASHBOARD (Original Z2U Style - Modified for Single Vendor)
  return (
    <div className="bg-[#F0F2F5] min-h-screen pb-12">
      {/* Blue Banner Section */}
      <div className="bg-gradient-to-r from-[#003366] to-[#0055A5] text-white pt-8 pb-16 relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                  <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                            {username.charAt(0).toUpperCase()}
                          </div>
                      </div>
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                          <h1 className="text-2xl font-bold">{username}</h1>
                          <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>
                      </div>
                      
                      {/* Key Stats in Banner */}
                      <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-4">
                          <div>
                              <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Total Sales Amount</div>
                              <div className="text-3xl font-bold text-white">$12,450.00</div>
                          </div>
                          <div>
                              <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Total Orders</div>
                              <div className="text-3xl font-bold text-white">1,245</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Decorative Circles */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-400 opacity-10 rounded-full blur-2xl"></div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 max-w-7xl -mt-10 relative z-20">
        
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500 flex items-center justify-between">
                <div>
                    <div className="text-gray-500 text-sm font-medium mb-1">Total Orders</div>
                    <div className="text-2xl font-bold text-gray-800">1,245</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                    <ShoppingBag size={24} />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500 flex items-center justify-between">
                <div>
                    <div className="text-gray-500 text-sm font-medium mb-1">Completed Orders</div>
                    <div className="text-2xl font-bold text-gray-800">1,180</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                    <CheckCircle size={24} />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500 flex items-center justify-between">
                <div>
                    <div className="text-gray-500 text-sm font-medium mb-1">Pending Orders</div>
                    <div className="text-2xl font-bold text-gray-800">45</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <Clock size={24} />
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500 flex items-center justify-between">
                <div>
                    <div className="text-gray-500 text-sm font-medium mb-1">Active Listings</div>
                    <div className="text-2xl font-bold text-gray-800">156</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                    <Store size={24} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Store Management (Replaces Seller Center) */}
          <DashboardCard title="Store Management" icon={<Store className="text-red-500" />}>
            <DashboardLink icon={<List size={16} />} label="All Sold Orders" href="/seller/orders" />
            <DashboardLink icon={<PlusCircle size={16} />} label="Create New Listing" href="/seller/create-listing" />
            <DashboardLink icon={<CheckCircle size={16} />} label="Active Listings" />
            <DashboardDropdown label="Store Settings" />
          </DashboardCard>

          {/* Support & Disputes */}
          <DashboardCard title="Support & Disputes" icon={<Gavel className="text-orange-500" />}>
            <DashboardLink icon={<Gavel size={16} />} label="Dispute Center" />
            <DashboardLink icon={<Ticket size={16} />} label="Service Tickets" />
            <DashboardLink icon={<MessageSquare size={16} />} label="User Messages" />
          </DashboardCard>

          {/* Account Settings */}
          <DashboardCard title="Account Settings" icon={<Settings className="text-gray-500" />}>
            <DashboardLink icon={<Users size={16} />} label="Profile Information" />
            <DashboardLink icon={<Shield size={16} />} label="Security Settings" />
            <DashboardLink icon={<CreditCard size={16} />} label="Payment Methods" />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function DashboardCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2 font-bold text-gray-700 bg-gray-50/50">
        {icon}
        <span>{title}</span>
      </div>
      <div className="p-2">
        <ul className="flex flex-col gap-1">
          {children}
        </ul>
      </div>
    </div>
  );
}

function DashboardLink({ icon, label, href }: { icon?: React.ReactNode, label: string, href?: string }) {
  return (
    <li>
      <a href={href || "#"} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded transition-colors group">
        <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
            {icon || <div className="w-4" />}
        </span>
        <span>{label}</span>
      </a>
    </li>
  );
}

function DashboardDropdown({ label }: { label: string }) {
    return (
        <li>
            <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 rounded transition-colors group text-left">
                <div className="flex items-center gap-3">
                    <span className="w-4"></span>
                    <span>{label}</span>
                </div>
                <ChevronRight size={14} className="text-gray-400" />
            </button>
        </li>
    )
}
