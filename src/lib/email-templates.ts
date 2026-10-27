// AccountStoreOne — professional transactional email templates.
//
// ONE reusable branded layout for every store email (owner order
// 2026-10-27): navy #0C2254 / orange #F4751F brand system, the store's
// name + logo (from store_settings, read-only), a clear order-details
// table, and a button to the buyer's order page. Every template returns
// { subject, html, text } — a plain-text part always accompanies the
// HTML. Emails NEVER contain raw credential secrets: delivery mail
// points the buyer to the secure vault on their order page, which is
// the only place credentials are shown.

import { SITE_URL } from "./seo";
import { orderCode, orderRef } from "./order-ref";

export interface StoreIdentity {
  name: string;
  logoUrl: string;
  supportEmail: string;
}

export interface OrderMailContext {
  id: string;
  productTitle: string;
  variantLabel?: string | null;
  quantity: number;
  /** Canonical order total (orders.total_price) as a number. */
  total: number;
  customerName?: string | null;
  customerEmail?: string | null;
  paymentMethod?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const NAVY = "#0C2254";
const ORANGE = "#F4751F";
const BG = "#F8F9FB";
const INK = "#1e293b";
const MUTED = "#64748b";

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): string {
  return `$${Number(n).toFixed(2)}`;
}

function orderUrl(orderId: string): string {
  return `${SITE_URL}/order/${orderId}`;
}

function adminUrl(): string {
  return `${SITE_URL}/admin`;
}

function absoluteLogo(logoUrl: string): string {
  if (!logoUrl) return "";
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  return `${SITE_URL}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`;
}

interface LayoutParts {
  kicker: string;
  heading: string;
  /** HTML paragraphs (already escaped/composed) above the details table. */
  bodyHtml: string;
  /** Plain-text lines mirroring bodyHtml. */
  bodyText: string[];
  /** [label, value] rows; rendered in both parts. */
  details?: Array<[string, string]>;
  /** Optional extra HTML block under the details table. */
  extraHtml?: string;
  extraText?: string[];
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}

