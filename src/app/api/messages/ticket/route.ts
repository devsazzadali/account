// AccountStoreOne — customer support-ticket state (close / reopen).
// The generic /api/db endpoint deliberately reserves messages PATCH for
// admins, so a customer's own close/reopen goes through here: the thread
// is resolved from the SESSION's profile (never from client input), and
// only the two customer-meaningful states are accepted — "closed"
// (resolved) and "open" (reopen). "awaiting_reply" is the store's state
// to set when it answers, and cannot be claimed by the customer.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";

export async function POST(req: Request) {
  const ctx = await getSessionContext(req);
  if (!ctx) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const status = body.status === "closed" ? "closed" : body.status === "open" ? "open" : null;
  if (!status) {
    return Response.json({ error: "Invalid ticket status" }, { status: 400 });
  }
  const username = (ctx.profile as { username?: string } | null)?.username;
  if (!username) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }
  await prisma.message.updateMany({
    where: { username },
    data: { ticketStatus: status },
  });
  return Response.json({ ok: true, ticket_status: status });
}
