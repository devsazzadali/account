import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Round a money value to exactly 2 decimals (Fix Round 5, item 1).
 * Prices are Decimal(10,2) in the schema, but legacy rows / float
 * pipelines can surface binary-float artifacts such as
 * 16.489999771118164 for $16.49. Every admin price read (form state)
 * and write (API) passes through here so the artifact can neither be
 * displayed nor re-saved.
 */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return n;
  return Math.round(n * 100) / 100;
}

/** roundMoney as a display string, e.g. "16.49" ("" for null/NaN). */
export function moneyInputValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return String(roundMoney(n));
}
