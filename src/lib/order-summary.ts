// AccountStoreOne — canonical admin order summary (Fix Round 5, item 3).
//
// THE single definition of "how many orders, in which state" for every
// admin surface. Before this module each screen counted differently:
//   - Admin Home filtered the full orders list in the browser, comparing
//     'Completed' case-insensitively but 'Canceled' exactly;
//   - /api/store/stats (Seller Information + storefront) counted with
//     exact-case Prisma filters, so legacy lowercase rows ('completed',
//     'canceled' — the old system's spelling, which the UI defensively
//     lowercases in several places) vanished from its totals;
//   - Sold Orders derived its tab counts from its own predicates;
//   - Messages → Order History matched orders by username only, while
//     orders are also keyed by user_id / customer_email — so a buyer's
//     history could show orders the Sold Orders screen total missed
//     and vice versa.
// All of those now derive from summarizeOrders() over the same rows,
// computed server-side in /api/store/stats and shipped as
// `orders_summary`. Status comparisons here are case-insensitive for
// the terminal states so legacy rows count exactly once, everywhere.

export interface OrderSummaryInput {
  status?: string | null;
  paymentStatus?: string | null;
  totalPrice?: number | null;
}

export interface OrderSummary {
  total: number;
  /** Awaiting the store: payment proof to verify, or unpaid new orders. */
  pending: number;
  /** Paid and being worked: PREPARING or Delivering. */
  waiting: number;
  completed: number;
  disputed: number;
  canceled: number;
  paidCount: number;
  paidRevenue: number;
  /** Verify / deliver / dispute — the Home "Pending Action" number. */
  awaitingAction: number;
  /** completed ÷ non-canceled, percent, 0 when undefined. */
  successRate: number;
}

const lc = (v: string | null | undefined) => (v || "").toLowerCase();

export function summarizeOrders(rows: OrderSummaryInput[]): OrderSummary {
  let pending = 0,
    waiting = 0,
    completed = 0,
    disputed = 0,
    canceled = 0,
    paidCount = 0,
    paidRevenue = 0,
    awaitingAction = 0;

  for (const o of rows) {
    const s = lc(o.status);
    const ps = o.paymentStatus || "";
    if (s === "completed") completed++;
    if (s === "canceled" || s === "cancelled") canceled++;
    if (s === "disputed") disputed++;
    if (ps === "pending_verification" || (ps === "unpaid" && s === "new order")) pending++;
    if (ps === "paid" && (s === "preparing" || s === "delivering")) waiting++;
    if (ps === "paid") {
      paidCount++;
      paidRevenue += Number(o.totalPrice) || 0;
    }
    if (ps === "pending_verification" || s === "disputed" || (ps === "paid" && s === "preparing")) {
      awaitingAction++;
    }
  }

  const total = rows.length;
  const denom = total - canceled;
  return {
    total,
    pending,
    waiting,
    completed,
    disputed,
    canceled,
    paidCount,
    paidRevenue: Math.round(paidRevenue * 100) / 100,
    awaitingAction,
    successRate: denom > 0 ? Math.round((completed / denom) * 100) : 0,
  };
}
