create table public.represented_company_opportunities (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  represented_company_id uuid not null references public.represented_companies(id) on delete restrict,
  status text not null default 'in_process',
  control_mode text not null default 'collaborator',
  contract_status text not null default 'not_required',
  payment_status text not null default 'not_applicable',
  commission_status text not null default 'not_generated',
  result_status text not null default 'in_process',
  attributed_collaborator_id uuid references public.admin_profiles(id) on delete set null,
  collaborator_compensation_type text,
  collaborator_compensation_rate numeric(7,4),
  collaborator_compensation_amount numeric(14,2),
  sale_net_amount numeric(14,2),
  currency text not null default 'CLP',
  handed_off_at timestamptz,
  closed_at timestamptz,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint red_opportunity_status_check check (status in ('in_process', 'won', 'lost', 'cancelled')),
  constraint red_opportunity_control_check check (control_mode in ('collaborator', 'arista', 'shared')),
  constraint red_opportunity_contract_check check (contract_status in ('not_required', 'pending', 'sent', 'under_review', 'signed', 'not_signed', 'withdrawn', 'cancelled')),
  constraint red_opportunity_payment_check check (payment_status in ('not_applicable', 'pending', 'partial', 'paid', 'overdue', 'refunded', 'cancelled')),
  constraint red_opportunity_commission_check check (commission_status in ('not_generated', 'to_validate', 'generated', 'pending_payment', 'paid', 'void')),
  constraint red_opportunity_result_check check (result_status in ('in_process', 'won', 'lost', 'cancelled')),
  constraint red_opportunity_compensation_type_check check (collaborator_compensation_type is null or collaborator_compensation_type in ('percentage', 'fixed_amount')),
  constraint red_opportunity_compensation_rate_check check (collaborator_compensation_rate is null or collaborator_compensation_rate >= 0),
  constraint red_opportunity_compensation_amount_check check (collaborator_compensation_amount is null or collaborator_compensation_amount >= 0)
);

create table public.represented_company_cross_opportunities (
  id uuid primary key default gen_random_uuid(),
  source_prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  target_represented_company_id uuid not null references public.represented_companies(id) on delete restrict,
  detected_by uuid not null references public.admin_profiles(id) on delete restrict,
  reason text not null,
  status text not null default 'detected',
  assigned_to uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint red_cross_status_check check (status in ('detected', 'under_review', 'assigned', 'converted', 'discarded')),
  constraint red_cross_reason_check check (length(btrim(reason)) > 0)
);

create table public.represented_company_prospect_notes (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  body text not null,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_archived boolean not null default false,
  constraint red_note_body_check check (length(btrim(body)) > 0)
);

insert into public.represented_company_prospect_notes (prospect_id, body, created_by)
select id, btrim(internal_notes), created_by
from public.represented_company_prospects
where nullif(btrim(internal_notes), '') is not null;

create table public.represented_company_prospect_files (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.represented_company_prospects(id) on delete cascade,
  opportunity_id uuid references public.represented_company_opportunities(id) on delete set null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  category text not null default 'general',
  uploaded_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false,
  constraint red_file_category_check check (category in ('general', 'proposal', 'contract', 'commercial', 'other')),
  constraint red_file_size_check check (size_bytes > 0 and size_bytes <= 10485760)
);

create index red_opportunities_prospect_idx on public.represented_company_opportunities (prospect_id, updated_at desc);
create index red_cross_source_idx on public.represented_company_cross_opportunities (source_prospect_id, updated_at desc);
create index red_notes_prospect_idx on public.represented_company_prospect_notes (prospect_id, created_at desc);
create index red_files_prospect_idx on public.represented_company_prospect_files (prospect_id, created_at desc);

create trigger red_opportunities_updated_at before update on public.represented_company_opportunities for each row execute function public.set_updated_at();
create trigger red_cross_updated_at before update on public.represented_company_cross_opportunities for each row execute function public.set_updated_at();
create trigger red_notes_updated_at before update on public.represented_company_prospect_notes for each row execute function public.set_updated_at();

alter table public.represented_company_opportunities enable row level security;
alter table public.represented_company_cross_opportunities enable row level security;
alter table public.represented_company_prospect_notes enable row level security;
alter table public.represented_company_prospect_files enable row level security;
revoke all on public.represented_company_opportunities, public.represented_company_cross_opportunities, public.represented_company_prospect_notes, public.represented_company_prospect_files from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prospect-files', 'prospect-files', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.red_comercial_can_manage_prospect(p_prospect_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.red_comercial_can_view_prospect_detail(p_prospect_id);
$$;

