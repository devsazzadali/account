import type { MetadataRoute } from "next";
import { getStorefrontSettings } from "@/src/lib/settings-store";

// Web app manifest (PWA, ধাপ ৫ঙ). Served by Next at /manifest.webmanifest.
//
// - name comes from the store settings (store_name via
//   getStorefrontSettings — the same source the storefront shell uses),
//   so an admin rename in Settings flows into the installed app.
//   force-dynamic keeps it fresh per request, like the storefront layout.
// - theme_color #117345 = primary-700, the darker header green of the
//   re-themed surfaces (primary-500 #1dbf73 is the bright accent; the
//   browser chrome / splash title bar reads better on the deep green).
// - background_color #f8fafc = the storefront light surface.
// - Icons reuse the existing app-icon artwork (src/app/icon.tsx design:
//   green primary-700 tile, white "A") rendered at install sizes.
export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cms = await getStorefrontSettings();
  const name = cms.brand.name || "Account Store One";
  const shortName = name.length <= 12 ? name : name.split(" ").slice(0, 2).join(" ");

  return {
    name,
    short_name: shortName,
    description:
      cms.brand.description ||
      "Buy verified premium accounts and subscriptions with escrow buyer protection.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#117345",
    background_color: "#f8fafc",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
