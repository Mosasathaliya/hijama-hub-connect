-- Add referral percentage column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN referral_percentage NUMERIC NOT NULL DEFAULT 0 CHECK (referral_percentage >= 0 AND referral_percentage <= 100);