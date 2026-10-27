"use client";

// AccountStoreOne — footer. Every link points at a page that exists
// (the previous footer linked a dozen labels to "#").

import Link from "next/link";
import { ArrowUp, Zap, ShieldCheck } from "lucide-react";
import { BrandWordmark, DEFAULT_STORE_NAME } from "./BrandMark";

export function Footer({
  brand,
}: {
  brand?: { name: string; logoUrl: string | null; footerTagline: string };
}) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-white text-slate-900 pt-20 pb-10 relative overflow-hidden border-t border-slate-200">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-primary-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 pb-12 border-b border-slate-100">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              {brand?.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-10 h-10 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#0C2254] flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white fill-current" />
                </div>
              )}
              <span className="text-2xl font-display font-bold tracking-tight text-slate-900">
                <BrandWordmark
                  brand={brand}
                  accentClassName="text-[#F4751F]"
                  builtin={<>Account<span className="text-[#F4751F]">Store</span></>}
                />
              </span>
            </div>
            <p className="text-slate-500 text-sm max-w-md leading-relaxed">
              {brand?.footerTagline ??
                "Premium digital accounts and subscriptions from a single verified seller — every order protected by escrow until delivery is confirmed."}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 text-xs text-slate-600 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span className="font-medium">Escrow Buyer Protection on every order</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
              Store
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link href="/about" className="hover:text-primary-600 transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-primary-600 transition-colors">Browse Products</Link></li>
              <li><Link href="/signup" className="hover:text-primary-600 transition-colors">Create Account</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary-600 transition-colors">My Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              Support
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link href="/faq" className="hover:text-primary-600 transition-colors">FAQ</Link></li>
              <li><Link href="/buyer-protection" className="hover:text-primary-600 transition-colors">Buyer Protection</Link></li>
              <li><Link href="/forgot-password" className="hover:text-primary-600 transition-colors">Reset Password</Link></li>
              <li><Link href="/login" className="hover:text-primary-600 transition-colors">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display font-bold mb-6 text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
              Legal
            </h3>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><Link href="/terms" className="hover:text-primary-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="p-3 bg-primary-50 rounded-full border border-primary-100 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary-600" />
            </div>
            <h4 className="font-display font-bold text-slate-900 mb-2">Escrow Protected</h4>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-relaxed">Payment held until<br />delivery is confirmed</p>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-8 flex-wrap justify-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <Link href="/buyer-protection" className="hover:text-primary-600 transition-colors">Buyer Protection</Link>
            <Link href="/faq" className="hover:text-primary-600 transition-colors">How It Works</Link>
            <Link href="/terms" className="hover:text-primary-600 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary-600 transition-colors">Privacy</Link>
          </div>
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            © 2026 {brand?.name ?? DEFAULT_STORE_NAME}. All rights reserved.
          </div>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className="fixed bottom-10 right-10 w-14 h-14 bg-[#0C2254] text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 z-50 flex items-center justify-center group"
      >
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
      </button>
    </footer>
  );
}
