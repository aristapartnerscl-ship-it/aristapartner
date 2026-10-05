create table public.arista_business_prospects (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  normalized_company_name text not null,
  website text,
  domain text,
  industry text,
  country text,
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  source text not null default 'manual',
  what_they_sell text,
  why_interesting text,
  fit_notes text,
  estimated_ticket numeric,
  territory text,
  status text not null default 'to_research',
  owner_user_id uuid references public.admin_profiles(id) on delete set null,
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  is_archived boolean not null default false,
  archived_at timestamptz,
  converted_represented_company_id uuid references public.represented_companies(id) on delete set null,
  converted_at timestamptz,
  converted_by uuid references public.admin_profiles(id) on delete set null,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint arista_business_prospects_name_check check (length(btrim(company_name)) > 0),
  constraint arista_business_prospects_source_check check (source in ('manual', 'web_submission', 'referral', 'linkedin', 'email', 'other')),
  constraint arista_business_prospects_status_check check (status in ('to_research', 'to_contact', 'contacted_no_response', 'responded', 'interested', 'meeting_scheduled', 'evaluation', 'proposal_sent', 'negotiation', 'agreed', 'not_interested', 'discarded', 'converted')),
  constraint arista_business_prospects_website_check check (website is null or website ~* '^https?://'),
  constraint arista_business_prospects_conversion_check check ((status = 'converted') = (converted_represented_company_id is not null))
);

create table public.arista_business_prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.arista_business_prospects(id) on delete cascade,
  activity_type text not null,
  subject text not null,
  notes text,
  occurred_at timestamptz not null default now(),
  next_followup_at timestamptz,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint arista_business_prospect_activity_type_check check (activity_type in ('call', 'email', 'linkedin', 'whatsapp', 'meeting', 'follow_up', 'note')),
  constraint arista_business_prospect_activity_subject_check check (char_length(btrim(subject)) between 1 and 160)
);

create table public.admin_role_change_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_profiles(id) on delete restrict,
  old_role text not null,
  new_role text not null,
  changed_by uuid not null references public.admin_profiles(id) on delete restrict,
  changed_at timestamptz not null default now()
);

create index arista_business_prospects_status_idx on public.arista_business_prospects (status, is_archived, updated_at desc);
create index arista_business_prospects_owner_idx on public.arista_business_prospects (owner_user_id, status, next_followup_at);
create index arista_business_prospects_name_idx on public.arista_business_prospects (normalized_company_name);
create index arista_business_prospect_activities_prospect_idx on public.arista_business_prospect_activities (prospect_id, occurred_at desc);
create index admin_role_change_audit_user_idx on public.admin_role_change_audit (user_id, changed_at desc);

alter table public.arista_business_prospects enable row level security;
alter table public.arista_business_prospect_activities enable row level security;
alter table public.admin_role_change_audit enable row level security;
revoke all on public.arista_business_prospects, public.arista_business_prospect_activities, public.admin_role_change_audit from anon, authenticated;

