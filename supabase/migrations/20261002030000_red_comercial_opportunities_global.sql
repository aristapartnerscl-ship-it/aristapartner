create index if not exists red_opportunities_company_idx
  on public.represented_company_opportunities (represented_company_id, updated_at desc);
create index if not exists red_opportunities_control_idx
  on public.represented_company_opportunities (control_mode, updated_at desc);
create index if not exists red_opportunities_contract_idx
  on public.represented_company_opportunities (contract_status, updated_at desc);
create index if not exists red_opportunities_payment_idx
  on public.represented_company_opportunities (payment_status, updated_at desc);
create index if not exists red_opportunities_result_idx
  on public.represented_company_opportunities (result_status, updated_at desc);
create index if not exists red_opportunities_attributed_idx
  on public.represented_company_opportunities (attributed_collaborator_id, updated_at desc);

create or replace function public.list_red_comercial_opportunities(
  p_search text default null,
  p_company_id uuid default null,
  p_control_mode text default null,
  p_contract_status text default null,
  p_payment_status text default null,
  p_responsible_id uuid default null,
  p_result_status text default null,
  p_view text default 'all',
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
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();

  with scoped as (
    select o.*, rc.name as represented_company_name, rc.logo_storage_path as represented_company_logo_storage_path,
      p.company_name as prospect_company_name, p.logo_storage_path as prospect_logo_storage_path,
      attributed.full_name as attributed_collaborator_name,
      (v_is_admin or (o.control_mode = 'collaborator' and o.attributed_collaborator_id = v_user_id and public.red_comercial_can_manage_prospect(o.prospect_id))) as can_edit
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where (v_is_admin or (
      public.red_comercial_is_company_member(o.represented_company_id, v_user_id)
      and (
        o.attributed_collaborator_id = v_user_id
        or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id))
      )
    ))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_contract_status is null or o.contract_status = p_contract_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_responsible_id is null or o.attributed_collaborator_id = p_responsible_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (
        coalesce(nullif(btrim(p_search), ''), '') = ''
        or p.company_name ilike '%' || btrim(p_search) || '%'
        or rc.name ilike '%' || btrim(p_search) || '%'
      )
      and (
        coalesce(p_view, 'all') = 'all'
        or (p_view = 'in_process' and o.result_status = 'in_process')
        or (p_view = 'arista' and o.control_mode = 'arista')
        or (p_view = 'contract_pending' and o.contract_status in ('pending', 'sent', 'under_review', 'not_signed'))
        or (p_view = 'payment_pending' and o.payment_status in ('pending', 'partial', 'overdue'))
        or (p_view = 'commission_pending' and o.commission_status in ('to_validate', 'generated', 'pending_payment'))
        or (p_view = 'won' and o.result_status = 'won')
        or (p_view = 'lost' and o.result_status = 'lost')
      )
  ), paged as (
    select scoped.*, count(*) over() as full_count
    from scoped
    order by scoped.updated_at desc
    offset greatest(coalesce(p_offset, 0), 0)
    limit least(greatest(coalesce(p_limit, 25), 1), 100)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', scoped.id,
    'prospect_id', scoped.prospect_id,
    'represented_company_id', scoped.represented_company_id,
    'represented_company_name', scoped.represented_company_name,
    'represented_company_logo_storage_path', scoped.represented_company_logo_storage_path,
    'prospect_company_name', scoped.prospect_company_name,
    'prospect_logo_storage_path', scoped.prospect_logo_storage_path,
    'status', scoped.status,
    'control_mode', scoped.control_mode,
    'contract_status', scoped.contract_status,
    'payment_status', scoped.payment_status,
    'commission_status', scoped.commission_status,
    'result_status', scoped.result_status,
    'attributed_collaborator_id', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.attributed_collaborator_id else null end,
    'attributed_collaborator_name', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.attributed_collaborator_name else null end,
    'collaborator_compensation_type', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_type else null end,
    'collaborator_compensation_rate', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_rate else null end,
    'collaborator_compensation_amount', case when v_is_admin or scoped.attributed_collaborator_id = v_user_id then scoped.collaborator_compensation_amount else null end,
    'sale_net_amount', case when v_is_admin then scoped.sale_net_amount else null end,
    'currency', scoped.currency,
    'handed_off_at', scoped.handed_off_at,
    'closed_at', scoped.closed_at,
    'created_by', scoped.created_by,
    'created_at', scoped.created_at,
    'updated_at', scoped.updated_at,
    'can_edit', scoped.can_edit
  ) order by scoped.updated_at desc), '[]'::jsonb), coalesce(max(scoped.full_count), 0)
  into v_rows, v_total
  from paged as scoped;

  return jsonb_build_object('rows', v_rows, 'total', v_total);
