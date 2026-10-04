-- Phase 8: integrity hardening. No existing rows are modified or deleted.

create or replace function public.red_comercial_is_terminal_prospect_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_status in ('agreed', 'not_interested', 'archived'), false);
$$;

revoke all on function public.red_comercial_is_terminal_prospect_status(text) from public;
grant execute on function public.red_comercial_is_terminal_prospect_status(text) to authenticated;

alter table public.represented_company_opportunities
  add constraint red_opportunity_commission_attribution_check
  check (
    commission_status not in ('to_validate', 'generated', 'pending_payment', 'paid')
    or attributed_collaborator_id is not null
  ) not valid;

alter table public.represented_company_opportunities
  add constraint red_opportunity_compensation_null_without_attribution_check
  check (
    attributed_collaborator_id is not null
    or (
      collaborator_compensation_type is null
      and collaborator_compensation_rate is null
      and collaborator_compensation_amount is null
    )
  ) not valid;

alter table public.represented_company_opportunities
  add constraint red_opportunity_compensation_shape_check
  check (
    collaborator_compensation_type is null
    or (
      (collaborator_compensation_type = 'percentage'
        and collaborator_compensation_rate is not null
        and collaborator_compensation_rate between 0 and 100
        and collaborator_compensation_amount is null)
      or
      (collaborator_compensation_type = 'fixed_amount'
        and collaborator_compensation_amount is not null
        and collaborator_compensation_amount >= 0
        and collaborator_compensation_rate is null)
    )
  ) not valid;

create or replace function public.red_comercial_opportunity_integrity_trigger()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.commission_status in ('to_validate', 'generated', 'pending_payment', 'paid')
     and new.attributed_collaborator_id is null then
    raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED';
  end if;

  if new.attributed_collaborator_id is null
     and (new.collaborator_compensation_type is not null
       or new.collaborator_compensation_rate is not null
       or new.collaborator_compensation_amount is not null) then
    raise exception 'AP_COMPENSATION_REQUIRES_ATTRIBUTION';
  end if;

  if new.collaborator_compensation_type = 'percentage' then
    if new.collaborator_compensation_rate is null
       or new.collaborator_compensation_rate < 0
       or new.collaborator_compensation_rate > 100
       or new.collaborator_compensation_amount is not null then
      raise exception 'AP_INVALID_PERCENTAGE_COMPENSATION';
    end if;
  elsif new.collaborator_compensation_type = 'fixed_amount' then
    if new.collaborator_compensation_amount is null
       or new.collaborator_compensation_amount < 0
       or new.collaborator_compensation_rate is not null then
      raise exception 'AP_INVALID_FIXED_COMPENSATION';
    end if;
  elsif new.collaborator_compensation_type is not null then
    raise exception 'AP_INVALID_COMPENSATION_TYPE';
  end if;

  if new.result_status in ('won', 'lost', 'cancelled') then
    new.closed_at := coalesce(new.closed_at, now());
  elsif new.result_status = 'in_process' then
    new.closed_at := null;
  end if;

  return new;
end;
$$;

revoke all on function public.red_comercial_opportunity_integrity_trigger() from public;

drop trigger if exists red_opportunity_integrity_trigger on public.represented_company_opportunities;
create trigger red_opportunity_integrity_trigger
before insert or update on public.represented_company_opportunities
for each row execute function public.red_comercial_opportunity_integrity_trigger();

