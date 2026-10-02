-- Phase 3: global operational follow-up view.
-- The view is derived from prospect dates and activities; no new task entity is created.

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
  id uuid,
  represented_company_id uuid,
  represented_company_name text,
  represented_company_logo_storage_path text,
  company_name text,
  status text,
  channel text,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  owner_user_id uuid,
  owner_name text,
  latest_activity_title text,
  latest_activity_type text,
  latest_activity_at timestamptz,
  is_no_movement boolean,
  days_overdue integer,
  total_count bigint
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
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  v_is_admin := public.is_red_comercial_admin();

  return query
  with scoped as (
    select
      p.*,
      rc.name as represented_company_name,
      rc.logo_storage_path as represented_company_logo_storage_path,
      ap.full_name as owner_name,
      latest.title as latest_activity_title,
      latest.activity_type as latest_activity_type,
      latest.activity_at as latest_activity_at,
      (p.next_followup_at is not null and p.next_followup_at < v_today_start and p.status not in ('agreed', 'not_interested', 'archived')) as is_overdue,
      (p.last_contact_at < now() - interval '7 days' or (p.last_contact_at is null and p.first_contact_at < now() - interval '7 days')) as is_no_movement,
      case when p.next_followup_at is not null and p.next_followup_at < v_today_start then greatest(1, ((v_today_start at time zone 'America/Santiago')::date - (p.next_followup_at at time zone 'America/Santiago')::date)) else 0 end as days_overdue
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id and rc.status = 'active'
    left join public.admin_profiles ap on ap.id = p.owner_user_id
    left join lateral (
      select a.title, a.activity_type, a.activity_at
      from public.represented_company_prospect_activities a
      where a.prospect_id = p.id
      order by a.activity_at desc, a.created_at desc
      limit 1
    ) latest on true
    where (v_is_admin or (
      public.red_comercial_is_company_member(p.represented_company_id, v_user_id)
      and (p.owner_user_id = v_user_id or exists (
        select 1 from public.represented_company_prospect_collaborators pc
        where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'
      ))
    ))
    and (p_company_id is null or p.represented_company_id = p_company_id)
    and (p_responsible_id is null or p.owner_user_id = p_responsible_id)
    and (p_status is null or p.status = p_status)
    and (p_channel is null or p.channel = p_channel)
    and (not coalesce(p_mine, false) or p.owner_user_id = v_user_id or exists (
      select 1 from public.represented_company_prospect_collaborators pc
      where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'
    ))
    and p.status not in ('agreed', 'not_interested', 'archived')
    and case coalesce(p_view, 'all')
      when 'today' then p.next_followup_at >= v_today_start and p.next_followup_at < v_today_start + interval '1 day'
      when 'overdue' then p.next_followup_at < v_today_start
      when 'upcoming' then p.next_followup_at >= v_today_start + interval '1 day' and p.next_followup_at < v_today_start + interval '8 days'
      when 'no_followup' then p.next_followup_at is null
      when 'stale' then (p.last_contact_at < now() - interval '7 days' or (p.last_contact_at is null and p.first_contact_at < now() - interval '7 days'))
      else true
    end
    and (nullif(btrim(p_search), '') is null or lower(p.company_name) like '%' || lower(btrim(p_search)) || '%' or lower(rc.name) like '%' || lower(btrim(p_search)) || '%')
  )
  select
    s.id, s.represented_company_id, s.represented_company_name, s.represented_company_logo_storage_path,
    s.company_name, s.status, s.channel, s.last_contact_at, s.next_followup_at, s.owner_user_id,
    s.owner_name, s.latest_activity_title, s.latest_activity_type, s.latest_activity_at,
    s.is_no_movement, s.days_overdue, count(*) over() as total_count
  from scoped s
  order by
    case when s.is_overdue then 0 when s.next_followup_at >= v_today_start and s.next_followup_at < v_today_start + interval '1 day' then 1 when s.next_followup_at is not null then 2 else 3 end,
    coalesce(s.next_followup_at, '9999-12-31'::timestamptz) asc,
    s.represented_company_name asc,
    s.company_name asc
  limit v_limit offset v_offset;
end;
$$;

create or replace function public.get_red_comercial_followup_metrics(
  p_search text default null,
  p_company_id uuid default null,
  p_responsible_id uuid default null,
  p_status text default null,
  p_channel text default null,
  p_mine boolean default false
)
returns table (
  today bigint,
  overdue bigint,
  upcoming bigint,
  no_followup bigint,
  no_movement bigint,
  total bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
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
      and (p_company_id is null or p.represented_company_id = p_company_id)
      and (p_responsible_id is null or p.owner_user_id = p_responsible_id)
      and (p_status is null or p.status = p_status)
      and (p_channel is null or p.channel = p_channel)
      and (not coalesce(p_mine, false) or p.owner_user_id = v_user_id or exists (select 1 from public.represented_company_prospect_collaborators pc where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'))
      and p.status not in ('agreed', 'not_interested', 'archived')
      and (nullif(btrim(p_search), '') is null or lower(p.company_name) like '%' || lower(btrim(p_search)) || '%' or lower(rc.name) like '%' || lower(btrim(p_search)) || '%')
  )
  select
    count(*) filter (where next_followup_at >= v_today_start and next_followup_at < v_today_start + interval '1 day'),
    count(*) filter (where next_followup_at < v_today_start),
    count(*) filter (where next_followup_at >= v_today_start + interval '1 day' and next_followup_at < v_today_start + interval '8 days'),
    count(*) filter (where next_followup_at is null),
    count(*) filter (where last_contact_at < now() - interval '7 days' or (last_contact_at is null and first_contact_at < now() - interval '7 days')),
    count(*)
  from scoped;
end;
$$;

revoke all on function public.list_red_comercial_followups(text, uuid, uuid, text, text, text, boolean, integer, integer) from public;
revoke all on function public.get_red_comercial_followup_metrics(text, uuid, uuid, text, text, boolean) from public;
grant execute on function public.list_red_comercial_followups(text, uuid, uuid, text, text, text, boolean, integer, integer) to authenticated;
grant execute on function public.get_red_comercial_followup_metrics(text, uuid, uuid, text, text, boolean) to authenticated;
