create or replace function public.update_red_comercial_opportunity(p_opportunity_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_prospect_id uuid;
  v_control_mode text;
  v_is_admin boolean := public.is_red_comercial_admin();
  v_is_handoff boolean := coalesce(p_payload->>'action', '') = 'handoff';
begin
  if v_user_id is null then
    raise exception 'AP_AUTH_REQUIRED';
  end if;

  select opportunity.prospect_id, opportunity.control_mode
    into v_prospect_id, v_control_mode
  from public.represented_company_opportunities as opportunity
  where opportunity.id = p_opportunity_id;

  if v_prospect_id is null or not public.red_comercial_can_manage_prospect(v_prospect_id) then
    raise exception 'AP_ACCESS_DENIED';
  end if;

  if not v_is_admin then
    if not v_is_handoff or v_control_mode = 'arista' then
      raise exception 'AP_ADMIN_REQUIRED';
    end if;

    update public.represented_company_opportunities
    set control_mode = 'arista', handed_off_at = now()
    where id = p_opportunity_id;

    insert into public.represented_company_prospect_activities
      (prospect_id, activity_type, title, description, created_by)
    values
      (v_prospect_id, 'status_change', 'Oportunidad entregada a Arista', nullif(p_payload->>'context', ''), v_user_id);

    return public.get_red_comercial_prospect_panel(v_prospect_id);
  end if;

  update public.represented_company_opportunities
  set
    status = coalesce(nullif(p_payload->>'status', ''), status),
    control_mode = coalesce(nullif(p_payload->>'control_mode', ''), control_mode),
    contract_status = coalesce(nullif(p_payload->>'contract_status', ''), contract_status),
    payment_status = coalesce(nullif(p_payload->>'payment_status', ''), payment_status),
    commission_status = coalesce(nullif(p_payload->>'commission_status', ''), commission_status),
    result_status = coalesce(nullif(p_payload->>'result_status', ''), result_status),
    handed_off_at = case when v_is_handoff then now() else handed_off_at end,
    closed_at = case
      when coalesce(nullif(p_payload->>'result_status', ''), result_status) in ('won', 'lost', 'cancelled')
        then coalesce(closed_at, now())
      else closed_at
    end,
    collaborator_compensation_type = coalesce(nullif(p_payload->>'collaborator_compensation_type', ''), collaborator_compensation_type),
    collaborator_compensation_rate = coalesce(nullif(p_payload->>'collaborator_compensation_rate', '')::numeric, collaborator_compensation_rate),
    collaborator_compensation_amount = coalesce(nullif(p_payload->>'collaborator_compensation_amount', '')::numeric, collaborator_compensation_amount),
    sale_net_amount = coalesce(nullif(p_payload->>'sale_net_amount', '')::numeric, sale_net_amount),
    currency = coalesce(nullif(p_payload->>'currency', ''), currency)
  where id = p_opportunity_id;

  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, created_by)
  values
    (v_prospect_id, 'status_change', case when v_is_handoff then 'Oportunidad entregada a Arista' else 'Oportunidad actualizada' end, nullif(p_payload->>'context', ''), v_user_id);

  return public.get_red_comercial_prospect_panel(v_prospect_id);
end;
$$;

revoke all on function public.update_red_comercial_opportunity(uuid, jsonb) from public;
grant execute on function public.update_red_comercial_opportunity(uuid, jsonb) to authenticated;
