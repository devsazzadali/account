// AccountStoreOne — generic table endpoint (replaces direct client→database access).
//
// Every table access from the browser goes through here so authorization is
// enforced ON THE SERVER with the Neon Auth session — never by the client.
// Protocol (PostgREST-flavoured, consumed by src/lib/dbclient.ts):
//   GET    ?select=cols&eq.col=v&ilike.col=v&gte.col=v&in.col=a,b&is.col=null
//          &order=col.desc&limit=n&offset=n&single=1
//   POST   JSON row(s)            → inserted rows
//   PATCH  JSON fields + filters  → updated rows
//   DELETE filters                → deleted rows
// Responses are always { data, error } JSON. Money-moving writes (orders,
// wallets, disputes, payment_requests) are DENIED here on purpose — they go
// through the transactional action endpoints in src/lib/order-service.ts.

import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { fetchAuthUser, ensureProfile } from "@/src/lib/auth-server";
import { serializeRow, serializeRows } from "@/src/lib/serialize";

type Row = Record<string, unknown>;

const TABLES: Record<string, { model: string }> = {
  products: { model: "product" },
  categories: { model: "category" },
  reviews: { model: "review" },
  profiles: { model: "profile" },
  orders: { model: "order" },
  messages: { model: "message" },
  notifications: { model: "notification" },
  inventory: { model: "inventory" },
  wallets: { model: "wallet" },
  wallet_transactions: { model: "walletTransaction" },
  disputes: { model: "dispute" },
  payment_requests: { model: "paymentRequest" },
  user_risk_profiles: { model: "userRiskProfile" },
  audit_logs: { model: "auditLog" },
};

