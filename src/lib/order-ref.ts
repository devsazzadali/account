// AccountStoreOne — the customer-visible order number (single source of
// truth). Owner order 2026-10-27: order numbers START with "AS"
// (AccountStore). The number is derived from the order's UUID at display
// time — the first 8 hex characters, uppercased — exactly the code the
// store has always shown, now with the AS- prefix:
//
//     orderCode("f88d7c6b-…")  → "AS-F88D7C6B"
//     orderRef("f88d7c6b-…")   → "#AS-F88D7C6B"   (with the # marker)
//
// Every surface (buyer dashboard, order page, invoice, admin lists,
// emails, in-app notifications, wallet ledger notes) formats through
// here — never re-derive the slice inline. The orders API also exposes
// the value as `order_number` on every shaped order payload.

export function orderCode(orderId: string | null | undefined): string {
  if (!orderId) return "";
  const head = String(orderId).replace(/-/g, "").slice(0, 8).toUpperCase();
  return head ? `AS-${head}` : "";
}

/** The code with the "#" marker most surfaces display, e.g. "#AS-F88D7C6B". */
export function orderRef(orderId: string | null | undefined): string {
  const code = orderCode(orderId);
  return code ? `#${code}` : "";
}
