create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.admin_profiles(id) on delete restrict,
  notification_type text not null,
  entity_type text,
  entity_id uuid,
  title text not null,
  message text,
  action_path text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint admin_notifications_type_check check (notification_type in ('form_submission_received')),
  constraint admin_notifications_entity_type_check check (entity_type is null or entity_type in ('form_submission')),
  constraint admin_notifications_entity_pair_check check (
    (entity_type is null and entity_id is null)
    or (entity_type is not null and entity_id is not null)
  ),
  constraint admin_notifications_title_length_check check (char_length(title) between 1 and 120),
  constraint admin_notifications_message_length_check check (message is null or char_length(message) <= 500),
  constraint admin_notifications_action_path_internal_check check (
    action_path is null
    or (
      char_length(action_path) <= 300
      and action_path like '/admin/%'
      and action_path not like '/admin//%'
      and action_path not like '%://%'
      and action_path !~ '[[:cntrl:][:space:]]'
    )
  )
);

comment on table public.admin_notifications is 'Private administrative notification inbox. Phase 1 stores owner-visible notifications only; generation from public form submissions is intentionally deferred until a safe atomic pattern is implemented.';
comment on column public.admin_notifications.action_path is 'Internal admin route only. External URLs are rejected by check constraint.';

create index admin_notifications_recipient_id_idx on public.admin_notifications (recipient_id);
create index admin_notifications_read_at_idx on public.admin_notifications (read_at);
create index admin_notifications_created_at_idx on public.admin_notifications (created_at desc);
create index admin_notifications_unread_idx on public.admin_notifications (recipient_id, created_at desc) where read_at is null;

alter table public.admin_notifications enable row level security;

revoke all on public.admin_notifications from anon, authenticated;

grant select on public.admin_notifications to authenticated;
grant update (read_at) on public.admin_notifications to authenticated;

create policy "active owner can read own notifications"
on public.admin_notifications for select
to authenticated
using (
  recipient_id = (select auth.uid())
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active = true
      and ap.role = 'owner'
  )
);

create policy "active owner can update own notifications"
on public.admin_notifications for update
to authenticated
using (
  recipient_id = (select auth.uid())
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active = true
      and ap.role = 'owner'
  )
)
with check (
  recipient_id = (select auth.uid())
  and exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active = true
      and ap.role = 'owner'
  )
);

-- No INSERT policy is added in this phase. The current public reception path writes
-- form_submissions from the submit-public-form Edge Function using service role.
-- Adding a trigger to create notifications for every active owner would require a
-- privileged function or a broader insert path; that would either bypass RLS or risk
-- making public submissions fail if notification fan-out fails. Generation should be
-- added in a follow-up migration with an explicit atomic failure policy.
