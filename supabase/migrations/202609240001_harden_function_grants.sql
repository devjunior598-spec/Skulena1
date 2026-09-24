-- Supabase's default function grants can include an explicit grant to
-- authenticated, even after revoking from PUBLIC. Trigger-only functions do
-- not need direct API execution privileges.
revoke execute on function
  public.set_updated_at(),
  public.handle_new_user(),
  public.prevent_profile_role_change(),
  public.prevent_school_media_self_approval(),
  public.bootstrap_school_owner(),
  public.prevent_last_school_owner_removal(),
  public.audit_change()
from authenticated;

-- These helpers are used by authenticated policies and definer functions,
-- but anonymous clients have no reason to call them directly.
revoke execute on function
  public.current_app_role(),
  public.is_platform_admin()
from anon;
