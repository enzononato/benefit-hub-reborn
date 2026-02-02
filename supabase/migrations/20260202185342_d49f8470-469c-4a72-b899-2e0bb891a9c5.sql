-- Migração 1: Adicionar valor 'rh' ao enum app_role
-- IMPORTANTE: O novo valor só poderá ser usado em migrações subsequentes
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rh';