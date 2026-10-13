create or replace function public.notify_red_comercial_specialist_request_admins()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_opportunity public.represented_company_opportunities%rowtype;
  v_prospect public.represented_company_prospects%rowtype;
  v_requester_name text;
begin
  select * into v_opportunity
  from public.represented_company_opportunities
  where id = new.opportunity_id;

  select * into v_prospect
  from public.represented_company_prospects
  where id = v_opportunity.prospect_id;

  select ap.full_name into v_requester_name
  from public.admin_profiles ap
  where ap.id = new.requested_by;

  insert into public.admin_notifications (
    recipient_id, notification_type, entity_type, entity_id, title, message, action_path
  )
  select
    ap.id,
    'specialist_request_created',
    'specialist_request',
    new.id,
    'Solicitud de especialista',
    coalesce(v_requester_name, 'Un colaborador') || ' solicitó apoyo especialista para ' || coalesce(v_prospect.company_name, 'una oportunidad') || '.',
    '/admin/oportunidades?opportunityId=' || new.opportunity_id::text
  from public.admin_profiles ap
  where ap.role = 'owner'
    and ap.is_active = true
  on conflict (recipient_id, notification_type, entity_type, entity_id) do nothing;

  return new;
end;
$$;

revoke all on function public.notify_red_comercial_specialist_request_admins() from public;

drop trigger if exists represented_company_specialist_request_admin_notification on public.represented_company_specialist_requests;
create trigger represented_company_specialist_request_admin_notification
after insert on public.represented_company_specialist_requests
for each row execute function public.notify_red_comercial_specialist_request_admins();

create or replace function public.get_red_comercial_specialist_request_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requests jsonb;
begin
  if not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'opportunity_id', r.opportunity_id,
    'represented_company_id', r.represented_company_id,
    'company_name', rc.name,
    'prospect_name', p.company_name,
    'service_name', s.name,
    'requested_by_name', requester.full_name,
    'status', r.status,
    'created_at', r.created_at,
    'scheduled_at', r.scheduled_at,
    'href', '/admin/oportunidades?opportunityId=' || r.opportunity_id::text
  ) order by r.created_at desc), '[]'::jsonb)
  into v_requests
  from public.represented_company_specialist_requests r
  join public.represented_companies rc on rc.id = r.represented_company_id
  join public.represented_company_opportunities o on o.id = r.opportunity_id
  join public.represented_company_prospects p on p.id = o.prospect_id
  left join public.represented_company_services s on s.id = r.represented_company_service_id
  left join public.admin_profiles requester on requester.id = r.requested_by
  where r.status = 'requested';

  return jsonb_build_object(
    'pending_count', jsonb_array_length(v_requests),
    'requests', v_requests
  );
end;
$$;

revoke all on function public.get_red_comercial_specialist_request_dashboard() from public;
grant execute on function public.get_red_comercial_specialist_request_dashboard() to authenticated;
