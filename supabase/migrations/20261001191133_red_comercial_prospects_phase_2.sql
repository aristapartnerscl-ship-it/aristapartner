create table public.represented_company_prospects (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  company_name text not null,
  normalized_company_name text not null,
  website_url text,
  domain text,
  rut text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  channel text,
  status text not null default 'to_contact',
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  owner_user_id uuid references public.admin_profiles(id) on delete set null,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  internal_notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_company_prospects_company_name_check check (length(btrim(company_name)) > 0),
  constraint represented_company_prospects_status_check check (status in (
    'to_contact',
    'contacted_no_response',
    'responded',
    'follow_up',
    'interested',
    'meeting_scheduled',
    'agreed',
    'not_interested',
    'archived'
  )),
  constraint represented_company_prospects_channel_check check (
    channel is null or channel in ('email', 'whatsapp', 'linkedin', 'phone', 'website', 'referral', 'other')
  ),
  constraint represented_company_prospects_website_url_check check (website_url is null or website_url ~* '^https?://')
);

create table public.represented_company_prospect_collaborators (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  user_id uuid not null references public.admin_profiles(id) on delete cascade,
  status text not null default 'active',
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint represented_company_prospect_collaborators_status_check check (status in ('active', 'inactive')),
  constraint represented_company_prospect_collaborators_unique unique (prospect_id, user_id)
);

create table public.represented_company_prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  activity_type text not null,
  title text not null,
  description text,
  activity_at timestamptz not null default now(),
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint represented_company_prospect_activities_title_check check (length(btrim(title)) > 0),
  constraint represented_company_prospect_activities_type_check check (activity_type in (
    'call',
    'email',
    'whatsapp',
    'linkedin',
    'meeting',
    'note',
    'followup',
    'status_change',
    'assignment_change',
    'archive_change'
  ))
);

comment on table public.represented_company_prospects is 'Prospects scoped to a represented company in Red Comercial Arista.';
comment on table public.represented_company_prospect_collaborators is 'Coassigned collaborators for represented company prospects.';
comment on table public.represented_company_prospect_activities is 'Activity timeline for represented company prospects.';

create trigger represented_company_prospects_set_updated_at before update on public.represented_company_prospects
for each row execute function public.set_updated_at();

create index represented_company_prospects_company_idx on public.represented_company_prospects (represented_company_id);
create index represented_company_prospects_status_idx on public.represented_company_prospects (status);
create index represented_company_prospects_owner_idx on public.represented_company_prospects (owner_user_id);
create index represented_company_prospects_next_followup_idx on public.represented_company_prospects (next_followup_at);
create index represented_company_prospects_normalized_company_idx on public.represented_company_prospects (represented_company_id, normalized_company_name);
create index represented_company_prospects_domain_idx on public.represented_company_prospects (represented_company_id, domain) where domain is not null;
create index represented_company_prospects_archived_idx on public.represented_company_prospects (represented_company_id, is_archived);
create index represented_company_prospect_collaborators_prospect_idx on public.represented_company_prospect_collaborators (prospect_id);
create index represented_company_prospect_collaborators_user_idx on public.represented_company_prospect_collaborators (user_id);
create index represented_company_prospect_collaborators_active_idx on public.represented_company_prospect_collaborators (prospect_id, status);
create index represented_company_prospect_activities_prospect_idx on public.represented_company_prospect_activities (prospect_id, activity_at desc);

alter table public.represented_company_prospects enable row level security;
alter table public.represented_company_prospect_collaborators enable row level security;
alter table public.represented_company_prospect_activities enable row level security;

revoke all on public.represented_company_prospects from anon, authenticated;
revoke all on public.represented_company_prospect_collaborators from anon, authenticated;
revoke all on public.represented_company_prospect_activities from anon, authenticated;

