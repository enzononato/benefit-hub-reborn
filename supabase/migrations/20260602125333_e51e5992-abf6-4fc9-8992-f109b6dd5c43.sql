DELETE FROM public.benefit_requests
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM public.benefit_requests
    WHERE status IN ('aberta','em_analise')
  ) t WHERE rn > 1
);