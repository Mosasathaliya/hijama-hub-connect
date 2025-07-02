-- Create users table for custom authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  access_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user permissions table
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Admin can view all users" 
ON public.users 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert users" 
ON public.users 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update users" 
ON public.users 
FOR UPDATE 
USING (true);

CREATE POLICY "Admin can delete users" 
ON public.users 
FOR DELETE 
USING (true);

-- Create policies for user_permissions table
CREATE POLICY "Admin can view all user permissions" 
ON public.user_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can insert user permissions" 
ON public.user_permissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update user permissions" 
ON public.user_permissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Admin can delete user permissions" 
ON public.user_permissions 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();