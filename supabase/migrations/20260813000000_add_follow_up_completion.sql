alter table public.opportunity_activities
  add column completed_at timestamptz,
  add column completed_by uuid references public.admin_profiles(id) on delete restrict,
  add constraint opportunity_activities_completion_pair_check check (
    (completed_at is null and completed_by is null)
    or (completed_at is not null and completed_by is not null)
  );

comment on column public.opportunity_activities.completed_at is
  'Marks that the next action for this activity was completed.';

comment on column public.opportunity_activities.completed_by is
  'References the administrator who completed the next action.';

comment on table public.opportunity_activities is
  'Chronological activity log for commercial follow-up. Activities without next_action_at may remain incomplete.';

create index opportunity_activities_pending_next_action_idx
  on public.opportunity_activities (next_action_at)
  where next_action_at is not null and completed_at is null;
