// AccountStoreOne — single order read + action endpoint.
// GET  /api/orders/:id → order (owner or admin only), escrow lazily released.
// POST /api/orders/:id { action, ... } — the ONLY way order state changes:
//   buyer:  submit_payment | pay_wallet | cancel | confirm_receipt | dispute
//   admin:  verify_payment (via /api/admin/payments) | deliver | complete |
//           cancel | refund | resolve_dispute

import { getSessionContext, unauthorized, forbidden } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow } from "@/src/lib/serialize";
import {
  ServiceError,
  maybeReleaseEscrow,
  submitManualPayment,
  payOrderWithWallet,
  cancelOrder,
  confirmReceipt,
  openDispute,
  deliverManually,
  adminCompleteOrder,
  adminRefundOrder,
  resolveDispute,
} from "@/src/lib/order-service";

async function loadOrder(id: string) {
  return prisma.order.findUnique({ where: { id }, include: { product: true, dispute: true } });
}

function shape(row: Record<string, unknown>) {
  const { product, ...rest } = serializeRow(row);
  return { ...rest, products: product };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const { id } = await params;
  let order = await loadOrder(id).catch(() => null);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  const isAdmin = ctx.profile.role === "admin" || ctx.profile.role === "moderator";
  if (!isAdmin && order.userId !== ctx.user.id && order.customerEmail !== ctx.user.email) {
    return forbidden("This order belongs to another customer");
  }
  order = (await maybeReleaseEscrow(order)) as typeof order;
  const fresh = await loadOrder(id);
  return Response.json({ order: shape(fresh as unknown as Record<string, unknown>) });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const isAdmin = ctx.profile.role === "admin" || ctx.profile.role === "moderator";
  const uid = ctx.user.id;

  try {
    let result: unknown;
    switch (action) {
      case "submit_payment":
        result = await submitManualPayment({
          orderId: id,
          userId: uid,
          method: String(body.method || "bkash"),
          trxId: String(body.trx_id || body.trxId || ""),
          senderNumber: body.sender_number || body.senderNumber,
        });
        break;
      case "pay_wallet":
        result = await payOrderWithWallet(id, uid);
        break;
      case "cancel":
        result = await cancelOrder(id, { userId: uid, isAdmin });
        break;
      case "confirm_receipt":
        result = await confirmReceipt(id, uid);
        break;
      case "dispute":
        result = await openDispute(id, uid, String(body.reason || ""));
        break;
      case "deliver":
        if (!isAdmin) return forbidden();
        result = await deliverManually(id, {
          username: String(body.credential_username || body.username || ""),
          password: String(body.credential_password || body.password || ""),
          notes: body.credential_notes || body.notes,
          twoFactorSecret: body.two_factor_secret || body.twoFactorSecret || undefined,
          recoveryEmail: body.recovery_email || body.recoveryEmail || undefined,
        });
        break;
      case "complete":
        if (!isAdmin) return forbidden();
        result = await adminCompleteOrder(id);
        break;
      case "refund":
        if (!isAdmin) return forbidden();
        result = await adminRefundOrder(id);
        break;
      case "resolve_dispute":
        if (!isAdmin) return forbidden();
        result = await resolveDispute(id, body.resolution as "refunded" | "replaced" | "rejected");
        break;
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
    const fresh = await loadOrder(id);
    return Response.json({
      ok: true,
      result: result ? serializeRow(result as Record<string, unknown>) : null,
      order: fresh ? shape(fresh as unknown as Record<string, unknown>) : null,
    });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    return Response.json({ error: err instanceof Error ? err.message : "Action failed" }, { status: 500 });
  }
}
