-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Staff can view all doctors
CREATE POLICY "Staff can view all doctors" 
ON public.doctors 
FOR SELECT 
USING (true);

-- Staff can insert new doctors
CREATE POLICY "Staff can insert doctors" 
ON public.doctors 
FOR INSERT 
WITH CHECK (true);

-- Staff can update doctors
CREATE POLICY "Staff can update doctors" 
ON public.doctors 
FOR UPDATE 
USING (true);

-- Staff can delete doctors
CREATE POLICY "Staff can delete doctors" 
ON public.doctors 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for name searches
CREATE INDEX idx_doctors_name ON public.doctors(name);
CREATE INDEX idx_doctors_active ON public.doctors(is_active);