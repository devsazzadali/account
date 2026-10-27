// AccountStoreOne — transactional email: queue + Resend sender.
//
// Design (unchanged contract, professional templates since 2026-10-27):
// order-service QUEUES an email_outbox row inside the same transaction
// as the state change (an email is owed exactly when the state changed
// — never for a rolled-back transition), rendered from the branded
// templates in email-templates.ts. The API layer calls
// flushEmailOutbox() after the request; it sends due rows via Resend.
//
// Provider config, in priority order:
//   API key:  store_settings "resend_api_key"  →  env RESEND_API_KEY
//   From:     store_settings "email_from_address" / "email_from_name"
//             →  env RESEND_FROM  →  env STORE_FROM_EMAIL
//             →  default: "<Store name> <noreply@placeholder.example.com>"
//             (a clearly-marked placeholder — set a verified sender
//             before expecting real delivery; Resend will reject an
//             unverified domain and the row records that error)
//   Endpoint: env RESEND_API_BASE_URL (default https://api.resend.com;
//             overridable so tests can use a local stub — the real API
//             is never called by the test suite).
//
// With no API key configured, rows stay "pending" — an honest queue,
// never a fake "sent". Provider failures retry with exponential
// backoff (attempts / next_attempt_at); only after the attempt budget
// is exhausted is a row marked "failed", with the provider error kept.

import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  StoreIdentity,
  OrderMailContext,
  RenderedEmail,
  orderReceivedEmail,
  paymentConfirmedEmail,
  processingStartedEmail,
  deliveredEmail,
  completedEmail,
  orderCancelledEmail,
  refundEmail,
  disputeOpenedEmail,
  disputeResolvedEmail,
  adminNewOrderEmail,
  adminDisputeEmail,
  adminLowStockEmail,
  announcementEmail,
} from "./email-templates";

type Tx = Prisma.TransactionClient;
/** The mailer reads through either a transaction client or the root
 *  client (lazy escrow release happens outside a transaction). */
type Db = Pick<Tx, "storeSetting" | "profile" | "emailOutbox" | "product">;

const MAX_SEND_ATTEMPTS = 3;
const PLACEHOLDER_FROM_ADDRESS = "noreply@placeholder.example.com";

// ─── Config ──────────────────────────────────────────────────────────

export interface EmailConfig {
  configured: boolean;
  apiKey: string;
  /** Full From header value, e.g. "Account Store One <noreply@…>". */
  from: string;
  apiBase: string;
}

async function readSettingsMap(db: Db): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const rows = await db.storeSetting.findMany();
    for (const r of rows) out[r.key] = r.value;
  } catch {
    // Settings unreadable — env/defaults still give a coherent config.
  }
  return out;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const s = await readSettingsMap(prisma as unknown as Db);
  const apiKey = (s["resend_api_key"] || process.env.RESEND_API_KEY || "").trim();
  const storeName = (s["store_name"] || process.env.STORE_NAME || "Account Store One").trim();
  const fromAddress = (
    s["email_from_address"] ||
    process.env.RESEND_FROM ||
    process.env.STORE_FROM_EMAIL ||
    PLACEHOLDER_FROM_ADDRESS
  ).trim();
  const fromName = (s["email_from_name"] || storeName).trim();
  return {
    configured: !!apiKey,
    apiKey,
    from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
    apiBase: (process.env.RESEND_API_BASE_URL || "https://api.resend.com").replace(/\/$/, ""),
  };
}

/** Sync env-only probe (kept for legacy callers). The outbox API uses
 *  getEmailConfig(), which also honours the settings-stored key. */
export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

// ─── Store identity (read-only from store_settings) ─────────────────

async function storeIdentity(db: Db): Promise<StoreIdentity> {
  const s = await readSettingsMap(db);
  return {
    name: (s["store_name"] || process.env.STORE_NAME || "Account Store One").trim(),
    logoUrl: (s["store_logo_url"] || "").trim(),
    supportEmail: (s["support_email"] || process.env.STORE_SUPPORT_EMAIL || "").trim(),
  };
}

// ─── Queue primitives ────────────────────────────────────────────────

interface OrderRow {
  id: string;
  productId: string | null;
  customerEmail: string | null;
  username: string | null;
  quantity: number;
  variantLabel: string | null;
  totalPrice: unknown;
  paymentMethod: string | null;
}

