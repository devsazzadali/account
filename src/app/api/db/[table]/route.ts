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
import { syncDerivedStock } from "@/src/lib/order-service";
import { threadKeyOf, threadRowsWhere } from "@/src/lib/message-threads";

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
  coupons: { model: "coupon" },
  order_events: { model: "orderEvent" },
  email_outbox: { model: "emailOutbox" },
  announcements: { model: "announcement" },
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
  // Fix Round 5 (item 1): money writes are rounded to exactly 2
  // decimals at the API boundary, whichever client sent them — a raw
  // float artifact (16.489999771118164) can never be persisted as a
  // product price through this endpoint.
  if (modelName === "Product" && typeof out.price === "number") {
    out.price = Math.round(out.price * 100) / 100;
  }
  return out;
}

/**
 * Fix Round 6 (video-gap #3): when a product write carries a listing
 * duration, derive the expiry from it — now + duration days; a
 * missing/blank/non-positive duration clears the expiry entirely.
 * Shared by POST (create) and PATCH (edit / extend / renew).
 */
function applyListingDuration(row: Row): void {
  if (!("listingDurationDays" in row)) return;
  const days = Number(row.listingDurationDays);
  if (Number.isFinite(days) && days > 0) {
    row.listingDurationDays = Math.floor(days);
    row.listingExpiresAt = new Date(Date.now() + Math.floor(days) * 86_400_000);
  } else {
    row.listingDurationDays = null;
    row.listingExpiresAt = null;
  }
}

interface Ctx {
  user: { id: string; email: string } | null;
  profile: Row | null;
  /** Full admin (role "admin") — the only role with store-wide access. */
  isAdmin: boolean;
  /**
   * Active manager (role "moderator", not deactivated). Managers are
   * ORDER-SCOPED staff: they read/work orders, order events and disputes
   * here, and may PATCH orders (internal remarks) — nothing else. A
   * suspended manager (is_blocked) drops to plain-customer standing.
   */
  isManager: boolean;
  /** isAdmin || isManager — staff semantics (unscoped order reads etc.). */
  isStaff: boolean;
}

async function getCtx(req: Request): Promise<Ctx> {
  const user = await fetchAuthUser(req.headers.get("cookie"));
  if (!user) return { user: null, profile: null, isAdmin: false, isManager: false, isStaff: false };
  const profile = (await ensureProfile(user)) as unknown as Row;
  const isAdmin = profile.role === "admin";
  let isManager = profile.role === "moderator";
  if (isManager) {
    const rp = await prisma.userRiskProfile
      .findUnique({ where: { userId: user.id }, select: { isBlocked: true } })
      .catch(() => null);
    if (rp?.isBlocked) isManager = false;
  }
  return {
    user: { id: user.id, email: user.email },
    profile,
    isAdmin,
    isManager,
    isStaff: isAdmin || isManager,
  };
}

const ok = (data: unknown) => Response.json({ data, error: null });
const fail = (message: string, status = 400) =>
  Response.json({ data: null, error: { message } }, { status });

/**
 * Access policies:
 *  - "public" — anyone, including anonymous visitors.
 *  - "user"   — any signed-in account (reads are ownership-scoped below).
 *  - "staff"  — full admin OR active manager (order work only).
 *  - "strict" — full admin ONLY. Managers are denied: everything outside
 *               order management (products, inventory, categories,
 *               coupons, users/risk, announcements, outbox, audit) sits
 *               behind this policy.
 *  - "deny"   — not available through this endpoint at all.
 */
type Policy = "public" | "user" | "staff" | "strict" | "deny";

function policyFor(table: string, method: string, ctx: Ctx): Policy {
  const t = table;
  if (method === "GET") {
    if (["products", "categories", "reviews"].includes(t)) return "public";
    if (["inventory", "user_risk_profiles", "audit_logs", "coupons", "email_outbox", "announcements"].includes(t)) return "strict";
    if (t === "order_events") return "user"; // scoped to own orders below (staff unscoped)
    return "user";
  }
  // writes
  if (["products", "categories"].includes(t)) return "strict";
  // Reviews are created ONLY through /api/reviews (bound to a completed
  // order); the generic endpoint handles admin moderation (PATCH/DELETE).
  if (t === "reviews" && method === "POST") return "deny";
  if (t === "reviews") return "strict";
  if (t === "messages" && method === "POST") return "user";
  if (t === "messages") return "strict";
  if (t === "inventory") return "strict";
  if (t === "profiles" && (method === "PATCH" || method === "DELETE")) return method === "PATCH" ? "user" : "strict";
  // Order PATCH is the one write a manager keeps (internal remarks from
  // the order detail screen). Money-moving order writes stay denied
  // here for everyone — they go through /api/orders/:id actions.
  if (t === "orders" && method === "PATCH") return "staff";
  if (t === "notifications" && method === "PATCH") return "user";
  return "deny";
}

