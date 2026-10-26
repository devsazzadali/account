// AccountStoreOne — Stripe webhook. Verifies the Stripe-Signature header
// (HMAC-SHA256 over `${timestamp}.${payload}`) with STRIPE_WEBHOOK_SECRET
// and settles orders on checkout.session.completed. Inert without env keys.

import crypto from "node:crypto";
import { markStripePaid } from "@/src/lib/order-service";
import { prisma } from "@/src/lib/db";

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
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
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
      await markStripePaid(session.id);
      if (session.payment_intent) {
        await prisma.order.update({
          where: { stripeSessionId: session.id },
          data: { paymentIntentId: String(session.payment_intent) },
        }).catch(() => undefined);
      }
    }
  }
  return Response.json({ received: true });
}