function renderLayout(identity: StoreIdentity, parts: LayoutParts): { html: string; text: string } {
  const logo = absoluteLogo(identity.logoUrl);
  const detailRows = (parts.details || [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px;color:${MUTED};font-size:12px;text-transform:uppercase;letter-spacing:0.08em;border-top:1px solid #eef2f7">${esc(k)}</td>` +
        `<td style="padding:7px 14px;font-size:13px;font-weight:600;color:${INK};text-align:right;border-top:1px solid #eef2f7">${esc(v)}</td></tr>`,
    )
    .join("");
  const detailsHtml = parts.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:20px 0 4px">${detailRows}</table>`
    : "";
  const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;background:${BG};font-family:Arial,Helvetica,sans-serif;color:${INK}">
  <div style="max-width:580px;margin:24px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
    <div style="background:${NAVY};padding:22px 30px">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(identity.name)}" style="height:34px;display:block;margin-bottom:8px"/>` : ""}
      <span style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:0.02em">${esc(identity.name)}</span>
      <span style="display:block;color:${ORANGE};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;margin-top:3px">${esc(parts.kicker)}</span>
    </div>
    <div style="padding:28px 30px 8px">
      <h1 style="margin:0 0 14px;font-size:21px;line-height:1.3;color:${NAVY}">${esc(parts.heading)}</h1>
      <div style="font-size:14px;line-height:1.65">${parts.bodyHtml}</div>
      ${detailsHtml}
      ${parts.extraHtml || ""}
      <div style="margin:26px 0 8px">
        <a href="${parts.ctaUrl}" style="display:inline-block;background:${ORANGE};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px">${esc(parts.ctaLabel)}</a>
      </div>
      <p style="font-size:12px;color:${MUTED};margin:10px 0 20px">Or paste this link into your browser:<br/><a href="${parts.ctaUrl}" style="color:${NAVY}">${parts.ctaUrl}</a></p>
    </div>
    <div style="padding:16px 30px;background:${BG};border-top:1px solid #e2e8f0;font-size:11px;line-height:1.6;color:#94a3b8">
      ${esc(parts.footerNote)}<br/>
      ${esc(identity.name)}${identity.supportEmail ? ` · Support: ${esc(identity.supportEmail)}` : ""}
    </div>
  </div>
</body></html>`;

  const textLines: string[] = [
    `${identity.name} — ${parts.kicker}`,
    "",
    parts.heading,
    "",
    ...parts.bodyText,
  ];
  if (parts.details?.length) {
    textLines.push("");
    for (const [k, v] of parts.details) textLines.push(`${k}: ${v}`);
  }
  if (parts.extraText?.length) textLines.push("", ...parts.extraText);
  textLines.push("", `${parts.ctaLabel}: ${parts.ctaUrl}`, "", parts.footerNote);
  if (identity.supportEmail) textLines.push(`Support: ${identity.supportEmail}`);
  return { html, text: textLines.join("\n") };
}

function orderDetails(o: OrderMailContext, rows: Array<[string, string]> = []): Array<[string, string]> {
  const base: Array<[string, string]> = [
    ["Order number", orderCode(o.id)],
    ["Product", o.productTitle],
  ];
  if (o.variantLabel) base.push(["Variant", o.variantLabel]);
  base.push(["Quantity", String(o.quantity)], ["Order total", money(o.total)]);
  return [...base, ...rows];
}

const ESCROW_FOOTER =
  "Your payment is protected by escrow until delivery is confirmed. Questions? Reply to this email or use the support chat in your account.";
const ADMIN_FOOTER = "This is an automated store alert. Sign in to the admin panel to act on it.";

// ─── Customer: order received (placed) ───────────────────────────────

export function orderReceivedEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>Thank you${o.customerName ? `, ${esc(o.customerName)}` : ""} — we've received your order <strong>${esc(ref)}</strong>.</p>
    <p>Your items are reserved for you. If you haven't paid yet, open your order page to complete payment — once payment is verified, delivery follows automatically and your purchase appears in the secure vault on that page.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Order received",
    heading: "We've received your order",
    bodyHtml,
    bodyText: [
      `Thank you — we've received your order ${ref}.`,
      "Your items are reserved for you. If you haven't paid yet, open your order page to complete payment — once payment is verified, delivery follows automatically and your purchase appears in the secure vault on that page.",
    ],
    details: orderDetails(o, [["Status", "Awaiting payment"]]),
    ctaLabel: "View your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Order received — ${ref}`, html, text };
}

// ─── Customer: payment confirmed ─────────────────────────────────────

export function paymentConfirmedEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const method = o.paymentMethod ? o.paymentMethod : "your chosen method";
  const bodyHtml = `<p>Good news — your payment for order <strong>${esc(ref)}</strong> has been verified.</p>
    <p>The amount is now held safely in escrow. It is only released after your delivery is confirmed, so you stay in control the whole way.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Payment confirmed",
    heading: "Payment verified — order confirmed",
    bodyHtml,
    bodyText: [
      `Good news — your payment for order ${ref} has been verified.`,
      "The amount is now held safely in escrow. It is only released after your delivery is confirmed, so you stay in control the whole way.",
    ],
    details: orderDetails(o, [
      ["Payment method", method],
      ["Status", "Confirmed — in escrow"],
    ]),
    ctaLabel: "Track your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Payment confirmed — ${ref}`, html, text };
}

// ─── Customer: processing started ────────────────────────────────────