/** Extra scoping applied to reads/writes for non-admin users. */
function scopeFor(table: string, ctx: Ctx): Row | null {
  // Hidden reviews are never readable by non-staff (incl. anonymous).
  if (table === "reviews" && !ctx.isStaff) return { isHidden: false };
  if (!ctx.user) return null;
  if (table === "order_events" && !ctx.isStaff) return { order: { userId: ctx.user.id } };
  if (ctx.isAdmin) return null;
  // Managers are unscoped ONLY on the order-work tables; every other
  // table scopes them to their own rows, exactly like a customer.
  if (ctx.isManager && (table === "orders" || table === "order_events" || table === "disputes")) return null;
  const uid = ctx.user.id;
  switch (table) {
    case "profiles":
      return { id: uid };
    case "orders":
      return { OR: [{ userId: uid }, { customerEmail: ctx.user.email }] };
    case "messages":
      // ধাপ ৫ক৩ — stable identity: rows carry the owner's id (stamped
      // server-side on every insert), so scope by id with the current
      // username as a legacy fallback for pre-stamp rows. A username
      // change can no longer strand (or leak) a conversation: the id
      // branch follows the account, and the username branch can only
      // match rows under the caller's CURRENT name.
      return {
        OR: [
          { userId: uid },
          { username: (ctx.profile?.username as string) || "__none__" },
        ],
      };
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
  if (policy === "strict" && !ctx.isAdmin) return ctx.user ? fail("Admin access required", 403) : fail("Authentication required", 401);
  if (policy === "staff" && !ctx.isStaff) return ctx.user ? fail("Staff access required", 403) : fail("Authentication required", 401);
  if (policy === "user" && !ctx.user) return fail("Authentication required", 401);

  // Fix Round 7 (customer suspend): a suspended buyer is READ-ONLY
  // through this API — they can still see their orders and messages,
  // but every write (message sends, profile edits, anything) stops
  // until an admin lifts the suspension. Staff roles are exempt (a
  // deactivated manager is not staff — see getCtx — so the suspension
  // read-only rule applies to them too).
  if (method !== "GET" && ctx.user && !ctx.isStaff) {
    const rp = await prisma.userRiskProfile
      .findUnique({ where: { userId: ctx.user.id }, select: { isBlocked: true } })
      .catch(() => null);
    if (rp?.isBlocked) {
      return fail("This account is suspended — changes are disabled. Please contact support.", 403);
    }
  }

  const sp = new URL(req.url).searchParams;
  const model = delegate(table);

  try {
    if (method === "GET") {
      const filters = parseFilters(sp);
      const scope = scopeFor(table, ctx);
      let where: Row = scope ? { AND: [filters, scope] } : filters;
      // Fix Round 6 (video-gap #3): an expired listing stops selling —
      // it disappears from every NON-ADMIN product read (storefront,
      // search, product page, checkout fetch). Admins keep seeing it in
      // the console, flagged as expired. Checkout re-checks server-side
      // in createOrder as well; this scope is the display half.
      if (table === "products" && !ctx.isStaff) {
        where = {
          AND: [
            where,
            { OR: [{ listingExpiresAt: null }, { listingExpiresAt: { gt: new Date() } }] },
          ],
        };
      }
      const orderBy = parseOrder(sp);
      const take = sp.get("limit") ? Number(sp.get("limit")) : undefined;
      const skip = sp.get("offset") ? Number(sp.get("offset")) : undefined;
      // Exact-count mode (select=count): return the filtered COUNT with
      // no row payload — for screens that render only the number
      // (AdminOverview's "Inventory available"). Same policy/scoping as
      // any other read; the number is identical to the row count the
      // caller would have received.
      if ((sp.get("select") || "").trim() === "count") {
        const count = await model.count({ where });
        return Response.json({ data: [], count });
      }
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
      // Fix Round 6 (video-gap #3): the listing expiry is computed
      // SERVER-side whenever a duration is supplied — expires =
      // now + duration; a blank/zero duration clears the expiry
      // (the listing never expires). Client clocks never set it.
      if (table === "products") {
        for (const it of items) applyListingDuration(it);
      }
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
      // ধাপ ৫ক৩ — store replies join the same stable identity: stamp the
      // thread owner's id so the reply stays attached to the account
      // even if the customer later renames. Before this, admin rows
      // were the only unstamped rows. Resolution order: the addressed
      // username's profile; failing that (the customer renamed after
      // the row was addressed — the profile now holds the NEW name),
      // the thread's own history: any earlier row under that username
      // already carries the owner's id.
      if (table === "messages" && ctx.isAdmin) {
        for (const it of items) {
          if (!it.userId && typeof it.username === "string" && it.username) {
            const owner = await prisma.profile
              .findUnique({ where: { username: it.username }, select: { id: true } })
              .catch(() => null);
            if (owner) {
              it.userId = owner.id;
            } else {
              const prior = await prisma.message
                .findFirst({
                  where: { username: it.username, userId: { not: null } },
                  select: { userId: true },
                  orderBy: { createdAt: "desc" },
                })
                .catch(() => null);
              if (prior?.userId) it.userId = prior.userId;
            }
          }
        }
      }
      const created: Row[] = [];
      for (const it of items) created.push(await model.create({ data: it }));

      // Thread ticket state (P3): a buyer message (re)opens the thread;
      // a store reply moves it to awaiting_reply. The state is kept on
      // every row of the thread so any reader sees one consistent value.
      // Fix Round 4: threads are per (username, subject group) — a
      // message in one ticket must not flip another ticket's state.
      if (table === "messages") {
        const next = ctx.isAdmin ? "awaiting_reply" : "open";
        const threadGroups = new Map<string, { username: string; key: string; userId?: string | null }>();
        for (const it of items) {
          const uname = it.username as string | undefined;
          if (!uname) continue;
          const key = threadKeyOf(it.subject as string | undefined);
          threadGroups.set(`${uname}::${key}`, {
            username: uname,
            key,
            userId: (it.userId as string | undefined) ?? null,
          });
        }
        for (const g of threadGroups.values()) {
          // ধাপ ৫ক৩ — sync by stable identity too, so a renamed
          // customer's older rows flip state together with the new ones.
          await prisma.message.updateMany({ where: threadRowsWhere(g, g.key), data: { ticketStatus: next } });
        }
        // Real notifications (R3): a store reply must actually reach the
        // customer — create a `notifications` row for the thread owner.
        // Best-effort: a notification failure never fails the reply.
        if (ctx.isAdmin) {
          for (const it of items) {
            const replyText = typeof it.reply === "string" ? it.reply.trim() : "";
            const uname = it.username as string | undefined;
            if (!replyText || !uname) continue;
            try {
              const owner = await prisma.profile.findUnique({ where: { username: uname }, select: { id: true } });
              if (owner) {
                await prisma.notification.create({
                  data: {
                    userId: owner.id,
                    title: "Support replied to you",
                    message: replyText.length > 140 ? `${replyText.slice(0, 140)}…` : replyText,
                    type: "support",
                  },
                });
              }
            } catch { /* notification is best-effort */ }
          }
        }
      }
      // Derived stock (P2): new inventory changes the sellable count.
      if (table === "inventory") {
        const pids = [...new Set(items.map((it) => it.productId as string).filter(Boolean))];
        for (const pid of pids) await prisma.$transaction((tx) => syncDerivedStock(tx, pid));
      }
      return ok(serializeRows(created as unknown as Row[]));
    }

    if (method === "PATCH") {
      const body = convertInput((await req.json()) as Row, TABLES[table].model);
      // Fix Round 6: same server-side expiry computation on update —
      // this is also what makes the hub's bulk "Extend" work: PATCHing
      // the duration renews the listing from now.
      if (table === "products") applyListingDuration(body);
      // Fix Round 7 (roles matrix): role changes are FULL-ADMIN only.
      // This used to strip `role` only for non-staff, which let any
      // moderator rewrite any user's role — including promoting
      // themselves to admin. Now only role === "admin" keeps the
      // field; everyone else (users AND moderators) has it stripped.
      if (table === "profiles" && ctx.profile?.role !== "admin") {
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
      // Fix Round 5 (item 5): keep the derived-stock cache honest on
      // EVERY inventory write path. POST/DELETE re-synced already;
      // PATCH did not — editing an inventory row's status (available →
      // flagged) silently left products.stock at the stale number
      // while checkout used the live formula. Likewise, flipping a
      // product's use_inventory_stock toggle on must re-derive its
      // stock immediately, not at the next inventory/order event.
      if (table === "inventory") {
        const full = await model.findMany({ where, select: { productId: true } });
        const pids = [...new Set((full as Row[]).map((r) => r.productId as string).filter(Boolean))];
        for (const pid of pids) await prisma.$transaction((tx) => syncDerivedStock(tx, pid));
      }
      if (table === "products") {
        for (const r of updated as Row[]) {
          if (r.useInventoryStock) {
            await prisma.$transaction((tx) => syncDerivedStock(tx, String(r.id)));
          }
        }
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
      if (table === "inventory") {
        const pids = [...new Set((existing as Row[]).map((r) => r.productId as string).filter(Boolean))];
        for (const pid of pids) await prisma.$transaction((tx) => syncDerivedStock(tx, pid));
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
