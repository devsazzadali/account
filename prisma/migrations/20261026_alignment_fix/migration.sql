-- Remainder of 20261026_alignment: the reviews FK failed there because
-- orders.id is TEXT (legacy), not UUID. Column types corrected to TEXT.
ALTER TABLE "reviews" ALTER COLUMN "order_id" TYPE TEXT;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "order_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "detail" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "order_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_events_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events" ("order_id", "created_at");

CREATE TABLE "coupons" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'store',
  "product_id" TEXT,
  "category" TEXT,
  "min_spend" DECIMAL(10,2),
  "max_uses" INTEGER,
  "per_user_limit" INTEGER NOT NULL DEFAULT 1,
  "used_count" INTEGER NOT NULL DEFAULT 0,
  "is_public" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupons_code_key" UNIQUE ("code")
);

CREATE TABLE "email_outbox" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "to_email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "sent_at" TIMESTAMPTZ,
  CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_outbox_status_created_at_idx" ON "email_outbox" ("status", "created_at");

CREATE TABLE "announcements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
