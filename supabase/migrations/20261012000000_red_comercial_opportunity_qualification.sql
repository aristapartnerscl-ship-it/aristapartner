alter table public.represented_company_opportunities
  add column if not exists represented_company_service_id uuid,
  add column if not exists pain_point text,
  add column if not exists identified_need text,
  add column if not exists qualification_notes text,
  add column if not exists client_expectation text,
  add column if not exists missing_information text,
  add column if not exists requires_specialist boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'represented_company_opportunities_service_fk'
      and conrelid = 'public.represented_company_opportunities'::regclass
  ) then
    alter table public.represented_company_opportunities
      add constraint represented_company_opportunities_service_fk
      foreign key (represented_company_service_id)
      references public.represented_company_services(id)
      on delete set null;
  end if;
end;
$$;

create index if not exists red_opportunities_service_idx
  on public.represented_company_opportunities (represented_company_service_id, updated_at desc);

create or replace function public.red_comercial_validate_opportunity_service()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.represented_company_service_id is not null and not exists (
    select 1
    from public.represented_company_services s
    where s.id = new.represented_company_service_id
      and s.represented_company_id = new.represented_company_id
  ) then
    raise exception 'REDCOM_OPPORTUNITY_SERVICE_COMPANY_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists represented_company_opportunities_validate_service
  on public.represented_company_opportunities;
create trigger represented_company_opportunities_validate_service
before insert or update of represented_company_id, represented_company_service_id
on public.represented_company_opportunities
for each row execute function public.red_comercial_validate_opportunity_service();

create or replace function public.get_red_comercial_prospect_panel(p_prospect_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_detail jsonb;
  v_opportunities jsonb;
  v_cross jsonb;
  v_notes jsonb;
  v_files jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  v_detail := public.get_red_comercial_prospect_detail(p_prospect_id);
  if v_detail is null then return null; end if;
  if coalesce((v_detail->>'can_view_detail')::boolean, false) = false then
    return jsonb_build_object('prospect', v_detail, 'opportunities', '[]'::jsonb, 'cross_opportunities', '[]'::jsonb, 'notes', '[]'::jsonb, 'files', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'prospect_id', o.prospect_id,
    'represented_company_id', o.represented_company_id,
    'represented_company_service_id', o.represented_company_service_id,
    'service_name', s.name,
    'service_category', s.category,
    'service_is_active', s.is_active,
    'service_short_description', s.short_description,
    'service_problem_statement', s.problem_statement,
    'service_ideal_customer', s.ideal_customer,
    'service_decision_makers', s.decision_makers,
    'service_opportunity_signals', s.opportunity_signals,
    'service_discovery_questions', s.discovery_questions,
    'service_required_information', s.required_information,
    'service_suggested_pitch', s.suggested_pitch,
    'service_handoff_guidance', s.handoff_guidance,
    'service_restrictions', s.restrictions,
    'service_reference_price', case when v_is_admin then s.reference_price else null end,
    'service_price_notes', case when v_is_admin then s.price_notes else null end,
    'pain_point', o.pain_point,
    'identified_need', o.identified_need,
    'qualification_notes', o.qualification_notes,
    'client_expectation', o.client_expectation,
    'missing_information', o.missing_information,
    'requires_specialist', o.requires_specialist,
    'status', o.status,
    'control_mode', o.control_mode,
    'contract_status', o.contract_status,
    'payment_status', o.payment_status,
    'commission_status', o.commission_status,
    'result_status', o.result_status,
    'attributed_collaborator_id', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.attributed_collaborator_id else null end,
    'attributed_collaborator_name', case when v_is_admin or o.attributed_collaborator_id = v_user_id then attributed.full_name else null end,
    'collaborator_compensation_type', case when o.attributed_collaborator_id is not null and (v_is_admin or o.attributed_collaborator_id = v_user_id) then o.collaborator_compensation_type else null end,
    'collaborator_compensation_rate', case when o.attributed_collaborator_id is not null and (v_is_admin or o.attributed_collaborator_id = v_user_id) then o.collaborator_compensation_rate else null end,
    'collaborator_compensation_amount', case when o.attributed_collaborator_id is not null and (v_is_admin or o.attributed_collaborator_id = v_user_id) then o.collaborator_compensation_amount else null end,
    'sale_net_amount', case when v_is_admin then o.sale_net_amount else null end,
    'currency', o.currency,
    'handed_off_at', o.handed_off_at,
    'closed_at', o.closed_at,
    'created_by', o.created_by,
    'created_at', o.created_at,
    'updated_at', o.updated_at
  ) order by o.updated_at desc), '[]'::jsonb)
    into v_opportunities
  from public.represented_company_opportunities o
  left join public.represented_company_services s on s.id = o.represented_company_service_id
  left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
  where o.prospect_id = p_prospect_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'source_prospect_id', c.source_prospect_id,
    'target_represented_company_id', c.target_represented_company_id,
    'target_company_name', rc.name, 'target_company_logo_storage_path', rc.logo_storage_path,
    'detected_by', c.detected_by, 'reason', c.reason, 'status', c.status,
    'assigned_to', c.assigned_to, 'created_at', c.created_at, 'updated_at', c.updated_at
  ) order by c.created_at desc), '[]'::jsonb) into v_cross
  from public.represented_company_cross_opportunities c
  join public.represented_companies rc on rc.id = c.target_represented_company_id
  where c.source_prospect_id = p_prospect_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id, 'prospect_id', n.prospect_id, 'body', n.body,
    'created_by', n.created_by, 'updated_by', n.updated_by,
    'created_at', n.created_at, 'updated_at', n.updated_at
  ) order by n.created_at desc), '[]'::jsonb) into v_notes
  from public.represented_company_prospect_notes n
  where n.prospect_id = p_prospect_id and n.archived_at is null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'prospect_id', f.prospect_id, 'opportunity_id', f.opportunity_id,
    'storage_path', f.storage_path, 'file_name', f.file_name, 'mime_type', f.mime_type,
    'size_bytes', f.size_bytes, 'category', f.category, 'uploaded_by', f.uploaded_by,
    'created_at', f.created_at
  ) order by f.created_at desc), '[]'::jsonb) into v_files
  from public.represented_company_prospect_files f
  where f.prospect_id = p_prospect_id and f.archived_at is null;

  return jsonb_build_object('prospect', v_detail, 'opportunities', v_opportunities, 'cross_opportunities', v_cross, 'notes', v_notes, 'files', v_files);
