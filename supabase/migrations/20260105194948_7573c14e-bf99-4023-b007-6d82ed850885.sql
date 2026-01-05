-- Drop the old admin-only SELECT policy
DROP POLICY IF EXISTS "Admin can view sla_configs" ON public.sla_configs;

-- Create new policy that allows admin, gestor, and agente_dp to view SLA configs
CREATE POLICY "Admin, gestor, and agente_dp can view sla_configs" 
ON public.sla_configs 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'agente_dp'::app_role)
);