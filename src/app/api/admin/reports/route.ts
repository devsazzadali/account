// AccountStoreOne — admin reports download (ধাপ ৫ঘ).
// GET /api/admin/reports?kind=finance|orders|inventory|wallet
//     &format=csv|pdf&from=YYYY-MM-DD&to=YYYY-MM-DD
// Full-admin only (requireAdminStrict — managers are order-scoped and
// get 403). All figures come from src/lib/reports.ts, the single
// computation home shared with the dashboard's order-summary, so a
// report can never disagree with the admin home numbers.

import { requireAdminStrict, isResponse } from "@/src/lib/auth-server";
import { getStorefrontSettings } from "@/src/lib/settings-store";
import {
  parsePeriod,
  financeSummary,
  ordersReport,
  inventoryReport,
  walletLedger,
  toCsv,
  money,
} from "@/src/lib/reports";
import { renderBrandedPdf, fetchLogo, type PdfTable } from "@/src/lib/report-pdf";

const KINDS = ["finance", "orders", "inventory", "wallet"] as const;
type Kind = (typeof KINDS)[number];

const TITLES: Record<Kind, string> = {
  finance: "Finance & Sales Summary",
  orders: "Orders Report",
  inventory: "Inventory Report",
  wallet: "Wallet Ledger",
};