export function processingStartedEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>Your order <strong>${esc(ref)}</strong> is now being prepared.</p>
    <p>The seller has started working on your delivery. You'll get another email the moment it's delivered — for instant products this is usually quick; services and manual deliveries follow the delivery time shown on the product page.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Processing started",
    heading: "Your order is being prepared",
    bodyHtml,
    bodyText: [
      `Your order ${ref} is now being prepared.`,
      "The seller has started working on your delivery. You'll get another email the moment it's delivered — for instant products this is usually quick; services and manual deliveries follow the delivery time shown on the product page.",
    ],
    details: orderDetails(o, [["Status", "Preparing"]]),
    ctaLabel: "Track your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Your order is being prepared — ${ref}`, html, text };
}

// ─── Customer: delivered ─────────────────────────────────────────────

export function deliveredEmail(
  identity: StoreIdentity,
  o: OrderMailContext,
  opts: { service?: boolean; partial?: boolean; deliveredQuantity?: number } = {},
): RenderedEmail {
  const ref = orderRef(o.id);
  const what = opts.service
    ? `The service for <strong>${esc(o.productTitle)}</strong> is complete. The completion proof is attached to your order page — open it to review exactly what was done.`
    : `Your <strong>${esc(o.productTitle)}</strong> has been delivered. For your security, the credentials themselves are <strong>not</strong> in this email — they are waiting in the secure vault on your order page, together with any 2FA secret and recovery email.`;
  const whatText = opts.service
    ? `The service for ${o.productTitle} is complete. The completion proof is attached to your order page — open it to review exactly what was done.`
    : `Your ${o.productTitle} has been delivered. For your security, the credentials themselves are NOT in this email — they are waiting in the secure vault on your order page, together with any 2FA secret and recovery email.`;
  const partialNote = opts.partial
    ? `<p><strong>Partial delivery:</strong> ${opts.deliveredQuantity ?? 0} of ${o.quantity} unit(s) are ready now; the rest will follow, and you'll be emailed again when the order is fully delivered.</p>`
    : "";
  const partialText = opts.partial
    ? [`Partial delivery: ${opts.deliveredQuantity ?? 0} of ${o.quantity} unit(s) are ready now; the rest will follow, and you'll be emailed again when the order is fully delivered.`]
    : [];
  const bodyHtml = `<p>Great news — order <strong>${esc(ref)}</strong> has been delivered.</p><p>${what}</p>${partialNote}
    <p>Please check everything and confirm receipt on the order page. Your payment stays in escrow for 48 hours after delivery — if anything is wrong, open a dispute from the order page within that window.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: opts.partial ? "Partial delivery" : "Delivered",
    heading: opts.partial ? "Part of your order has been delivered" : "Your order has been delivered",
    bodyHtml,
    bodyText: [
      `Great news — order ${ref} has been delivered.`,
      whatText,
      ...partialText,
      "Please check everything and confirm receipt on the order page. Your payment stays in escrow for 48 hours after delivery — if anything is wrong, open a dispute from the order page within that window.",
    ],
    details: orderDetails(o, [["Status", opts.partial ? `Delivered ${opts.deliveredQuantity ?? 0} of ${o.quantity}` : "Delivered"]]),
    ctaLabel: opts.service ? "Review your delivery" : "Open the secure vault",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `${opts.partial ? "Partial delivery" : "Delivered"} — ${ref}`, html, text };
}

// ─── Customer: completed ─────────────────────────────────────────────

export function completedEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>Order <strong>${esc(ref)}</strong> is now complete — thank you for shopping with ${esc(identity.name)}.</p>
    <p>The escrow hold has been released. Your delivered items remain available in the vault on your order page, and we'd love to hear how it went — you can leave a review from the same page.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Order completed",
    heading: "Order complete — thank you",
    bodyHtml,
    bodyText: [
      `Order ${ref} is now complete — thank you for shopping with ${identity.name}.`,
      "The escrow hold has been released. Your delivered items remain available in the vault on your order page, and we'd love to hear how it went — you can leave a review from the same page.",
    ],
    details: orderDetails(o, [["Status", "Completed"]]),
    ctaLabel: "View your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Order completed — ${ref}`, html, text };
}

// ─── Customer: cancelled (unpaid) ────────────────────────────────────

