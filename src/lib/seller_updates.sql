-- Update Orders table for Seller Center features
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_remarks TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promised_delivery_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2);

-- Update Products table for Categories and more metadata if needed
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS game_type TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_node TEXT;

-- Function to set default promised delivery time (e.g., 24 hours from creation)
CREATE OR REPLACE FUNCTION set_promised_delivery_time() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.promised_delivery_time IS NULL THEN
        NEW.promised_delivery_time := NEW.created_at + interval '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_promised_delivery_time
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION set_promised_delivery_time();
