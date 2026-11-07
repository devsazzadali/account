"use client";

// AccountStoreOne — shared client fetch for /api/store/stats.
// Many components on the same page (Sidebar, StoreClosedBanner,
// SellerTrustCard, admin screens) each need the store aggregates;
// fetching once per page view and sharing the in-flight promise — plus
// a short reuse window for remounts and tab switches — removes the
// duplicate requests without changing any displayed value. The payload
// is refreshed at least every 30 s, and a failed fetch is never cached.

let cached: Promise<Record<string, unknown> | null> | null = null;
let fetchedAt = 0;
const REUSE_MS = 30_000;

export function fetchStoreStats(): Promise<Record<string, unknown> | null> {
  const now = Date.now();
  if (cached && now - fetchedAt < REUSE_MS) return cached;
  fetchedAt = now;
  cached = fetch("/api/store/stats")
    .then((r) => r.json())
    .catch(() => null);
  cached.then((j) => {
    if (!j) cached = null; // never pin a failure — retry on the next consumer
  });
  return cached;
}
