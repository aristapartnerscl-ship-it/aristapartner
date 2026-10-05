update public.represented_company_prospects
set is_archived = true
where status = 'archived'
  and is_archived = false;

update public.represented_company_prospects
set status = 'archived'
where is_archived = true
  and status <> 'archived';

alter table public.represented_company_prospects
  add constraint represented_company_prospects_archive_consistency_check
  check ((status = 'archived') = is_archived);

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

  -- The status is authoritative when supplied; an archive flag on its own
  -- is also converted into a valid status so both fields stay in sync.
  if p_payload ? 'status' and nullif(p_payload->>'status', '') is not null then
    v_is_archived := v_status = 'archived';
  elsif p_payload ? 'is_archived' then
    v_status := case when v_is_archived then 'archived' else 'to_contact' end;
  else
    v_is_archived := v_status = 'archived';
  end if;

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
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, created_by)
    values (p_prospect_id, 'archive_change', case when v_is_archived then 'Prospecto archivado' else 'Prospecto restaurado' end, v_user_id);
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

revoke all on function public.update_red_comercial_prospect(uuid, jsonb) from public;
grant execute on function public.update_red_comercial_prospect(uuid, jsonb) to authenticated;
