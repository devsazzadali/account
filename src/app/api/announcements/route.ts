// AccountStoreOne — announcements for signed-in customers (buyer view of
// the broadcast module). GET → latest announcements.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { serializeRows } from "@/src/lib/serialize";

export async function GET(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  return Response.json({ announcements: serializeRows(rows as unknown as Record<string, unknown>[]) });
}
