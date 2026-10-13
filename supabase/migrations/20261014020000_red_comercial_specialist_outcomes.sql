alter table public.represented_company_specialist_requests
  add column if not exists meeting_summary text,
  add column if not exists meeting_outcome text,
  add column if not exists next_action text,
  add column if not exists next_followup_at timestamptz,
  add column if not exists outcome_recorded_at timestamptz,
  add column if not exists outcome_recorded_by uuid references public.admin_profiles(id) on delete set null,
  add column if not exists followup_activity_id uuid references public.represented_company_prospect_activities(id) on delete set null;

alter table public.represented_company_specialist_requests
  drop constraint if exists red_specialist_request_meeting_outcome_check;
alter table public.represented_company_specialist_requests
  add constraint red_specialist_request_meeting_outcome_check check (
    meeting_outcome is null or meeting_outcome in (
      'continue_process',
      'send_proposal',
      'pending_information',
      'follow_up',
      'waiting_client',
      'no_immediate_fit',
      'other'
    )
  );

create or replace function public.get_red_comercial_specialist_request(p_opportunity_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_request public.represented_company_specialist_requests%rowtype;
  v_opportunity public.represented_company_opportunities%rowtype;
  v_user uuid := (select auth.uid());
  v_admin boolean := public.is_red_comercial_admin();
begin
  if v_user is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  select * into v_opportunity from public.represented_company_opportunities where id = p_opportunity_id;
  if not found or (not v_admin and not public.red_comercial_can_view_prospect_detail(v_opportunity.prospect_id)) then
    raise exception 'AP_ACCESS_DENIED';
  end if;
  select * into v_request from public.represented_company_specialist_requests
  where opportunity_id = p_opportunity_id order by created_at desc limit 1;
  if not found then return null; end if;
  return jsonb_build_object(
    'id', v_request.id, 'opportunity_id', v_request.opportunity_id,
    'represented_company_id', v_request.represented_company_id,
    'represented_company_service_id', v_request.represented_company_service_id,
    'requested_by', v_request.requested_by, 'status', v_request.status,
    'need_summary', v_request.need_summary, 'conversation_summary', v_request.conversation_summary,
    'client_expectation', v_request.client_expectation, 'missing_information', v_request.missing_information,
    'proposed_date', v_request.proposed_date, 'notes', case when v_admin then v_request.notes else null end,
    'reviewed_by', v_request.reviewed_by, 'reviewed_at', v_request.reviewed_at,
    'scheduled_at', v_request.scheduled_at, 'completed_at', v_request.completed_at,
    'cancelled_at', v_request.cancelled_at,
    'meeting_summary', v_request.meeting_summary, 'meeting_outcome', v_request.meeting_outcome,
    'next_action', v_request.next_action, 'next_followup_at', v_request.next_followup_at,
    'outcome_recorded_at', v_request.outcome_recorded_at, 'outcome_recorded_by', v_request.outcome_recorded_by,
    'followup_activity_id', v_request.followup_activity_id,
    'created_at', v_request.created_at, 'updated_at', v_request.updated_at,
    'can_review', v_admin
  );
end;
$$;

create or replace function public.record_red_comercial_specialist_outcome(
  p_request_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_request public.represented_company_specialist_requests%rowtype;
  v_opportunity public.represented_company_opportunities%rowtype;
  v_prospect public.represented_company_prospects%rowtype;
  v_account public.represented_company_accounts%rowtype;
  v_summary text := nullif(btrim(p_payload->>'meeting_summary'), '');
  v_outcome text := nullif(btrim(p_payload->>'meeting_outcome'), '');
  v_next_action text := nullif(btrim(p_payload->>'next_action'), '');
  v_followup_at timestamptz := nullif(p_payload->>'next_followup_at', '')::timestamptz;
  v_notes text := nullif(btrim(p_payload->>'notes'), '');
  v_old_followup_at timestamptz;
  v_old_outcome text;
  v_old_next_action text;
  v_activity_id uuid;
begin
  if v_user is null or not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;
  if v_summary is null then raise exception 'REDCOM_SPECIALIST_OUTCOME_SUMMARY_REQUIRED'; end if;
  if v_next_action is null then raise exception 'REDCOM_SPECIALIST_OUTCOME_NEXT_ACTION_REQUIRED'; end if;
  if v_outcome is not null and v_outcome not in ('continue_process', 'send_proposal', 'pending_information', 'follow_up', 'waiting_client', 'no_immediate_fit', 'other') then
    raise exception 'REDCOM_SPECIALIST_OUTCOME_INVALID';
  end if;

  select * into v_request from public.represented_company_specialist_requests
  where id = p_request_id for update;
  if not found then raise exception 'REDCOM_SPECIALIST_REQUEST_NOT_FOUND'; end if;
  if v_request.status <> 'completed' then raise exception 'REDCOM_SPECIALIST_OUTCOME_NOT_COMPLETED'; end if;

  select * into v_opportunity from public.represented_company_opportunities where id = v_request.opportunity_id;
  if not found or v_opportunity.represented_company_id <> v_request.represented_company_id then
    raise exception 'REDCOM_SPECIALIST_COMPANY_MISMATCH';
  end if;
  select * into v_prospect from public.represented_company_prospects where id = v_opportunity.prospect_id;
  if not found or v_prospect.represented_company_id <> v_request.represented_company_id then
    raise exception 'REDCOM_SPECIALIST_PROSPECT_MISMATCH';
  end if;

  if v_followup_at is not null then
    select a.* into v_account
    from public.represented_company_accounts a
    where a.represented_company_id = v_request.represented_company_id
      and a.normalized_account_name = v_prospect.normalized_company_name
      and a.status in ('represented_client', 'represented_active_opportunity', 'blocked')
    limit 1;
    if found then raise exception 'REDCOM_SPECIALIST_ACCOUNT_BLOCKED'; end if;
  end if;

  v_old_followup_at := v_request.next_followup_at;
  v_old_outcome := v_request.meeting_outcome;
  v_old_next_action := v_request.next_action;
  if v_request.followup_activity_id is not null then
    v_activity_id := v_request.followup_activity_id;
    update public.represented_company_prospect_activities
    set description = v_next_action
    where id = v_activity_id and prospect_id = v_prospect.id;
    if not found then v_activity_id := null; end if;
  end if;
  if v_followup_at is not null and v_activity_id is null then
    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, activity_at, created_by)
    values
      (v_prospect.id, 'followup', 'Seguimiento posterior a reunion con especialista', v_next_action, now(), v_user)
    returning id into v_activity_id;
  end if;

  update public.represented_company_specialist_requests
  set meeting_summary = v_summary,
      meeting_outcome = v_outcome,
      next_action = v_next_action,
      next_followup_at = v_followup_at,
      notes = coalesce(v_notes, notes),
      outcome_recorded_at = now(),
      outcome_recorded_by = v_user,
      followup_activity_id = v_activity_id
  where id = v_request.id;

  update public.represented_company_prospects
  set next_followup_at = case
    when v_followup_at is not null then v_followup_at
    when v_old_followup_at is not null and next_followup_at = v_old_followup_at then null
    else next_followup_at
  end
  where id = v_prospect.id;

  if v_request.outcome_recorded_at is null
     or v_old_outcome is distinct from v_outcome
     or v_old_next_action is distinct from v_next_action
     or v_old_followup_at is distinct from v_followup_at then
    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, created_by)
    values
      (v_prospect.id, 'note', 'Resultado de reunion con especialista registrado', v_outcome, v_user);
  end if;

  return public.get_red_comercial_specialist_request(v_request.opportunity_id);
end;
$$;

revoke all on function public.record_red_comercial_specialist_outcome(uuid, jsonb) from public;
grant execute on function public.record_red_comercial_specialist_outcome(uuid, jsonb) to authenticated;
