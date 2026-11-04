"use client";

import React from "react";

// ── Page-level Loader ──────────────────────────────────────────
export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-primary-600 rounded-full opacity-30 animate-pulse" />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</p>
    </div>
  );
}
