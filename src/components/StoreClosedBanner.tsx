"use client";

// AccountStoreOne — "store temporarily closed" notice (Z2U alignment P0,
// Hide Shop). Reads the public store stats once; renders nothing while
// the store is open. The server ALSO blocks new orders while closed —
// this banner is only the visible half.

import React, { useEffect, useState } from "react";
import { Store } from "lucide-react";

export function StoreClosedBanner() {
  const [closed, setClosed] = useState(false);
  const [name, setName] = useState("The store");

  useEffect(() => {
    fetch("/api/store/stats")
      .then((r) => r.json())
      .then((j) => {
        setClosed(j?.store_open === false);
        if (j?.store_name) setName(j.store_name);
      })
      .catch(() => {});
  }, []);

  if (!closed) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-10 mt-6">
      <div className="bg-[#0C2254] text-white rounded-[2rem] px-8 py-6 flex items-center gap-5 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <Store size={22} />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight">{name} is temporarily closed</h3>
          <p className="text-sm text-white/70 font-medium">
            We're not accepting new orders right now. Existing orders, your vault and support messages are unaffected — please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
