-- Drop the old foreign key constraint
ALTER TABLE public.hijama_readings 
DROP CONSTRAINT hijama_readings_patient_form_id_fkey;

-- Rename the column to be more generic
ALTER TABLE public.hijama_readings 
RENAME COLUMN patient_form_id TO patient_id;

-- Add a new column to track the patient table (male or female)
ALTER TABLE public.hijama_readings 
ADD COLUMN patient_table text DEFAULT 'patient_forms';

-- Update existing records to use the old table name (though there shouldn't be any since we cleared data)
UPDATE public.hijama_readings 
SET patient_table = 'patient_forms' 
WHERE patient_table IS NULL;

-- Add index for better performance
CREATE INDEX idx_hijama_readings_patient ON public.hijama_readings (patient_id, patient_table);