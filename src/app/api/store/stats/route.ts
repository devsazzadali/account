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
import { summarizeOrders } from "@/src/lib/order-summary";

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
      orderRows,
      disputeRate7d,
      disputeRate30d,
      disputeRateAll,
      disputeRate90d,
    ] = await Promise.all([
      prisma.review.aggregate({ _avg: { rating: true }, where: { isHidden: false } }),
      prisma.review.count({ where: { rating: { gte: 4 }, isHidden: false } }),
      prisma.review.count({ where: { isHidden: false } }),
      // Fix Round 5 (item 3): ONE canonical order summary for every
      // consumer of this endpoint (Seller Information, storefront,
      // admin Home, Sold Orders counts). Computed by summarizeOrders
      // with case-insensitive terminal-state matching — the previous
      // exact-case Prisma counts here disagreed with the admin
      // screens' client-side counts whenever legacy rows carried
      // lowercase statuses.
      prisma.order.findMany({ select: { status: true, paymentStatus: true, totalPrice: true, createdAt: true } }),
      disputeRate(new Date(now - 7 * DAY)),
      disputeRate(new Date(now - 30 * DAY)),
      disputeRate(null),
      disputeRate(new Date(now - 90 * DAY)),
    ]);

    const summary = summarizeOrders(
      orderRows.map((o) => ({ status: o.status, paymentStatus: o.paymentStatus, totalPrice: Number(o.totalPrice) || 0 })),
    );
    const completedCount = summary.completed;
    const canceledCount = summary.canceled;
    const totalOrders = summary.total;
    const processingCount = summary.waiting;
    const paidRevenue = summary.paidRevenue;

    // Fix Round 6 (video-gap #8): sales by day — PAID orders bucketed
    // by order date (UTC), last 14 days including today, zero-filled.
    // Real data only: days without paid sales report 0, and the admin
    // chart renders an honest empty state when the whole window is 0.
    const salesByDay: { date: string; orders: number; revenue: number }[] = [];
    {
      const byDay = new Map<string, { orders: number; revenue: number }>();
      for (const o of orderRows) {
        if (o.paymentStatus !== "paid") continue;
        const key = o.createdAt.toISOString().slice(0, 10);
        const cell = byDay.get(key) || { orders: 0, revenue: 0 };
        cell.orders += 1;
        cell.revenue += Number(o.totalPrice) || 0;
        byDay.set(key, cell);
      }
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * DAY);
        const key = d.toISOString().slice(0, 10);
        const cell = byDay.get(key) || { orders: 0, revenue: 0 };
        salesByDay.push({ date: key, orders: cell.orders, revenue: Math.round(cell.revenue * 100) / 100 });
      }
    }

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
      paid_revenue: paidRevenue,
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
      // Fix Round 5 (item 3): the canonical summary, consumed by the
      // admin Home + Sold Orders so their counts can never diverge
      // from Seller Information / the storefront again.
      orders_summary: summary,
      order_completion_rate: completionRate,
      sales_by_day: salesByDay,
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
      orders_summary: null,
      sales_by_day: [],
      order_completion_rate: null,
      dispute_rate_90d: 0,
      stats: null,
      seller: null,
    });
  }
}
