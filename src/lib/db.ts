// AccountStoreOne — Prisma client (Neon serverless adapter).
// Uses @prisma/adapter-neon over the pooled DATABASE_URL so the same client
// works on Vercel serverless and in restricted-egress environments.
// Singleton via globalThis to survive Next.js dev HMR.
import { PrismaClient } from "@prisma/client";
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
