-- Create table for treatment conditions
CREATE TABLE public.treatment_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_form_id UUID NOT NULL REFERENCES public.patient_forms(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_form_id, condition_name)
);

-- Enable RLS
ALTER TABLE public.treatment_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view all treatment conditions" 
ON public.treatment_conditions 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can insert treatment conditions" 
ON public.treatment_conditions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update treatment conditions" 
ON public.treatment_conditions 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff can delete treatment conditions" 
ON public.treatment_conditions 
FOR DELETE 
USING (true);

-- Add trigger for timestamps
CREATE TRIGGER update_treatment_conditions_updated_at
BEFORE UPDATE ON public.treatment_conditions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();