"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STORE_NAME, type BrandInfo } from "@/src/components/BrandMark";
import { fetchStoreStats } from "./store-stats-client";

/** Store identity for client surfaces outside the server-rendered store
 *  chrome (auth pages). Starts from the built-in identity so the first
 *  paint matches the original design, then swaps in the admin-configured
 *  name/logo from the public stats endpoint when they are set. */
export function useStoreBrand(): BrandInfo {
  const [brand, setBrand] = useState<BrandInfo>({ name: DEFAULT_STORE_NAME, logoUrl: null });
  useEffect(() => {
    fetchStoreStats()
      .then((j) => {
        const storeName = typeof j?.store_name === "string" ? j.store_name : null;
        const logoUrl = typeof j?.store_logo_url === "string" ? j.store_logo_url : null;
        if (storeName || logoUrl) {
          setBrand({ name: storeName || DEFAULT_STORE_NAME, logoUrl });
        }
      })
      .catch(() => {});
  }, []);
  return brand;
}
