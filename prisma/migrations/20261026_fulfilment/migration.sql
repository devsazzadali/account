-- Per-product fulfilment types (instant | manual | service).
-- Additive only: new enum, new columns with safe defaults, one new table.

CREATE TYPE "FulfilmentType" AS ENUM ('instant', 'manual', 'service');

ALTER TABLE "products" ADD COLUMN "fulfilment_type" "FulfilmentType" NOT NULL DEFAULT 'manual';
ALTER TABLE "products" ADD COLUMN "warranty_days" INTEGER;

-- Backfill: inventory-backed products are the instant-delivery ones.
UPDATE "products" SET "fulfilment_type" = 'instant' WHERE "use_inventory_stock" = true;

ALTER TABLE "categories" ADD COLUMN "intake_schema" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "orders" ADD COLUMN "intake_data" JSONB;
ALTER TABLE "orders" ADD COLUMN "delivered_quantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill: orders that were already delivered count as fully delivered.
UPDATE "orders" SET "delivered_quantity" = "quantity" WHERE "delivered_at" IS NOT NULL AND "status" IN ('Delivering', 'Completed');

CREATE TABLE "delivery_proofs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" TEXT NOT NULL,
    "file_url" TEXT,
    "note" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'completion',
    "created_by" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_proofs_order_id_created_at_idx" ON "delivery_proofs"("order_id", "created_at");

ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
