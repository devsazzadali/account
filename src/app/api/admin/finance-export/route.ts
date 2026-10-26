// AccountStoreOne — finance export (Z2U alignment P4).
// GET → CSV of settled orders (paid / refunded) with the canonical
// total_price split into subtotal / discount / service fee, so the
// store's books reconcile exactly with what buyers were charged.

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { SERVICE_FEE } from "@/src/lib/order-service";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const orders = await prisma.order.findMany({
    where: { paymentStatus: { in: ["paid", "refunded"] } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { product: { select: { title: true } } },
  });
  const header = [
    "order_id", "created_at", "paid_at", "product", "variant", "buyer", "customer_email",
    "quantity", "subtotal", "discount", "coupon_code", "service_fee", "total",
    "payment_status", "payment_method", "status", "escrow_state",
  ];
  const lines = [header.join(",")];
  for (const o of orders) {
    const total = Number(o.totalPrice);
    const discount = Number(o.discountAmount || 0);
    const subtotal = total + discount - SERVICE_FEE;
    lines.push([
      o.id,
      o.createdAt.toISOString(),
      o.paidAt ? o.paidAt.toISOString() : "",
      o.product?.title || "",
      o.variantLabel || "",
      o.username || "",
      o.customerEmail || "",
      o.quantity,
      subtotal.toFixed(2),
      discount.toFixed(2),
      o.couponCode || "",
      SERVICE_FEE.toFixed(2),
      total.toFixed(2),
      o.paymentStatus,
      o.paymentMethod || "",
      o.status,
      o.escrowState,
    ].map(csvCell).join(","));
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
