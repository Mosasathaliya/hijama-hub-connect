-- Add gender column to patient_forms table
ALTER TABLE public.patient_forms 
ADD COLUMN gender text;

-- Add an index for better performance when filtering by gender
CREATE INDEX idx_patient_forms_gender ON public.patient_forms (gender);