export function orderCancelledEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>Order <strong>${esc(ref)}</strong> has been cancelled.</p>
    <p>No payment was taken for this order, so there is nothing to refund. The reserved stock has been released. If this was a mistake, you can place a new order from the product page at any time.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Order cancelled",
    heading: "Your order was cancelled",
    bodyHtml,
    bodyText: [
      `Order ${ref} has been cancelled.`,
      "No payment was taken for this order, so there is nothing to refund. The reserved stock has been released. If this was a mistake, you can place a new order from the product page at any time.",
    ],
    details: orderDetails(o, [["Status", "Cancelled"]]),
    ctaLabel: "Continue shopping",
    ctaUrl: SITE_URL,
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Order cancelled — ${ref}`, html, text };
}

// ─── Customer: cancelled + refunded, and standalone refunds ─────────

export function refundEmail(
  identity: StoreIdentity,
  o: OrderMailContext,
  opts: { amount: number; cancelled?: boolean; partial?: boolean },
): RenderedEmail {
  const ref = orderRef(o.id);
  const cancelled = !!opts.cancelled;
  const heading = cancelled ? "Order cancelled — refund issued" : opts.partial ? "Partial refund issued" : "Refund issued";
  const bodyHtml = cancelled
    ? `<p>Order <strong>${esc(ref)}</strong> has been cancelled and refunded.</p>
       <p>A refund of <strong>${money(opts.amount)}</strong> has been credited to your store wallet — you can spend it on any product or keep it for your next order.</p>`
    : `<p>A ${opts.partial ? "partial " : ""}refund for order <strong>${esc(ref)}</strong> has been issued.</p>
       <p><strong>${money(opts.amount)}</strong> has been credited to your store wallet — you can spend it on any product or keep it for your next order.</p>`;
  const bodyText = cancelled
    ? [
        `Order ${ref} has been cancelled and refunded.`,
        `A refund of ${money(opts.amount)} has been credited to your store wallet — you can spend it on any product or keep it for your next order.`,
      ]
    : [
        `A ${opts.partial ? "partial " : ""}refund for order ${ref} has been issued.`,
        `${money(opts.amount)} has been credited to your store wallet — you can spend it on any product or keep it for your next order.`,
      ];
  const { html, text } = renderLayout(identity, {
    kicker: cancelled ? "Cancelled & refunded" : "Refund",
    heading,
    bodyHtml,
    bodyText,
    details: orderDetails(o, [
      ["Refund amount", money(opts.amount)],
      ["Refund method", "Store wallet"],
      ["Status", cancelled ? "Cancelled & refunded" : "Refunded"],
    ]),
    ctaLabel: "View your wallet",
    ctaUrl: `${SITE_URL}/dashboard`,
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `${heading} — ${ref}`, html, text };
}

// ─── Customer: dispute opened ────────────────────────────────────────

export function disputeOpenedEmail(identity: StoreIdentity, o: OrderMailContext, reason: string): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>We've opened a dispute for order <strong>${esc(ref)}</strong> and frozen the payment in escrow — it will not be released while the dispute is open.</p>
    <p>The store is reviewing the case now. You'll receive another email as soon as it's resolved; if more information is needed, support will contact you through your account messages.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Dispute opened",
    heading: "Your dispute is open",
    bodyHtml,
    bodyText: [
      `We've opened a dispute for order ${ref} and frozen the payment in escrow — it will not be released while the dispute is open.`,
      "The store is reviewing the case now. You'll receive another email as soon as it's resolved; if more information is needed, support will contact you through your account messages.",
    ],
    details: orderDetails(o, [
      ["Status", "Disputed — under review"],
      ["Your report", reason.slice(0, 160)],
    ]),
    ctaLabel: "View your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Dispute opened — ${ref}`, html, text };
}

// ─── Customer: dispute resolved ──────────────────────────────────────

