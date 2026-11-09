"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import type { StorefrontSettings } from "@/src/lib/store-types";
import { splitStoreName } from "./BrandMark";

/** Storefront hero (Storefront CMS). All copy/imagery comes from the
 *  admin-resolved hero settings; with nothing customized it renders the
 *  original designed hero exactly. A dedicated hero image wins over the
 *  store banner (which remains the fallback, as before). */
export function Banner({
  hero,
  compact = false,
}: {
  hero: StorefrontSettings["hero"];
  /** Compact band for browse views (a category is selected or a search
   *  is active): the full marketing hero leads the store home, but while
   *  browsing it would push the products a full fold down the phone
   *  screen — so there it condenses to a slim brand band and the offers
   *  lead instead. Same CMS copy, condensed composition. */
  compact?: boolean;
}) {
  const headline = hero.headline ? splitStoreName(hero.headline) : null;
  const hasCtas = !compact && !!(hero.primaryCta || hero.secondaryCta);

  if (compact) {
    return (
      <div className="relative overflow-hidden w-full bg-slate-50 border-b border-slate-200">
        <div className="absolute top-[-60%] left-[-10%] w-[50%] h-[220%] bg-primary-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[220%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10 py-6 md:py-8 flex items-center justify-center">
          <h1 className="text-[1.7rem] leading-none sm:text-4xl font-display font-bold tracking-tight text-slate-900 italic text-center">
            {headline ? (
              <>
                {headline.head}
                {headline.head ? " " : ""}
                <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">{headline.tail}</span>
              </>
            ) : (
              <>Account<span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Store</span></>
            )}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden w-full bg-slate-50 border-b border-slate-200 min-h-[240px] md:min-h-[320px]"
    >
      {hero.imageUrl && (
        <img src={hero.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      )}
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[150%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-multiply"></div>

      <div
        className={`container mx-auto px-4 max-w-7xl relative z-10 flex items-center justify-center ${
          hasCtas ? "py-10 md:py-12" : "h-full pb-10 md:pb-28"
        }`}
      >

        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-center text-center space-y-5">

          {/* Badge */}
          {hero.badgeText && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-primary-200/80 text-primary-700 text-[13px] font-semibold tracking-wide shadow-[0_4px_16px_-6px_rgba(23,153,92,0.25)]">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>{hero.badgeText}</span>
            </div>
          )}

          {/* Heading — the wordmark stands alone: the old ghost-crown
              watermark sat half behind the badge and half across the
              headline glyphs, reading as a smudge over the brand name
              on phones. The badge + logo mark already carry the crown
              motif, so the hero type now gets clean air. */}
          <h1 className="text-[2.6rem] leading-[1.04] sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-slate-900 italic">
            {headline ? (
              <>
                {headline.head}
                {headline.head ? " " : ""}
                <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">{headline.tail}</span>
              </>
            ) : (
              <>Account<span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Store</span></>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-slate-500 text-base sm:text-lg md:text-xl font-sans font-light max-w-xl md:max-w-2xl mx-auto leading-relaxed px-1">
            {hero.subheadline}
          </p>

          {/* CTAs — only rendered when the admin configures them */}
          {(hero.primaryCta || hero.secondaryCta) && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {hero.primaryCta && (
                <a
                  href={hero.primaryCta.link}
                  className="inline-flex items-center gap-2 px-7 py-3 min-h-[44px] rounded-xl bg-primary-600 text-white text-[12px] font-black uppercase tracking-widest shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
                >
                  {hero.primaryCta.text}
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              {hero.secondaryCta && (
                <a
                  href={hero.secondaryCta.link}
                  className="inline-flex items-center gap-2 px-7 py-3 min-h-[44px] rounded-xl bg-white/85 border border-slate-300 text-slate-800 text-[12px] font-black uppercase tracking-widest hover:border-primary-400 hover:text-primary-700 transition-all active:scale-95"
                >
                  {hero.secondaryCta.text}
                </a>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
