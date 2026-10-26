// AccountStoreOne — order creation + own-orders list.
// POST /api/orders { product_id, quantity, customer_email?, payment_method? }
//   Creates the order (stock reserved server-side). If payment_method is
//   "wallet", the wallet is charged in the same flow and delivery attempted.
// GET  /api/orders → the signed-in user's orders (admins: all, ?limit=).

import { getSessionContext, unauthorized, isResponse, requireAdmin } from "@/src/lib/auth-server";
import { createOrder, payOrderWithWallet, maybeReleaseEscrow, ServiceError } from "@/src/lib/order-service";
import { flushEmailOutbox } from "@/src/lib/mailer";
import { prisma } from "@/src/lib/db";
import { serializeRow, serializeRows } from "@/src/lib/serialize";

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized("Please sign in to place an order");
  const body = await req.json().catch(() => ({}));
  try {
    const order = await createOrder({
      userId: ctx.user.id,
      username: ctx.profile.username || ctx.user.email.split("@")[0],
      email: ctx.user.email,
      productId: String(body.product_id || body.productId || ""),
      quantity: Number(body.quantity || 1),
      customerEmail: body.customer_email || body.customerEmail,
      variantLabel: body.variant_label || body.variantLabel || undefined,
      couponCode: body.coupon_code || body.couponCode || undefined,
    });
    let final = order;
    if (body.payment_method === "wallet" || body.paymentMethod === "wallet" || body.payWithWallet === true || body.pay_with_wallet === true) {
      final = (await payOrderWithWallet(order.id, ctx.user.id)) as typeof order;
    }
    const withProduct = await prisma.order.findUnique({ where: { id: final.id }, include: { product: true } });
    const shaped = serializeRow(withProduct as unknown as Record<string, unknown>);
    const { product, ...rest } = shaped;
    void flushEmailOutbox();
    return Response.json({ order: { ...rest, products: product } }, { status: 201 });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ error: err.message }, { status: err.status });
    return Response.json({ error: err instanceof Error ? err.message : "Order failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  if (sp.get("scope") === "admin") {
    const gate = await requireAdmin(req);
    if (isResponse(gate)) return gate;
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(sp.get("limit") || 100), 500),
      include: { product: true },
    });
    const released = await Promise.all(orders.map((o) => maybeReleaseEscrow(o)));
    return Response.json({ orders: serializeRows(released as unknown as Record<string, unknown>[]) });
  }
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: ctx.user.id }, { customerEmail: ctx.user.email }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: true },
  });
  const released = await Promise.all(orders.map((o) => maybeReleaseEscrow(o)));
  const shaped = serializeRows(released as unknown as Record<string, unknown>[]).map((r) => {
    const { product, ...rest } = r;
    return { ...rest, products: product };
  });
  return Response.json({ orders: shaped });
}
