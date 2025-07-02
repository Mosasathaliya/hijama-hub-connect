-- Drop the existing status check constraint
ALTER TABLE public.patient_forms 
DROP CONSTRAINT patient_forms_status_check;

-- Add new check constraint with additional status values
ALTER TABLE public.patient_forms 
ADD CONSTRAINT patient_forms_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'reviewed'::text, 
  'scheduled'::text, 
  'in_treatment'::text, 
  'payment_pending'::text,
  'paid_and_assigned'::text,
  'completed'::text, 
  'cancelled'::text
]));