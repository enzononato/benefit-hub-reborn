-- 1. Atualizar todas as solicitações com status 'concluida' para 'aprovada'
UPDATE benefit_requests 
SET status = 'aprovada' 
WHERE status = 'concluida';

-- 2. Atualizar a função notify_benefit_request_change para remover referência a 'concluida'
CREATE OR REPLACE FUNCTION public.notify_benefit_request_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  target_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notification_title := 'Nova Solicitação';
    notification_message := 'Novo pedido de benefício criado: ' || NEW.protocol;
    notification_type := 'new_request';
    
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    SELECT ur.user_id, notification_title, notification_message, notification_type, 'benefit_request', NEW.id
    FROM user_roles ur
    WHERE ur.role = 'admin';
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    CASE NEW.status
      WHEN 'em_analise' THEN
        notification_title := 'Solicitação em Análise';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' está sendo analisada.';
        notification_type := 'status_update';
      WHEN 'aprovada' THEN
        notification_title := 'Solicitação Aprovada';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' foi aprovada!';
        notification_type := 'approved';
      WHEN 'recusada' THEN
        notification_title := 'Solicitação Recusada';
        notification_message := 'Sua solicitação ' || NEW.protocol || ' foi recusada.';
        notification_type := 'rejected';
      ELSE
        RETURN NEW;
    END CASE;
    
    INSERT INTO public.notifications (user_id, title, message, type, entity_type, entity_id)
    VALUES (NEW.user_id, notification_title, notification_message, notification_type, 'benefit_request', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Remover 'concluida' do enum benefit_status
-- Primeiro criar um novo enum sem 'concluida'
CREATE TYPE benefit_status_new AS ENUM ('aberta', 'em_analise', 'aprovada', 'recusada');

-- Remover o default da coluna primeiro
ALTER TABLE benefit_requests ALTER COLUMN status DROP DEFAULT;

-- Alterar a coluna para usar o novo enum
ALTER TABLE benefit_requests 
  ALTER COLUMN status TYPE benefit_status_new 
  USING status::text::benefit_status_new;

-- Definir o novo default
ALTER TABLE benefit_requests ALTER COLUMN status SET DEFAULT 'aberta'::benefit_status_new;

-- Remover o enum antigo
DROP TYPE benefit_status;

-- Renomear o novo enum para o nome original
ALTER TYPE benefit_status_new RENAME TO benefit_status;