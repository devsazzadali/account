-- ====================================================================================
-- MASTER PRODUCTION SCHEMA: ACCOUNT STORE ONE (UNIFIED)
-- ====================================================================================

-- 1. CORE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE public.order_state AS ENUM ('pending_payment', 'paid', 'in_escrow', 'processing', 'delivered', 'completed', 'disputed', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. CORE TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    seo_title TEXT,
    seo_description TEXT,
    h1_title TEXT,
    content_body TEXT,
    faq_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    stock INTEGER DEFAULT 0,
    category UUID REFERENCES public.categories(id),
    description TEXT,
    seo_keywords TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id),
    user_id UUID REFERENCES auth.users(id),
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pending Payment',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    escrow_state public.order_state DEFAULT 'pending_payment',
    escrow_hold_until TIMESTAMPTZ,
    funds_released_at TIMESTAMPTZ,
    disputed_at TIMESTAMPTZ,
    stripe_session_id TEXT UNIQUE,
    payment_intent_id TEXT,
    idempotency_key UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. INVENTORY & VAULT
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    account_login TEXT NOT NULL,
    account_password TEXT NOT NULL,
    two_factor_secret TEXT,
    cookies TEXT,
    recovery_email TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used', 'failed', 'flagged', 'sold')),
    is_healthy BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMPTZ DEFAULT now(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    reserved_until TIMESTAMPTZ,
    reserved_by_session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. FINTECH: WALLET & LEDGER
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund', 'withdrawal', 'bonus')),
    status TEXT DEFAULT 'completed',
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. TRUST & SAFETY: DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'mediation', 'resolved', 'closed')),
    resolution TEXT CHECK (resolution IN ('refunded', 'replaced', 'rejected', 'canceled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. SECURITY & FRAUD
CREATE TABLE IF NOT EXISTS public.user_risk_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    current_score INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    total_failed_payments INTEGER DEFAULT 0,
    last_detected_ip TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. INDEXES (Idempotent)
CREATE INDEX IF NOT EXISTS idx_inventory_product_status ON public.inventory(product_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. SYSTEM FUNCTIONS & RPCs
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.transition_order_state(p_order_id UUID, p_new_state public.order_state, p_admin_id UUID DEFAULT NULL)
RETURNS public.order_state AS $$
BEGIN
    UPDATE public.orders SET escrow_state = p_new_state, updated_at = now() WHERE id = p_order_id;
    RETURN p_new_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. REALTIME & RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_visibility_policy" ON public.orders;
CREATE POLICY "order_visibility_policy" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