export async function GET(req: Request) {
  const gate = await requireAdminStrict(req);
  if (isResponse(gate)) return gate;

  const sp = new URL(req.url).searchParams;
  const kind = (sp.get("kind") || "finance") as Kind;
  const format = sp.get("format") || "csv";
  if (!KINDS.includes(kind)) return Response.json({ error: "Unknown report kind" }, { status: 400 });
  if (format !== "csv" && format !== "pdf") return Response.json({ error: "format must be csv or pdf" }, { status: 400 });

  const period = parsePeriod(sp);
  const brand = (await getStorefrontSettings()).brand;
  const slug = kind === "inventory" ? "current" : `${period.fromDay}_${period.toDay}`;
  const filename = `aso-${kind}-${slug}.${format}`;

  let csv: string | null = null;
  let tables: PdfTable[] = [];
  let footnote: string | undefined;

  if (kind === "finance") {
    const f = await financeSummary(period);
    csv = toCsv(
      ["metric", "value"],
      [
        ["period", period.label],
        ["paid_revenue", money(f.paidRevenue)],
        ["paid_orders", f.paidCount],
        ["orders_paid_in_period_incl_later_refunded", f.grossPaidCount],
        ["of_those_fully_refunded_since", f.refundedSinceCount],
        ["refunds_paid_out", money(f.refundsTotal)],
        ["refund_transactions", f.refundsCount],
        ["service_fees_retained", money(f.feesRetained)],
        ["escrow_held_now", money(f.escrowHeld)],
        ["escrow_held_orders_now", f.escrowHeldCount],
        ["orders_created_in_period", f.ordersCreated],
        ...f.byStatus.map((s) => [`orders_status_${s.status}`, `${s.count} (${money(s.total)})`]),
      ],
    );
    tables = [
      {
        heading: "Period figures",
        columns: [
          { title: "Metric", w: 3 },
          { title: "Value", w: 1.4, align: "right" },
          { title: "Notes", w: 3.4 },
        ],
        rows: [
          ["Paid revenue", `$${money(f.paidRevenue)}`, `${f.paidCount} orders paid in period, still paid`],
          ["Orders paid in period", String(f.grossPaidCount), "including orders refunded since"],
          ["Fully refunded since", String(f.refundedSinceCount), "fee returned inside each full refund"],
          ["Refunds paid out", `$${money(f.refundsTotal)}`, `${f.refundsCount} wallet refund transactions in period`],
          ["Service fees retained", `$${money(f.feesRetained)}`, "$0.50 per period-paid order not fully refunded"],
          ["Orders created in period", String(f.ordersCreated), "all payment states"],
        ],
      },
      {
        heading: "Orders created in period — by current status",
        columns: [
          { title: "Status", w: 3 },
          { title: "Orders", w: 1.2, align: "right" },
          { title: "Total value", w: 1.6, align: "right" },
        ],
        rows: f.byStatus.map((s) => [s.status, String(s.count), `$${money(s.total)}`]),
        totalsRow: ["All statuses", String(f.ordersCreated), `$${money(f.byStatus.reduce((a, s) => a + s.total, 0))}`],
      },
      {
        heading: "Current snapshot",
        columns: [
          { title: "Metric", w: 3 },
          { title: "Value", w: 1.4, align: "right" },
          { title: "Notes", w: 3.4 },
        ],
        rows: [["Escrow held now", `$${money(f.escrowHeld)}`, `${f.escrowHeldCount} paid orders awaiting release`]],
      },
    ];
    footnote = "Revenue counts orders whose payment is currently 'paid' (the dashboard definition); refunds are wallet-ledger payouts in the period.";
  }

  if (kind === "orders") {
    const rows = await ordersReport(period);
    csv = toCsv(
      ["order", "date", "buyer", "email", "product", "qty", "unit_price", "discount", "service_fee", "total", "payment_status", "status"],
      rows.map((r) => [r.code, r.date, r.buyer, r.email, r.product, r.qty, money(r.unit), money(r.discount), money(r.fee), money(r.total), r.paymentStatus, r.status]),
    );
    const tq = rows.reduce((s, r) => s + r.qty, 0);
    const td = rows.reduce((s, r) => s + r.discount, 0);
    const tf = rows.reduce((s, r) => s + r.fee, 0);
    const tt = rows.reduce((s, r) => s + r.total, 0);
    tables = [
      {
        columns: [
          { title: "Order", w: 1.3 },
          { title: "Date", w: 1.1 },
          { title: "Buyer", w: 1.3 },
          { title: "Product", w: 3.1 },
          { title: "Qty", w: 0.5, align: "center" },
          { title: "Unit", w: 0.85, align: "right" },
          { title: "Disc.", w: 0.75, align: "right" },
          { title: "Fee", w: 0.65, align: "right" },
          { title: "Total", w: 0.9, align: "right" },
          { title: "Payment", w: 1.55 },
          { title: "Status", w: 1.1 },
        ],
        rows: rows.map((r) => [
          r.code,
          r.date.slice(0, 10),
          r.buyer,
          r.product,
          String(r.qty),
          `$${money(r.unit)}`,
          `$${money(r.discount)}`,
          `$${money(r.fee)}`,
          `$${money(r.total)}`,
          r.paymentStatus,
          r.status,
        ]),
        totalsRow: ["TOTAL", "", "", `${rows.length} orders`, String(tq), "", `$${money(td)}`, `$${money(tf)}`, `$${money(tt)}`, "", ""],
      },
    ];
    footnote = "Totals cover every order created in the period, paid and unpaid. Unit price = (total + discount - $0.50 fee) / qty, the canonical split.";
  }

  if (kind === "inventory") {
    const inv = await inventoryReport();
    csv = toCsv(
      ["product", "category", "price", "stock", "sold", "fulfilment", "active"],
      inv.rows.map((r) => [r.product, r.category, money(r.price), r.stock, r.sold, r.fulfilment, r.active ? "yes" : "no"]),
    );
    tables = [
      {
        heading: "Stock summary",
        columns: [
          { title: "Metric", w: 3 },
          { title: "Value", w: 1.4, align: "right" },
          { title: "Notes", w: 3.4 },
        ],
        rows: [
          ["Products", String(inv.totals.products), `${inv.totals.active} active listings`],
          ["Out of stock", String(inv.totals.outOfStock), "listings with zero stock"],
          ["Stock units (listings)", String(inv.totals.stockUnits), "sum of product stock counters"],
          ["Units sold (lifetime)", String(inv.totals.soldUnits), "sum of product sold counters"],
          ...inv.totals.inventoryUnits.map((u) => [`Credential units — ${u.status}`, String(u.count), "tracked inventory pool"]),
        ],
      },
      {
        heading: "Products",
        columns: [
          { title: "Product", w: 3.4 },
          { title: "Category", w: 1.5 },
          { title: "Price", w: 0.8, align: "right" },
          { title: "Stock", w: 0.7, align: "right" },
          { title: "Sold", w: 0.7, align: "right" },
          { title: "Type", w: 0.9 },
          { title: "Active", w: 0.7, align: "center" },
        ],
        rows: inv.rows.map((r) => [r.product, r.category, `$${money(r.price)}`, String(r.stock), String(r.sold), r.fulfilment, r.active ? "Yes" : "No"]),
      },
    ];
    footnote = "Inventory is a current snapshot at generation time (no period applies).";
  }

  if (kind === "wallet") {
    const rows = await walletLedger(period);
    csv = toCsv(
      ["date", "user", "email", "type", "method", "amount", "reference", "note", "status"],
      rows.map((r) => [r.date, r.user, r.email, r.type, r.method, money(r.amount), r.reference, r.note, r.status]),
    );
    const credits = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const debits = rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
    const refundSum = rows.filter((r) => r.type === "refund").reduce((s, r) => s + r.amount, 0);
    tables = [
      {
        columns: [
          { title: "Date", w: 1.05 },
          { title: "User", w: 1.35 },
          { title: "Type", w: 1.05 },
          { title: "Method", w: 0.85 },
          { title: "Amount", w: 0.9, align: "right" },
          { title: "Reference", w: 1.25 },
          { title: "Note", w: 3.4 },
        ],
        rows: rows.map((r) => [r.date.slice(0, 10), r.user, r.type, r.method, `$${money(r.amount)}`, r.reference, r.note]),
        totalsRow: ["TOTAL", "", `${rows.length} entries`, "", `$${money(credits + debits)}`, "", `credits $${money(credits)} · debits $${money(debits)}`],
      },
    ];
    footnote = `Amounts are signed as stored in the ledger: credits positive, debits negative. Period totals — credits $${money(credits)}, debits $${money(debits)}, refunds $${money(refundSum)}, net $${money(credits + debits)}.`;
  }

  if (format === "csv") {
    return new Response(csv ?? "", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const logo = await fetchLogo(brand.logoUrl);
  const pdf = await renderBrandedPdf({
    storeName: brand.name,
    logoBytes: logo?.bytes ?? null,
    logoType: logo?.type ?? null,
    title: TITLES[kind],
    landscape: kind !== "finance",
    metaLines: [
      kind === "inventory" ? "Current snapshot" : `Period: ${period.label}`,
      `Generated: ${new Date().toUTCString()}`,
    ],
    tables,
    footnote,
  });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
