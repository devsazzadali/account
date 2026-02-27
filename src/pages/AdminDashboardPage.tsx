import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1b2e] text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-[#FF3333]">Account Store One Admin</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Overview" 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")} 
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Products" 
            active={activeTab === "products"} 
            onClick={() => setActiveTab("products")} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label="Orders" 
            active={activeTab === "orders"} 
            onClick={() => setActiveTab("orders")} 
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Users" 
            active={activeTab === "users"} 
            onClick={() => setActiveTab("users")} 
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
              A
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "settings" && <div className="text-gray-500">Settings panel coming soon...</div>}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
        active ? "bg-[#FF3333] text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

// --- Tab Components ---

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard title="Total Sales" value="$12,450" change="+15%" positive />
      <StatCard title="Total Orders" value="1,240" change="+5%" positive />
      <StatCard title="Active Users" value="850" change="+12%" positive />
      <StatCard title="Pending Disputes" value="3" change="-2%" positive={false} />
    </div>
  );
}

function StatCard({ title, value, change, positive }: { title: string, value: string, change: string, positive: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`text-sm font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
          {change}
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Product Management</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} />
          Add Product
        </button>
      </div>
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-6 py-3">Product</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Price</th>
            <th className="px-6 py-3">Stock</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <ProductRow 
            name="Netflix Premium 4K" 
            category="Streaming" 
            price="$3.50" 
            stock={120} 
            status="Active" 
          />
          <ProductRow 
            name="Spotify Individual" 
            category="Music" 
            price="$5.00" 
            stock={45} 
            status="Active" 
          />
          <ProductRow 
            name="NordVPN 1 Year" 
            category="VPN" 
            price="$12.00" 
            stock={0} 
            status="Out of Stock" 
          />
          <ProductRow 
            name="Disney+ Bundle" 
            category="Streaming" 
            price="$7.99" 
            stock={88} 
            status="Active" 
          />
        </tbody>
      </table>
    </div>
  );
}

function ProductRow({ name, category, price, stock, status }: { name: string, category: string, price: string, stock: number, status: string }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{name}</td>
      <td className="px-6 py-4 text-gray-500">{category}</td>
      <td className="px-6 py-4 text-gray-900">{price}</td>
      <td className="px-6 py-4 text-gray-500">{stock}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
          <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}

function OrdersTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-6 py-3">Order ID</th>
            <th className="px-6 py-3">Customer</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Total</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <OrderRow id="#ORD-7782" customer="Jishan80" date="Feb 26, 2026" total="$15.50" status="Completed" />
          <OrderRow id="#ORD-7781" customer="AlexDoe" date="Feb 25, 2026" total="$3.50" status="Pending" />
          <OrderRow id="#ORD-7780" customer="SarahSmith" date="Feb 25, 2026" total="$45.00" status="Cancelled" />
        </tbody>
      </table>
    </div>
  );
}

function OrderRow({ id, customer, date, total, status }: { id: string, customer: string, date: string, total: string, status: string }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900">{id}</td>
      <td className="px-6 py-4 text-gray-500">{customer}</td>
      <td className="px-6 py-4 text-gray-500">{date}</td>
      <td className="px-6 py-4 text-gray-900">{total}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === "Completed" ? "bg-green-100 text-green-700" : 
          status === "Pending" ? "bg-yellow-100 text-yellow-700" : 
          "bg-gray-100 text-gray-700"
        }`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-blue-600 hover:underline text-sm">View Details</button>
      </td>
    </tr>
  );
}

function UsersTab() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
            User management interface would go here.
        </div>
    )
}
