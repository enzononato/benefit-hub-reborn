
-- Deletar mensagens relacionadas às solicitações do usuário
DELETE FROM request_messages 
WHERE benefit_request_id IN (
  SELECT br.id FROM benefit_requests br
  JOIN profiles p ON p.user_id = br.user_id
  WHERE REPLACE(REPLACE(p.cpf, '.', ''), '-', '') = '05045702505'
);

-- Deletar notificações relacionadas
DELETE FROM notifications
WHERE entity_type = 'benefit_request' 
AND entity_id::text IN (
  SELECT br.id::text FROM benefit_requests br
  JOIN profiles p ON p.user_id = br.user_id
  WHERE REPLACE(REPLACE(p.cpf, '.', ''), '-', '') = '05045702505'
);

-- Deletar usage de parcerias relacionadas
DELETE FROM partnership_usage
WHERE benefit_request_id IN (
  SELECT br.id FROM benefit_requests br
  JOIN profiles p ON p.user_id = br.user_id
  WHERE REPLACE(REPLACE(p.cpf, '.', ''), '-', '') = '05045702505'
);

-- Deletar recibos de pagamento relacionados
DELETE FROM payment_receipts
WHERE benefit_request_id IN (
  SELECT br.id FROM benefit_requests br
  JOIN profiles p ON p.user_id = br.user_id
  WHERE REPLACE(REPLACE(p.cpf, '.', ''), '-', '') = '05045702505'
);

-- Finalmente, deletar todas as 13 solicitações de Enzo Nonato da Silva Souza
DELETE FROM benefit_requests 
WHERE user_id = (
  SELECT user_id FROM profiles 
  WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = '05045702505'
  LIMIT 1
);
