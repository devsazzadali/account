#!/usr/bin/env node
/**
 * AccountStoreOne — one-way data migration, legacy Supabase → Neon.
 *
 * READ-ONLY against the legacy project: it only issues GET requests to
 * the PostgREST API with the PUBLIC publishable key (the same key the
 * live website ships to every visitor's browser). It NEVER writes to
 * the legacy database.
 *
 *   LEGACY_SUPABASE_URL=https://<ref>.supabase.co \
 *   LEGACY_SUPABASE_ANON_KEY=sb_publishable_… \
 *   node --env-file=.env.local scripts/migrate-from-supabase.mjs
 *
 * Preserves IDs for products + categories + profiles + orders +
 * messages. Idempotent (ON CONFLICT DO NOTHING) — safe to re-run.
 * Legacy auth passwords cannot migrate (different auth system): every
 * migrated profile is flagged must_reset_password = true, and migrated
 * profiles are historical records — their ids belong to the old auth
 * system, so a returning customer who signs up fresh gets a new profile
 * (see COMPLETION_REPORT.md). Products that have a generated branded
 * cover in public/covers/<id>.jpg get image = cover path and keep the
 * old stock URL in original_image.
 */

import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const LEGACY_URL = (process.env.LEGACY_SUPABASE_URL || "").replace(/\/$/, "");
const LEGACY_KEY = process.env.LEGACY_SUPABASE_ANON_KEY || "";
const DB_URL = process.env.DATABASE_URL || "";

if (!LEGACY_URL || !LEGACY_KEY) { console.error("✗ LEGACY_SUPABASE_URL / LEGACY_SUPABASE_ANON_KEY required"); process.exit(1); }
if (!DB_URL) { console.error("✗ DATABASE_URL required (use --env-file=.env.local)"); process.exit(1); }

const sql = neon(DB_URL);
const report = {};

