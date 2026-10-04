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
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;

  v_is_admin := public.is_red_comercial_admin();
  v_detail := public.get_red_comercial_prospect_detail(p_prospect_id);
  if v_detail is null then
    return null;
  end if;
  if coalesce((v_detail->>'can_view_detail')::boolean, false) = false then
    return jsonb_build_object('prospect', v_detail, 'opportunities', '[]'::jsonb, 'cross_opportunities', '[]'::jsonb, 'notes', '[]'::jsonb, 'files', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', o.id,
    'prospect_id', o.prospect_id,
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
  left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
  where o.prospect_id = p_prospect_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'source_prospect_id', c.source_prospect_id,
    'target_represented_company_id', c.target_represented_company_id,
    'target_company_name', rc.name,
    'target_company_logo_storage_path', rc.logo_storage_path,
    'detected_by', c.detected_by,
    'reason', c.reason,
    'status', c.status,
    'assigned_to', c.assigned_to,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  ) order by c.created_at desc), '[]'::jsonb)
    into v_cross
  from public.represented_company_cross_opportunities c
  join public.represented_companies rc on rc.id = c.target_represented_company_id
  where c.source_prospect_id = p_prospect_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id,
    'prospect_id', n.prospect_id,
    'body', n.body,
    'created_by', n.created_by,
    'updated_by', n.updated_by,
    'created_at', n.created_at,
    'updated_at', n.updated_at
  ) order by n.created_at desc), '[]'::jsonb)
    into v_notes
  from public.represented_company_prospect_notes n
  where n.prospect_id = p_prospect_id and n.archived_at is null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id,
    'prospect_id', f.prospect_id,
    'opportunity_id', f.opportunity_id,
    'storage_path', f.storage_path,
    'file_name', f.file_name,
    'mime_type', f.mime_type,
    'size_bytes', f.size_bytes,
    'category', f.category,
    'uploaded_by', f.uploaded_by,
    'created_at', f.created_at
  ) order by f.created_at desc), '[]'::jsonb)
    into v_files
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
  v_compensation_type text := nullif(p_payload->>'collaborator_compensation_type', '');
  v_compensation_rate numeric := nullif(p_payload->>'collaborator_compensation_rate', '')::numeric;
  v_compensation_amount numeric := nullif(p_payload->>'collaborator_compensation_amount', '')::numeric;
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;
  if not public.red_comercial_can_manage_prospect(p_prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  v_is_admin := public.is_red_comercial_admin();
  select represented_company_id into v_company_id from public.represented_company_prospects where id = p_prospect_id;
  if v_company_id is null then
    raise exception 'AP_NOT_FOUND';
  end if;

  v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid;
  if not v_is_admin and (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) then
    v_attributed := v_user_id;
  end if;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_company_id, v_attributed) then
    raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR';
  end if;
  if v_is_admin and (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null then
    raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED';
  end if;
  if v_attributed is null or v_compensation_type is null then
    v_compensation_type := null;
    v_compensation_rate := null;
    v_compensation_amount := null;
  end if;

  insert into public.represented_company_opportunities (
    prospect_id,
    represented_company_id,
    control_mode,
    attributed_collaborator_id,
    collaborator_compensation_type,
    collaborator_compensation_rate,
    collaborator_compensation_amount,
    sale_net_amount,
    currency,
    created_by
  )
  values (
    p_prospect_id,
    v_company_id,
    case when v_is_admin then coalesce(nullif(p_payload->>'control_mode', ''), 'collaborator') else 'collaborator' end,
    v_attributed,
    v_compensation_type,
    v_compensation_rate,
    v_compensation_amount,
    case when v_is_admin then nullif(p_payload->>'sale_net_amount', '')::numeric else null end,
    coalesce(nullif(p_payload->>'currency', ''), 'CLP'),
    v_user_id
  )
  returning id into v_id;

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
  v_compensation_type text;
  v_compensation_rate numeric;
  v_compensation_amount numeric;
  v_clearing_attribution boolean := false;
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;

  select * into v_existing
  from public.represented_company_opportunities
  where id = p_opportunity_id;

  if not found or not public.red_comercial_can_manage_prospect(v_existing.prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  if not v_is_admin then
    if not v_is_handoff or v_existing.control_mode = 'arista' then
      raise exception 'AP_ADMIN_REQUIRED';
    end if;

    update public.represented_company_opportunities
    set control_mode = 'arista', handed_off_at = now()
    where id = p_opportunity_id;

    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, created_by)
    values
      (v_existing.prospect_id, 'status_change', 'Oportunidad entregada a Arista', nullif(p_payload->>'context', ''), v_user_id);

    return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
  end if;

  v_attributed := v_existing.attributed_collaborator_id;
  if p_payload ? 'attributed_collaborator_id' then
    v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid;
    v_clearing_attribution := v_attributed is null;
  end if;

  v_compensation_type := v_existing.collaborator_compensation_type;
  if p_payload ? 'collaborator_compensation_type' then
    v_compensation_type := nullif(p_payload->>'collaborator_compensation_type', '');
  end if;

  v_compensation_rate := v_existing.collaborator_compensation_rate;
  if p_payload ? 'collaborator_compensation_rate' then
    v_compensation_rate := nullif(p_payload->>'collaborator_compensation_rate', '')::numeric;
  end if;

  v_compensation_amount := v_existing.collaborator_compensation_amount;
  if p_payload ? 'collaborator_compensation_amount' then
    v_compensation_amount := nullif(p_payload->>'collaborator_compensation_amount', '')::numeric;
  end if;

  if v_attributed is not null and not public.red_comercial_is_company_member(v_existing.represented_company_id, v_attributed) then
    raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR';
  end if;
  if (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null and not v_clearing_attribution then
    raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED';
  end if;
  if v_attributed is null or v_compensation_type is null then
    v_compensation_type := null;
    v_compensation_rate := null;
    v_compensation_amount := null;
  end if;

  update public.represented_company_opportunities
  set
    status = coalesce(nullif(p_payload->>'status', ''), status),
    control_mode = coalesce(nullif(p_payload->>'control_mode', ''), control_mode),
    contract_status = coalesce(nullif(p_payload->>'contract_status', ''), contract_status),
    payment_status = coalesce(nullif(p_payload->>'payment_status', ''), payment_status),
    commission_status = coalesce(nullif(p_payload->>'commission_status', ''), commission_status),
    result_status = coalesce(nullif(p_payload->>'result_status', ''), result_status),
    attributed_collaborator_id = v_attributed,
    collaborator_compensation_type = v_compensation_type,
    collaborator_compensation_rate = v_compensation_rate,
    collaborator_compensation_amount = v_compensation_amount,
    handed_off_at = case when v_is_handoff then now() else handed_off_at end,
    closed_at = case
      when coalesce(nullif(p_payload->>'result_status', ''), result_status) in ('won', 'lost', 'cancelled')
        then coalesce(closed_at, now())
      else closed_at
    end,
    sale_net_amount = coalesce(nullif(p_payload->>'sale_net_amount', '')::numeric, sale_net_amount),
    currency = coalesce(nullif(p_payload->>'currency', ''), currency)
  where id = p_opportunity_id;

  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, created_by)
  values
    (v_existing.prospect_id, 'status_change', case when v_is_handoff then 'Oportunidad entregada a Arista' else 'Oportunidad actualizada' end, nullif(p_payload->>'context', ''), v_user_id);

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
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_prospect_id uuid;
  v_company_id uuid;
  v_control_mode text;
  v_attributed uuid;
  v_panel jsonb;
  v_opportunity jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  select prospect_id, represented_company_id, control_mode, attributed_collaborator_id
    into v_prospect_id, v_company_id, v_control_mode, v_attributed
  from public.represented_company_opportunities
  where id = p_opportunity_id;
  if v_prospect_id is null then return null; end if;
  if not v_is_admin and not (
    public.red_comercial_is_company_member(v_company_id, v_user_id)
    and (v_attributed = v_user_id or (v_control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(v_prospect_id)))
  ) then raise exception 'AP_ACCESS_DENIED'; end if;

  v_panel := public.get_red_comercial_prospect_panel(v_prospect_id);
  if v_panel is null then return null; end if;
  select item into v_opportunity
  from jsonb_array_elements(coalesce(v_panel->'opportunities', '[]'::jsonb)) item
  where item->>'id' = p_opportunity_id::text;
  return jsonb_set(v_panel, '{opportunities}', jsonb_build_array(coalesce(v_opportunity, '{}'::jsonb)), true);
end;
$$;

revoke all on function public.get_red_comercial_prospect_panel(uuid) from public;
revoke all on function public.create_red_comercial_opportunity(uuid, jsonb) from public;
revoke all on function public.update_red_comercial_opportunity(uuid, jsonb) from public;
revoke all on function public.get_red_comercial_opportunity_panel(uuid) from public;
grant execute on function public.get_red_comercial_prospect_panel(uuid) to authenticated;
grant execute on function public.create_red_comercial_opportunity(uuid, jsonb) to authenticated;
grant execute on function public.update_red_comercial_opportunity(uuid, jsonb) to authenticated;
grant execute on function public.get_red_comercial_opportunity_panel(uuid) to authenticated;
