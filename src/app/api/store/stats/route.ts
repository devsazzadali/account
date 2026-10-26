// AccountStoreOne — REAL store statistics for the storefront sidebar,
// the public store profile and the admin Seller Information page.
// Every number is computed from live tables — this endpoint exists
// specifically to replace the old hardcoded "45,290 reviews" fiction.
//
// Response shape:
//  - flat fields (legacy consumers)
//  - `stats`  — the storefront Sidebar card (store_name, description,
//               review aggregates, dispute rate)
//  - `seller` — the operations scoreboard for Seller Information:
//               completion %, dispute rates (7d / 30d / all), orders in
//               processing, paid revenue — all derived from orders +
//               disputes, never typed in anywhere.

import { prisma } from "@/src/lib/db";
import { getAllSettings, SETTING_KEYS } from "@/src/lib/settings-store";

const DAY = 24 * 60 * 60 * 1000;

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Number(((num / den) * 100).toFixed(2));
}

async function disputeRate(since: Date | null): Promise<number | null> {
  const orderWhere = since ? { createdAt: { gte: since } } : {};
  const disputeWhere = since ? { createdAt: { gte: since } } : {};
  const [orders, disputes] = await Promise.all([
    prisma.order.count({ where: orderWhere }),
    prisma.dispute.count({ where: disputeWhere }),
  ]);
  return pct(disputes, orders) ?? 0;
}

export async function GET() {
  try {
    const s = await getAllSettings();
    const now = Date.now();
    const [
      reviewAgg,
      positiveReviews,
      reviewCount,
      completedCount,
      canceledCount,
      totalOrders,
      processingCount,
      paidAgg,
      disputeRate7d,
      disputeRate30d,
      disputeRateAll,
      disputeRate90d,
    ] = await Promise.all([
      prisma.review.aggregate({ _avg: { rating: true }, where: { isHidden: false } }),
      prisma.review.count({ where: { rating: { gte: 4 }, isHidden: false } }),
      prisma.review.count({ where: { isHidden: false } }),
      prisma.order.count({ where: { status: "Completed" } }),
      prisma.order.count({ where: { status: "Canceled" } }),
      prisma.order.count(),
      prisma.order.count({
        where: { paymentStatus: "paid", status: { in: ["PREPARING", "Delivering"] } },
      }),
      prisma.order.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: "paid" } }),
      disputeRate(new Date(now - 7 * DAY)),
      disputeRate(new Date(now - 30 * DAY)),
      disputeRate(null),
      disputeRate(new Date(now - 90 * DAY)),
    ]);

    const averageRating = reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null;
    // Completion rate: of the orders that were not canceled, how many
    // reached Completed. (The old formula divided by ALL orders and
    // counted non-canceled as "completed" — fiction, now fixed.)
    const completionRate = pct(completedCount, totalOrders - canceledCount);
    const storeOpen = s[SETTING_KEYS.storeOpen] !== "false";

    const seller = {
      completion_rate: completionRate,
      dispute_rate_7d: disputeRate7d,
      dispute_rate_30d: disputeRate30d,
      dispute_rate_all: disputeRateAll,
      orders_in_processing: processingCount,
      total_orders: totalOrders,
      completed_orders: completedCount,
      canceled_orders: canceledCount,
      paid_revenue: Number(paidAgg._sum.totalPrice || 0),
      total_reviews: reviewCount,
      average_rating: averageRating,
    };

    return Response.json({
      store_name: s[SETTING_KEYS.storeName],
      store_description: s[SETTING_KEYS.storeDescription],
      support_email: s[SETTING_KEYS.supportEmail],
      store_logo_url: s[SETTING_KEYS.storeLogoUrl] || null,
      store_banner_url: s[SETTING_KEYS.storeBannerUrl] || null,
      store_open: storeOpen,
      support_hours: s[SETTING_KEYS.supportHours] || null,
      total_reviews: reviewCount,
      average_rating: averageRating,
      completed_orders: completedCount,
      canceled_orders: canceledCount,
      total_orders: totalOrders,
      order_completion_rate: completionRate,
      dispute_rate_90d: disputeRate90d ?? 0,
      stats: {
        store_name: s[SETTING_KEYS.storeName],
        description: s[SETTING_KEYS.storeDescription],
        store_logo_url: s[SETTING_KEYS.storeLogoUrl] || null,
        total_reviews: reviewCount,
        average_rating: averageRating,
        positive_pct: reviewCount > 0 ? pct(positiveReviews, reviewCount) : null,
        completed_orders: completedCount,
        dispute_rate_90d: disputeRate90d,
        store_open: storeOpen,
      },
      seller,
    });
  } catch {
    return Response.json({
      store_name: "Account Store One",
      store_description: "",
      support_email: "",
      store_logo_url: null,
      store_banner_url: null,
      store_open: true,
      support_hours: null,
      total_reviews: 0,
      average_rating: null,
      completed_orders: 0,
      canceled_orders: 0,
      total_orders: 0,
      order_completion_rate: null,
      dispute_rate_90d: 0,
      stats: null,
      seller: null,
    });
  }
}
