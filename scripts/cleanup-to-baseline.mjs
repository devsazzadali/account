#!/usr/bin/env node
/**
 * Restore the exact handover baseline after QA runs:
 *   - catalog intact: 18 products / 8 categories / 132 inventory (all available)
 *   - catalog product stock/sold counters reset to the seed manifest values
 *   - every transactional table empty, profiles empty, Neon Auth users empty
 *   - store_settings reduced to the single original row (store_open = "true")
 * Usage: node --env-file=.env.local scripts/cleanup-to-baseline.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);
const manifest = JSON.parse(readFileSync("backups/new-catalog-manifest.json", "utf8"));
const productIds = manifest.products.map((p) => p.id);
const categoryIds = manifest.categories.map((c) => c.id);
const inList = (ids) => ids.map((id) => `'${id}'`).join(",");

// Children first (FK-safe order).
for (const t of [
  "order_events", "delivery_proofs", "disputes", "payment_requests",
  "messages", "notifications", "reviews", "email_outbox", "announcements",
  "audit_logs", "user_risk_profiles", "wallet_transactions", "orders",
  "wallets", "coupons",
]) {
  await sql.query(`delete from ${t}`);
}
// Inventory: drop units of non-catalog products; restore catalog units.
await sql.query(`delete from inventory where product_id not in (${inList(productIds)})`);
await sql.query(
  `update inventory set status = 'available', order_id = null
   where product_id in (${inList(productIds)})`
);
// Products/categories: drop test rows, reset catalog counters.
await sql.query(`delete from products where id not in (${inList(productIds)})`);
await sql.query(`delete from categories where id not in (${inList(categoryIds)})`);
for (const p of manifest.products) {
  await sql.query(`update products set stock = $1, sold = $2 where id = $3`, [p.stock, p.sold, p.id]);
}
// Users last.
await sql.query(`delete from profiles`);
await sql.query(`delete from neon_auth."user"`);
// Settings: only the original row survives.
await sql.query(`delete from store_settings where key <> 'store_open'`);
await sql.query(
  `insert into store_settings (key, value, updated_at)
   values ('store_open', 'true', now())
   on conflict (key) do update set value = 'true', updated_at = now()`
);

// Report the resulting state.
const tables = [
  "products", "categories", "inventory", "profiles", "orders", "order_events",
  "delivery_proofs", "disputes", "payment_requests", "messages", "notifications",
  "reviews", "email_outbox", "announcements", "audit_logs", "user_risk_profiles",
  "wallet_transactions", "wallets", "coupons", "store_settings",
];
for (const t of tables) {
  const r = await sql.query(`select count(*)::int c from ${t}`);
  console.log(`${t}: ${r[0].c}`);
}
const inv = await sql.query(`select count(*)::int c from inventory where status = 'available'`);
console.log(`inventory available: ${inv[0].c}`);
const au = await sql.query(`select count(*)::int c from neon_auth."user"`);
console.log(`neon_auth users: ${au[0].c}`);
const so = await sql.query(`select value from store_settings where key = 'store_open'`);
console.log(`store_open: ${so[0]?.value}`);
