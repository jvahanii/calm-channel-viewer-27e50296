-- Enum for app roles
CREATE TYPE public.app_role AS ENUM ('free', 'plus');

-- user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check role without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get current user tier (returns 'plus' if user has plus role, else 'free')
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'plus')
      THEN 'plus'::public.app_role
    ELSE 'free'::public.app_role
  END
$$;

-- Trigger: on new auth user, create profile + assign free role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: assign free role to any existing users without one
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'free' FROM auth.users
ON CONFLICT DO NOTHING;

-- Enforce subscription limit at DB level for Free users
CREATE OR REPLACE FUNCTION public.enforce_subscription_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INT;
  tier public.app_role;
BEGIN
  SELECT public.get_user_tier(NEW.user_id) INTO tier;
  IF tier = 'plus' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO current_count
  FROM public.subscriptions
  WHERE user_id = NEW.user_id;

  IF current_count >= 1 THEN
    RAISE EXCEPTION 'Free tier allows only 1 subscription. Upgrade to Plus for unlimited.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_sub_limit ON public.subscriptions;
CREATE TRIGGER enforce_sub_limit
  BEFORE INSERT ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_limit();