"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/src/components/Header";
import { Footer } from "@/src/components/Footer";
import { LiveSupportWidget } from "@/src/components/LiveSupportWidget";
import { SearchProvider, useSearch } from "@/src/components/SearchContext";
import Link from "next/link";
import { Home, Search, ShoppingBag, User as UserIcon } from "lucide-react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { setSearchQuery } = useSearch();
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 md:pb-0">
      <Header onSearch={setSearchQuery} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
      <LiveSupportWidget />
    </div>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <LayoutContent>{children}</LayoutContent>
    </SearchProvider>
  );
}

function MobileTabBar() {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 ios-glass border border-white/20 ios-rounded px-8 py-3 flex justify-between items-center z-[100] pb-safe-area shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <TabItem href="/" icon={<Home size={22} />} label="Store" />
        <TabItem href="/" icon={<Search size={22} />} label="Explore" />
        <TabItem href="/dashboard" icon={<ShoppingBag size={22} />} label="Orders" />
        <TabItem href="/dashboard" icon={<UserIcon size={22} />} label="Account" />
    </div>
  );
}

function TabItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    
    return (
        <Link href={href} className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#1dbf73] scale-110' : 'text-slate-400'}`}>
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
        </Link>
    );
}
