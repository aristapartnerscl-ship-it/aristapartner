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
  where n.prospect_id = p_prospect_id and not n.is_archived;

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
  where f.prospect_id = p_prospect_id and not f.is_archived;

  return jsonb_build_object('prospect', v_detail, 'opportunities', v_opportunities, 'cross_opportunities', v_cross, 'notes', v_notes, 'files', v_files);
end;
$$;

revoke all on function public.get_red_comercial_prospect_panel(uuid) from public;
grant execute on function public.get_red_comercial_prospect_panel(uuid) to authenticated;
