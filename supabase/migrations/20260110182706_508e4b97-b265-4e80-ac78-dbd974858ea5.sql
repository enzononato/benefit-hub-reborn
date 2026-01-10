-- Create holidays table for SLA calculation
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can read holidays
CREATE POLICY "Anyone can view holidays" 
ON public.holidays 
FOR SELECT 
USING (true);

-- Only admin and gestor can manage holidays
CREATE POLICY "Admin and gestor can insert holidays" 
ON public.holidays 
FOR INSERT 
WITH CHECK (public.is_admin_or_gestor());

CREATE POLICY "Admin and gestor can update holidays" 
ON public.holidays 
FOR UPDATE 
USING (public.is_admin_or_gestor());

CREATE POLICY "Admin and gestor can delete holidays" 
ON public.holidays 
FOR DELETE 
USING (public.is_admin_or_gestor());

-- Add index for date lookups
CREATE INDEX idx_holidays_date ON public.holidays(date);