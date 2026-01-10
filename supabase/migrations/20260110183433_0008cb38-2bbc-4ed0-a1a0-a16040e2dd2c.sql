-- Add time_unit column to sla_configs table
ALTER TABLE public.sla_configs 
ADD COLUMN time_unit TEXT NOT NULL DEFAULT 'hours' 
CHECK (time_unit IN ('hours', 'days'));