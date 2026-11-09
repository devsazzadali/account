"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/src/components/Header";
import { Footer } from "@/src/components/Footer";
import { AnnouncementBar } from "@/src/components/AnnouncementBar";
import { LiveSupportWidget } from "@/src/components/LiveSupportWidget";
import { SearchProvider, useSearch } from "@/src/components/SearchContext";
import type { StorefrontSettings } from "@/src/lib/store-types";
import Link from "next/link";
import { Home, Search, ShoppingBag, User as UserIcon } from "lucide-react";

function LayoutContent({
  children,
  cms,
}: {
  children: React.ReactNode;
  cms: StorefrontSettings;
}) {
  const { setSearchQuery } = useSearch();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
      <AnnouncementBar announcement={cms.announcement} />
      <Header onSearch={setSearchQuery} brand={cms.brand} />
      <main className="flex-1">
        {children}
      </main>
      <Footer brand={cms.brand} />
      <MobileTabBar />
      <LiveSupportWidget storeName={cms.brand.name} />
    </div>
  );
}

export function StoreChrome({
  children,
  cms,
}: {
  children: React.ReactNode;
  cms: StorefrontSettings;
}) {
  return (
    <SearchProvider>
      <LayoutContent cms={cms}>{children}</LayoutContent>
    </SearchProvider>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  // The dashboard's Orders tab lives at /dashboard?tab=orders — the
  // bare pathname can't tell it apart from the dashboard home, so read
  // the query once per navigation and derive ONE active tab for the
  // whole bar (previously Store and Explore could light up together,
  // and Orders never lit at all).
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);
  const onOrders = pathname === "/dashboard" && search.includes("tab=orders");
  const active: "store" | "orders" | "account" | null =
    pathname === "/" ? "store" : onOrders ? "orders" : pathname === "/dashboard" ? "account" : null;

  return (
    <div
      onClick={() => window.setTimeout(() => setSearch(window.location.search), 60)}
      className="md:hidden fixed bottom-4 left-4 right-4 ios-glass border border-white/20 ios-rounded px-3 py-2 flex justify-between items-center z-[100] pb-safe-area shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
    >
        <TabItem href="/" icon={<Home size={22} />} label="Store" isActive={active === "store"} />
        {/* Explore is an ACTION, not a place: it opens the same search
            modal as the header icon (the Header listens for this event).
            It used to link to "/" like Store, so on the home page both
            tabs lit up green at once. */}
        <TabAction
          onClick={() => window.dispatchEvent(new CustomEvent("aso:open-search"))}
          icon={<Search size={22} />}
          label="Explore"
        />
        <TabItem href="/dashboard?tab=orders" icon={<ShoppingBag size={22} />} label="Orders" isActive={active === "orders"} />
        <TabItem href="/dashboard" icon={<UserIcon size={22} />} label="Account" isActive={active === "account"} />
    </div>
  );
}

const tabBase =
  "flex flex-col items-center justify-center gap-1 min-w-[60px] min-h-[48px] px-2.5 rounded-2xl transition-all duration-300";
const tabActive = "text-[#1dbf73] bg-[#1dbf73]/10";
const tabIdle = "text-slate-400 active:bg-slate-900/5";

function TabItem({ href, icon, label, isActive }: { href: string, icon: React.ReactNode, label: string, isActive: boolean }) {
    return (
        <Link href={href} className={`${tabBase} ${isActive ? tabActive : tabIdle}`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}

function TabAction({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button type="button" onClick={onClick} aria-label="Explore — open search" className={`${tabBase} ${tabIdle}`}>
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
        </button>
    );
}
