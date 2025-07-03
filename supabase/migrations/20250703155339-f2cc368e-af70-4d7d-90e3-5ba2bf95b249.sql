-- Update the payment that used a coupon to link it with the coupon
UPDATE public.payments 
SET coupon_id = 'a81556a4-cb65-422c-a74f-21ebb897017c'
WHERE id = '8cddde83-fb68-44b2-a960-29abbe68a330';