create or replace function public.list_arista_business_prospects(
  p_search text default null,
  p_status text default null,
  p_owner_user_id uuid default null,
  p_include_archived boolean default false,
  p_limit integer default 25,
  p_offset integer default 0
)
returns setof jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
begin
  if not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  return query
  select jsonb_build_object(
    'id', p.id, 'company_name', p.company_name, 'website', p.website, 'domain', p.domain,
    'industry', p.industry, 'country', p.country, 'contact_name', p.contact_name,
    'contact_role', p.contact_role, 'contact_email', p.contact_email, 'contact_phone', p.contact_phone,
    'source', p.source, 'what_they_sell', p.what_they_sell, 'why_interesting', p.why_interesting,
    'fit_notes', p.fit_notes, 'estimated_ticket', p.estimated_ticket, 'territory', p.territory,
    'status', p.status, 'owner_user_id', p.owner_user_id, 'owner_name', owner.full_name,
    'first_contact_at', p.first_contact_at, 'last_contact_at', p.last_contact_at,
    'next_followup_at', p.next_followup_at, 'is_archived', p.is_archived,
    'converted_represented_company_id', p.converted_represented_company_id,
    'converted_at', p.converted_at, 'created_at', p.created_at, 'updated_at', p.updated_at
  )
  from public.arista_business_prospects p
  left join public.admin_profiles owner on owner.id = p.owner_user_id
  where (p_include_archived or not p.is_archived)
    and (p_status is null or p.status = p_status)
    and (p_owner_user_id is null or p.owner_user_id = p_owner_user_id)
    and (p_search is null or concat_ws(' ', p.company_name, p.contact_name, p.industry, p.contact_email) ilike '%' || p_search || '%')
  order by p.updated_at desc
  limit v_limit offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.get_arista_business_prospect(p_prospect_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  select jsonb_build_object(
    'id', p.id, 'company_name', p.company_name, 'normalized_company_name', p.normalized_company_name,
    'website', p.website, 'domain', p.domain, 'industry', p.industry, 'country', p.country,
    'contact_name', p.contact_name, 'contact_role', p.contact_role, 'contact_email', p.contact_email,
    'contact_phone', p.contact_phone, 'source', p.source, 'what_they_sell', p.what_they_sell,
    'why_interesting', p.why_interesting, 'fit_notes', p.fit_notes, 'estimated_ticket', p.estimated_ticket,
    'territory', p.territory, 'status', p.status, 'owner_user_id', p.owner_user_id,
    'owner_name', owner.full_name, 'first_contact_at', p.first_contact_at, 'last_contact_at', p.last_contact_at,
    'next_followup_at', p.next_followup_at, 'is_archived', p.is_archived,
    'converted_represented_company_id', p.converted_represented_company_id, 'converted_at', p.converted_at,
    'converted_by', p.converted_by, 'created_at', p.created_at, 'updated_at', p.updated_at,
    'activities', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'activity_type', a.activity_type, 'subject', a.subject, 'notes', a.notes, 'occurred_at', a.occurred_at, 'next_followup_at', a.next_followup_at, 'created_by', a.created_by) order by a.occurred_at desc) from public.arista_business_prospect_activities a where a.prospect_id = p.id), '[]'::jsonb)
  ) into v_result
  from public.arista_business_prospects p
  left join public.admin_profiles owner on owner.id = p.owner_user_id
  where p.id = p_prospect_id;
  return v_result;
end;
$$;

