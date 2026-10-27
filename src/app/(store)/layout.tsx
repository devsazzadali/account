import React from "react";
import { StoreChrome } from "@/src/components/StoreChrome";
import { getStorefrontSettings } from "@/src/lib/settings-store";

/** Storefront shell. The CMS settings (brand identity, announcement bar)
 *  are resolved server-side on every request, so admin edits appear on
 *  the storefront immediately — no redeploy. */
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const cms = await getStorefrontSettings();
  return <StoreChrome cms={cms}>{children}</StoreChrome>;
}
