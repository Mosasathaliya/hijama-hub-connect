-- Backup current patient_forms structure and clear data
-- Create male patients table
CREATE TABLE public.male_patients (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_token uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_name text NOT NULL,
    patient_phone text NOT NULL,
    patient_email text,
    date_of_birth date,
    medical_history text,
    current_medications text,
    allergies text,
    chief_complaint text NOT NULL,
    preferred_appointment_date date,
    preferred_appointment_time time without time zone,
    additional_notes text,
    status text DEFAULT 'pending'::text,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    doctor_id uuid
);

-- Create female patients table
CREATE TABLE public.female_patients (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    form_token uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_name text NOT NULL,
    patient_phone text NOT NULL,
    patient_email text,
    date_of_birth date,
    medical_history text,
    current_medications text,
    allergies text,
    chief_complaint text NOT NULL,
    preferred_appointment_date date,
    preferred_appointment_time time without time zone,
    additional_notes text,
    status text DEFAULT 'pending'::text,
    submitted_at timestamp with time zone NOT NULL DEFAULT now(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    doctor_id uuid
);

-- Enable RLS on new tables
ALTER TABLE public.male_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.female_patients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for male patients
CREATE POLICY "Anyone can submit male patient forms" 
ON public.male_patients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view male patients" 
ON public.male_patients 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can update male patients" 
ON public.male_patients 
FOR UPDATE 
USING (true);

-- Create RLS policies for female patients
CREATE POLICY "Anyone can submit female patient forms" 
ON public.female_patients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view female patients" 
ON public.female_patients 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can update female patients" 
ON public.female_patients 
FOR UPDATE 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_male_patients_updated_at
BEFORE UPDATE ON public.male_patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_female_patients_updated_at
BEFORE UPDATE ON public.female_patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Clear existing patient_forms data
DELETE FROM public.patient_forms;

-- Add indexes for better performance
CREATE INDEX idx_male_patients_appointment_date ON public.male_patients (preferred_appointment_date);
CREATE INDEX idx_female_patients_appointment_date ON public.female_patients (preferred_appointment_date);
CREATE INDEX idx_male_patients_status ON public.male_patients (status);
CREATE INDEX idx_female_patients_status ON public.female_patients (status);