create or replace function public.get_red_comercial_prospect_panel(p_prospect_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_detail jsonb;
  v_can_view boolean;
  v_is_admin boolean;
  v_opportunities jsonb;
  v_cross jsonb;
  v_notes jsonb;
  v_files jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_detail := public.get_red_comercial_prospect_detail(p_prospect_id);
  if v_detail is null then return null; end if;
  v_can_view := coalesce((v_detail->>'can_view_detail')::boolean, false);
  v_is_admin := public.is_red_comercial_admin();
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id, 'prospect_id', o.prospect_id, 'status', o.status, 'control_mode', o.control_mode,
    'contract_status', o.contract_status, 'payment_status', o.payment_status, 'commission_status', o.commission_status,
    'result_status', o.result_status, 'attributed_collaborator_id', o.attributed_collaborator_id,
    'collaborator_compensation_type', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_type else null end,
    'collaborator_compensation_rate', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_rate else null end,
    'collaborator_compensation_amount', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_amount else null end,
    'sale_net_amount', case when v_is_admin then o.sale_net_amount else null end,
    'currency', o.currency, 'handed_off_at', o.handed_off_at, 'closed_at', o.closed_at,
    'created_by', o.created_by, 'created_at', o.created_at, 'updated_at', o.updated_at
  ) order by o.updated_at desc), '[]'::jsonb) into v_opportunities
  from public.represented_company_opportunities o
  where o.prospect_id = p_prospect_id and v_can_view;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', x.id, 'source_prospect_id', x.source_prospect_id, 'target_represented_company_id', x.target_represented_company_id,
    'target_company_name', rc.name, 'target_company_logo_storage_path', rc.logo_storage_path,
    'detected_by', x.detected_by, 'reason', x.reason, 'status', x.status, 'assigned_to', x.assigned_to,
    'created_at', x.created_at, 'updated_at', x.updated_at
  ) order by x.updated_at desc), '[]'::jsonb) into v_cross
  from public.represented_company_cross_opportunities x
  join public.represented_companies rc on rc.id = x.target_represented_company_id
  where x.source_prospect_id = p_prospect_id and v_can_view and (v_is_admin or x.detected_by = v_user_id or x.assigned_to = v_user_id);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'prospect_id', n.prospect_id, 'body', n.body, 'created_by', n.created_by,
    'updated_by', n.updated_by, 'created_at', n.created_at, 'updated_at', n.updated_at
  ) order by n.updated_at desc), '[]'::jsonb) into v_notes
  from public.represented_company_prospect_notes n
  where n.prospect_id = p_prospect_id and not n.is_archived and v_can_view;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'prospect_id', f.prospect_id, 'opportunity_id', f.opportunity_id, 'storage_path', f.storage_path,
    'file_name', f.file_name, 'mime_type', f.mime_type, 'size_bytes', f.size_bytes, 'category', f.category,
    'uploaded_by', f.uploaded_by, 'created_at', f.created_at
  ) order by f.created_at desc), '[]'::jsonb) into v_files
  from public.represented_company_prospect_files f
  where f.prospect_id = p_prospect_id and not f.is_archived and v_can_view;

  return jsonb_build_object('prospect', v_detail, 'opportunities', v_opportunities, 'cross_opportunities', v_cross, 'notes', v_notes, 'files', v_files);
end;
$$;

