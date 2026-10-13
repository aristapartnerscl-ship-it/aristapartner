alter table public.admin_notifications drop constraint if exists admin_notifications_type_check;
alter table public.admin_notifications add constraint admin_notifications_type_check
  check (notification_type in ('form_submission_received', 'specialist_request_created'));
alter table public.admin_notifications drop constraint if exists admin_notifications_entity_type_check;
alter table public.admin_notifications add constraint admin_notifications_entity_type_check
  check (entity_type is null or entity_type in ('form_submission', 'specialist_request'));
create unique index if not exists admin_notifications_specialist_request_unique_idx
  on public.admin_notifications (recipient_id, notification_type, entity_type, entity_id)
  where notification_type = 'specialist_request_created' and entity_type = 'specialist_request' and entity_id is not null;

create table if not exists public.represented_company_specialist_requests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.represented_company_opportunities(id) on delete restrict,
  represented_company_id uuid not null references public.represented_companies(id) on delete restrict,
  represented_company_service_id uuid references public.represented_company_services(id) on delete set null,
  requested_by uuid not null references public.admin_profiles(id) on delete restrict,
  status text not null default 'requested',
  need_summary text,
  conversation_summary text,
  client_expectation text,
  missing_information text,
  proposed_date timestamptz,
  notes text,
  reviewed_by uuid references public.admin_profiles(id) on delete set null,
  reviewed_at timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint red_specialist_request_status_check check (status in ('requested', 'scheduled', 'completed', 'cancelled')),
  constraint red_specialist_request_dates_check check (
    (scheduled_at is null or status in ('scheduled', 'completed'))
    and (completed_at is null or status = 'completed')
    and (cancelled_at is null or status = 'cancelled')
  )
);

create unique index if not exists red_specialist_request_active_unique
  on public.represented_company_specialist_requests (opportunity_id)
  where status in ('requested', 'scheduled');
create index if not exists red_specialist_request_company_idx
  on public.represented_company_specialist_requests (represented_company_id, status, updated_at desc);

create or replace function public.red_comercial_validate_specialist_request()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_opportunity_company uuid;
  v_service_company uuid;
begin
  select represented_company_id into v_opportunity_company
  from public.represented_company_opportunities
  where id = new.opportunity_id;
  if v_opportunity_company is null or v_opportunity_company <> new.represented_company_id then
    raise exception 'REDCOM_SPECIALIST_COMPANY_MISMATCH';
  end if;
  if new.represented_company_service_id is not null then
    select represented_company_id into v_service_company
    from public.represented_company_services
    where id = new.represented_company_service_id;
    if v_service_company is null or v_service_company <> new.represented_company_id then
      raise exception 'REDCOM_SPECIALIST_SERVICE_COMPANY_MISMATCH';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists red_specialist_request_validate on public.represented_company_specialist_requests;
create trigger red_specialist_request_validate
before insert or update of opportunity_id, represented_company_id, represented_company_service_id
on public.represented_company_specialist_requests
for each row execute function public.red_comercial_validate_specialist_request();

drop trigger if exists red_specialist_request_updated_at on public.represented_company_specialist_requests;
create trigger red_specialist_request_updated_at
before update on public.represented_company_specialist_requests
for each row execute function public.set_updated_at();

alter table public.represented_company_specialist_requests enable row level security;
revoke all on public.represented_company_specialist_requests from anon, authenticated;

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
    'proposed_date', v_request.proposed_date, 'notes', v_request.notes,
    'reviewed_by', v_request.reviewed_by, 'reviewed_at', v_request.reviewed_at,
    'scheduled_at', v_request.scheduled_at, 'completed_at', v_request.completed_at,
    'cancelled_at', v_request.cancelled_at, 'created_at', v_request.created_at, 'updated_at', v_request.updated_at,
    'can_review', v_admin
  );
end;
$$;

