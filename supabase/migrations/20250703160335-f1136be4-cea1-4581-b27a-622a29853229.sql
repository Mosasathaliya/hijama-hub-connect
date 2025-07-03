-- Add taxable field to payments table
ALTER TABLE public.payments 
ADD COLUMN is_taxable BOOLEAN NOT NULL DEFAULT false;