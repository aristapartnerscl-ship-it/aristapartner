-- Phase 9: operational control and results breakdowns.
-- This migration adds read-only aggregates; it does not alter opportunity states.

create or replace function public.get_red_comercial_control_summary(
  p_period text default 'month'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_today_start timestamptz := ((timezone('America/Santiago', now())::date)::timestamp at time zone 'America/Santiago');
  v_period_start timestamptz := case
    when p_period = 'year' then (date_trunc('year', timezone('America/Santiago', now())) at time zone 'America/Santiago')
    when p_period = 'quarter' then (date_trunc('quarter', timezone('America/Santiago', now())) at time zone 'America/Santiago')
    else (date_trunc('month', timezone('America/Santiago', now())) at time zone 'America/Santiago')
  end;
  v_period_end timestamptz := v_today_start + interval '1 day';
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();

  with scoped_prospects as (
    select p.id, p.next_followup_at, p.last_contact_at, p.first_contact_at
    from public.represented_company_prospects p
    join public.represented_companies rc on rc.id = p.represented_company_id and rc.status = 'active'
    where (v_is_admin or (public.red_comercial_is_company_member(p.represented_company_id, v_user_id)
      and (p.owner_user_id = v_user_id or exists (
        select 1 from public.represented_company_prospect_collaborators pc
        where pc.prospect_id = p.id and pc.user_id = v_user_id and pc.status = 'active'
      ))))
      and not public.red_comercial_is_terminal_prospect_status(p.status)
  ),
  scoped_opportunities as (
    select o.*
    from public.represented_company_opportunities o
    where public.red_comercial_can_manage_prospect(o.prospect_id)
  ),
  requested as (
    select count(*)::integer as value
    from public.represented_company_specialist_requests r
    join scoped_opportunities o on o.id = r.opportunity_id
    where r.status = 'requested'
  ),
  pending as (
    select coalesce(jsonb_object_agg(currency, total), '{}'::jsonb) as amounts, count(*)::integer as count
    from (
      select o.currency, sum(o.arista_commission_net_amount) as total
      from scoped_opportunities o
      where v_is_admin and o.result_status = 'won'
        and o.arista_commission_net_amount is not null
        and o.arista_commission_status in ('pending', 'invoiced')
      group by o.currency
    ) q
  ),
  wins as (
    select coalesce(jsonb_object_agg(currency, total), '{}'::jsonb) as amounts
    from (
      select o.currency, sum(o.sale_net_amount) as total
      from scoped_opportunities o
      where o.result_status = 'won' and o.closed_at >= v_period_start and o.closed_at < v_period_end
      group by o.currency
    ) q
  )
  select jsonb_build_object(
    'followups_today', (select count(*) from scoped_prospects where next_followup_at >= v_today_start and next_followup_at < v_today_start + interval '1 day'),
    'followups_overdue', (select count(*) from scoped_prospects where next_followup_at < v_today_start),
    'followups_no_movement', (select count(*) from scoped_prospects where last_contact_at < now() - interval '7 days' or (last_contact_at is null and first_contact_at < now() - interval '7 days')),
    'active_prospects', (select count(*) from scoped_prospects),
    'open_opportunities', (select count(*) from scoped_opportunities where result_status = 'in_process'),
    'specialist_requested', (select value from requested),
    'economic_pending', case when v_is_admin then (select count(*) from scoped_opportunities where result_status = 'won' and arista_commission_net_amount is null) else 0 end,
    'won_by_currency', (select amounts from wins),
    'arista_commission_pending_by_currency', (select amounts from pending),
    'arista_commission_pending_count', (select count from pending)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.get_red_comercial_control_summary(text) from public;
grant execute on function public.get_red_comercial_control_summary(text) to authenticated;

create or replace function public.get_red_comercial_results_breakdown(
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_company_id uuid default null,
  p_collaborator_id uuid default null,
  p_result_status text default null,
  p_payment_status text default null,
  p_control_mode text default null,
  p_search text default null
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
  v_loss_reasons jsonb;
  v_services jsonb;
  v_pending jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  v_base := public.get_red_comercial_economic_results(p_from, p_to, p_company_id, p_collaborator_id, p_result_status, p_payment_status, p_control_mode, p_search, 1000, 0);

  with scoped as (
    select o.loss_reason, o.represented_company_service_id, s.name as service_name, o.result_status,
      o.arista_commission_net_amount, o.currency
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.represented_company_services s on s.id = o.represented_company_service_id
    where ((v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id))
      or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select coalesce(jsonb_agg(jsonb_build_object('reason', loss_reason, 'count', total) order by total desc), '[]'::jsonb)
  into v_loss_reasons
  from (select loss_reason, count(*) as total from scoped where result_status = 'lost' and nullif(btrim(loss_reason), '') is not null group by loss_reason) q;

  with scoped as (
    select o.represented_company_service_id, s.name as service_name, o.result_status, o.sale_net_amount, o.currency
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.represented_company_services s on s.id = o.represented_company_service_id
    where ((v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id))
      or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select coalesce(jsonb_agg(jsonb_build_object('service_id', represented_company_service_id, 'service_name', service_name, 'won', won, 'value_by_currency', value_by_currency) order by won desc), '[]'::jsonb)
  into v_services
  from (
    select represented_company_service_id, service_name, count(*) filter (where result_status = 'won') as won,
      coalesce(jsonb_object_agg(currency, total) filter (where result_status = 'won'), '{}'::jsonb) as value_by_currency
    from (select represented_company_service_id, service_name, result_status, currency, sum(sale_net_amount) as total from scoped group by represented_company_service_id, service_name, result_status, currency) q
    group by represented_company_service_id, service_name
  ) q;

  select coalesce(jsonb_agg(jsonb_build_object('currency', currency, 'count', total) order by currency), '[]'::jsonb)
  into v_pending
  from (
    select o.currency, count(*) as total
    from public.represented_company_opportunities o
    where v_is_admin and o.result_status = 'won' and o.arista_commission_net_amount is null
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_from is null or o.closed_at >= p_from) and (p_to is null or o.closed_at <= p_to)
    group by o.currency
  ) q;

  return v_base || jsonb_build_object('loss_reasons', v_loss_reasons, 'services', v_services, 'economic_pending_by_currency', v_pending);
end;
$$;

revoke all on function public.get_red_comercial_results_breakdown(timestamptz, timestamptz, uuid, uuid, text, text, text, text) from public;
grant execute on function public.get_red_comercial_results_breakdown(timestamptz, timestamptz, uuid, uuid, text, text, text, text) to authenticated;
