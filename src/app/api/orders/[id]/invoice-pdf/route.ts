// AccountStoreOne — buyer invoice PDF (ধাপ ৫ঘ).
// GET /api/orders/:id/invoice-pdf → branded PDF of the buyer's own
// order. Ownership mirrors GET /api/orders/:id exactly: session
// required (401), unknown order 404, another customer's order 403,
// staff standing allowed. Figures use the canonical split from
// order-service (subtotal = total + discount − $0.50 service fee) —
// the same numbers the invoice page and finance export show.

import { getSessionContext, unauthorized, forbidden, isDeactivatedManager } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { getStorefrontSettings } from "@/src/lib/settings-store";
import { SERVICE_FEE } from "@/src/lib/order-service";
import { orderCode } from "@/src/lib/order-ref";
import { money } from "@/src/lib/reports";
import { renderBrandedPdf, fetchLogo } from "@/src/lib/report-pdf";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { product: { select: { title: true } } },
  });
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const role = ctx.profile.role;
  const staff = (role === "admin" || role === "moderator") && !(await isDeactivatedManager(ctx));
  if (!staff && order.userId !== ctx.user.id && order.customerEmail !== ctx.user.email) {
    return forbidden("This order belongs to another customer");
  }

  const brand = (await getStorefrontSettings()).brand;
  const total = Number(order.totalPrice);
  const discount = Number(order.discountAmount || 0);
  const subtotal = total + discount - SERVICE_FEE;
  const unit = order.quantity > 0 ? subtotal / order.quantity : subtotal;
  const code = orderCode(order.id);
  const logo = await fetchLogo(brand.logoUrl);

  const pdf = await renderBrandedPdf({
    storeName: brand.name,
    logoBytes: logo?.bytes ?? null,
    logoType: logo?.type ?? null,
    title: `Invoice ${code}`,
    metaLines: [
      `Order date: ${order.createdAt.toUTCString()}`,
      `Billed to: ${order.username || "Customer"}${order.customerEmail ? ` <${order.customerEmail}>` : ""}`,
      `Payment: ${order.paymentStatus}${order.paymentMethod ? ` via ${order.paymentMethod}` : ""}${order.paidAt ? ` · paid ${order.paidAt.toUTCString()}` : ""}`,
      `Order status: ${order.status}`,
    ],
    tables: [
      {
        columns: [
          { title: "Item", w: 4.2 },
          { title: "Qty", w: 0.7, align: "center" },
          { title: "Unit", w: 1.1, align: "right" },
          { title: "Amount", w: 1.3, align: "right" },
        ],
        rows: [
          [
            `${order.product?.title || "Product"}${order.variantLabel ? ` — ${order.variantLabel}` : ""}`,
            String(order.quantity),
            `$${money(unit)}`,
            `$${money(subtotal)}`,
          ],
        ],
      },
      {
        columns: [
          { title: "", w: 5 },
          { title: "Amount", w: 1.3, align: "right" },
        ],
        rows: [
          ["Subtotal", `$${money(subtotal)}`],
          ...(discount > 0 ? [[`Coupon ${order.couponCode || ""} discount`, `-$${money(discount)}`]] : []),
          ["Service fee", `$${money(SERVICE_FEE)}`],
        ],
        totalsRow: ["Total (USD)", `$${money(total)}`],
      },
    ],
    footnote: "Payment is held in escrow and released on your confirmation or 48 hours after delivery. Thank you for your purchase.",
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${code}.pdf"`,
    },
  });
}
