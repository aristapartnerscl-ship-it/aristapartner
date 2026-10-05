create or replace function public.delete_red_comercial_archived_prospect(p_prospect_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_prospect public.represented_company_prospects%rowtype;
  v_has_history boolean;
begin
  if v_user_id is null or not public.is_red_comercial_admin() then
    raise exception 'AP_ADMIN_REQUIRED';
  end if;

  select * into v_prospect
  from public.represented_company_prospects
  where id = p_prospect_id
  for update;

  if not found then
    raise exception 'AP_PROSPECT_NOT_FOUND';
  end if;

  if not v_prospect.is_archived or v_prospect.status <> 'archived' then
    raise exception 'AP_PROSPECT_MUST_BE_ARCHIVED';
  end if;

  select exists (
    select 1 from public.represented_company_opportunities where prospect_id = p_prospect_id
    union all
    select 1 from public.represented_company_prospect_activities where prospect_id = p_prospect_id
    union all
    select 1 from public.represented_company_prospect_notes where prospect_id = p_prospect_id
    union all
    select 1 from public.represented_company_prospect_files where prospect_id = p_prospect_id
    union all
    select 1 from public.represented_company_cross_opportunities where source_prospect_id = p_prospect_id
    union all
    select 1 from public.represented_company_prospect_collaborators where prospect_id = p_prospect_id
  ) into v_has_history;

  if v_has_history then
    raise exception 'AP_PROSPECT_HAS_HISTORY';
  end if;

  delete from public.represented_company_prospects where id = p_prospect_id;
  return jsonb_build_object('id', p_prospect_id, 'deleted', true);
end;
$$;

revoke all on function public.delete_red_comercial_archived_prospect(uuid) from public;
grant execute on function public.delete_red_comercial_archived_prospect(uuid) to authenticated;
