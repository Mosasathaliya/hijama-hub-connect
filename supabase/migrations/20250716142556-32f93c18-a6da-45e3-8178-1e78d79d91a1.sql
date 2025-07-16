-- Enable realtime for male_patients table
ALTER TABLE public.male_patients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.male_patients;

-- Enable realtime for female_patients table  
ALTER TABLE public.female_patients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.female_patients;