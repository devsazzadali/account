"use client";

// AccountStoreOne — customer order page.
// Honesty rules (completion build):
//  - The status badge is driven by payment_status: an unpaid order says
//    "Awaiting Payment" — never "Payment Verified".
//  - The Credential Vault renders ONLY the real credential_* fields the
//    server wrote at delivery. There are no placeholder credentials.
//  - Buyers can pay (manual TrxID / wallet), cancel, confirm receipt and
//    open a dispute from here; every action is a server-side state
//    transition via /api/orders/[id].

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck, Zap, CheckCircle, Clock, Package, Eye, EyeOff,
  Copy, Check, AlertTriangle, Lock, ArrowLeft, Loader2, Wallet, XCircle, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { PageLoader } from "../components/SkeletonUI";
import { TotpVault } from "../components/TotpVault";

interface Order {
  id: string;
  status: string;
  payment_status: string;
  escrow_state: string;
  escrow_hold_until: string | null;
  payment_method: string | null;
  total_price: number;
  quantity: number;
  created_at: string;
  customer_email: string;
  products?: { title: string; image: string } | null;
  credential_username?: string | null;
  credential_password?: string | null;
  credential_notes?: string | null;
  two_factor_secret?: string | null;
  recovery_email?: string | null;
}

const STATUS_TIMELINE = ["New Order", "PREPARING", "Delivering", "Completed"];

const timelineLabel: Record<string, string> = {
  "New Order": "Order Placed",
  "PREPARING": "Preparing Delivery",
  "Delivering": "Delivered",
  "Completed": "Completed",
};

function paymentBadge(order: Order): { label: string; cls: string } {
  if (order.status === "Canceled") return { label: "Canceled", cls: "bg-slate-100 border-slate-200 text-slate-500" };
  if (order.status === "Refunded") return { label: "Refunded to Wallet", cls: "bg-violet-50 border-violet-200 text-violet-600" };
  if (order.status === "Disputed") return { label: "Under Dispute", cls: "bg-red-50 border-red-200 text-red-600" };
  switch (order.payment_status) {
    case "unpaid": return { label: "Awaiting Payment", cls: "bg-amber-50 border-amber-200 text-amber-600" };
    case "pending_verification": return { label: "Payment Under Verification", cls: "bg-blue-50 border-blue-200 text-blue-600" };
    case "paid": return { label: order.escrow_state === "completed" ? "Paid — Completed" : "Paid — Held in Escrow", cls: "bg-emerald-50 border-emerald-200 text-emerald-600" };
    case "refunded": return { label: "Refunded to Wallet", cls: "bg-violet-50 border-violet-200 text-violet-600" };
    default: return { label: order.status, cls: "bg-slate-50 border-slate-200 text-slate-500" };
  }
}

