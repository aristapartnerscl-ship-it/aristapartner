create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  prospect_type text not null,
  full_name text,
  company_name text,
  role_or_activity text,
  email text,
  phone text,
  website text,
  social_network text,
  country text,
  city_region text,
  source text,
  product_or_service text,
  commercial_origin text,
  lead_temperature text not null default 'cold',
  status text not null default 'new',
  priority text not null default 'medium',
  preferred_contact_method text,
  next_action_type text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  contact_attempts integer not null default 0,
  notes text,
  assigned_to uuid references public.admin_profiles(id) on delete restrict,
  converted_contact_id uuid references public.contacts(id) on delete restrict,
  converted_opportunity_id uuid references public.opportunities(id) on delete restrict,
  converted_at timestamptz,
  created_by uuid references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prospects_type_check check (prospect_type in ('person', 'company')),
  constraint prospects_temperature_check check (lead_temperature in ('cold', 'identified', 'qualified')),
  constraint prospects_status_check check (
    status in (
      'new',
      'pending_contact',
      'attempted',
      'contacted',
      'awaiting_response',
      'follow_up',
      'interested',
      'qualified',
      'not_interested',
      'no_response',
      'converted',
      'archived'
    )
  ),
  constraint prospects_priority_check check (priority in ('low', 'medium', 'high')),
  constraint prospects_attempts_check check (contact_attempts >= 0),
  constraint prospects_email_check check (
    email is null
    or (
      email = lower(btrim(email))
      and char_length(email) <= 320
      and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    )
  ),
  constraint prospects_phone_check check (
    phone is null
    or (
      phone = btrim(phone)
      and char_length(phone) between 6 and 64
      and phone !~ '[[:cntrl:]]'
    )
  ),
  constraint prospects_conversion_consistency_check check (
    (
      status = 'converted'
      and converted_contact_id is not null
      and converted_opportunity_id is not null
      and converted_at is not null
    )
    or (
      status <> 'converted'
      and converted_contact_id is null
      and converted_opportunity_id is null
      and converted_at is null
    )
  )
);

comment on table public.prospects is 'Preliminary commercial prospects. Converted prospects preserve links to the formal contact and opportunity.';

create table public.prospect_activities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete restrict,
  activity_type text not null,
  outcome text,
  subject text not null,
  notes text,
  occurred_at timestamptz not null default now(),
  next_action_type text,
  next_action_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint prospect_activities_type_check check (
    activity_type in ('call', 'whatsapp', 'email', 'meeting', 'note', 'status_change', 'follow_up')
  ),
  constraint prospect_activities_outcome_check check (
    outcome is null
    or outcome in (
      'answered',
      'no_answer',
      'message_sent',
      'interested',
      'call_later',
      'meeting_scheduled',
      'not_interested',
      'other'
    )
  ),
  constraint prospect_activities_subject_length_check check (char_length(btrim(subject)) between 1 and 160)
);

comment on table public.prospect_activities is 'Chronological activity and follow-up log for preliminary prospects.';

create trigger prospects_set_updated_at before update on public.prospects
for each row execute function public.set_updated_at();

create index prospects_status_idx on public.prospects (status);
create index prospects_assigned_to_idx on public.prospects (assigned_to);
create index prospects_next_action_at_idx on public.prospects (next_action_at);
create index prospects_last_contact_at_idx on public.prospects (last_contact_at);
create index prospects_created_at_idx on public.prospects (created_at desc);
create index prospects_priority_idx on public.prospects (priority);
create index prospects_source_idx on public.prospects (source);
create index prospects_email_idx on public.prospects (email);
create index prospects_phone_idx on public.prospects (phone);
create index prospects_pending_next_action_idx
  on public.prospects (next_action_at)
  where next_action_at is not null and status not in ('converted', 'archived', 'not_interested');
create unique index prospects_converted_contact_unique_idx
  on public.prospects (converted_contact_id)
  where converted_contact_id is not null;
create unique index prospects_converted_opportunity_unique_idx
  on public.prospects (converted_opportunity_id)
  where converted_opportunity_id is not null;

create index prospect_activities_prospect_occurred_idx on public.prospect_activities (prospect_id, occurred_at desc);
create index prospect_activities_type_idx on public.prospect_activities (activity_type);
create index prospect_activities_next_action_at_idx on public.prospect_activities (next_action_at);
create index prospect_activities_created_by_idx on public.prospect_activities (created_by);

