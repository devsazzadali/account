// AccountStoreOne — public activity feed data: the latest REAL paid orders
// (product title + timestamp). Usernames are returned raw and masked by the
// client, exactly as before; only orders whose payment was verified count
// as purchases.

import { prisma } from "@/src/lib/db";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: "paid" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, username: true, createdAt: true, product: { select: { title: true } } },
    });
    return Response.json({
      activities: orders.map((o) => ({
        id: o.id,
        username: o.username || "Someone",
        product_title: o.product?.title || "a product",
        created_at: o.createdAt.toISOString(),
      })),
    });
  } catch {
    return Response.json({ activities: [] });
  }
}
