alter table public.represented_company_opportunities
  add column if not exists arista_commission_type text,
  add column if not exists arista_commission_rate numeric(14,4),
  add column if not exists arista_commission_fixed_amount numeric(14,2),
  add column if not exists arista_commission_net_amount numeric(14,2),
  add column if not exists commission_tax_mode text,
  add column if not exists commission_tax_rate numeric(8,4),
  add column if not exists commission_tax_amount numeric(14,2),
  add column if not exists commission_total_amount numeric(14,2),
  add column if not exists arista_commission_status text,
  add column if not exists collaborator_compensation_base text,
  add column if not exists collaborator_commission_amount numeric(14,2),
  add column if not exists economic_source text,
  add column if not exists economic_override_note text,
  add column if not exists economic_updated_by uuid,
  add column if not exists economic_updated_at timestamptz,
  add column if not exists collaborator_commission_paid_at timestamptz;

alter table public.represented_company_opportunities
  add constraint red_opportunity_arista_commission_type_check check (arista_commission_type is null or arista_commission_type in ('percentage', 'fixed_amount')),
  add constraint red_opportunity_commission_tax_mode_check check (commission_tax_mode is null or commission_tax_mode in ('taxable', 'exempt', 'not_applicable')),
  add constraint red_opportunity_arista_commission_status_check check (arista_commission_status is null or arista_commission_status in ('pending', 'invoiced', 'paid', 'cancelled')),
  add constraint red_opportunity_collaborator_compensation_base_check check (collaborator_compensation_base is null or collaborator_compensation_base in ('arista_commission', 'sale_net_amount')),
  add constraint red_opportunity_economic_source_check check (economic_source is null or economic_source in ('agreement', 'manual')),
  add constraint red_opportunity_economic_amounts_check check (
    coalesce(arista_commission_rate, 0) >= 0 and
    coalesce(arista_commission_fixed_amount, 0) >= 0 and
    coalesce(arista_commission_net_amount, 0) >= 0 and
    coalesce(commission_tax_amount, 0) >= 0 and
    coalesce(commission_total_amount, 0) >= 0 and
    coalesce(collaborator_commission_amount, 0) >= 0
  ),
  add constraint red_opportunity_economic_rates_check check (
    (arista_commission_rate is null or arista_commission_rate between 0 and 100) and
    (commission_tax_rate is null or commission_tax_rate between 0 and 100)
  );

