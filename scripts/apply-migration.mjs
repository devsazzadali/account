#!/usr/bin/env node
/**
 * Apply a prisma/migrations/<name>/migration.sql file to Neon over the
 * HTTPS serverless driver (direct TCP 5432 is blocked in this sandbox).
 * Usage: node --env-file=.env.local scripts/apply-migration.mjs <name>
 */
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const name = process.argv[2];
if (!name) { console.error("usage: apply-migration.mjs <migration-folder>"); process.exit(1); }
const file = path.join("prisma", "migrations", name, "migration.sql");
const raw = fs.readFileSync(file, "utf8");
const DB_URL = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL required"); process.exit(1); }

const sql = neon(DB_URL);
// Strip line comments, then split into statements (no procedural bodies).
const body = raw.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const statements = body.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);

console.log(`Applying ${statements.length} statements from ${file}`);
for (const stmt of statements) {
  await sql.query(stmt);
  console.log("  ok:", stmt.slice(0, 72).replace(/\s+/g, " "));
}
console.log("MIGRATION APPLIED:", name);