async function fetchTable(table) {
  const url = `${LEGACY_URL}/rest/v1/${table}?select=*&limit=1000`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { apikey: LEGACY_KEY, Authorization: `Bearer ${LEGACY_KEY}` } });
      if (res.ok) return await res.json();
      const body = await res.text();
      console.warn(`  ${table}: HTTP ${res.status} ${body.slice(0, 120)}`);
      return null;
    } catch (e) {
      console.warn(`  ${table}: attempt ${attempt} failed (${e.message})`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

async function count(table) {
  const rows = await sql.query(`select count(*)::int as c from ${table}`);
  return rows[0].c;
}

async function main() {
  // ── categories ────────────────────────────────────────────────
  const categories = await fetchTable("categories");
  if (categories) {
    for (const c of categories) {
      await sql.query(
        `insert into categories (id, name, slug, description, seo_title, seo_description, h1_title, content_body, faq_data, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) on conflict (id) do nothing`,
        [c.id, c.name, c.slug, c.description ?? "", c.seo_title, c.seo_description, c.h1_title, c.content_body, JSON.stringify(c.faq_data ?? []), c.created_at],
      );
    }
    report.categories = { read: categories.length, inDb: await count("categories") };
  } else report.categories = { read: "UNREADABLE" };

  // ── products ──────────────────────────────────────────────────
  const products = await fetchTable("products");
  if (products) {
    for (const p of products) {
      const coverPath = path.join(process.cwd(), "public", "covers", `${p.id}.jpg`);
      const hasCover = fs.existsSync(coverPath);
      await sql.query(
        `insert into products (id, title, price, image, original_image, stock, category, game, game_type, badge, sold, description, seo_keywords, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict (id) do nothing`,
        [
          p.id, p.title, p.price,
          hasCover ? `/covers/${p.id}.jpg` : p.image,
          p.image ?? null,
          p.stock ?? 0, p.category ?? null, p.game ?? null, p.game_type ?? null,
          p.badge ?? null, p.sold ?? 0, p.description ?? null, p.seo_keywords ?? null, p.created_at,
        ],
      );
    }
    report.products = { read: products.length, inDb: await count("products"), coversApplied: products.filter((p) => fs.existsSync(path.join(process.cwd(), "public", "covers", `${p.id}.jpg`))).length };
  } else report.products = { read: "UNREADABLE" };

  // ── profiles (must-reset; historical ids) ─────────────────────
  const profiles = await fetchTable("profiles");
  if (profiles) {
    for (const pr of profiles) {
      await sql.query(
        `insert into profiles (id, username, full_name, avatar_url, role, must_reset_password, created_at, updated_at)
         values ($1,$2,$3,$4,$5,true,$6,$7) on conflict (id) do nothing`,
        [pr.id, pr.username, pr.full_name ?? null, pr.avatar_url ?? null, pr.role || "user", pr.created_at, pr.updated_at || pr.created_at],
      );
      await sql.query(
        `insert into wallets (id, user_id, balance, updated_at) values (gen_random_uuid(), $1, 0, now()) on conflict (user_id) do nothing`,
        [pr.id],
      );
    }
    report.profiles = { read: profiles.length, inDb: await count("profiles"), note: "must_reset_password=true on all; ids are legacy-auth ids (historical records)" };
  } else report.profiles = { read: "UNREADABLE" };

  // ── orders ────────────────────────────────────────────────────
  // Legacy payment_status is uniformly 'pending' (no information), so
  // the canonical pair is derived from the legacy order status, which
  // the owner actually maintained: Paid/Delivered imply money changed
  // hands in the old admin; Awaiting Verification = a payment claim.
  const STATUS_MAP = {
    "New Order": ["New Order", "unpaid", "pending_payment"],
    "Awaiting Verification": ["New Order", "pending_verification", "pending_payment"],
    "Paid": ["PREPARING", "paid", "in_escrow"],
    "Preparing": ["PREPARING", "unpaid", "pending_payment"],
    "Delivered": ["Delivering", "paid", "in_escrow"],
    "Canceled": ["Canceled", "unpaid", "pending_payment"],
    "Completed": ["Completed", "paid", "completed"],
    "PREPARING": ["PREPARING", "paid", "in_escrow"],
    "Delivering": ["Delivering", "paid", "in_escrow"],
  };
  const orders = await fetchTable("orders");
  if (orders) {
    for (const o of orders) {
      const [status, payStatus, escrow] = STATUS_MAP[o.status] || ["New Order", "unpaid", "pending_payment"];
      const ai = o.account_info || {};
      const notes = [
        ai.twoFactorCode ? `2FA: ${ai.twoFactorCode}` : null,
        ai.secondaryPassword ? `Secondary password: ${ai.secondaryPassword}` : null,
        ai.cookies ? `Cookies: ${ai.cookies}` : null,
        ai.internalRemarks ? ai.internalRemarks : null,
      ].filter(Boolean).join("\n") || null;
      await sql.query(
        `insert into orders (id, product_id, user_id, username, customer_email, quantity, total_price, status,
                             payment_status, escrow_state, escrow_hold_until, credential_username, credential_password,
                             credential_notes, stripe_session_id, payment_intent_id, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) on conflict (id) do nothing`,
        [
          o.id, o.product_id ?? null, o.user_id ?? null, o.username ?? null, o.customer_email,
          o.quantity ?? 1, o.total_price, status, payStatus, escrow,
          o.escrow_hold_until ?? null,
          ai.loginAccount ?? null, ai.loginPassword ?? null, notes,
          o.stripe_session_id ?? null, o.payment_intent_id ?? null, o.created_at, o.updated_at || o.created_at,
        ],
      );
    }
    report.orders = { read: orders.length, inDb: await count("orders"), note: "status/payment_status canonicalised per STATUS_MAP; account_info credentials mapped into credential_* vault fields" };
  } else report.orders = { read: "UNREADABLE" };

  // ── messages ──────────────────────────────────────────────────
  const messages = await fetchTable("messages");
  if (messages) {
    for (const m of messages) {
      await sql.query(
        `insert into messages (id, username, subject, message, reply, status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
        [m.id, m.username, m.subject ?? null, m.message, m.reply ?? null, m.status || "unread", m.created_at],
      );
    }
    report.messages = { read: messages.length, inDb: await count("messages"), note: "replied_at has no target column and was not carried" };
  } else report.messages = { read: "UNREADABLE" };

  // ── tables that returned nothing readable ─────────────────────
  for (const t of ["inventory", "reviews", "wallets", "wallet_transactions", "disputes", "notifications"]) {
    const rows = await fetchTable(t);
    report[t] = rows === null ? { read: "UNREADABLE" } : { read: rows.length, note: rows.length === 0 ? "0 rows visible to the public key (empty or RLS-restricted)" : "rows present — not auto-imported (see report)" };
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
