// AccountStoreOne — admin reports (ধাপ ৫ঘ).
//
// ONE computation home for every downloadable report, so the CSV, the
// PDF, the buyer invoice and the dashboard can never disagree:
//
//   - Paid revenue reuses summarizeOrders() from order-summary.ts — the
//     same function /api/store/stats ships to the dashboard. It counts
//     an order only while its paymentStatus is CURRENTLY "paid", so a
//     refunded order never leaks into revenue (audit item 1: verified
//     against a direct DB computation — see aso_reports REPORT.md).
//   - Refunds are read from the wallet ledger (wallet_transactions,
//     type = "refund") — the append-only record of money actually
//     returned to buyers, incl. partial-remainder refunds, whose orders
//     stay "paid". Full refunds credit the FULL total (service fee
//     included), so a fully refunded order retains no fee.
//   - Service fees retained = the recorded orders.service_fee summed
//     over orders paid in the period whose payment was not fully
//     refunded since (partial refunds keep the fee: cancelRemainder's
//     formula excludes it on purpose).
//   - Escrow held is a CURRENT snapshot (money received, not yet
//     released or refunded): paymentStatus "paid" with escrowState in
//     in_escrow / processing / delivered / disputed.
//
// Period semantics: `from`/`to` are YYYY-MM-DD calendar days (UTC),
// covering [from 00:00, to + 1 day). Orders report + by-status counts
// key on createdAt; revenue/fees key on paidAt; refunds and the wallet
// ledger key on the transaction's createdAt. Defaults: current month.

import { prisma } from "@/src/lib/db";
import { SERVICE_FEE } from "@/src/lib/order-service";
import { summarizeOrders } from "@/src/lib/order-summary";
import { orderCode } from "@/src/lib/order-ref";

export const ESCROW_HELD_STATES = ["in_escrow", "processing", "delivered", "disputed"] as const;

const round2 = (v: number) => Math.round(v * 100) / 100;
export const money = (v: number) => round2(v).toFixed(2);

export interface ReportPeriod {
  from: Date;
  to: Date; // exclusive
  fromDay: string;
  toDay: string; // inclusive day, as given
  label: string;
}

function dayStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDay(v: string | null): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parsePeriod(sp: URLSearchParams): ReportPeriod {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const from = parseDay(sp.get("from")) || monthStart;
  const toDay = parseDay(sp.get("to")) || now;
  const to = new Date(toDay.getTime() + 24 * 60 * 60 * 1000);
  return {
    from,
    to,
    fromDay: dayStr(from),
    toDay: dayStr(toDay),
    label: `${dayStr(from)} to ${dayStr(toDay)}`,
  };
}

// ── Finance / sales summary ──────────────────────────────────────────

export interface FinanceSummary {
  period: ReportPeriod;
  /** Orders whose payment landed in the period and is still "paid". */
  paidCount: number;
  paidRevenue: number;
  /** Every order paid in the period, incl. ones refunded since. */
  grossPaidCount: number;
  /** Of those, fully refunded since (fee returned with the refund). */
  refundedSinceCount: number;
  /** Money actually returned to buyers in the period (wallet ledger). */
  refundsCount: number;
  refundsTotal: number;
  /** $0.50 retained per period-paid order not fully refunded. */
  feesRetained: number;
  /** Current snapshot: paid money still held in escrow. */
  escrowHeld: number;
  escrowHeldCount: number;
  /** Orders created in the period, grouped by current status. */
  ordersCreated: number;
  byStatus: { status: string; count: number; total: number }[];
}

export async function financeSummary(period: ReportPeriod): Promise<FinanceSummary> {
  const { from, to } = period;
  const [paidRows, refundAgg, escrowAgg, createdRows] = await Promise.all([
    prisma.order.findMany({
      where: { paidAt: { gte: from, lt: to } },
      select: { status: true, paymentStatus: true, totalPrice: true, serviceFee: true },
    }),
    prisma.walletTransaction.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { type: "refund", createdAt: { gte: from, lt: to } },
    }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      _count: true,
      where: { paymentStatus: "paid", escrowState: { in: [...ESCROW_HELD_STATES] } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: { status: true, totalPrice: true },
    }),
  ]);

  // Canonical revenue: the dashboard's own function over the same rows.
  const summary = summarizeOrders(
    paidRows.map((o) => ({ status: o.status, paymentStatus: o.paymentStatus, totalPrice: Number(o.totalPrice) })),
  );
  const refundedSinceCount = paidRows.filter((o) => o.paymentStatus === "refunded").length;

  const statusMap = new Map<string, { count: number; total: number }>();
  for (const o of createdRows) {
    const cur = statusMap.get(o.status) || { count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(o.totalPrice) || 0;
    statusMap.set(o.status, cur);
  }

  return {
    period,
    paidCount: summary.paidCount,
    paidRevenue: summary.paidRevenue,
    grossPaidCount: paidRows.length,
    refundedSinceCount,
    refundsCount: refundAgg._count,
    refundsTotal: round2(Number(refundAgg._sum.amount || 0)),
    // Retained fees = the RECORDED fee of each period-paid order that
    // was not (fully) refunded — orders keep the fee they were charged.
    feesRetained: round2(
      paidRows
        .filter((o) => o.paymentStatus !== "refunded")
        .reduce((sum, o) => sum + Number(o.serviceFee ?? SERVICE_FEE), 0),
    ),
    escrowHeld: round2(Number(escrowAgg._sum.totalPrice || 0)),
    escrowHeldCount: escrowAgg._count,
    ordersCreated: createdRows.length,
    byStatus: [...statusMap.entries()]
      .map(([status, v]) => ({ status, count: v.count, total: round2(v.total) }))
      .sort((a, b) => b.count - a.count),
  };
}

