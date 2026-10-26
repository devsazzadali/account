#!/usr/bin/env node
/**
 * AccountStoreOne — scripted end-to-end verification suite.
 * Runs against a LOCAL server (default http://localhost:3100) backed by
 * the real Neon database. Every run uses a fresh buyer + fresh product
 * so the 10 runs are independent. Exits non-zero if any step fails.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/e2e-suite.mjs [runLabel]
 */

const BASE = process.env.E2E_BASE || "http://localhost:3100";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin-e2e@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "E2eAdmin!234";
const label = process.argv[2] || "run";
const uniq = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

const results = [];
function step(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

class Jar {
  constructor() { this.cookies = new Map(); }
  absorb(res) {
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of set) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      if (idx > 0) this.cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
    }
  }
  header() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; "); }
}

async function call(jar, method, path, body, extraHeaders = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(jar ? { Cookie: jar.header() } : {}),
      Origin: BASE,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  if (jar) jar.absorb(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* html */ }
  return { status: res.status, json, text };
}

async function main() {
  const buyerEmail = `buyer-${uniq}@example.com`;
  const buyer2Email = `buyer2-${uniq}@example.com`;
  const password = "E2eBuyer!234";

  // ── public routes ─────────────────────────────────────────────
  for (const route of ["/", "/about", "/faq", "/terms", "/privacy", "/buyer-protection", "/login", "/signup", "/forgot-password"]) {
    const r = await call(null, "GET", route);
    step(`route ${route} = 200`, r.status === 200, `got ${r.status}`);
  }
  const missing = await call(null, "GET", "/product/00000000-0000-0000-0000-000000000000");
  step("missing product = 404", missing.status === 404, `got ${missing.status}`);
  const migrated = await call(null, "GET", "/product/f88d7c6b-fe26-4c1c-8e59-14152c4a749b");
  step("migrated product page = 200", migrated.status === 200, `got ${migrated.status}`);
  // Covers are SVG since the deploy moved to git-pushed assets (no binaries).
  step("migrated product uses branded cover", (migrated.text || "").includes("/covers/f88d7c6b-fe26-4c1c-8e59-14152c4a749b.svg"));

  // ── authz: unauthenticated ────────────────────────────────────
  const unauth = await call(null, "POST", "/api/orders", { product_id: "x", quantity: 1 });
  step("unauth order create = 401", unauth.status === 401, `got ${unauth.status}`);

  // ── admin session ─────────────────────────────────────────────
  const admin = new Jar();
  const adminLogin = await call(admin, "POST", "/api/auth/sign-in/email", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  step("admin sign-in", adminLogin.status === 200, `got ${adminLogin.status}`);
  const adminMe = await call(admin, "GET", "/api/me");
  step("admin profile role = admin", adminMe.json?.profile?.role === "admin", adminMe.json?.profile?.role);

  // ── test product + inventory (as admin) ───────────────────────
  const price = 10;
  const prod = await call(admin, "POST", "/api/db/products", { title: `E2E Widget ${uniq}`, price, stock: 3, category: "E2E", description: "suite product" });
  const product = prod.json?.data?.[0];
  step("admin creates product", prod.status === 200 && !!product?.id, `status ${prod.status}`);
  const invLogins = [];
  const twoFactorSecret = "JBSWY3DPEHPK3PXP";
  const recoveryEmail = `recover-${uniq}@vault.test`;
  for (let i = 0; i < 3; i++) {
    const login = `cred-${uniq}-${i}@vault.test`;
    invLogins.push(login);
    // The first (oldest) unit carries 2FA — auto-delivery assigns it to order 1.
    const extra = i === 0 ? { two_factor_secret: twoFactorSecret, recovery_email: recoveryEmail } : {};
    const inv = await call(admin, "POST", "/api/db/inventory", { product_id: product.id, account_login: login, account_password: `pw-${uniq}-${i}`, status: "available", ...extra });
    if (inv.status !== 200) step(`inventory item ${i} added`, false, `status ${inv.status}`);
  }
  step("inventory stocked (3)", invLogins.length === 3);
  const zeroProd = await call(admin, "POST", "/api/db/products", { title: `E2E Zero ${uniq}`, price: 5, stock: 0, category: "E2E" });
  const zeroId = zeroProd.json?.data?.[0]?.id;

  // ── buyer signup + session ────────────────────────────────────
  const buyer = new Jar();
  const signup = await call(buyer, "POST", "/api/auth/sign-up/email", { email: buyerEmail, password, name: "E2E Buyer" });
  step("buyer sign-up", signup.status === 200, `got ${signup.status} ${signup.text?.slice(0, 120)}`);
  const me = await call(buyer, "GET", "/api/me");
  step("buyer profile auto-created", !!me.json?.profile?.id && me.json?.profile?.role === "user");

  // stock-0 rejection
  const zeroOrder = await call(buyer, "POST", "/api/orders", { product_id: zeroId, quantity: 1 });
  step("stock-0 order rejected", zeroOrder.status === 400 || zeroOrder.status === 409, `got ${zeroOrder.status}: ${zeroOrder.json?.error || ""}`);

  // ── order 1: manual payment → verify → auto-delivery ─────────
  const o1 = await call(buyer, "POST", "/api/orders", { product_id: product.id, quantity: 1, customer_email: buyerEmail });
  const order1 = o1.json?.order;
  step("order 1 created unpaid", o1.status === 201 && order1?.payment_status === "unpaid", `status ${o1.status}, ps=${order1?.payment_status}`);
  step("order 1 total = price + 0.50 fee", Number(order1?.total_price) === price + 0.5, `total=${order1?.total_price}`);

  const submit = await call(buyer, "POST", `/api/orders/${order1.id}`, { action: "submit_payment", method: "bkash", trxId: `TRX${uniq}`.toUpperCase(), senderNumber: "01700000001" });
  step("manual payment submitted → pending_verification", submit.status === 200 && submit.json?.order?.payment_status === "pending_verification", `ps=${submit.json?.order?.payment_status}`);

  const queue = await call(admin, "GET", "/api/admin/payments?status=pending");
  const reqRow = (queue.json?.payment_requests || []).find((r) => r.order_id === order1.id);
  step("payment appears in admin verification queue", !!reqRow);

  const approve = await call(admin, "POST", "/api/admin/payments", { id: reqRow.id, approve: true });
  step("admin approves payment", approve.status === 200, `got ${approve.status}: ${approve.json?.error || ""}`);

  const o1After = await call(buyer, "GET", `/api/orders/${order1.id}`);
  const after = o1After.json?.order;
  step("order 1 paid after approval", after?.payment_status === "paid", `ps=${after?.payment_status}`);
  step("order 1 escrow = in_escrow", after?.escrow_state === "in_escrow", after?.escrow_state);
  step("order 1 auto-delivered with REAL inventory credentials", invLogins.includes(after?.credential_username) && /^pw-/.test(after?.credential_password || ""), `vault user=${after?.credential_username}`);
  step("order 1 vault carries the DEDICATED 2FA secret field", after?.two_factor_secret === twoFactorSecret, `2fa=${after?.two_factor_secret}`);
  step("order 1 vault carries the DEDICATED recovery email field", after?.recovery_email === recoveryEmail, `recovery=${after?.recovery_email}`);
  step("order 1 status = Delivering", after?.status === "Delivering", after?.status);

  const prodAfter = await call(admin, "GET", `/api/db/products?id=eq.${product.id}`);
  step("stock decremented 3 → 2", Number(prodAfter.json?.data?.[0]?.stock) === 2, `stock=${prodAfter.json?.data?.[0]?.stock}`);
  step("sold incremented to 1", Number(prodAfter.json?.data?.[0]?.sold) === 1, `sold=${prodAfter.json?.data?.[0]?.sold}`);

  // ── wallet top-up via manual verification ─────────────────────
  const topup = await call(buyer, "POST", "/api/wallet", { amount: 25, method: "bkash", trxId: `TOP${uniq}`.toUpperCase(), senderNumber: "01700000001" });
  step("wallet top-up submitted", topup.status === 201, `got ${topup.status}`);
  const queue2 = await call(admin, "GET", "/api/admin/payments?status=pending");
  const topRow = (queue2.json?.payment_requests || []).find((r) => r.id === topup.json?.payment_request?.id);
  step("top-up in admin queue", !!topRow);
  await call(admin, "POST", "/api/admin/payments", { id: topRow.id, approve: true });
  const wallet1 = await call(buyer, "GET", "/api/wallet");
  step("wallet credited $25 after verification", Number(wallet1.json?.wallet?.balance) === 25, `balance=${wallet1.json?.wallet?.balance}`);
  step("wallet ledger has the top-up row", (wallet1.json?.transactions || []).some((t) => t.type === "topup" && Number(t.amount) === 25));

  // ── order 2: pay with wallet ──────────────────────────────────
  const o2 = await call(buyer, "POST", "/api/orders", { product_id: product.id, quantity: 1, customer_email: buyerEmail, payWithWallet: true });
  const order2 = o2.json?.order;
  step("order 2 paid instantly from wallet", o2.status === 201 && order2?.payment_status === "paid", `ps=${order2?.payment_status}`);
  step("order 2 auto-delivered", invLogins.includes(order2?.credential_username), `vault=${order2?.credential_username}`);
  const wallet2 = await call(buyer, "GET", "/api/wallet");
  step("wallet debited for order 2", Number(wallet2.json?.wallet?.balance) === 25 - (price + 0.5), `balance=${wallet2.json?.wallet?.balance}`);

  // ── order 3: cancel restores stock ────────────────────────────
  const o3 = await call(buyer, "POST", "/api/orders", { product_id: product.id, quantity: 1, customer_email: buyerEmail });
  const order3 = o3.json?.order;
  const cancel = await call(buyer, "POST", `/api/orders/${order3.id}`, { action: "cancel" });
  step("order 3 canceled", cancel.status === 200 && cancel.json?.order?.status === "Canceled", cancel.json?.order?.status);
  const prodFinal = await call(admin, "GET", `/api/db/products?id=eq.${product.id}`);
  step("stock restored after cancel (1 → back to 1 after two deliveries + cancel)", Number(prodFinal.json?.data?.[0]?.stock) === 1, `stock=${prodFinal.json?.data?.[0]?.stock}`);

  // ── dispute on order 2 → admin refunds to wallet ──────────────
  const dispute = await call(buyer, "POST", `/api/orders/${order2.id}`, { action: "dispute", reason: "Credentials do not work (E2E)" });
  step("dispute opens", dispute.status === 200 && dispute.json?.order?.status === "Disputed", dispute.json?.order?.status);
  const resolve = await call(admin, "POST", `/api/orders/${order2.id}`, { action: "resolve_dispute", resolution: "refunded" });
  step("admin resolves dispute → refunded", resolve.status === 200 && resolve.json?.order?.status === "Refunded", resolve.json?.order?.status);
  const wallet3 = await call(buyer, "GET", "/api/wallet");
  step("refund credited back to wallet", Number(wallet3.json?.wallet?.balance) === 25, `balance=${wallet3.json?.wallet?.balance}`);
  step("refund ledger row exists", (wallet3.json?.transactions || []).some((t) => t.type === "refund"));

  // ── buyer confirm receipt on order 1 completes escrow ─────────
  const confirm = await call(buyer, "POST", `/api/orders/${order1.id}`, { action: "confirm_receipt" });
  step("buyer confirm → Completed + escrow completed", confirm.status === 200 && confirm.json?.order?.status === "Completed" && confirm.json?.order?.escrow_state === "completed", `${confirm.json?.order?.status}/${confirm.json?.order?.escrow_state}`);

  // ── authz: second buyer cannot touch buyer 1's data ──────────
  const buyer2 = new Jar();
  await call(buyer2, "POST", "/api/auth/sign-up/email", { email: buyer2Email, password, name: "E2E Buyer Two" });
  const foreign = await call(buyer2, "GET", `/api/orders/${order1.id}`);
  step("foreign buyer cannot read order", foreign.status === 403 || foreign.status === 404, `got ${foreign.status}`);
  const foreignAct = await call(buyer2, "POST", `/api/orders/${order1.id}`, { action: "cancel" });
  step("foreign buyer cannot act on order", foreignAct.status === 403 || foreignAct.status === 404, `got ${foreignAct.status}`);
  const buyerAdmin = await call(buyer, "GET", "/api/admin/payments?status=pending");
  step("buyer blocked from admin payments API", buyerAdmin.status === 403, `got ${buyerAdmin.status}`);
  const buyerPatch = await call(buyer, "PATCH", `/api/db/products?id=eq.${product.id}`, { price: 0.01 });
  step("buyer cannot edit products", buyerPatch.status === 403, `got ${buyerPatch.status}`);
  const buyerOrdersWrite = await call(buyer, "PATCH", `/api/db/orders?id=eq.${order1.id}`, { payment_status: "paid" });
  step("buyer cannot write orders table directly", buyerOrdersWrite.status === 403, `got ${buyerOrdersWrite.status}`);

  // ── admin product edit ────────────────────────────────────────
  const edit = await call(admin, "PATCH", `/api/db/products?id=eq.${product.id}`, { price: 12.5 });
  step("admin edits product price", edit.status === 200 && Number(edit.json?.data?.[0]?.price) === 12.5, `status ${edit.status}`);

  // ── payment config honesty ────────────────────────────────────
  const cfgAnon = await call(null, "GET", "/api/payments/config");
  step("anon payment config hides numbers", cfgAnon.json?.manual?.bkashNumber === null, JSON.stringify(cfgAnon.json?.manual));
  const cfgBuyer = await call(buyer, "GET", "/api/payments/config");
  step("signed-in buyer sees the store bkash number", cfgBuyer.json?.manual?.bkashNumber === "01700000000", cfgBuyer.json?.manual?.bkashNumber);
  step("stripe reported not configured (no keys in test env)", cfgBuyer.json?.stripe?.enabled === false);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[${label}] ${results.length - failed.length}/${results.length} steps passed`);
  if (failed.length) { console.log("FAILED:", failed.map((f) => f.name).join(" | ")); process.exit(1); }
}

main().catch((e) => { console.error("SUITE ERROR:", e); process.exit(2); });
