// AccountStoreOne — Stripe webhook. Verifies the Stripe-Signature header
// (HMAC-SHA256 over `${timestamp}.${payload}`) with the webhook secret
// (dashboard Settings → Payments, env as fallback) and settles orders on
// checkout.session.completed. Inert without credentials. Deliberately
// NOT gated on the admin enable-toggle: sessions created while Stripe
// was on must still settle if the toggle is later switched off.

import crypto from "node:crypto";
import { markStripePaid, creditStripeTopup } from "@/src/lib/order-service";
import { prisma } from "@/src/lib/db";
import { getStripeConfig } from "@/src/lib/settings-store";

function verifySignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  );
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const stripeCfg = await getStripeConfig();
  const secret = stripeCfg.webhookSecret;
  const key = stripeCfg.secretKey;
  if (!secret || !key) return Response.json({ error: "Stripe is not configured" }, { status: 501 });

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  if (!verifySignature(payload, signature, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      if (session.metadata?.purpose === "topup") {
        // Wallet top-up by card — credit the wallet (idempotent on the
        // session id inside creditStripeTopup).
        const userId = String(session.metadata.user_id || "");
        const amountUsd = Number(session.amount_total || 0) / 100;
        if (userId && amountUsd > 0) await creditStripeTopup(userId, amountUsd, session.id);
      } else {
        await markStripePaid(session.id);
        if (session.payment_intent) {
          await prisma.order.update({
            where: { stripeSessionId: session.id },
            data: { paymentIntentId: String(session.payment_intent) },
          }).catch(() => undefined);
        }
      }
    }
  }
  return Response.json({ received: true });
}