alter table public.prospects enable row level security;
alter table public.prospect_activities enable row level security;

revoke all on public.prospects from anon, authenticated;
revoke all on public.prospect_activities from anon, authenticated;

grant select, insert, update on public.prospects to authenticated;
grant select, insert, update on public.prospect_activities to authenticated;

create policy "active owner can read prospects"
on public.prospects for select
to authenticated
using (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create policy "active owner can insert prospects"
on public.prospects for insert
to authenticated
with check (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create policy "active owner can update prospects"
on public.prospects for update
to authenticated
using (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
))
with check (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create policy "active owner can read prospect activities"
on public.prospect_activities for select
to authenticated
using (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create policy "active owner can insert prospect activities"
on public.prospect_activities for insert
to authenticated
with check (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create policy "active owner can update prospect activities"
on public.prospect_activities for update
to authenticated
using (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
))
with check (exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
));

create or replace function public.create_prospect_activity_atomic(
  p_prospect_id uuid,
  p_activity_type text,
  p_outcome text default null,
  p_subject text default null,
  p_notes text default null,
  p_occurred_at timestamptz default null,
  p_next_action_type text default null,
  p_next_action_at timestamptz default null,
  p_status text default null
)
returns table (
  id uuid,
  prospect_id uuid,
  activity_type text,
  outcome text,
  subject text,
  notes text,
  occurred_at timestamptz,
  next_action_type text,
  next_action_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_activity public.prospect_activities%rowtype;
  v_prospect_status text;
  v_contact_increment integer := 0;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  if p_activity_type not in ('call', 'whatsapp', 'email', 'meeting', 'note', 'status_change', 'follow_up') then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_ACTIVITY_TYPE';
  end if;

  if p_outcome is not null
    and p_outcome not in ('answered', 'no_answer', 'message_sent', 'interested', 'call_later', 'meeting_scheduled', 'not_interested', 'other') then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_OUTCOME';
  end if;

  if p_status is not null
    and p_status not in ('new', 'pending_contact', 'attempted', 'contacted', 'awaiting_response', 'follow_up', 'interested', 'qualified', 'not_interested', 'no_response', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_PROSPECT_STATUS';
  end if;

  if nullif(btrim(coalesce(p_subject, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'AP_ACTIVITY_SUBJECT_REQUIRED';
  end if;

  if p_next_action_at is not null and p_next_action_at <= pg_catalog.now() then
    raise exception using errcode = 'P0001', message = 'AP_NEXT_ACTION_IN_PAST';
  end if;

  select p.status into v_prospect_status
  from public.prospects p
  where p.id = p_prospect_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_PROSPECT_NOT_FOUND';
  end if;

  if v_prospect_status in ('converted', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  insert into public.prospect_activities (
    prospect_id,
    activity_type,
    outcome,
    subject,
    notes,
    occurred_at,
    next_action_type,
    next_action_at,
    created_by
  )
  values (
    p_prospect_id,
    p_activity_type,
    p_outcome,
    btrim(p_subject),
    nullif(btrim(coalesce(p_notes, '')), ''),
    coalesce(p_occurred_at, pg_catalog.now()),
    nullif(btrim(coalesce(p_next_action_type, '')), ''),
    p_next_action_at,
    v_actor
  )
  returning * into v_activity;

  if p_activity_type in ('call', 'whatsapp', 'email', 'meeting') then
    v_contact_increment := 1;
  end if;

  update public.prospects
  set last_contact_at = case
        when p_activity_type in ('call', 'whatsapp', 'email', 'meeting') then v_activity.occurred_at
        else last_contact_at
      end,
      contact_attempts = contact_attempts + v_contact_increment,
      status = coalesce(p_status, status),
      next_action_type = nullif(btrim(coalesce(p_next_action_type, '')), ''),
      next_action_at = p_next_action_at
  where id = p_prospect_id;

  return query select
    v_activity.id,
    v_activity.prospect_id,
    v_activity.activity_type,
    v_activity.outcome,
    v_activity.subject,
    v_activity.notes,
    v_activity.occurred_at,
    v_activity.next_action_type,
    v_activity.next_action_at,
    v_activity.completed_at,
    v_activity.created_by,
    v_activity.created_at;
end;
$$;

create or replace function public.convert_prospect_to_opportunity(
  p_prospect_id uuid,
  p_opportunity_type text,
  p_title text,
  p_description text default null,
  p_expected_date date default null,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_estimated_value numeric default null,
  p_currency text default null,
  p_internal_notes text default null,
  p_existing_contact_id uuid default null,
  p_contact_type text default null,
  p_contact_full_name text default null,
  p_contact_company_name text default null,
  p_contact_position text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_contact_website text default null,
  p_contact_social_media text default null,
  p_contact_country text default null,
  p_contact_region text default null,
  p_contact_city text default null,
  p_contact_notes text default null
)
returns table (
  prospect_id uuid,
  contact_id uuid,
  opportunity_id uuid,
  reference_code text,
  already_converted boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_prospect public.prospects%rowtype;
  v_contact_id uuid;
  v_opportunity_id uuid;
  v_reference_code text;
  v_attempt integer;
  v_has_new_contact_payload boolean;
  v_constraint_name text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select p.*
  into v_prospect
  from public.prospects p
  where p.id = p_prospect_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_PROSPECT_NOT_FOUND';
  end if;

  if v_prospect.status = 'converted' then
    if v_prospect.converted_contact_id is null
      or v_prospect.converted_opportunity_id is null
      or v_prospect.converted_at is null then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    select o.id, o.reference_code, o.contact_id
    into v_opportunity_id, v_reference_code, v_contact_id
    from public.opportunities o
    where o.id = v_prospect.converted_opportunity_id
      and o.contact_id = v_prospect.converted_contact_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_prospect.id, v_contact_id, v_opportunity_id, v_reference_code, true;
    return;
  end if;

  if v_prospect.status = 'archived'
    or v_prospect.converted_contact_id is not null
    or v_prospect.converted_opportunity_id is not null
    or v_prospect.converted_at is not null then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  if p_opportunity_type not in ('buy', 'sell') then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_OPPORTUNITY_TYPE';
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'AP_TITLE_REQUIRED';
  end if;

  if p_estimated_value is not null and p_estimated_value < 0 then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_AMOUNT';
  end if;

  v_has_new_contact_payload := num_nonnulls(
    p_contact_type,
    p_contact_full_name,
    p_contact_company_name,
    p_contact_position,
    p_contact_email,
    p_contact_phone,
    p_contact_website,
    p_contact_social_media,
    p_contact_country,
    p_contact_region,
    p_contact_city,
    p_contact_notes
  ) > 0;

  if (p_existing_contact_id is null and p_contact_type is null)
    or (p_existing_contact_id is not null and v_has_new_contact_payload) then
    raise exception using errcode = 'P0001', message = 'AP_CONTACT_STRATEGY_REQUIRED';
  end if;

  if p_existing_contact_id is not null then
    select c.id into v_contact_id
    from public.contacts c
    where c.id = p_existing_contact_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONTACT_NOT_FOUND';
    end if;
  else
    if p_contact_type not in ('person', 'company') then
      raise exception using errcode = 'P0001', message = 'AP_INVALID_CONTACT_TYPE';
    end if;

    if p_contact_type = 'person' and nullif(btrim(coalesce(p_contact_full_name, '')), '') is null then
      raise exception using errcode = 'P0001', message = 'AP_CONTACT_NAME_REQUIRED';
    end if;

    if p_contact_type = 'company' and nullif(btrim(coalesce(p_contact_company_name, '')), '') is null then
      raise exception using errcode = 'P0001', message = 'AP_CONTACT_COMPANY_REQUIRED';
    end if;

    if nullif(btrim(coalesce(p_contact_email, '')), '') is not null
      and (
        pg_catalog.length(btrim(p_contact_email)) > 320
        or btrim(p_contact_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      ) then
      raise exception using errcode = 'P0001', message = 'AP_INVALID_EMAIL';
    end if;

    if nullif(btrim(coalesce(p_contact_phone, '')), '') is not null
      and pg_catalog.length(btrim(p_contact_phone)) > 64 then
      raise exception using errcode = 'P0001', message = 'AP_INVALID_PHONE';
    end if;

    insert into public.contacts (
      contact_type,
      full_name,
      company_name,
      position,
      email,
      phone,
      website,
      social_media,
      country,
      region,
      city,
      source,
      notes,
      created_by
    )
    values (
      p_contact_type,
      nullif(btrim(coalesce(p_contact_full_name, '')), ''),
      nullif(btrim(coalesce(p_contact_company_name, '')), ''),
      nullif(btrim(coalesce(p_contact_position, '')), ''),
      nullif(lower(btrim(coalesce(p_contact_email, ''))), ''),
      nullif(btrim(coalesce(p_contact_phone, '')), ''),
      nullif(btrim(coalesce(p_contact_website, '')), ''),
      nullif(btrim(coalesce(p_contact_social_media, '')), ''),
      nullif(btrim(coalesce(p_contact_country, '')), ''),
      nullif(btrim(coalesce(p_contact_region, '')), ''),
      nullif(btrim(coalesce(p_contact_city, '')), ''),
      'prospecting',
      nullif(btrim(coalesce(p_contact_notes, '')), ''),
      v_actor
    )
    returning id into v_contact_id;
  end if;

  for v_attempt in 1..8 loop
    v_reference_code := 'ARI-' || pg_catalog.to_char(pg_catalog.now(), 'YYYY') || '-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
    begin
      insert into public.opportunities as inserted_opportunity (
        reference_code,
        opportunity_type,
        title,
        description,
        contact_id,
        status,
        priority,
        source,
        estimated_value,
        currency,
        expected_date,
        country,
        region,
        city,
        internal_notes,
        assigned_to,
        created_by
      )
      values (
        v_reference_code,
        p_opportunity_type,
        btrim(p_title),
        nullif(btrim(coalesce(p_description, '')), ''),
        v_contact_id,
        'under_review',
        v_prospect.priority,
        'prospecting',
        p_estimated_value,
        nullif(upper(btrim(coalesce(p_currency, ''))), ''),
        p_expected_date,
        coalesce(nullif(btrim(coalesce(p_country, '')), ''), nullif(btrim(coalesce(v_prospect.country, '')), '')),
        nullif(btrim(coalesce(p_region, '')), ''),
        coalesce(nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(v_prospect.city_region, '')), '')),
        nullif(btrim(coalesce(p_internal_notes, '')), ''),
        v_actor,
        v_actor
      )
      returning inserted_opportunity.id, inserted_opportunity.reference_code
      into v_opportunity_id, v_reference_code;
      exit;
    exception when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;
      if v_constraint_name = 'opportunities_reference_code_key' then
        if v_attempt = 8 then
          raise exception using errcode = 'P0001', message = 'AP_REFERENCE_CODE_COLLISION';
        end if;
      else
        raise;
      end if;
    end;
  end loop;

  update public.prospects
  set status = 'converted',
      converted_contact_id = v_contact_id,
      converted_opportunity_id = v_opportunity_id,
      converted_at = pg_catalog.now(),
      next_action_type = null,
      next_action_at = null
  where id = v_prospect.id;

  insert into public.prospect_activities (
    prospect_id,
    activity_type,
    subject,
    notes,
    occurred_at,
    created_by
  )
  values (
    v_prospect.id,
    'status_change',
    'Prospecto convertido',
    'Convertido a contacto y oportunidad ' || v_reference_code,
    pg_catalog.now(),
    v_actor
  );

  return query select v_prospect.id, v_contact_id, v_opportunity_id, v_reference_code, false;
end;
$$;

comment on function public.create_prospect_activity_atomic(
  uuid, text, text, text, text, timestamptz, text, timestamptz, text
) is 'Atomically records a prospect activity and updates follow-up/contact state using invoker permissions and RLS.';

comment on function public.convert_prospect_to_opportunity(
  uuid, text, text, text, date, text, text, text, numeric, text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) is 'Atomically converts one preliminary prospect into one contact and one buy or sell opportunity.';

revoke all on function public.create_prospect_activity_atomic(
  uuid, text, text, text, text, timestamptz, text, timestamptz, text
) from public;
revoke all on function public.create_prospect_activity_atomic(
  uuid, text, text, text, text, timestamptz, text, timestamptz, text
) from anon;
grant execute on function public.create_prospect_activity_atomic(
  uuid, text, text, text, text, timestamptz, text, timestamptz, text
) to authenticated;

revoke all on function public.convert_prospect_to_opportunity(
  uuid, text, text, text, date, text, text, text, numeric, text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
revoke all on function public.convert_prospect_to_opportunity(
  uuid, text, text, text, date, text, text, text, numeric, text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) from anon;
grant execute on function public.convert_prospect_to_opportunity(
  uuid, text, text, text, date, text, text, text, numeric, text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;
