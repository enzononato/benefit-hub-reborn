UPDATE benefit_requests
SET 
  status = 'recusada',
  rejection_reason = 'Resolvido e encerrado pelo chatwoot',
  closed_at = NOW(),
  updated_at = NOW()
WHERE status = 'aberta'
  AND benefit_type NOT IN ('autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica');