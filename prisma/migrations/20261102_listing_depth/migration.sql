-- Listing depth (Fix Round 6, video-gap #3 + #9).
-- Additive only: three new columns on products with safe defaults.
--  * listing_duration_days — optional listing lifetime set by the admin;
--    NULL means the listing never expires.
--  * listing_expires_at — server-computed sell-by moment (create / renew /
--    extend set it to now + duration); expired listings stop selling on
--    the storefront and at checkout but stay visible in admin.
--  * sort_order — manual storefront display order (ascending).

ALTER TABLE "products" ADD COLUMN "listing_duration_days" INTEGER;
ALTER TABLE "products" ADD COLUMN "listing_expires_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
