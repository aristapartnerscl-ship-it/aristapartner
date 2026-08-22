-- Atomic conversion RPCs for reviewed public receptions and inquiries.
-- Prepared locally only; do not apply until the migration history is reconciled.

create or replace function public.convert_inquiry_to_opportunity_atomic(
  p_inquiry_id uuid,
  p_opportunity_type text,
  p_title text,
  p_description text default null,
  p_expected_date date default null,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_estimated_value numeric default null,
  p_currency text default null,
  p_internal_notes text default null
)
returns table (
  inquiry_id uuid,
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
  v_inquiry public.inquiries%rowtype;
  v_opportunity_id uuid;
  v_reference_code text;
  v_attempt integer;
  v_constraint_name text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.admin_profiles ap
    where ap.id = v_actor
      and ap.is_active = true
      and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select i.*
  into v_inquiry
  from public.inquiries i
  where i.id = p_inquiry_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_INQUIRY_NOT_FOUND';
  end if;

  if v_inquiry.status = 'converted' and v_inquiry.converted_opportunity_id is not null then
    select o.id, o.reference_code
    into v_opportunity_id, v_reference_code
    from public.opportunities o
    where o.id = v_inquiry.converted_opportunity_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_inquiry.id, v_opportunity_id, v_reference_code, true;
    return;
  end if;

  if v_inquiry.status = 'converted'
    or v_inquiry.converted_opportunity_id is not null then
    raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
  end if;

  if v_inquiry.status = 'archived' then
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
        v_inquiry.contact_id,
        'under_review',
        'medium',
        'inquiry',
        p_estimated_value,
        nullif(upper(btrim(coalesce(p_currency, ''))), ''),
        p_expected_date,
        nullif(btrim(coalesce(p_country, '')), ''),
        nullif(btrim(coalesce(p_region, '')), ''),
        nullif(btrim(coalesce(p_city, '')), ''),
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

  update public.inquiries
  set status = 'converted',
      converted_opportunity_id = v_opportunity_id
  where id = v_inquiry.id;

  return query select v_inquiry.id, v_opportunity_id, v_reference_code, false;
end;
$$;

comment on function public.convert_inquiry_to_opportunity_atomic(
  uuid, text, text, text, date, text, text, text, numeric, text, text
) is 'Atomically converts an inquiry into one opportunity using invoker permissions and RLS.';

create or replace function public.convert_contact_submission_atomic(
  p_submission_id uuid,
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
  p_contact_notes text default null,
  p_reason text default null,
  p_subject text default null,
  p_message text default null,
  p_preferred_contact_method text default null,
  p_internal_notes text default null
)
returns table (
  submission_id uuid,
  contact_id uuid,
  entity_type text,
  entity_id uuid,
  visible_identifier text,
  already_converted boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_submission public.form_submissions%rowtype;
  v_contact_id uuid;
  v_entity_id uuid;
  v_has_new_contact_payload boolean;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select fs.*
  into v_submission
  from public.form_submissions fs
  where fs.id = p_submission_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.submission_type <> 'contact' then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_SUBMISSION_TYPE';
  end if;

  if v_submission.status = 'converted' then
    if v_submission.converted_entity_type <> 'inquiry' or v_submission.converted_entity_id is null then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    select i.contact_id, i.id
    into v_contact_id, v_entity_id
    from public.inquiries i
    where i.id = v_submission.converted_entity_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_submission.id, v_contact_id, 'inquiry'::text, v_entity_id, null::text, true;
    return;
  end if;

  if v_submission.status in ('rejected', 'spam', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  if v_submission.converted_entity_type is not null
    or v_submission.converted_entity_id is not null then
    raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
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
      'public_form',
      nullif(btrim(coalesce(p_contact_notes, '')), ''),
      v_actor
    )
    returning id into v_contact_id;
  end if;

  if nullif(btrim(coalesce(p_subject, '')), '') is null
    or nullif(btrim(coalesce(p_message, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'AP_INQUIRY_FIELDS_REQUIRED';
  end if;

  insert into public.inquiries (
    contact_id,
    subject,
    reason,
    message,
    preferred_contact_method,
    status,
    internal_notes,
    assigned_to
  )
  values (
    v_contact_id,
    btrim(p_subject),
    nullif(btrim(coalesce(p_reason, '')), ''),
    btrim(p_message),
    nullif(btrim(coalesce(p_preferred_contact_method, '')), ''),
    'new',
    nullif(btrim(coalesce(p_internal_notes, '')), ''),
    v_actor
  )
  returning id into v_entity_id;

  update public.form_submissions
  set status = 'converted',
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_actor,
      converted_entity_type = 'inquiry',
      converted_entity_id = v_entity_id
  where id = v_submission.id;

  return query select v_submission.id, v_contact_id, 'inquiry'::text, v_entity_id, null::text, false;
end;
$$;

comment on function public.convert_contact_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) is 'Atomically converts a contact form submission into a contact and inquiry, or reuses one existing contact.';

create or replace function public.convert_buy_submission_atomic(
  p_submission_id uuid,
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
  p_contact_notes text default null,
  p_title text default null,
  p_description text default null,
  p_expected_date date default null,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_estimated_value numeric default null,
  p_currency text default null,
  p_internal_notes text default null
)
returns table (
  submission_id uuid,
  contact_id uuid,
  entity_type text,
  entity_id uuid,
  visible_identifier text,
  already_converted boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_submission public.form_submissions%rowtype;
  v_contact_id uuid;
  v_entity_id uuid;
  v_reference_code text;
  v_attempt integer;
  v_has_new_contact_payload boolean;
  v_constraint_name text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select fs.*
  into v_submission
  from public.form_submissions fs
  where fs.id = p_submission_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.submission_type <> 'buy' then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_SUBMISSION_TYPE';
  end if;

  if v_submission.status = 'converted' then
    if v_submission.converted_entity_type <> 'opportunity' or v_submission.converted_entity_id is null then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    select o.contact_id, o.id, o.reference_code
    into v_contact_id, v_entity_id, v_reference_code
    from public.opportunities o
    where o.id = v_submission.converted_entity_id
      and o.opportunity_type = 'buy';

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_submission.id, v_contact_id, 'opportunity'::text, v_entity_id, v_reference_code, true;
    return;
  end if;

  if v_submission.status in ('rejected', 'spam', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  if v_submission.converted_entity_type is not null
    or v_submission.converted_entity_id is not null then
    raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
  end if;

  v_has_new_contact_payload := num_nonnulls(
    p_contact_type, p_contact_full_name, p_contact_company_name, p_contact_position,
    p_contact_email, p_contact_phone, p_contact_website, p_contact_social_media,
    p_contact_country, p_contact_region, p_contact_city, p_contact_notes
  ) > 0;

  if (p_existing_contact_id is null and p_contact_type is null)
    or (p_existing_contact_id is not null and v_has_new_contact_payload) then
    raise exception using errcode = 'P0001', message = 'AP_CONTACT_STRATEGY_REQUIRED';
  end if;

  if p_existing_contact_id is not null then
    select c.id into v_contact_id from public.contacts c where c.id = p_existing_contact_id;
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
      contact_type, full_name, company_name, position, email, phone, website, social_media,
      country, region, city, source, notes, created_by
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
      'public_form',
      nullif(btrim(coalesce(p_contact_notes, '')), ''),
      v_actor
    )
    returning id into v_contact_id;
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'AP_TITLE_REQUIRED';
  end if;

  if p_estimated_value is not null and p_estimated_value < 0 then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_AMOUNT';
  end if;

  for v_attempt in 1..8 loop
    v_reference_code := 'ARI-' || pg_catalog.to_char(pg_catalog.now(), 'YYYY') || '-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
    begin
      insert into public.opportunities as inserted_opportunity (
        reference_code, opportunity_type, title, description, contact_id, status, priority,
        source, estimated_value, currency, expected_date, country, region, city,
        internal_notes, assigned_to, created_by
      )
      values (
        v_reference_code, 'buy', btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''),
        v_contact_id, 'under_review', 'medium', 'public_form', p_estimated_value,
        nullif(upper(btrim(coalesce(p_currency, ''))), ''), p_expected_date,
        nullif(btrim(coalesce(p_country, '')), ''), nullif(btrim(coalesce(p_region, '')), ''),
        nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(p_internal_notes, '')), ''),
        v_actor, v_actor
      )
      returning inserted_opportunity.id, inserted_opportunity.reference_code into v_entity_id, v_reference_code;
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

  update public.form_submissions
  set status = 'converted',
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_actor,
      converted_entity_type = 'opportunity',
      converted_entity_id = v_entity_id
  where id = v_submission.id;

  return query select v_submission.id, v_contact_id, 'opportunity'::text, v_entity_id, v_reference_code, false;
end;
$$;

comment on function public.convert_buy_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) is 'Atomically converts a buy form submission into a contact and buy opportunity, or reuses one existing contact.';

create or replace function public.convert_sell_submission_atomic(
  p_submission_id uuid,
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
  p_contact_notes text default null,
  p_title text default null,
  p_description text default null,
  p_expected_date date default null,
  p_country text default null,
  p_region text default null,
  p_city text default null,
  p_estimated_value numeric default null,
  p_currency text default null,
  p_internal_notes text default null
)
returns table (
  submission_id uuid,
  contact_id uuid,
  entity_type text,
  entity_id uuid,
  visible_identifier text,
  already_converted boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_submission public.form_submissions%rowtype;
  v_contact_id uuid;
  v_entity_id uuid;
  v_reference_code text;
  v_attempt integer;
  v_has_new_contact_payload boolean;
  v_constraint_name text;
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select fs.* into v_submission
  from public.form_submissions fs
  where fs.id = p_submission_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.submission_type <> 'sell' then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_SUBMISSION_TYPE';
  end if;

  if v_submission.status = 'converted' then
    if v_submission.converted_entity_type <> 'opportunity' or v_submission.converted_entity_id is null then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    select o.contact_id, o.id, o.reference_code
    into v_contact_id, v_entity_id, v_reference_code
    from public.opportunities o
    where o.id = v_submission.converted_entity_id
      and o.opportunity_type = 'sell';

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_submission.id, v_contact_id, 'opportunity'::text, v_entity_id, v_reference_code, true;
    return;
  end if;

  if v_submission.status in ('rejected', 'spam', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  if v_submission.converted_entity_type is not null
    or v_submission.converted_entity_id is not null then
    raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
  end if;

  v_has_new_contact_payload := num_nonnulls(
    p_contact_type, p_contact_full_name, p_contact_company_name, p_contact_position,
    p_contact_email, p_contact_phone, p_contact_website, p_contact_social_media,
    p_contact_country, p_contact_region, p_contact_city, p_contact_notes
  ) > 0;

  if (p_existing_contact_id is null and p_contact_type is null)
    or (p_existing_contact_id is not null and v_has_new_contact_payload) then
    raise exception using errcode = 'P0001', message = 'AP_CONTACT_STRATEGY_REQUIRED';
  end if;

  if p_existing_contact_id is not null then
    select c.id into v_contact_id from public.contacts c where c.id = p_existing_contact_id;
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
      contact_type, full_name, company_name, position, email, phone, website, social_media,
      country, region, city, source, notes, created_by
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
      'public_form',
      nullif(btrim(coalesce(p_contact_notes, '')), ''),
      v_actor
    )
    returning id into v_contact_id;
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    raise exception using errcode = 'P0001', message = 'AP_TITLE_REQUIRED';
  end if;

  if p_estimated_value is not null and p_estimated_value < 0 then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_AMOUNT';
  end if;

  for v_attempt in 1..8 loop
    v_reference_code := 'ARI-' || pg_catalog.to_char(pg_catalog.now(), 'YYYY') || '-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.encode(extensions.gen_random_bytes(6), 'hex'), 1, 6));
    begin
      insert into public.opportunities as inserted_opportunity (
        reference_code, opportunity_type, title, description, contact_id, status, priority,
        source, estimated_value, currency, expected_date, country, region, city,
        internal_notes, assigned_to, created_by
      )
      values (
        v_reference_code, 'sell', btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''),
        v_contact_id, 'under_review', 'medium', 'public_form', p_estimated_value,
        nullif(upper(btrim(coalesce(p_currency, ''))), ''), p_expected_date,
        nullif(btrim(coalesce(p_country, '')), ''), nullif(btrim(coalesce(p_region, '')), ''),
        nullif(btrim(coalesce(p_city, '')), ''), nullif(btrim(coalesce(p_internal_notes, '')), ''),
        v_actor, v_actor
      )
      returning inserted_opportunity.id, inserted_opportunity.reference_code into v_entity_id, v_reference_code;
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

  update public.form_submissions
  set status = 'converted',
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_actor,
      converted_entity_type = 'opportunity',
      converted_entity_id = v_entity_id
  where id = v_submission.id;

  return query select v_submission.id, v_contact_id, 'opportunity'::text, v_entity_id, v_reference_code, false;
end;
$$;

comment on function public.convert_sell_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) is 'Atomically converts a sell form submission into a contact and sell opportunity, or reuses one existing contact.';

