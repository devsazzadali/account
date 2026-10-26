-- Add dedicated 2FA vault fields to orders (Stripe-first + 2FA vault upgrade, 2026-10-26).
-- Delivered accounts commonly carry two-factor authentication: the buyer's
-- vault renders these as a dedicated section (recovery email, raw secret and
-- a live RFC 6238 TOTP code) instead of burying them in the notes text.
ALTER TABLE "orders" ADD COLUMN "two_factor_secret" TEXT;
ALTER TABLE "orders" ADD COLUMN "recovery_email" TEXT;
