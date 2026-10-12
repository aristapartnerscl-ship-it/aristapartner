create or replace function public.red_comercial_normalize_company_name(p_name text)
returns text
language sql immutable
set search_path = ''
as $$
  select btrim(regexp_replace(
    lower(translate(
      btrim(coalesce(p_name, '')),
      'áéíóúàèìòùäëïöüâêîôûãõñçÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÂÊÎÔÛÃÕÑÇ',
      'aeiouaeiouaeiouaeiouaoncAEIOUAEIOUAEIOUAEIOUAONC'
    )),
    '[^a-z0-9]+',
    ' ',
    'g'
  ));
$$;

create table public.represented_company_accounts (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  account_name text not null,
  normalized_account_name text not null,
  status text not null default 'available',
  source text,
  public_note text,
  internal_note text,
  linked_prospect_id uuid references public.represented_company_prospects(id) on delete set null,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_company_accounts_name_check check (length(btrim(account_name)) > 0),
  constraint represented_company_accounts_status_check check (status in (
    'available', 'represented_client', 'represented_active_opportunity',
    'represented_lead', 'arista_prospect', 'blocked'
  ))
);

create unique index represented_company_accounts_company_name_unique_idx
  on public.represented_company_accounts (represented_company_id, normalized_account_name);
create index represented_company_accounts_status_idx
  on public.represented_company_accounts (represented_company_id, status);

create or replace function public.red_comercial_validate_account_prospect_company()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_prospect_company_id uuid;
begin
  if new.linked_prospect_id is null then return new; end if;
  select represented_company_id into v_prospect_company_id
  from public.represented_company_prospects where id = new.linked_prospect_id;
  if v_prospect_company_id is null or v_prospect_company_id <> new.represented_company_id then
    raise exception 'REDCOM_ACCOUNT_PROSPECT_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

create trigger represented_company_accounts_validate_prospect_company
before insert or update of represented_company_id, linked_prospect_id on public.represented_company_accounts
for each row execute function public.red_comercial_validate_account_prospect_company();

create trigger represented_company_accounts_set_updated_at
before update on public.represented_company_accounts
for each row execute function public.set_updated_at();

alter table public.represented_company_accounts enable row level security;
revoke all on public.represented_company_accounts from anon, authenticated;

create or replace function public.list_red_comercial_company_accounts(p_company_id uuid)
returns setof jsonb
language sql stable security definer set search_path = ''
as $$
  select case when public.is_red_comercial_admin() then to_jsonb(a) || jsonb_build_object('prospect_status', p.status)
    else jsonb_build_object(
      'id', a.id,
      'represented_company_id', a.represented_company_id,
      'account_name', a.account_name,
      'status', a.status,
      'source', a.source,
      'public_note', a.public_note,
      'has_linked_prospect', a.linked_prospect_id is not null,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ) end
  from public.represented_company_accounts a
  left join public.represented_company_prospects p on p.id = a.linked_prospect_id
  where a.represented_company_id = p_company_id
    and public.red_comercial_can_access_company(p_company_id);
$$;

create or replace function public.check_red_comercial_account_contactability(
  p_represented_company_id uuid,
  p_account_name text
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_account public.represented_company_accounts%rowtype;
  v_normalized text := public.red_comercial_normalize_company_name(p_account_name);
  v_allowed boolean;
  v_reason text;
begin
  if not public.red_comercial_can_access_company(p_represented_company_id) then
    raise exception 'REDCOM_ACCOUNT_ACCESS_DENIED';
  end if;
  select * into v_account from public.represented_company_accounts
  where represented_company_id = p_represented_company_id
    and normalized_account_name = v_normalized;
  if not found then
    return jsonb_build_object('account_id', null, 'status', null, 'status_label', null,
      'contact_allowed', true, 'reason', null, 'linked_prospect_id', null);
  end if;
  v_allowed := v_account.status in ('available', 'represented_lead', 'arista_prospect');
  v_reason := case v_account.status
    when 'represented_client' then 'Esta empresa figura como cliente actual del representado y no debe ser contactada.'
    when 'represented_active_opportunity' then 'El representado ya mantiene una conversación activa con esta empresa.'
    when 'blocked' then 'Esta cuenta está marcada como No contactar.'
    else null end;
  return jsonb_build_object(
    'account_id', v_account.id, 'status', v_account.status,
    'status_label', case v_account.status when 'available' then 'Disponible' when 'represented_client' then 'Cliente del representado' when 'represented_active_opportunity' then 'Conversación activa del representado' when 'represented_lead' then 'Lead entregado a Arista' when 'arista_prospect' then 'Prospecto Arista' when 'blocked' then 'No contactar' end,
    'contact_allowed', v_allowed, 'reason', v_reason, 'linked_prospect_id', v_account.linked_prospect_id
  );
end;
$$;

create or replace function public.create_red_comercial_company_account(p_company_id uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_payload->>'account_name', ''));
  v_status text := coalesce(nullif(p_payload->>'status', ''), 'available');
  v_id uuid;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  if v_name = '' then raise exception 'REDCOM_ACCOUNT_NAME_REQUIRED'; end if;
  insert into public.represented_company_accounts (represented_company_id, account_name, normalized_account_name, status, source, public_note, internal_note, created_by, updated_by)
  values (p_company_id, v_name, public.red_comercial_normalize_company_name(v_name), v_status,
    nullif(p_payload->>'source',''), nullif(p_payload->>'public_note',''), nullif(p_payload->>'internal_note',''), v_user, v_user)
  on conflict (represented_company_id, normalized_account_name) do nothing
  returning id into v_id;
  if v_id is null then
    select id into v_id from public.represented_company_accounts where represented_company_id = p_company_id and normalized_account_name = public.red_comercial_normalize_company_name(v_name);
  end if;
  return (select to_jsonb(a) from public.represented_company_accounts a where a.id = v_id);
