import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

// Offline fallback (PWA, ধাপ ৫ঙ). The service worker serves this page
// when a navigation fails because the network is gone. It is the ONLY
// page the worker may substitute — account, order and wallet pages are
// never cached, so offline they land here instead of showing stale data.
// Keep this page free of any live data: static copy only.
export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-700/25">
          <WifiOff size={30} />
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-900">You&rsquo;re offline</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Your connection dropped, so this page can&rsquo;t load. Reconnect to
          see your orders and wallet — we never show saved copies of your
          account.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-primary-600/20"
        >
          Try again
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          Account Store One
        </p>
      </div>
    </main>
  );
}
