-- Z2U alignment build (2026-10-26): P0–P5 schema additions.
-- All additive: new columns carry defaults / are nullable, new tables are
-- independent. No existing column is renamed, retyped or dropped.

-- ── orders: remarks, variant, coupon, lifecycle timestamps ──────────
ALTER TABLE "orders" ADD COLUMN "internal_remarks" TEXT;
ALTER TABLE "orders" ADD COLUMN "variant_label" TEXT;
ALTER TABLE "orders" ADD COLUMN "coupon_code" TEXT;
ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "paid_at" TIMESTAMPTZ;
ALTER TABLE "orders" ADD COLUMN "delivered_at" TIMESTAMPTZ;

-- ── products: visibility, min qty, ETA, specs, variants, stock mode ─
ALTER TABLE "products" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN "min_quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "products" ADD COLUMN "delivery_eta_hours" INTEGER;
ALTER TABLE "products" ADD COLUMN "specs" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN "variants" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "products" ADD COLUMN "use_inventory_stock" BOOLEAN NOT NULL DEFAULT false;

-- ── categories: per-category specification attribute schema ─────────
ALTER TABLE "categories" ADD COLUMN "attribute_schema" JSONB NOT NULL DEFAULT '[]';

-- ── messages: support-ticket state ──────────────────────────────────
ALTER TABLE "messages" ADD COLUMN "ticket_status" TEXT NOT NULL DEFAULT 'open';

-- ── reviews: order binding, dimensions, admin reply, moderation ─────
ALTER TABLE "reviews" ADD COLUMN "order_id" TEXT;
ALTER TABLE "reviews" ADD COLUMN "user_id" TEXT;
ALTER TABLE "reviews" ADD COLUMN "delivery_rating" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "service_rating" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "description_rating" INTEGER;
ALTER TABLE "reviews" ADD COLUMN "admin_reply" TEXT;
ALTER TABLE "reviews" ADD COLUMN "reply_at" TIMESTAMPTZ;
ALTER TABLE "reviews" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_key" UNIQUE ("order_id");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── order_events: append-only audit trail ───────────────────────────
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

-- ── coupons ─────────────────────────────────────────────────────────
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

-- ── email_outbox ────────────────────────────────────────────────────
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

-- ── announcements ───────────────────────────────────────────────────
CREATE TABLE "announcements" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "created_by" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
