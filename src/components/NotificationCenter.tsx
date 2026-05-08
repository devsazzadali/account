import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ShoppingBag, CreditCard, AlertTriangle, Package, CheckCircle, MarkAsUnread } from "lucide-react";
import type { AppNotification } from "../lib/useRealtimeNotifications";
import { Link } from "react-router-dom";

const iconMap = {
  order:    { icon: ShoppingBag,   color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100" },
  payment:  { icon: CreditCard,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  alert:    { icon: AlertTriangle, color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100" },
  delivery: { icon: Package,       color: "text-primary-600", bg: "bg-primary-50", border: "border-primary-100" },
};

interface Props {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export function NotificationCenter({ notifications, unreadCount, onMarkAllRead, onMarkRead }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
      >
        <Bell size={18} className="text-slate-600" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-[9px] font-black text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </motion.div>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-3 w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-[10px] font-bold text-primary-600 mt-0.5">{unreadCount} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors px-3 py-1.5 border border-slate-200 rounded-xl"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                    <X size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <Bell size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-sm font-bold text-slate-400">No notifications yet</p>
                    <p className="text-[10px] text-slate-300 mt-1">Order updates will appear here</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = iconMap[notif.type];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-4 p-4 transition-all hover:bg-slate-50 cursor-pointer ${!notif.read ? "bg-primary-50/30" : ""}`}
                        onClick={() => {
                          onMarkRead(notif.id);
                          if (notif.orderId) setOpen(false);
                        }}
                      >
                        <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={18} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-black text-slate-900">{notif.title}</p>
                            {!notif.read && <div className="w-2 h-2 bg-primary-600 rounded-full shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                            {new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
                              Math.round((notif.createdAt.getTime() - Date.now()) / 60000),
                              "minute"
                            )}
                          </p>
                          {notif.orderId && (
                            <Link
                              to={`/order/${notif.orderId}`}
                              onClick={() => setOpen(false)}
                              className="inline-block mt-2 text-[9px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                            >
                              View Order →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
