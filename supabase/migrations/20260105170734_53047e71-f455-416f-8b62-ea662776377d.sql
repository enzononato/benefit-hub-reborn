-- Allow agente_dp to view all units
CREATE POLICY "Agente DP can view all units"
ON public.units
FOR SELECT
USING (has_role(auth.uid(), 'agente_dp'::app_role));