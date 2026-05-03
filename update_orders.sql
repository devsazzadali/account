-- Migration for Orders Table Account Info
ALTER TABLE public.orders ADD COLUMN account_info JSONB;
