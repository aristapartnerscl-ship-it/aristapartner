create or replace function public.get_red_comercial_prospect_detail(p_prospect_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prospect public.represented_company_prospects%rowtype;
  v_can_access_company boolean;
  v_can_view_detail boolean;
  v_owner jsonb;
  v_collaborators jsonb;
  v_activities jsonb;
begin
  select * into v_prospect
  from public.represented_company_prospects
  where id = p_prospect_id;

  if not found then
    return null;
  end if;

  v_can_access_company := public.red_comercial_can_access_company(v_prospect.represented_company_id);
  if not v_can_access_company then
    return null;
  end if;

  v_can_view_detail := public.red_comercial_can_view_prospect_detail(v_prospect.id);

  select jsonb_build_object(
    'id', ap.id,
    'full_name', ap.full_name,
    'email', case when v_can_view_detail then ap.email else null end
  )
    into v_owner
  from public.admin_profiles ap
  where ap.id = v_prospect.owner_user_id;

  if v_can_view_detail then
    select coalesce(jsonb_agg(jsonb_build_object('id', ap.id, 'full_name', ap.full_name, 'email', ap.email) order by ap.full_name), '[]'::jsonb)
      into v_collaborators
    from public.represented_company_prospect_collaborators pc
    join public.admin_profiles ap on ap.id = pc.user_id
    where pc.prospect_id = v_prospect.id
      and pc.status = 'active';

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id,
      'activity_type', a.activity_type,
      'title', a.title,
      'description', a.description,
      'activity_at', a.activity_at,
      'created_at', a.created_at,
      'created_by', a.created_by,
      'created_by_name', creator.full_name
    ) order by a.activity_at desc, a.created_at desc), '[]'::jsonb)
      into v_activities
    from public.represented_company_prospect_activities a
    left join public.admin_profiles creator on creator.id = a.created_by
    where a.prospect_id = v_prospect.id;
  else
    v_collaborators := '[]'::jsonb;
    v_activities := '[]'::jsonb;
  end if;

  return jsonb_build_object(
    'id', v_prospect.id,
    'represented_company_id', v_prospect.represented_company_id,
    'company_name', v_prospect.company_name,
    'website_url', case when v_can_view_detail then v_prospect.website_url else null end,
    'domain', case when v_can_view_detail then v_prospect.domain else null end,
    'rut', case when v_can_view_detail then v_prospect.rut else null end,
    'contact_name', case when v_can_view_detail then v_prospect.contact_name else null end,
    'contact_role', case when v_can_view_detail then v_prospect.contact_role else null end,
    'contact_email', case when v_can_view_detail then v_prospect.contact_email else null end,
    'contact_phone', case when v_can_view_detail then v_prospect.contact_phone else null end,
    'channel', v_prospect.channel,
    'status', v_prospect.status,
    'first_contact_at', v_prospect.first_contact_at,
    'last_contact_at', v_prospect.last_contact_at,
    'next_followup_at', v_prospect.next_followup_at,
    'owner_user_id', v_prospect.owner_user_id,
    'owner', v_owner,
    'collaborators', v_collaborators,
    'internal_notes', case when v_can_view_detail then v_prospect.internal_notes else null end,
    'is_archived', v_prospect.is_archived,
    'can_view_detail', v_can_view_detail,
    'activities', v_activities,
    'created_at', v_prospect.created_at,
    'updated_at', v_prospect.updated_at
  );
end;
$$;

revoke all on function public.get_red_comercial_prospect_detail(uuid) from public;
grant execute on function public.get_red_comercial_prospect_detail(uuid) to authenticated;
