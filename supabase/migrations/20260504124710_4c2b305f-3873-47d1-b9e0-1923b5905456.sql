-- Restrict EXECUTE on SECURITY DEFINER functions so they cannot be called via the public API.
-- These functions are only meant to be invoked by triggers and internal mechanisms.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;