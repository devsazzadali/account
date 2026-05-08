import React from "react";

// ── Product Card Skeleton ──────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="ios-card p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
          <div className="h-4 bg-slate-100 rounded-xl w-full" />
          <div className="h-4 bg-slate-100 rounded-xl w-3/4" />
          <div className="h-10 bg-slate-100 rounded-2xl w-full mt-2" />
        </div>
        <div className="w-[90px] shrink-0 space-y-3">
          <div className="w-[90px] h-[90px] bg-slate-100 rounded-xl" />
          <div className="h-6 bg-slate-100 rounded-lg w-full" />
        </div>
      </div>
      <div className="h-11 bg-slate-100 rounded-xl mt-4" />
    </div>
  );
}

// ── Product Details Skeleton ───────────────────────────────────
export function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 pt-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-video bg-slate-100 rounded-[2.5rem]" />
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 space-y-4 h-64">
            <div className="flex gap-8">
              {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-100 rounded w-20" />)}
            </div>
            <div className="space-y-3 mt-6">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-3/5" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 space-y-6">
            <div className="h-8 bg-slate-100 rounded-xl w-4/5" />
            <div className="h-5 bg-slate-100 rounded w-2/5" />
            <div className="h-12 bg-slate-100 rounded-2xl w-full mt-4" />
            <div className="h-12 bg-slate-100 rounded-2xl w-full" />
            <div className="h-14 bg-slate-100 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Card Skeleton ────────────────────────────────────────
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-slate-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-8 bg-slate-100 rounded-full w-24" />
      </div>
    </div>
  );
}

// ── Admin Table Skeleton ───────────────────────────────────────
export function AdminRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-12 shrink-0" />
    </div>
  );
}

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

// ── Inline Spinner ─────────────────────────────────────────────
export function InlineSpinner({ size = 16 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-current border-t-transparent rounded-full animate-spin opacity-70"
    />
  );
}
