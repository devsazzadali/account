// AccountStoreOne — coupon preview for checkout (Z2U alignment P5).
// POST /api/coupons/validate { code, product_id, quantity }
// Runs the SAME server-side pricing as order creation (priceCoupon), so
// the discount shown at checkout is the discount that will be charged.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { priceCoupon, parseVariants, ServiceError } from "@/src/lib/order-service";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const productId = String(body.product_id || body.productId || "");
  const qty = Math.max(1, Math.floor(Number(body.quantity || 1)));
  if (!code || !productId) return Response.json({ error: "code and product_id are required" }, { status: 422 });
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
  let unit = new Prisma.Decimal(product.price);
  if (body.variant_label) {
    const v = parseVariants(product.variants).find((x) => x.label === body.variant_label);
    if (v) unit = unit.add(v.priceDelta);
  }
  const subtotal = unit.mul(qty);
  try {
    const { coupon, discount } = await prisma.$transaction((tx) => priceCoupon(tx, code, ctx.user.id, product, subtotal));
    return Response.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount: Number(discount),
      subtotal: Number(subtotal),
    });
  } catch (err) {
    if (err instanceof ServiceError) return Response.json({ valid: false, error: err.message }, { status: err.status });
    return Response.json({ valid: false, error: "Could not validate this coupon" }, { status: 500 });
  }
}
