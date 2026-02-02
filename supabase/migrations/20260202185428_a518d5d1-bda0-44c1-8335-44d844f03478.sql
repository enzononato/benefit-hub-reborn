-- Migração 2: Adicionar colunas para controle de aprovação RH e políticas RLS

-- 1. Adicionar colunas na tabela benefit_requests
ALTER TABLE public.benefit_requests
ADD COLUMN IF NOT EXISTS hr_status text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hr_reviewed_by uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hr_reviewed_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS hr_notes text DEFAULT NULL;

-- 2. Criar políticas RLS para o papel RH

-- RH pode visualizar solicitações de alteração de férias
CREATE POLICY "RH can view alteracao_ferias requests"
ON public.benefit_requests
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
);

-- RH pode atualizar campos de aprovação RH em solicitações de alteração de férias
CREATE POLICY "RH can update hr fields on alteracao_ferias"
ON public.benefit_requests
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
)
WITH CHECK (
  public.has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
);

-- 3. Adicionar política para RH visualizar perfis (necessário para ver nomes)
CREATE POLICY "RH can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'rh'::app_role)
);

-- 4. Adicionar política para RH visualizar unidades
CREATE POLICY "RH can view units"
ON public.units
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'rh'::app_role)
);

-- 5. Adicionar política para RH visualizar mensagens de solicitações
CREATE POLICY "RH can view request_messages for alteracao_ferias"
ON public.request_messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'rh'::app_role) 
  AND EXISTS (
    SELECT 1 FROM benefit_requests br 
    WHERE br.id = request_messages.benefit_request_id 
    AND br.benefit_type = 'alteracao_ferias'
  )
);

-- 6. Adicionar política para RH inserir mensagens
CREATE POLICY "RH can insert request_messages for alteracao_ferias"
ON public.request_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'rh'::app_role) 
  AND EXISTS (
    SELECT 1 FROM benefit_requests br 
    WHERE br.id = request_messages.benefit_request_id 
    AND br.benefit_type = 'alteracao_ferias'
  )
);