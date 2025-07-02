-- Create hijama_cup_prices table
CREATE TABLE public.hijama_cup_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number_of_cups INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hijama_cup_prices ENABLE ROW LEVEL SECURITY;

-- Staff can view all pricing
CREATE POLICY "Staff can view all hijama cup prices" 
ON public.hijama_cup_prices 
FOR SELECT 
USING (true);

-- Staff can insert new pricing
CREATE POLICY "Staff can insert hijama cup prices" 
ON public.hijama_cup_prices 
FOR INSERT 
WITH CHECK (true);

-- Staff can update pricing
CREATE POLICY "Staff can update hijama cup prices" 
ON public.hijama_cup_prices 
FOR UPDATE 
USING (true);

-- Staff can delete pricing
CREATE POLICY "Staff can delete hijama cup prices" 
ON public.hijama_cup_prices 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_hijama_cup_prices_updated_at
BEFORE UPDATE ON public.hijama_cup_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_hijama_cup_prices_number_of_cups ON public.hijama_cup_prices(number_of_cups);
CREATE INDEX idx_hijama_cup_prices_active ON public.hijama_cup_prices(is_active);