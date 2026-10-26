// SEO SSR verification helper — inserts ONE clearly-marked test product
// (+ one review) into Neon so server-rendering / metadata / JSON-LD /
// sitemap can be verified against real Prisma data, then removes it.
//
//   node --env-file=.env.local scripts/seo_seed_test.mjs insert
//   node --env-file=.env.local scripts/seo_seed_test.mjs delete
//   node --env-file=.env.local scripts/seo_seed_test.mjs status
//
// Mirrors the adapter setup in src/lib/db.ts. Leaves the DB exactly as
// found when run with `delete`.
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

export const TEST_ID = "seo-ssr-test-product";

const cmd = process.argv[2];

try {
  if (cmd === "insert") {
    await prisma.product.upsert({
      where: { id: TEST_ID },
      update: {},
      create: {
        id: TEST_ID,
        title: "SEO SSR TEST - Netflix Premium 1 Month (UHD)",
        price: 2.99,
        image: "https://picsum.photos/seed/seo-ssr-test/800/450",
        stock: 7,
        category: "STREAMING",
        badge: "TEST",
        sold: 3,
        description:
          "Temporary product inserted only to verify server-side rendering, metadata and JSON-LD. Deleted right after verification.\n--- Properties ---\n4K UHD\nInstant delivery",
      },
    });
    await prisma.review.create({
      data: {
        productId: TEST_ID,
        username: "seo-tester",
        rating: 5,
        comment: "SSR verification review (temporary).",
      },
    });
    console.log("INSERTED test product:", TEST_ID);
  } else if (cmd === "delete") {
    const r = await prisma.review.deleteMany({ where: { productId: TEST_ID } });
    const p = await prisma.product.deleteMany({ where: { id: TEST_ID } });
    console.log(`DELETED reviews=${r.count} products=${p.count}`);
  } else if (cmd === "status") {
    console.log(
      "products total:",
      await prisma.product.count(),
      "| test product present:",
      (await prisma.product.count({ where: { id: TEST_ID } })) > 0,
      "| reviews total:",
      await prisma.review.count(),
    );
  } else {
    console.log("usage: insert | delete | status");
    process.exitCode = 2;
  }
} finally {
  await prisma.$disconnect();
}
