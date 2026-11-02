// AccountStoreOne — support-thread identity (Fix Round 4, item 3).
//
// The messages table has no thread table: historically EVERY row for a
// username formed one single "Customer Support" conversation, with the
// row's `subject` used as a fixed routing label ("Inbox Inquiry" from
// the dashboard desk, "Live Chat Inquiry" from the floating widget,
// "Helpdesk Ticket" on store replies). A customer-created ticket is a
// set of rows whose subject is the ticket's own title — so a thread is
// identified by (username, subject group) with NO schema change:
//
//   - rows whose subject is empty or one of the legacy labels belong
//     to the GENERAL thread ("Customer Support");
//   - rows with any other subject belong to the ticket thread titled
//     by that subject.
//
// Ticket state (ticket_status) is kept in sync on every row OF THE
// THREAD (see threadStatusWhere) — the same invariant the schema
// comment describes, now scoped per thread instead of per user.

export const GENERAL_THREAD_KEY = "general";
export const GENERAL_THREAD_TITLE = "Customer Support";

/** Subject written by the customer desk for general-thread messages. */
export const GENERAL_SUBJECT = "Inbox Inquiry";
/** Subject written by the store desk when replying in the general thread. */
export const ADMIN_GENERAL_SUBJECT = "Helpdesk Ticket";

const GENERAL_SUBJECTS = ["Inbox Inquiry", "Live Chat Inquiry", "Helpdesk Ticket"];

export function isGeneralSubject(subject?: string | null): boolean {
  const s = (subject || "").trim();
  return s === "" || GENERAL_SUBJECTS.includes(s);
}

/** Thread key for a message row's subject. */
export function threadKeyOf(subject?: string | null): string {
  if (isGeneralSubject(subject)) return GENERAL_THREAD_KEY;
  return `ticket:${(subject as string).trim()}`;
}

/** The subject that identifies a thread key, or null for the general thread. */
export function threadSubjectOf(key: string): string | null {
  return key.startsWith("ticket:") ? key.slice("ticket:".length) : null;
}

/** Display title for a thread key. */
export function threadTitleOf(key: string): string {
  return threadSubjectOf(key) ?? GENERAL_THREAD_TITLE;
}

/** The subject to write on a NEW message posted into a thread. */
export function subjectForNewMessage(key: string, fromAdmin: boolean): string {
  const subject = threadSubjectOf(key);
  if (subject) return subject;
  return fromAdmin ? ADMIN_GENERAL_SUBJECT : GENERAL_SUBJECT;
}

/**
 * A customer-chosen ticket title must not collide with the general
 * thread's identity (its legacy subjects or its display title) — such
 * a title gets a suffix so the ticket stays a separate thread.
 */
export function normalizeTicketTitle(raw: string): string {
  const title = raw.trim().replace(/\s+/g, " ").slice(0, 120);
  const lower = title.toLowerCase();
  if (
    GENERAL_SUBJECTS.some((s) => s.toLowerCase() === lower) ||
    lower === GENERAL_THREAD_TITLE.toLowerCase()
  ) {
    return `${title} (ticket)`;
  }
  return title;
}

/**
 * Prisma `where` matching exactly one thread's rows — used to keep
 * ticket_status in sync per thread. The general thread's rows carry
 * mixed legacy subjects (or none), hence the OR.
 */
export function threadStatusWhere(username: string, key: string) {
  const subject = threadSubjectOf(key);
  if (subject === null) {
    return {
      username,
      OR: [{ subject: null }, { subject: { in: GENERAL_SUBJECTS } }],
    };
  }
  return { username, subject };
}
