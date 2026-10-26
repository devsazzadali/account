// AccountStoreOne — transactional email (Z2U alignment P4).
//
// Design: order-service QUEUES an email_outbox row inside the same
// transaction as the state change (so an email is owed exactly when the
// state changed — never for a rolled-back transition). The API layer
// calls flushEmailOutbox() after the request; it sends pending rows via
// Resend when RESEND_API_KEY + STORE_FROM_EMAIL are set. With no
// provider configured the rows stay "pending" — an honest queue, never
// a fake "sent". Provider errors mark the row "failed" with the error.

import { Prisma } from "@prisma/client";
import { prisma } from "./db";

type Tx = Prisma.TransactionClient;

const NAVY = "#0C2254";
const ORANGE = "#F4751F";

export function emailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.STORE_FROM_EMAIL);
}

function wrapHtml(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F8F9FB;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="background:${NAVY};padding:20px 28px">
      <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.02em">Account Store One</span>
      <span style="display:block;color:${ORANGE};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;margin-top:2px">${title}</span>
    </div>
    <div style="padding:28px;font-size:14px;line-height:1.65">${bodyHtml}</div>
    <div style="padding:16px 28px;background:#F8F9FB;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
      Your payment is protected by escrow until delivery is confirmed. Questions? Reply to this email or use the support chat in your account.
    </div>
  </div></body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Queue an email inside a transaction (atomic with the state change). */
export async function queueEmail(
  tx: Tx,
  to: string | null | undefined,
  subject: string,
  bodyHtml: string,
  bodyText: string,
): Promise<void> {
  if (!to || !to.includes("@")) return;
  await tx.emailOutbox.create({
    data: { toEmail: to, subject, html: wrapHtml(subject, bodyHtml), text: bodyText },
  });
}

function orderRef(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

export async function queueOrderConfirmation(tx: Tx, order: { id: string; customerEmail: string | null; totalPrice: unknown }, productTitle: string) {
  const total = Number(order.totalPrice).toFixed(2);
  await queueEmail(
    tx,
    order.customerEmail,
    `Order confirmed — ${orderRef(order.id)}`,
    `<p>Thank you — your order for <strong>${esc(productTitle)}</strong> is confirmed.</p>
     <p>Order total: <strong>$${total}</strong> (includes the $0.50 service fee).</p>
     <p>If you haven't paid yet, open your order page to complete payment. Once payment is verified, delivery is automatic and your credentials appear in the secure vault on the order page.</p>`,
    `Your order for ${productTitle} is confirmed. Order total: $${total}. Complete payment from your order page; delivery follows automatically once payment is verified.`,
  );
}

export async function queuePaymentVerified(tx: Tx, order: { id: string; customerEmail: string | null }, delivered: boolean) {
  await queueEmail(
    tx,
    order.customerEmail,
    `Payment verified — ${orderRef(order.id)}`,
    `<p>Your payment for order <strong>${orderRef(order.id)}</strong> has been verified and is now held in escrow.</p>
     <p>${delivered ? "Your credentials are ready in the vault on your order page." : "The store is preparing your delivery — your credentials will appear in the vault on your order page."}</p>`,
    `Your payment for order ${orderRef(order.id)} was verified and is held in escrow. ${delivered ? "Your credentials are ready in the vault on your order page." : "Delivery is being prepared."}`,
  );
}

export async function queueDelivered(tx: Tx, order: { id: string; customerEmail: string | null }) {
  await queueEmail(
    tx,
    order.customerEmail,
    `Delivered — ${orderRef(order.id)}`,
    `<p>Your order <strong>${orderRef(order.id)}</strong> has been delivered. Your credentials are in the secure vault on your order page.</p>
     <p>Please check them and confirm receipt. Your payment stays in escrow for 48 hours after delivery — if anything is wrong, open a dispute from the order page.</p>`,
    `Your order ${orderRef(order.id)} has been delivered — credentials are in the vault on your order page. Confirm receipt, or open a dispute within the escrow window if anything is wrong.`,
  );
}

export async function queueDisputeOutcome(tx: Tx, order: { id: string; customerEmail: string | null }, resolution: string) {
  const copy: Record<string, [string, string]> = {
    refunded: ["Your dispute was resolved with a full refund to your store wallet.", "Refund issued to your wallet."],
    replaced: ["Your dispute was resolved — fresh credentials were delivered to your order vault.", "Replacement credentials delivered."],
    rejected: ["Your dispute was reviewed and closed. If you still need help, contact support from your account.", "Dispute reviewed and closed."],
  };
  const [html, text] = copy[resolution] || copy.rejected;
  await queueEmail(
    tx,
    order.customerEmail,
    `Dispute update — ${orderRef(order.id)}`,
    `<p>${html}</p>`,
    text,
  );
}

export async function queueRefund(tx: Tx, order: { id: string; customerEmail: string | null; totalPrice: unknown }) {
  const total = Number(order.totalPrice).toFixed(2);
  await queueEmail(
    tx,
    order.customerEmail,
    `Refund issued — ${orderRef(order.id)}`,
    `<p>A refund of <strong>$${total}</strong> for order <strong>${orderRef(order.id)}</strong> was credited to your store wallet.</p>`,
    `A refund of $${total} for order ${orderRef(order.id)} was credited to your store wallet.`,
  );
}

/** Send pending outbox rows through Resend when configured. Best-effort:
 *  called after API responses are computed; never throws into the request. */
export async function flushEmailOutbox(limit = 20): Promise<void> {
  if (!emailConfigured()) return;
  try {
    const rows = await prisma.emailOutbox.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    for (const row of rows) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.STORE_FROM_EMAIL,
            to: [row.toEmail],
            subject: row.subject,
            html: row.html,
            text: row.text,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          await prisma.emailOutbox.update({
            where: { id: row.id },
            data: { status: "failed", error: `Resend ${res.status}: ${body.slice(0, 300)}` },
          });
        } else {
          await prisma.emailOutbox.update({
            where: { id: row.id },
            data: { status: "sent", sentAt: new Date(), error: null },
          });
        }
      } catch (err) {
        await prisma.emailOutbox.update({
          where: { id: row.id },
          data: { status: "failed", error: err instanceof Error ? err.message.slice(0, 300) : "send failed" },
        }).catch(() => {});
      }
    }
  } catch {
    // Outbox flushing must never break the request that triggered it.
  }
}
