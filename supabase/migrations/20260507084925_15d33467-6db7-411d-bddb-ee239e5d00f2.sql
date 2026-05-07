-- 1. Add subscription_days to campaigns
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS subscription_days integer;

-- 2. Add expires_at + campaign_id to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS campaign_id uuid;

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
  ON public.subscriptions (expires_at)
  WHERE expires_at IS NOT NULL;

-- 3. Trigger: when a subscription is created for an active campaign channel
--    with subscription_days set, fill expires_at and campaign_id automatically.
CREATE OR REPLACE FUNCTION public.set_subscription_campaign_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
BEGIN
  IF NEW.expires_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id, subscription_days
  INTO c
  FROM public.campaigns
  WHERE channel_id = NEW.channel_id
    AND is_active = true
    AND now() BETWEEN starts_at AND ends_at
    AND (audience = 'all' OR audience = 'free')
  ORDER BY created_at DESC
  LIMIT 1;

  IF c.id IS NOT NULL THEN
    NEW.campaign_id := c.id;
    IF c.subscription_days IS NOT NULL AND c.subscription_days > 0 THEN
      NEW.expires_at := now() + (c.subscription_days || ' days')::interval;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_subscription_campaign_expiry ON public.subscriptions;
CREATE TRIGGER trg_set_subscription_campaign_expiry
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_subscription_campaign_expiry();

-- 4. Cleanup function for expired campaign subscriptions
CREATE OR REPLACE FUNCTION public.delete_expired_campaign_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  WITH d AS (
    DELETE FROM public.subscriptions
    WHERE expires_at IS NOT NULL
      AND expires_at < now()
    RETURNING 1
  )
  SELECT count(*) INTO removed FROM d;
  RETURN removed;
END;
$$;

-- 5. Schedule hourly cleanup via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-expired-campaign-subscriptions') THEN
    PERFORM cron.unschedule('delete-expired-campaign-subscriptions');
  END IF;
  PERFORM cron.schedule(
    'delete-expired-campaign-subscriptions',
    '0 * * * *',
    $cron$ SELECT public.delete_expired_campaign_subscriptions(); $cron$
  );
END
$$;