create or replace function public.convert_supplier_submission_atomic(
  p_submission_id uuid,
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
  p_contact_notes text default null,
  p_business_name text default null,
  p_legal_name text default null,
  p_tax_id text default null,
  p_description text default null,
  p_categories text[] default null,
  p_geographic_coverage text default null,
  p_supply_capacity text default null,
  p_minimum_order numeric default null,
  p_minimum_order_currency text default null,
  p_issues_invoice boolean default null,
  p_commercial_terms text default null,
  p_internal_notes text default null
)
returns table (
  submission_id uuid,
  contact_id uuid,
  entity_type text,
  entity_id uuid,
  visible_identifier text,
  already_converted boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_submission public.form_submissions%rowtype;
  v_contact_id uuid;
  v_entity_id uuid;
  v_business_name text;
  v_has_new_contact_payload boolean;
  v_categories text[];
begin
  if v_actor is null then
    raise exception using errcode = 'P0001', message = 'AP_AUTH_REQUIRED';
  end if;

  if not exists (
    select 1 from public.admin_profiles ap
    where ap.id = v_actor and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception using errcode = 'P0001', message = 'AP_OWNER_REQUIRED';
  end if;

  select fs.* into v_submission
  from public.form_submissions fs
  where fs.id = p_submission_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'AP_SUBMISSION_NOT_FOUND';
  end if;

  if v_submission.submission_type <> 'supplier' then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_SUBMISSION_TYPE';
  end if;

  if v_submission.status = 'converted' then
    if v_submission.converted_entity_type <> 'supplier' or v_submission.converted_entity_id is null then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    select s.contact_id, s.id, s.business_name
    into v_contact_id, v_entity_id, v_business_name
    from public.suppliers s
    where s.id = v_submission.converted_entity_id;

    if not found then
      raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
    end if;

    return query select v_submission.id, v_contact_id, 'supplier'::text, v_entity_id, v_business_name, true;
    return;
  end if;

  if v_submission.status in ('rejected', 'spam', 'archived') then
    raise exception using errcode = 'P0001', message = 'AP_SOURCE_CLOSED';
  end if;

  if v_submission.converted_entity_type is not null
    or v_submission.converted_entity_id is not null then
    raise exception using errcode = 'P0001', message = 'AP_CONVERSION_INTEGRITY_ERROR';
  end if;

  v_has_new_contact_payload := num_nonnulls(
    p_contact_type, p_contact_full_name, p_contact_company_name, p_contact_position,
    p_contact_email, p_contact_phone, p_contact_website, p_contact_social_media,
    p_contact_country, p_contact_region, p_contact_city, p_contact_notes
  ) > 0;

  if (p_existing_contact_id is null and p_contact_type is null)
    or (p_existing_contact_id is not null and v_has_new_contact_payload) then
    raise exception using errcode = 'P0001', message = 'AP_CONTACT_STRATEGY_REQUIRED';
  end if;

  if p_existing_contact_id is not null then
    select c.id into v_contact_id from public.contacts c where c.id = p_existing_contact_id;
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
      contact_type, full_name, company_name, position, email, phone, website, social_media,
      country, region, city, source, notes, created_by
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
      'public_form',
      nullif(btrim(coalesce(p_contact_notes, '')), ''),
      v_actor
    )
    returning id into v_contact_id;
  end if;

  v_business_name := nullif(btrim(coalesce(p_business_name, '')), '');
  v_categories := (
    select coalesce(array_agg(distinct nullif(btrim(category), '')) filter (where nullif(btrim(category), '') is not null), array[]::text[])
    from unnest(coalesce(p_categories, array[]::text[])) as raw_category(category)
  );

  if v_business_name is null then
    raise exception using errcode = 'P0001', message = 'AP_SUPPLIER_NAME_REQUIRED';
  end if;

  if coalesce(array_length(v_categories, 1), 0) = 0 then
    raise exception using errcode = 'P0001', message = 'AP_SUPPLIER_CATEGORIES_REQUIRED';
  end if;

  if p_minimum_order is not null and p_minimum_order < 0 then
    raise exception using errcode = 'P0001', message = 'AP_INVALID_AMOUNT';
  end if;

  insert into public.suppliers (
    contact_id,
    business_name,
    legal_name,
    tax_id,
    description,
    categories,
    geographic_coverage,
    supply_capacity,
    minimum_order,
    minimum_order_currency,
    issues_invoice,
    commercial_terms,
    status,
    internal_notes,
    created_by
  )
  values (
    v_contact_id,
    v_business_name,
    nullif(btrim(coalesce(p_legal_name, '')), ''),
    nullif(btrim(coalesce(p_tax_id, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    v_categories,
    nullif(btrim(coalesce(p_geographic_coverage, '')), ''),
    nullif(btrim(coalesce(p_supply_capacity, '')), ''),
    p_minimum_order,
    nullif(upper(btrim(coalesce(p_minimum_order_currency, ''))), ''),
    p_issues_invoice,
    nullif(btrim(coalesce(p_commercial_terms, '')), ''),
    'pending',
    nullif(btrim(coalesce(p_internal_notes, '')), ''),
    v_actor
  )
  returning id into v_entity_id;

  update public.form_submissions
  set status = 'converted',
      reviewed_at = pg_catalog.now(),
      reviewed_by = v_actor,
      converted_entity_type = 'supplier',
      converted_entity_id = v_entity_id
  where id = v_submission.id;

  return query select v_submission.id, v_contact_id, 'supplier'::text, v_entity_id, v_business_name, false;
end;
$$;

comment on function public.convert_supplier_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text[], text, text, numeric, text, boolean, text, text
) is 'Atomically converts a supplier form submission into a contact and pending supplier, or reuses one existing contact.';

revoke all on function public.convert_inquiry_to_opportunity_atomic(
  uuid, text, text, text, date, text, text, text, numeric, text, text
) from public;
revoke all on function public.convert_inquiry_to_opportunity_atomic(
  uuid, text, text, text, date, text, text, text, numeric, text, text
) from anon;
grant execute on function public.convert_inquiry_to_opportunity_atomic(
  uuid, text, text, text, date, text, text, text, numeric, text, text
) to authenticated;

revoke all on function public.convert_contact_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public;
revoke all on function public.convert_contact_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) from anon;
grant execute on function public.convert_contact_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

revoke all on function public.convert_buy_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) from public;
revoke all on function public.convert_buy_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) from anon;
grant execute on function public.convert_buy_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) to authenticated;

revoke all on function public.convert_sell_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) from public;
revoke all on function public.convert_sell_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) from anon;
grant execute on function public.convert_sell_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, date, text, text, text, numeric, text, text
) to authenticated;

revoke all on function public.convert_supplier_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text[], text, text, numeric, text, boolean, text, text
) from public;
revoke all on function public.convert_supplier_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text[], text, text, numeric, text, boolean, text, text
) from anon;
grant execute on function public.convert_supplier_submission_atomic(
  uuid, uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text[], text, text, numeric, text, boolean, text, text
) to authenticated;