end;
$$;

create or replace function public.get_red_comercial_opportunity_metrics(
  p_search text default null,
  p_company_id uuid default null,
  p_control_mode text default null,
  p_contract_status text default null,
  p_payment_status text default null,
  p_responsible_id uuid default null,
  p_result_status text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  with scoped as (
    select o.*
    from public.represented_company_opportunities o
    join public.represented_company_prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    where (v_is_admin or (
      public.red_comercial_is_company_member(o.represented_company_id, v_user_id)
      and (o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id)))
    ))
      and (p_company_id is null or o.represented_company_id = p_company_id)
      and (p_control_mode is null or o.control_mode = p_control_mode)
      and (p_contract_status is null or o.contract_status = p_contract_status)
      and (p_payment_status is null or o.payment_status = p_payment_status)
      and (p_responsible_id is null or o.attributed_collaborator_id = p_responsible_id)
      and (p_result_status is null or o.result_status = p_result_status)
      and (coalesce(nullif(btrim(p_search), ''), '') = '' or p.company_name ilike '%' || btrim(p_search) || '%' or rc.name ilike '%' || btrim(p_search) || '%')
  )
  select jsonb_build_object(
    'total', count(*),
    'in_process', count(*) filter (where result_status = 'in_process'),
    'arista', count(*) filter (where control_mode = 'arista'),
    'collaborator', count(*) filter (where control_mode = 'collaborator'),
    'contract_pending', count(*) filter (where contract_status in ('pending', 'sent', 'under_review', 'not_signed')),
    'payment_pending', count(*) filter (where payment_status in ('pending', 'partial', 'overdue')),
    'commission_pending', count(*) filter (where commission_status in ('to_validate', 'generated', 'pending_payment')),
    'won', count(*) filter (where result_status = 'won'),
    'lost', count(*) filter (where result_status = 'lost')
  ) into v_result from scoped;
  return v_result;
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
  if v_opportunity is null then
    select jsonb_build_object(
      'id', o.id, 'prospect_id', o.prospect_id, 'status', o.status, 'control_mode', o.control_mode,
      'contract_status', o.contract_status, 'payment_status', o.payment_status, 'commission_status', o.commission_status,
      'result_status', o.result_status, 'attributed_collaborator_id', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.attributed_collaborator_id else null end,
      'collaborator_compensation_type', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_type else null end,
      'collaborator_compensation_rate', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_rate else null end,
      'collaborator_compensation_amount', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_amount else null end,
      'sale_net_amount', case when v_is_admin then o.sale_net_amount else null end, 'currency', o.currency,
      'handed_off_at', o.handed_off_at, 'closed_at', o.closed_at, 'created_by', o.created_by, 'created_at', o.created_at, 'updated_at', o.updated_at
    ) into v_opportunity
    from public.represented_company_opportunities o where o.id = p_opportunity_id;
  end if;
  return jsonb_set(v_panel, '{opportunities}', jsonb_build_array(v_opportunity), true);
end;
$$;

revoke all on function public.list_red_comercial_opportunities(text, uuid, text, text, text, uuid, text, text, integer, integer) from public;
revoke all on function public.get_red_comercial_opportunity_metrics(text, uuid, text, text, text, uuid, text) from public;
revoke all on function public.get_red_comercial_opportunity_panel(uuid) from public;
grant execute on function public.list_red_comercial_opportunities(text, uuid, text, text, text, uuid, text, text, integer, integer) to authenticated;
grant execute on function public.get_red_comercial_opportunity_metrics(text, uuid, text, text, text, uuid, text) to authenticated;
grant execute on function public.get_red_comercial_opportunity_panel(uuid) to authenticated;
