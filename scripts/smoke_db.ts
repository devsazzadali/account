import { prisma } from "../src/lib/db";
async function main() {
  const before = await prisma.category.count();
  const c = await prisma.category.create({ data: { name: "SMOKE TEST", slug: "smoke-test" } });
  const found = await prisma.category.findUnique({ where: { slug: "smoke-test" } });
  await prisma.category.delete({ where: { id: c.id } });
  const after = await prisma.category.count();
  console.log(`PRISMA OK: count before=${before}, created id=${found?.id?.slice(0,8)}…, cleaned up, count after=${after}`);
  console.log("tables reachable: products=" + (await prisma.product.count()) + " orders=" + (await prisma.order.count()) + " profiles=" + (await prisma.profile.count()));
  await prisma.$disconnect();
}
main().catch((e) => { console.error("PRISMA FAIL:", e.message); process.exit(1); });
