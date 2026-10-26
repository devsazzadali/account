"use client";

// AccountStoreOne — Coupons (Z2U alignment P5).
// Mirrors the client's Z2U coupon table: Code · Scope · Value · Used ·
// Public · Expires · Actions, with Add / edit-expiry / batch delete.
// Redemption is enforced server-side at checkout (order-service).

import React, { useEffect, useState } from "react";
import { Tag, Plus, Loader2, Trash2, Clock, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  scope: string;
  product_id: string | null;
  category: string | null;
  min_spend: number | null;
  max_uses: number | null;
  per_user_limit: number;
  used_count: number;
  is_public: boolean;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expiryEdit, setExpiryEdit] = useState<{ id: string; value: string } | null>(null);
  const [form, setForm] = useState({
    code: "", type: "percent", value: "10", scope: "store",
    product_id: "", category: "", min_spend: "", max_uses: "", per_user_limit: "1", expires_at: "", is_public: true,
  });

  async function load() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch("/api/coupons", { credentials: "same-origin" }).then((r) => r.json()),
        fetch("/api/db/products?select=id,title,category&limit=500", { credentials: "same-origin" }).then((r) => r.json()).catch(() => null),
      ]);
      setCoupons(cRes.coupons || []);
      setProducts(pRes?.data || []);
      const cats = [...new Set((pRes?.data || []).map((p: any) => p.category).filter(Boolean))] as string[];
      setCategories(cats);
    } catch {
      toast.error("Could not load coupons");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code, type: form.type, value: Number(form.value), scope: form.scope,
          product_id: form.product_id || undefined, category: form.category || undefined,
          min_spend: form.min_spend === "" ? undefined : Number(form.min_spend),
          max_uses: form.max_uses === "" ? undefined : Number(form.max_uses),
          per_user_limit: Number(form.per_user_limit || 1),
          expires_at: form.expires_at || undefined,
          is_public: form.is_public,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create coupon");
      toast.success(`Coupon ${json.coupon.code} created`);
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "10", scope: "store", product_id: "", category: "", min_spend: "", max_uses: "", per_user_limit: "1", expires_at: "", is_public: true });
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function patch(id: string, fields: Record<string, unknown>, msg: string) {
    try {
      const res = await fetch("/api/coupons", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      toast.success(msg);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon? Orders already placed with it are unaffected.")) return;
    const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE", credentials: "same-origin" });
    if (!res.ok) { toast.error("Delete failed"); return; }
    toast.success("Coupon deleted");
    await load();
  }

  async function batchDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} coupon(s)?`)) return;
    for (const id of selected) {
      await fetch(`/api/coupons?id=${id}`, { method: "DELETE", credentials: "same-origin" });
    }
    setSelected(new Set());
    toast.success("Coupons deleted");
    await load();
  }

  const expired = (c: Coupon) => !!c.expires_at && new Date(c.expires_at).getTime() < Date.now();

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Tag className="text-[#F4751F]" size={26} /> My Coupon Codes
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Buyers enter a code at checkout; the discount is validated and priced by the server and recorded on the order.
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={batchDelete} className="px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all">
              Batch delete ({selected.size})
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-[#0C2254] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
            {showForm ? <X size={14} /> : <Plus size={14} />} Add
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Code"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE10" className={inputCls} /></Field>
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </Field>
            <Field label="Value"><input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputCls} /></Field>
            <Field label="Scope">
              <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className={inputCls}>
                <option value="store">Whole store</option>
                <option value="product">One product</option>
                <option value="category">One category</option>
              </select>
            </Field>
            {form.scope === "product" && (
              <Field label="Product">
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className={inputCls}>
                  <option value="">Select product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </Field>
            )}
            {form.scope === "category" && (
              <Field label="Category">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            )}
            <Field label="Min spend ($)"><input type="number" min="0" step="0.01" value={form.min_spend} onChange={(e) => setForm({ ...form, min_spend: e.target.value })} placeholder="No minimum" className={inputCls} /></Field>
            <Field label="Max uses (total)"><input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" className={inputCls} /></Field>
            <Field label="Per buyer limit"><input type="number" min="1" value={form.per_user_limit} onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })} className={inputCls} /></Field>
            <Field label="Expires at"><input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={inputCls} /></Field>
            <Field label="Publicity">
              <select value={form.is_public ? "public" : "private"} onChange={(e) => setForm({ ...form, is_public: e.target.value === "public" })} className={inputCls}>
                <option value="public">Public</option>
                <option value="private">Private (code only)</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end">
            <button onClick={create} disabled={form.code.trim().length < 3} className="px-6 py-3 bg-[#F4751F] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-40">
              Create Coupon
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
        ) : coupons.length === 0 ? (
          <div className="py-20 text-center">
            <Tag size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-bold text-slate-400">No coupon codes yet — add your first one above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3.5 w-8"><input type="checkbox" checked={selected.size === coupons.length && coupons.length > 0} onChange={(e) => setSelected(e.target.checked ? new Set(coupons.map((c) => c.id)) : new Set())} /></th>
                <th className="px-3 py-3.5">Code</th>
                <th className="px-3 py-3.5">Scope</th>
                <th className="px-3 py-3.5">Discount</th>
                <th className="px-3 py-3.5">Use times</th>
                <th className="px-3 py-3.5">Is publicity</th>
                <th className="px-3 py-3.5">Expired</th>
                <th className="px-3 py-3.5">Active</th>
                <th className="px-3 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5"><input type="checkbox" checked={selected.has(c.id)} onChange={(e) => { const s = new Set(selected); if (e.target.checked) s.add(c.id); else s.delete(c.id); setSelected(s); }} /></td>
                  <td className="px-3 py-3.5 font-black text-slate-900 tracking-wide">{c.code}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-500 capitalize">{c.scope}{c.scope === "category" && c.category ? ` · ${c.category}` : ""}{c.scope === "product" && c.product_id ? ` · ${products.find((p) => p.id === c.product_id)?.title || "product"}` : ""}</td>
                  <td className="px-3 py-3.5 font-black text-[#0C2254]">{c.type === "percent" ? `${Number(c.value)}%` : `$${Number(c.value).toFixed(2)}`}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-600">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-600">{c.is_public ? "Public" : "Private"}</td>
                  <td className="px-3 py-3.5 font-bold text-slate-600">
                    {expiryEdit?.id === c.id ? (
                      <span className="flex items-center gap-1.5">
                        <input type="datetime-local" value={expiryEdit.value} onChange={(e) => setExpiryEdit({ id: c.id, value: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1 text-xs" />
                        <button onClick={() => { patch(c.id, { expires_at: expiryEdit.value ? new Date(expiryEdit.value).toISOString() : null }, "Expiry updated"); setExpiryEdit(null); }} className="text-emerald-600 font-black text-[10px] uppercase">Save</button>
                        <button onClick={() => setExpiryEdit(null)} className="text-slate-400 font-black text-[10px] uppercase">Cancel</button>
                      </span>
                    ) : (
                      <span className={expired(c) ? "text-red-500" : ""}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                        <button onClick={() => setExpiryEdit({ id: c.id, value: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : "" })} className="ml-2 text-[#F4751F] hover:underline text-[10px] font-black uppercase"><Clock size={11} className="inline" /> Edit</button>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <button onClick={() => patch(c.id, { is_active: !c.is_active }, c.is_active ? "Coupon deactivated" : "Coupon activated")} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${c.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                      {c.is_active ? "Active" : "Off"}
                    </button>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button onClick={() => remove(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
