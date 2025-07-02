-- Drop the existing constraint
ALTER TABLE public.patient_forms DROP CONSTRAINT patient_forms_status_check;

-- Add updated constraint with more status options
ALTER TABLE public.patient_forms ADD CONSTRAINT patient_forms_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'scheduled'::text, 'in_treatment'::text, 'completed'::text, 'cancelled'::text]));