create or replace function public.create_red_comercial_specialist_request(p_opportunity_id uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_admin boolean := public.is_red_comercial_admin();
  v_opportunity public.represented_company_opportunities%rowtype;
  v_account public.represented_company_accounts%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  select * into v_opportunity from public.represented_company_opportunities where id = p_opportunity_id;
  if not found or (not v_admin and not public.red_comercial_can_manage_prospect(v_opportunity.prospect_id)) then raise exception 'AP_ACCESS_DENIED'; end if;
  if not v_admin and v_opportunity.control_mode = 'arista' then raise exception 'REDCOM_SPECIALIST_READ_ONLY'; end if;
  if v_opportunity.result_status in ('won', 'lost', 'cancelled') then raise exception 'REDCOM_SPECIALIST_TERMINAL_OPPORTUNITY'; end if;
  select a.* into v_account
  from public.represented_company_accounts a
  join public.represented_company_prospects p on p.represented_company_id = a.represented_company_id and p.normalized_company_name = a.normalized_account_name
  where p.id = v_opportunity.prospect_id and a.status in ('represented_client', 'represented_active_opportunity', 'blocked')
  limit 1;
  if found then raise exception 'REDCOM_SPECIALIST_ACCOUNT_BLOCKED'; end if;
  if exists (select 1 from public.represented_company_specialist_requests where opportunity_id = p_opportunity_id and status in ('requested', 'scheduled')) then
    raise exception 'REDCOM_SPECIALIST_ACTIVE_EXISTS';
  end if;
  insert into public.represented_company_specialist_requests (
    opportunity_id, represented_company_id, represented_company_service_id, requested_by,
    need_summary, conversation_summary, client_expectation, missing_information, proposed_date, notes
  ) values (
    v_opportunity.id, v_opportunity.represented_company_id, nullif(p_payload->>'represented_company_service_id', '')::uuid, v_user,
    nullif(btrim(p_payload->>'need_summary'), ''), nullif(btrim(p_payload->>'conversation_summary'), ''),
    nullif(btrim(p_payload->>'client_expectation'), ''), nullif(btrim(p_payload->>'missing_information'), ''),
    nullif(p_payload->>'proposed_date', '')::timestamptz, nullif(btrim(p_payload->>'notes'), '')
  ) returning id into v_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  values (v_opportunity.prospect_id, 'note', 'Especialista solicitado', nullif(btrim(p_payload->>'need_summary'), ''), v_user);
  insert into public.admin_notifications (recipient_id, notification_type, entity_type, entity_id, title, message, action_path)
  select ap.id, 'specialist_request_created', 'specialist_request', v_id,
    'Nueva solicitud de especialista',
    coalesce(requester.full_name, 'Un colaborador') || ' solicitó apoyo de especialista para ' || p.company_name || '.',
    '/admin/oportunidades?opportunityId=' || v_opportunity.id::text
  from public.admin_profiles ap
  left join public.admin_profiles requester on requester.id = v_user
  join public.represented_company_prospects p on p.id = v_opportunity.prospect_id
  where ap.role = 'owner' and ap.is_active = true
  on conflict do nothing;
  return public.get_red_comercial_specialist_request(p_opportunity_id);
end;
$$;

create or replace function public.review_red_comercial_specialist_request(
  p_request_id uuid, p_action text, p_scheduled_at timestamptz default null, p_notes text default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_request public.represented_company_specialist_requests%rowtype;
  v_status text;
  v_title text;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  select * into v_request from public.represented_company_specialist_requests where id = p_request_id for update;
  if not found then raise exception 'REDCOM_SPECIALIST_REQUEST_NOT_FOUND'; end if;
  if p_action = 'schedule' and v_request.status = 'requested' and p_scheduled_at is not null then v_status := 'scheduled'; v_title := 'Reunión de especialista agendada';
  elsif p_action = 'complete' and v_request.status = 'scheduled' then v_status := 'completed'; v_title := 'Reunión de especialista realizada';
  elsif p_action = 'cancel' and v_request.status in ('requested', 'scheduled') then v_status := 'cancelled'; v_title := 'Solicitud de especialista cancelada';
  else raise exception 'REDCOM_SPECIALIST_INVALID_TRANSITION'; end if;
  update public.represented_company_specialist_requests set
    status = v_status, reviewed_by = v_user, reviewed_at = now(),
    scheduled_at = case when v_status = 'scheduled' then p_scheduled_at else scheduled_at end,
    completed_at = case when v_status = 'completed' then now() else completed_at end,
    cancelled_at = case when v_status = 'cancelled' then now() else cancelled_at end,
    notes = coalesce(nullif(btrim(p_notes), ''), notes)
  where id = v_request.id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  select o.prospect_id, 'note', v_title, nullif(btrim(p_notes), ''), v_user
  from public.represented_company_opportunities o where o.id = v_request.opportunity_id;
  return public.get_red_comercial_specialist_request(v_request.opportunity_id);
end;
$$;

revoke all on function public.get_red_comercial_specialist_request(uuid), public.create_red_comercial_specialist_request(uuid, jsonb), public.review_red_comercial_specialist_request(uuid, text, timestamptz, text) from public;
grant execute on function public.get_red_comercial_specialist_request(uuid), public.create_red_comercial_specialist_request(uuid, jsonb), public.review_red_comercial_specialist_request(uuid, text, timestamptz, text) to authenticated;