// ── Orders report ────────────────────────────────────────────────────

export interface OrderReportRow {
  code: string;
  date: string;
  buyer: string;
  email: string;
  product: string;
  qty: number;
  unit: number;
  discount: number;
  fee: number;
  total: number;
  paymentStatus: string;
  status: string;
}

export async function ordersReport(period: ReportPeriod): Promise<OrderReportRow[]> {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: period.from, lt: period.to } },
    orderBy: { createdAt: "asc" },
    include: { product: { select: { title: true } } },
  });
  return orders.map((o) => {
    const total = Number(o.totalPrice);
    const discount = Number(o.discountAmount || 0);
    // Canonical split (same as finance-export + the buyer invoice):
    // subtotal = total + discount − the order's recorded fee;
    // unit = subtotal ÷ qty.
    const fee = Number(o.serviceFee ?? SERVICE_FEE);
    const subtotal = total + discount - fee;
    return {
      code: orderCode(o.id),
      date: o.createdAt.toISOString(),
      buyer: o.username || "",
      email: o.customerEmail || "",
      product: o.product?.title || "",
      qty: o.quantity,
      unit: o.quantity > 0 ? round2(subtotal / o.quantity) : round2(subtotal),
      discount,
      fee,
      total,
      paymentStatus: o.paymentStatus,
      status: o.status,
    };
  });
}

// ── Inventory report (current snapshot) ──────────────────────────────

export interface InventoryReport {
  totals: {
    products: number;
    active: number;
    outOfStock: number;
    stockUnits: number;
    soldUnits: number;
    inventoryUnits: { status: string; count: number }[];
  };
  rows: {
    product: string;
    category: string;
    price: number;
    stock: number;
    sold: number;
    fulfilment: string;
    active: boolean;
  }[];
}

export async function inventoryReport(): Promise<InventoryReport> {
  const [products, unitGroups] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] }),
    prisma.inventory.groupBy({ by: ["status"], _count: true }),
  ]);
  return {
    totals: {
      products: products.length,
      active: products.filter((p) => p.isActive).length,
      outOfStock: products.filter((p) => p.stock <= 0).length,
      stockUnits: products.reduce((s, p) => s + (p.stock || 0), 0),
      soldUnits: products.reduce((s, p) => s + (p.sold || 0), 0),
      inventoryUnits: unitGroups
        .map((g) => ({ status: g.status, count: g._count }))
        .sort((a, b) => b.count - a.count),
    },
    rows: products.map((p) => ({
      product: p.title,
      category: p.category || "",
      price: Number(p.price),
      stock: p.stock,
      sold: p.sold,
      fulfilment: p.fulfilmentType,
      active: p.isActive,
    })),
  };
}

// ── Wallet ledger ────────────────────────────────────────────────────

export interface WalletLedgerRow {
  date: string;
  user: string;
  email: string;
  type: string;
  method: string;
  amount: number;
  reference: string;
  note: string;
  status: string;
}

export async function walletLedger(period: ReportPeriod): Promise<WalletLedgerRow[]> {
  const txs = await prisma.walletTransaction.findMany({
    where: { createdAt: { gte: period.from, lt: period.to } },
    orderBy: { createdAt: "asc" },
    include: { wallet: { include: { user: { select: { username: true, email: true } } } } },
  });
  return txs.map((t) => ({
    date: t.createdAt.toISOString(),
    user: t.wallet?.user?.username || "",
    email: t.wallet?.user?.email || "",
    type: t.type,
    method: t.method || "",
    amount: Number(t.amount),
    reference: t.referenceId ? orderCode(t.referenceId) : "",
    note: t.note || "",
    status: t.status,
  }));
}

// ── CSV ──────────────────────────────────────────────────────────────

export function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}
