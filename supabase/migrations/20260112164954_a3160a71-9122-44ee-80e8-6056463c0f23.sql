-- Enable pg_cron extension (should already be enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the cron job to run on the 1st of every month at 00:00 UTC
SELECT cron.schedule(
  'process-monthly-installments',  -- job name
  '0 0 1 * *',                      -- cron schedule: minute 0, hour 0, day 1, every month, any day of week
  $$
  SELECT net.http_post(
    url := 'https://wyhlezxtfhoolrvuqhfy.supabase.co/functions/v1/process-monthly-installments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Job scheduler for PostgreSQL - used for monthly installment processing';