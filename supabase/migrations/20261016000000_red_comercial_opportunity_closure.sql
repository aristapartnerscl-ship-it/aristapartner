alter table public.represented_company_opportunities
  add column if not exists loss_reason text,
  add column if not exists closing_notes text;

create or replace function public.close_red_comercial_opportunity(
  p_opportunity_id uuid,
  p_payload jsonb
)
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
  v_next_result text;
  v_activity_title text;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  if not public.is_red_comercial_admin() then raise exception 'AP_ADMIN_REQUIRED'; end if;

  select * into v_opportunity
  from public.represented_company_opportunities
  where id = p_opportunity_id;

  if not found then raise exception 'AP_NOT_FOUND'; end if;
  if not public.red_comercial_can_manage_prospect(v_opportunity.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;

  if v_action = 'close_won' then
    if v_opportunity.result_status <> 'in_process' then raise exception 'REDCOM_OPPORTUNITY_ALREADY_CLOSED'; end if;
    update public.represented_company_opportunities
    set result_status = 'won', status = 'won', closed_at = v_closed_at,
        sale_net_amount = case when p_payload ? 'sale_net_amount' then v_sale_net_amount else sale_net_amount end,
        currency = v_currency, loss_reason = null, closing_notes = v_closing_notes,
        updated_at = now()
    where id = p_opportunity_id;
    v_activity_title := 'Oportunidad ganada';
  elsif v_action = 'close_lost' then
    if v_opportunity.result_status <> 'in_process' then raise exception 'REDCOM_OPPORTUNITY_ALREADY_CLOSED'; end if;
    if v_loss_reason is null then raise exception 'REDCOM_LOSS_REASON_REQUIRED'; end if;
    update public.represented_company_opportunities
    set result_status = 'lost', status = 'lost', closed_at = v_closed_at,
        loss_reason = v_loss_reason, closing_notes = v_closing_notes,
        updated_at = now()
    where id = p_opportunity_id;
    v_activity_title := 'Oportunidad perdida';
  elsif v_action = 'reopen' then
    if v_opportunity.result_status not in ('won', 'lost') then raise exception 'REDCOM_OPPORTUNITY_NOT_CLOSED'; end if;
    update public.represented_company_opportunities
    set result_status = 'in_process', status = 'in_process', closed_at = null, updated_at = now()
    where id = p_opportunity_id;
    v_activity_title := 'Oportunidad reabierta';
  else
    raise exception 'REDCOM_OPPORTUNITY_INVALID_ACTION';
  end if;

  insert into public.represented_company_prospect_activities
    (prospect_id, activity_type, title, description, created_by)
  values (
    v_opportunity.prospect_id,
    'status_change',
    v_activity_title,
    case when v_action = 'close_lost' then v_loss_reason else v_closing_notes end,
    v_user_id
  );

  return public.get_red_comercial_prospect_panel(v_opportunity.prospect_id);
end;
$$;

grant execute on function public.close_red_comercial_opportunity(uuid, jsonb) to authenticated;
