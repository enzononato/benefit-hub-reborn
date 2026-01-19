-- Add codigo_empresa and codigo_empregador columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN codigo_empresa TEXT,
ADD COLUMN codigo_empregador TEXT;