end;
$$;

create or replace function public.update_red_comercial_company_account(p_account_id uuid, p_payload jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid()); v_row public.represented_company_accounts%rowtype;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  update public.represented_company_accounts set
    account_name = coalesce(nullif(btrim(p_payload->>'account_name'), ''), account_name),
    normalized_account_name = case when nullif(btrim(p_payload->>'account_name'), '') is null then normalized_account_name else public.red_comercial_normalize_company_name(p_payload->>'account_name') end,
    status = coalesce(nullif(p_payload->>'status',''), status), source = case when p_payload ? 'source' then nullif(p_payload->>'source','') else source end,
    public_note = case when p_payload ? 'public_note' then nullif(p_payload->>'public_note','') else public_note end,
    internal_note = case when p_payload ? 'internal_note' then nullif(p_payload->>'internal_note','') else internal_note end,
    updated_by = v_user, updated_at = now()
  where id = p_account_id returning * into v_row;
  if v_row.id is null then raise exception 'REDCOM_ACCOUNT_NOT_FOUND'; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.import_red_comercial_company_accounts(p_company_id uuid, p_status text, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid()); v_item jsonb; v_name text; v_norm text; v_account_id uuid; v_existing_status text; v_existing_linked uuid; v_prospect jsonb; v_results jsonb := '[]'::jsonb;
begin
  if v_user is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  if p_status not in ('represented_client','represented_active_opportunity','represented_lead','blocked') then raise exception 'REDCOM_IMPORT_STATUS_INVALID'; end if;
  for v_item in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    begin
    v_account_id := null;
    v_existing_status := null;
    v_existing_linked := null;
    v_prospect := null;
    v_name := btrim(coalesce(v_item->>'account_name', v_item->>'company_name', ''));
    if v_name = '' then v_results := v_results || jsonb_build_array(jsonb_build_object('result','error','message','Empresa obligatoria')); continue; end if;
    v_norm := public.red_comercial_normalize_company_name(v_name);
    select id, status, linked_prospect_id into v_account_id, v_existing_status, v_existing_linked
    from public.represented_company_accounts
    where represented_company_id = p_company_id and normalized_account_name = v_norm;
    if v_account_id is not null then
      if v_existing_status is distinct from p_status then
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'result','conflict', 'account_id',v_account_id, 'account_name',v_name,
          'existing_status',v_existing_status, 'requested_status',p_status,
          'linked_prospect_id',v_existing_linked,
          'message','La cuenta ya existe con otro estado. Requiere revisión ADMIN.'
        ));
      else
        v_results := v_results || jsonb_build_array(jsonb_build_object(
          'result','skipped_existing','account_id',v_account_id,'account_name',v_name,
          'linked_prospect_id',v_existing_linked
        ));
      end if;
      continue;
    end if;
    insert into public.represented_company_accounts (represented_company_id, account_name, normalized_account_name, status, source, public_note, internal_note, created_by, updated_by)
    values (p_company_id, v_name, v_norm, p_status, coalesce(v_item->>'source','represented_company'), nullif(v_item->>'public_note',''), nullif(v_item->>'internal_note',''), v_user, v_user)
    on conflict (represented_company_id, normalized_account_name) do nothing returning id into v_account_id;
    if v_account_id is null then v_results := v_results || jsonb_build_array(jsonb_build_object('result','skipped_existing','account_name',v_name)); continue; end if;
    if p_status = 'represented_lead' then
      v_prospect := public.create_red_comercial_prospect(jsonb_build_object(
        'represented_company_id', p_company_id, 'company_name', v_name, 'contact_name', nullif(v_item->>'contact_name',''),
        'contact_email', nullif(v_item->>'contact_email',''), 'contact_phone', nullif(v_item->>'contact_phone',''),
        'channel', 'referral', 'status', 'to_contact',
        'next_followup_at', nullif(v_item->>'next_followup_at',''),
        'internal_notes', nullif(v_item->>'internal_notes','')
      ));
      update public.represented_company_accounts set linked_prospect_id = (v_prospect->>'id')::uuid where id = v_account_id;
    end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object('result','created','account_id',v_account_id,'prospect_id',v_prospect->>'id','account_name',v_name));
    exception when others then
      v_results := v_results || jsonb_build_array(jsonb_build_object('result','error','account_name',v_name,'code',sqlstate,'message',sqlerrm));
    end;
  end loop;
  return v_results;