async function orderContext(
  db: Db,
  order: OrderRow,
): Promise<{ ctx: OrderMailContext; fulfilmentType: string | null }> {
  let productTitle = "Your order";
  let fulfilmentType: string | null = null;
  if (order.productId) {
    const p = await db.product
      .findUnique({ where: { id: order.productId }, select: { title: true, fulfilmentType: true } })
      .catch(() => null);
    if (p) {
      productTitle = p.title;
      fulfilmentType = p.fulfilmentType;
    }
  }
  return {
    ctx: {
      id: order.id,
      productTitle,
      variantLabel: order.variantLabel,
      quantity: order.quantity,
      total: Number(order.totalPrice),
      customerName: order.username,
      customerEmail: order.customerEmail,
      paymentMethod: order.paymentMethod,
    },
    fulfilmentType,
  };
}

async function queueRendered(db: Db, to: string | null | undefined, mail: RenderedEmail): Promise<void> {
  if (!to || !to.includes("@")) return;
  await db.emailOutbox.create({
    data: { toEmail: to, subject: mail.subject, html: mail.html, text: mail.text },
  });
}

async function queueForCustomer(db: Db, order: OrderRow, build: (identity: StoreIdentity, ctx: OrderMailContext, fulfilmentType: string | null) => RenderedEmail): Promise<void> {
  if (!order.customerEmail) return;
  const identity = await storeIdentity(db);
  const { ctx, fulfilmentType } = await orderContext(db, order);
  await queueRendered(db, order.customerEmail, build(identity, ctx, fulfilmentType));
}

/** Admin recipients: every admin/moderator profile email; falls back
 *  to the store support email when no admin profile carries one. */
async function adminRecipients(db: Db): Promise<string[]> {
  const admins = await db.profile
    .findMany({ where: { role: { in: ["admin", "moderator"] } }, select: { email: true } })
    .catch(() => []);
  const emails = [...new Set(admins.map((a) => a.email).filter((e): e is string => !!e && e.includes("@")))];
  if (emails.length === 0) {
    const identity = await storeIdentity(db);
    if (identity.supportEmail) emails.push(identity.supportEmail);
  }
  return emails;
}

async function queueForAdmins(db: Db, build: (identity: StoreIdentity) => RenderedEmail): Promise<void> {
  const recipients = await adminRecipients(db);
  if (recipients.length === 0) return;
  const identity = await storeIdentity(db);
  const mail = build(identity);
  for (const to of recipients) await queueRendered(db, to, mail);
}

/** Legacy free-form queue (admin broadcasts). The only caller builds
 *  its HTML fragment FROM the same text, so the branded announcement
 *  rendering of (subject, text) is equivalent — and consistently
 *  escaped. bodyHtml is accepted for signature compatibility. */
export async function queueEmail(
  tx: Db,
  to: string | null | undefined,
  subject: string,
  bodyHtml: string,
  bodyText: string,
): Promise<void> {
  void bodyHtml;
  if (!to || !to.includes("@")) return;
  const identity = await storeIdentity(tx);
  const mail = announcementEmail(identity, subject, bodyText);
  await tx.emailOutbox.create({ data: { toEmail: to, subject: mail.subject, html: mail.html, text: mail.text } });
}

// ─── Customer lifecycle emails ───────────────────────────────────────

export async function queueOrderReceived(tx: Db, order: OrderRow) {
  await queueForCustomer(tx, order, (i, c) => orderReceivedEmail(i, c));
}

export async function queuePaymentConfirmed(tx: Db, order: OrderRow) {
  await queueForCustomer(tx, order, (i, c) => paymentConfirmedEmail(i, c));
}

export async function queueProcessingStarted(tx: Db, order: OrderRow) {
  await queueForCustomer(tx, order, (i, c) => processingStartedEmail(i, c));
}

export async function queueDelivered(
  tx: Db,
  order: OrderRow,
  opts: { partial?: boolean; deliveredQuantity?: number } = {},
) {
  await queueForCustomer(tx, order, (i, c, ft) =>
    deliveredEmail(i, c, { service: ft === "service", partial: opts.partial, deliveredQuantity: opts.deliveredQuantity }),
  );
}

export async function queueOrderCompleted(tx: Db, order: OrderRow) {
  await queueForCustomer(tx, order, (i, c) => completedEmail(i, c));
}

/** Completion mail for the lazy escrow release, which runs on a read
 *  outside any transaction. Best-effort and self-catching: a mail
 *  failure must never break an order read. */
export async function queueCompletedOnRead(order: OrderRow): Promise<void> {
  try {
    await queueOrderCompleted(prisma as unknown as Db, order);
  } catch {
    // The order state is already committed; the missed email is the
    // lesser evil vs. failing the buyer's page load.
  }
}