create or replace function public.update_red_comercial_opportunity(p_opportunity_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_existing public.represented_company_opportunities%rowtype;
  v_is_admin boolean := public.is_red_comercial_admin();
  v_is_handoff boolean := coalesce(p_payload->>'action', '') = 'handoff';
  v_attributed uuid;
  v_compensation_type text;
  v_compensation_rate numeric;
  v_compensation_amount numeric;
  v_next_control text;
  v_next_result text;
  v_should_mark_handoff boolean := false;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;

  select * into v_existing
  from public.represented_company_opportunities
  where id = p_opportunity_id
  for update;

  if not found or not public.red_comercial_can_manage_prospect(v_existing.prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  if not v_is_admin then
    if not v_is_handoff or v_existing.control_mode = 'arista' then
      raise exception 'AP_ADMIN_REQUIRED';
    end if;
    update public.represented_company_opportunities
    set control_mode = 'arista', handed_off_at = coalesce(handed_off_at, now())
    where id = p_opportunity_id;
    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, created_by)
    values
      (v_existing.prospect_id, 'status_change', 'Oportunidad entregada a Arista', nullif(p_payload->>'context', ''), v_user_id);
    return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
  end if;

  v_next_control := coalesce(nullif(p_payload->>'control_mode', ''), v_existing.control_mode);
  v_next_result := coalesce(nullif(p_payload->>'result_status', ''), v_existing.result_status);
  v_attributed := case when p_payload ? 'attributed_collaborator_id'
    then nullif(p_payload->>'attributed_collaborator_id', '')::uuid
    else v_existing.attributed_collaborator_id end;
  v_compensation_type := case when p_payload ? 'collaborator_compensation_type'
    then nullif(p_payload->>'collaborator_compensation_type', '')
    else v_existing.collaborator_compensation_type end;
  v_compensation_rate := case when p_payload ? 'collaborator_compensation_rate'
    then nullif(p_payload->>'collaborator_compensation_rate', '')::numeric
    else v_existing.collaborator_compensation_rate end;
  v_compensation_amount := case when p_payload ? 'collaborator_compensation_amount'
    then nullif(p_payload->>'collaborator_compensation_amount', '')::numeric
    else v_existing.collaborator_compensation_amount end;

  if v_attributed is not null and not public.red_comercial_is_company_member(v_existing.represented_company_id, v_attributed) then
    raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR';
  end if;
  if v_attributed is null or v_compensation_type is null then
    v_compensation_type := null;
    v_compensation_rate := null;
    v_compensation_amount := null;
  end if;

  v_should_mark_handoff := v_is_handoff
    or (v_next_control = 'arista' and v_existing.control_mode in ('collaborator', 'shared'));

  update public.represented_company_opportunities
  set status = coalesce(nullif(p_payload->>'status', ''), status),
      control_mode = v_next_control,
      contract_status = coalesce(nullif(p_payload->>'contract_status', ''), contract_status),
      payment_status = coalesce(nullif(p_payload->>'payment_status', ''), payment_status),
      commission_status = coalesce(nullif(p_payload->>'commission_status', ''), commission_status),
      result_status = v_next_result,
      attributed_collaborator_id = v_attributed,
      collaborator_compensation_type = v_compensation_type,
      collaborator_compensation_rate = v_compensation_rate,
      collaborator_compensation_amount = v_compensation_amount,
      handed_off_at = case when v_should_mark_handoff then coalesce(handed_off_at, now()) else handed_off_at end,
      closed_at = case when v_next_result in ('won', 'lost', 'cancelled') then coalesce(closed_at, now()) else null end,
      sale_net_amount = coalesce(nullif(p_payload->>'sale_net_amount', '')::numeric, sale_net_amount),
      currency = coalesce(nullif(p_payload->>'currency', ''), currency)
  where id = p_opportunity_id;

  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, created_by)
  values
    (v_existing.prospect_id, 'status_change',
      case when v_should_mark_handoff then 'Oportunidad entregada a Arista' else 'Oportunidad actualizada' end,
      nullif(p_payload->>'context', ''), v_user_id);

  return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
end;
$$;

revoke all on function public.update_red_comercial_opportunity(uuid, jsonb) from public;
grant execute on function public.update_red_comercial_opportunity(uuid, jsonb) to authenticated;

