"use client";

import React, { useEffect, useState } from "react";
import { orderCode } from "../lib/order-ref";
import {
  Package, ChevronRight, ArrowRight, ShieldCheck,
  LayoutDashboard, ShoppingBag, MessageCircle, Shield, LogOut, Wallet,
  Plus, LifeBuoy
} from "lucide-react";
import { db } from "../lib/dbclient";
import { auth } from "../lib/auth-client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UserMessages } from "../components/user/UserMessages";
import { UserSettings } from "../components/user/UserSettings";
import { WalletDashboard } from "../components/user/WalletDashboard";
import { lsClear } from "@/src/lib/storage";

const DASHBOARD_TABS = ["dashboard", "orders", "wallet", "messages", "security"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

export function UserDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [ticketState, setTicketState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Fix Round 7 (customer suspend): /api/me reports the flag; a
  // suspended buyer sees a notice instead of the dashboard. Server
  // enforcement (orders/writes) applies regardless of this screen.
  const [suspended, setSuspended] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard"); // dashboard, orders, wallet, messages, security
  const router = useRouter();

  // Deep-linking (F-07/F-08/F-18): header links, the profile dropdown and
  // product-page buttons land here with ?tab=<panel>. The active tab
  // FOLLOWS the search param — including client-side navigations while
  // the dashboard is already mounted (Fix Round 4, item 2: dropdown
  // links used to change only the URL; the panel switched solely on a
  // manual reload). Fresh loads behave exactly as before.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  useEffect(() => {
    if (tabParam && (DASHBOARD_TABS as readonly string[]).includes(tabParam)) {
      setActiveTab(tabParam as DashboardTab);
    } else if (tabParam === null) {
      // Plain /dashboard (no param) always means the overview panel.
      setActiveTab("dashboard");
    }
    // An unknown ?tab= value is ignored — the current panel stays.
  }, [tabParam]);

  // Switching panels keeps the URL in sync (shareable / reloadable)
  // without a navigation or refetch.
  function selectTab(tab: string) {
    const next = (DASHBOARD_TABS as readonly string[]).includes(tab)
      ? (tab as DashboardTab)
      : "dashboard";
    setActiveTab(next);
    const url = next === "dashboard" ? "/dashboard" : `/dashboard?tab=${next}`;
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);

    const [profileRes, ordersRes, walletRes, msgRes, meRes] = await Promise.all([
      db.from('profiles').select('*').eq('id', session.user.id).single(),
      db.from('orders').select('*, products(*)').eq('user_id', session.user.id).order('created_at', { ascending: false }),
      fetch("/api/wallet", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      db.from('messages').select('ticket_status').order('created_at', { ascending: false }),
      fetch("/api/me", { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    if (meRes?.profile?.suspended) {
      setSuspended(true);
      setLoading(false);
      return;
    }

    if (profileRes.data?.role === 'admin' || profileRes.data?.role === 'moderator') {
      router.push('/admin');
      return;
    }

    setProfile(profileRes.data);
    setOrders(ordersRes.data || []);
    if (walletRes) setWalletBalance(Number(walletRes.wallet?.balance ?? walletRes.balance) || 0);
    // The thread's ticket state is kept in sync on every row of the
    // thread, so any row reports the one real state.
    const rows = (msgRes.data || []) as { ticket_status?: string }[];
    setTicketState(rows.length > 0 ? (rows[0].ticket_status || "open") : "none");
    setLoading(false);
  }

  function handleLogout() {
    auth.signOut().then(() => {
        lsClear();
        router.push("/login");
    });
  }

  // F-20: no blank-spinner page. The shell (sidebar + navigation)
  // renders immediately; while the profile/orders load, the profile
  // card and the main area show skeleton placeholders instead.

  // NOTE (completion build): the old email-confirmation lock screen was
  // removed — Neon Auth verification is optional and handled by its own
  // flow; locking every new customer out of the dashboard was a dead end.

  // R3: plain customer language (Z2U/G2G buyer-panel pattern) — the tab
  // ids are unchanged so every ?tab= deep link keeps working.
  const menuItems = [
    { id: "dashboard", label: "Dashboard",          icon: LayoutDashboard },
    { id: "orders",    label: "My Orders",          icon: ShoppingBag },
    { id: "wallet",    label: "Wallet",             icon: Wallet },
    { id: "messages",  label: "Messages",           icon: MessageCircle },
    { id: "security",  label: "Account & Security", icon: Shield },
  ];

  // Fix Round 7: suspension notice replaces the whole dashboard.
  if (suspended) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-[2rem] shadow-xl p-10 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={30} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">Account Suspended</h1>
          <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-8">
            Your account has been suspended by the store team, so ordering and account
            changes are paused. Your order history is unchanged. If you believe this is
            a mistake, please contact the store through the contact page.
          </p>
          <button onClick={handleLogout} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all inline-flex items-center gap-2">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row min-h-screen">

        {/* ── Left Sidebar ── */}
        <aside className="w-full lg:w-[300px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-4 sm:p-6 lg:p-8 flex flex-col shrink-0 max-lg:sticky max-lg:top-16 max-lg:z-30">
           {/* User Profile Card */}
           {loading ? (
              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-3xl border border-slate-100 animate-pulse" aria-label="Loading profile">
                 <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                 <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-200 rounded-full w-1/2" />
                 </div>
              </div>
           ) : (
           <div className="flex items-center gap-4 mb-4 lg:mb-8 p-4 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0 overflow-hidden">
                 {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover rounded-2xl" alt="" />
                 ) : (
                    <span className="text-white font-black text-xl uppercase">{(profile?.username || "U").charAt(0)}</span>
                 )}
              </div>
              <div className="min-w-0">
                 <h4 className="text-[16px] font-black text-slate-900 truncate">{profile?.full_name || profile?.username}</h4>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Signed in</span>
                 </div>
              </div>
           </div>
           )}

           {/* Navigation */}
           <nav className="flex-1 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 max-lg:[mask-image:linear-gradient(to_right,#000_90%,transparent_100%)]">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all group whitespace-nowrap ${
                    activeTab === item.id
                    ? "bg-primary-600 text-white shadow-xl shadow-primary-600/25"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                   <item.icon size={20} className={activeTab === item.id ? "text-primary-100" : "group-hover:text-slate-900"} />
                   {item.label}
                   {activeTab === item.id && <ChevronRight size={16} className="ml-auto text-white/50 hidden lg:block" />}
                </button>
              ))}
           </nav>

           {/* Footer Actions */}
           <div className="mt-4 lg:mt-auto pt-6 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-[14px] font-bold text-red-500 hover:bg-red-50 transition-all">
                 <LogOut size={20} /> Sign Out
              </button>
           </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 p-4 pb-24 md:p-8 lg:p-12 overflow-y-auto lg:max-h-screen custom-scrollbar min-w-0">
           {loading ? (
              <DashboardSkeleton />
           ) : (
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <DashboardHome
                    profile={profile}
                    user={user}
                    orders={orders}
                    walletBalance={walletBalance}
                    ticketState={ticketState}
                    setActiveTab={selectTab}
                  />
                )}
                {activeTab === 'orders' && <OrderManifest orders={orders} />}
                {activeTab === 'wallet' && <WalletDashboard />}
                {activeTab === 'messages' && <UserMessages />}
                {activeTab === 'security' && <UserSettings onNavigate={selectTab} />}
              </motion.div>
           </AnimatePresence>
           )}
        </main>

      </div>
    </div>
  );
}