create or replace function public.get_red_comercial_opportunity_economics(p_opportunity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_opportunity public.represented_company_opportunities%rowtype;
  v_is_admin boolean;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  select * into v_opportunity from public.represented_company_opportunities where id = p_opportunity_id;
  if not found then raise exception 'AP_NOT_FOUND'; end if;
  if not public.red_comercial_can_manage_prospect(v_opportunity.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  if not v_is_admin and v_opportunity.attributed_collaborator_id is distinct from v_user_id then
    return jsonb_build_object(
      'opportunity_id', v_opportunity.id,
      'currency', v_opportunity.currency,
      'collaborator_compensation_type', v_opportunity.collaborator_compensation_type,
      'collaborator_compensation_rate', v_opportunity.collaborator_compensation_rate,
      'collaborator_compensation_base', v_opportunity.collaborator_compensation_base,
      'collaborator_commission_amount', v_opportunity.collaborator_commission_amount,
      'commission_status', v_opportunity.commission_status,
      'collaborator_commission_paid_at', v_opportunity.collaborator_commission_paid_at
    );
  end if;
  return jsonb_build_object(
    'opportunity_id', v_opportunity.id,
    'sale_net_amount', v_opportunity.sale_net_amount,
    'currency', v_opportunity.currency,
    'arista_commission_type', v_opportunity.arista_commission_type,
    'arista_commission_rate', v_opportunity.arista_commission_rate,
    'arista_commission_fixed_amount', v_opportunity.arista_commission_fixed_amount,
    'arista_commission_net_amount', v_opportunity.arista_commission_net_amount,
    'commission_tax_mode', v_opportunity.commission_tax_mode,
    'commission_tax_rate', v_opportunity.commission_tax_rate,
    'commission_tax_amount', v_opportunity.commission_tax_amount,
    'commission_total_amount', v_opportunity.commission_total_amount,
    'arista_commission_status', v_opportunity.arista_commission_status,
    'collaborator_compensation_type', v_opportunity.collaborator_compensation_type,
    'collaborator_compensation_rate', v_opportunity.collaborator_compensation_rate,
    'collaborator_compensation_base', v_opportunity.collaborator_compensation_base,
    'collaborator_commission_amount', v_opportunity.collaborator_commission_amount,
    'economic_source', v_opportunity.economic_source,
    'economic_override_note', v_opportunity.economic_override_note,
    'economic_updated_by', v_opportunity.economic_updated_by,
    'economic_updated_at', v_opportunity.economic_updated_at,
    'commission_status', v_opportunity.commission_status,
    'collaborator_commission_paid_at', v_opportunity.collaborator_commission_paid_at
  );
end;
$$;

create or replace function public.update_red_comercial_opportunity_economics(p_opportunity_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_opportunity public.represented_company_opportunities%rowtype;
  v_type text := nullif(p_payload->>'arista_commission_type', '');
  v_rate numeric := nullif(p_payload->>'arista_commission_rate', '')::numeric;
  v_fixed numeric := nullif(p_payload->>'arista_commission_fixed_amount', '')::numeric;
  v_net numeric := nullif(p_payload->>'arista_commission_net_amount', '')::numeric;
  v_tax_mode text := nullif(p_payload->>'commission_tax_mode', '');
  v_tax_rate numeric := nullif(p_payload->>'commission_tax_rate', '')::numeric;
  v_tax numeric;
  v_base text := nullif(p_payload->>'collaborator_compensation_base', '');
  v_collaborator_amount numeric;
  v_source text := nullif(p_payload->>'economic_source', '');
  v_currency text := coalesce(nullif(btrim(p_payload->>'currency'), ''), 'CLP');
  v_precision integer := case when v_currency = 'CLP' then 0 else 2 end;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  if not public.is_red_comercial_admin() then raise exception 'AP_ADMIN_REQUIRED'; end if;
  select * into v_opportunity from public.represented_company_opportunities where id = p_opportunity_id;
  if not found then raise exception 'AP_NOT_FOUND'; end if;
  if not public.red_comercial_can_manage_prospect(v_opportunity.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  if v_opportunity.result_status <> 'won' then raise exception 'REDCOM_ECONOMICS_REQUIRE_WON'; end if;
  if v_type not in ('percentage', 'fixed_amount') and v_net is not null then raise exception 'REDCOM_ECONOMICS_INVALID_TYPE'; end if;
  if v_type = 'percentage' and (v_rate is null or v_rate not between 0 and 100) then raise exception 'REDCOM_ECONOMICS_INVALID_RATE'; end if;
  if v_type = 'fixed_amount' and (v_fixed is null or v_fixed < 0) then raise exception 'REDCOM_ECONOMICS_INVALID_AMOUNT'; end if;
  if v_tax_mode not in ('taxable', 'exempt', 'not_applicable') then raise exception 'REDCOM_ECONOMICS_INVALID_TAX_MODE'; end if;
  if v_tax_mode = 'taxable' and (v_tax_rate is null or v_tax_rate not between 0 and 100) then raise exception 'REDCOM_ECONOMICS_INVALID_TAX_RATE'; end if;
  if v_tax_mode <> 'taxable' then v_tax_rate := null; end if;
  if v_net is null then
    v_net := case when v_type = 'percentage' and v_opportunity.sale_net_amount is not null then round(v_opportunity.sale_net_amount * v_rate / 100, v_precision) when v_type = 'fixed_amount' then v_fixed else null end;
  end if;
  if v_net is not null and v_net < 0 then raise exception 'REDCOM_ECONOMICS_INVALID_AMOUNT'; end if;
  v_tax := case when v_net is null then null when v_tax_mode = 'taxable' then round(v_net * v_tax_rate / 100, v_precision) else 0 end;
  v_base := coalesce(v_base, case when v_opportunity.attributed_collaborator_id is not null then 'arista_commission' end);
  if v_base is not null and v_base not in ('arista_commission', 'sale_net_amount') then raise exception 'REDCOM_ECONOMICS_INVALID_BASE'; end if;
  v_collaborator_amount := case
    when v_opportunity.collaborator_compensation_type = 'fixed_amount' then v_opportunity.collaborator_compensation_amount
    when v_opportunity.collaborator_compensation_type = 'percentage' and v_opportunity.collaborator_compensation_rate is not null and (case when v_base = 'sale_net_amount' then v_opportunity.sale_net_amount else v_net end) is not null then round((case when v_base = 'sale_net_amount' then v_opportunity.sale_net_amount else v_net end) * v_opportunity.collaborator_compensation_rate / 100, v_precision)
    else null end;
  update public.represented_company_opportunities set
    currency = v_currency,
    arista_commission_type = v_type,
    arista_commission_rate = case when v_type = 'percentage' then v_rate else null end,
    arista_commission_fixed_amount = case when v_type = 'fixed_amount' then v_fixed else null end,
    arista_commission_net_amount = v_net,
    commission_tax_mode = v_tax_mode,
    commission_tax_rate = v_tax_rate,
    commission_tax_amount = v_tax,
    commission_total_amount = case when v_net is null or v_tax is null then null else v_net + v_tax end,
    arista_commission_status = coalesce(nullif(p_payload->>'arista_commission_status', ''), arista_commission_status, 'pending'),
    collaborator_compensation_base = v_base,
    collaborator_commission_amount = v_collaborator_amount,
    economic_source = coalesce(v_source, 'manual'),
    economic_override_note = nullif(btrim(p_payload->>'economic_override_note'), ''),
    economic_updated_by = v_user_id,
    economic_updated_at = now()
  where id = p_opportunity_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by)
  values (v_opportunity.prospect_id, 'status_change', 'Datos economicos actualizados', nullif(p_payload->>'context', ''), v_user_id);
  return public.get_red_comercial_opportunity_economics(p_opportunity_id);
end;
$$;

grant execute on function public.get_red_comercial_opportunity_economics(uuid) to authenticated;
grant execute on function public.update_red_comercial_opportunity_economics(uuid, jsonb) to authenticated;

create or replace function public.close_red_comercial_opportunity(p_opportunity_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_opportunity public.represented_company_opportunities%rowtype;
  v_action text := nullif(btrim(p_payload->>'action'), '');
  v_loss_reason text := nullif(btrim(p_payload->>'loss_reason'), '');
  v_closing_notes text := nullif(btrim(p_payload->>'closing_notes'), '');
  v_closed_at timestamptz := coalesce(nullif(p_payload->>'closed_at', '')::timestamptz, now());
  v_sale_net_amount numeric := case when p_payload ? 'sale_net_amount' and nullif(p_payload->>'sale_net_amount', '') is not null then (p_payload->>'sale_net_amount')::numeric else null end;
  v_currency text := coalesce(nullif(btrim(p_payload->>'currency'), ''), 'CLP');
  v_agreement_type text;
  v_agreement_value numeric;
  v_commission_type text;
  v_commission_rate numeric;
  v_commission_fixed numeric;
  v_commission_net numeric;
  v_collaborator_base text;
  v_collaborator_amount numeric;
  v_activity_title text;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  if not public.is_red_comercial_admin() then raise exception 'AP_ADMIN_REQUIRED'; end if;
  select * into v_opportunity from public.represented_company_opportunities where id = p_opportunity_id;
  if not found then raise exception 'AP_NOT_FOUND'; end if;
  if not public.red_comercial_can_manage_prospect(v_opportunity.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  if v_action = 'close_won' then
    if v_opportunity.result_status <> 'in_process' then raise exception 'REDCOM_OPPORTUNITY_ALREADY_CLOSED'; end if;
    select commission_type, commission_value into v_agreement_type, v_agreement_value
    from public.commercial_agreements
    where opportunity_id = p_opportunity_id and agreement_status = 'accepted' and archived_at is null
    order by updated_at desc limit 1;
    v_commission_type := nullif(p_payload->>'arista_commission_type', '');
    v_commission_type := coalesce(v_commission_type, v_agreement_type);
    v_commission_rate := case when v_commission_type = 'percentage' then coalesce(nullif(p_payload->>'arista_commission_rate', '')::numeric, v_agreement_value) end;
    v_commission_fixed := case when v_commission_type = 'fixed_amount' then coalesce(nullif(p_payload->>'arista_commission_fixed_amount', '')::numeric, v_agreement_value) end;
    v_commission_net := case when v_commission_type = 'percentage' and v_sale_net_amount is not null and v_commission_rate is not null then round(v_sale_net_amount * v_commission_rate / 100, case when v_currency = 'CLP' then 0 else 2 end) when v_commission_type = 'fixed_amount' then v_commission_fixed end;
    if v_commission_rate is not null and v_commission_rate not between 0 and 100 then raise exception 'REDCOM_ECONOMICS_INVALID_RATE'; end if;
    if v_commission_fixed is not null and v_commission_fixed < 0 then raise exception 'REDCOM_ECONOMICS_INVALID_AMOUNT'; end if;
    v_collaborator_base := case when v_opportunity.attributed_collaborator_id is not null then 'arista_commission' end;
    v_collaborator_amount := case when v_opportunity.collaborator_compensation_type = 'fixed_amount' then v_opportunity.collaborator_compensation_amount when v_opportunity.collaborator_compensation_type = 'percentage' and v_opportunity.collaborator_compensation_rate is not null and v_commission_net is not null then round(v_commission_net * v_opportunity.collaborator_compensation_rate / 100, case when v_currency = 'CLP' then 0 else 2 end) end;
    update public.represented_company_opportunities set
      result_status = 'won', status = 'won', closed_at = v_closed_at, sale_net_amount = case when p_payload ? 'sale_net_amount' then v_sale_net_amount else sale_net_amount end, currency = v_currency,
      arista_commission_type = v_commission_type, arista_commission_rate = v_commission_rate, arista_commission_fixed_amount = v_commission_fixed, arista_commission_net_amount = v_commission_net,
      collaborator_compensation_base = v_collaborator_base, collaborator_commission_amount = v_collaborator_amount,
      economic_source = case when v_agreement_type is not null then 'agreement' else null end, economic_updated_by = case when v_commission_net is not null then v_user_id end, economic_updated_at = case when v_commission_net is not null then now() end,
      loss_reason = null, closing_notes = v_closing_notes, updated_at = now()
    where id = p_opportunity_id;
    v_activity_title := 'Oportunidad ganada';
  elsif v_action = 'close_lost' then
    if v_opportunity.result_status <> 'in_process' then raise exception 'REDCOM_OPPORTUNITY_ALREADY_CLOSED'; end if;
    if v_loss_reason is null then raise exception 'REDCOM_LOSS_REASON_REQUIRED'; end if;
    update public.represented_company_opportunities set result_status = 'lost', status = 'lost', closed_at = v_closed_at, loss_reason = v_loss_reason, closing_notes = v_closing_notes, updated_at = now() where id = p_opportunity_id;
    v_activity_title := 'Oportunidad perdida';
  elsif v_action = 'reopen' then
    if v_opportunity.result_status not in ('won', 'lost') then raise exception 'REDCOM_OPPORTUNITY_NOT_CLOSED'; end if;
    update public.represented_company_opportunities set result_status = 'in_process', status = 'in_process', closed_at = null, updated_at = now() where id = p_opportunity_id;
    v_activity_title := 'Oportunidad reabierta';
  else
    raise exception 'REDCOM_OPPORTUNITY_INVALID_ACTION';
  end if;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (v_opportunity.prospect_id, 'status_change', v_activity_title, case when v_action = 'close_lost' then v_loss_reason else v_closing_notes end, v_user_id);
  return public.get_red_comercial_prospect_panel(v_opportunity.prospect_id);
end;
$$;

grant execute on function public.close_red_comercial_opportunity(uuid, jsonb) to authenticated;

create or replace function public.get_red_comercial_economic_results(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_company_id uuid default null,
  p_collaborator_id uuid default null,
  p_result_status text default null,
  p_payment_status text default null,
  p_control_mode text default null,
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_base jsonb;
  v_summary jsonb;
  v_rows jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  v_base := public.get_red_comercial_results(p_from, p_to, p_company_id, p_collaborator_id, p_result_status, p_payment_status, p_control_mode, p_search, p_limit, p_offset);
  with scoped as (
    select o.*
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    where ((v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)) or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select jsonb_build_object(
    'arista_commission_net_by_currency', case when v_is_admin then coalesce((select jsonb_object_agg(currency, total) from (select currency, sum(arista_commission_net_amount) as total from scoped where result_status = 'won' group by currency) q), '{}'::jsonb) else '{}'::jsonb end,
    'arista_commission_pending_by_currency', case when v_is_admin then coalesce((select jsonb_object_agg(currency, total) from (select currency, sum(arista_commission_net_amount) as total from scoped where result_status = 'won' and arista_commission_status in ('pending', 'invoiced') group by currency) q), '{}'::jsonb) else '{}'::jsonb end,
    'collaborator_amount_by_currency', coalesce((select jsonb_object_agg(currency, total) from (select currency, sum(collaborator_commission_amount) as total from scoped where result_status = 'won' group by currency) q), '{}'::jsonb),
    'arista_result_by_currency', case when v_is_admin then coalesce((select jsonb_object_agg(currency, total) from (select currency, sum(arista_commission_net_amount - collaborator_commission_amount) as total from scoped where result_status = 'won' and arista_commission_net_amount is not null and collaborator_commission_amount is not null group by currency) q), '{}'::jsonb) else '{}'::jsonb end
  ) into v_summary;

  with scoped as (
    select o.*
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    where ((v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)) or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'opportunity_id', id,
    'arista_commission_net_amount', case when v_is_admin then arista_commission_net_amount else null end,
    'commission_total_amount', case when v_is_admin then commission_total_amount else null end,
    'arista_commission_status', case when v_is_admin then arista_commission_status else null end,
    'collaborator_compensation_base', collaborator_compensation_base,
    'collaborator_commission_amount', collaborator_commission_amount,
    'currency', currency
  )), '[]'::jsonb) into v_rows from scoped;

  return v_base || jsonb_build_object('economic_summary', v_summary, 'economic_closures', v_rows);
end;
$$;

grant execute on function public.get_red_comercial_economic_results(timestamptz, timestamptz, uuid, uuid, text, text, text, text, integer, integer) to authenticated;
