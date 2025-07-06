-- Enable realtime for patient_forms table
ALTER TABLE public.patient_forms REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_forms;

-- Enable realtime for hijama_readings table  
ALTER TABLE public.hijama_readings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hijama_readings;

-- Enable realtime for payments table
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;