create or replace function public.create_arista_business_prospect(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_user uuid := (select auth.uid());
  v_name text := nullif(btrim(p_payload->>'company_name'), '');
  v_normalized_name text;
  v_domain text;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  if v_name is null then raise exception 'ARISTA_PROSPECT_COMPANY_REQUIRED'; end if;
  v_normalized_name := lower(regexp_replace(v_name, '[^a-z0-9]+', ' ', 'gi'));
  v_domain := nullif(lower(regexp_replace(coalesce(p_payload->>'domain', ''), '^www\\.', '')), '');
  if exists (
    select 1
    from public.arista_business_prospects p
    where not p.is_archived
      and (
        p.normalized_company_name = v_normalized_name
        or (v_domain is not null and p.domain = v_domain)
      )
  ) then
    raise exception 'ARISTA_PROSPECT_DUPLICATE';
  end if;
  insert into public.arista_business_prospects (company_name, normalized_company_name, website, domain, industry, country, contact_name, contact_role, contact_email, contact_phone, source, what_they_sell, why_interesting, fit_notes, estimated_ticket, territory, status, owner_user_id, created_by)
  values (v_name, v_normalized_name, nullif(p_payload->>'website',''), v_domain, nullif(p_payload->>'industry',''), nullif(p_payload->>'country',''), nullif(p_payload->>'contact_name',''), nullif(p_payload->>'contact_role',''), nullif(p_payload->>'contact_email',''), nullif(p_payload->>'contact_phone',''), coalesce(nullif(p_payload->>'source',''),'manual'), nullif(p_payload->>'what_they_sell',''), nullif(p_payload->>'why_interesting',''), nullif(p_payload->>'fit_notes',''), nullif(p_payload->>'estimated_ticket','')::numeric, nullif(p_payload->>'territory',''), coalesce(nullif(p_payload->>'status',''),'to_research'), nullif(p_payload->>'owner_user_id','')::uuid, v_user)
  returning id into v_id;
  return public.get_arista_business_prospect(v_id);
end;
$$;

create or replace function public.update_arista_business_prospect(p_prospect_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  update public.arista_business_prospects set
    company_name = coalesce(nullif(btrim(p_payload->>'company_name'), ''), company_name),
    website = case when p_payload ? 'website' then nullif(p_payload->>'website','') else website end,
    industry = case when p_payload ? 'industry' then nullif(p_payload->>'industry','') else industry end,
    contact_name = case when p_payload ? 'contact_name' then nullif(p_payload->>'contact_name','') else contact_name end,
    contact_role = case when p_payload ? 'contact_role' then nullif(p_payload->>'contact_role','') else contact_role end,
    contact_email = case when p_payload ? 'contact_email' then nullif(p_payload->>'contact_email','') else contact_email end,
    contact_phone = case when p_payload ? 'contact_phone' then nullif(p_payload->>'contact_phone','') else contact_phone end,
    source = coalesce(nullif(p_payload->>'source',''), source), status = coalesce(nullif(p_payload->>'status',''), status),
    what_they_sell = case when p_payload ? 'what_they_sell' then nullif(p_payload->>'what_they_sell','') else what_they_sell end,
    why_interesting = case when p_payload ? 'why_interesting' then nullif(p_payload->>'why_interesting','') else why_interesting end,
    fit_notes = case when p_payload ? 'fit_notes' then nullif(p_payload->>'fit_notes','') else fit_notes end,
    owner_user_id = case when p_payload ? 'owner_user_id' then nullif(p_payload->>'owner_user_id','')::uuid else owner_user_id end,
    next_followup_at = case when p_payload ? 'next_followup_at' then nullif(p_payload->>'next_followup_at','')::timestamptz else next_followup_at end,
    is_archived = case when p_payload ? 'is_archived' then (p_payload->>'is_archived')::boolean else is_archived end,
    archived_at = case when (p_payload->>'is_archived')::boolean is true then coalesce(archived_at, now()) else null end,
    updated_at = now()
  where id = p_prospect_id;
  return public.get_arista_business_prospect(p_prospect_id);
end;
$$;

create or replace function public.add_arista_business_prospect_activity(p_prospect_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  insert into public.arista_business_prospect_activities (prospect_id, activity_type, subject, notes, occurred_at, next_followup_at, created_by)
  values (p_prospect_id, coalesce(nullif(p_payload->>'activity_type',''),'note'), nullif(btrim(p_payload->>'subject'),''), nullif(p_payload->>'notes',''), coalesce(nullif(p_payload->>'occurred_at','')::timestamptz, now()), nullif(p_payload->>'next_followup_at','')::timestamptz, v_user);
  return public.get_arista_business_prospect(p_prospect_id);
end;
$$;

create or replace function public.convert_arista_business_prospect(p_prospect_id uuid, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_prospect public.arista_business_prospects%rowtype; v_company_id uuid; v_slug text;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  select * into v_prospect from public.arista_business_prospects where id = p_prospect_id for update;
  if not found then raise exception 'ARISTA_PROSPECT_NOT_FOUND'; end if;
  if v_prospect.status = 'converted' or v_prospect.converted_represented_company_id is not null then return public.get_arista_business_prospect(p_prospect_id); end if;
  select id into v_company_id from public.represented_companies where lower(name) = lower(v_prospect.company_name) or (v_prospect.domain is not null and website_url ilike '%' || v_prospect.domain || '%') limit 1;
  if v_company_id is null then
    v_slug := regexp_replace(lower(v_prospect.company_name), '[^a-z0-9]+', '-', 'gi');
    insert into public.represented_companies (name, slug, description, website_url, target_industries, territory, internal_owner_id)
    values (v_prospect.company_name, v_slug, v_prospect.what_they_sell, v_prospect.website, case when v_prospect.industry is null then '{}'::text[] else array[v_prospect.industry] end, v_prospect.territory, v_prospect.owner_user_id)
    returning id into v_company_id;
  end if;
  update public.arista_business_prospects set status = 'converted', converted_represented_company_id = v_company_id, converted_at = now(), converted_by = v_user, updated_at = now() where id = p_prospect_id;
  return public.get_arista_business_prospect(p_prospect_id);
end;
$$;

create or replace function public.convert_form_submission_to_arista_prospect(p_submission_id uuid, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_submission public.form_submissions%rowtype; v_id uuid; v_name text; v_data jsonb;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  select * into v_submission from public.form_submissions where id = p_submission_id for update;
  if not found then raise exception 'FORM_SUBMISSION_NOT_FOUND'; end if;
  if v_submission.converted_entity_id is not null then
    return public.get_arista_business_prospect(v_submission.converted_entity_id);
  end if;
  v_data := v_submission.payload || coalesce(p_payload, '{}'::jsonb);
  v_name := nullif(btrim(coalesce(v_data->>'company_name', v_data->>'company', v_data->>'organization', v_data->>'name')), '');
  if v_name is null then raise exception 'ARISTA_PROSPECT_COMPANY_REQUIRED'; end if;
  insert into public.arista_business_prospects (company_name, normalized_company_name, website, industry, contact_name, contact_role, contact_email, contact_phone, source, why_interesting, fit_notes, status, created_by)
  values (v_name, lower(regexp_replace(v_name, '[^a-z0-9]+', ' ', 'gi')), nullif(coalesce(v_data->>'website', v_data->>'website_url'), ''), nullif(v_data->>'industry',''), nullif(coalesce(v_data->>'contact_name', v_data->>'fullName', v_data->>'full_name'), ''), nullif(coalesce(v_data->>'contact_role', v_data->>'role'), ''), nullif(v_data->>'email',''), nullif(v_data->>'phone',''), 'web_submission', nullif(coalesce(v_data->>'message', v_data->>'reason', v_data->>'need'), ''), 'Solicitud web: ' || v_submission.submission_type, 'to_research', v_user)
  returning id into v_id;
  update public.form_submissions set status = 'converted', reviewed_at = now(), reviewed_by = v_user, converted_entity_type = 'arista_business_prospect', converted_entity_id = v_id where id = p_submission_id;
  return public.get_arista_business_prospect(v_id);
end;
$$;

create or replace function public.update_red_comercial_user_role(p_user_id uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := (select auth.uid()); v_old text; v_admins integer;
begin
  if v_actor is null or not public.is_red_comercial_admin() then raise exception 'ARISTA_ADMIN_REQUIRED'; end if;
  if p_role not in ('owner', 'collaborator') then raise exception 'ARISTA_ROLE_INVALID'; end if;
  select role into v_old from public.admin_profiles where id = p_user_id for update;
  if not found then raise exception 'ARISTA_USER_NOT_FOUND'; end if;
  if v_old = 'owner' and p_role = 'collaborator' then
    select count(*) into v_admins from public.admin_profiles where role = 'owner' and is_active = true;
    if v_admins <= 1 then raise exception 'ARISTA_LAST_ADMIN'; end if;
  end if;
  update public.admin_profiles set role = p_role, updated_at = now() where id = p_user_id;
  insert into public.admin_role_change_audit (user_id, old_role, new_role, changed_by) values (p_user_id, v_old, p_role, v_actor);
  return jsonb_build_object('id', p_user_id, 'old_role', v_old, 'new_role', p_role, 'changed_by', v_actor, 'changed_at', now());
end;
$$;

create or replace function public.notify_admins_of_form_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_notifications (recipient_id, notification_type, entity_type, entity_id, title, message, action_path)
  select ap.id, 'form_submission_received', 'form_submission', new.id,
    'Nueva solicitud web', 'Se recibió una solicitud ' || new.submission_type || '.', '/admin/solicitudes-web'
  from public.admin_profiles ap where ap.role = 'owner' and ap.is_active = true;
  return new;
end;
$$;

drop trigger if exists form_submissions_notify_admins on public.form_submissions;
create trigger form_submissions_notify_admins after insert on public.form_submissions for each row execute function public.notify_admins_of_form_submission();

revoke all on function public.list_arista_business_prospects(text, text, uuid, boolean, integer, integer), public.get_arista_business_prospect(uuid), public.create_arista_business_prospect(jsonb), public.update_arista_business_prospect(uuid, jsonb), public.add_arista_business_prospect_activity(uuid, jsonb), public.convert_arista_business_prospect(uuid, jsonb), public.convert_form_submission_to_arista_prospect(uuid, jsonb), public.update_red_comercial_user_role(uuid, text) from public;
grant execute on function public.list_arista_business_prospects(text, text, uuid, boolean, integer, integer), public.get_arista_business_prospect(uuid), public.create_arista_business_prospect(jsonb), public.update_arista_business_prospect(uuid, jsonb), public.add_arista_business_prospect_activity(uuid, jsonb), public.convert_arista_business_prospect(uuid, jsonb), public.convert_form_submission_to_arista_prospect(uuid, jsonb), public.update_red_comercial_user_role(uuid, text) to authenticated;
