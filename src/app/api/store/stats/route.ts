// AccountStoreOne — REAL store statistics for the storefront sidebar and
// trust surfaces. Every number is computed from live tables — this endpoint
// exists specifically to replace the old hardcoded "45,290 reviews" fiction.

import { prisma } from "@/src/lib/db";
import { getSetting, SETTING_KEYS } from "@/src/lib/settings-store";

export async function GET() {
  try {
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [reviewAgg, reviewCount, completedCount, totalOrders, disputes90, orders90, storeName, storeDescription] =
      await Promise.all([
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.review.count(),
        prisma.order.count({ where: { status: "Completed" } }),
        prisma.order.count(),
        prisma.dispute.count({ where: { createdAt: { gte: since90 } } }),
        prisma.order.count({ where: { createdAt: { gte: since90 } } }),
        getSetting(SETTING_KEYS.storeName),
        getSetting(SETTING_KEYS.storeDescription),
      ]);
    const completionBase = totalOrders - (await prisma.order.count({ where: { status: "Canceled" } }));
    return Response.json({
      store_name: storeName,
      store_description: storeDescription,
      total_reviews: reviewCount,
      average_rating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
      completed_orders: completedCount,
      total_orders: totalOrders,
      order_completion_rate: completionBase > 0 ? Number((((completionBase) / Math.max(totalOrders, 1)) * 100).toFixed(2)) : null,
      dispute_rate_90d: orders90 > 0 ? Number(((disputes90 / orders90) * 100).toFixed(2)) : 0,
    });
  } catch {
    return Response.json({
      store_name: "Account Store One",
      store_description: "",
      total_reviews: 0,
      average_rating: null,
      completed_orders: 0,
      total_orders: 0,
      order_completion_rate: null,
      dispute_rate_90d: 0,
    });
  }
}
