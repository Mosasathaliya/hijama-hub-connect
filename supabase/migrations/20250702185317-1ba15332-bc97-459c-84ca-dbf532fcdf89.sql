-- Add doctor_id column to patient_forms table
ALTER TABLE public.patient_forms 
ADD COLUMN doctor_id UUID REFERENCES public.doctors(id);

-- Create payments table to track payment information
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_form_id UUID NOT NULL REFERENCES public.patient_forms(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id),
  amount DECIMAL(10,2) NOT NULL,
  hijama_points_count INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
CREATE POLICY "Staff can view all payments" 
ON public.payments 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update payments" 
ON public.payments 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff can delete payments" 
ON public.payments 
FOR DELETE 
USING (true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create hijama_readings table to store vital signs and hijama points
CREATE TABLE public.hijama_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_form_id UUID NOT NULL REFERENCES public.patient_forms(id) ON DELETE CASCADE,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  weight DECIMAL(5,2),
  hijama_points JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hijama_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for hijama_readings table
CREATE POLICY "Staff can view all hijama readings" 
ON public.hijama_readings 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can insert hijama readings" 
ON public.hijama_readings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update hijama readings" 
ON public.hijama_readings 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff can delete hijama readings" 
ON public.hijama_readings 
FOR DELETE 
USING (true);

-- Add trigger for updating updated_at
CREATE TRIGGER update_hijama_readings_updated_at
BEFORE UPDATE ON public.hijama_readings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();