export async function queueOrderCancelled(tx: Db, order: OrderRow) {
  await queueForCustomer(tx, order, (i, c) => orderCancelledEmail(i, c));
}

export async function queueRefundIssued(
  tx: Db,
  order: OrderRow,
  opts: { amount?: number; cancelled?: boolean; partial?: boolean } = {},
) {
  const amount = opts.amount ?? Number(order.totalPrice);
  await queueForCustomer(tx, order, (i, c) => refundEmail(i, c, { amount, cancelled: opts.cancelled, partial: opts.partial }));
}

export async function queueDisputeOpened(tx: Db, order: OrderRow, reason: string) {
  await queueForCustomer(tx, order, (i, c) => disputeOpenedEmail(i, c, reason));
}

export async function queueDisputeOutcome(tx: Db, order: OrderRow, resolution: "refunded" | "replaced" | "rejected") {
  await queueForCustomer(tx, order, (i, c, ft) => disputeResolvedEmail(i, c, resolution, { service: ft === "service" }));
}

// ─── Admin alert emails ──────────────────────────────────────────────

export async function queueAdminNewOrder(tx: Db, order: OrderRow) {
  const { ctx } = await orderContext(tx, order);
  await queueForAdmins(tx, (i) => adminNewOrderEmail(i, ctx));
}

export async function queueAdminDisputeAlert(tx: Db, order: OrderRow, reason: string) {
  const { ctx } = await orderContext(tx, order);
  await queueForAdmins(tx, (i) => adminDisputeEmail(i, ctx, reason));
}

/** Low-stock warning (threshold defined in email-templates.ts). The
 *  caller fires this only on the crossing into low stock, so admins
 *  get one warning per crossing, not one per order. */
export async function queueAdminLowStock(tx: Db, product: { id: string; title: string }, remaining: number) {
  await queueForAdmins(tx, (i) => adminLowStockEmail(i, product, remaining));
}

// ─── Sender (Resend, with retry + backoff) ───────────────────────────

function retryDelayMs(attempts: number): number {
  const base = Number(process.env.EMAIL_RETRY_BASE_MS || 60_000);
  return base * Math.pow(2, Math.max(0, attempts - 1));
}

/** Send due outbox rows through Resend when configured. Best-effort:
 *  called after API responses are computed; never throws into the
 *  request. A row is marked "sent" ONLY on a provider 2xx. */
export async function flushEmailOutbox(limit = 20): Promise<void> {
  let cfg: EmailConfig;
  try {
    cfg = await getEmailConfig();
  } catch {
    return;
  }
  if (!cfg.configured) return;
  try {
    const now = new Date();
    const rows = await prisma.emailOutbox.findMany({
      where: {
        status: "pending",
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    for (const row of rows) {
      // Atomic claim: bump nextAttemptAt to a short lease. A second
      // concurrent flusher (API routes fire flushes after responses)
      // reads the same snapshot, but its claim no longer matches once
      // this one lands — so a row is never sent twice. A crash after
      // claiming leaves the row pending and due again when the lease
      // lapses, so nothing can get stuck.
      const claim = await prisma.emailOutbox.updateMany({
        where: { id: row.id, status: "pending", nextAttemptAt: row.nextAttemptAt },
        data: { nextAttemptAt: new Date(Date.now() + 30_000) },
      });
      if (claim.count === 0) continue;
      let failure: string | null = null;
      try {
        const res = await fetch(`${cfg.apiBase}/emails`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: cfg.from,
            to: [row.toEmail],
            subject: row.subject,
            html: row.html,
            text: row.text,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          failure = `Resend ${res.status}: ${body.slice(0, 300)}`;
        }
      } catch (err) {
        failure = err instanceof Error ? err.message.slice(0, 300) : "send failed";
      }
      if (failure === null) {
        await prisma.emailOutbox.update({
          where: { id: row.id },
          data: { status: "sent", sentAt: new Date(), error: null, nextAttemptAt: null },
        });
      } else {
        const attempts = row.attempts + 1;
        if (attempts >= MAX_SEND_ATTEMPTS) {
          await prisma.emailOutbox.update({
            where: { id: row.id },
            data: { status: "failed", attempts, error: failure, nextAttemptAt: null },
          });
        } else {
          await prisma.emailOutbox.update({
            where: { id: row.id },
            data: {
              attempts,
              error: failure,
              nextAttemptAt: new Date(Date.now() + retryDelayMs(attempts)),
            },
          });
        }
      }
    }
  } catch {
    // Outbox flushing must never break the request that triggered it.
  }
}
