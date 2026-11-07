"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  MessageSquare,
  Users,
  Tag,
  Search,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Star,
  Store,
  ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { db } from "../../lib/dbclient";
import { auth } from "../../lib/auth-client";
import { toast } from "react-hot-toast";
import { lsGet, lsClear } from "@/src/lib/storage";

// ── Web Audio Chime ──────────────────────────────────────────
// One shared AudioContext for the whole admin session. Browsers start an
// AudioContext in "suspended" state until the user has interacted with
// the page, and a brand-new context per chime would stay silent — so the
// context is created lazily, resumed on the first pointer/key gesture,
// and resumed again before every chime. Fully self-contained (WebAudio
// oscillators); no external audio file is ever fetched.
let sharedAudioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedAudioCtx.state === "suspended") void sharedAudioCtx.resume();
    return sharedAudioCtx;
  } catch {
    return null;
  }
}
if (typeof window !== "undefined") {
  const unlockAudio = () => { getAudioCtx(); };
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
}

function playOrderChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  } catch {}
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  /** Profile role of the signed-in staff member ("admin" | "moderator"). */
  role?: string;
}

// ── Inline Order Toast ──────────────────────────────────────
function OrderToast({ title, amount, onView, onDismiss }: { title: string; amount: number; onView: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="pointer-events-auto w-80 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
    >
      {/* Accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-primary-500" />
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <ShoppingBag size={20} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">💰 New Order!</p>
            <button onClick={onDismiss} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm font-black text-slate-900 truncate leading-tight">{title}</p>
          <p className="text-[11px] font-bold text-slate-400 mt-0.5">${amount.toFixed(2)} USD</p>
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={onView}
          className="flex-1 py-2.5 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          View Order
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2.5 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

// ── Inline Dispute Toast (ধাপ ৫ক২) ──────────────────────────
// Same alert pipeline as the order toast (chime + bell badge), with a
// warning treatment: a buyer dispute is the one other event an admin
// must never miss. Rendered inside the shared toast stack below.
function DisputeToast({ orderCode, reason, onView, onDismiss }: { orderCode: string; reason: string; onView: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="pointer-events-auto w-80 bg-white rounded-3xl border border-red-200 shadow-2xl overflow-hidden"
    >
      <div className="h-1 w-full bg-gradient-to-r from-red-500 to-amber-500" />
      <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
          <AlertCircle size={20} className="text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">⚠️ Dispute Opened</p>
            <button onClick={onDismiss} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm font-black text-slate-900 truncate leading-tight">Order {orderCode}</p>
          {reason && <p className="text-[11px] font-bold text-slate-400 mt-0.5 line-clamp-2">{reason}</p>}
        </div>
      </div>
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={onView}
          className="flex-1 py-2.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          View Order
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2.5 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

export function AdminLayout({ children, activeTab, setActiveTab, role }: AdminLayoutProps) {
  // Managers (moderator) get the order-management shell only: the
  // sidebar collapses to Sold Orders and every other console surface
  // is absent (and denied server-side if reached directly).
  const isManager = role === "moderator";
  const username = lsGet("username") || "Admin";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Mobile: the sidebar becomes a slide-over drawer below lg. The
  // desktop collapse behaviour only applies at lg and up — on mobile
  // the drawer always shows full labels.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLg, setIsLg] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const collapsed = isSidebarCollapsed && isLg;
  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrderAlert, setNewOrderAlert] = useState<{ title: string; amount: number; orderId: string } | null>(null);
  const [disputeAlert, setDisputeAlert] = useState<{ orderCode: string; reason: string; disputeId: string } | null>(null);
  const [newOrderBadge, setNewOrderBadge] = useState(0);
  const router = useRouter();
  // Dispute ids already alerted during their current "open" episode —
  // a dispute re-opened after resolution must alert again, but the
  // polls in between must not repeat the alert (ধাপ ৫ক২).
  const alertedDisputes = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // ── Real-time new order watcher ──────────────────────────
  // No first-load swallow lives here any more (ধাপ ৫ক২): the old
  // isFirstLoad ref was set false synchronously right after
  // subscribe(), so its in-callback branch could never legitimately
  // fire — dead code that only risked eating a genuine first event.
  // Backlog silence is the channel's contract instead: PollingChannel
  // fires INSERT callbacks only for rows that appear AFTER its first
  // successful poll has built the baseline snapshot, so every
  // callback reaching this handler is a genuinely new order.
  useEffect(() => {
    const channel = db
      .channel("admin_new_order_alert")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as any;
          playOrderChime();
          setNewOrderBadge(prev => prev + 1);
          setNewOrderAlert({
            title: order.username ? `Order by ${order.username}` : "New Customer Order",
            amount: Number(order.total_price) || 0,
            orderId: order.id,
          });
          // Auto-dismiss after 8 seconds
          setTimeout(() => setNewOrderAlert(null), 8000);
        }
      )
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, []);

  // ── Real-time dispute watcher (full admins only) ─────────
  // Disputes previously had NO shell alert at all: opening one only
  // wrote a notifications row + changed an AdminOverview counter.
  // They now ride the same pipeline as new orders (chime + bell
  // badge + toast). Managers never subscribe — disputes are a
  // full-admin surface (ধাপ ৪ scope), and the manager shell must not
  // gain alert surfaces.
  useEffect(() => {
    if (isManager) return;
    const alerted = alertedDisputes.current;
    const channel = db
      .channel("admin_dispute_alert")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        (payload) => {
          const d = payload.new as any;
          if (!d?.id) return;
          if (d.status === "open") {
            if (alerted.has(d.id)) return;
            alerted.add(d.id);
            playOrderChime();
            setNewOrderBadge(prev => prev + 1);
            setDisputeAlert({
              orderCode: d.order_id ? `AS-${String(d.order_id).slice(0, 8).toUpperCase()}` : "—",
              reason: String(d.reason || "").slice(0, 140),
              disputeId: d.id,
            });
            // Auto-dismiss after 10 seconds
            setTimeout(() => {
              setDisputeAlert(cur => (cur?.disputeId === d.id ? null : cur));
            }, 10000);
          } else {
            // Resolved/closed: forget it, so a later re-open of the
            // same dispute row alerts as a fresh episode.
            alerted.delete(d.id);
          }
        }
      )
      .subscribe();
    return () => { db.removeChannel(channel); };
  }, [isManager]);

  useEffect(() => {
    if (activeTab === 'messages') {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [activeTab]);

  async function fetchUnreadCount() {
    try {
      const { data, error } = await db
        .from('messages')
        .select('id')
        .eq('status', 'unread');

      if (!error) setUnreadCount((data || []).length);
    } catch (e) {
      console.error("Error fetching unread count:", e);
    }
  }

  function handleLogout() {
    auth.signOut().then(() => {
      lsClear();
      router.push("/login");
    });
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-primary-100 selection:text-primary-900">
      
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 z-[550] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar - Admin Dashboard Theme ── */}
      <aside
        className={`bg-white border-r border-slate-200 flex flex-col z-[600] lg:z-[500] fixed inset-y-0 left-0 lg:static shrink-0 transition-all duration-300 shadow-xl shadow-slate-200/50 w-[260px] ${collapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Sidebar Header - Admin Dashboard */}
        <div className={`h-24 flex items-center bg-[#f8fafc] text-slate-900 shrink-0 relative overflow-hidden transition-all duration-300 border-b border-slate-200 ${collapsed ? 'px-4 justify-center' : 'px-5 lg:px-8'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-[40px] -mr-16 -mt-16" />
            <div className="flex items-center gap-4 relative z-10 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
                    <Zap size={20} className="text-white fill-white" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="font-black tracking-[-0.05em] text-[13px] lg:text-[14px] uppercase italic leading-none text-slate-900 whitespace-nowrap">Admin Dashboard</span>
                        <span className="text-[9px] font-black text-primary-600 uppercase tracking-[0.3em] mt-1 italic whitespace-nowrap">Store Control</span>
                    </div>
                )}
            </div>
            <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700"
            >
                <X size={18} />
            </button>
        </div>

        {/* User Quick Info */}
        {!collapsed && (
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
                <div className="w-12 h-12 rounded-[1.25rem] border-2 border-white shadow-sm overflow-hidden bg-primary-600 shrink-0 flex items-center justify-center">
                    <span className="text-white font-black text-lg uppercase">{(username || "A").charAt(0)}</span>
                </div>
                <div className="min-w-0">
                    <div className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tight">{username}</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        {isManager ? "Store Manager" : "Verified Admin"}
                    </div>
                </div>
            </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {!isManager && (
          <MenuItem
            id="dashboard"
            label="Home"
            icon={<LayoutDashboard size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          )}
          <MenuItem
            id="orders"
            label="Sold Orders"
            icon={<ShoppingCart size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          {!isManager && (
          <>
          <MenuItem
            id="payments"
            label="Payment Verification"
            icon={<DollarSign size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          <MenuItem
            id="products"
            label="Create New Offers"
            icon={<Plus size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          <MenuItem
            id="active_offers"
            label="Active Offers"
            icon={<Package size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />

          <div className="pt-6 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${collapsed ? 'hidden' : 'block'}`} />
          </div>

          <CollapsibleMenu
            label="Store Management"
            icon={<Settings size={20} />}
            collapsed={collapsed}
            activeTab={activeTab}
            setActiveTab={goToTab}
            items={[
                { id: "categories", label: "Categories" },
                { id: "store_info", label: "Store Information" },
                { id: "storefront", label: "Storefront" },
                { id: "settings", label: "General Config" }
            ]}
          />

          <div className="pt-6 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${collapsed ? 'hidden' : 'block'}`} />
          </div>

          <MenuItem
            id="messages"
            label="Messages"
            icon={<MessageSquare size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            badge={unreadCount > 0 ? String(unreadCount) : undefined}
            collapsed={collapsed}
          />
          <MenuItem
            id="customers"
            label="Customers"
            icon={<Users size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          {/* Fix Round 5 (item 4): the standalone "Store Information"
              item that used to sit here duplicated the Store Management
              submenu entry (both → store_info). Removed — the page is
              reached via Store Management → Store Information. */}
          <MenuItem
            id="feedback"
            label="Feedback"
            icon={<Star size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          <MenuItem
            id="coupons"
            label="Coupons"
            icon={<Tag size={20} />}
            activeTab={activeTab}
            setActiveTab={goToTab}
            collapsed={collapsed}
          />
          </>
          )}

          <div className="pt-4 px-3 pb-2">
              <div className={`h-px bg-slate-100 ${collapsed ? 'hidden' : 'block'}`} />
          </div>

          <a 
            href="/" 
            target="_blank"
            className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all group`}
          >
            <div className="shrink-0 group-hover:scale-110 transition-transform"><Store size={20} /></div>
            {!collapsed && (
                <span className="font-black text-[13px] uppercase tracking-wide whitespace-nowrap">Visit Store</span>
            )}
            {!collapsed && <ExternalLink size={14} className="ml-auto opacity-40" />}
          </a>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/30">
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-100 transition-all group"
            >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </div>
                {!collapsed && <span className="text-[12px] font-black uppercase tracking-widest group-hover:text-slate-900 transition-colors">Collapse menu</span>}
            </button>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-primary-50 hover:text-primary-700 transition-all group"
            >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <LogOut size={18} />
                </div>
                {!collapsed && <span className="text-[12px] font-black uppercase tracking-widest">Terminate Session</span>}
            </button>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <div className="flex-1 min-w-0 flex flex-col relative z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex justify-between items-center shrink-0 shadow-sm z-40">
          <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
              <button
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  className="lg:hidden shrink-0 w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                  <Menu size={20} />
              </button>
              <div className="relative w-full max-w-xl min-w-0 group">
                  <input
                    type="text"
                    placeholder="Scan orders by ID, product name, or customer email..."
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const q = (e.currentTarget.value || "").trim();
                      if (!q) return;
                      try {
                        if (q.toUpperCase().startsWith("AS-")) {
                          // Display codes are "AS-" + first 8 hex of the
                          // order UUID (orderCode) — the Orders filter
                          // matches on the raw id, so hand it the prefix.
                          localStorage.setItem("orderScanQuery", q.slice(3).toLowerCase());
                        } else {
                          localStorage.setItem("orderScanQuery", q);
                        }
                      } catch {}
                      // QA3 D4: if the Orders screen is already mounted,
                      // signal it to consume the stashed query right away.
                      try { window.dispatchEvent(new Event("orderScanRequested")); } catch {}
                      goToTab("orders");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                  />
                  <Search className="absolute left-4 top-3 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                  <div className="absolute right-3 top-2.5 hidden md:flex items-center gap-1 opacity-20 group-focus-within:opacity-40 transition-opacity">
                      <kbd className="text-[10px] font-sans border border-slate-400 rounded px-1.5 py-0.5">Ctrl</kbd>
                      <kbd className="text-[10px] font-sans border border-slate-400 rounded px-1.5 py-0.5">K</kbd>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 ml-3 sm:ml-6 shrink-0">
              {/* Exit to Site */}
              <button
                  onClick={() => router.push("/")}
                  className="hidden md:flex items-center gap-1 text-[13px] font-bold text-slate-500 hover:text-slate-900 tracking-wide mr-2 transition-colors whitespace-nowrap"
              >
                  <ChevronLeft size={16} /> EXIT TO SITE
              </button>

              {/* Alerts Bell — new orders + disputes (ধাপ ৫ক২) */}
              <button
                onClick={() => { goToTab("orders"); setNewOrderBadge(0); }}
                className="relative text-slate-500 hover:text-slate-900 transition-colors"
              >
                <Bell size={20} />
                <AnimatePresence>
                  {newOrderBadge > 0 && (
                    <motion.span
                      key={newOrderBadge}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white"
                    >
                      {newOrderBadge > 9 ? "9+" : newOrderBadge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Messages Icon (full admins only — messaging is outside the manager scope) */}
              {!isManager && (
              <button
                onClick={() => goToTab("messages")}
                className="relative text-[#14b8a6] hover:text-teal-600 transition-colors flex items-center justify-center"
              >
                  <MessageSquare size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#14b8a6] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                  )}
              </button>
              )}

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full border border-slate-200 bg-primary-600 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-200 transition-all ml-2 flex items-center justify-center" onClick={() => goToTab(isManager ? "orders" : "settings")}>
                  <span className="text-white font-black text-sm uppercase">{(username || "A").charAt(0)}</span>
              </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-0 custom-scrollbar">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </main>
      </div>

      {/* ── Alert toast stack (new order + dispute) ── */}
      <div className="fixed top-5 right-5 z-[999] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {newOrderAlert && (
            <OrderToast
              title={newOrderAlert.title}
              amount={newOrderAlert.amount}
              onView={() => {
                goToTab("orders");
                setNewOrderBadge(0);
                setNewOrderAlert(null);
              }}
              onDismiss={() => setNewOrderAlert(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {disputeAlert && (
            <DisputeToast
              orderCode={disputeAlert.orderCode}
              reason={disputeAlert.reason}
              onView={() => {
                goToTab("orders");
                setNewOrderBadge(0);
                setDisputeAlert(null);
              }}
              onDismiss={() => setDisputeAlert(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MenuItem({ id, label, icon, activeTab, setActiveTab, badge, collapsed }: any) {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3.5 w-full px-4 py-2.5 rounded-xl transition-all duration-300 relative group ${
                isActive 
                ? "text-slate-900" 
                : "text-slate-400 hover:bg-slate-50/80 hover:text-slate-600"
            }`}
        >
            <div className={`shrink-0 p-1.5 rounded-lg transition-all duration-300 ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'group-hover:scale-105'}`}>
                {icon}
            </div>
            {!collapsed && (
                <span className={`font-black text-[10px] uppercase tracking-[0.15em] whitespace-nowrap transition-all ${isActive ? 'translate-x-1' : ''}`}>
                    {label}
                </span>
            )}
            {badge && !collapsed && (
                <span className="ml-auto px-2 py-0.5 bg-primary-600 text-white text-[9px] font-black rounded-lg shadow-lg shadow-primary-600/30">
                    {badge}
                </span>
            )}
            {isActive && (
                <motion.div 
                    layoutId="activePill"
                    className={`absolute bg-primary-500 rounded-full shadow-[0_0_10px_rgba(29,191,115,0.4)] ${collapsed ? 'right-1 w-1 h-10' : 'right-0 w-1.5 h-8 rounded-l-full'}`}
                />
            )}
        </button>
    );
}

function CollapsibleMenu({ label, icon, collapsed, activeTab, setActiveTab, items }: any) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all group`}
            >
                <div className="shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
                {!collapsed && (
                    <>
                        <span className="font-black text-[13px] uppercase tracking-wide whitespace-nowrap flex-1 text-left">{label}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>
            {!collapsed && isOpen && (
                <div className="pl-12 pr-4 space-y-1 py-1">
                    {items.map((item: any) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left py-2 text-[12px] font-bold transition-all tracking-wide uppercase ${
                                activeTab === item.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

