-- Restringir acesso a benefit_requests por módulos (Convênios/Benefícios/DP)
-- Objetivo: Gestor/Agente DP só podem ver/atualizar solicitações dos tipos (benefit_type)
-- para os quais possuem permissão em user_module_permissions.

-- 1) Remover políticas permissivas que liberam acesso total
DROP POLICY IF EXISTS "Agente DP can view all requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Gestor can view all requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Agente DP can update all requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Gestor can update all requests" ON public.benefit_requests;
DROP POLICY IF EXISTS "Users cannot update own requests" ON public.benefit_requests;

-- 2) SELECT: admin vê tudo, colaborador vê as próprias, staff vê apenas módulos permitidos
CREATE POLICY "Staff can view permitted benefit requests"
ON public.benefit_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (user_id = auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.user_module_permissions ump
    WHERE ump.user_id = auth.uid()
      AND ump.module = benefit_type::text
  )
);

-- 3) UPDATE: admin pode tudo; gestor/agente_dp apenas dentro dos módulos permitidos
CREATE POLICY "Staff can update permitted benefit requests"
ON public.benefit_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    (public.has_role(auth.uid(), 'gestor'::public.app_role) OR public.has_role(auth.uid(), 'agente_dp'::public.app_role))
    AND EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      WHERE ump.user_id = auth.uid()
        AND ump.module = benefit_type::text
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    (public.has_role(auth.uid(), 'gestor'::public.app_role) OR public.has_role(auth.uid(), 'agente_dp'::public.app_role))
    AND EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      WHERE ump.user_id = auth.uid()
        AND ump.module = benefit_type::text
    )
  )
);
