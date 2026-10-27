"use client";

// AccountStoreOne — Storefront CMS (admin).
// Everything a visitor sees on the storefront is controlled here: the
// hero, the announcement bar, homepage section visibility/order/titles,
// and the store identity (name, logo, banner, descriptions). Values are
// stored in store_settings via /api/admin/settings and read at request
// time, so saving takes effect immediately — no redeploy. Text fields
// left empty fall back to the built-in design copy shown as placeholder.

import React, { useEffect, useState } from "react";
import {
  Save, Check, Loader2, Upload, ChevronUp, ChevronDown, ImageOff,
} from "lucide-react";
import { toast } from "react-hot-toast";

type Settings = Record<string, string>;

const DESIGN = {
  hero_badge_text: "Discover Premium Excellence",
  hero_headline: "AccountStore (built-in stylized headline)",
  hero_subheadline:
    "Elevate your digital presence with our curated selection of verified, high-tier accounts. Experience pure exclusivity.",
  section_featured_title: "Featured List",
  section_trending_title: "Trending Products",
  section_categories_title: "Browse Categories",
  section_reviews_title: "Customer Reviews",
  section_about_title: "About the store",
  footer_tagline:
    "Premium digital accounts and subscriptions from a single verified seller — every order protected by escrow until delivery is confirmed.",
} as const;

/** Text keys where "" means "use the built-in design copy". */
const FALLBACK_TEXT_KEYS = [
  "hero_badge_text", "hero_headline", "hero_subheadline",
  "section_featured_title", "section_trending_title",
  "section_categories_title", "section_reviews_title", "section_about_title",
  "footer_tagline",
] as const;

const SECTION_META: { id: string; label: string; titleKey: string; enabledKey: string }[] = [
  { id: "featured", label: "Featured List", titleKey: "section_featured_title", enabledKey: "section_featured_enabled" },
  { id: "trending", label: "Trending Products", titleKey: "section_trending_title", enabledKey: "section_trending_enabled" },
  { id: "categories", label: "Categories & Products", titleKey: "section_categories_title", enabledKey: "section_categories_enabled" },
  { id: "reviews", label: "Customer Reviews", titleKey: "section_reviews_title", enabledKey: "section_reviews_enabled" },
];
const DEFAULT_ORDER = ["featured", "trending", "categories", "reviews"];

