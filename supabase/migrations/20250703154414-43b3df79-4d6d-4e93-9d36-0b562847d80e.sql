-- Add coupon_id to payments table to track which coupon was used
ALTER TABLE public.payments 
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);

-- Create index for better performance
CREATE INDEX idx_payments_coupon_id ON public.payments(coupon_id);