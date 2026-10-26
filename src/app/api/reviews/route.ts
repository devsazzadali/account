// AccountStoreOne — order-bound reviews (Z2U alignment P3).
// POST /api/reviews { order_id, rating, comment, delivery_rating?,
//   service_rating?, description_rating? }
// A review can only be written for a COMPLETED order owned by the
// caller, one review per order. This replaces the old open product-page
// form (any signed-in user could review anything).

import { getSessionContext, unauthorized, forbidden } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRow } from "@/src/lib/serialize";

function clampRating(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : null;
}

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.order_id || body.orderId || "");
  const rating = clampRating(body.rating) ?? 5;
  const comment = String(body.comment || "").trim();
  if (!orderId) return Response.json({ error: "order_id is required" }, { status: 422 });
  if (comment.length < 3) return Response.json({ error: "Please write a few words about your experience" }, { status: 422 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== ctx.user.id) return forbidden("You can only review your own orders");
  if (order.status !== "Completed") {
    return Response.json({ error: "Reviews open once your order is completed" }, { status: 409 });
  }
  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) return Response.json({ error: "You have already reviewed this order" }, { status: 409 });

  const review = await prisma.review.create({
    data: {
      productId: order.productId,
      orderId,
      userId: ctx.user.id,
      username: ctx.profile.username || ctx.user.email.split("@")[0],
      rating,
      comment,
      deliveryRating: clampRating(body.delivery_rating),
      serviceRating: clampRating(body.service_rating),
      descriptionRating: clampRating(body.description_rating),
    },
  });
  return Response.json({ review: serializeRow(review as unknown as Record<string, unknown>) }, { status: 201 });
}