create or replace function public.create_red_comercial_opportunity(p_prospect_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_company_id uuid; v_id uuid; v_attributed uuid;
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  select represented_company_id into v_company_id from public.represented_company_prospects where id = p_prospect_id;
  v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid;
  if not public.is_red_comercial_admin() then v_attributed := v_user_id; end if;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_company_id, v_attributed) then raise exception 'AP_INVALID_OWNER'; end if;
  insert into public.represented_company_opportunities (prospect_id, represented_company_id, control_mode, attributed_collaborator_id, collaborator_compensation_type, collaborator_compensation_rate, collaborator_compensation_amount, sale_net_amount, currency, created_by)
  values (p_prospect_id, v_company_id, case when public.is_red_comercial_admin() then coalesce(nullif(p_payload->>'control_mode',''),'collaborator') else 'collaborator' end, v_attributed, nullif(p_payload->>'collaborator_compensation_type',''), nullif(p_payload->>'collaborator_compensation_rate','')::numeric, nullif(p_payload->>'collaborator_compensation_amount','')::numeric, case when public.is_red_comercial_admin() then nullif(p_payload->>'sale_net_amount','')::numeric else null end, coalesce(nullif(p_payload->>'currency',''),'CLP'), v_user_id) returning id into v_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, created_by) values (p_prospect_id, 'status_change', 'Oportunidad creada', v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end; $$;

create or replace function public.update_red_comercial_opportunity(p_opportunity_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_prospect_id uuid; v_is_admin boolean := public.is_red_comercial_admin();
begin
  select prospect_id into v_prospect_id from public.represented_company_opportunities where id = p_opportunity_id;
  if v_prospect_id is null or not public.red_comercial_can_manage_prospect(v_prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  if not v_is_admin and coalesce(p_payload->>'action','') <> 'handoff' then raise exception 'AP_ADMIN_REQUIRED'; end if;
  update public.represented_company_opportunities set
    status = case when v_is_admin then coalesce(nullif(p_payload->>'status',''), status) else status end,
    control_mode = case when v_is_admin then coalesce(nullif(p_payload->>'control_mode',''), control_mode) when p_payload->>'action' = 'handoff' then 'arista' else control_mode end,
    contract_status = case when v_is_admin then coalesce(nullif(p_payload->>'contract_status',''), contract_status) else contract_status end,
    payment_status = case when v_is_admin then coalesce(nullif(p_payload->>'payment_status',''), payment_status) else payment_status end,
    commission_status = case when v_is_admin then coalesce(nullif(p_payload->>'commission_status',''), commission_status) else commission_status end,
    result_status = case when v_is_admin then coalesce(nullif(p_payload->>'result_status',''), result_status) else result_status end,
    handed_off_at = case when p_payload->>'action' = 'handoff' then now() else handed_off_at end,
    closed_at = case when coalesce(nullif(p_payload->>'result_status',''), result_status) in ('won','lost','cancelled') then coalesce(closed_at, now()) else closed_at end,
    collaborator_compensation_type = case when v_is_admin then coalesce(nullif(p_payload->>'collaborator_compensation_type',''), collaborator_compensation_type) else collaborator_compensation_type end,
    collaborator_compensation_rate = case when v_is_admin then coalesce(nullif(p_payload->>'collaborator_compensation_rate','')::numeric, collaborator_compensation_rate) else collaborator_compensation_rate end,
    collaborator_compensation_amount = case when v_is_admin then coalesce(nullif(p_payload->>'collaborator_compensation_amount','')::numeric, collaborator_compensation_amount) else collaborator_compensation_amount end,
    sale_net_amount = case when v_is_admin then coalesce(nullif(p_payload->>'sale_net_amount','')::numeric, sale_net_amount) else sale_net_amount end
  where id = p_opportunity_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (v_prospect_id, 'status_change', case when p_payload->>'action' = 'handoff' then 'Oportunidad entregada a Arista' else 'Oportunidad actualizada' end, nullif(p_payload->>'context',''), v_user_id);
  return public.get_red_comercial_prospect_panel(v_prospect_id);
end; $$;

create or replace function public.create_red_comercial_cross_opportunity(p_prospect_id uuid, p_target_company_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_source_company uuid;
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) or btrim(coalesce(p_reason,'')) = '' then raise exception 'AP_INVALID_INPUT'; end if;
  select represented_company_id into v_source_company from public.represented_company_prospects where id = p_prospect_id;
  if v_source_company = p_target_company_id or not exists (select 1 from public.represented_companies where id = p_target_company_id and status = 'active') then raise exception 'AP_INVALID_TARGET_COMPANY'; end if;
  insert into public.represented_company_cross_opportunities (source_prospect_id, target_represented_company_id, detected_by, reason) values (p_prospect_id, p_target_company_id, v_user_id, btrim(p_reason));
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (p_prospect_id, 'note', 'Oportunidad cruzada registrada', btrim(p_reason), v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end; $$;

create or replace function public.create_red_comercial_prospect_note(p_prospect_id uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) or btrim(coalesce(p_body,'')) = '' then raise exception 'AP_INVALID_INPUT'; end if;
  insert into public.represented_company_prospect_notes (prospect_id, body, created_by) values (p_prospect_id, btrim(p_body), v_user_id);
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, created_by) values (p_prospect_id, 'note', 'Nota agregada', v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end; $$;

create or replace function public.update_red_comercial_prospect_note(p_note_id uuid, p_body text, p_archived boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_prospect_id uuid; v_created_by uuid;
begin
  select prospect_id, created_by into v_prospect_id, v_created_by from public.represented_company_prospect_notes where id = p_note_id;
  if v_user_id is null or v_prospect_id is null or not public.red_comercial_can_manage_prospect(v_prospect_id) or (v_created_by <> v_user_id and not public.is_red_comercial_admin()) then raise exception 'AP_ACCESS_DENIED'; end if;
  update public.represented_company_prospect_notes set body = case when p_archived then body else btrim(p_body) end, updated_by = v_user_id, is_archived = p_archived where id = p_note_id;
  return public.get_red_comercial_prospect_panel(v_prospect_id);
end; $$;

create or replace function public.create_red_comercial_prospect_file(p_prospect_id uuid, p_storage_path text, p_file_name text, p_mime_type text, p_size_bytes bigint, p_category text default 'general')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not public.red_comercial_can_manage_prospect(p_prospect_id) or p_storage_path not like 'prospects/' || p_prospect_id::text || '/%' then raise exception 'AP_ACCESS_DENIED'; end if;
  insert into public.represented_company_prospect_files (prospect_id, storage_path, file_name, mime_type, size_bytes, category, uploaded_by) values (p_prospect_id, p_storage_path, btrim(p_file_name), p_mime_type, p_size_bytes, coalesce(nullif(p_category,''),'general'), v_user_id);
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, created_by) values (p_prospect_id, 'note', 'Archivo agregado', v_user_id);
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end; $$;

create or replace function public.archive_red_comercial_prospect_file(p_file_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_prospect_id uuid;
begin
  select prospect_id into v_prospect_id from public.represented_company_prospect_files where id = p_file_id;
  if v_user_id is null or v_prospect_id is null or not public.red_comercial_can_manage_prospect(v_prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  update public.represented_company_prospect_files set is_archived = true where id = p_file_id;
  return public.get_red_comercial_prospect_panel(v_prospect_id);
end; $$;

create or replace function public.red_comercial_storage_prospect_access(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when split_part(p_name, '/', 1) <> 'prospects' then false
    when split_part(p_name, '/', 2) !~ '^[0-9a-fA-F-]{36}$' then false
    else public.red_comercial_can_manage_prospect((split_part(p_name, '/', 2))::uuid)
  end;
$$;

create policy "red commercial prospect files readable by permitted users" on storage.objects for select to authenticated using (bucket_id = 'prospect-files' and public.red_comercial_storage_prospect_access(name));
create policy "red commercial permitted users can upload prospect files" on storage.objects for insert to authenticated with check (bucket_id = 'prospect-files' and public.red_comercial_storage_prospect_access(name));
create policy "red commercial permitted users can update prospect files" on storage.objects for update to authenticated using (bucket_id = 'prospect-files' and public.red_comercial_storage_prospect_access(name)) with check (bucket_id = 'prospect-files' and public.red_comercial_storage_prospect_access(name));

revoke all on function public.red_comercial_can_manage_prospect(uuid), public.get_red_comercial_prospect_panel(uuid), public.create_red_comercial_opportunity(uuid, jsonb), public.update_red_comercial_opportunity(uuid, jsonb), public.create_red_comercial_cross_opportunity(uuid, uuid, text), public.create_red_comercial_prospect_note(uuid, text), public.update_red_comercial_prospect_note(uuid, text, boolean), public.create_red_comercial_prospect_file(uuid, text, text, text, bigint, text), public.archive_red_comercial_prospect_file(uuid), public.red_comercial_storage_prospect_access(text) from public;
grant execute on function public.get_red_comercial_prospect_panel(uuid), public.create_red_comercial_opportunity(uuid, jsonb), public.update_red_comercial_opportunity(uuid, jsonb), public.create_red_comercial_cross_opportunity(uuid, uuid, text), public.create_red_comercial_prospect_note(uuid, text), public.update_red_comercial_prospect_note(uuid, text, boolean), public.create_red_comercial_prospect_file(uuid, text, text, text, bigint, text), public.archive_red_comercial_prospect_file(uuid) to authenticated;
