-- Allow Gestor to update profiles
CREATE POLICY "Gestor can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'gestor'::app_role))
WITH CHECK (has_role(auth.uid(), 'gestor'::app_role));

-- Allow Agente DP to update profiles
CREATE POLICY "Agente DP can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'agente_dp'::app_role))
WITH CHECK (has_role(auth.uid(), 'agente_dp'::app_role));