export function AdminStorefront() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sources, setSources] = useState<Record<string, string>>({});
  /** Admin-typed copy for fallback text fields ("" = design default). */
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/admin/settings", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load settings");
      applyLoaded(json.settings || {}, json.sources || {});
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function applyLoaded(s: Settings, src: Record<string, string>) {
    setSettings(s);
    setSources(src);
    const c: Record<string, string> = {};
    for (const k of FALLBACK_TEXT_KEYS) c[k] = src[k] === "database" ? s[k] ?? "" : "";
    setCustom(c);
    const raw = (s.home_section_order || "").split(",").map((x) => x.trim()).filter((x) => DEFAULT_ORDER.includes(x));
    setOrder([...new Set([...raw, ...DEFAULT_ORDER])]);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, value: string) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }
  function setCustomKey(key: string, value: string) {
    setCustom((c) => ({ ...c, [key]: value }));
  }
  const boolOf = (key: string, dflt: boolean) =>
    settings?.[key] === undefined ? dflt : settings[key] !== "false";

  async function uploadImage(key: string, file: File | undefined) {
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

  function move(id: string, dir: -1 | 1) {
    setOrder((o) => {
      const i = o.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= o.length) return o;
      const next = [...o];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {
        // Store identity (shared with Settings → General)
        store_name: settings.store_name ?? "",
        store_description: settings.store_description ?? "",
        store_logo_url: settings.store_logo_url ?? "",
        store_banner_url: settings.store_banner_url ?? "",
        // Hero
        hero_enabled: settings.hero_enabled ?? "true",
        hero_image_url: settings.hero_image_url ?? "",
        hero_cta_primary_text: settings.hero_cta_primary_text ?? "",
        hero_cta_primary_link: settings.hero_cta_primary_link ?? "",
        hero_cta_secondary_text: settings.hero_cta_secondary_text ?? "",
        hero_cta_secondary_link: settings.hero_cta_secondary_link ?? "",
        // Announcement bar
        announcement_enabled: settings.announcement_enabled ?? "false",
        announcement_text: settings.announcement_text ?? "",
        announcement_link: settings.announcement_link ?? "",
        // Sections
        home_section_order: order.join(","),
        section_about_enabled: settings.section_about_enabled ?? "true",
      };
      for (const k of FALLBACK_TEXT_KEYS) body[k] = custom[k] ?? "";
      for (const m of SECTION_META) body[m.enabledKey] = settings[m.enabledKey] ?? "true";

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      applyLoaded(json.settings || {}, json.sources || {});
      setSaved(true);
      toast.success("Storefront saved — live on the site now");
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-16 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
        Control what visitors see — changes go live on the storefront as soon as you save.
        Text fields left empty use the built-in design copy shown as the placeholder.
      </p>

      {/* ── Store identity ─────────────────────────────────────────── */}
      <SectionCard title="Store Identity">
        <Field label="Store name" source={sources.store_name}>
          <input value={settings.store_name ?? ""} onChange={(e) => set("store_name", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Store description — homepage store card" source={sources.store_description}>
          <textarea value={settings.store_description ?? ""} onChange={(e) => set("store_description", e.target.value)} rows={3} className={`${inputCls} resize-none`} />
        </Field>
        <Field label="Footer tagline" source={sources.footer_tagline}>
          <textarea
            value={custom.footer_tagline ?? ""}
            onChange={(e) => setCustomKey("footer_tagline", e.target.value)}
            rows={2}
            placeholder={DESIGN.footer_tagline}
            className={`${inputCls} resize-none`}
          />
        </Field>
        <ImageField
          label="Store logo / profile picture"
          source={sources.store_logo_url}
          value={settings.store_logo_url ?? ""}
          onChange={(v) => set("store_logo_url", v)}
          onUpload={(f) => uploadImage("store_logo_url", f)}
          previewClass="w-16 h-16 rounded-2xl"
          hint="Shown in the header, the homepage store card, the footer and the sign-in pages."
        />
        <ImageField
          label="Store banner"
          source={sources.store_banner_url}
          value={settings.store_banner_url ?? ""}
          onChange={(v) => set("store_banner_url", v)}
          onUpload={(f) => uploadImage("store_banner_url", f)}
          previewClass="w-full h-28 rounded-2xl"
          hint="Used as the hero background unless a dedicated hero image is set below."
        />
      </SectionCard>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <SectionCard title="Hero Section">
        <ToggleRow
          label="Show hero section"
          checked={boolOf("hero_enabled", true)}
          onChange={(v) => set("hero_enabled", v ? "true" : "false")}
        />
        <ImageField
          label="Hero banner image"
          source={sources.hero_image_url}
          value={settings.hero_image_url ?? ""}
          onChange={(v) => set("hero_image_url", v)}
          onUpload={(f) => uploadImage("hero_image_url", f)}
          previewClass="w-full h-28 rounded-2xl"
          hint="Optional — overrides the store banner as the hero background."
        />
        <Field label="Badge text" source={sources.hero_badge_text}>
          <input value={custom.hero_badge_text ?? ""} onChange={(e) => setCustomKey("hero_badge_text", e.target.value)} placeholder={DESIGN.hero_badge_text} className={inputCls} />
        </Field>
        <Field label="Headline" source={sources.hero_headline}>
          <input value={custom.hero_headline ?? ""} onChange={(e) => setCustomKey("hero_headline", e.target.value)} placeholder={DESIGN.hero_headline} className={inputCls} />
          <p className="text-[11px] text-slate-400 font-medium">The last word is shown in the gradient accent color.</p>
        </Field>
        <Field label="Sub-headline" source={sources.hero_subheadline}>
          <textarea value={custom.hero_subheadline ?? ""} onChange={(e) => setCustomKey("hero_subheadline", e.target.value)} rows={2} placeholder={DESIGN.hero_subheadline} className={`${inputCls} resize-none`} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Primary button text" source={sources.hero_cta_primary_text}>
            <input value={settings.hero_cta_primary_text ?? ""} onChange={(e) => set("hero_cta_primary_text", e.target.value)} placeholder="e.g. Shop Now" className={inputCls} />
          </Field>
          <Field label="Primary button link" source={sources.hero_cta_primary_link}>
            <input value={settings.hero_cta_primary_link ?? ""} onChange={(e) => set("hero_cta_primary_link", e.target.value)} placeholder="/ or https://…" className={inputCls} />
          </Field>
          <Field label="Secondary button text (optional)" source={sources.hero_cta_secondary_text}>
            <input value={settings.hero_cta_secondary_text ?? ""} onChange={(e) => set("hero_cta_secondary_text", e.target.value)} placeholder="e.g. How it works" className={inputCls} />
          </Field>
          <Field label="Secondary button link" source={sources.hero_cta_secondary_link}>
            <input value={settings.hero_cta_secondary_link ?? ""} onChange={(e) => set("hero_cta_secondary_link", e.target.value)} placeholder="/buyer-protection" className={inputCls} />
          </Field>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">Buttons appear only when their text is filled in — the default hero has none.</p>
      </SectionCard>

      {/* ── Announcement bar ───────────────────────────────────────── */}
      <SectionCard title="Announcement Bar">
        <ToggleRow
          label="Show announcement bar (top strip)"
          checked={boolOf("announcement_enabled", false)}
          onChange={(v) => set("announcement_enabled", v ? "true" : "false")}
        />
        <Field label="Announcement text" source={sources.announcement_text}>
          <input value={settings.announcement_text ?? ""} onChange={(e) => set("announcement_text", e.target.value)} placeholder="e.g. Weekend sale — 20% off all streaming plans" className={inputCls} />
        </Field>
        <Field label="Announcement link (optional)" source={sources.announcement_link}>
          <input value={settings.announcement_link ?? ""} onChange={(e) => set("announcement_link", e.target.value)} placeholder="/ or https://…" className={inputCls} />
        </Field>
      </SectionCard>

      {/* ── Homepage sections ──────────────────────────────────────── */}
      <SectionCard title="Homepage Sections">
        <p className="text-[11px] text-slate-400 font-medium -mt-2">
          Toggle sections on or off, rename their headings, and use the arrows to change the order they appear on the homepage.
        </p>
        <div className="space-y-3">
          {order.map((id, idx) => {
            const meta = SECTION_META.find((m) => m.id === id)!;
            return (
              <div key={id} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="flex flex-col gap-1">
                  <button onClick={() => move(id, -1)} disabled={idx === 0} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all" aria-label={`Move ${meta.label} up`}>
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => move(id, 1)} disabled={idx === order.length - 1} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all" aria-label={`Move ${meta.label} down`}>
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-slate-900">{meta.label}</p>
                  <input
                    value={custom[meta.titleKey] ?? ""}
                    onChange={(e) => setCustomKey(meta.titleKey, e.target.value)}
                    placeholder={DESIGN[meta.titleKey as keyof typeof DESIGN]}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-slate-900 transition-all mt-1.5"
                  />
                </div>
                <Toggle
                  checked={boolOf(meta.enabledKey, true)}
                  onChange={(v) => set(meta.enabledKey, v ? "true" : "false")}
                />
              </div>
            );
          })}

          {/* About block lives in the sidebar store card: toggle + title only */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900">About the Store block</p>
              <p className="text-[11px] text-slate-400 font-medium">Shown in the store card next to the sections — position is fixed.</p>
              <input
                value={custom.section_about_title ?? ""}
                onChange={(e) => setCustomKey("section_about_title", e.target.value)}
                placeholder={DESIGN.section_about_title}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-900 focus:outline-none focus:border-slate-900 transition-all mt-1.5"
              />
            </div>
            <Toggle
              checked={boolOf("section_about_enabled", true)}
              onChange={(v) => set("section_about_enabled", v ? "true" : "false")}
            />
          </div>
        </div>
      </SectionCard>

      <SaveBar saving={saving} saved={saved} onSave={handleSave} />
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0 ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
    >
      <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
      <span className="text-[13px] font-black text-slate-900">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ImageField({
  label, source, value, onChange, onUpload, previewClass, hint,
}: {
  label: string;
  source?: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (f: File | undefined) => void;
  previewClass: string;
  hint?: string;
}) {
  return (
    <Field label={label} source={source}>
      <div className="flex gap-3">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload →" className={`${inputCls} flex-1`} />
        <label className="px-5 bg-slate-900 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all shrink-0">
          <Upload size={16} />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
        </label>
      </div>
      {hint && <p className="text-[11px] text-slate-400 font-medium">{hint}</p>}
      {value ? (
        <img src={value} alt="" className={`${previewClass} object-cover border border-slate-200 bg-slate-50`} />
      ) : (
        <div className={`${previewClass} border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300`}>
          <ImageOff size={18} />
        </div>
      )}
    </Field>
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
        {saved ? "Saved" : "Save Storefront"}
      </button>
    </div>
  );
}
