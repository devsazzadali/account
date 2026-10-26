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

  // ══ Z2U ALIGNMENT (P0–P5) ══════════════════════════════════════

  // ── P0: seller stats are self-consistent (computed, not typed) ──
  const statsRes = await call(null, "GET", "/api/store/stats");
  const seller = statsRes.json?.seller;
  step("seller info stats present", !!seller && typeof seller.total_orders === "number");
  if (seller) {
    const denom = seller.total_orders - seller.canceled_orders;
    const expected = denom > 0 ? Number(((seller.completed_orders / denom) * 100).toFixed(2)) : null;
    step("completion rate = completed ÷ non-canceled (recomputed)", seller.completion_rate === expected, `rate=${seller.completion_rate} expected=${expected}`);
  }

  // ── P1: remarks round-trip ──────────────────────────────────────
  const remarkText = `E2E remark ${uniq}`;
  const remarkPatch = await call(admin, "PATCH", `/api/db/orders?id=eq.${order1.id}`, { internal_remarks: remarkText });
  step("admin writes internal remarks", remarkPatch.status === 200, `got ${remarkPatch.status}`);
  const remarkRead = await call(admin, "GET", `/api/orders/${order1.id}`);
  step("remarks read back on order detail", remarkRead.json?.order?.internal_remarks === remarkText, remarkRead.json?.order?.internal_remarks);
  await call(admin, "PATCH", `/api/db/orders?id=eq.${order1.id}`, { internal_remarks: null });

  // ── P1: order events trail exists ───────────────────────────────
  const events = remarkRead.json?.order?.events || [];
  step("order carries an audit events trail", events.length >= 3 && events.some((e) => e.event === "created") && events.some((e) => e.event === "payment_verified"), `events=${events.map((e) => e.event).join(",")}`);

  // ── P1+P3: dispute joins the orders list; review gating ─────────
  const dispute1 = await call(buyer, "POST", `/api/orders/${order1.id}`, { action: "dispute", reason: "E2E dispute for the disputed tab" });
  step("completed order can be disputed", dispute1.status === 200 && dispute1.json?.order?.status === "Disputed", dispute1.json?.order?.status);
  const disputedList = await call(admin, "GET", "/api/db/orders?status=eq.Disputed");
  step("disputed order appears in admin Disputed list", (disputedList.json?.data || []).some((o) => o.id === order1.id));
  const badReview = await call(buyer, "POST", "/api/reviews", { order_id: order3.id, rating: 5, comment: "Review on a canceled order" });
  step("review on non-completed order = 409", badReview.status === 409, `got ${badReview.status}`);
  const resolveRej = await call(admin, "POST", `/api/orders/${order1.id}`, { action: "resolve_dispute", resolution: "rejected" });
  step("dispute rejected → order back to Completed", resolveRej.status === 200 && resolveRej.json?.order?.status === "Completed", resolveRej.json?.order?.status);
  const goodReview = await call(buyer, "POST", "/api/reviews", { order_id: order1.id, rating: 5, comment: "E2E review — flawless delivery", delivery_rating: 5, service_rating: 4 });
  step("review on completed order = 201", goodReview.status === 201 && !!goodReview.json?.review?.id, `got ${goodReview.status}: ${goodReview.json?.error || ""}`);
  const dupReview = await call(buyer, "POST", "/api/reviews", { order_id: order1.id, rating: 1, comment: "Duplicate review attempt" });
  step("second review for same order = 409", dupReview.status === 409, `got ${dupReview.status}`);
  const reviewId = goodReview.json?.review?.id;
  const anonReviews = await call(null, "GET", `/api/db/reviews?product_id=eq.${product.id}`);
  step("review visible on product (public)", (anonReviews.json?.data || []).some((r) => r.id === reviewId));
  await call(admin, "PATCH", `/api/db/reviews?id=eq.${reviewId}`, { is_hidden: true });
  const anonReviews2 = await call(null, "GET", `/api/db/reviews?product_id=eq.${product.id}`);
  step("hidden review disappears from public reads", !(anonReviews2.json?.data || []).some((r) => r.id === reviewId));
  await call(admin, "PATCH", `/api/db/reviews?id=eq.${reviewId}`, { admin_reply: "Thank you! (E2E)", reply_at: new Date().toISOString(), is_hidden: false });

  // ── P5: coupons end-to-end ──────────────────────────────────────
  const couponProduct = await call(admin, "POST", "/api/db/products", { title: `E2E Coupon Widget ${uniq}`, price: 20, stock: 5, category: "E2E" });
  const cpId = couponProduct.json?.data?.[0]?.id;
  const couponCode = `E2E${uniq}`.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 14);
  const couponCreate = await call(admin, "POST", "/api/coupons", { code: couponCode, type: "percent", value: 10 });
  step("admin creates coupon", couponCreate.status === 201 && couponCreate.json?.coupon?.code === couponCode, `got ${couponCreate.status}: ${couponCreate.json?.error || ""}`);
  const couponId = couponCreate.json?.coupon?.id;
  const validate = await call(buyer, "POST", "/api/coupons/validate", { code: couponCode, product_id: cpId, quantity: 1 });
  step("coupon validates with priced discount", validate.status === 200 && validate.json?.valid === true && Number(validate.json?.discount) === 2, JSON.stringify(validate.json));
  const oc = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 1, customer_email: buyerEmail, coupon_code: couponCode });
  const couponOrder = oc.json?.order;
  step("coupon order total = discounted + fee", oc.status === 201 && Number(couponOrder?.total_price) === 18.5 && Number(couponOrder?.discount_amount) === 2 && couponOrder?.coupon_code === couponCode, `total=${couponOrder?.total_price} discount=${couponOrder?.discount_amount}`);
  const oc2 = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 1, customer_email: buyerEmail, coupon_code: couponCode });
  step("per-buyer coupon limit enforced (2nd use = 422)", oc2.status === 422, `got ${oc2.status}: ${oc2.json?.error || ""}`);
  const couponList = await call(admin, "GET", "/api/coupons");
  step("coupon usage tracked (used_count = 1)", (couponList.json?.coupons || []).find((c) => c.id === couponId)?.used_count === 1);
  await call(buyer, "POST", `/api/orders/${couponOrder.id}`, { action: "cancel" });
  const couponList2 = await call(admin, "GET", "/api/coupons");
  step("cancel releases the coupon use", (couponList2.json?.coupons || []).find((c) => c.id === couponId)?.used_count === 0);

  // ── P2: min quantity + variants ─────────────────────────────────
  await call(admin, "PATCH", `/api/db/products?id=eq.${cpId}`, { min_quantity: 3 });
  const underMin = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 2, customer_email: buyerEmail });
  step("below min quantity = 422", underMin.status === 422, `got ${underMin.status}: ${underMin.json?.error || ""}`);
  const atMin = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 3, customer_email: buyerEmail });
  step("at min quantity = 201", atMin.status === 201, `got ${atMin.status}`);
  await call(buyer, "POST", `/api/orders/${atMin.json?.order?.id}`, { action: "cancel" });
  await call(admin, "PATCH", `/api/db/products?id=eq.${cpId}`, { min_quantity: 1, variants: [{ label: "Pro Pack", priceDelta: 5, stock: null }] });
  const vOrder = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 1, customer_email: buyerEmail, variant_label: "Pro Pack" });
  step("variant order priced with delta", vOrder.status === 201 && Number(vOrder.json?.order?.total_price) === 25.5 && vOrder.json?.order?.variant_label === "Pro Pack", `total=${vOrder.json?.order?.total_price}`);
  await call(buyer, "POST", `/api/orders/${vOrder.json?.order?.id}`, { action: "cancel" });
  const badVariant = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 1, customer_email: buyerEmail, variant_label: "Nope" });
  step("unknown variant = 422", badVariant.status === 422, `got ${badVariant.status}`);

  // ── P2: derived stock (single source of truth) ──────────────────
  const derivedProd = await call(admin, "POST", "/api/db/products", { title: `E2E Derived ${uniq}`, price: 8, stock: 0, category: "E2E", use_inventory_stock: true });
  const dpId = derivedProd.json?.data?.[0]?.id;
  for (let i = 0; i < 2; i++) {
    await call(admin, "POST", "/api/db/inventory", { product_id: dpId, account_login: `derived-${uniq}-${i}@vault.test`, account_password: `dpw-${i}`, status: "available" });
  }
  const dpRead = await call(admin, "GET", `/api/db/products?id=eq.${dpId}`);
  step("derived stock syncs from inventory (0 → 2)", Number(dpRead.json?.data?.[0]?.stock) === 2, `stock=${dpRead.json?.data?.[0]?.stock}`);
  const overDerived = await call(buyer, "POST", "/api/orders", { product_id: dpId, quantity: 3, customer_email: buyerEmail });
  step("oversell of derived stock = 409", overDerived.status === 409, `got ${overDerived.status}`);
  const dOrder = await call(buyer, "POST", "/api/orders", { product_id: dpId, quantity: 2, customer_email: buyerEmail });
  step("derived order at exact stock = 201", dOrder.status === 201, `got ${dOrder.status}`);
  const dpRead2 = await call(admin, "GET", `/api/db/products?id=eq.${dpId}`);
  step("derived stock nets reservations (2 → 0)", Number(dpRead2.json?.data?.[0]?.stock) === 0, `stock=${dpRead2.json?.data?.[0]?.stock}`);
  await call(buyer, "POST", `/api/orders/${dOrder.json?.order?.id}`, { action: "cancel" });

  // ── P4: invoice page renders ────────────────────────────────────
  const invoice = await call(buyer, "GET", `/order/${order1.id}/invoice`);
  step("invoice page = 200 (client-rendered receipt)", invoice.status === 200 && (invoice.text || "").toLowerCase().includes("invoice"), `got ${invoice.status}`);

  // ── P4: email outbox queued honestly (no provider in test env) ──
  const outbox = await call(admin, "GET", "/api/admin/outbox");
  step("outbox holds queued order emails, provider unconfigured", outbox.status === 200 && outbox.json?.email_configured === false && (outbox.json?.counts?.pending || 0) >= 1, JSON.stringify(outbox.json?.counts));

  // ── P2/P4: CSV export carries the catalog ───────────────────────
  const csv = await call(admin, "GET", "/api/admin/products-csv?type=products");
  step("products CSV export contains test product", csv.status === 200 && (csv.text || "").includes(`E2E Widget ${uniq}`), `got ${csv.status}`);

  // ── P3: ticket states ───────────────────────────────────────────
  const myProfile = (await call(buyer, "GET", "/api/me")).json?.profile;
  const ticketMsg = await call(buyer, "POST", "/api/db/messages", { message: `E2E ticket ${uniq}`, subject: "Help" });
  step("buyer opens a ticket message", ticketMsg.status === 200, `got ${ticketMsg.status}`);
  const adminThread = await call(admin, "GET", `/api/db/messages?username=eq.${encodeURIComponent(myProfile.username)}`);
  step("ticket state = open on buyer message", (adminThread.json?.data || []).every((m) => m.ticket_status === "open") && (adminThread.json?.data || []).length > 0);
  await call(admin, "PATCH", `/api/db/messages?username=eq.${encodeURIComponent(myProfile.username)}`, { ticket_status: "closed" });
  const buyerThread = await call(buyer, "GET", `/api/db/messages?username=eq.${encodeURIComponent(myProfile.username)}`);
  step("ticket state = closed after admin closes", (buyerThread.json?.data || []).length > 0 && (buyerThread.json?.data || []).every((m) => m.ticket_status === "closed"));

  // ── P4: broadcast reaches buyers ────────────────────────────────
  const bTitle = `E2E Announcement ${uniq}`;
  const broadcast = await call(admin, "POST", "/api/admin/broadcast", { title: bTitle, body: "Suite broadcast — please ignore." });
  step("broadcast created for all buyers", broadcast.status === 201 && (broadcast.json?.recipients || 0) >= 1, `recipients=${broadcast.json?.recipients}`);
  const announcements = await call(buyer, "GET", "/api/announcements");
  step("buyer sees the announcement", (announcements.json?.announcements || []).some((a) => a.title === bTitle));

  // ══ FULFILMENT TYPES (instant | manual | service + partial) ════

  // ── service: category intake schema + service product ───────────
  const svcCatName = `E2E Services ${uniq}`;
  const svcCat = await call(admin, "POST", "/api/db/categories", {
    name: svcCatName,
    intake_schema: [
      { key: "game_id", label: "Game ID", type: "text", required: true },
      { key: "server", label: "Server", type: "select", required: true, options: ["NA", "EU"] },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  });
  step("admin creates category with intake schema", svcCat.status === 200 && Array.isArray(svcCat.json?.data?.[0]?.intake_schema) && svcCat.json.data[0].intake_schema.length === 3, `status ${svcCat.status}`);

  const svcProd = await call(admin, "POST", "/api/db/products", { title: `E2E Rank Boost ${uniq}`, price: 15, stock: 5, category: svcCatName, fulfilment_type: "service", warranty_days: 30 });
  const svcProduct = svcProd.json?.data?.[0];
  step("admin creates SERVICE product with warranty", svcProd.status === 200 && svcProduct?.fulfilment_type === "service" && Number(svcProduct?.warranty_days) === 30, `status ${svcProd.status} type=${svcProduct?.fulfilment_type}`);

  const svcPage = await call(null, "GET", `/product/${svcProduct.id}`);
  step("product page shows the warranty badge", svcPage.status === 200 && (svcPage.text || "").includes("30-day warranty"), `status ${svcPage.status}`);
  step("product page labels the fulfilment as a service", (svcPage.text || "").includes("Service — details required"));

  // ── service: intake is REQUIRED before payment ──────────────────
  const noIntake = await call(buyer, "POST", "/api/orders", { product_id: svcProduct.id, quantity: 1, customer_email: buyerEmail });
  step("service order without intake = 422", noIntake.status === 422, `got ${noIntake.status}: ${noIntake.json?.error || ""}`);
  const partialIntake = await call(buyer, "POST", "/api/orders", { product_id: svcProduct.id, quantity: 1, customer_email: buyerEmail, intake_data: { game_id: "p1" } });
  step("service order missing a required field = 422", partialIntake.status === 422, `got ${partialIntake.status}`);

  const svcOrderRes = await call(buyer, "POST", "/api/orders", { product_id: svcProduct.id, quantity: 1, customer_email: buyerEmail, payWithWallet: true, intake_data: { game_id: "player-1", server: "NA", notes: "evenings only" } });
  const svcOrder = svcOrderRes.json?.order;
  step("service order with intake = 201 + paid via wallet", svcOrderRes.status === 201 && svcOrder?.payment_status === "paid", `status ${svcOrderRes.status} ps=${svcOrder?.payment_status}`);
  step("intake stored on the order", svcOrder?.intake_data?.game_id === "player-1" && svcOrder?.intake_data?.server === "NA", JSON.stringify(svcOrder?.intake_data));
  step("service order waits in PREPARING (no auto-delivery, no vault)", svcOrder?.status === "PREPARING" && !svcOrder?.credential_username, `status=${svcOrder?.status}`);
  const walletSvc = await call(buyer, "GET", "/api/wallet");
  step("wallet debited for the service ($25 → $9.50)", Number(walletSvc.json?.wallet?.balance) === 9.5, `balance=${walletSvc.json?.wallet?.balance}`);

  // ── service: progress → proof gate → delivery → confirm ─────────
  const progress = await call(admin, "POST", `/api/orders/${svcOrder.id}`, { action: "progress", note: "Boost started — currently Diamond II" });
  step("admin posts a progress update", progress.status === 200, `got ${progress.status}: ${progress.json?.error || ""}`);
  const svcView = await call(buyer, "GET", `/api/orders/${svcOrder.id}`);
  step("buyer sees the progress note in the order timeline", (svcView.json?.order?.events || []).some((e) => e.event === "progress" && (e.detail || "").includes("Diamond II")));
  step("buyer order carries the proofs list", Array.isArray(svcView.json?.order?.proofs) && svcView.json.order.proofs.length === 0);

  const noProof = await call(admin, "POST", `/api/orders/${svcOrder.id}`, { action: "deliver_service" });
  step("service completion WITHOUT proof = 422", noProof.status === 422, `got ${noProof.status}: ${noProof.json?.error || ""}`);
  const addProof = await call(admin, "POST", `/api/orders/${svcOrder.id}`, { action: "add_proof", note: "Final rank reached — screenshot on file", kind: "completion" });
  step("admin attaches a completion proof (written note)", addProof.status === 200, `got ${addProof.status}: ${addProof.json?.error || ""}`);
  const svcDeliver = await call(admin, "POST", `/api/orders/${svcOrder.id}`, { action: "deliver_service" });
  step("service delivered once proof exists", svcDeliver.status === 200 && svcDeliver.json?.order?.status === "Delivering" && Number(svcDeliver.json?.order?.delivered_quantity) === 1, `status=${svcDeliver.json?.order?.status} dq=${svcDeliver.json?.order?.delivered_quantity}`);
  const svcView2 = await call(buyer, "GET", `/api/orders/${svcOrder.id}`);
  step("buyer sees the completion proof", (svcView2.json?.order?.proofs || []).some((p) => p.kind === "completion"));
  const svcConfirm = await call(buyer, "POST", `/api/orders/${svcOrder.id}`, { action: "confirm_receipt" });
  step("buyer confirms service → Completed", svcConfirm.status === 200 && svcConfirm.json?.order?.status === "Completed", svcConfirm.json?.order?.status);

  // ── partial delivery: qty 3, only 2 units in inventory ────────
  const instProd = await call(admin, "POST", "/api/db/products", { title: `E2E Instant Pack ${uniq}`, price: 10, stock: 5, category: "E2E", fulfilment_type: "instant" });
  const instProduct = instProd.json?.data?.[0];
  step("admin creates INSTANT product (manual stock counter 5)", instProd.status === 200 && instProduct?.fulfilment_type === "instant", `status ${instProd.status}`);
  for (let i = 0; i < 2; i++) {
    await call(admin, "POST", "/api/db/inventory", { product_id: instProduct.id, account_login: `inst-${uniq}-${i}@vault.test`, account_password: `ipw-${i}`, status: "available" });
  }
  const instPage = await call(null, "GET", `/product/${instProduct.id}`);
  step("product page labels instant delivery", instPage.status === 200 && (instPage.text || "").includes("Instant delivery"));

  const topup2 = await call(buyer, "POST", "/api/wallet", { amount: 40, method: "bkash", trxId: `TP2${uniq}`.toUpperCase(), senderNumber: "01700000001" });
  const queue3 = await call(admin, "GET", "/api/admin/payments?status=pending");
  const topRow2 = (queue3.json?.payment_requests || []).find((r) => r.id === topup2.json?.payment_request?.id);
  await call(admin, "POST", "/api/admin/payments", { id: topRow2.id, approve: true });
  const walletTop = await call(buyer, "GET", "/api/wallet");
  step("wallet topped up ($9.50 → $49.50)", Number(walletTop.json?.wallet?.balance) === 49.5, `balance=${walletTop.json?.wallet?.balance}`);

  const pOrderRes = await call(buyer, "POST", "/api/orders", { product_id: instProduct.id, quantity: 3, customer_email: buyerEmail, payWithWallet: true });
  const pOrder = pOrderRes.json?.order;
  step("qty-3 order paid from wallet", pOrderRes.status === 201 && pOrder?.payment_status === "paid", `status ${pOrderRes.status}`);
  const pView = await call(buyer, "GET", `/api/orders/${pOrder.id}`);
  step("partial delivery tracked: 2 of 3 delivered", Number(pView.json?.order?.delivered_quantity) === 2, `dq=${pView.json?.order?.delivered_quantity}`);
  step("partial order is Delivering with the first credentials in the vault", pView.json?.order?.status === "Delivering" && !!pView.json?.order?.credential_username, `status=${pView.json?.order?.status}`);
  const instAfter = await call(admin, "GET", `/api/db/products?id=eq.${instProduct.id}`);
  step("sold counts only delivered units (2); stock counter untouched by delivery (2 left reserved)", Number(instAfter.json?.data?.[0]?.sold) === 2 && Number(instAfter.json?.data?.[0]?.stock) === 2, `sold=${instAfter.json?.data?.[0]?.sold} stock=${instAfter.json?.data?.[0]?.stock}`);

  const confirmPart = await call(buyer, "POST", `/api/orders/${pOrder.id}`, { action: "confirm_partial" });
  step("buyer confirms the delivered part", confirmPart.status === 200, `got ${confirmPart.status}: ${confirmPart.json?.error || ""}`);
  const confirmPart2 = await call(buyer, "POST", `/api/orders/${pOrder.id}`, { action: "confirm_partial" });
  step("second partial confirm = 409", confirmPart2.status === 409, `got ${confirmPart2.status}`);

  const cancelRem = await call(buyer, "POST", `/api/orders/${pOrder.id}`, { action: "cancel_remainder" });
  step("buyer cancels the remainder → order Completed", cancelRem.status === 200 && cancelRem.json?.order?.status === "Completed" && cancelRem.json?.order?.escrow_state === "completed", `status=${cancelRem.json?.order?.status}`);
  const walletAfterRem = await call(buyer, "GET", "/api/wallet");
  step("pro-rated refund credited exactly ($19.00 → $29.00)", Number(walletAfterRem.json?.wallet?.balance) === 29, `balance=${walletAfterRem.json?.wallet?.balance}`);
  step("partial refund ledger row exists ($10.00)", (walletAfterRem.json?.transactions || []).some((t) => t.type === "refund" && Number(t.amount) === 10));
  const instFinal = await call(admin, "GET", `/api/db/products?id=eq.${instProduct.id}`);
  step("stock exact after remainder cancel (counter 3 = 5 − 3 + 1 back; sold stays 2)", Number(instFinal.json?.data?.[0]?.stock) === 3 && Number(instFinal.json?.data?.[0]?.sold) === 2, `stock=${instFinal.json?.data?.[0]?.stock} sold=${instFinal.json?.data?.[0]?.sold}`);
  const deliverLate = await call(admin, "POST", `/api/orders/${pOrder.id}`, { action: "deliver_units", units: 1 });
  step("deliver_units on a completed order = 409", deliverLate.status === 409, `got ${deliverLate.status}`);

  // ── P0: hide shop gates ordering ────────────────────────────────
  const hideRes = await call(admin, "PUT", "/api/admin/settings", { store_open: "false" });
  step("admin hides the shop", hideRes.status === 200 && hideRes.json?.settings?.store_open === "false", `got ${hideRes.status}`);
  const cfgClosed = await call(buyer, "GET", "/api/payments/config");
  step("payment config reports store closed", cfgClosed.json?.store_open === false);
  const closedOrder = await call(buyer, "POST", "/api/orders", { product_id: cpId, quantity: 1, customer_email: buyerEmail });
  step("order while hidden = 503", closedOrder.status === 503, `got ${closedOrder.status}: ${closedOrder.json?.error || ""}`);
  const homeClosed = await call(null, "GET", "/");
  step("storefront still renders while hidden (closed notice)", homeClosed.status === 200, `got ${homeClosed.status}`);
  const showRes = await call(admin, "PUT", "/api/admin/settings", { store_open: "true" });
  step("admin reopens the shop", showRes.status === 200 && showRes.json?.settings?.store_open === "true");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[${label}] ${results.length - failed.length}/${results.length} steps passed`);
  if (failed.length) { console.log("FAILED:", failed.map((f) => f.name).join(" | ")); process.exit(1); }
}

main().catch((e) => { console.error("SUITE ERROR:", e); process.exit(2); });
