-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create patient forms table
CREATE TABLE public.patient_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  date_of_birth DATE,
  medical_history TEXT,
  current_medications TEXT,
  allergies TEXT,
  chief_complaint TEXT NOT NULL,
  preferred_appointment_date DATE,
  preferred_appointment_time TIME,
  additional_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'scheduled')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_forms ENABLE ROW LEVEL SECURITY;

-- Allow public access for form submission (using token)
CREATE POLICY "Anyone can submit patient forms" 
ON public.patient_forms 
FOR INSERT 
WITH CHECK (true);

-- Staff can view all forms
CREATE POLICY "Staff can view all patient forms" 
ON public.patient_forms 
FOR SELECT 
USING (true);

-- Staff can update form status
CREATE POLICY "Staff can update patient forms" 
ON public.patient_forms 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patient_forms_updated_at
BEFORE UPDATE ON public.patient_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_patient_forms_token ON public.patient_forms(form_token);
CREATE INDEX idx_patient_forms_status ON public.patient_forms(status);
CREATE INDEX idx_patient_forms_submitted_at ON public.patient_forms(submitted_at DESC);