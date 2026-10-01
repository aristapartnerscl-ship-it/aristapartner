alter table public.admin_profiles
  add column if not exists invitation_status text not null default 'accepted',
  add column if not exists invited_at timestamptz,
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_revoked_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists invited_by uuid references public.admin_profiles(id) on delete set null;

alter table public.admin_profiles
  drop constraint if exists admin_profiles_invitation_status_check;

alter table public.admin_profiles
  add constraint admin_profiles_invitation_status_check
  check (invitation_status in ('pending', 'accepted', 'revoked'));

update public.admin_profiles
set
  invitation_status = 'accepted',
  onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
where role = 'owner';

update public.admin_profiles
set
  invitation_status = case when last_activity_at is null then 'pending' else 'accepted' end,
  invited_at = coalesce(invited_at, created_at),
  invitation_sent_at = coalesce(invitation_sent_at, created_at),
  onboarding_completed_at = case
    when last_activity_at is null then onboarding_completed_at
    else coalesce(onboarding_completed_at, last_activity_at, created_at)
  end
where role = 'collaborator';

create index if not exists admin_profiles_invitation_status_idx
on public.admin_profiles (invitation_status, role, is_active);

drop policy if exists "red comercial members can read own active profile" on public.admin_profiles;

create policy "red comercial members can read own profile"
on public.admin_profiles for select
to authenticated
using (
  id = (select auth.uid())
  and role in ('owner', 'collaborator')
  and (
    (role = 'owner' and is_active = true)
    or (
      role = 'collaborator'
      and invitation_status in ('pending', 'accepted')
      and is_active = true
    )
  )
);
