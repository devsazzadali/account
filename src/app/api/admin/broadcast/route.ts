// AccountStoreOne — announcement broadcast (Z2U alignment P4).
// Restores the legacy /api/broadcast capability on the new stack:
// POST { title, body } (admin) → an announcements row + one in-app
// notification per customer profile + one queued email per customer
// (sent only when the email provider is configured — see mailer).
// GET → recent announcements (admin).

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { queueEmail, flushEmailOutbox } from "@/src/lib/mailer";
import { serializeRows } from "@/src/lib/serialize";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return Response.json({ announcements: serializeRows(rows as unknown as Record<string, unknown>[]) });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const text = String(body.body || body.message || "").trim();
  if (title.length < 3 || text.length < 3) {
    return Response.json({ error: "An announcement needs a title and a message" }, { status: 422 });
  }

  const announcement = await prisma.announcement.create({
    data: { title, body: text, createdBy: gate.profile.username || gate.user.email },
  });

  const profiles = await prisma.profile.findMany({
    where: { role: "user" },
    select: { id: true, email: true },
    take: 2000,
  });

  await prisma.$transaction(async (tx) => {
    for (const p of profiles) {
      await tx.notification.create({
        data: { userId: p.id, title, message: text, type: "announcement" },
      });
      if (p.email) {
        await queueEmail(tx, p.email, title, `<p>${text.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p>`, text);
      }
    }
  });
  void flushEmailOutbox(100);

  return Response.json({ ok: true, announcement_id: announcement.id, recipients: profiles.length }, { status: 201 });
}
