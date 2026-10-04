create or replace function public.get_red_comercial_results(
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
  v_rows jsonb;
  v_total integer;
  v_summary jsonb;
  v_companies jsonb;
  v_collaborators jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();

  with scoped as (
    select o.*, rc.name as company_name, rc.logo_storage_path as company_logo_storage_path,
      p.company_name as prospect_name, attributed.full_name as collaborator_name
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where (v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)
      or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  ), closed as (
    select * from scoped where result_status in ('won', 'lost')
  ), won as (
    select * from scoped where result_status = 'won'
  ), paged as (
    select closed.*, count(*) over() as full_count
    from closed
    order by closed.closed_at desc nulls last, closed.updated_at desc
    offset greatest(coalesce(p_offset, 0), 0)
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'prospect_id', prospect_id, 'company_id', represented_company_id,
    'company_name', company_name, 'company_logo_storage_path', company_logo_storage_path,
    'prospect_name', prospect_name, 'result_status', result_status,
    'payment_status', payment_status, 'commission_status', commission_status,
    'control_mode', control_mode,
    'collaborator_id', case when v_is_admin or attributed_collaborator_id = v_user_id then attributed_collaborator_id else null end,
    'collaborator_name', case when v_is_admin or attributed_collaborator_id = v_user_id then collaborator_name else null end,
    'sale_net_amount', case when v_is_admin then sale_net_amount else null end,
    'currency', currency, 'closed_at', closed_at, 'created_at', created_at
  ) order by closed_at desc nulls last, updated_at desc), '[]'::jsonb), coalesce(max(full_count), 0)
  into v_rows, v_total from paged;

  with scoped as (
    select o.* from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    where (v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)
      or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from)
      and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select jsonb_build_object(
    'closures', count(*) filter (where result_status in ('won', 'lost')),
    'won', count(*) filter (where result_status = 'won'),
    'lost', count(*) filter (where result_status = 'lost'),
    'cancelled', count(*) filter (where result_status = 'cancelled'),
    'in_process', count(*) filter (where result_status = 'in_process'),
    'paid', count(*) filter (where result_status = 'won' and payment_status = 'paid'),
    'payment_pending', count(*) filter (where payment_status in ('pending', 'partial', 'overdue')),
    'commission_pending', count(*) filter (where commission_status in ('to_validate', 'generated', 'pending_payment')),
    'close_rate', case when count(*) filter (where result_status in ('won', 'lost')) = 0 then null else round(100.0 * count(*) filter (where result_status = 'won') / (count(*) filter (where result_status in ('won', 'lost')))::numeric, 1) end,
    'avg_close_days', round(avg(extract(epoch from (closed_at - created_at)) / 86400.0) filter (where result_status in ('won', 'lost') and closed_at is not null)::numeric, 1)
  ) into v_summary from scoped;

  with scoped as (
    select o.*, o.represented_company_id as company_id, rc.name as company_name, rc.logo_storage_path as company_logo_storage_path
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    where (v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)
      or (not v_is_admin and o.attributed_collaborator_id = v_user_id))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from) and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
      and (p_result_status is null or o.result_status = p_result_status) and (p_payment_status is null or o.payment_status = p_payment_status) and (p_control_mode is null or o.control_mode = p_control_mode)
  ), grouped as (
    select company_id, company_name, company_logo_storage_path,
      count(*) filter (where result_status in ('won', 'lost')) as closed,
      count(*) filter (where result_status = 'won') as won,
      count(*) filter (where result_status = 'lost') as lost,
      count(*) filter (where result_status = 'in_process') as in_process,
      count(*) filter (where result_status = 'won' and payment_status = 'paid') as paid,
      count(*) filter (where result_status = 'won' and payment_status in ('pending', 'partial', 'overdue')) as payment_pending,
      jsonb_object_agg(currency, amount) filter (where amount is not null) as volume_by_currency,
      jsonb_object_agg(currency, ticket) filter (where ticket is not null) as average_ticket_by_currency
    from (
      select *, case when v_is_admin and result_status = 'won' then sale_net_amount else null end as amount,
        case when v_is_admin and result_status = 'won' and sale_net_amount is not null then sale_net_amount end as ticket
      from scoped
    ) x
    group by company_id, company_name, company_logo_storage_path
  )
  select coalesce(jsonb_agg(jsonb_build_object('company_id', company_id, 'company_name', company_name, 'company_logo_storage_path', company_logo_storage_path, 'closed', closed, 'won', won, 'lost', lost, 'in_process', in_process, 'paid', paid, 'payment_pending', payment_pending, 'volume_by_currency', coalesce(volume_by_currency, '{}'::jsonb), 'average_ticket_by_currency', coalesce(average_ticket_by_currency, '{}'::jsonb)) order by won desc, closed desc, company_name), '[]'::jsonb) into v_companies from grouped;

  with scoped as (
    select o.*, ap.full_name as collaborator_name
    from public.represented_company_opportunities o
    left join public.admin_profiles ap on ap.id = o.attributed_collaborator_id
    where v_is_admin and (p_collaborator_id is null or o.attributed_collaborator_id = p_collaborator_id)
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_from is null or coalesce(o.closed_at, o.created_at) >= p_from) and (p_to is null or coalesce(o.closed_at, o.created_at) <= p_to)
  ), grouped as (
    select attributed_collaborator_id as collaborator_id, max(collaborator_name) as collaborator_name,
      count(*) as attributed, count(*) filter (where result_status in ('won', 'lost')) as closed,
      count(*) filter (where result_status = 'won') as won, count(*) filter (where result_status = 'lost') as lost,
      count(*) filter (where result_status = 'in_process') as in_process,
      coalesce(sum(case when collaborator_compensation_type = 'fixed_amount' then collaborator_compensation_amount when collaborator_compensation_type = 'percentage' and sale_net_amount is not null then sale_net_amount * collaborator_compensation_rate / 100 else 0 end), 0) as generated,
      coalesce(sum(case when commission_status in ('to_validate', 'generated', 'pending_payment') then case when collaborator_compensation_type = 'fixed_amount' then collaborator_compensation_amount when collaborator_compensation_type = 'percentage' and sale_net_amount is not null then sale_net_amount * collaborator_compensation_rate / 100 else 0 end else 0 end), 0) as pending,
      coalesce(sum(case when commission_status = 'paid' then case when collaborator_compensation_type = 'fixed_amount' then collaborator_compensation_amount when collaborator_compensation_type = 'percentage' and sale_net_amount is not null then sale_net_amount * collaborator_compensation_rate / 100 else 0 end else 0 end), 0) as paid
    from scoped where attributed_collaborator_id is not null group by attributed_collaborator_id
  )
  select coalesce(jsonb_agg(jsonb_build_object('collaborator_id', collaborator_id, 'collaborator_name', collaborator_name, 'attributed', attributed, 'closed', closed, 'won', won, 'lost', lost, 'in_process', in_process, 'generated', generated, 'pending', pending, 'paid', paid) order by won desc, closed desc, collaborator_name), '[]'::jsonb) into v_collaborators from grouped;

  return jsonb_build_object('summary', v_summary, 'volume_by_currency', coalesce((select jsonb_object_agg(currency, total) from (select currency, sum(sale_net_amount) as total from public.represented_company_opportunities o where v_is_admin and o.result_status = 'won' and (p_company_id is null or o.represented_company_id = p_company_id) and (p_from is null or o.closed_at >= p_from) and (p_to is null or o.closed_at <= p_to) group by currency) q), '{}'::jsonb), 'companies', v_companies, 'collaborators', v_collaborators, 'closures', v_rows, 'total_closures', v_total);
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
  v_next_result text;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  select * into v_existing from public.represented_company_opportunities where id = p_opportunity_id;
  if not found or not public.red_comercial_can_manage_prospect(v_existing.prospect_id) then raise exception 'AP_ACCESS_DENIED'; end if;
  if not v_is_admin then
    if not v_is_handoff or v_existing.control_mode = 'arista' then raise exception 'AP_ADMIN_REQUIRED'; end if;
    update public.represented_company_opportunities set control_mode = 'arista', handed_off_at = now() where id = p_opportunity_id;
    insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (v_existing.prospect_id, 'status_change', 'Oportunidad entregada a Arista', nullif(p_payload->>'context', ''), v_user_id);
    return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
  end if;
  v_attributed := v_existing.attributed_collaborator_id;
  if p_payload ? 'attributed_collaborator_id' then v_attributed := nullif(p_payload->>'attributed_collaborator_id', '')::uuid; v_clearing_attribution := v_attributed is null; end if;
  v_compensation_type := case when p_payload ? 'collaborator_compensation_type' then nullif(p_payload->>'collaborator_compensation_type', '') else v_existing.collaborator_compensation_type end;
  v_compensation_rate := case when p_payload ? 'collaborator_compensation_rate' then nullif(p_payload->>'collaborator_compensation_rate', '')::numeric else v_existing.collaborator_compensation_rate end;
  v_compensation_amount := case when p_payload ? 'collaborator_compensation_amount' then nullif(p_payload->>'collaborator_compensation_amount', '')::numeric else v_existing.collaborator_compensation_amount end;
  if v_attributed is not null and not public.red_comercial_is_company_member(v_existing.represented_company_id, v_attributed) then raise exception 'AP_INVALID_ATTRIBUTED_COLLABORATOR'; end if;
  if (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null and not v_clearing_attribution then raise exception 'AP_ATTRIBUTED_COLLABORATOR_REQUIRED'; end if;
  if v_attributed is null or v_compensation_type is null then v_compensation_type := null; v_compensation_rate := null; v_compensation_amount := null; end if;
  v_next_result := coalesce(nullif(p_payload->>'result_status', ''), v_existing.result_status);
  update public.represented_company_opportunities set
    status = coalesce(nullif(p_payload->>'status', ''), status), control_mode = coalesce(nullif(p_payload->>'control_mode', ''), control_mode), contract_status = coalesce(nullif(p_payload->>'contract_status', ''), contract_status), payment_status = coalesce(nullif(p_payload->>'payment_status', ''), payment_status), commission_status = coalesce(nullif(p_payload->>'commission_status', ''), commission_status), result_status = v_next_result,
    attributed_collaborator_id = v_attributed, collaborator_compensation_type = v_compensation_type, collaborator_compensation_rate = v_compensation_rate, collaborator_compensation_amount = v_compensation_amount,
    handed_off_at = case when v_is_handoff then now() else handed_off_at end,
    closed_at = case when v_next_result in ('won', 'lost', 'cancelled') then coalesce(closed_at, now()) else null end,
    sale_net_amount = coalesce(nullif(p_payload->>'sale_net_amount', '')::numeric, sale_net_amount), currency = coalesce(nullif(p_payload->>'currency', ''), currency)
  where id = p_opportunity_id;
  insert into public.represented_company_prospect_activities (prospect_id, activity_type, title, description, created_by) values (v_existing.prospect_id, 'status_change', case when v_is_handoff then 'Oportunidad entregada a Arista' else 'Oportunidad actualizada' end, nullif(p_payload->>'context', ''), v_user_id);
  return public.get_red_comercial_prospect_panel(v_existing.prospect_id);
end;
$$;

revoke all on function public.update_red_comercial_opportunity(uuid, jsonb) from public;
grant execute on function public.update_red_comercial_opportunity(uuid, jsonb) to authenticated;
revoke all on function public.get_red_comercial_results(timestamptz, timestamptz, uuid, uuid, text, text, text, text, integer, integer) from public;
grant execute on function public.get_red_comercial_results(timestamptz, timestamptz, uuid, uuid, text, text, text, text, integer, integer) to authenticated;