export function disputeResolvedEmail(
  identity: StoreIdentity,
  o: OrderMailContext,
  resolution: "refunded" | "replaced" | "rejected",
  opts: { service?: boolean } = {},
): RenderedEmail {
  const ref = orderRef(o.id);
  const copy = {
    refunded: {
      heading: "Dispute resolved — refund issued",
      html: `<p>Your dispute for order <strong>${esc(ref)}</strong> has been resolved in your favour.</p>
        <p>A full refund of <strong>${money(o.total)}</strong> has been credited to your store wallet. You can spend it on any product or keep it for your next order.</p>`,
      text: [
        `Your dispute for order ${ref} has been resolved in your favour.`,
        `A full refund of ${money(o.total)} has been credited to your store wallet. You can spend it on any product or keep it for your next order.`,
      ],
      status: "Refunded to wallet",
    },
    replaced: {
      heading: "Dispute resolved — replacement on the way",
      html: opts.service
        ? `<p>Your dispute for order <strong>${esc(ref)}</strong> has been resolved: the service will be performed again.</p>
          <p>Watch your order page for progress updates and the new completion proof.</p>`
        : `<p>Your dispute for order <strong>${esc(ref)}</strong> has been resolved: fresh credentials have been delivered to the secure vault on your order page.</p>
          <p>Please check the replacement and confirm receipt — the escrow window restarts from this delivery.</p>`,
      text: opts.service
        ? [
            `Your dispute for order ${ref} has been resolved: the service will be performed again.`,
            "Watch your order page for progress updates and the new completion proof.",
          ]
        : [
            `Your dispute for order ${ref} has been resolved: fresh credentials have been delivered to the secure vault on your order page.`,
            "Please check the replacement and confirm receipt — the escrow window restarts from this delivery.",
          ],
      status: "Resolved — replaced",
    },
    rejected: {
      heading: "Dispute resolved — reviewed and closed",
      html: `<p>Your dispute for order <strong>${esc(ref)}</strong> has been reviewed and closed.</p>
        <p>The order has been restored to its previous state. If you still need help, contact support from your account and we'll take another look.</p>`,
      text: [
        `Your dispute for order ${ref} has been reviewed and closed.`,
        "The order has been restored to its previous state. If you still need help, contact support from your account and we'll take another look.",
      ],
      status: "Resolved — closed",
    },
  }[resolution];
  const { html, text } = renderLayout(identity, {
    kicker: "Dispute resolved",
    heading: copy.heading,
    bodyHtml: copy.html,
    bodyText: copy.text,
    details: orderDetails(o, [["Status", copy.status]]),
    ctaLabel: "View your order",
    ctaUrl: orderUrl(o.id),
    footerNote: ESCROW_FOOTER,
  });
  return { subject: `Dispute resolved — ${ref}`, html, text };
}

// ─── Admin: new order alert ──────────────────────────────────────────

export function adminNewOrderEmail(identity: StoreIdentity, o: OrderMailContext): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>A new order has just been placed.</p>
    <p><strong>${esc(o.productTitle)}</strong> × ${o.quantity} — ${money(o.total)}. The order is awaiting payment; you'll be alerted again if a dispute is opened.</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Admin alert · New order",
    heading: `New order ${ref}`,
    bodyHtml,
    bodyText: [
      "A new order has just been placed.",
      `${o.productTitle} × ${o.quantity} — ${money(o.total)}. The order is awaiting payment; you'll be alerted again if a dispute is opened.`,
    ],
    details: [
      ["Order number", orderCode(o.id)],
      ["Product", o.productTitle],
      ...(o.variantLabel ? ([["Variant", o.variantLabel]] as Array<[string, string]>) : []),
      ["Quantity", String(o.quantity)],
      ["Order total", money(o.total)],
      ["Customer", o.customerName || "—"],
      ["Customer email", o.customerEmail || "—"],
    ],
    ctaLabel: "Open the admin panel",
    ctaUrl: adminUrl(),
    footerNote: ADMIN_FOOTER,
  });
  return { subject: `New order ${ref} — ${money(o.total)} — ${o.productTitle}`, html, text };
}

