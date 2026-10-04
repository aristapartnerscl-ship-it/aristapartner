-- Phase 8 final dashboard refinement: expose only the attributed collaborator's financial status.

alter function public.get_red_comercial_dashboard(text)
  rename to red_comercial_dashboard_base;

revoke all on function public.red_comercial_dashboard_base(text) from public;

create or replace function public.get_red_comercial_dashboard(p_period text default 'today')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_is_admin boolean;
  v_base jsonb;
  v_opportunities jsonb;
begin
  if v_user_id is null then raise exception 'AP_AUTH_REQUIRED'; end if;
  v_is_admin := public.is_red_comercial_admin();
  v_base := public.red_comercial_dashboard_base(p_period);

  select coalesce(jsonb_agg(
    item || jsonb_build_object(
      'commission_status', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.commission_status else null end,
      'collaborator_compensation_type', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_type else null end,
      'collaborator_compensation_rate', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_rate else null end,
      'collaborator_compensation_amount', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.collaborator_compensation_amount else null end,
      'currency', case when v_is_admin or o.attributed_collaborator_id = v_user_id then o.currency else null end
    ) order by ordinal
  ), '[]'::jsonb)
  into v_opportunities
  from jsonb_array_elements(coalesce(v_base->'opportunities', '[]'::jsonb)) with ordinality as entries(item, ordinal)
  left join public.represented_company_opportunities o on o.id = nullif(entries.item->>'id', '')::uuid;

  return jsonb_set(v_base, '{opportunities}', v_opportunities, true);
end;
$$;

revoke all on function public.get_red_comercial_dashboard(text) from public;
grant execute on function public.get_red_comercial_dashboard(text) to authenticated;
