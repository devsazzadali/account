// AccountStoreOne — Stripe Checkout session for a WALLET TOP-UP.
// The wallet is funded by card (owner ruling 2026-11-01: international
// store, card + wallet only). INERT unless STRIPE_SECRET_KEY exists:
// returns 501 and the wallet UI shows top-ups as unavailable — never a
// fake card flow. The webhook (/api/payments/stripe/webhook) credits
// the wallet on checkout.session.completed via the session metadata
// (purpose=topup), idempotently on the session id.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";

const MIN_USD = 1;
const MAX_USD = 1000;

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json(
      { error: "Card payments are not configured on this store yet — wallet top-ups by card are unavailable right now." },
      { status: 501 },
    );
  }
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const amount = Number(body.amount || 0);
  if (!Number.isFinite(amount) || amount < MIN_USD || amount > MAX_USD) {
    return Response.json(
      { error: `Enter a top-up amount between $${MIN_USD} and $${MAX_USD}` },
      { status: 400 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/dashboard?tab=wallet&topup=success`);
  form.set("cancel_url", `${origin}/dashboard?tab=wallet&topup=cancelled`);
  form.set("customer_email", ctx.user.email);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)));
  form.set("line_items[0][price_data][product_data][name]", "Account Store One — wallet top-up");
  form.set("metadata[purpose]", "topup");
  form.set("metadata[user_id]", ctx.user.id);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const session = await res.json();
  if (!res.ok) {
    return Response.json({ error: session?.error?.message || "Stripe session creation failed" }, { status: 502 });
  }
  return Response.json({ url: session.url, session_id: session.id });
}
