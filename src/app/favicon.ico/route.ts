// Browsers probe /favicon.ico by default even when the app declares its
// icon via app/icon.tsx — answer the probe with a redirect to the real
// icon route instead of a 404 (which showed up as a console error on
// every page during the 2026-10-26 full QA pass).
export function GET() {
  return new Response(null, {
    status: 307,
    headers: { Location: "/icon" },
  });
}