create or replace function public.convert_red_comercial_cross_opportunity(p_cross_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cross public.represented_company_cross_opportunities;
  v_source public.represented_company_prospects;
  v_existing_id uuid;
  v_new_id uuid;
  v_normalized_name text;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  if not public.is_red_comercial_admin() then raise exception 'AP_ADMIN_REQUIRED'; end if;

  select * into v_cross from public.represented_company_cross_opportunities where id = p_cross_id for update;
  if not found or v_cross.status in ('converted', 'discarded') then raise exception 'AP_ACCESS_DENIED'; end if;
  select * into v_source from public.represented_company_prospects where id = v_cross.source_prospect_id;
  if not found then raise exception 'AP_NOT_FOUND'; end if;
  if v_cross.assigned_to is not null and not public.red_comercial_is_company_member(v_cross.target_represented_company_id, v_cross.assigned_to) then
    raise exception 'AP_INVALID_ASSIGNEE';
  end if;

  v_normalized_name := public.red_comercial_normalize_company_name(v_source.company_name);
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_cross.target_represented_company_id::text || ':' || v_normalized_name, 0)
  );

  select p.id into v_existing_id
  from public.represented_company_prospects p
  where p.represented_company_id = v_cross.target_represented_company_id
    and not p.is_archived
    and (p.normalized_company_name = v_normalized_name or (v_source.domain is not null and p.domain = v_source.domain))
  order by p.updated_at desc
  limit 1;

  if v_existing_id is null then
    insert into public.represented_company_prospects
      (represented_company_id, company_name, normalized_company_name, website_url, domain, status, owner_user_id, created_by, internal_notes, is_archived)
    values
      (v_cross.target_represented_company_id, v_source.company_name, v_normalized_name, v_source.website_url, v_source.domain, 'to_contact', v_cross.assigned_to, v_user_id, null, false)
    returning id into v_new_id;
    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, created_by)
    values (v_new_id, 'note', 'Prospecto creado desde oportunidad cruzada', v_cross.reason, v_user_id);
  else
    v_new_id := v_existing_id;
  end if;

  update public.represented_company_cross_opportunities
  set status = 'converted', converted_prospect_id = v_new_id, converted_at = now(), converted_by = v_user_id
  where id = p_cross_id and status not in ('converted', 'discarded')
  returning * into v_cross;
  if not found then raise exception 'AP_ACCESS_DENIED'; end if;

  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, created_by)
  values (v_source.id, 'note', 'Oportunidad cruzada convertida', 'Convertida para la cartera destino.', v_user_id);

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

revoke all on function public.convert_red_comercial_cross_opportunity(uuid) from public;
grant execute on function public.convert_red_comercial_cross_opportunity(uuid) to authenticated;

