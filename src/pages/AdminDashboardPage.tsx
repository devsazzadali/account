import React, { useState, useMemo } from "react";
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
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Bell,
  ChevronRight,
  Filter,
  Download,
  MoreVertical,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const sidebarItems = [
    { id: "overview", icon: LayoutDashboard, label: "Market Overview" },
    { id: "products", icon: Package, label: "Digital Assets" },
    { id: "orders", icon: ShoppingCart, label: "Transactions" },
    { id: "users", icon: Users, label: "Member Directory" },
    { id: "settings", icon: Settings, label: "System Config" },
  ];

  return (
    <div className="flex min-h-screen bg-dark-950 text-white font-sans overflow-hidden">
      {/* Premium Sidebar */}
      <aside className="w-72 bg-dark-900/50 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-20">
        <div className="p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-display font-bold tracking-tight">Titan<span className="text-primary-400">OS</span></span>
                    <span className="text-[10px] text-primary-500/60 font-bold uppercase tracking-[0.2em]">Management Suite</span>
                </div>
            </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 py-4">
          {sidebarItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all duration-300 relative group ${
                activeTab === item.id 
                ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" 
                : "text-dark-50/40 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? "text-primary-400" : "group-hover:text-white transition-colors"} />
              <span className="font-semibold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                    layoutId="activeSide"
                    className="absolute left-[-1rem] w-1.5 h-6 bg-primary-500 rounded-r-full shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
            <div className="glass-card bg-white/5 p-4 rounded-2xl mb-6 border-white/10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-primary-400" />
                    </div>
                    <span className="text-xs font-bold text-white">Admin Pro</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-blue-500"></div>
                </div>
                <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest">75% Storage Used</div>
            </div>
            <button className="flex items-center gap-4 text-dark-50/40 hover:text-red-400 transition-all w-full px-5 py-3 rounded-2xl hover:bg-red-500/5 group">
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm">Terminate Session</span>
            </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-24 bg-dark-950/50 backdrop-blur-md border-b border-white/5 px-8 flex justify-between items-center sticky top-0 z-30">
          <div className="flex flex-col">
            <h2 className="text-2xl font-display font-bold text-white tracking-tight capitalize">{activeTab.replace("-", " ")}</h2>
            <div className="flex items-center gap-2 text-xs text-dark-50/30 font-bold uppercase tracking-widest mt-1">
                <span>Dashboard</span>
                <ChevronRight size={12} />
                <span className="text-primary-500/60">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden lg:block">
              <input 
                type="text" 
                placeholder="Global command search..." 
                className="w-80 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/5 transition-all placeholder:text-dark-50/20"
              />
              <Search className="absolute left-4 top-3.5 text-dark-50/30 group-focus-within:text-primary-400 transition-colors" size={18} />
              <div className="absolute right-4 top-3.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-dark-50/40 font-bold border border-white/5">⌘K</div>
            </div>
            
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white hover:border-white/20 transition-all relative">
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2 h-2 bg-primary-500 rounded-full border-2 border-dark-950"></span>
            </button>

            <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">Administrator</div>
                    <div className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">Master Access</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-500 p-[1px]">
                    <div className="w-full h-full rounded-[14px] bg-dark-900 flex items-center justify-center overflow-hidden border border-white/10">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "products" && <ProductsTab />}
                {activeTab === "orders" && <OrdersTab />}
                {activeTab === "users" && <UsersTab />}
                {activeTab === "settings" && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary-600/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-blue-600/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}

// --- Tab Components ---

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Revenue" 
            value="$48,295.50" 
            change="+24.5%" 
            positive={true} 
            icon={<DollarSign className="text-primary-400" />}
            chartData={[30, 45, 35, 60, 49, 91, 80]}
        />
        <StatCard 
            title="Conversion Rate" 
            value="12.8%" 
            change="+1.2%" 
            positive={true} 
            icon={<TrendingUp className="text-blue-400" />}
            chartData={[20, 30, 25, 40, 35, 50, 45]}
        />
        <StatCard 
            title="Total Members" 
            value="8,492" 
            change="+18%" 
            positive={true} 
            icon={<Users className="text-purple-400" />}
            chartData={[50, 60, 55, 75, 70, 85, 90]}
        />
        <StatCard 
            title="Active Disputes" 
            value="14" 
            change="-8%" 
            positive={false} 
            icon={<XCircle className="text-red-400" />}
            chartData={[10, 8, 12, 7, 5, 4, 3]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card bg-white/2 border-white/5 rounded-3xl p-8 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Growth Performance</h3>
                    <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Analytics for current quarter</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-primary-400 border border-primary-500/20">Real-time</button>
                    <button className="p-2 rounded-xl bg-white/5 text-dark-50/40 hover:text-white"><MoreVertical size={18} /></button>
                </div>
            </div>
            
            <div className="h-[300px] w-full flex items-end gap-2 px-2">
                {[40, 60, 45, 80, 55, 90, 70, 100, 85, 65, 75, 95].map((val, i) => (
                    <div key={i} className="flex-1 group/bar relative">
                        <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${val}%` }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-primary-600/20 to-primary-500 rounded-t-lg relative group-hover/bar:from-primary-500 group-hover/bar:to-blue-500 transition-all cursor-pointer"
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-dark-950 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none">
                                ${val}k
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-6 text-[10px] font-bold uppercase tracking-widest text-dark-50/20 px-2">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
            </div>
        </div>

        <div className="space-y-8">
            <div className="glass-card bg-white/2 border-white/5 rounded-3xl p-8">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Bell size={18} className="text-primary-400" />
                    Security Events
                </h3>
                <div className="space-y-6">
                    <ActivityItem 
                        icon={<CheckCircle2 size={14} />} 
                        color="text-green-400" 
                        title="Server Health Optimal" 
                        time="Just now" 
                    />
                    <ActivityItem 
                        icon={<Shield size={14} />} 
                        color="text-blue-400" 
                        title="DDoS Protection Active" 
                        time="4 mins ago" 
                    />
                    <ActivityItem 
                        icon={<Users size={14} />} 
                        color="text-purple-400" 
                        title="12 New Seller Applications" 
                        time="1 hour ago" 
                    />
                    <ActivityItem 
                        icon={<LogOut size={14} />} 
                        color="text-red-400" 
                        title="Failed Login Attempt (Admin)" 
                        time="2 hours ago" 
                    />
                </div>
            </div>

            <div className="glass-card bg-gradient-to-br from-primary-600 to-blue-600 rounded-3xl p-8 shadow-xl shadow-primary-500/10">
                <h3 className="font-bold text-white mb-2 italic">Pro System Update</h3>
                <p className="text-white/70 text-xs mb-6 leading-relaxed">System-wide performance enhancement and advanced security protocols are now available.</p>
                <button className="w-full py-3 bg-white text-dark-950 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-white/90 transition-all">Apply Upgrade</button>
            </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive, icon, chartData }: any) {
  return (
    <div className="glass-card bg-white/2 border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary-500/10 transition-colors">
            {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${positive ? "text-green-400" : "text-red-400"}`}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      </div>
      <div>
        <h3 className="text-dark-50/30 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
        <div className="text-2xl font-display font-bold text-white">{value}</div>
      </div>
      
      {/* Mini Chart Simulation */}
      <div className="absolute bottom-0 left-0 w-full h-12 flex items-end gap-1 px-1 opacity-20 group-hover:opacity-40 transition-opacity">
        {chartData.map((h: number, i: number) => (
            <div key={i} className="flex-1 bg-primary-500/40 rounded-t-[2px]" style={{ height: `${h}%` }}></div>
        ))}
      </div>
    </div>
  );
}

function ActivityItem({ icon, color, title, time }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className={`mt-1 p-1.5 bg-white/5 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-xs font-bold text-white/80">{title}</div>
                <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest">{time}</div>
            </div>
        </div>
    );
}

function ProductsTab() {
  return (
    <div className="glass-card bg-white/2 border-white/5 rounded-3xl overflow-hidden">
      <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h3 className="text-xl font-bold text-white mb-1">Digital Asset Inventory</h3>
            <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Manage your premium listings</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                <Filter size={18} />
            </button>
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                <Download size={18} />
            </button>
            <button className="bg-gradient-to-r from-primary-600 to-primary-500 hover:scale-105 active:scale-95 text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary-500/20">
                <Plus size={16} />
                New Asset
            </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
            <tr>
                <th className="px-8 py-5">Reference</th>
                <th className="px-8 py-5">Asset Details</th>
                <th className="px-8 py-5">Classification</th>
                <th className="px-8 py-5">Valuation</th>
                <th className="px-8 py-5">Inventory</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
            <ProductRow 
                id="#AST-9901"
                name="Netflix Premium UHD" 
                category="Media & Streaming" 
                price="$14.99" 
                stock={1240} 
                status="Active" 
                image="https://upload.wikimedia.org/wikipedia/commons/f/ff/Netflix-new-icon.png"
            />
            <ProductRow 
                id="#AST-9902"
                name="Spotify Premium Yearly" 
                category="Digital Audio" 
                price="$29.00" 
                stock={450} 
                status="Active" 
                image="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
            />
            <ProductRow 
                id="#AST-9903"
                name="NordVPN Private Key" 
                category="Network Security" 
                price="$12.00" 
                stock={0} 
                status="Depleted" 
                image="https://upload.wikimedia.org/wikipedia/commons/e/ed/NordVPN_Logo.svg"
            />
            <ProductRow 
                id="#AST-9904"
                name="Disney+ Master Bundle" 
                category="Media & Streaming" 
                price="$19.99" 
                stock={88} 
                status="Active" 
                image="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg"
            />
            </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductRow({ id, name, category, price, stock, status, image }: any) {
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-8 py-5 font-bold text-dark-50/40 text-xs">{id}</td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-2 flex items-center justify-center">
                <img src={image} alt={name} className="max-w-full max-h-full object-contain" />
            </div>
            <span className="font-bold text-white text-sm">{name}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-dark-50/50 text-xs font-semibold">{category}</td>
      <td className="px-8 py-5 font-bold text-white text-sm">{price}</td>
      <td className="px-8 py-5">
        <div className="flex flex-col gap-1.5 w-24">
            <div className="flex justify-between text-[10px] font-bold text-dark-50/30 uppercase tracking-widest">
                <span>Stock</span>
                <span>{stock > 0 ? stock : "Empty"}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${stock > 100 ? "bg-primary-500" : stock > 0 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(stock / 15, 100)}%` }}></div>
            </div>
        </div>
      </td>
      <td className="px-8 py-5">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
          status === "Active" 
          ? "bg-primary-500/10 text-primary-400 border-primary-500/20" 
          : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {status}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 text-dark-50/30 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all"><Edit size={16} /></button>
          <button className="p-2 text-dark-50/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}

function OrdersTab() {
  return (
    <div className="glass-card bg-white/2 border-white/5 rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white mb-1">Transaction History</h3>
                <p className="text-xs text-dark-50/30 uppercase tracking-widest font-bold">Monitor real-time revenue flow</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-dark-50/30 font-bold uppercase tracking-widest">Today's Revenue</div>
                    <div className="text-sm font-bold text-primary-400">$1,450.20</div>
                </div>
                <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-dark-50/40 hover:text-white transition-all">
                    <Download size={18} />
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-white/2 text-dark-50/30 text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
                <tr>
                    <th className="px-8 py-5">Transaction ID</th>
                    <th className="px-8 py-5">Counterparty</th>
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Amount</th>
                    <th className="px-8 py-5">Resolution</th>
                    <th className="px-8 py-5 text-right">Verification</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                <OrderRow id="#TXN-7782" customer="jishan_pro_80" date="Feb 26, 2026 14:32" total="$15.50" status="Success" seed="jishan" />
                <OrderRow id="#TXN-7781" customer="alex_doe_22" date="Feb 25, 2026 09:12" total="$3.50" status="Processing" seed="alex" />
                <OrderRow id="#TXN-7780" customer="sarah_smith_gold" date="Feb 25, 2026 08:45" total="$45.00" status="Terminated" seed="sarah" />
                <OrderRow id="#TXN-7779" customer="titan_gamer" date="Feb 24, 2026 23:58" total="$12.00" status="Success" seed="titan" />
                </tbody>
            </table>
        </div>
    </div>
  );
}

function OrderRow({ id, customer, date, total, status, seed }: any) {
  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-8 py-5 font-bold text-dark-50/40 text-xs tracking-tight">{id}</td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${seed}`} alt={customer} className="w-8 h-8 rounded-lg bg-white/5 p-1" />
            <span className="font-bold text-white text-sm">{customer}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-dark-50/50 text-xs font-semibold">{date}</td>
      <td className="px-8 py-5 font-bold text-white text-sm">{total}</td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
                status === "Success" ? "bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" : 
                status === "Processing" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" : 
                "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            }`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-dark-50/60">{status}</span>
        </div>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="text-[10px] font-bold uppercase tracking-widest text-primary-400 hover:text-primary-300 underline underline-offset-4 decoration-primary-500/30">Audit Receipt</button>
      </td>
    </tr>
  );
}

function UsersTab() {
    return (
        <div className="glass-card bg-white/2 border-white/5 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">Member Directory</h3>
            <p className="text-dark-50/40 text-sm max-w-sm mx-auto mb-8 leading-relaxed">Advanced member management and permission controls. You currently have 8,492 registered members across all classifications.</p>
            <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Initialize Directory Scan</button>
        </div>
    )
}

function SettingsTab() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card bg-white/2 border-white/5 rounded-3xl p-8">
                <h3 className="font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 rounded-xl"><Settings size={18} className="text-primary-400" /></div>
                    Platform Configuration
                </h3>
                <div className="space-y-6">
                    <ToggleItem label="Global Maintenance Mode" desc="Suspend all marketplace transactions" active={false} />
                    <ToggleItem label="Automated Payouts" desc="Enable Titan™ instant revenue transfer" active={true} />
                    <ToggleItem label="Two-Factor Enforcement" desc="Mandatory 2FA for all seller accounts" active={true} />
                </div>
            </div>
            <div className="glass-card bg-white/2 border-white/5 rounded-3xl p-8">
                <h3 className="font-bold text-white mb-8 flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl"><Briefcase size={18} className="text-blue-400" /></div>
                    System Resources
                </h3>
                <div className="space-y-8">
                    <ResourceBar label="API Response Time" value="42ms" percent={85} color="bg-primary-500" />
                    <ResourceBar label="Database Cluster Load" value="12%" percent={12} color="bg-blue-500" />
                    <ResourceBar label="Media Storage (S3)" value="1.2 TB" percent={65} color="bg-purple-500" />
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, desc, active }: any) {
    return (
        <div className="flex justify-between items-center">
            <div>
                <div className="text-sm font-bold text-white mb-1">{label}</div>
                <div className="text-[10px] text-dark-50/30 uppercase tracking-widest font-bold">{desc}</div>
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${active ? "bg-primary-500" : "bg-white/10"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${active ? "translate-x-6" : "translate-x-0"}`}></div>
            </div>
        </div>
    );
}

function ResourceBar({ label, value, percent, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-dark-50/40">{label}</span>
                <span className="text-white">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${color}`} 
                />
            </div>
        </div>
    );
}
