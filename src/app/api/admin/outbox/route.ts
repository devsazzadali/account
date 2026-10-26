// AccountStoreOne — email outbox inspector (admin). Shows whether
// transactional email is configured and the state of queued mail:
// pending = queued but no provider configured (or not yet flushed),
// sent / failed carry the provider outcome. Nothing is ever faked.

import { requireAdmin, isResponse } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import { emailConfigured, flushEmailOutbox } from "@/src/lib/mailer";
import { serializeRows } from "@/src/lib/serialize";

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  const status = new URL(req.url).searchParams.get("status") || undefined;
  const rows = await prisma.emailOutbox.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const [pending, sent, failed] = await Promise.all([
    prisma.emailOutbox.count({ where: { status: "pending" } }),
    prisma.emailOutbox.count({ where: { status: "sent" } }),
    prisma.emailOutbox.count({ where: { status: "failed" } }),
  ]);
  return Response.json({
    email_configured: emailConfigured(),
    counts: { pending, sent, failed },
    emails: serializeRows(rows as unknown as Record<string, unknown>[]),
  });
}

/** POST → attempt to flush pending mail now (no-op when unconfigured). */
export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if (isResponse(gate)) return gate;
  await flushEmailOutbox(100);
  return Response.json({ ok: true, email_configured: emailConfigured() });
}