// ─── Admin: dispute opened alert ─────────────────────────────────────

export function adminDisputeEmail(identity: StoreIdentity, o: OrderMailContext, reason: string): RenderedEmail {
  const ref = orderRef(o.id);
  const bodyHtml = `<p>A buyer has opened a dispute on order <strong>${esc(ref)}</strong>. The payment is frozen in escrow until you resolve it.</p>
    <p><strong>Buyer's report:</strong> ${esc(reason.slice(0, 300))}</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Admin alert · Dispute",
    heading: `Dispute opened on ${ref}`,
    bodyHtml,
    bodyText: [
      `A buyer has opened a dispute on order ${ref}. The payment is frozen in escrow until you resolve it.`,
      `Buyer's report: ${reason.slice(0, 300)}`,
    ],
    details: orderDetails(o, [
      ["Customer", o.customerName || "—"],
      ["Customer email", o.customerEmail || "—"],
    ]),
    ctaLabel: "Review the dispute",
    ctaUrl: adminUrl(),
    footerNote: ADMIN_FOOTER,
  });
  return { subject: `Dispute opened on order ${ref}`, html, text };
}

// ─── Admin: low-stock warning ────────────────────────────────────────

/** Low-stock trigger threshold (available inventory units). Defined
 *  here as the single source: an admin warning fires when a product's
 *  available stock crosses from above this number to at/below it. */
export const LOW_STOCK_THRESHOLD = 3;

export function adminLowStockEmail(
  identity: StoreIdentity,
  product: { id: string; title: string },
  remaining: number,
): RenderedEmail {
  const out = remaining <= 0;
  const heading = out ? `Out of stock: ${product.title}` : `Low stock: ${product.title} — ${remaining} left`;
  const bodyHtml = out
    ? `<p><strong>${esc(product.title)}</strong> has just sold its last available unit and is now <strong>out of stock</strong>.</p>
       <p>New buyers can no longer order it until you add more inventory in the admin panel.</p>`
    : `<p><strong>${esc(product.title)}</strong> is running low — only <strong>${remaining} unit(s)</strong> of deliverable inventory remain (warning threshold: ${LOW_STOCK_THRESHOLD}).</p>
       <p>Add more inventory soon to avoid the listing selling out.</p>`;
  const bodyText = out
    ? [
        `${product.title} has just sold its last available unit and is now out of stock.`,
        "New buyers can no longer order it until you add more inventory in the admin panel.",
      ]
    : [
        `${product.title} is running low — only ${remaining} unit(s) of deliverable inventory remain (warning threshold: ${LOW_STOCK_THRESHOLD}).`,
        "Add more inventory soon to avoid the listing selling out.",
      ];
  const { html, text } = renderLayout(identity, {
    kicker: "Admin alert · Inventory",
    heading,
    bodyHtml,
    bodyText,
    details: [
      ["Product", product.title],
      ["Available units", String(Math.max(0, remaining))],
      ["Warning threshold", `${LOW_STOCK_THRESHOLD} units`],
    ],
    ctaLabel: "Manage inventory",
    ctaUrl: adminUrl(),
    footerNote: ADMIN_FOOTER,
  });
  return { subject: heading, html, text };
}

/** Generic branded shell for free-form admin-composed mail (broadcasts). */
export function announcementEmail(
  identity: StoreIdentity,
  title: string,
  bodyText: string,
): RenderedEmail {
  const safeHtml = `<p>${esc(bodyText).replace(/\n/g, "<br/>")}</p>`;
  const { html, text } = renderLayout(identity, {
    kicker: "Announcement",
    heading: title,
    bodyHtml: safeHtml,
    bodyText: [bodyText],
    ctaLabel: "Visit the store",
    ctaUrl: SITE_URL,
    footerNote: ESCROW_FOOTER,
  });
  return { subject: title, html, text };
}