export function OrderPage() {
  const params = useParams();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [payConfig, setPayConfig] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [method, setMethod] = useState("bkash");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { credentials: "same-origin" });
      if (res.ok) {
        const json = await res.json();
        setOrder(json.order);
      }
    } catch { /* keep last state */ }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (order?.payment_status === "unpaid") {
      fetch("/api/payments/config").then((r) => r.json()).then((j) => {
        setPayConfig(j);
        if (!j?.manual?.bkashNumber && j?.manual?.nagadNumber) setMethod("nagad");
      }).catch(() => {});
      fetch("/api/wallet").then((r) => r.json()).then((j) => setWalletBalance(Number(j.wallet?.balance ?? j.balance) || 0)).catch(() => {});
    }
  }, [order?.payment_status]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      toast.success("Done");
      await refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) return <PageLoader label="Loading Order..." />;
  if (!order) return <div className="p-8 text-center">Order not found.</div>;

  const badge = paymentBadge(order);
  const stepIndex = STATUS_TIMELINE.indexOf(order.status);
  const hasCredentials = !!order.credential_username;
  const isPaid = order.payment_status === "paid";
  const manualNumber = method === "bkash" ? payConfig?.manual?.bkashNumber : payConfig?.manual?.nagadNumber;
  const canConfirm = isPaid && order.escrow_state === "in_escrow" && (order.status === "Delivering" || order.status === "Completed");
  const canDispute = isPaid && ["PREPARING", "Delivering", "Completed"].includes(order.status);
  const canCancel = order.payment_status === "unpaid" || order.payment_status === "pending_verification" || (isPaid && order.status === "PREPARING");

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <div className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">Order Tracking</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{orderId?.slice(0, 12).toUpperCase()}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>
            <ShieldCheck size={14} /> {badge.label}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Product Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex items-center gap-5">
          {order.products?.image && <img src={order.products.image} alt={order.products.title} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-sm" />}
          <div className="flex-1">
            <h2 className="text-sm font-black text-slate-900 leading-tight mb-1">{order.products?.title || "Product"}</h2>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Qty: {order.quantity}</span>
              <span>•</span>
              <span className="text-primary-600">${Number(order.total_price).toFixed(2)}</span>
              <span>•</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {(order as any).variant_label && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Option: {(order as any).variant_label}</p>
            )}
            {(order as any).coupon_code && (
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                Coupon {(order as any).coupon_code} · -${Number((order as any).discount_amount || 0).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Payment panel (unpaid) */}
        {order.payment_status === "unpaid" && order.status !== "Canceled" && (
          <div className="bg-white rounded-[2rem] border border-amber-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-amber-500" /> Complete your payment
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {payConfig?.manual?.bkashNumber && (
                <button onClick={() => setMethod("bkash")} className={`p-3.5 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${method === "bkash" ? "bg-primary-50 border-primary-300 text-primary-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>bKash</button>
              )}
              {payConfig?.manual?.nagadNumber && (
                <button onClick={() => setMethod("nagad")} className={`p-3.5 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all ${method === "nagad" ? "bg-primary-50 border-primary-300 text-primary-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>Nagad</button>
              )}
            </div>
            {manualNumber ? (
              <>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Send <span className="font-black text-slate-900">${Number(order.total_price).toFixed(2)}</span> to <span className="font-black text-[#0C2254]">{manualNumber}</span>, then submit your Transaction ID:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={trxId} onChange={(e) => setTrxId(e.target.value.toUpperCase())} placeholder="Transaction ID (TrxID)" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
                  <input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Your sender number" className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary-500 transition-all" />
                </div>
                <button
                  disabled={busy === "submit_payment" || trxId.trim().length < 6 || senderNumber.trim().length < 6}
                  onClick={() => act("submit_payment", { method, trxId: trxId.trim(), senderNumber: senderNumber.trim() })}
                  className="w-full py-3.5 bg-[#0C2254] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {busy === "submit_payment" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Submit for Verification
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Manual payment numbers are not published right now — contact support via the chat widget.</p>
            )}
            {walletBalance !== null && walletBalance >= Number(order.total_price) && (
              <button
                disabled={busy === "pay_wallet"}
                onClick={() => act("pay_wallet")}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Wallet size={14} /> Pay ${Number(order.total_price).toFixed(2)} from Wallet (balance ${walletBalance.toFixed(2)})
              </button>
            )}
          </div>
        )}

        {order.payment_status === "pending_verification" && (
          <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6 flex gap-4">
            <Loader2 size={22} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
            <div>
              <h4 className="text-xs font-black text-blue-900 mb-1">Payment under verification</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed">The store is checking your Transaction ID. Delivery follows automatically once it is approved — this page updates on its own.</p>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        {!["Canceled", "Refunded", "Disputed"].includes(order.status) && (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Delivery Timeline</h3>
            <div className="space-y-0">
              {STATUS_TIMELINE.map((status, i) => {
                const isDone = i <= stepIndex;
                const isActive = i === stepIndex;
                return (
                  <div key={status} className="flex items-start gap-4 relative">
                    {i < STATUS_TIMELINE.length - 1 && (
                      <div className={`absolute left-5 top-10 w-0.5 h-8 ${isDone && i < stepIndex ? "bg-primary-300" : "bg-slate-100"}`} />
                    )}
                    <motion.div
                      animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                      transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${isDone ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20" : "bg-slate-50 border-slate-200 text-slate-300"}`}
                    >
                      {isDone ? <CheckCircle size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </motion.div>
                    <div className="pb-8">
                      <p className={`text-sm font-black ${isDone ? "text-slate-900" : "text-slate-300"}`}>{timelineLabel[status]}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? "text-primary-600" : "text-slate-300"}`}>
                        {isActive ? "In Progress..." : isDone ? "Complete" : "Pending"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credential Vault */}
        {hasCredentials ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#0C2254] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {revealed ? <ShieldCheck size={20} className="text-white" /> : <Lock size={20} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Credential Vault</h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                    {revealed ? "Credentials Visible — Keep Secure" : "Tap to unlock your account access"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRevealed(!revealed)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all border border-white/30"
              >
                {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
                {revealed ? "Hide" : "Reveal"}
              </button>
            </div>
            <AnimatePresence>
              {revealed ? (
                <motion.div key="revealed" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-6 space-y-4">
                  {[
                    { label: "Email / Username", value: order.credential_username as string, field: "Username" },
                    ...(order.credential_password ? [{ label: "Password", value: order.credential_password, field: "Password" }] : []),
                  ].map(cred => (
                    <div key={cred.field} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{cred.label}</p>
                      <div className="flex items-center justify-between gap-3">
                        <code className="text-sm font-mono font-bold text-slate-900 break-all">{cred.value}</code>
                        <button
                          onClick={() => copyToClipboard(cred.value, cred.field)}
                          className="shrink-0 p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-primary-600 border border-slate-200"
                        >
                          {copiedField === cred.field ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  {order.two_factor_secret && (
                    <TotpVault secret={order.two_factor_secret} recoveryEmail={order.recovery_email} />
                  )}
                  {order.credential_notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                      <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-sm text-amber-800">{order.credential_notes}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                    <Lock size={28} className="text-slate-300" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Your delivered credentials are stored here</p>
                  <p className="text-[10px] text-slate-300 mt-1">Click "Reveal" above to view them</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : isPaid && order.status !== "Disputed" ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 text-center shadow-sm">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-primary-600 mx-auto mb-4" />
            <h3 className="text-sm font-black text-slate-900 mb-1">Preparing Your Credentials</h3>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Payment confirmed. The store is preparing your delivery — credentials will appear in the vault above as soon as they are assigned.</p>
          </div>
        ) : null}

        {/* Buyer actions */}
        {(canConfirm || canDispute || canCancel) && (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Actions</h3>
            <div className="flex flex-wrap gap-3">
              {canConfirm && (
                <button disabled={busy === "confirm_receipt"} onClick={() => act("confirm_receipt")} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-40 flex items-center gap-2">
                  <CheckCircle size={14} /> Confirm Receipt — Release Escrow
                </button>
              )}
              {canDispute && (
                <button onClick={() => setShowDispute(!showDispute)} className="px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2">
                  <AlertTriangle size={14} /> Open a Dispute
                </button>
              )}
              {canCancel && (
                <button disabled={busy === "cancel"} onClick={() => { if (confirm(isPaid ? "Cancel this order? The payment will be refunded to your store wallet." : "Cancel this order?")) act("cancel"); }} className="px-5 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40">
                  <XCircle size={14} /> {isPaid ? "Cancel & Refund to Wallet" : "Cancel Order"}
                </button>
              )}
            </div>
            {showDispute && (
              <div className="pt-2 space-y-3">
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="Describe the problem (e.g. credentials don't work, wrong account)…"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-300 transition-all resize-none"
                />
                <button
                  disabled={busy === "dispute" || disputeReason.trim().length < 5}
                  onClick={() => act("dispute", { reason: disputeReason.trim() })}
                  className="px-5 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all disabled:opacity-40"
                >
                  {busy === "dispute" ? "Opening…" : "Submit Dispute"}
                </button>
                <p className="text-[10px] text-slate-400 font-medium">Your payment stays frozen in escrow while the dispute is reviewed. The store can replace the item or refund you to your wallet.</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice (P4) — printable receipt for paid orders */}
        {isPaid && (
          <div className="flex justify-end">
            <Link
              href={`/order/${order.id}/invoice`}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              View / Print Invoice
            </Link>
          </div>
        )}

        {/* Review (P3) — bound to THIS completed order */}
        {order.status === "Completed" && (
          <OrderReview order={order} />
        )}

        {/* Confirmation trail (P1 events) */}
        {Array.isArray((order as any).events) && (order as any).events.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Order History</h3>
            <div className="space-y-3">
              {(order as any).events.map((e: any) => (
                <div key={e.id} className="flex items-baseline justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700">{ORDER_EVENT_LABELS[e.event] || e.event}</span>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{new Date(e.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Escrow banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-5 flex gap-4">
          <ShieldCheck size={22} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black text-blue-900 mb-1">Escrow Protection</h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              {order.payment_status === "unpaid" && "Once you pay, your money is held in escrow — it is only released after delivery and your confirmation (or 48 hours after delivery)."}
              {order.payment_status === "pending_verification" && "Your payment is being verified. Escrow starts the moment it is approved."}
              {isPaid && order.escrow_state === "in_escrow" && `Your payment is held in escrow${order.escrow_hold_until ? ` until ${new Date(order.escrow_hold_until).toLocaleString()}` : ""}. Confirm receipt to release it early, or open a dispute if something is wrong.`}
              {isPaid && order.escrow_state === "completed" && "This order's escrow has completed — payment released to the store."}
              {order.payment_status === "refunded" && "This order was refunded to your store wallet. Check your dashboard for the credit."}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors">← Back to my orders</Link>
        </div>
      </div>
    </div>
  );
}

const ORDER_EVENT_LABELS: Record<string, string> = {
  created: "Order placed",
  payment_submitted: "Payment submitted",
  payment_verified: "Payment verified — escrow started",
  payment_rejected: "Payment rejected",
  delivered: "Delivered",
  completed: "Completed — escrow released",
  canceled: "Canceled",
  refunded: "Refunded to wallet",
  dispute_opened: "Dispute opened",
  dispute_resolved: "Dispute resolved",
};

/** Review form bound to a completed order (P3). One review per order;
 *  the server enforces ownership + completion. */
function OrderReview({ order }: { order: any }) {
  const existing = order.review;
  const [rating, setRating] = useState(5);
  const [delivery, setDelivery] = useState(0);
  const [service, setService] = useState(0);
  const [description, setDescription] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!existing);

  if (done) {
    return (
      <div className="bg-white rounded-[2rem] border border-emerald-100 p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Thanks for your feedback</h3>
        <p className="text-xs text-slate-500 font-medium">Your review for this order has been recorded and appears on the product page.</p>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          rating,
          comment: comment.trim(),
          delivery_rating: delivery || undefined,
          service_rating: service || undefined,
          description_rating: description || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save the review");
      toast.success("Review published — thank you!");
      setDone(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const Stars = ({ value, onPick }: { value: number; onPick: (n: number) => void }) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onPick(i)} className="p-0.5">
          <Star size={16} className={i <= value ? "text-yellow-500 fill-current" : "text-slate-300"} />
        </button>
      ))}
    </span>
  );

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Rate this order</h3>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">Overall</span>
        <Stars value={rating} onPick={setRating} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-slate-500">
        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1.5">Delivery speed <Stars value={delivery} onPick={setDelivery} /></div>
        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1.5">Service quality <Stars value={service} onPick={setService} /></div>
        <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1.5">Item as described <Stars value={description} onPick={setDescription} /></div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="How was the account and the delivery?"
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500 transition-all resize-none"
      />
      <button
        onClick={submit}
        disabled={busy || comment.trim().length < 3}
        className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-40"
      >
        {busy ? "Publishing…" : "Publish Review"}
      </button>
    </div>
  );
}
