UPDATE public.benefit_requests
SET status = 'recusada',
    rejection_reason = 'encerrado pelo chatwoot por Fernanda',
    closing_message = 'encerrado pelo chatwoot por Fernanda',
    closed_at = now(),
    updated_at = now()
WHERE protocol = 'REVALLE-26042611590903';