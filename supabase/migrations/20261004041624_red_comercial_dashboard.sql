create or replace function public.get_red_comercial_dashboard(
  p_period text default 'today'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_today date := (now() at time zone 'America/Santiago')::date;
  v_summary jsonb;
  v_attention jsonb;
  v_followups jsonb;
  v_opportunities jsonb;
  v_cross jsonb;
  v_results jsonb;
  v_portfolios jsonb;
  v_activity jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();

  with prospects as (
    select p.* from public.represented_company_prospects p
    where not p.is_archived and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
  ), followups as (
    select p.*, rc.name as company_name, rc.logo_storage_path as company_logo, owner.full_name as owner_name
    from prospects p join public.represented_companies rc on rc.id = p.represented_company_id
    left join public.admin_profiles owner on owner.id = p.owner_user_id
    where p.next_followup_at is not null
  ), opportunities as (
    select o.*, p.company_name as prospect_name, rc.name as company_name, rc.logo_storage_path as company_logo, attributed.full_name as collaborator_name
    from public.represented_company_opportunities o
    join prospects p on p.id = o.prospect_id
    join public.represented_companies rc on rc.id = o.represented_company_id
    left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id
    where v_is_admin or o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id))
  )
  select jsonb_build_object(
    'followups_today', (select count(*) from prospects where next_followup_at is not null and (next_followup_at at time zone 'America/Santiago')::date = v_today),
    'followups_overdue', (select count(*) from prospects where next_followup_at is not null and next_followup_at < now()),
    'active_prospects', (select count(*) from prospects where status not in ('agreed', 'not_interested', 'archived')),
    'opportunities_in_process', (select count(*) from opportunities where result_status = 'in_process'),
    'opportunities_arista', (select count(*) from opportunities where control_mode = 'arista'),
    'payments_pending', (select count(*) from opportunities where payment_status in ('pending', 'partial', 'overdue')),
    'won_this_month', (select count(*) from opportunities where result_status = 'won' and (closed_at at time zone 'America/Santiago')::date >= date_trunc('month', v_today)::date),
    'commission_pending', (select count(*) from opportunities where attributed_collaborator_id = v_user_id and commission_status in ('to_validate', 'generated', 'pending_payment'))
  ) into v_summary;

  with followup_items as (
    select jsonb_build_object('type', case when f.next_followup_at < now() then 'followup_overdue' else 'followup_today' end, 'label', case when f.next_followup_at < now() then 'Seguimiento vencido' else 'Seguimiento hoy' end, 'prospect_id', f.id, 'prospect_name', f.prospect_name, 'company_id', f.represented_company_id, 'company_name', f.company_name, 'reason', case when f.next_followup_at < now() then 'Seguimiento vencido' else 'Contacto programado para hoy' end, 'owner_name', f.owner_name, 'at', f.next_followup_at, 'href', '/admin/seguimientos?view=' || case when f.next_followup_at < now() then 'overdue' else 'today' end) as item, case when f.next_followup_at < now() then 1 else 2 end as priority, f.next_followup_at as at from (
      select p.id, p.company_name as prospect_name, p.represented_company_id, p.next_followup_at, rc.name as company_name, owner.full_name as owner_name from public.represented_company_prospects p join public.represented_companies rc on rc.id = p.represented_company_id left join public.admin_profiles owner on owner.id = p.owner_user_id where not p.is_archived and p.next_followup_at is not null and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
    ) f where (f.next_followup_at at time zone 'America/Santiago')::date <= v_today
  ), opportunity_items as (
    select jsonb_build_object('type', case when o.payment_status in ('pending', 'partial', 'overdue') then 'payment_pending' else 'contract_pending' end, 'label', case when o.payment_status in ('pending', 'partial', 'overdue') then 'Pago pendiente' else 'Contrato pendiente' end, 'prospect_id', o.prospect_id, 'prospect_name', p.company_name, 'company_id', o.represented_company_id, 'company_name', rc.name, 'reason', case when o.payment_status in ('pending', 'partial', 'overdue') then 'Revisar estado de pago' else 'Revisar contrato comercial' end, 'owner_name', attributed.full_name, 'at', o.updated_at, 'href', '/admin/oportunidades') as item, 3 as priority, o.updated_at as at from public.represented_company_opportunities o join public.represented_company_prospects p on p.id = o.prospect_id join public.represented_companies rc on rc.id = o.represented_company_id left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id where (v_is_admin or o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id))) and o.result_status = 'in_process' and (o.payment_status in ('pending', 'partial', 'overdue') or o.contract_status in ('pending', 'sent', 'under_review', 'not_signed'))
  ), cross_items as (
    select jsonb_build_object('type', 'cross_opportunity', 'label', 'Oportunidad cruzada', 'prospect_id', c.source_prospect_id, 'prospect_name', p.company_name, 'company_id', p.represented_company_id, 'company_name', target.name, 'reason', c.reason, 'owner_name', detected.full_name, 'at', c.created_at, 'href', '/admin/oportunidades-cruzadas') as item, 4 as priority, c.created_at as at from public.represented_company_cross_opportunities c join public.represented_company_prospects p on p.id = c.source_prospect_id join public.represented_companies target on target.id = c.target_represented_company_id join public.admin_profiles detected on detected.id = c.detected_by where c.status in ('detected', 'under_review') and (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)
  ), stale_items as (
    select jsonb_build_object('type', 'stale_prospect', 'label', 'Sin movimiento', 'prospect_id', p.id, 'prospect_name', p.company_name, 'company_id', p.represented_company_id, 'company_name', rc.name, 'reason', 'Prospecto sin movimiento relevante', 'owner_name', owner.full_name, 'at', p.updated_at, 'href', '/admin/prospectos?company=' || p.represented_company_id) as item, 5 as priority, p.updated_at as at from public.represented_company_prospects p join public.represented_companies rc on rc.id = p.represented_company_id left join public.admin_profiles owner on owner.id = p.owner_user_id where not p.is_archived and p.updated_at < now() - interval '14 days' and p.status not in ('agreed', 'not_interested', 'archived') and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))
  ), items as (select * from followup_items union all select * from opportunity_items union all select * from cross_items union all select * from stale_items)
  select coalesce(jsonb_agg(item order by priority, at asc) filter (where item is not null), '[]'::jsonb) into v_attention from (select item, priority, at from items order by priority, at asc limit 12) limited;

  with rows as (
    select jsonb_build_object('prospect_id', p.id, 'prospect_name', p.company_name, 'company_id', p.represented_company_id, 'company_name', rc.name, 'owner_name', owner.full_name, 'at', p.next_followup_at, 'status', case when (p.next_followup_at at time zone 'America/Santiago')::date = v_today then 'today' else 'upcoming' end, 'href', '/admin/seguimientos?view=' || case when (p.next_followup_at at time zone 'America/Santiago')::date = v_today then 'today' else 'upcoming' end) as item from public.represented_company_prospects p join public.represented_companies rc on rc.id = p.represented_company_id left join public.admin_profiles owner on owner.id = p.owner_user_id where not p.is_archived and p.next_followup_at >= now() and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id)) order by p.next_followup_at asc limit 8
  ) select coalesce(jsonb_agg(item), '[]'::jsonb) into v_followups from rows;

  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'prospect_id', o.prospect_id, 'prospect_name', p.company_name, 'company_id', o.represented_company_id, 'company_name', rc.name, 'control_mode', o.control_mode, 'contract_status', o.contract_status, 'payment_status', o.payment_status, 'result_status', o.result_status, 'collaborator_name', attributed.full_name, 'updated_at', o.updated_at, 'href', '/admin/oportunidades') order by o.updated_at desc), '[]'::jsonb) into v_opportunities from public.represented_company_opportunities o join public.represented_company_prospects p on p.id = o.prospect_id join public.represented_companies rc on rc.id = o.represented_company_id left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id where o.result_status = 'in_process' and (v_is_admin or o.attributed_collaborator_id = v_user_id or (o.control_mode in ('collaborator', 'shared') and public.red_comercial_can_view_prospect_detail(o.prospect_id))) limit 8;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'prospect_id', c.source_prospect_id, 'prospect_name', p.company_name, 'target_company_id', c.target_represented_company_id, 'target_company_name', target.name, 'detected_by_name', detected.full_name, 'status', c.status, 'created_at', c.created_at, 'href', '/admin/oportunidades-cruzadas') order by c.created_at desc), '[]'::jsonb) into v_cross from public.represented_company_cross_opportunities c join public.represented_company_prospects p on p.id = c.source_prospect_id join public.represented_companies target on target.id = c.target_represented_company_id join public.admin_profiles detected on detected.id = c.detected_by where c.status in ('detected', 'under_review', 'assigned') and (v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id) limit 5;

  select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'prospect_id', o.prospect_id, 'prospect_name', p.company_name, 'company_id', o.represented_company_id, 'company_name', rc.name, 'result_status', o.result_status, 'payment_status', o.payment_status, 'collaborator_name', attributed.full_name, 'closed_at', o.closed_at, 'href', '/admin/resultados') order by o.closed_at desc nulls last), '[]'::jsonb) into v_results from public.represented_company_opportunities o join public.represented_company_prospects p on p.id = o.prospect_id join public.represented_companies rc on rc.id = o.represented_company_id left join public.admin_profiles attributed on attributed.id = o.attributed_collaborator_id where o.result_status in ('won', 'lost') and o.closed_at is not null and (v_is_admin or o.attributed_collaborator_id = v_user_id) limit 8;

  select coalesce(jsonb_agg(jsonb_build_object('id', rc.id, 'name', rc.name, 'logo_storage_path', rc.logo_storage_path, 'active_prospects', (select count(*) from public.represented_company_prospects p where p.represented_company_id = rc.id and not p.is_archived and p.status not in ('agreed', 'not_interested', 'archived') and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))), 'overdue', (select count(*) from public.represented_company_prospects p where p.represented_company_id = rc.id and not p.is_archived and p.next_followup_at < now() and (v_is_admin or public.red_comercial_can_view_prospect_detail(p.id))), 'opportunities_in_process', (select count(*) from public.represented_company_opportunities o join public.represented_company_prospects p on p.id = o.prospect_id where o.represented_company_id = rc.id and o.result_status = 'in_process' and (v_is_admin or o.attributed_collaborator_id = v_user_id or public.red_comercial_can_view_prospect_detail(p.id))), 'href', '/admin/prospectos?company=' || rc.id) order by rc.name) filter (where rc.status = 'active'), '[]'::jsonb) into v_portfolios from public.represented_companies rc where v_is_admin or public.red_comercial_is_company_member(rc.id, v_user_id);

  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'title', a.title, 'activity_type', a.activity_type, 'created_by_name', creator.full_name, 'created_at', a.created_at, 'prospect_name', p.company_name) order by a.created_at desc), '[]'::jsonb) into v_activity from public.represented_company_prospect_activities a join public.represented_company_prospects p on p.id = a.prospect_id left join public.admin_profiles creator on creator.id = a.created_by where v_is_admin or public.red_comercial_can_view_prospect_detail(a.prospect_id) limit 10;

  return jsonb_build_object('summary', v_summary, 'attention_today', v_attention, 'upcoming_followups', v_followups, 'opportunities', v_opportunities, 'cross_opportunities', v_cross, 'recent_results', v_results, 'portfolios', v_portfolios, 'recent_activity', v_activity);
end;
$$;

revoke all on function public.get_red_comercial_dashboard(text) from public;
grant execute on function public.get_red_comercial_dashboard(text) to authenticated;
