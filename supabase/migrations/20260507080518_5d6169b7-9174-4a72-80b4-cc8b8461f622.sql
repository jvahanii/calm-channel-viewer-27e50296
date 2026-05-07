
-- Grant superuser role to Jarno
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superuser'::public.app_role
FROM auth.users
WHERE email = 'jvahanii@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix privilege escalation: restrict self-insert to free role only
DROP POLICY IF EXISTS "Users can upgrade themselves" ON public.user_roles;
CREATE POLICY "Users can self-assign free role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'free'::public.app_role);

-- Superusers can manage all roles
CREATE POLICY "Superusers can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superuser'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'superuser'::public.app_role));

-- Helper
CREATE OR REPLACE FUNCTION public.is_superuser(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'superuser'::public.app_role)
$$;

-- Campaigns table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  channel_id text NOT NULL,
  channel_title text NOT NULL,
  channel_thumbnail text,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  audience text NOT NULL DEFAULT 'free' CHECK (audience IN ('free','all')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active campaigns"
ON public.campaigns FOR SELECT TO authenticated
USING (is_active = true AND now() BETWEEN starts_at AND ends_at);

CREATE POLICY "Superusers can view all campaigns"
ON public.campaigns FOR SELECT TO authenticated
USING (public.is_superuser(auth.uid()));

CREATE POLICY "Superusers can insert campaigns"
ON public.campaigns FOR INSERT TO authenticated
WITH CHECK (public.is_superuser(auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Superusers can update campaigns"
ON public.campaigns FOR UPDATE TO authenticated
USING (public.is_superuser(auth.uid()));

CREATE POLICY "Superusers can delete campaigns"
ON public.campaigns FOR DELETE TO authenticated
USING (public.is_superuser(auth.uid()));

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is a channel currently part of an active campaign for this audience?
CREATE OR REPLACE FUNCTION public.is_campaign_channel(_user_id uuid, _channel_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.channel_id = _channel_id
      AND c.is_active = true
      AND now() BETWEEN c.starts_at AND c.ends_at
      AND (c.audience = 'all' OR c.audience = 'free')
  )
$$;

-- Update subscription limit: campaign channels don't count toward free limit
CREATE OR REPLACE FUNCTION public.enforce_subscription_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_count INT;
  tier public.app_role;
BEGIN
  SELECT public.get_user_tier(NEW.user_id) INTO tier;
  IF tier = 'plus' OR public.has_role(NEW.user_id, 'superuser') THEN
    RETURN NEW;
  END IF;

  -- If new sub is a campaign channel, allow it
  IF public.is_campaign_channel(NEW.user_id, NEW.channel_id) THEN
    RETURN NEW;
  END IF;

  -- Count non-campaign subs
  SELECT COUNT(*) INTO current_count
  FROM public.subscriptions s
  WHERE s.user_id = NEW.user_id
    AND NOT public.is_campaign_channel(s.user_id, s.channel_id);

  IF current_count >= 1 THEN
    RAISE EXCEPTION 'Free tier allows only 1 subscription. Upgrade to Plus for unlimited.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
