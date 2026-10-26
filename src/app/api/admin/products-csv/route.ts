// AccountStoreOne — batch import/export for offers + inventory (P2,
// Z2U's "Upload List / Download List").
// GET  ?type=products|inventory → CSV download.
// POST { type, csv, dry_run }   → validation report; with dry_run=false
//      the rows are applied. Products upsert by id (when the id exists)
//      or by exact title; inventory rows always append as available
//      stock (and re-sync derived stock for derived products).

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { syncDerivedStock } from "@/src/lib/order-service";

/** Minimal RFC-4180-ish CSV parser (quotes, commas, CRLF). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); cell = ""; rows.push(row); row = []; }
    else cell += ch;
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  const clean = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (clean.length < 2) return [];
  const header = clean[0].map((h) => h.trim().toLowerCase());
  return clean.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
    return obj;
  });
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const type = new URL(req.url).searchParams.get("type") || "products";
  if (type === "inventory") {
    const items = await prisma.inventory.findMany({ orderBy: { createdAt: "desc" }, take: 10000 });
    const header = ["id", "product_id", "account_login", "account_password", "two_factor_secret", "recovery_email", "additional_info", "status"];
    const lines = [header.join(",")];
    for (const i of items) {
      lines.push([i.id, i.productId || "", i.accountLogin, i.accountPassword, i.twoFactorSecret || "", i.recoveryEmail || "", i.additionalInfo || "", i.status].map(csvCell).join(","));
    }
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="inventory.csv"' },
    });
  }
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 10000 });
  const header = ["id", "title", "price", "stock", "category", "game_type", "badge", "sold", "min_quantity", "delivery_eta_hours", "use_inventory_stock", "is_active", "description"];
  const lines = [header.join(",")];
  for (const p of products) {
    lines.push([
      p.id, p.title, Number(p.price).toFixed(2), p.stock, p.category || "", p.gameType || "", p.badge || "", p.sold,
      p.minQuantity, p.deliveryEtaHours ?? "", p.useInventoryStock ? "true" : "false", p.isActive ? "true" : "false", p.description || "",
    ].map(csvCell).join(","));
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="products.csv"' },
  });
}

interface RowError { row: number; message: string }

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const type = body.type === "inventory" ? "inventory" : "products";
  const dryRun = body.dry_run !== false;
  const rows = parseCsv(String(body.csv || ""));
  if (rows.length === 0) return Response.json({ error: "No data rows found in the CSV" }, { status: 422 });

  const errors: RowError[] = [];
  let created = 0;
  let updated = 0;
  const touchedProducts = new Set<string>();

  if (type === "products") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNo = i + 2;
      const title = r.title;
      const price = Number(r.price);
      if (!title) { errors.push({ row: rowNo, message: "title is required" }); continue; }
      if (!Number.isFinite(price) || price < 0) { errors.push({ row: rowNo, message: "price must be a number ≥ 0" }); continue; }
      const data: Record<string, unknown> = {
        title,
        price,
        category: r.category || null,
        gameType: r.game_type || null,
        badge: r.badge || null,
        description: r.description || null,
      };
      if (r.min_quantity) data.minQuantity = Math.max(1, Math.floor(Number(r.min_quantity)) || 1);
      if (r.delivery_eta_hours) data.deliveryEtaHours = Math.max(1, Math.floor(Number(r.delivery_eta_hours))) || null;
      if (r.use_inventory_stock) data.useInventoryStock = r.use_inventory_stock.toLowerCase() === "true";
      if (r.is_active) data.isActive = r.is_active.toLowerCase() !== "false";
      // Manual stock is only honoured for non-derived products.
      if (r.stock && data.useInventoryStock !== true) data.stock = Math.max(0, Math.floor(Number(r.stock)) || 0);

      if (dryRun) {
        const exists = r.id
          ? await prisma.product.findUnique({ where: { id: r.id }, select: { id: true } })
          : await prisma.product.findFirst({ where: { title }, select: { id: true } });
        if (exists) updated++; else created++;
        continue;
      }
      const existing = r.id
        ? await prisma.product.findUnique({ where: { id: r.id } })
        : await prisma.product.findFirst({ where: { title } });
      if (existing) {
        await prisma.product.update({ where: { id: existing.id }, data: data as never });
        updated++;
        touchedProducts.add(existing.id);
      } else {
        const p = await prisma.product.create({ data: data as never });
        created++;
        touchedProducts.add(p.id);
      }
    }
  } else {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNo = i + 2;
      if (!r.account_login || !r.account_password) { errors.push({ row: rowNo, message: "account_login and account_password are required" }); continue; }
      let productId = r.product_id || "";
      if (!productId && r.product_title) {
        const p = await prisma.product.findFirst({ where: { title: r.product_title }, select: { id: true } });
        if (!p) { errors.push({ row: rowNo, message: `product_title not found: ${r.product_title}` }); continue; }
        productId = p.id;
      }
      if (!productId) { errors.push({ row: rowNo, message: "product_id (or product_title) is required" }); continue; }
      if (dryRun) { created++; touchedProducts.add(productId); continue; }
      await prisma.inventory.create({
        data: {
          productId,
          accountLogin: r.account_login,
          accountPassword: r.account_password,
          twoFactorSecret: r.two_factor_secret || null,
          recoveryEmail: r.recovery_email || null,
          additionalInfo: r.additional_info || null,
          status: "available",
        },
      });
      created++;
      touchedProducts.add(productId);
    }
  }

  if (!dryRun) {
    for (const pid of touchedProducts) {
      await prisma.$transaction((tx) => syncDerivedStock(tx, pid));
    }
  }

  return Response.json({ ok: true, dry_run: dryRun, type, created, updated, errors, total_rows: rows.length });
}
