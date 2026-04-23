UPDATE benefit_requests 
SET total_installments = 4,
    updated_at = now()
WHERE protocol = 'REVALLE-26032513421859'