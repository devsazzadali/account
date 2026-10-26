// AccountStoreOne — admin payment-verification queue.
// GET  /api/admin/payments?status=pending → manual payment submissions
//      (order payments + wallet top-ups) awaiting review.
// POST /api/admin/payments { id, approve, note? } → verify or reject.
//      Approval is transactional: order → paid + auto-delivery attempted;
//      top-up → wallet credited with a ledger row.

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRows, serializeRow } from "@/src/lib/serialize";
import { reviewPaymentRequest, ServiceError } from "@/src/lib/order-service";
import { flushEmailOutbox } from "@/src/lib/mailer";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const status = new URL(req.url).searchParams.get("status") || "pending";
  const rows = await prisma.paymentRequest.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  // Enrich with order titles / user emails for the review UI.
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const base = serializeRow(r as unknown as Record<string, unknown>);
      let orderTitle: string | null = null;
      let userEmail: string | null = null;
      if (r.orderId) {
        const o = await prisma.order.findUnique({ where: { id: r.orderId }, include: { product: { select: { title: true } } } });
        orderTitle = o?.product?.title ?? null;
        userEmail = o?.customerEmail ?? null;
      }
      if (r.userId) {
        const p = await prisma.profile.findUnique({ where: { id: r.userId }, select: { email: true, username: true } });
        userEmail = userEmail || p?.email || null;
        (base as Record<string, unknown>).username = p?.username ?? null;
      }
      return { ...base, order_title: orderTitle, user_email: userEmail };
    }),
  );
  return Response.json({ payment_requests: enriched });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  try {
    const updated = await reviewPaymentRequest(String(body.id || ""), !!body.approve, body.note);
    void flushEmailOutbox();
    return Response.json({ ok: true, payment_request: serializeRow(updated as unknown as Record<string, unknown>) });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    return Response.json({ error: err instanceof Error ? err.message : "Review failed" }, { status: 500 });
  }
}
