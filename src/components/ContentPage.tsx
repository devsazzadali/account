// AccountStoreOne — shared shell for the store's content/policy pages.
// Server component (no client JS): brand colors, one readable column,
// sections rendered from data so every page stays consistent.

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export interface ContentSection {
  heading: string;
  body: string[];
}

export function ContentPage({
  title,
  intro,
  sections,
  updated,
}: {
  title: string;
  intro: string;
  sections: ContentSection[];
  updated?: string;
}) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <div className="bg-[#0C2254] text-white">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/50 mb-4">
            <ShieldCheck size={13} className="text-[#F4751F]" /> Account Store One
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight">{title}</h1>
          <p className="text-white/70 text-sm leading-relaxed mt-4 max-w-2xl">{intro}</p>
          {updated && <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-5">Last updated: {updated}</p>}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-3 flex items-center gap-3">
              <span className="w-1.5 h-5 rounded-full bg-[#F4751F]" /> {s.heading}
            </h2>
            {s.body.map((para, i) => (
              <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3">{para}</p>
            ))}
          </section>
        ))}
        <div className="border-t border-slate-200 pt-8 flex flex-wrap gap-x-8 gap-y-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <Link href="/about" className="hover:text-[#0C2254] transition-colors">About</Link>
          <Link href="/faq" className="hover:text-[#0C2254] transition-colors">FAQ</Link>
          <Link href="/terms" className="hover:text-[#0C2254] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#0C2254] transition-colors">Privacy</Link>
          <Link href="/buyer-protection" className="hover:text-[#0C2254] transition-colors">Buyer Protection</Link>
        </div>
      </div>
    </div>
  );
}