end;
$$;

create or replace function public.create_red_comercial_opportunity(p_prospect_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid;
  v_id uuid;
  v_is_admin boolean;
  v_attributed uuid;
  v_service_id uuid := nullif(p_payload->>'represented_company_service_id', '')::uuid;
  v_compensation_type text := nullif(p_payload->>'collaborator_compensation_type', '');
  v_compensation_rate numeric := nullif(p_payload->>'collaborator_compensation_rate', '')::numeric;
  v_compensation_amount numeric := nullif(p_payload->>'collaborator_compensation_amount', '')::numeric;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  if not public.red_comercial_can_manage_prospect(p_prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  select represented_company_id into v_company_id from public.represented_company_prospects where id = p_prospect_id;
  if v_company_id is null then raise exception 'AP_NOT_FOUND'; end if;
  if v_service_id is not null and not exists (select 1 from public.represented_company_services s where s.id = v_service_id and s.represented_company_id = v_company_id) then
    raise exception 'REDCOM_OPPORTUNITY_SERVICE_COMPANY_MISMATCH';
  end if;

  v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid;
  if not v_is_admin and (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) then v_attributed := v_user_id; end if;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_company_id, v_attributed) then raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR'; end if;
  if v_is_admin and (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null then raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED'; end if;
  if v_attributed is null or v_compensation_type is null then v_compensation_type := null; v_compensation_rate := null; v_compensation_amount := null; end if;

  insert into public.represented_company_opportunities (
    prospect_id, represented_company_id, represented_company_service_id,
    pain_point, identified_need, qualification_notes, client_expectation, missing_information, requires_specialist,
    control_mode, attributed_collaborator_id, collaborator_compensation_type,
    collaborator_compensation_rate, collaborator_compensation_amount, sale_net_amount, currency, created_by
  ) values (
    p_prospect_id, v_company_id, v_service_id,
    nullif(btrim(p_payload->>'pain_point'), ''), nullif(btrim(p_payload->>'identified_need'), ''),
    nullif(btrim(p_payload->>'qualification_notes'), ''), nullif(btrim(p_payload->>'client_expectation'), ''),
    nullif(btrim(p_payload->>'missing_information'), ''), coalesce((p_payload->>'requires_specialist')::boolean, false),
    case when v_is_admin then coalesce(nullif(p_payload->>'control_mode', ''), 'collaborator') else 'collaborator' end,
    v_attributed, v_compensation_type, v_compensation_rate, v_compensation_amount,
    case when v_is_admin then nullif(p_payload->>'sale_net_amount', '')::numeric else null end,
    coalesce(nullif(p_payload->>'currency', ''), 'CLP'), v_user_id
  ) returning id into v_id;
  return public.get_red_comercial_prospect_panel(p_prospect_id);
end;
$$;

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
  v_service_id uuid;
  v_compensation_type text;
  v_compensation_rate numeric;
  v_compensation_amount numeric;
  v_clearing_attribution boolean := false;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  select * into v_existing from public.represented_company_opportunities where id = p_opportunity_id;
  if not found or not public.red_comercial_can_manage_prospect(v_existing.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;

  if not v_is_admin then
    if v_is_handoff then
      if v_existing.control_mode = 'arista' then raise exception 'AP_ADMIN_REQUIRED'; end if;
      update public.represented_company_opportunities set control_mode = 'arista', handed_off_at = now() where id = p_opportunity_id;
      insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
      values (v_existing.prospect_id, 'status_change', 'Oportunidad entregada a Arista', nullif(p_payload->>'context', ''), v_user_id);
      return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
    end if;
    if exists (select 1 from jsonb_object_keys(p_payload) as keys(key) where keys.key not in ('represented_company_service_id', 'pain_point', 'identified_need', 'qualification_notes', 'client_expectation', 'missing_information', 'requires_specialist', 'context')) then
      raise exception 'AP_ADMIN_REQUIRED';
    end if;
    v_service_id := v_existing.represented_company_service_id;
    if p_payload ? 'represented_company_service_id' then v_service_id := nullif(p_payload->>'represented_company_service_id', '')::uuid; end if;
    if v_service_id is not null and not exists (select 1 from public.represented_company_services s where s.id = v_service_id and s.represented_company_id = v_existing.represented_company_id and s.is_active) then raise exception 'REDCOM_OPPORTUNITY_SERVICE_NOT_AVAILABLE'; end if;
    update public.represented_company_opportunities set
      represented_company_service_id = v_service_id,
      pain_point = case when p_payload ? 'pain_point' then nullif(btrim(p_payload->>'pain_point'), '') else pain_point end,
      identified_need = case when p_payload ? 'identified_need' then nullif(btrim(p_payload->>'identified_need'), '') else identified_need end,
      qualification_notes = case when p_payload ? 'qualification_notes' then nullif(btrim(p_payload->>'qualification_notes'), '') else qualification_notes end,
      client_expectation = case when p_payload ? 'client_expectation' then nullif(btrim(p_payload->>'client_expectation'), '') else client_expectation end,
      missing_information = case when p_payload ? 'missing_information' then nullif(btrim(p_payload->>'missing_information'), '') else missing_information end,
      requires_specialist = case when p_payload ? 'requires_specialist' then (p_payload->>'requires_specialist')::boolean else requires_specialist end
    where id = p_opportunity_id;
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
    values (v_existing.prospect_id, 'status_change', 'Calificacion de oportunidad actualizada', nullif(p_payload->>'context', ''), v_user_id);
    return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
  end if;

  v_service_id := v_existing.represented_company_service_id;
  if p_payload ? 'represented_company_service_id' then v_service_id := nullif(p_payload->>'represented_company_service_id', '')::uuid; end if;
  if v_service_id is not null and not exists (select 1 from public.represented_company_services s where s.id = v_service_id and s.represented_company_id = v_existing.represented_company_id) then raise exception 'REDCOM_OPPORTUNITY_SERVICE_COMPANY_MISMATCH'; end if;
  v_attributed := v_existing.attributed_collaborator_id;
  if p_payload ? 'attributed_collaborator_id' then v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid; v_clearing_attribution := v_attributed is null; end if;
  v_compensation_type := v_existing.collaborator_compensation_type;
  if p_payload ? 'collaborator_compensation_type' then v_compensation_type := nullif(p_payload->>'collaborator_compensation_type', ''); end if;
  v_compensation_rate := v_existing.collaborator_compensation_rate;
  if p_payload ? 'collaborator_compensation_rate' then v_compensation_rate := nullif(p_payload->>'collaborator_compensation_rate', '')::numeric; end if;
  v_compensation_amount := v_existing.collaborator_compensation_amount;
  if p_payload ? 'collaborator_compensation_amount' then v_compensation_amount := nullif(p_payload->>'collaborator_compensation_amount', '')::numeric; end if;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_existing.represented_company_id, v_attributed) then raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR'; end if;
  if (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null and not v_clearing_attribution then raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED'; end if;
  if v_attributed is null or v_compensation_type is null then v_compensation_type := null; v_compensation_rate := null; v_compensation_amount := null; end if;

  update public.represented_company_opportunities set
    represented_company_service_id = v_service_id,
    pain_point = case when p_payload ? 'pain_point' then nullif(btrim(p_payload->>'pain_point'), '') else pain_point end,
    identified_need = case when p_payload ? 'identified_need' then nullif(btrim(p_payload->>'identified_need'), '') else identified_need end,
    qualification_notes = case when p_payload ? 'qualification_notes' then nullif(btrim(p_payload->>'qualification_notes'), '') else qualification_notes end,
    client_expectation = case when p_payload ? 'client_expectation' then nullif(btrim(p_payload->>'client_expectation'), '') else client_expectation end,
    missing_information = case when p_payload ? 'missing_information' then nullif(btrim(p_payload->>'missing_information'), '') else missing_information end,
    requires_specialist = case when p_payload ? 'requires_specialist' then (p_payload->>'requires_specialist')::boolean else requires_specialist end,
    status = coalesce(nullif(p_payload->>'status', ''), status), control_mode = coalesce(nullif(p_payload->>'control_mode', ''), control_mode),
    contract_status = coalesce(nullif(p_payload->>'contract_status', ''), contract_status), payment_status = coalesce(nullif(p_payload->>'payment_status', ''), payment_status),
    commission_status = coalesce(nullif(p_payload->>'commission_status', ''), commission_status), result_status = coalesce(nullif(p_payload->>'result_status', ''), result_status),
    attributed_collaborator_id = v_attributed, collaborator_compensation_type = v_compensation_type,
    collaborator_compensation_rate = v_compensation_rate, collaborator_compensation_amount = v_compensation_amount,
    handed_off_at = case when v_is_handoff then now() else handed_off_at end,
    closed_at = case when coalesce(nullif(p_payload->>'result_status', ''), result_status) in ('won', 'lost', 'cancelled') then coalesce(closed_at, now()) else closed_at end,
    sale_net_amount = coalesce(nullif(p_payload->>'sale_net_amount', '')::numeric, sale_net_amount), currency = coalesce(nullif(p_payload->>'currency', ''), currency)
  where id = p_opportunity_id;

  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  values (v_existing.prospect_id, 'status_change', case when v_is_handoff then 'Oportunidad entregada a Arista' when p_payload ?| array['represented_company_service_id','pain_point','identified_need','qualification_notes','client_expectation','missing_information','requires_specialist'] then 'Calificacion de oportunidad actualizada' else 'Oportunidad actualizada' end, nullif(p_payload->>'context', ''), v_user_id);
  return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
end;
$$;

create or replace function public.get_red_comercial_opportunity_panel(p_opportunity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid()); v_is_admin boolean; v_prospect_id uuid; v_company_id uuid; v_control_mode text; v_attributed uuid; v_panel jsonb; v_opportunity jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  select prospect_id, represented_company_id, control_mode, attributed_collaborator_id into v_prospect_id, v_company_id, v_control_mode, v_attributed from public.represented_company_opportunities where id = p_opportunity_id;
  if v_prospect_id is null then return null; end if;
  if not v_is_admin and not (public.red_comercial_is_company_member(v_company_id, v_user_id) and (v_attributed = v_user_id or (v_control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(v_prospect_id)))) then raise exception 'AP_ACCESS_DENIED'; end if;
  v_panel := public.get_red_comercial_prospect_panel(v_prospect_id);
  if v_panel is null then return null; end if;
  select item into v_opportunity from jsonb_array_elements(coalesce(v_panel->'opportunities', '[]'::jsonb)) item where item->>'id' = p_opportunity_id::text;
  return jsonb_set(v_panel, '{opportunities}', jsonb_build_array(coalesce(v_opportunity, '{}'::jsonb)), true);
end;
$$;

create or replace function public.list_red_comercial_opportunities(
  p_search text default null, p_company_id uuid default null, p_control_mode text default null,
  p_contract_status text default null, p_payment_status text default null, p_responsible_id uuid default null,
  p_result_status text default null, p_view text default 'all', p_limit integer default 25, p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid := (select auth.uid()); v_is_admin boolean; v_rows jsonb; v_total integer;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  with scoped as (
    select o.*, rc.name as represented_company_name, rc.logo_storage_path as represented_company_logo_storage_path,
      p.company_name as prospect_company_name, p.logo_storage_path as prospect_logo_storage_path,
      attributed.full_name as attributed_collaborator_name, s.name as service_name, s.category as service_category,
      (v_is_admin or (o.control_mode = 'collaborator' and o.attributed_collaborator_id = v_user_id and public.red_comercial_can_manage_prospect(o.prospect_id))) as can_edit
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.represented_company_services s on s.id = o.represented_company_service_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where (v_is_admin or (public.red_comercial_is_company_member(o.represented_company_id, v_user_id) and (o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id)))))
      and (p_company_id is null or o.represented_company_id = p_company_id) and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_contract_status is null or o.contract_status = p_contract_status) and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_responsible_id is null or o.attributed_collaborator_id = p_responsible_id) and (p_result_status is null or o.result_status = p_result_status)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
      and (coalesce(p_view, 'all') = 'all' or (p_view = 'in_process' and o.result_status = 'in_process') or (p_view = 'arista' and o.control_mode = 'arista') or (p_view = 'contract_pending' and o.contract_status in ('pending', 'sent', 'under_review', 'not_signed')) or (p_view = 'payment_pending' and o.payment_status in ('pending', 'partial', 'overdue')) or (p_view = 'commission_pending' and o.commission_status in ('to_validate', 'generated', 'pending_payment')) or (p_view = 'won' and o.result_status = 'won') or (p_view = 'lost' and o.result_status = 'lost'))
  ), paged as (
    select scoped.*, count(*) over() as full_count from scoped order by scoped.updated_at desc offset greatest(coalesce(p_offset, 0), 0) limit least(greatest(coalesce(p_limit, 25), 1), 100)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', scoped.id, 'prospect_id', scoped.prospect_id, 'represented_company_id', scoped.represented_company_id,
    'represented_company_service_id', scoped.represented_company_service_id, 'service_name', scoped.service_name, 'service_category', scoped.service_category,
    'represented_company_name', scoped.represented_company_name, 'represented_company_logo_storage_path', scoped.represented_company_logo_storage_path,
    'prospect_company_name', scoped.prospect_company_name, 'prospect_logo_storage_path', scoped.prospect_logo_storage_path,
    'status', scoped.status, 'control_mode', scoped.control_mode, 'contract_status', scoped.contract_status, 'payment_status', scoped.payment_status,
    'commission_status', scoped.commission_status, 'result_status', scoped.result_status,
    'attributed_collaborator_id', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.attributed_collaborator_id else null end,
    'attributed_collaborator_name', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.attributed_collaborator_name else null end,
    'collaborator_compensation_type', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_type else null end,
    'collaborator_compensation_rate', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_rate else null end,
    'collaborator_compensation_amount', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_amount else null end,
    'sale_net_amount', case when v_is_admin then scoped.sale_net_amount else null end, 'currency', scoped.currency,
    'handed_off_at', scoped.handed_off_at, 'closed_at', scoped.closed_at, 'created_by', scoped.created_by, 'created_at', scoped.created_at, 'updated_at', scoped.updated_at, 'can_edit', scoped.can_edit
  ) order by scoped.updated_at desc), '[]'::jsonb), coalesce(max(scoped.full_count), 0) into v_rows, v_total from paged as scoped;
  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

revoke all on function public.red_comercial_validate_opportunity_service() from public;
revoke all on function public.get_red_comercial_prospect_panel(uuid) from public;
revoke all on function public.create_red_comercial_opportunity(uuid, jsonb) from public;
revoke all on function public.update_red_comercial_opportunity(uuid, jsonb) from public;
revoke all on function public.get_red_comercial_opportunity_panel(uuid) from public;
revoke all on function public.list_red_comercial_opportunities(text, uuid, text, text, text, uuid, text, text, integer, integer) from public;
grant execute on function public.get_red_comercial_prospect_panel(uuid) to authenticated;
grant execute on function public.create_red_comercial_opportunity(uuid, jsonb) to authenticated;
grant execute on function public.update_red_comercial_opportunity(uuid, jsonb) to authenticated;
grant execute on function public.get_red_comercial_opportunity_panel(uuid) to authenticated;
grant execute on function public.list_red_comercial_opportunities(text, uuid, text, text, text, uuid, text, text, integer, integer) to authenticated;
