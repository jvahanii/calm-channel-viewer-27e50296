
-- Trigger-only functions: revoke from everyone except postgres
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_subscription_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: revoke from anon/public, keep authenticated
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_superuser(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superuser(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_campaign_channel(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_campaign_channel(uuid, text) TO authenticated;
