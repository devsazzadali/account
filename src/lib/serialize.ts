// AccountStoreOne — Prisma row → API JSON serializer.
// Converts camelCase fields to the snake_case shapes the UI was built
// against, Prisma Decimals to plain numbers, and Dates to ISO strings.
// Nested relations (e.g. order.products) are converted recursively.

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function isDecimalLike(v: unknown): v is { toNumber: () => number } {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  // decimal.js instances (Prisma Decimal) carry s/e/d internals; the
  // constructor name is minified in bundled builds, so detect structurally.
  return (
    typeof o.toNumber === "function" &&
    typeof o.toFixed === "function" &&
    "s" in o && "e" in o && "d" in o
  );
}

export function serializeValue(v: unknown): unknown {
  if (v === null || v === undefined) return v ?? null;
  if (v instanceof Date) return v.toISOString();
  if (isDecimalLike(v)) return v.toNumber();
  if (Array.isArray(v)) return v.map(serializeValue);
  if (typeof v === "object") return serializeRow(v as Record<string, unknown>);
  return v;
}

export function serializeRow<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[camelToSnake(k)] = serializeValue(v);
  }
  return out;
}

export function serializeRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((r) => serializeRow(r));
}
