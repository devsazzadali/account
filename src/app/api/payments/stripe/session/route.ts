// AccountStoreOne — Stripe Checkout session creation.
// INERT unless STRIPE_SECRET_KEY exists in env: returns 501 with a plain
// "not configured" error and the checkout UI disables the card option.
// No card data ever touches this server; buyers pay on Stripe's page and
// the webhook (/api/payments/stripe/webhook) settles the order.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return Response.json(
      { error: "Card payments are not configured on this store yet. Please use bKash/Nagad or your wallet balance." },
      { status: 501 },
    );
  }
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || body.orderId || "");
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true } });
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== ctx.user.id) return Response.json({ error: "Not your order" }, { status: 403 });
  if (order.paymentStatus === "paid") return Response.json({ error: "Order is already paid" }, { status: 409 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", `${origin}/order/${order.id}?stripe=success`);
  form.set("cancel_url", `${origin}/order/${order.id}?stripe=cancelled`);
  form.set("customer_email", ctx.user.email);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "usd");
  form.set("line_items[0][price_data][unit_amount]", String(Math.round(Number(order.totalPrice) * 100)));
  form.set("line_items[0][price_data][product_data][name]", order.product?.title || "Account Store One order");
  form.set("metadata[order_id]", order.id);

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
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id, paymentMethod: "stripe" },
  });
  return Response.json({ url: session.url, session_id: session.id });
}