function paymentLabel(p?: string) {
  return p === 'paid' ? 'Paid' : p === 'pending_verification' ? 'Verifying payment' : p === 'refunded' ? 'Refunded' : 'Awaiting payment';
}

function statusChipClass(status?: string) {
  switch (status) {
    case 'Completed': return 'bg-emerald-50 text-emerald-600';
    case 'Delivering': return 'bg-blue-50 text-blue-600';
    case 'Disputed': return 'bg-red-50 text-red-600';
    case 'Canceled': case 'Refunded': return 'bg-slate-100 text-slate-500';
    default: return 'bg-amber-50 text-amber-600';
  }
}

function DashboardHome({ profile, user, orders, walletBalance, ticketState, setActiveTab }: any) {
  const displayName = profile?.full_name || profile?.username || "there";
  const inProgress = orders.filter((o: any) => !['Completed', 'Canceled', 'Refunded'].includes(o.status)).length;
  const emailVerified = !!user?.email_confirmed_at;

  const ticket = ticketState === "awaiting_reply"
    ? { value: "Support replied", sub: "Waiting for your reply" }
    : ticketState === "open"
      ? { value: "Ticket open", sub: "Support will reply soon" }
      : ticketState === "closed"
        ? { value: "Closed", sub: "Your last ticket is resolved" }
        : { value: "No tickets", sub: "Start a conversation any time" };

  return (
    <div className="space-y-8">
       <header>
          <h1 className="text-[1.65rem] leading-[1.15] md:text-4xl font-black text-slate-900 tracking-tight mb-2">{`Welcome back, ${displayName}`}</h1>
          <p className="text-slate-500 font-medium">Here&rsquo;s what&rsquo;s happening with your orders, wallet and messages.</p>
       </header>

       {/* Summary cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <SummaryCard
            icon={<Wallet size={22} />}
            label="Wallet Balance"
            value={walletBalance === null ? "—" : `$${walletBalance.toFixed(2)}`}
            sub="Available to spend on any order"
            actionLabel="Add Money"
            actionIcon={<Plus size={14} />}
            onAction={() => setActiveTab('wallet')}
          />
          <SummaryCard
            icon={<ShoppingBag size={22} />}
            label="My Orders"
            value={String(orders.length)}
            sub={orders.length === 0 ? "No orders yet" : inProgress > 0 ? `${inProgress} in progress` : "All settled"}
            actionLabel="View Orders"
            onAction={() => setActiveTab('orders')}
          />
          <SummaryCard
            icon={<MessageCircle size={22} />}
            label="Messages"
            value={ticket.value}
            valueSmall
            sub={ticket.sub}
            actionLabel="Open Messages"
            onAction={() => setActiveTab('messages')}
          />
          <SummaryCard
            icon={<ShieldCheck size={22} />}
            label="Account"
            value={profile?.is_premium ? "Premium" : "Standard"}
            valueSmall
            sub={emailVerified ? "Email verified" : "Email not verified"}
            actionLabel="Account Settings"
            onAction={() => setActiveTab('security')}
          />
       </div>

       <AnnouncementsCard />

       {/* Recent orders */}
       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-black text-slate-900">Recent Orders</h3>
             <button onClick={() => setActiveTab('orders')} className="text-[12px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-2 hover:underline py-2.5 -my-1 px-1 -mx-1 min-h-[44px]">View All <ArrowRight size={14} /></button>
          </div>
          {orders.length === 0 ? (
             <div className="text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                   <Package size={24} className="text-slate-300" />
                </div>
                <h4 className="text-[16px] font-black text-slate-900 mb-1.5">No orders yet</h4>
                <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto mb-6">
                   When you buy a product, your order appears here. Open an order to follow its delivery,
                   unlock the credentials in its Credential Vault, confirm receipt, or open a dispute —
                   every payment is held in escrow until delivery is confirmed.
                </p>
                <Link href="/" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                   Browse the Store <ArrowRight size={14} />
                </Link>
             </div>
          ) : (
          <div className="space-y-3">
             {orders.slice(0, 4).map((order: any) => (
                <Link key={order.id} href={`/order/${order.id}`} className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-primary-300 transition-all">
                   <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0"><img src={order.products?.image} className="w-full h-full object-cover" alt="" /></div>
                      <div className="min-w-0">
                         <div className="text-[14px] font-black text-slate-900 truncate">{order.products?.title}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{orderCode(order.id)} · {new Date(order.created_at).toLocaleDateString()}</div>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <div className="text-[14px] font-black text-slate-900">${Number(order.total_price).toFixed(2)}</div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mt-1 ${statusChipClass(order.status)}`}>{order.status}</span>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{paymentLabel(order.payment_status)}</div>
                   </div>
                </Link>
             ))}
          </div>
          )}
       </div>

       {/* Support card */}
       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-start gap-4 flex-1">
             <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
                <LifeBuoy size={24} className="text-primary-600" />
             </div>
             <div>
                <h3 className="text-xl font-black mb-1 text-slate-900">Need help?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                   Our support team is available 24/7 and usually replies within about an hour.
                   Send us a message and we&rsquo;ll take care of it — your conversation lives in Messages.
                </p>
             </div>
          </div>
          <button onClick={() => setActiveTab('messages')} className="px-7 py-3.5 bg-primary-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all shrink-0">
             Message Support
          </button>
       </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, actionLabel, actionIcon, onAction, valueSmall }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
       <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4">{icon}</div>
       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
       <div className={`${valueSmall ? "text-[22px]" : "text-3xl"} font-black text-slate-900 leading-tight`}>{value}</div>
       <div className="text-[12px] text-slate-400 font-medium mt-1 flex-1">{sub}</div>
       <button onClick={onAction} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-black text-primary-600 uppercase tracking-widest hover:underline self-start min-h-[44px] py-2 px-1 -mx-1">
          {actionIcon}{actionLabel}<ArrowRight size={13} />
       </button>
    </div>
  );
}

function OrderManifest({ orders }: any) {
  return (
    <div className="space-y-8">
       <header>
          <h1 className="text-[1.65rem] leading-[1.15] md:text-4xl font-black text-slate-900 tracking-tight mb-2">My Orders</h1>
          <p className="text-slate-500 font-medium">Every order you place appears here — open one for its delivery status, credential vault and dispute options.</p>
       </header>

       {orders.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-14 shadow-sm text-center">
             <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-5">
                <Package size={28} className="text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No orders yet</h3>
             <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md mx-auto mb-8">
                When you buy a product, your order appears here. Open an order to follow its delivery,
                unlock the credentials in its Credential Vault, confirm receipt, or open a dispute —
                every payment is held in escrow until delivery is confirmed.
             </p>
             <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                Browse the Store <ArrowRight size={14} />
             </Link>
          </div>
       )}

       <div className="space-y-4">
          {orders.map((order: any) => (
             <div key={order.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:border-primary-300 transition-all group">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                         <img src={order.products?.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900">{order.products?.title}</h4>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{orderCode(order.id)}</span>
                            <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusChipClass(order.status)}`}>{order.status}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="text-right">
                         <div className="text-[18px] font-black text-slate-900">${Number(order.total_price).toFixed(2)}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</div>
                         <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{paymentLabel(order.payment_status)}</div>
                      </div>
                      <Link href={`/order/${order.id}`} className="px-6 py-3 min-h-[44px] bg-primary-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2">View Order <ArrowRight size={16} /></Link>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}

/** F-20: skeleton shown in the main area while profile/orders load —
 *  the shell and sidebar are already on screen, so the page never
 *  appears blank with only a spinner. */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-label="Loading dashboard">
       <div className="space-y-3">
          <div className="h-10 bg-slate-200 rounded-2xl w-64" />
          <div className="h-4 bg-slate-200 rounded-full w-96 max-w-full" />
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => (
             <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-3">
                <div className="w-11 h-11 bg-slate-200 rounded-xl" />
                <div className="h-3 bg-slate-200 rounded-full w-24" />
                <div className="h-8 bg-slate-200 rounded-xl w-16" />
             </div>
          ))}
       </div>
       <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-4">
          <div className="h-5 bg-slate-200 rounded-full w-48" />
          {[0, 1].map((i) => (
             <div key={i} className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                   <div className="h-3.5 bg-slate-200 rounded-full w-1/3" />
                   <div className="h-2.5 bg-slate-200 rounded-full w-1/5" />
                </div>
                <div className="h-4 bg-slate-200 rounded-full w-14" />
             </div>
          ))}
       </div>
    </div>
  );
}


/** Store announcements (P4 broadcast) — renders nothing when empty. */
function AnnouncementsCard() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/announcements", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setItems(j.announcements || []))
      .catch(() => {});
  }, []);
  if (items.length === 0) return null;
  return (
    <div className="bg-primary-800 rounded-[2.5rem] p-8 shadow-sm text-white">
      <h3 className="text-xl font-black mb-6">Store Announcements</h3>
      <div className="space-y-5">
        {items.map((a) => (
          <div key={a.id} className="border-b border-white/10 pb-5 last:border-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="text-[15px] font-black">{a.title}</h4>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-white/70 font-medium leading-relaxed mt-1 whitespace-pre-wrap">{a.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
