
-- Allow agente_dp to insert profiles (add collaborators)
CREATE POLICY "Agente DP can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'agente_dp'::app_role));
