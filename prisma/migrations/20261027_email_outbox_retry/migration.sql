-- Transactional email outbox: retry bookkeeping (2026-10-27, email
-- notifications engagement). Purely additive: existing rows keep
-- attempts = 0 and next_attempt_at = NULL (due immediately).
ALTER TABLE "email_outbox" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "email_outbox" ADD COLUMN IF NOT EXISTS "next_attempt_at" TIMESTAMP(3) WITH TIME ZONE;
