"use client";

// AccountStoreOne — admin settings (REAL persistence, completion build).
// The old screen was 100% cosmetic: every field was local state and even
// offered inputs for secret keys. This version reads/writes the
// store_settings table via /api/admin/settings (payment numbers shown at
// checkout and in the wallet come from here, falling back to env), and
// the Integrations panel only REPORTS configuration status — secret keys
// live in environment variables and are never typed into a web form.

import React, { useEffect, useState } from "react";
import { Shield, CreditCard, Save, Globe, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const TABS = ["General", "Payments", "Integrations"] as const;
type Tab = typeof TABS[number];

interface Settings {
  store_name: string;
  store_description: string;
  support_email: string;
  payment_number_bkash: string;
  payment_number_nagad: string;
  payment_instructions: string;
  // Z2U alignment P0: storefront appearance + visibility controls.
  store_logo_url: string;
  store_banner_url: string;
  store_open: string; // "true" | "false"
  support_hours: string;
}

interface Integrations {
  stripe: { configured: boolean; publishable_key_set: boolean; webhook_secret_set: boolean };
  manual_payments: { bkash_configured: boolean; nagad_configured: boolean };
  email?: { configured: boolean; provider: string };
  auth: { provider: string };
  storage: { mode: string; note: string };
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("General");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [integrations, setIntegrations] = useState<Integrations | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/admin/settings", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load settings");
      setSettings(json.settings);
      setSources(json.sources || {});
      setIntegrations(json.integrations);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSettings(json.settings);
      setSources(json.sources || {});
      setSaved(true);
      toast.success("Settings saved — live across the store");
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Settings>(key: K, value: string) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function uploadImage(key: "store_logo_url" | "store_banner_url", file: File | undefined) {
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      set(key, json.url);
      toast.success("Image uploaded — remember to Save");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="w-full lg:w-52 shrink-0 bg-white rounded-3xl border border-slate-100 shadow-sm p-3 space-y-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-[13px] font-black uppercase tracking-wide transition-all ${
              activeTab === tab ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab === "General" && <Globe size={16} />}
            {tab === "Payments" && <CreditCard size={16} />}
            {tab === "Integrations" && <Shield size={16} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0 w-full lg:w-auto space-y-6">
        {!settings ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-300" size={32} />
          </div>
        ) : activeTab === "General" ? (
          <SectionCard title="Store Identity">
            <Field label="Store name" source={sources.store_name}>
              <input value={settings.store_name} onChange={(e) => set("store_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Store description (shown in the store profile)" source={sources.store_description}>
              <textarea value={settings.store_description} onChange={(e) => set("store_description", e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Support email" source={sources.support_email}>
              <input value={settings.support_email} onChange={(e) => set("support_email", e.target.value)} placeholder="support@yourstore.com" className={inputCls} />
            </Field>
            <Field label="Support hours (shown on your seller profile)" source={sources.support_hours}>
              <input value={settings.support_hours || ""} onChange={(e) => set("support_hours", e.target.value)} placeholder="e.g. 9:00–23:00 (GMT+6), every day" className={inputCls} />
            </Field>
            <Field label="Store logo" source={sources.store_logo_url}>
              <div className="flex items-center gap-3">
                {settings.store_logo_url ? (
                  <img src={settings.store_logo_url} alt="Store logo" className="w-14 h-14 rounded-2xl object-cover border border-slate-100" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#0C2254] flex items-center justify-center text-white text-[10px] font-black uppercase">No logo</div>
                )}
                <input value={settings.store_logo_url || ""} onChange={(e) => set("store_logo_url", e.target.value)} placeholder="https://… or upload →" className={`${inputCls} flex-1`} />
                <label className="px-4 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all whitespace-nowrap">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage("store_logo_url", e.target.files?.[0])} />
                </label>
              </div>
            </Field>
            <Field label="Store banner (wide image shown on your seller profile)" source={sources.store_banner_url}>
              <div className="space-y-3">
                {settings.store_banner_url && (
                  <img src={settings.store_banner_url} alt="Store banner" className="w-full h-28 rounded-2xl object-cover border border-slate-100" />
                )}
                <div className="flex items-center gap-3">
                  <input value={settings.store_banner_url || ""} onChange={(e) => set("store_banner_url", e.target.value)} placeholder="https://… or upload →" className={`${inputCls} flex-1`} />
                  <label className="px-4 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-800 transition-all whitespace-nowrap">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage("store_banner_url", e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </Field>
            <Field label="Store visibility (Hide Shop)" source={sources.store_open}>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-sm font-black text-slate-900">{settings.store_open === "false" ? "Store is HIDDEN" : "Store is OPEN"}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Hidden = visitors see a “temporarily closed” notice and no new orders can be placed. Existing orders, messages and reviews stay reachable for signed-in customers.</p>
                </div>
                <button
                  type="button"
                  onClick={() => set("store_open", settings.store_open === "false" ? "true" : "false")}
                  className={`relative w-14 h-8 rounded-full transition-all shrink-0 ${settings.store_open === "false" ? "bg-slate-300" : "bg-emerald-500"}`}
                  aria-label="Toggle store visibility"
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${settings.store_open === "false" ? "left-1" : "left-7"}`} />
                </button>
              </div>
            </Field>
            <SaveBar saving={saving} saved={saved} onSave={handleSave} />
          </SectionCard>
        ) : activeTab === "Payments" ? (
          <>
            <SectionCard title="Manual Payment Numbers (bKash / Nagad)">
              <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                  These are the numbers buyers send money to at checkout and for wallet top-ups. They are shown ONLY to signed-in customers. Leave a field empty to disable that method (an environment variable, if set, takes over as the fallback).
                </p>
              </div>
              <Field label="bKash number" source={sources.payment_number_bkash}>
                <input value={settings.payment_number_bkash} onChange={(e) => set("payment_number_bkash", e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} />
              </Field>
              <Field label="Nagad number" source={sources.payment_number_nagad}>
                <input value={settings.payment_number_nagad} onChange={(e) => set("payment_number_nagad", e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} />
              </Field>
              <Field label="Payment instructions (shown at checkout)" source={sources.payment_instructions}>
                <textarea value={settings.payment_instructions} onChange={(e) => set("payment_instructions", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
              </Field>
              <SaveBar saving={saving} saved={saved} onSave={handleSave} />
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Integrations — status only">
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
              Secret keys are configured with environment variables on the server — they are never entered into, or shown on, this page.
            </p>
            {integrations && (
              <div className="space-y-3">
                <StatusRow
                  label="Stripe (card payments)"
                  ok={integrations.stripe.configured}
                  detail={integrations.stripe.configured
                    ? `Live — publishable key ${integrations.stripe.publishable_key_set ? "set" : "missing"}, webhook secret ${integrations.stripe.webhook_secret_set ? "set" : "missing"}`
                    : "Not configured — set STRIPE_SECRET_KEY (+ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET) to enable card checkout"}
                />
                <StatusRow
                  label="Manual payments (bKash / Nagad)"
                  ok={integrations.manual_payments.bkash_configured || integrations.manual_payments.nagad_configured}
                  detail={`bKash ${integrations.manual_payments.bkash_configured ? "configured" : "not set"} · Nagad ${integrations.manual_payments.nagad_configured ? "configured" : "not set"}`}
                />
                {integrations.email && (
                  <StatusRow
                    label="Transactional email (Resend)"
                    ok={integrations.email.configured}
                    detail={integrations.email.configured
                      ? "Live — order confirmations and delivery emails are sent"
                      : "Not configured — set RESEND_API_KEY + STORE_FROM_EMAIL to send order emails (they stay queued in the outbox until then)"}
                  />
                )}
                <StatusRow label="Customer accounts" ok detail={integrations.auth.provider} />
                <StatusRow label="File uploads" ok detail={`${integrations.storage.mode} — ${integrations.storage.note}`} />
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, source, children }: { label: string; source?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {label}
        {source && <span className={`px-2 py-0.5 rounded-md text-[8px] ${source === "database" ? "bg-emerald-50 text-emerald-600" : source === "environment" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}>{source}</span>}
      </label>
      {children}
    </div>
  );
}

function SaveBar({ saving, saved, onSave }: { saving: boolean; saved: boolean; onSave: () => void }) {
  return (
    <div className="pt-2">
      <button
        onClick={onSave}
        disabled={saving}
        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
        {saved ? "Saved" : "Save Settings"}
      </button>
    </div>
  );
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <div className="flex items-start gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
      <span className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${ok ? "bg-emerald-500" : "bg-amber-400"}`} />
      <div>
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="text-[12px] text-slate-500 font-medium leading-relaxed mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
