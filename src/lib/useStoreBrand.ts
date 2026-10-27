"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STORE_NAME, type BrandInfo } from "@/src/components/BrandMark";

/** Store identity for client surfaces outside the server-rendered store
 *  chrome (auth pages). Starts from the built-in identity so the first
 *  paint matches the original design, then swaps in the admin-configured
 *  name/logo from the public stats endpoint when they are set. */
export function useStoreBrand(): BrandInfo {
  const [brand, setBrand] = useState<BrandInfo>({ name: DEFAULT_STORE_NAME, logoUrl: null });
  useEffect(() => {
    fetch("/api/store/stats")
      .then((r) => r.json())
      .then((j) => {
        if (j?.store_name || j?.store_logo_url) {
          setBrand({
            name: j.store_name || DEFAULT_STORE_NAME,
            logoUrl: j.store_logo_url || null,
          });
        }
      })
      .catch(() => {});
  }, []);
  return brand;
}
