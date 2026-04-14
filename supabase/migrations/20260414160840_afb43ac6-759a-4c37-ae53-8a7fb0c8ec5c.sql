UPDATE benefit_requests
SET 
  status = 'recusada',
  rejection_reason = 'Resolvido e encerrado pelo chatwoot',
  closed_at = NOW(),
  updated_at = NOW()
WHERE protocol = 'REVALLE-26041316310925';