end;
$$;

create or replace function public.create_red_comercial_prospect(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid()); v_company_id uuid := (p_payload->>'represented_company_id')::uuid; v_company_name text := btrim(coalesce(p_payload->>'company_name','')); v_owner_user_id uuid := nullif(p_payload->>'owner_user_id','')::uuid; v_domain text := coalesce(nullif(p_payload->>'domain',''), public.red_comercial_domain_from_url(p_payload->>'website_url')); v_prospect_id uuid; v_collaborator_id uuid; v_account public.represented_company_accounts%rowtype; v_norm text := public.red_comercial_normalize_company_name(v_company_name);
begin
  if v_user_id is null or not public.red_comercial_can_access_company(v_company_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  if v_company_name = '' then raise exception 'AP_COMPANY_NAME_REQUIRED'; end if;
  select * into v_account from public.represented_company_accounts where represented_company_id = v_company_id and normalized_account_name = v_norm for update;
  if found and v_account.status in ('represented_client','represented_active_opportunity','blocked') then
    if v_account.status = 'represented_client' then raise exception 'REDCOM_ACCOUNT_CLIENT_BLOCKED'; end if;
    if v_account.status = 'represented_active_opportunity' then raise exception 'REDCOM_ACCOUNT_ACTIVE_OPPORTUNITY_BLOCKED'; end if;
    raise exception 'REDCOM_ACCOUNT_BLOCKED';
  end if;
  if found and v_account.status = 'represented_lead' and v_account.linked_prospect_id is not null then return public.get_red_comercial_prospect_detail(v_account.linked_prospect_id); end if;
  if not public.is_red_comercial_admin() then v_owner_user_id := v_user_id; end if;
  if v_owner_user_id is not null and not public.red_comercial_is_company_member(v_company_id, v_owner_user_id) then raise exception 'AP_INVALID_OWNER'; end if;
  if exists (select 1 from public.detect_red_comercial_prospect_duplicates(v_company_id, v_company_name, v_domain, p_payload->>'contact_email', p_payload->>'contact_phone', null) where same_company) then raise exception 'AP_DUPLICATE_PROSPECT'; end if;
  insert into public.represented_company_prospects (represented_company_id, company_name, normalized_company_name, website_url, domain, rut, contact_name, contact_role, contact_email, contact_phone, channel, status, first_contact_at, last_contact_at, next_followup_at, owner_user_id, created_by, internal_notes, is_archived)
  values (v_company_id, v_company_name, v_norm, nullif(p_payload->>'website_url',''), v_domain, nullif(p_payload->>'rut',''), nullif(p_payload->>'contact_name',''), nullif(p_payload->>'contact_role',''), nullif(lower(p_payload->>'contact_email'),''), nullif(p_payload->>'contact_phone',''), nullif(p_payload->>'channel',''), coalesce(nullif(p_payload->>'status',''),'to_contact'), nullif(p_payload->>'first_contact_at','')::timestamptz, nullif(p_payload->>'last_contact_at','')::timestamptz, nullif(p_payload->>'next_followup_at','')::timestamptz, v_owner_user_id, v_user_id, nullif(p_payload->>'internal_notes',''), false) returning id into v_prospect_id;
  if v_account.id is null then
    insert into public.represented_company_accounts (represented_company_id, account_name, normalized_account_name, status, source, linked_prospect_id, created_by, updated_by) values (v_company_id, v_company_name, v_norm, 'arista_prospect', 'arista', v_prospect_id, v_user_id, v_user_id) on conflict (represented_company_id, normalized_account_name) do update set linked_prospect_id = excluded.linked_prospect_id, status = 'arista_prospect';
  else
    update public.represented_company_accounts set linked_prospect_id = v_prospect_id, status = case when status = 'available' then 'arista_prospect' else status end, updated_by = v_user_id where id = v_account.id;
  end if;
  if public.is_red_comercial_admin() and jsonb_typeof(p_payload->'collaborator_ids') = 'array' then for v_collaborator_id in select value::text::uuid from jsonb_array_elements_text(p_payload->'collaborator_ids') loop if public.red_comercial_is_company_member(v_company_id, v_collaborator_id) then insert into public.represented_company_prospect_collaborators (prospect_id,user_id,status,created_by) values (v_prospect_id,v_collaborator_id,'active',v_user_id) on conflict (prospect_id,user_id) do update set status='active'; end if; end loop; end if;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (v_prospect_id, 'note', 'Prospecto creado', null, v_user_id);
  return public.get_red_comercial_prospect_detail(v_prospect_id);
end;
$$;

create or replace function public.delete_red_comercial_account(p_account_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_account public.represented_company_accounts%rowtype;
begin
  if v_user is null or not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;

  select * into v_account
  from public.represented_company_accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'REDCOM_ACCOUNT_NOT_FOUND';
  end if;

  if v_account.linked_prospect_id is not null
     or exists (
       select 1
       from public.represented_company_prospects p
       where p.represented_company_id = v_account.represented_company_id
         and p.normalized_company_name = v_account.normalized_account_name
     ) then
    raise exception 'REDCOM_ACCOUNT_HAS_HISTORY';
  end if;

  delete from public.represented_company_accounts where id = v_account.id;
  return jsonb_build_object('id', v_account.id, 'deleted', true);
end;
$$;

create or replace function public.red_comercial_assert_prospect_contactable(p_prospect_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_status text;
begin
  select represented_company_id, company_name
    into v_company_id, v_company_name
  from public.represented_company_prospects
  where id = p_prospect_id;

  if v_company_id is null then
    raise exception 'AP_PROSPECT_NOT_FOUND';
  end if;

  select status into v_status
  from public.represented_company_accounts
  where represented_company_id = v_company_id
    and normalized_account_name = public.red_comercial_normalize_company_name(v_company_name);

  if v_status = 'represented_client' then
    raise exception 'REDCOM_ACCOUNT_CLIENT_BLOCKED';
  elsif v_status = 'represented_active_opportunity' then
    raise exception 'REDCOM_ACCOUNT_ACTIVE_OPPORTUNITY_BLOCKED';
  elsif v_status = 'blocked' then
    raise exception 'REDCOM_ACCOUNT_BLOCKED';
  end if;
end;
$$;

create or replace function public.red_comercial_guard_prospect_assignment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_table_name = 'represented_company_prospects' then
    if tg_op = 'UPDATE' and (
      new.owner_user_id is distinct from old.owner_user_id
      or new.next_followup_at is distinct from old.next_followup_at
      or new.last_contact_at is distinct from old.last_contact_at
      or (new.status is distinct from old.status and new.status not in ('agreed', 'not_interested', 'archived'))
    ) then
      perform public.red_comercial_assert_prospect_contactable(new.id);
    end if;
  elsif new.status = 'active' then
    perform public.red_comercial_assert_prospect_contactable(new.prospect_id);
  end if;
  return new;
end;
$$;

drop trigger if exists represented_company_prospects_guard_account_assignment on public.represented_company_prospects;
create trigger represented_company_prospects_guard_account_assignment
before update of owner_user_id, next_followup_at, last_contact_at, status on public.represented_company_prospects
for each row execute function public.red_comercial_guard_prospect_assignment();

drop trigger if exists represented_company_prospect_collaborators_guard_account_assignment on public.represented_company_prospect_collaborators;
create trigger represented_company_prospect_collaborators_guard_account_assignment
before insert or update of user_id, status on public.represented_company_prospect_collaborators
for each row execute function public.red_comercial_guard_prospect_assignment();

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
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not public.red_comercial_can_view_prospect_detail(p_prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;
  perform public.red_comercial_assert_prospect_contactable(p_prospect_id);
  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, activity_at, created_by)
  values (p_prospect_id, p_activity_type, btrim(p_title), nullif(p_description, ''), coalesce(p_activity_at, now()), v_user_id);
  update public.represented_company_prospects
  set last_contact_at = case when p_activity_type in ('call', 'email', 'whatsapp', 'linkedin', 'meeting') then coalesce(p_activity_at, now()) else last_contact_at end,
      next_followup_at = coalesce(p_next_followup_at, next_followup_at),
      status = coalesce(nullif(p_status, ''), status)
  where id = p_prospect_id;
  return public.get_red_comercial_prospect_detail(p_prospect_id);
end;
$$;

create or replace function public.create_red_comercial_opportunity(p_prospect_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid()); v_company_id uuid; v_id uuid; v_attributed uuid;
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  perform public.red_comercial_assert_prospect_contactable(p_prospect_id);
  select represented_company_id into v_company_id from public.represented_company_prospects where id = p_prospect_id;
  v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid;
  if not public.is_red_comercial_admin() then v_attributed := v_user_id; end if;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_company_id, v_attributed) then raise exception 'AP_INVALID_OWNER'; end if;
  insert into public.represented_company_opportunities (prospect_id, represented_company_id, control_mode, attributed_collaborator_id, collaborator_compensation_type, collaborator_compensation_rate, collaborator_compensation_amount, sale_net_amount, currency, created_by)
  values (p_prospect_id, v_company_id, case when public.is_red_comercial_admin() then coalesce(nullif(p_payload->>'control_mode',''),'collaborator') else 'collaborator' end, v_attributed, nullif(p_payload->>'collaborator_compensation_type',''), nullif(p_payload->>'collaborator_compensation_rate','')::numeric, nullif(p_payload->>'collaborator_compensation_amount','')::numeric, case when public.is_red_comercial_admin() then nullif(p_payload->>'sale_net_amount','')::numeric else null end, coalesce(nullif(p_payload->>'currency',''),'CLP'), v_user_id) returning id into v_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, created_by) values (p_prospect_id, 'status_change', 'Oportunidad creada', v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end;
$$;

create or replace function public.create_red_comercial_cross_opportunity(p_prospect_id uuid, p_target_company_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid()); v_source_company uuid;
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) or btrim(coalesce(p_reason,'')) = '' then raise exception 'AP_INVALID_INPUT'; end if;
  perform public.red_comercial_assert_prospect_contactable(p_prospect_id);
  select represented_company_id into v_source_company from public.represented_company_prospects where id = p_prospect_id;
  if v_source_company = p_target_company_id or not exists (select 1 from public.represented_companies where id = p_target_company_id and status = 'active') then raise exception 'AP_INVALID_TARGET_COMPANY'; end if;
  insert into public.represented_company_cross_opportunities (source_prospect_id, target_represented_company_id, detected_by, reason) values (p_prospect_id, p_target_company_id, v_user_id, btrim(p_reason));
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (p_prospect_id, 'note', 'Oportunidad cruzada registrada', btrim(p_reason), v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end;
$$;

revoke all on function public.red_comercial_assert_prospect_contactable(uuid) from public;
revoke all on function public.create_red_comercial_prospect_activity(uuid, text, text, text, timestamptz, timestamptz, text) from public;
grant execute on function public.create_red_comercial_prospect_activity(uuid, text, text, text, timestamptz, timestamptz, text) to authenticated;

revoke all on function public.list_red_comercial_company_accounts(uuid) from public;
revoke all on function public.check_red_comercial_account_contactability(uuid,text) from public;
revoke all on function public.create_red_comercial_company_account(uuid,jsonb) from public;
revoke all on function public.update_red_comercial_company_account(uuid,jsonb) from public;
revoke all on function public.delete_red_comercial_account(uuid) from public;
revoke all on function public.import_red_comercial_company_accounts(uuid,text,jsonb) from public;
grant execute on function public.list_red_comercial_company_accounts(uuid) to authenticated;
grant execute on function public.check_red_comercial_account_contactability(uuid,text) to authenticated;
grant execute on function public.create_red_comercial_company_account(uuid,jsonb) to authenticated;
grant execute on function public.update_red_comercial_company_account(uuid,jsonb) to authenticated;
grant execute on function public.delete_red_comercial_account(uuid) to authenticated;
grant execute on function public.import_red_comercial_company_accounts(uuid,text,jsonb) to authenticated;
