"use client";

// AccountStoreOne — admin settings (REAL persistence, completion build).
// Reads/writes the store_settings table via /api/admin/settings.
// Payment credentials (Stripe / PayPal) are managed from the Payments
// tab: secret fields are WRITE-ONLY — the API stores them server-side
// and never returns them, so this page only ever learns whether each
// secret is set (and can replace or remove it), never its value. Other
// secrets (e.g. the email provider key) stay out-of-band and are only
// reported as status in the Integrations panel.

import React, { useEffect, useState } from "react";
import { Shield, CreditCard, Save, Globe, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const TABS = ["General", "Payments", "Integrations"] as const;
type Tab = typeof TABS[number];

interface Settings {
  store_name: string;
  store_description: string;
  support_email: string;
  stripe_publishable_key: string;
  stripe_enabled: string; // "true" | "false"
  paypal_client_id: string;
  paypal_enabled: string; // "true" | "false"
  // Z2U alignment P0: storefront appearance + visibility controls.
  store_logo_url: string;
  store_banner_url: string;
  store_open: string; // "true" | "false"
  support_hours: string;
  site_url: string; // base for links inside transactional emails
}

interface Integrations {
  stripe: {
    configured: boolean; enabled: boolean; toggle_on: boolean;
    publishable_key_set: boolean; webhook_secret_set: boolean;
    key_source: string | null; webhook_source: string | null;
  };
  paypal: {
    configured: boolean; credentials_ready: boolean; toggle_on: boolean;
    client_id_set: boolean; client_secret_set: boolean;
    key_source: string | null; checkout_integrated: boolean;
  };
  email?: { configured: boolean; provider: string | null; from?: string | null; key_source?: string | null };
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
  // Write-only payment secrets: typed values live ONLY in these fields
  // until save; they are never populated from the server. Empty = keep
  // the stored secret; the Remove buttons flag a server-side delete.
  const [stripeSecretInput, setStripeSecretInput] = useState("");
  const [stripeWebhookInput, setStripeWebhookInput] = useState("");
  const [paypalSecretInput, setPaypalSecretInput] = useState("");
  const [clearSecrets, setClearSecrets] = useState<Record<string, boolean>>({});

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
      const body: Record<string, unknown> = { ...settings };
      // Write-only secrets: send a value only when the admin typed one;
      // send `<key>__clear` when a removal was requested. The response
      // never contains the secrets themselves.
      if (stripeSecretInput.trim()) body.stripe_secret_key = stripeSecretInput.trim();
      if (stripeWebhookInput.trim()) body.stripe_webhook_secret = stripeWebhookInput.trim();
      if (paypalSecretInput.trim()) body.paypal_client_secret = paypalSecretInput.trim();
      for (const k of Object.keys(clearSecrets)) {
        if (clearSecrets[k]) body[`${k}__clear`] = true;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSettings(json.settings);
      setSources(json.sources || {});
      setIntegrations(json.integrations);
      setStripeSecretInput("");
      setStripeWebhookInput("");
      setPaypalSecretInput("");
      setClearSecrets({});
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
      <div className="w-full lg:w-52 shrink-0 panel p-3 space-y-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-[13px] font-black uppercase tracking-wide transition-all ${
              activeTab === tab ? "bg-primary-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
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
          <div className="panel p-16 flex items-center justify-center">
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
            <Field label="Support hours (shown on your store profile)" source={sources.support_hours}>
              <input value={settings.support_hours || ""} onChange={(e) => set("support_hours", e.target.value)} placeholder="e.g. 9:00–23:00 (GMT+6), every day" className={inputCls} />
            </Field>
            <Field label="Site URL (base for links inside order emails — point at the live deployment)" source={sources.site_url}>
              <input value={settings.site_url || ""} onChange={(e) => set("site_url", e.target.value)} placeholder="https://your-live-site.example" className={inputCls} />
            </Field>
            <Field label="Store logo" source={sources.store_logo_url}>
              <div className="flex items-center gap-3">
                {settings.store_logo_url ? (
                  <img src={settings.store_logo_url} alt="Store logo" className="w-14 h-14 rounded-2xl object-cover border border-slate-100" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 text-[10px] font-black uppercase">No logo</div>
                )}
                <input value={settings.store_logo_url || ""} onChange={(e) => set("store_logo_url", e.target.value)} placeholder="https://… or upload →" className={`${inputCls} flex-1`} />
                <label className="px-4 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-all whitespace-nowrap">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage("store_logo_url", e.target.files?.[0])} />
                </label>
              </div>
            </Field>
            <Field label="Store banner (wide image shown on your store profile)" source={sources.store_banner_url}>
              <div className="space-y-3">
                {settings.store_banner_url && (
                  <img src={settings.store_banner_url} alt="Store banner" className="w-full h-28 rounded-2xl object-cover border border-slate-100" />
                )}
                <div className="flex items-center gap-3">
                  <input value={settings.store_banner_url || ""} onChange={(e) => set("store_banner_url", e.target.value)} placeholder="https://… or upload →" className={`${inputCls} flex-1`} />
                  <label className="px-4 py-3 bg-primary-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:bg-primary-700 transition-all whitespace-nowrap">
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
            <SectionCard title="Card Payments — Stripe">
              {integrations && (
                <MethodStatus
                  enabled={integrations.stripe.enabled}
                  text={integrations.stripe.enabled
                    ? `Card checkout is LIVE — credentials from ${integrations.stripe.key_source === "store_settings" ? "these settings" : "the server environment"}. Buyers pay on Stripe's secure page (cards, Apple Pay, Google Pay).`
                    : integrations.stripe.configured && !integrations.stripe.toggle_on
                      ? "Credentials are saved but Stripe is switched OFF below — card checkout is disabled."
                      : integrations.stripe.toggle_on && !integrations.stripe.configured
                        ? "Stripe is switched on but no secret key is saved yet — card checkout stays disabled until a real secret key exists. The switch alone never fakes a live method."
                        : "Not configured — add your Stripe keys below to enable card checkout and card wallet top-ups."}
                />
              )}
              <ToggleRow
                label="Stripe enabled"
                onText="Card checkout is offered to buyers"
                offText="Card checkout is hidden from buyers"
                value={settings.stripe_enabled !== "false"}
                onChange={(on) => set("stripe_enabled", on ? "true" : "false")}
              />
              <Field label="Publishable key (safe to show — identifies your Stripe account)">
                <input value={settings.stripe_publishable_key || ""} onChange={(e) => set("stripe_publishable_key", e.target.value)} placeholder="pk_live_… or pk_test_…" className={inputCls} autoComplete="off" />
              </Field>
              <SecretField
                label="Secret key (stored server-side, never shown again)"
                input={stripeSecretInput}
                onInput={(v) => { setStripeSecretInput(v); if (v) setClearSecrets((c) => ({ ...c, stripe_secret_key: false })); }}
                savedSource={integrations?.stripe.key_source ?? null}
                placeholder="sk_live_… or sk_test_…"
                clearArmed={!!clearSecrets.stripe_secret_key}
                onClear={() => setClearSecrets((c) => ({ ...c, stripe_secret_key: true }))}
              />
              <SecretField
                label="Webhook signing secret (for payment confirmations)"
                input={stripeWebhookInput}
                onInput={(v) => { setStripeWebhookInput(v); if (v) setClearSecrets((c) => ({ ...c, stripe_webhook_secret: false })); }}
                savedSource={integrations?.stripe.webhook_secret_set ? (integrations?.stripe.webhook_source ?? null) : null}
                placeholder="whsec_…"
                clearArmed={!!clearSecrets.stripe_webhook_secret}
                onClear={() => setClearSecrets((c) => ({ ...c, stripe_webhook_secret: true }))}
              />
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Point your Stripe webhook at <span className="font-mono text-slate-500">/api/payments/stripe/webhook</span> (event: checkout.session.completed). Secret values are write-only: after saving, this page can only tell you whether one is stored — replace or remove it here any time. Environment variables (STRIPE_SECRET_KEY etc.) still work as a fallback when nothing is saved here.
              </p>
              <SaveBar saving={saving} saved={saved} onSave={handleSave} />
            </SectionCard>

            <SectionCard title="PayPal">
              <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 font-medium leading-relaxed">
                  PayPal checkout is not connected yet. Credentials you save here are stored securely on the server, ready for the integration — but PayPal does <strong>not</strong> appear at checkout until the checkout flow is connected, so buyers are never offered a method they cannot complete.
                </p>
              </div>
              {integrations && (
                <MethodStatus
                  enabled={integrations.paypal.credentials_ready}
                  text={integrations.paypal.credentials_ready
                    ? "Credentials saved and the method is switched on — checkout display still waits for the PayPal checkout integration."
                    : integrations.paypal.configured && !integrations.paypal.toggle_on
                      ? "Credentials are saved but PayPal is switched OFF below."
                      : "Not configured — add the client ID and secret from your PayPal developer dashboard."}
                />
              )}
              <ToggleRow
                label="PayPal enabled"
                onText="Ready to show once the checkout integration is connected"
                offText="PayPal stays off even after the integration lands"
                value={settings.paypal_enabled !== "false"}
                onChange={(on) => set("paypal_enabled", on ? "true" : "false")}
              />
              <Field label="Client ID">
                <input value={settings.paypal_client_id || ""} onChange={(e) => set("paypal_client_id", e.target.value)} placeholder="PayPal REST app client ID" className={inputCls} autoComplete="off" />
              </Field>
              <SecretField
                label="Client secret (stored server-side, never shown again)"
                input={paypalSecretInput}
                onInput={(v) => { setPaypalSecretInput(v); if (v) setClearSecrets((c) => ({ ...c, paypal_client_secret: false })); }}
                savedSource={integrations?.paypal.client_secret_set ? (integrations?.paypal.key_source ?? null) : null}
                placeholder="PayPal REST app secret"
                clearArmed={!!clearSecrets.paypal_client_secret}
                onClear={() => setClearSecrets((c) => ({ ...c, paypal_client_secret: true }))}
              />
              <SaveBar saving={saving} saved={saved} onSave={handleSave} />
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Integrations — status only">
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
              Status only — payment credentials themselves are managed under the Payments tab (secret values are write-only and never displayed anywhere). Other provider keys (email) stay in the server environment / store settings and are only reported here.
            </p>
            {integrations && (
              <div className="space-y-3">
                <StatusRow
                  label="Stripe (card payments)"
                  ok={integrations.stripe.enabled}
                  detail={integrations.stripe.enabled
                    ? `Live — credentials from ${integrations.stripe.key_source === "store_settings" ? "store settings" : "environment"}; publishable key ${integrations.stripe.publishable_key_set ? "set" : "missing"}, webhook secret ${integrations.stripe.webhook_secret_set ? "set" : "missing"}`
                    : integrations.stripe.configured
                      ? "Credentials exist but the method is switched off (Settings → Payments)"
                      : "Not configured — add Stripe keys under Settings → Payments (or STRIPE_SECRET_KEY in the environment)"}
                />
                <StatusRow
                  label="PayPal"
                  ok={integrations.paypal.credentials_ready}
                  detail={integrations.paypal.configured
                    ? "Credentials saved — checkout integration not connected yet, so PayPal is not offered to buyers"
                    : "Not configured — add the client ID and secret under Settings → Payments"}
                />
                {integrations.email && (
                  <StatusRow
                    label="Transactional email (Resend)"
                    ok={integrations.email.configured}
                    detail={integrations.email.configured
                      ? `Live — order confirmations and delivery emails are sent${integrations.email.from ? ` as ${integrations.email.from}` : ""}${integrations.email.key_source ? ` (key: ${integrations.email.key_source === "store_settings" ? "store settings" : "environment"})` : ""}`
                      : "Not configured — no Resend key in store settings or the RESEND_API_KEY environment variable; order emails stay queued in the outbox until one is added"}
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

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-primary-500 focus:bg-white transition-all";

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-8 space-y-6">
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
        className="px-8 py-3.5 bg-primary-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
        {saved ? "Saved" : "Save Settings"}
      </button>
    </div>
  );
}

function MethodStatus({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <div className={`rounded-2xl border px-5 py-3.5 text-[12px] font-bold ${enabled ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
      {text}
    </div>
  );
}

function ToggleRow({ label, onText, offText, value, onChange }: {
  label: string; onText: string; offText: string; value: boolean; onChange: (on: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
      <div>
        <p className="text-sm font-black text-slate-900">{label} — {value ? "ON" : "OFF"}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{value ? onText : offText}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-14 h-8 rounded-full transition-all shrink-0 ${value ? "bg-emerald-500" : "bg-slate-300"}`}
        aria-label={label}
      >
        <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${value ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

function SecretField({ label, input, onInput, savedSource, placeholder, clearArmed, onClear }: {
  label: string;
  input: string;
  onInput: (v: string) => void;
  savedSource: string | null; // "store_settings" | "environment" | null (nothing saved)
  placeholder: string;
  clearArmed: boolean;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {label}
        {savedSource && !clearArmed && (
          <span className="px-2 py-0.5 rounded-md text-[8px] bg-emerald-50 text-emerald-600">
            {savedSource === "store_settings" ? "saved" : "from environment"}
          </span>
        )}
        {clearArmed && <span className="px-2 py-0.5 rounded-md text-[8px] bg-red-50 text-red-500">will be removed on save</span>}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="password"
          value={input}
          onChange={(e) => onInput(e.target.value)}
          placeholder={clearArmed ? "Will be removed when you save" : savedSource ? "•••••••• saved — type to replace" : placeholder}
          className={`${inputCls} flex-1`}
          autoComplete="new-password"
        />
        {savedSource === "store_settings" && !clearArmed && (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition-all whitespace-nowrap"
          >
            Remove
          </button>
        )}
      </div>
      <p className="text-[11px] text-slate-400 font-medium">Leave empty to keep the saved value — secrets are never shown on this page.</p>
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
