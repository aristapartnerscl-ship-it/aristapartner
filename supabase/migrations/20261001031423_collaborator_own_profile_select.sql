create policy "red comercial members can read own active profile"
on public.admin_profiles for select
to authenticated
using (
  id = (select auth.uid())
  and is_active = true
  and role in ('owner', 'collaborator')
);
