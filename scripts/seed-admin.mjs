#!/usr/bin/env node
/**
 * AccountStoreOne — first-admin bootstrap.
 *
 * There is deliberately NO in-app way to become an admin (the old build
 * had no bootstrap at all, and a public one would be a hole). Run this
 * once per environment:
 *
 *   FIRST_ADMIN_EMAIL=owner@example.com \
 *   FIRST_ADMIN_PASSWORD='a-strong-password' \
 *   FIRST_ADMIN_NAME='Store Owner' \
 *   node --env-file=.env.local scripts/seed-admin.mjs
 *
 * What it does:
 *   1. Looks the email up in Neon Auth (neon_auth."user").
 *   2. If the user does not exist, creates it via the Neon Auth sign-up
 *      API (requires FIRST_ADMIN_PASSWORD). If it exists, the password
 *      is NOT touched.
 *   3. Upserts the app profile with role='admin' and ensures a wallet.
 * Idempotent: re-running only re-asserts the admin role.
 */

import { neon } from "@neondatabase/serverless";

const email = (process.env.FIRST_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.FIRST_ADMIN_PASSWORD || "";
const name = process.env.FIRST_ADMIN_NAME || "Store Admin";
const authBase = (process.env.NEON_AUTH_BASE_URL || "").replace(/\/$/, "");
const dbUrl = process.env.DATABASE_URL || "";

if (!email) { console.error("✗ FIRST_ADMIN_EMAIL is required"); process.exit(1); }
if (!authBase) { console.error("✗ NEON_AUTH_BASE_URL is not set (see .env.local)"); process.exit(1); }
if (!dbUrl) { console.error("✗ DATABASE_URL is not set (see .env.local)"); process.exit(1); }

const sql = neon(dbUrl);

async function findAuthUser() {
  const rows = await sql.query(`select id, name, email from neon_auth."user" where lower(email) = $1 limit 1`, [email]);
  return rows[0] || null;
}

async function createAuthUser() {
  const origin = process.env.SEED_ORIGIN || "http://localhost:3000";
  const res = await fetch(`${authBase}/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ email, password, name }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Neon Auth sign-up failed (${res.status}): ${text.slice(0, 300)}`);
  console.log("✓ Created the admin's Neon Auth account");
}

async function main() {
  let user = await findAuthUser();
  if (!user) {
    if (!password) {
      console.error(`✗ No Neon Auth user exists for ${email} and FIRST_ADMIN_PASSWORD was not provided.`);
      console.error("  Either sign up once through the website with this email, or re-run with FIRST_ADMIN_PASSWORD set.");
      process.exit(1);
    }
    await createAuthUser();
    user = await findAuthUser();
    if (!user) throw new Error("Auth user still not found after sign-up");
  } else {
    console.log(`✓ Found existing Neon Auth user for ${email}`);
  }

  // Unique username derived from the email prefix.
  let username = (email.split("@")[0] || "admin").replace(/[^a-zA-Z0-9_]/g, "_");
  const clash = await sql.query(`select id from profiles where username = $1 and id <> $2 limit 1`, [username, user.id]);
  if (clash.length) username = `${username}_${String(user.id).slice(0, 4)}`;

  await sql.query(
    `insert into profiles (id, username, email, full_name, role, created_at, updated_at)
     values ($1, $2, $3, $4, 'admin', now(), now())
     on conflict (id) do update set role = 'admin', email = excluded.email,
       full_name = coalesce(profiles.full_name, excluded.full_name), updated_at = now()`,
    [user.id, username, email, name],
  );
  await sql.query(
    `insert into wallets (id, user_id, balance, updated_at)
     values (gen_random_uuid(), $1, 0, now())
     on conflict (user_id) do nothing`,
    [user.id],
  );

  console.log(`✓ Profile promoted: ${email} (username: ${username}) is now role=admin`);
  console.log("→ Sign in at /login with this email" + (password ? " and the password you just set" : " and the account's existing password") + ", then open /admin.");
}

main().catch((e) => { console.error("✗", e.message); process.exit(1); });