const STRING_COLS = new Set([
  "id", "product_id", "user_id", "order_id", "wallet_id", "reference_id",
  "trx_id", "sender_number", "account_login", "account_password",
  "two_factor_secret", "username", "email", "customer_email", "stripe_session_id",
  "payment_intent_id", "idempotency_key", "target_id", "actor_id", "key",
]);

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function coerce(col: string, raw: string): unknown {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (!STRING_COLS.has(col) && /^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function parseFilters(sp: URLSearchParams): Row {
  const where: Row = {};
  const ops = ["eq", "neq", "gt", "gte", "lt", "lte", "ilike", "in", "is"];
  const reserved = new Set(["select", "order", "limit", "offset", "single"]);
  for (const key of sp.keys()) {
    if (reserved.has(key)) continue;
    let op: string | null = null;
    let col: string | null = null;
    let raw: string | null = null;
    const dot = key.indexOf(".");
    if (dot > 0 && ops.includes(key.slice(0, dot))) {
      // dbclient format: eq.<column>=<value>
      op = key.slice(0, dot);
      col = key.slice(dot + 1);
      raw = sp.get(key)!;
    } else {
      // classic PostgREST format: <column>=<op>.<value>
      const value = sp.get(key)!;
      const vdot = value.indexOf(".");
      if (vdot > 0 && ops.includes(value.slice(0, vdot))) {
        col = key;
        op = value.slice(0, vdot);
        raw = value.slice(vdot + 1);
      }
    }
    if (!op || !col || raw === null) continue;
    const field = snakeToCamel(col);
    if (op === "eq") where[field] = coerce(col, raw);
    else if (op === "neq") where[field] = { not: coerce(col, raw) };
    else if (op === "gt" || op === "gte" || op === "lt" || op === "lte") where[field] = { [op]: coerce(col, raw) };
    else if (op === "ilike") where[field] = { contains: raw.replace(/%/g, ""), mode: "insensitive" };
    else if (op === "in") where[field] = { in: raw.split(",").map((v) => coerce(col, v.trim())) };
    else if (op === "is") where[field] = raw === "null" ? null : coerce(col, raw);
  }
  return where;
}

function parseOrder(sp: URLSearchParams): Row[] {
  const out: Row[] = [];
  for (const raw of sp.getAll("order")) {
    const [col, dir] = raw.split(".");
    if (col) out.push({ [snakeToCamel(col)]: dir === "desc" ? "desc" : "asc" });
  }
  return out;
}

// Scalar field sets per model (from the Prisma DMMF) — unknown keys in a
// request body (legacy columns, UI-only fields) are dropped instead of
// failing the whole write with an "unknown argument" error.
const MODEL_FIELDS: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {};
  try {
    const dmmf = (Prisma as unknown as { dmmf: { datamodel: { models: { name: string; fields: { name: string; kind: string }[] }[] } } }).dmmf;
    for (const m of dmmf.datamodel.models) {
      map[m.name] = new Set(m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum").map((f) => f.name));
    }
  } catch { /* fall through: no filtering */ }
  return map;
})();

function convertInput(input: Row, modelName?: string): Row {
  const out: Row = {};
  const allowed = modelName ? MODEL_FIELDS[modelName] : undefined;
  for (const [k, v] of Object.entries(input)) {
    const camel = snakeToCamel(k);
    if (allowed && !allowed.has(camel)) continue;
    out[camel] = v;
  }
  return out;
}

interface Ctx {
  user: { id: string; email: string } | null;
  profile: Row | null;
  isAdmin: boolean;
}

async function getCtx(req: Request): Promise<Ctx> {
  const user = await fetchAuthUser(req.headers.get("cookie"));
  if (!user) return { user: null, profile: null, isAdmin: false };
  const profile = (await ensureProfile(user)) as unknown as Row;
  return {
    user: { id: user.id, email: user.email },
    profile,
    isAdmin: profile.role === "admin" || profile.role === "moderator",
  };
}

const ok = (data: unknown) => Response.json({ data, error: null });
const fail = (message: string, status = 400) =>
  Response.json({ data: null, error: { message } }, { status });

type Policy = "public" | "user" | "admin" | "deny";

function policyFor(table: string, method: string, ctx: Ctx): Policy {
  const t = table;
  if (method === "GET") {
    if (["products", "categories", "reviews"].includes(t)) return "public";
    if (["inventory", "user_risk_profiles", "audit_logs"].includes(t)) return "admin";
    return "user";
  }
  // writes
  if (["products", "categories"].includes(t)) return "admin";
  if (t === "reviews" && method === "POST") return "user";
  if (t === "reviews") return "admin";
  if (t === "messages" && method === "POST") return "user";
  if (t === "messages") return "admin";
  if (t === "inventory") return "admin";
  if (t === "profiles" && (method === "PATCH" || method === "DELETE")) return method === "PATCH" ? "user" : "admin";
  if (t === "orders" && method === "PATCH") return "admin";
  if (t === "notifications" && method === "PATCH") return "user";
  return "deny";
}

/** Extra scoping applied to reads/writes for non-admin users. */
function scopeFor(table: string, ctx: Ctx): Row | null {
  if (!ctx.user || ctx.isAdmin) return null;
  const uid = ctx.user.id;
  switch (table) {
    case "profiles":
      return { id: uid };
    case "orders":
      return { OR: [{ userId: uid }, { customerEmail: ctx.user.email }] };
    case "messages":
      return { username: (ctx.profile?.username as string) || "__none__" };
    case "notifications":
      return { userId: uid };
    case "wallets":
      return { userId: uid };
    case "wallet_transactions":
      return { wallet: { userId: uid } };
    case "disputes":
      return { userId: uid };
    case "payment_requests":
      return { userId: uid };
    default:
      return null;
  }
}

function delegate(table: string): any {
  return (prisma as unknown as Record<string, any>)[TABLES[table].model];
}

function wantsProductEmbed(table: string, sp: URLSearchParams): boolean {
  return table === "orders" && (sp.get("select") || "").includes("products(");
}

function shapeEmbed(rows: Row[]): Row[] {
  return rows.map((r) => {
    if (r && typeof r === "object" && "product" in r) {
      const { product, ...rest } = r as Row;
      return { ...rest, products: product };
    }
    return r;
  });
}

async function handle(req: Request, ctxParams: { params: Promise<{ table: string }> }) {
  const { table } = await ctxParams.params;
  if (!TABLES[table]) return fail(`Unknown table: ${table}`, 404);
  const method = req.method;
  const ctx = await getCtx(req);
  const policy = policyFor(table, method, ctx);

  if (policy === "deny") return fail("This operation is not available here", 403);
  if (policy === "admin" && !ctx.isAdmin) return ctx.user ? fail("Admin access required", 403) : fail("Authentication required", 401);
  if (policy === "user" && !ctx.user) return fail("Authentication required", 401);

  const sp = new URL(req.url).searchParams;
  const model = delegate(table);

  try {
    if (method === "GET") {
      const filters = parseFilters(sp);
      const scope = scopeFor(table, ctx);
      const where = scope ? { AND: [filters, scope] } : filters;
      const orderBy = parseOrder(sp);
      const take = sp.get("limit") ? Number(sp.get("limit")) : undefined;
      const skip = sp.get("offset") ? Number(sp.get("offset")) : undefined;
      const include = wantsProductEmbed(table, sp) ? { product: true } : undefined;
      const rows = await model.findMany({ where, orderBy: orderBy.length ? orderBy : undefined, take, skip, include });
      const data = shapeEmbed(serializeRows(rows as Row[]));
      if (sp.get("single") === "1") {
        if (data.length !== 1) return fail(data.length === 0 ? "Row not found" : "Multiple rows returned", 406);
        return ok(data[0]);
      }
      return ok(data);
    }

    if (method === "POST") {
      const body = await req.json();
      const items = (Array.isArray(body) ? body : [body]).map((r: Row) => convertInput(r, TABLES[table].model));
      // Force ownership fields for user-level inserts.
      if (table === "reviews" && ctx.user) {
        for (const it of items) it.username = (ctx.profile?.username as string) || it.username;
      }
      if (table === "messages" && ctx.user && !ctx.isAdmin) {
        for (const it of items) {
          it.username = (ctx.profile?.username as string) || it.username;
          it.userId = ctx.user.id;
        }
      }
      const created: Row[] = [];
      for (const it of items) created.push(await model.create({ data: it }));
      return ok(serializeRows(created as unknown as Row[]));
    }

    if (method === "PATCH") {
      const body = convertInput((await req.json()) as Row, TABLES[table].model);
      if (table === "profiles" && !ctx.isAdmin) {
        delete body.role;
        delete body.mustResetPassword;
        delete body.id;
      }
      const filters = parseFilters(sp);
      const scope = scopeFor(table, ctx);
      const where = scope ? { AND: [filters, scope] } : filters;
      const existing = await model.findMany({ where, select: { id: true } });
      const updated: Row[] = [];
      for (const row of existing as { id: string }[]) {
        updated.push(await model.update({ where: { id: row.id }, data: body }));
      }
      return ok(serializeRows(updated as unknown as Row[]));
    }

    if (method === "DELETE") {
      const filters = parseFilters(sp);
      const scope = scopeFor(table, ctx);
      const where = scope ? { AND: [filters, scope] } : filters;
      const existing = await model.findMany({ where });
      for (const row of existing as { id: string }[]) {
        await model.delete({ where: { id: row.id } });
      }
      return ok(serializeRows(existing as unknown as Row[]));
    }

    return fail("Method not allowed", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database operation failed";
    return fail(message, 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
