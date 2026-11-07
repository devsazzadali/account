// AccountStoreOne — customer support-ticket state (close / reopen).
// The generic /api/db endpoint deliberately reserves messages PATCH for
// admins, so a customer's own close/reopen goes through here: the thread
// is resolved from the SESSION's profile (never from client input), and
// only the two customer-meaningful states are accepted — "closed"
// (resolved) and "open" (reopen). "awaiting_reply" is the store's state
// to set when it answers, and cannot be claimed by the customer.
//
// Fix Round 4: the body may carry `thread` (a thread key from
// src/lib/message-threads.ts) to close/reopen ONE ticket thread. When
// it is omitted, the legacy behaviour applies (every thread of the
// customer) so older callers keep working.

import { getSessionContext, unauthorized } from "@/src/lib/auth-server";
import { prisma } from "@/src/lib/db";
import {
  GENERAL_THREAD_KEY,
  threadRowsWhere,
  threadSubjectOf,
} from "@/src/lib/message-threads";

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
  const thread = typeof body.thread === "string" ? body.thread : null;
  if (thread !== null && thread !== GENERAL_THREAD_KEY) {
    const subj = threadSubjectOf(thread);
    if (subj === null || subj.trim() === "") {
      return Response.json({ error: "Invalid thread" }, { status: 400 });
    }
  }
  // ধাপ ৫ক৩ — match by stable identity (session user id) with the
  // username as legacy fallback, so close/reopen still reaches rows
  // written under a previous username.
  await prisma.message.updateMany({
    where: thread
      ? threadRowsWhere({ username, userId: ctx.user.id }, thread)
      : { OR: [{ username }, { userId: ctx.user.id }] },
    data: { ticketStatus: status },
  });
  return Response.json({ ok: true, ticket_status: status });
}