create policy "red comercial owner can manage represented company prospects"
on public.represented_company_prospects for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial owner can manage prospect collaborators"
on public.represented_company_prospect_collaborators for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial owner can manage prospect activities"
on public.represented_company_prospect_activities for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create or replace function public.red_comercial_normalize_company_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    lower(
      translate(
        btrim(coalesce(p_name, '')),
        'áéíóúàèìòùäëïöüâêîôûãõñçÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕÑÇ',
        'aeiouaeiouaeiouaeiouaoncAEIOUAEIOUAEIOUAEIOUAONC'
      )
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
$$;

create or replace function public.red_comercial_domain_from_url(p_url text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_host text;
begin
  if p_url is null or btrim(p_url) = '' then
    return null;
  end if;

  v_host := lower(regexp_replace(btrim(p_url), '^https?://', '', 'i'));
  v_host := split_part(v_host, '/', 1);
  v_host := split_part(v_host, ':', 1);
  v_host := regexp_replace(v_host, '^www\.', '', 'i');

  if v_host = '' then
    return null;
  end if;

  return v_host;
end;
$$;

create or replace function public.red_comercial_is_company_member(p_company_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.represented_company_memberships rcm
    join public.admin_profiles ap on ap.id = rcm.user_id
    where rcm.represented_company_id = p_company_id
      and rcm.user_id = p_user_id
      and rcm.status = 'active'
      and ap.role = 'collaborator'
      and ap.is_active = true
      and ap.invitation_status = 'accepted'
      and ap.onboarding_completed_at is not null
  );
$$;

create or replace function public.red_comercial_can_access_company(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_red_comercial_admin()
    or public.red_comercial_is_company_member(p_company_id, (select auth.uid()));
$$;

create or replace function public.red_comercial_can_view_prospect_detail(p_prospect_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_red_comercial_admin()
    or exists (
      select 1
      from public.represented_company_prospects rcp
      where rcp.id = p_prospect_id
        and public.red_comercial_is_company_member(rcp.represented_company_id, (select auth.uid()))
        and (
          rcp.owner_user_id = (select auth.uid())
          or exists (
            select 1
            from public.represented_company_prospect_collaborators rcpc
            where rcpc.prospect_id = p_prospect_id
              and rcpc.user_id = (select auth.uid())
              and rcpc.status = 'active'
          )
        )
    );
$$;

create or replace function public.red_comercial_validate_prospect_assignee(p_company_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is null
    or public.is_red_comercial_admin()
    or public.red_comercial_is_company_member(p_company_id, p_user_id);
$$;

create or replace function public.list_red_comercial_prospects(
  p_company_id uuid,
  p_search text default null,
  p_status text default null,
  p_channel text default null,
  p_owner_user_id uuid default null,
  p_followup_filter text default null,
  p_mine boolean default false,
  p_quick_filter text default null,
  p_include_archived boolean default false,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  represented_company_id uuid,
  company_name text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  channel text,
  status text,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  owner_user_id uuid,
  owner_name text,
  is_archived boolean,
  can_view_detail boolean,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with scoped as (
    select
      p.*,
      public.red_comercial_can_view_prospect_detail(p.id) as can_view_detail,
      owner.full_name as owner_name
    from public.represented_company_prospects p
    left join public.admin_profiles owner on owner.id = p.owner_user_id
    where p.represented_company_id = p_company_id
      and public.red_comercial_can_access_company(p_company_id)
      and (p_include_archived or not p.is_archived)
      and (p_status is null or p.status = p_status)
      and (p_channel is null or p.channel = p_channel)
      and (p_owner_user_id is null or p.owner_user_id = p_owner_user_id)
      and (
        not p_mine
        or p.owner_user_id = (select auth.uid())
        or exists (
          select 1 from public.represented_company_prospect_collaborators pc
          where pc.prospect_id = p.id and pc.user_id = (select auth.uid())
            and pc.status = 'active'
        )
      )
      and (
        p_followup_filter is null
        or (p_followup_filter = 'today' and p.next_followup_at >= date_trunc('day', now()) and p.next_followup_at < date_trunc('day', now()) + interval '1 day')
        or (p_followup_filter = 'overdue' and p.next_followup_at < now() and p.status not in ('agreed', 'not_interested', 'archived') and not p.is_archived)
      )
      and (
        p_quick_filter is null
        or p_quick_filter = 'all'
        or (p_quick_filter = 'today' and p.next_followup_at >= date_trunc('day', now()) and p.next_followup_at < date_trunc('day', now()) + interval '1 day')
        or (p_quick_filter = 'overdue' and p.next_followup_at < now() and p.status not in ('agreed', 'not_interested', 'archived') and not p.is_archived)
        or (p_quick_filter = 'no_response' and p.status = 'contacted_no_response')
        or (p_quick_filter = 'interested' and p.status in ('interested', 'meeting_scheduled'))
      )
      and (
        p_search is null
        or btrim(p_search) = ''
        or p.company_name ilike '%' || p_search || '%'
        or (public.red_comercial_can_view_prospect_detail(p.id) and coalesce(p.contact_name, '') ilike '%' || p_search || '%')
        or (public.red_comercial_can_view_prospect_detail(p.id) and coalesce(p.contact_email, '') ilike '%' || p_search || '%')
      )
  )
  select
    scoped.id,
    scoped.represented_company_id,
    scoped.company_name,
    case when scoped.can_view_detail then scoped.contact_name else null end,
    case when scoped.can_view_detail then scoped.contact_role else null end,
    case when scoped.can_view_detail then scoped.contact_email else null end,
    case when scoped.can_view_detail then scoped.contact_phone else null end,
    scoped.channel,
    scoped.status,
    scoped.first_contact_at,
    scoped.last_contact_at,
    scoped.next_followup_at,
    scoped.owner_user_id,
    scoped.owner_name,
    scoped.is_archived,
    scoped.can_view_detail,
    count(*) over() as total_count
  from scoped
  order by scoped.next_followup_at nulls last, scoped.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 25), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.get_red_comercial_prospect_metrics(p_company_id uuid)
returns table (
  total_prospects bigint,
  to_contact bigint,
  contacted_no_response bigint,
  follow_up bigint,
  agreed bigint,
  overdue bigint,
  today bigint,
  interested bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where not is_archived) as total_prospects,
    count(*) filter (where status = 'to_contact' and not is_archived) as to_contact,
    count(*) filter (where status = 'contacted_no_response' and not is_archived) as contacted_no_response,
    count(*) filter (where status = 'follow_up' and not is_archived) as follow_up,
    count(*) filter (where status = 'agreed' and not is_archived) as agreed,
    count(*) filter (where next_followup_at < now() and status not in ('agreed', 'not_interested', 'archived') and not is_archived) as overdue,
    count(*) filter (where next_followup_at >= date_trunc('day', now()) and next_followup_at < date_trunc('day', now()) + interval '1 day' and not is_archived) as today,
    count(*) filter (where status in ('interested', 'meeting_scheduled') and not is_archived) as interested
  from public.represented_company_prospects
  where represented_company_id = p_company_id
    and public.red_comercial_can_access_company(p_company_id);
$$;

create or replace function public.get_red_comercial_prospect_detail(p_prospect_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prospect public.represented_company_prospects%rowtype;
  v_can_access_company boolean;
  v_can_view_detail boolean;
  v_owner jsonb;
  v_collaborators jsonb;
  v_activities jsonb;
begin
  select * into v_prospect
  from public.represented_company_prospects
  where id = p_prospect_id;

  if not found then
    return null;
  end if;

  v_can_access_company := public.red_comercial_can_access_company(v_prospect.represented_company_id);
  if not v_can_access_company then
    return null;
  end if;

  v_can_view_detail := public.red_comercial_can_view_prospect_detail(v_prospect.id);

  select jsonb_build_object('id', ap.id, 'full_name', ap.full_name, 'email', ap.email)
    into v_owner
  from public.admin_profiles ap
  where ap.id = v_prospect.owner_user_id;

  if v_can_view_detail then
    select coalesce(jsonb_agg(jsonb_build_object('id', ap.id, 'full_name', ap.full_name, 'email', ap.email) order by ap.full_name), '[]'::jsonb)
      into v_collaborators
    from public.represented_company_prospect_collaborators pc
    join public.admin_profiles ap on ap.id = pc.user_id
    where pc.prospect_id = v_prospect.id
      and pc.status = 'active';

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'activity_type', a.activity_type,
      'title', a.title,
      'description', a.description,
      'activity_at', a.activity_at,
      'created_at', a.created_at,
      'created_by', a.created_by,
      'created_by_name', creator.full_name
    ) order by a.activity_at desc, a.created_at desc), '[]'::jsonb)
      into v_activities
    from public.represented_company_prospect_activities a
    left join public.admin_profiles creator on creator.id = a.created_by
    where a.prospect_id = v_prospect.id;
  else
    v_collaborators := '[]'::jsonb;
    v_activities := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'id', v_prospect.id,
    'represented_company_id', v_prospect.represented_company_id,
    'company_name', v_prospect.company_name,
    'website_url', case when v_can_view_detail then v_prospect.website_url else null end,
    'domain', case when v_can_view_detail then v_prospect.domain else null end,
    'rut', case when v_can_view_detail then v_prospect.rut else null end,
    'contact_name', case when v_can_view_detail then v_prospect.contact_name else null end,
    'contact_role', case when v_can_view_detail then v_prospect.contact_role else null end,
    'contact_email', case when v_can_view_detail then v_prospect.contact_email else null end,
    'contact_phone', case when v_can_view_detail then v_prospect.contact_phone else null end,
    'channel', v_prospect.channel,
    'status', v_prospect.status,
    'first_contact_at', v_prospect.first_contact_at,
    'last_contact_at', v_prospect.last_contact_at,
    'next_followup_at', v_prospect.next_followup_at,
    'owner_user_id', v_prospect.owner_user_id,
    'owner', v_owner,
    'collaborators', v_collaborators,
    'internal_notes', case when v_can_view_detail then v_prospect.internal_notes else null end,
    'is_archived', v_prospect.is_archived,
    'can_view_detail', v_can_view_detail,
    'activities', v_activities,
    'created_at', v_prospect.created_at,
    'updated_at', v_prospect.updated_at
  );
end;
$$;

create or replace function public.detect_red_comercial_prospect_duplicates(
  p_company_id uuid,
  p_company_name text,
  p_domain text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_exclude_prospect_id uuid default null
)
returns table (
  id uuid,
  company_name text,
  status text,
  owner_name text,
  duplicate_reason text,
  same_company boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      public.red_comercial_normalize_company_name(p_company_name) as normalized_name,
      nullif(lower(btrim(coalesce(p_domain, ''))), '') as domain,
      nullif(lower(btrim(coalesce(p_contact_email, ''))), '') as email,
      nullif(regexp_replace(coalesce(p_contact_phone, ''), '\D', '', 'g'), '') as phone
  )
  select
    p.id,
    p.company_name,
    p.status,
    owner.full_name as owner_name,
    case
      when p.represented_company_id = p_company_id and p.normalized_company_name = input.normalized_name then 'company_name'
      when p.represented_company_id = p_company_id and input.domain is not null and p.domain = input.domain then 'domain'
      when p.represented_company_id = p_company_id and input.email is not null and lower(coalesce(p.contact_email, '')) = input.email then 'contact_email'
      when p.represented_company_id = p_company_id and input.phone is not null and regexp_replace(coalesce(p.contact_phone, ''), '\D', '', 'g') = input.phone then 'contact_phone'
      else 'other_company'
    end as duplicate_reason,
    p.represented_company_id = p_company_id as same_company
  from public.represented_company_prospects p
  cross join input
  left join public.admin_profiles owner on owner.id = p.owner_user_id
  where public.red_comercial_can_access_company(p_company_id)
    and (p_exclude_prospect_id is null or p.id <> p_exclude_prospect_id)
    and not p.is_archived
    and (
      (
        p.represented_company_id = p_company_id
        and (
          p.normalized_company_name = input.normalized_name
          or (input.domain is not null and p.domain = input.domain)
          or (input.email is not null and lower(coalesce(p.contact_email, '')) = input.email)
          or (input.phone is not null and regexp_replace(coalesce(p.contact_phone, ''), '\D', '', 'g') = input.phone)
        )
      )
      or (
        public.is_red_comercial_admin()
        and p.represented_company_id <> p_company_id
        and (
          p.normalized_company_name = input.normalized_name
          or (input.domain is not null and p.domain = input.domain)
        )
      )
    )
  limit 8;
$$;

create or replace function public.create_red_comercial_prospect(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := (p_payload->>'represented_company_id')::uuid;
  v_company_name text := btrim(coalesce(p_payload->>'company_name', ''));
  v_owner_user_id uuid := nullif(p_payload->>'owner_user_id', '')::uuid;
  v_domain text := coalesce(nullif(p_payload->>'domain', ''), public.red_comercial_domain_from_url(p_payload->>'website_url'));
  v_prospect_id uuid;
  v_collaborator_id uuid;
begin
  if v_user_id is null or not public.red_comercial_can_access_company(v_company_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  if v_company_name = '' then
    raise exception 'AP_COMPANY_NAME_REQUIRED';
  end if;

  if not public.is_red_comercial_admin() then
    v_owner_user_id := v_user_id;
  end if;

  if v_owner_user_id is not null and not public.red_comercial_is_company_member(v_company_id, v_owner_user_id) then
    raise exception 'AP_INVALID_OWNER';
  end if;

  if exists (
    select 1
    from public.detect_red_comercial_prospect_duplicates(
      v_company_id,
      v_company_name,
      v_domain,
      p_payload->>'contact_email',
      p_payload->>'contact_phone',
      null
    )
    where same_company
  ) then
    raise exception 'AP_DUPLICATE_PROSPECT';
  end if;

  insert into public.represented_company_prospects (
    represented_company_id,
    company_name,
    normalized_company_name,
    website_url,
    domain,
    rut,
    contact_name,
    contact_role,
    contact_email,
    contact_phone,
    channel,
    status,
    first_contact_at,
    last_contact_at,
    next_followup_at,
    owner_user_id,
    created_by,
    internal_notes,
    is_archived
  )
  values (
    v_company_id,
    v_company_name,
    public.red_comercial_normalize_company_name(v_company_name),
    nullif(p_payload->>'website_url', ''),
    v_domain,
    nullif(p_payload->>'rut', ''),
    nullif(p_payload->>'contact_name', ''),
    nullif(p_payload->>'contact_role', ''),
    nullif(lower(p_payload->>'contact_email'), ''),
    nullif(p_payload->>'contact_phone', ''),
    nullif(p_payload->>'channel', ''),
    coalesce(nullif(p_payload->>'status', ''), 'to_contact'),
    nullif(p_payload->>'first_contact_at', '')::timestamptz,
    nullif(p_payload->>'last_contact_at', '')::timestamptz,
    nullif(p_payload->>'next_followup_at', '')::timestamptz,
    v_owner_user_id,
    v_user_id,
    nullif(p_payload->>'internal_notes', ''),
    false
  )
  returning id into v_prospect_id;

  if public.is_red_comercial_admin() and jsonb_typeof(p_payload->'collaborator_ids') = 'array' then
    for v_collaborator_id in
      select value::text::uuid from jsonb_array_elements_text(p_payload->'collaborator_ids')
    loop
      if public.red_comercial_is_company_member(v_company_id, v_collaborator_id) then
        insert into public.represented_company_prospect_collaborators (prospect_id, user_id, status, created_by)
        values (v_prospect_id, v_collaborator_id, 'active', v_user_id)
        on conflict (prospect_id, user_id) do update set status = 'active';
      end if;
    end loop;
  end if;

  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  values (v_prospect_id, 'note', 'Prospecto creado', null, v_user_id);

  return public.get_red_comercial_prospect_detail(v_prospect_id);
end;
$$;

create or replace function public.update_red_comercial_prospect(p_prospect_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_existing public.represented_company_prospects%rowtype;
  v_owner_user_id uuid;
  v_status text;
  v_is_archived boolean;
  v_collaborator_id uuid;
begin
  select * into v_existing from public.represented_company_prospects where id = p_prospect_id;
  if not found or v_user_id is null or not public.red_comercial_can_view_prospect_detail(p_prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  v_owner_user_id := coalesce(nullif(p_payload->>'owner_user_id', '')::uuid, v_existing.owner_user_id);
  if not public.is_red_comercial_admin() then
    v_owner_user_id := v_existing.owner_user_id;
  end if;

  if v_owner_user_id is not null and not public.red_comercial_is_company_member(v_existing.represented_company_id, v_owner_user_id) then
    raise exception 'AP_INVALID_OWNER';
  end if;

  v_status := coalesce(nullif(p_payload->>'status', ''), v_existing.status);
  v_is_archived := coalesce((p_payload->>'is_archived')::boolean, v_existing.is_archived);

  update public.represented_company_prospects
  set
    company_name = coalesce(nullif(btrim(p_payload->>'company_name'), ''), company_name),
    normalized_company_name = public.red_comercial_normalize_company_name(coalesce(nullif(btrim(p_payload->>'company_name'), ''), company_name)),
    website_url = case when p_payload ? 'website_url' then nullif(p_payload->>'website_url', '') else website_url end,
    domain = case when p_payload ? 'website_url' then public.red_comercial_domain_from_url(p_payload->>'website_url') else domain end,
    rut = case when p_payload ? 'rut' then nullif(p_payload->>'rut', '') else rut end,
    contact_name = case when p_payload ? 'contact_name' then nullif(p_payload->>'contact_name', '') else contact_name end,
    contact_role = case when p_payload ? 'contact_role' then nullif(p_payload->>'contact_role', '') else contact_role end,
    contact_email = case when p_payload ? 'contact_email' then nullif(lower(p_payload->>'contact_email'), '') else contact_email end,
    contact_phone = case when p_payload ? 'contact_phone' then nullif(p_payload->>'contact_phone', '') else contact_phone end,
    channel = case when p_payload ? 'channel' then nullif(p_payload->>'channel', '') else channel end,
    status = v_status,
    first_contact_at = case when p_payload ? 'first_contact_at' then nullif(p_payload->>'first_contact_at', '')::timestamptz else first_contact_at end,
    last_contact_at = case when p_payload ? 'last_contact_at' then nullif(p_payload->>'last_contact_at', '')::timestamptz else last_contact_at end,
    next_followup_at = case when p_payload ? 'next_followup_at' then nullif(p_payload->>'next_followup_at', '')::timestamptz else next_followup_at end,
    owner_user_id = v_owner_user_id,
    internal_notes = case when p_payload ? 'internal_notes' then nullif(p_payload->>'internal_notes', '') else internal_notes end,
    is_archived = v_is_archived
  where id = p_prospect_id;

  if v_existing.status <> v_status then
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
    values (p_prospect_id, 'status_change', 'Cambio de estado', v_existing.status || ' -> ' || v_status, v_user_id);
  end if;

  if v_existing.owner_user_id is distinct from v_owner_user_id then
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
    values (p_prospect_id, 'assignment_change', 'Cambio de responsable', null, v_user_id);
  end if;

  if v_existing.is_archived is distinct from v_is_archived then
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
    values (p_prospect_id, 'archive_change', case when v_is_archived then 'Prospecto archivado' else 'Prospecto restaurado' end, null, v_user_id);
  end if;

  if public.is_red_comercial_admin() and jsonb_typeof(p_payload->'collaborator_ids') = 'array' then
    update public.represented_company_prospect_collaborators
    set status = 'inactive'
    where prospect_id = p_prospect_id
      and user_id not in (
        select value::text::uuid from jsonb_array_elements_text(p_payload->'collaborator_ids')
      );
    for v_collaborator_id in
      select value::text::uuid from jsonb_array_elements_text(p_payload->'collaborator_ids')
    loop
      if public.red_comercial_is_company_member(v_existing.represented_company_id, v_collaborator_id) then
        insert into public.represented_company_prospect_collaborators (prospect_id, user_id, status, created_by)
        values (p_prospect_id, v_collaborator_id, 'active', v_user_id)
        on conflict (prospect_id, user_id) do update set status = 'active';
      end if;
    end loop;
  end if;

  return public.get_red_comercial_prospect_detail(p_prospect_id);
end;
$$;

create or replace function public.create_red_comercial_prospect_activity(
  p_prospect_id uuid,
  p_activity_type text,
  p_title text,
  p_description text default null,
  p_activity_at timestamptz default now(),
  p_next_followup_at timestamptz default null,
  p_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not public.red_comercial_can_view_prospect_detail(p_prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, activity_at, created_by)
  values (p_prospect_id, p_activity_type, btrim(p_title), nullif(p_description, ''), coalesce(p_activity_at, now()), v_user_id);

  update public.represented_company_prospects
  set
    last_contact_at = case when p_activity_type in ('call', 'email', 'whatsapp', 'linkedin', 'meeting') then coalesce(p_activity_at, now()) else last_contact_at end,
    next_followup_at = coalesce(p_next_followup_at, next_followup_at),
    status = coalesce(nullif(p_status, ''), status)
  where id = p_prospect_id;

  return public.get_red_comercial_prospect_detail(p_prospect_id);
end;
$$;

revoke all on function public.red_comercial_normalize_company_name(text) from public;
revoke all on function public.red_comercial_domain_from_url(text) from public;
revoke all on function public.red_comercial_is_company_member(uuid, uuid) from public;
revoke all on function public.red_comercial_can_access_company(uuid) from public;
revoke all on function public.red_comercial_can_view_prospect_detail(uuid) from public;
revoke all on function public.red_comercial_validate_prospect_assignee(uuid, uuid) from public;
revoke all on function public.list_red_comercial_prospects(uuid, text, text, text, uuid, text, boolean, text, boolean, integer, integer) from public;
revoke all on function public.get_red_comercial_prospect_metrics(uuid) from public;
revoke all on function public.get_red_comercial_prospect_detail(uuid) from public;
revoke all on function public.detect_red_comercial_prospect_duplicates(uuid, text, text, text, text, uuid) from public;
revoke all on function public.create_red_comercial_prospect(jsonb) from public;
revoke all on function public.update_red_comercial_prospect(uuid, jsonb) from public;
revoke all on function public.create_red_comercial_prospect_activity(uuid, text, text, text, timestamptz, timestamptz, text) from public;

grant execute on function public.red_comercial_normalize_company_name(text) to authenticated;
grant execute on function public.red_comercial_domain_from_url(text) to authenticated;
grant execute on function public.list_red_comercial_prospects(uuid, text, text, text, uuid, text, boolean, text, boolean, integer, integer) to authenticated;
grant execute on function public.get_red_comercial_prospect_metrics(uuid) to authenticated;
grant execute on function public.get_red_comercial_prospect_detail(uuid) to authenticated;
grant execute on function public.detect_red_comercial_prospect_duplicates(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.create_red_comercial_prospect(jsonb) to authenticated;
grant execute on function public.update_red_comercial_prospect(uuid, jsonb) to authenticated;
grant execute on function public.create_red_comercial_prospect_activity(uuid, text, text, text, timestamptz, timestamptz, text) to authenticated;
