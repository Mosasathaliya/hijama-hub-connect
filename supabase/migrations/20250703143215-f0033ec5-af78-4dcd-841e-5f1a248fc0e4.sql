-- Update coupons table to use referrer name instead of code
ALTER TABLE public.coupons 
DROP COLUMN code;

ALTER TABLE public.coupons 
ADD COLUMN referrer_name TEXT NOT NULL DEFAULT '';

-- Update the constraint to make referrer_name required
ALTER TABLE public.coupons 
ALTER COLUMN referrer_name DROP DEFAULT;

-- Drop the old index on code
DROP INDEX IF EXISTS idx_coupons_code;

-- Create new index on referrer_name
CREATE INDEX idx_coupons_referrer_name ON public.coupons(referrer_name);