-- daily-subscription-check existed as a deployable edge function but nothing
-- ever invoked it. Schedule it via pg_cron + pg_net so due_soon/overdue
-- transitions actually happen automatically, once a day.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-subscription-check',
  '5 18 * * *', -- 18:05 UTC = 00:05 Asia/Dhaka (UTC+6)
  $$
  select net.http_post(
    url := 'https://fjwyuqpuxkkbhczlgbhc.supabase.co/functions/v1/daily-subscription-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3l1cXB1eGtrYmhjemxnYmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDgwNzIsImV4cCI6MjA5ODQ4NDA3Mn0.b9t7gKwj66kPnliUgIFEtiMnAjuaifvt6RWvK_-LiqE',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqd3l1cXB1eGtrYmhjemxnYmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDgwNzIsImV4cCI6MjA5ODQ4NDA3Mn0.b9t7gKwj66kPnliUgIFEtiMnAjuaifvt6RWvK_-LiqE'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
