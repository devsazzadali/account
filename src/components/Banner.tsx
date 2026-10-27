"use client";

import React from "react";
import { Sparkles, Crown, ArrowRight } from "lucide-react";
import type { StorefrontSettings } from "@/src/lib/store-types";
import { splitStoreName } from "./BrandMark";

/** Storefront hero (Storefront CMS). All copy/imagery comes from the
 *  admin-resolved hero settings; with nothing customized it renders the
 *  original designed hero exactly. A dedicated hero image wins over the
 *  store banner (which remains the fallback, as before). */
export function Banner({ hero }: { hero: StorefrontSettings["hero"] }) {
  const headline = hero.headline ? splitStoreName(hero.headline) : null;
  const hasCtas = !!(hero.primaryCta || hero.secondaryCta);

  return (
    <div
      className={`relative overflow-hidden w-full bg-slate-50 border-b border-slate-200 ${
        hasCtas ? "min-h-[240px] md:min-h-[320px]" : "h-[240px] md:h-[320px]"
      }`}
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
          hasCtas ? "py-10 md:py-12" : "h-full"
        }`}
      >

        {/* Main Content Area */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">

          {/* Badge */}
          {hero.badgeText && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-primary-200 text-primary-700 text-sm font-medium tracking-wide animate-float shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>{hero.badgeText}</span>
            </div>
          )}

          {/* Heading */}
          <div className="relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-primary-400 opacity-30 z-0">
               <Crown className="w-12 h-12" strokeWidth={1} />
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight text-slate-900 mb-2 relative z-10 italic">
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

          {/* Subheading */}
          <p className="text-slate-500 text-lg md:text-xl font-sans font-light max-w-2xl mx-auto leading-relaxed">
            {hero.subheadline}
          </p>

          {/* CTAs — only rendered when the admin configures them */}
          {(hero.primaryCta || hero.secondaryCta) && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {hero.primaryCta && (
                <a
                  href={hero.primaryCta.link}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#0C2254] text-white text-[12px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95"
                >
                  {hero.primaryCta.text}
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              {hero.secondaryCta && (
                <a
                  href={hero.secondaryCta.link}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white/85 border border-slate-300 text-slate-800 text-[12px] font-black uppercase tracking-widest hover:border-primary-400 hover:text-primary-700 transition-all active:scale-95"
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
