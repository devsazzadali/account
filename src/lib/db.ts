// AccountStoreOne — Prisma client (Neon serverless adapter).
// Uses @prisma/adapter-neon over the pooled DATABASE_URL so the same client
// works on Vercel serverless and in restricted-egress environments.
// Singleton via globalThis to survive Next.js dev HMR.
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "CRITICAL ERROR: DATABASE_URL is missing — Prisma cannot reach Neon. " +
      "Run `neon deploy` / check .env.local.",
  );
}

const adapter = new PrismaNeon({ connectionString: connectionString ?? "" });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

/**
 * Interactive transaction with a window sized for the Neon serverless
 * adapter. Prisma's defaults (maxWait 2s / timeout 5s) are too tight for
 * multi-write order transactions over a WebSocket pool: under load the
 * transaction handle expires mid-flight ("Transaction not found …
 * obtained before disconnecting") and the whole write 500s — observed
 * in QA rounds 10–11 on the exact-stock order path after passing nine
 * rounds. Same semantics, wider window.
 */
export function withTx<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(fn, { maxWait: 10_000, timeout: 20_000 });
}
