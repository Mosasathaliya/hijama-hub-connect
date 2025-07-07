-- Fix payments table to work with gender-based patient tables
-- Drop the old foreign key constraint
ALTER TABLE public.payments 
DROP CONSTRAINT payments_patient_form_id_fkey;

-- Rename the column to be more generic
ALTER TABLE public.payments 
RENAME COLUMN patient_form_id TO patient_id;

-- Add a new column to track the patient table (male or female)
ALTER TABLE public.payments 
ADD COLUMN patient_table text DEFAULT 'patient_forms';

-- Update existing records to use the old table name (though there shouldn't be any since we cleared data)
UPDATE public.payments 
SET patient_table = 'patient_forms' 
WHERE patient_table IS NULL;

-- Add index for better performance
CREATE INDEX idx_payments_patient ON public.payments (patient_id, patient_table);