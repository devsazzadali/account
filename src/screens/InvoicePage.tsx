"use client";

// AccountStoreOne — printable order invoice / receipt (Z2U alignment P4).
// Rendered from the buyer's own order (GET /api/orders/[id] enforces
// ownership) + the public store identity. Print via the browser's print
// dialog ("Save as PDF") — no PDF library, no server rendering tricks.

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Loader2, Store } from "lucide-react";

export function InvoicePage() {
  const params = useParams();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [order, setOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const [oRes, sRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`, { credentials: "same-origin" }).then((r) => r.json()),
          fetch("/api/store/stats").then((r) => r.json()).catch(() => null),
        ]);
        if (!oRes?.order) throw new Error(oRes?.error || "Order not found");
        setOrder(oRes.order);
        setStore(sRes);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [orderId]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-sm font-bold text-slate-500">{error}</p>
        <Link href="/dashboard" className="text-[11px] font-black uppercase tracking-widest text-slate-900 underline">Back to my orders</Link>
      </div>
    );
  }
  if (!order) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>;
  }

  const total = Number(order.total_price) || 0;
  const discount = Number(order.discount_amount) || 0;
  const fee = 0.5;
  const subtotal = total + discount - fee;
  const unit = order.quantity > 0 ? subtotal / order.quantity : subtotal;
  const storeName = store?.store_name || "Account Store One";
  const supportEmail = store?.support_email || "";

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/order/${order.id}`} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
            <ArrowLeft size={14} /> Back to order
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-3 bg-[#0C2254] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90">
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 print:shadow-none print:border-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-4">
              {store?.store_logo_url ? (
                <img src={store.store_logo_url} alt={storeName} className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#0C2254] flex items-center justify-center text-white">
                  <Store size={24} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{storeName}</h1>
                {supportEmail && <p className="text-xs font-bold text-slate-400">{supportEmail}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Invoice</p>
              <p className="text-sm font-black text-slate-900">#{String(order.id).slice(0, 12).toUpperCase()}</p>
              <p className="text-xs font-bold text-slate-400">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 py-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed to</p>
              <p className="text-sm font-black text-slate-900">{order.username || "Customer"}</p>
              <p className="text-sm font-medium text-slate-500">{order.customer_email || ""}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment</p>
              <p className="text-sm font-black text-slate-900 capitalize">{order.payment_status}</p>
              <p className="text-sm font-medium text-slate-500">
                {order.payment_method ? `via ${order.payment_method}` : ""}
                {order.paid_at ? ` · ${new Date(order.paid_at).toLocaleDateString()}` : ""}
              </p>
            </div>
          </div>

          {/* Lines */}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="py-3">Item</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Unit</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50">
                <td className="py-4">
                  <p className="font-black text-slate-900">{order.products?.title || order.product_title || "Product"}</p>
                  {order.variant_label && <p className="text-xs font-bold text-slate-400">Option: {order.variant_label}</p>}
                </td>
                <td className="py-4 text-center font-bold text-slate-600">{order.quantity}</td>
                <td className="py-4 text-right font-bold text-slate-600">${unit.toFixed(2)}</td>
                <td className="py-4 text-right font-black text-slate-900">${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end py-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Subtotal</span><span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between"><span className="text-emerald-600 font-bold">Coupon {order.coupon_code}</span><span className="font-bold text-emerald-600">-${discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-500 font-medium">Service fee</span><span className="font-bold text-slate-900">${fee.toFixed(2)}</span></div>
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <span className="font-black text-slate-900 uppercase tracking-wide">Total</span>
                <span className="text-xl font-black text-[#0C2254]">${total.toFixed(2)} <span className="text-[10px] text-slate-400">USD</span></span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 text-[11px] font-medium text-slate-400 leading-relaxed">
            <p>
              Order status: {order.status}.
              {order.delivered_at ? ` Delivered ${new Date(order.delivered_at).toLocaleString()}.` : ""}
              {" "}Payment is held in escrow and released on your confirmation or 48 hours after delivery.
              Questions? Reply in your order messages or contact {supportEmail || "store support"}.
            </p>
            <p className="mt-2">Thank you for your purchase.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
