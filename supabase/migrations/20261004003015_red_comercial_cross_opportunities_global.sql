alter table public.represented_company_cross_opportunities
  add column if not exists converted_prospect_id uuid references public.represented_company_prospects(id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_by uuid references public.admin_profiles(id) on delete set null,
  add column if not exists discarded_at timestamptz,
  add column if not exists discarded_by uuid references public.admin_profiles(id) on delete set null,
  add column if not exists discard_reason text,
  add column if not exists discard_note text;

create index if not exists red_cross_target_idx on public.represented_company_cross_opportunities (target_represented_company_id, updated_at desc);
create index if not exists red_cross_detected_by_idx on public.represented_company_cross_opportunities (detected_by, updated_at desc);
create index if not exists red_cross_assigned_to_idx on public.represented_company_cross_opportunities (assigned_to, updated_at desc);
create index if not exists red_cross_status_idx on public.represented_company_cross_opportunities (status, updated_at desc);
create index if not exists red_cross_converted_prospect_idx on public.represented_company_cross_opportunities (converted_prospect_id);

create or replace function public.red_comercial_can_view_cross_opportunity(p_cross_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_red_comercial_admin()
    or exists (
      select 1
      from public.represented_company_cross_opportunities c
      where c.id = p_cross_id
        and (c.detected_by = (select auth.uid()) or c.assigned_to = (select auth.uid()))
    );
$$;

create or replace function public.red_comercial_cross_opportunity_json(c public.represented_company_cross_opportunities)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', c.id,
    'source_prospect_id', c.source_prospect_id,
    'source_prospect_company_name', source.company_name,
    'source_prospect_logo_storage_path', source.logo_storage_path,
    'source_represented_company_id', source_company.id,
    'source_represented_company_name', source_company.name,
    'source_represented_company_logo_storage_path', source_company.logo_storage_path,
    'target_represented_company_id', c.target_represented_company_id,
    'target_company_name', target_company.name,
    'target_company_logo_storage_path', target_company.logo_storage_path,
    'detected_by', c.detected_by,
    'detected_by_name', detected.full_name,
    'reason', c.reason,
    'status', c.status,
    'assigned_to', c.assigned_to,
    'assigned_to_name', assigned.full_name,
    'converted_prospect_id', c.converted_prospect_id,
    'converted_prospect_company_name', converted.company_name,
    'converted_at', c.converted_at,
    'converted_by', c.converted_by,
    'converted_by_name', converter.full_name,
    'discarded_at', c.discarded_at,
    'discarded_by', c.discarded_by,
    'discarded_by_name', discarder.full_name,
    'discard_reason', c.discard_reason,
    'discard_note', c.discard_note,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'can_manage', public.is_red_comercial_admin()
  )
  from public.represented_company_prospects source
  join public.represented_companies source_company on source_company.id = source.represented_company_id
  join public.represented_companies target_company on target_company.id = c.target_represented_company_id
  join public.admin_profiles detected on detected.id = c.detected_by
  left join public.admin_profiles assigned on assigned.id = c.assigned_to
  left join public.represented_company_prospects converted on converted.id = c.converted_prospect_id
  left join public.admin_profiles converter on converter.id = c.converted_by
  left join public.admin_profiles discarder on discarder.id = c.discarded_by
  where source.id = c.source_prospect_id;
$$;

create or replace function public.list_red_comercial_cross_opportunities(
  p_search text default null,
  p_source_company_id uuid default null,
  p_target_company_id uuid default null,
  p_status text default null,
  p_assigned_to uuid default null,
  p_view text default 'all',
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_rows jsonb;
  v_total integer;
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  v_is_admin := public.is_red_comercial_admin();

  with scoped as (
    select c.*
    from public.represented_company_cross_opportunities c
    join public.represented_company_prospects source on source.id = c.source_prospect_id
    join public.represented_companies source_company on source_company.id = source.represented_company_id
    join public.represented_companies target_company on target_company.id = c.target_represented_company_id
    left join public.admin_profiles detected on detected.id = c.detected_by
    left join public.admin_profiles assigned on assigned.id = c.assigned_to
    where (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)
      and (p_source_company_id is null or source.represented_company_id = p_source_company_id)
      and (p_target_company_id is null or c.target_represented_company_id = p_target_company_id)
      and (p_status is null or c.status = p_status)
      and (p_assigned_to is null or c.assigned_to = p_assigned_to)
      and (coalesce(nullif(p_view, ''), 'all') = 'all' or c.status = p_view)
      and (
        coalesce(nullif(btrim(p_search), ''), '') = ''
        or source.company_name ilike '%' || btrim(p_search) || '%'
        or source_company.name ilike '%' || btrim(p_search) || '%'
        or target_company.name ilike '%' || btrim(p_search) || '%'
        or c.reason ilike '%' || btrim(p_search) || '%'
        or detected.full_name ilike '%' || btrim(p_search) || '%'
        or assigned.full_name ilike '%' || btrim(p_search) || '%'
      )
  ),
  counted as (
    select count(*)::integer as total from scoped
  ),
  paged as (
    select * from scoped order by updated_at desc, created_at desc limit v_limit offset v_offset
  )
  select coalesce(jsonb_agg(public.red_comercial_cross_opportunity_json(paged) order by paged.updated_at desc, paged.created_at desc) filter (where paged.id is not null), '[]'::jsonb), counted.total
    into v_rows, v_total
  from counted
  left join paged on true
  group by counted.total;

  return jsonb_build_object('rows', coalesce(v_rows, '[]'::jsonb), 'total', coalesce(v_total, 0));
end;
$$;

create or replace function public.get_red_comercial_cross_opportunity_metrics(
  p_search text default null,
  p_source_company_id uuid default null,
  p_target_company_id uuid default null,
  p_assigned_to uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  v_is_admin := public.is_red_comercial_admin();

  with scoped as (
    select c.status
    from public.represented_company_cross_opportunities c
    join public.represented_company_prospects source on source.id = c.source_prospect_id
    join public.represented_companies source_company on source_company.id = source.represented_company_id
    join public.represented_companies target_company on target_company.id = c.target_represented_company_id
    left join public.admin_profiles detected on detected.id = c.detected_by
    left join public.admin_profiles assigned on assigned.id = c.assigned_to
    where (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)
      and (p_source_company_id is null or source.represented_company_id = p_source_company_id)
      and (p_target_company_id is null or c.target_represented_company_id = p_target_company_id)
      and (p_assigned_to is null or c.assigned_to = p_assigned_to)
      and (
        coalesce(nullif(btrim(p_search), ''), '') = ''
        or source.company_name ilike '%' || btrim(p_search) || '%'
        or source_company.name ilike '%' || btrim(p_search) || '%'
        or target_company.name ilike '%' || btrim(p_search) || '%'
        or c.reason ilike '%' || btrim(p_search) || '%'
        or detected.full_name ilike '%' || btrim(p_search) || '%'
        or assigned.full_name ilike '%' || btrim(p_search) || '%'
      )
  )
  select jsonb_build_object(
    'total', count(*)::integer,
    'detected', count(*) filter (where status = 'detected')::integer,
    'under_review', count(*) filter (where status = 'under_review')::integer,
    'assigned', count(*) filter (where status = 'assigned')::integer,
    'converted', count(*) filter (where status = 'converted')::integer,
    'discarded', count(*) filter (where status = 'discarded')::integer
  )
    into v_result
  from scoped;

  return coalesce(v_result, jsonb_build_object('total', 0, 'detected', 0, 'under_review', 0, 'assigned', 0, 'converted', 0, 'discarded', 0));
end;
$$;

create or replace function public.get_red_comercial_cross_opportunity_detail(p_cross_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_cross public.represented_company_cross_opportunities;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;

  select * into v_cross
  from public.represented_company_cross_opportunities
  where id = p_cross_id;

  if not found then
    return null;
  end if;
  if not public.red_comercial_can_view_cross_opportunity(p_cross_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

create or replace function public.update_red_comercial_cross_opportunity(p_cross_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cross public.represented_company_cross_opportunities;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  if not public.is_red_comercial_admin() then
    raise exception 'AP_ADMIN_REQUIRED';
  end if;
  if p_status not in ('detected', 'under_review', 'assigned') then
    raise exception 'AP_INVALID_STATUS';
  end if;

  update public.represented_company_cross_opportunities
  set status = p_status
  where id = p_cross_id and status not in ('converted', 'discarded')
  returning * into v_cross;

  if not found then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

create or replace function public.assign_red_comercial_cross_opportunity(p_cross_id uuid, p_assigned_to uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cross public.represented_company_cross_opportunities;
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  if not public.is_red_comercial_admin() then
    raise exception 'AP_ADMIN_REQUIRED';
  end if;

  select * into v_cross
  from public.represented_company_cross_opportunities
  where id = p_cross_id
  for update;

  if not found or v_cross.status in ('converted', 'discarded') then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  if p_assigned_to is not null and not public.red_comercial_is_company_member(v_cross.target_represented_company_id, p_assigned_to) then
    raise exception 'AP_INVALID_ASSIGNEE';
  end if;

  update public.represented_company_cross_opportunities
  set assigned_to = p_assigned_to,
      status = case when p_assigned_to is null then 'under_review' else 'assigned' end
  where id = p_cross_id
  returning * into v_cross;

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

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
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  if not public.is_red_comercial_admin() then
    raise exception 'AP_ADMIN_REQUIRED';
  end if;

  select * into v_cross
  from public.represented_company_cross_opportunities
  where id = p_cross_id
  for update;

  if not found or v_cross.status in ('converted', 'discarded') then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  select * into v_source
  from public.represented_company_prospects
  where id = v_cross.source_prospect_id;

  if not found then
    raise exception 'AP_NOT_FOUND';
  end if;

  if v_cross.assigned_to is not null and not public.red_comercial_is_company_member(v_cross.target_represented_company_id, v_cross.assigned_to) then
    raise exception 'AP_INVALID_ASSIGNEE';
  end if;

  select p.id into v_existing_id
  from public.represented_company_prospects p
  where p.represented_company_id = v_cross.target_represented_company_id
    and not p.is_archived
    and (
      p.normalized_company_name = public.red_comercial_normalize_company_name(v_source.company_name)
      or (v_source.domain is not null and p.domain = v_source.domain)
    )
  order by p.updated_at desc
  limit 1;

  if v_existing_id is null then
    insert into public.represented_company_prospects (
      represented_company_id,
      company_name,
      normalized_company_name,
      website_url,
      domain,
      status,
      owner_user_id,
      created_by,
      internal_notes,
      is_archived
    )
    values (
      v_cross.target_represented_company_id,
      v_source.company_name,
      public.red_comercial_normalize_company_name(v_source.company_name),
      v_source.website_url,
      v_source.domain,
      'to_contact',
      v_cross.assigned_to,
      v_user_id,
      null,
      false
    )
    returning id into v_new_id;

    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
    values (v_new_id, 'note', 'Prospecto creado desde oportunidad cruzada', v_cross.reason, v_user_id);
  else
    v_new_id := v_existing_id;
  end if;

  update public.represented_company_cross_opportunities
  set status = 'converted',
      converted_prospect_id = v_new_id,
      converted_at = now(),
      converted_by = v_user_id
  where id = p_cross_id
  returning * into v_cross;

  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  values (v_source.id, 'note', 'Oportunidad cruzada convertida', 'Convertida para la cartera destino.', v_user_id);

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

create or replace function public.discard_red_comercial_cross_opportunity(p_cross_id uuid, p_reason text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cross public.represented_company_cross_opportunities;
  v_user_id uuid := (select auth.uid());
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  if not public.is_red_comercial_admin() then
    raise exception 'AP_ADMIN_REQUIRED';
  end if;
  if v_reason is null or v_reason not in ('not_applicable', 'already_exists', 'no_fit', 'insufficient_info', 'other') then
    raise exception 'AP_INVALID_DISCARD_REASON';
  end if;

  update public.represented_company_cross_opportunities
  set status = 'discarded',
      discarded_at = now(),
      discarded_by = v_user_id,
      discard_reason = v_reason,
      discard_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_cross_id and status not in ('converted', 'discarded')
  returning * into v_cross;

  if not found then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  return public.red_comercial_cross_opportunity_json(v_cross);
end;
$$;

revoke all on function public.red_comercial_can_view_cross_opportunity(uuid) from public;
revoke all on function public.red_comercial_cross_opportunity_json(public.represented_company_cross_opportunities) from public;
revoke all on function public.list_red_comercial_cross_opportunities(text, uuid, uuid, text, uuid, text, integer, integer) from public;
revoke all on function public.get_red_comercial_cross_opportunity_metrics(text, uuid, uuid, uuid) from public;
revoke all on function public.get_red_comercial_cross_opportunity_detail(uuid) from public;
revoke all on function public.update_red_comercial_cross_opportunity(uuid, text) from public;
revoke all on function public.assign_red_comercial_cross_opportunity(uuid, uuid) from public;
revoke all on function public.convert_red_comercial_cross_opportunity(uuid) from public;
revoke all on function public.discard_red_comercial_cross_opportunity(uuid, text, text) from public;

grant execute on function public.list_red_comercial_cross_opportunities(text, uuid, uuid, text, uuid, text, integer, integer) to authenticated;
grant execute on function public.get_red_comercial_cross_opportunity_metrics(text, uuid, uuid, uuid) to authenticated;
grant execute on function public.get_red_comercial_cross_opportunity_detail(uuid) to authenticated;
grant execute on function public.update_red_comercial_cross_opportunity(uuid, text) to authenticated;
grant execute on function public.assign_red_comercial_cross_opportunity(uuid, uuid) to authenticated;
grant execute on function public.convert_red_comercial_cross_opportunity(uuid) to authenticated;
grant execute on function public.discard_red_comercial_cross_opportunity(uuid, text, text) to authenticated;