create or replace function public.list_red_comercial_followups(
  p_search text default null,
  p_company_id uuid default null,
  p_responsible_id uuid default null,
  p_status text default null,
  p_channel text default null,
  p_view text default 'all',
  p_mine boolean default false,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid, represented_company_id uuid, represented_company_name text,
  represented_company_logo_storage_path text, company_name text, status text,
  channel text, last_contact_at timestamptz, next_followup_at timestamptz,
  owner_user_id uuid, owner_name text, latest_activity_title text,
  latest_activity_type text, latest_activity_at timestamptz,
  is_no_movement boolean, days_overdue integer, total_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_today_start timestamptz := ((timezone('America/Santiago', now())::date)::timestamp at time zone 'America/Santiago');
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  return query
  with scoped as (
    select p.*, rc.name as represented_company_name, rc.logo_storage_path as represented_company_logo_storage_path,
      ap.full_name as owner_name, latest.title as latest_activity_title,
      latest.activity_type as latest_activity_type, latest.activity_at as latest_activity_at,
      (p.next_followup_at is not null and p.next_followup_at < v_today_start) as is_overdue,
      (p.last_contact_at < now() - interval '7 days' or (p.last_contact_at is null and p.first_contact_at < now() - interval '7 days')) as is_no_movement,
      case when p.next_followup_at is not null and p.next_followup_at < v_today_start then greatest(1, ((v_today_start at time zone 'America/Santiago')::date - (p.next_followup_at at time zone 'America/Santiago')::date)) else 0 end as days_overdue
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id and rc.status = 'active'
    left join public.admin_profiles ap on ap.id = p.owner_user_id
    left join lateral (select a.title, a.activity_type, a.activity_at from public.represented_company_prospect_activities a where a.prospect_id = p.id order by a.activity_at desc, a.created_at desc limit 1) latest on true
    where (v_is_admin or (public.red_comercial_is_company_member(p.represented_company_id, v_user_id) and (p.owner_user_id = v_user_id or exists (select 1 from public.represented_company_prospect_collaborators pc where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'))))
      and not public.red_comercial_is_terminal_prospect_status(p.status)
      and (p_company_id is null or p.represented_company_id = p_company_id)
      and (p_responsible_id is null or p.owner_user_id = p_responsible_id)
      and (p_status is null or p.status = p_status)
      and (p_channel is null or p.channel = p_channel)
      and (not coalesce(p_mine, false) or p.owner_user_id = v_user_id or exists (select 1 from public.represented_company_prospect_collaborators pc where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'))
      and (nullif(btrim(p_search), '') is null or lower(p.company_name) like '%' || lower(btrim(p_search)) || '%' or lower(rc.name) like '%' || lower(btrim(p_search)) || '%')
      and case coalesce(p_view, 'all')
        when 'today' then p.next_followup_at >= v_today_start and p.next_followup_at < v_today_start + interval '1 day'
        when 'overdue' then p.next_followup_at < v_today_start
        when 'upcoming' then p.next_followup_at >= v_today_start + interval '1 day' and p.next_followup_at < v_today_start + interval '8 days'
        when 'no_followup' then p.next_followup_at is null
        when 'stale' then (p.last_contact_at < now() - interval '7 days' or (p.last_contact_at is null and p.first_contact_at < now() - interval '7 days'))
        else true
      end
  )
  select s.id, s.represented_company_id, s.represented_company_name, s.represented_company_logo_storage_path,
    s.company_name, s.status, s.channel, s.last_contact_at, s.next_followup_at, s.owner_user_id, s.owner_name,
    s.latest_activity_title, s.latest_activity_type, s.latest_activity_at, s.is_no_movement, s.days_overdue,
    count(*) over() as total_count
  from scoped s
  order by case when s.is_overdue then 0 when s.next_followup_at >= v_today_start and s.next_followup_at < v_today_start + interval '1 day' then 1 when s.next_followup_at is not null then 2 else 3 end,
    coalesce(s.next_followup_at, '9999-12-31'::timestamptz), s.represented_company_name, s.company_name
  limit v_limit offset v_offset;
end;
$$;

create or replace function public.get_red_comercial_followup_metrics(
  p_search text default null, p_company_id uuid default null, p_responsible_id uuid default null,
  p_status text default null, p_channel text default null, p_mine boolean default false
)
returns table (today bigint, overdue bigint, upcoming bigint, no_followup bigint, no_movement bigint, total bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid()); v_is_admin boolean;
  v_today_start timestamptz := ((timezone('America/Santiago', now())::date)::timestamp at time zone 'America/Santiago');
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  return query
  with scoped as (
    select p.next_followup_at, p.last_contact_at, p.first_contact_at
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id and rc.status = 'active'
    where (v_is_admin or (public.red_comercial_is_company_member(p.represented_company_id, v_user_id) and (p.owner_user_id = v_user_id or exists (select 1 from public.represented_company_prospect_collaborators pc where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'))))
      and not public.red_comercial_is_terminal_prospect_status(p.status)
      and (p_company_id is null or p.represented_company_id = p_company_id)
      and (p_responsible_id is null or p.owner_user_id = p_responsible_id)
      and (p_status is null or p.status = p_status)
      and (p_channel is null or p.channel = p_channel)
      and (not coalesce(p_mine, false) or p.owner_user_id = v_user_id or exists (select 1 from public.represented_company_prospect_collaborators pc where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'))
      and (nullif(btrim(p_search), '') is null or lower(p.company_name) like '%' || lower(btrim(p_search)) || '%' or lower(rc.name) like '%' || lower(btrim(p_search)) || '%')
  )
  select count(*) filter (where next_followup_at >= v_today_start and next_followup_at < v_today_start + interval '1 day'),
    count(*) filter (where next_followup_at < v_today_start),
    count(*) filter (where next_followup_at >= v_today_start + interval '1 day' and next_followup_at < v_today_start + interval '8 days'),
    count(*) filter (where next_followup_at is null),
    count(*) filter (where last_contact_at < now() - interval '7 days' or (last_contact_at is null and first_contact_at < now() - interval '7 days')),
    count(*) from scoped;
end;
$$;

revoke all on function public.list_red_comercial_followups(text, uuid, uuid, text, text, text, boolean, integer, integer) from public;
revoke all on function public.get_red_comercial_followup_metrics(text, uuid, uuid, text, text, boolean) from public;
grant execute on function public.list_red_comercial_followups(text, uuid, uuid, text, text, text, boolean, integer, integer) to authenticated;
grant execute on function public.get_red_comercial_followup_metrics(text, uuid, uuid, text, text, boolean) to authenticated;

create or replace function public.get_red_comercial_dashboard(p_period text default 'today')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_today date := (now() at time zone 'America/Santiago')::date;
  v_summary jsonb;
  v_attention jsonb;
  v_followups jsonb;
  v_opportunities jsonb;
  v_cross jsonb;
  v_results jsonb;
  v_portfolios jsonb;
  v_activity jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();

  with prospects as (
    select p.* from public.represented_company_prospects p
    where not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status)
      and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
  ), opportunities as (
    select o.* from public.represented_company_opportunities o
    join prospects p on p.id = o.prospect_id
    where v_is_admin or o.attributed_collaborator_id = v_user_id
      or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id))
  )
  select jsonb_build_object(
    'followups_today', (select count(*) from prospects where next_followup_at is not null and (next_followup_at at time zone 'America/Santiago')::date = v_today),
    'followups_overdue', (select count(*) from prospects where next_followup_at is not null and next_followup_at < now()),
    'active_prospects', (select count(*) from prospects),
    'opportunities_in_process', (select count(*) from opportunities where result_status = 'in_process'),
    'opportunities_arista', (select count(*) from opportunities where control_mode = 'arista'),
    'payments_pending', (select count(*) from opportunities where payment_status in ('pending', 'partial', 'overdue')),
    'won_this_month', (select count(*) from opportunities where result_status = 'won' and (closed_at at time zone 'America/Santiago')::date >= date_trunc('month', v_today)::date),
    'commission_pending', (select count(*) from opportunities where attributed_collaborator_id = v_user_id and commission_status in ('to_validate', 'generated', 'pending_payment'))
  ) into v_summary;

  with items as (
    select jsonb_build_object('type', case when p.next_followup_at < now() then 'followup_overdue' else 'followup_today' end,
      'label', case when p.next_followup_at < now() then 'Seguimiento vencido' else 'Seguimiento hoy' end,
      'prospect_id', p.id, 'prospect_name', p.company_name, 'company_id', p.represented_company_id,
      'company_name', rc.name, 'reason', case when p.next_followup_at < now() then 'Seguimiento vencido' else 'Contacto programado para hoy' end,
      'owner_name', owner.full_name, 'at', p.next_followup_at,
      'href', '/admin/seguimientos?view=' || case when p.next_followup_at < now() then 'overdue' else 'today' end) as item,
      case when p.next_followup_at < now() then 1 else 2 end as priority, p.next_followup_at as at
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id
    left join public.admin_profiles owner on owner.id = p.owner_user_id
    where not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status)
      and p.next_followup_at is not null and (p.next_followup_at at time zone 'America/Santiago')::date <= v_today
      and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
    union all
    select jsonb_build_object('type', case when o.payment_status in ('pending', 'partial', 'overdue') then 'payment_pending' else 'contract_pending' end,
      'label', case when o.payment_status in ('pending', 'partial', 'overdue') then 'Pago pendiente' else 'Contrato pendiente' end,
      'prospect_id', o.prospect_id, 'prospect_name', p.company_name, 'company_id', o.represented_company_id,
      'company_name', rc.name, 'reason', case when o.payment_status in ('pending', 'partial', 'overdue') then 'Revisar estado de pago' else 'Revisar contrato comercial' end,
      'owner_name', attributed.full_name, 'at', o.updated_at, 'href', '/admin/oportunidades') as item,
      3 as priority, o.updated_at as at
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where o.result_status = 'in_process'
      and (o.payment_status in ('pending', 'partial', 'overdue') or o.contract_status in ('pending', 'sent', 'under_review', 'not_signed'))
      and (v_is_admin or o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id)))
    union all
    select jsonb_build_object('type', 'cross_opportunity', 'label', 'Oportunidad cruzada', 'prospect_id', c.source_prospect_id,
      'prospect_name', p.company_name, 'company_id', p.represented_company_id, 'company_name', target.name,
      'reason', c.reason, 'owner_name', detected.full_name, 'at', c.created_at, 'href', '/admin/oportunidades-cruzadas') as item,
      4 as priority, c.created_at as at
    from public.represented_company_cross_opportunities c
    join public.represented_company_prospects p on p.id = c.source_prospect_id
    join public.represented_companies target on target.id = c.target_represented_company_id
    join public.admin_profiles detected on detected.id = c.detected_by
    where c.status in ('detected', 'under_review') and (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)
    union all
    select jsonb_build_object('type', 'stale_prospect', 'label', 'Sin movimiento', 'prospect_id', p.id,
      'prospect_name', p.company_name, 'company_id', p.represented_company_id, 'company_name', rc.name,
      'reason', 'Prospecto sin movimiento relevante', 'owner_name', owner.full_name, 'at', p.updated_at,
      'href', '/admin/prospectos?company=' || p.represented_company_id) as item,
      5 as priority, p.updated_at as at
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id
    left join public.admin_profiles owner on owner.id = p.owner_user_id
    where not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status)
      and p.updated_at < now() - interval '14 days'
      and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
  )
  select coalesce(jsonb_agg(item order by priority, at asc), '[]'::jsonb)
  into v_attention from (select item, priority, at from items order by priority, at asc limit 12) limited;

  select coalesce(jsonb_agg(jsonb_build_object('prospect_id', x.prospect_id, 'prospect_name', x.prospect_name,
    'company_id', x.company_id, 'company_name', x.company_name, 'owner_name', x.owner_name,
    'at', x.next_followup_at, 'status', x.status, 'href', x.href) order by x.next_followup_at), '[]'::jsonb)
  into v_followups
  from (
    select p.id as prospect_id, p.company_name as prospect_name, p.represented_company_id as company_id,
      rc.name as company_name, owner.full_name as owner_name, p.next_followup_at,
      case when (p.next_followup_at at time zone 'America/Santiago')::date = v_today then 'today' else 'upcoming' end as status,
      '/admin/seguimientos?view=' || case when (p.next_followup_at at time zone 'America/Santiago')::date = v_today then 'today' else 'upcoming' end as href
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id
    left join public.admin_profiles owner on owner.id = p.owner_user_id
    where not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status)
      and p.next_followup_at >= now() and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
    order by p.next_followup_at
    limit 8
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'prospect_id', x.prospect_id, 'prospect_name', x.prospect_name,
    'company_id', x.company_id, 'company_name', x.company_name, 'control_mode', x.control_mode,
    'contract_status', x.contract_status, 'payment_status', x.payment_status, 'result_status', x.result_status,
    'collaborator_name', x.collaborator_name, 'updated_at', x.updated_at, 'href', x.href) order by x.updated_at desc), '[]'::jsonb)
  into v_opportunities
  from (
    select o.id, o.prospect_id, p.company_name as prospect_name, o.represented_company_id as company_id,
      rc.name as company_name, o.control_mode, o.contract_status, o.payment_status, o.result_status,
      attributed.full_name as collaborator_name, o.updated_at, '/admin/oportunidades' as href
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where o.result_status = 'in_process'
      and (v_is_admin or o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id)))
    order by o.updated_at desc
    limit 8
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'prospect_id', x.prospect_id, 'prospect_name', x.prospect_name,
    'target_company_id', x.target_company_id, 'target_company_name', x.target_company_name, 'detected_by_name', x.detected_by_name,
    'status', x.status, 'created_at', x.created_at, 'href', x.href) order by x.created_at desc), '[]'::jsonb)
  into v_cross
  from (
    select c.id, c.source_prospect_id as prospect_id, p.company_name as prospect_name,
      c.target_represented_company_id as target_company_id, target.name as target_company_name,
      detected.full_name as detected_by_name, c.status, c.created_at, '/admin/oportunidades-cruzadas' as href
    from public.represented_company_cross_opportunities c
    join public.represented_company_prospects p on p.id = c.source_prospect_id
    join public.represented_companies target on target.id = c.target_represented_company_id
    join public.admin_profiles detected on detected.id = c.detected_by
    where c.status in ('detected', 'under_review', 'assigned')
      and (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)
    order by c.created_at desc
    limit 5
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'prospect_id', x.prospect_id, 'prospect_name', x.prospect_name,
    'company_id', x.company_id, 'company_name', x.company_name, 'result_status', x.result_status,
    'payment_status', x.payment_status, 'collaborator_name', x.collaborator_name, 'closed_at', x.closed_at,
    'href', x.href) order by x.closed_at desc nulls last), '[]'::jsonb)
  into v_results
  from (
    select o.id, o.prospect_id, p.company_name as prospect_name, o.represented_company_id as company_id,
      rc.name as company_name, o.result_status, o.payment_status, attributed.full_name as collaborator_name,
      o.closed_at, '/admin/resultados' as href
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where o.result_status in ('won', 'lost') and o.closed_at is not null
      and (v_is_admin or o.attributed_collaborator_id = v_user_id)
    order by o.closed_at desc nulls last
    limit 8
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'name', x.name, 'logo_storage_path', x.logo_storage_path,
    'active_prospects', x.active_prospects, 'overdue', x.overdue,
    'opportunities_in_process', x.opportunities_in_process, 'href', x.href) order by x.name), '[]'::jsonb)
  into v_portfolios
  from (
    select rc.id, rc.name, rc.logo_storage_path,
      (select count(*) from public.represented_company_prospects p where p.represented_company_id = rc.id and not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status) and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))) as active_prospects,
      (select count(*) from public.represented_company_prospects p where p.represented_company_id = rc.id and not p.is_archived and not public.red_comercial_is_terminal_prospect_status(p.status) and p.next_followup_at < now() and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))) as overdue,
      (select count(*) from public.represented_company_opportunities o join public.represented_company_prospects p on p.id = o.prospect_id where o.represented_company_id = rc.id and o.result_status = 'in_process' and (v_is_admin or o.attributed_collaborator_id = v_user_id or public.red_comercial_can_view_prospect_detail(p.id))) as opportunities_in_process,
      '/admin/prospectos?company=' || rc.id as href
    from public.represented_companies rc
    where rc.status = 'active' and (v_is_admin or public.red_comercial_is_company_member(rc.id, v_user_id))
  ) x;

  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'activity_type', x.activity_type,
    'created_by_name', x.created_by_name, 'created_at', x.created_at, 'prospect_name', x.prospect_name) order by x.created_at desc), '[]'::jsonb)
  into v_activity
  from (
    select a.id, a.title, a.activity_type, creator.full_name as created_by_name, a.created_at, p.company_name as prospect_name
    from public.represented_company_prospect_activities a
    join public.represented_company_prospects p on p.id = a.prospect_id
    left join public.admin_profiles creator on creator.id = a.created_by
    where v_is_admin or public.red_comercial_can_view_prospect_detail(a.prospect_id)
    order by a.created_at desc
    limit 8
  ) x;

  return jsonb_build_object('summary', v_summary, 'attention_today', v_attention, 'upcoming_followups', v_followups,
    'opportunities', v_opportunities, 'cross_opportunities', v_cross, 'recent_results', v_results,
    'portfolios', v_portfolios, 'recent_activity', v_activity);
end;
$$;

revoke all on function public.get_red_comercial_dashboard(text) from public;
grant execute on function public.get_red_comercial_dashboard(text) to authenticated;
