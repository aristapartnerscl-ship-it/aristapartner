create table if not exists public.represented_company_sales_playbooks (
  represented_company_id uuid primary key references public.represented_companies(id) on delete cascade,
  value_proposition text,
  sales_offerings text,
  modalities text,
  plans text,
  inclusions text,
  exclusions text,
  use_cases text,
  recurring_model text,
  buyer_roles text,
  decision_makers text,
  influencers text,
  needs text,
  intent_signals text,
  qualification_criteria text,
  disqualification_criteria text,
  short_pitch text,
  introduction_guidance text,
  discovery_questions jsonb not null default '[]'::jsonb,
  sales_process text,
  required_information text,
  material_guidance text,
  recommended_next_step text,
  sales_plan text,
  opportunity_triggers jsonb not null default '[]'::jsonb,
  cross_sell_use_cases jsonb not null default '[]'::jsonb,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.represented_company_faqs (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  type text not null default 'faq',
  question text not null,
  answer text not null,
  requires_escalation boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_company_faqs_type_check check (type in ('faq', 'objection')),
  constraint represented_company_faqs_question_check check (length(btrim(question)) > 0),
  constraint represented_company_faqs_answer_check check (length(btrim(answer)) > 0)
);

create table if not exists public.represented_company_materials (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  title text not null,
  description text,
  material_type text not null default 'other',
  storage_path text,
  external_url text,
  visibility text not null default 'directory',
  uploaded_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  is_archived boolean not null default false,
  constraint represented_company_materials_source_check check (storage_path is not null or external_url is not null),
  constraint represented_company_materials_visibility_check check (visibility in ('directory', 'assigned_only', 'admin_only'))
);

create index if not exists represented_company_faqs_company_idx on public.represented_company_faqs (represented_company_id, type, sort_order);
create index if not exists represented_company_materials_company_idx on public.represented_company_materials (represented_company_id, visibility, is_archived);

create trigger represented_company_sales_playbooks_set_updated_at
before update on public.represented_company_sales_playbooks
for each row execute function public.set_updated_at();

create trigger represented_company_faqs_set_updated_at
before update on public.represented_company_faqs
for each row execute function public.set_updated_at();

alter table public.represented_company_sales_playbooks enable row level security;
alter table public.represented_company_faqs enable row level security;
alter table public.represented_company_materials enable row level security;

grant select, insert, update on public.represented_company_sales_playbooks to authenticated;
grant select, insert, update on public.represented_company_faqs to authenticated;
grant select, insert, update on public.represented_company_materials to authenticated;

create policy "red comercial admins manage company playbooks"
on public.represented_company_sales_playbooks for all to authenticated
using (public.is_red_comercial_admin()) with check (public.is_red_comercial_admin());

create policy "red comercial members read assigned company playbooks"
on public.represented_company_sales_playbooks for select to authenticated
using (exists (
  select 1 from public.represented_company_memberships m
  where m.represented_company_id = represented_company_sales_playbooks.represented_company_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy "red comercial admins manage company faqs"
on public.represented_company_faqs for all to authenticated
using (public.is_red_comercial_admin()) with check (public.is_red_comercial_admin());

create policy "red comercial members read assigned company faqs"
on public.represented_company_faqs for select to authenticated
using (exists (
  select 1 from public.represented_company_memberships m
  where m.represented_company_id = represented_company_faqs.represented_company_id
    and m.user_id = (select auth.uid()) and m.status = 'active'
));

create policy "red comercial admins manage company materials"
on public.represented_company_materials for all to authenticated
using (public.is_red_comercial_admin()) with check (public.is_red_comercial_admin());

create policy "red comercial members read directory materials"
on public.represented_company_materials for select to authenticated
using (visibility = 'directory' and exists (
  select 1 from public.admin_profiles ap
  where ap.id = (select auth.uid()) and ap.is_active = true and ap.role in ('owner', 'collaborator')
));

create or replace function public.get_red_comercial_company_workspace(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_admin boolean := public.is_red_comercial_admin();
  v_assigned boolean;
  v_company jsonb;
  v_playbook jsonb;
  v_faqs jsonb;
  v_materials jsonb;
  v_private jsonb;
begin
  if v_user_id is null then raise exception 'REDCOM_AUTH_REQUIRED'; end if;
  v_assigned := exists (
    select 1 from public.represented_company_memberships m
    where m.represented_company_id = p_company_id and m.user_id = v_user_id and m.status = 'active'
  );
  if not v_admin and not v_assigned then
    if not exists (select 1 from public.represented_companies c where c.id = p_company_id and c.status = 'active') then
      raise exception 'REDCOM_COMPANY_NOT_AVAILABLE';
    end if;
  end if;

  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description,
    'website_url', c.website_url, 'logo_storage_path', c.logo_storage_path, 'logo_source', c.logo_source,
    'status', c.status, 'offer_summary', c.offer_summary, 'problem_solved', c.problem_solved,
    'ideal_customer', c.ideal_customer, 'target_industries', c.target_industries, 'territory', c.territory,
    'keywords', c.keywords, 'opportunity_examples', c.opportunity_examples,
    'what_not_to_promise', c.what_not_to_promise, 'internal_owner_id', c.internal_owner_id,
    'created_at', c.created_at, 'updated_at', c.updated_at
  ) into v_company
  from public.represented_companies c where c.id = p_company_id;
  if v_company is null then raise exception 'REDCOM_COMPANY_NOT_FOUND'; end if;

  select to_jsonb(p) - 'represented_company_id' into v_playbook
  from public.represented_company_sales_playbooks p where p.represented_company_id = p_company_id;
  v_playbook := coalesce(v_playbook, '{}'::jsonb);
  if not v_admin and not v_assigned then
    v_playbook := jsonb_build_object(
      'value_proposition', v_playbook->'value_proposition',
      'opportunity_triggers', coalesce(v_playbook->'opportunity_triggers', '[]'::jsonb),
      'cross_sell_use_cases', coalesce(v_playbook->'cross_sell_use_cases', '[]'::jsonb),
      'updated_at', v_playbook->'updated_at'
    );
  end if;

  if v_admin or v_assigned then
    select coalesce(jsonb_agg(to_jsonb(f) - 'represented_company_id' order by f.sort_order, f.created_at), '[]'::jsonb)
      into v_faqs from public.represented_company_faqs f where f.represented_company_id = p_company_id and f.is_active;
    select coalesce(jsonb_agg(to_jsonb(m) - 'represented_company_id' order by m.created_at desc), '[]'::jsonb)
      into v_materials from public.represented_company_materials m where m.represented_company_id = p_company_id and not m.is_archived;
  else
    select coalesce(jsonb_agg(to_jsonb(m) - 'represented_company_id' order by m.created_at desc), '[]'::jsonb)
      into v_materials from public.represented_company_materials m where m.represented_company_id = p_company_id and not m.is_archived and m.visibility = 'directory';
    v_faqs := '[]'::jsonb;
  end if;

  if v_admin then
    select to_jsonb(d) - 'represented_company_id' into v_private
    from public.represented_company_private_details d where d.represented_company_id = p_company_id;
  end if;

  return jsonb_build_object(
    'company', v_company, 'playbook', v_playbook, 'faqs', v_faqs,
    'materials', v_materials, 'private_details', coalesce(v_private, null),
    'can_edit', v_admin, 'is_assigned', v_assigned, 'updated_at',
    greatest((v_company->>'updated_at')::timestamptz, nullif(v_playbook->>'updated_at', '')::timestamptz)
  );
end;
$$;

create or replace function public.update_red_comercial_company_playbook(p_company_id uuid, p_section text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  if not exists (select 1 from public.represented_companies where id = p_company_id) then raise exception 'REDCOM_COMPANY_NOT_FOUND'; end if;
  insert into public.represented_company_sales_playbooks (represented_company_id, updated_by)
  values (p_company_id, v_user_id)
  on conflict (represented_company_id) do update set updated_by = excluded.updated_by, updated_at = now();
  if p_section = 'offer' then
    update public.represented_company_sales_playbooks set
      value_proposition = nullif(btrim(p_payload->>'value_proposition'), ''), sales_offerings = nullif(btrim(p_payload->>'sales_offerings'), ''),
      modalities = nullif(btrim(p_payload->>'modalities'), ''), plans = nullif(btrim(p_payload->>'plans'), ''),
      inclusions = nullif(btrim(p_payload->>'inclusions'), ''), exclusions = nullif(btrim(p_payload->>'exclusions'), ''),
      use_cases = nullif(btrim(p_payload->>'use_cases'), ''), recurring_model = nullif(btrim(p_payload->>'recurring_model'), '')
    where represented_company_id = p_company_id;
  elsif p_section = 'ideal' then
    update public.represented_company_sales_playbooks set
      buyer_roles = nullif(btrim(p_payload->>'buyer_roles'), ''), decision_makers = nullif(btrim(p_payload->>'decision_makers'), ''),
      influencers = nullif(btrim(p_payload->>'influencers'), ''), needs = nullif(btrim(p_payload->>'needs'), ''),
      intent_signals = nullif(btrim(p_payload->>'intent_signals'), ''), qualification_criteria = nullif(btrim(p_payload->>'qualification_criteria'), ''),
      disqualification_criteria = nullif(btrim(p_payload->>'disqualification_criteria'), '')
    where represented_company_id = p_company_id;
  elsif p_section = 'selling' then
    update public.represented_company_sales_playbooks set
      short_pitch = nullif(btrim(p_payload->>'short_pitch'), ''), introduction_guidance = nullif(btrim(p_payload->>'introduction_guidance'), ''),
      discovery_questions = coalesce(p_payload->'discovery_questions', '[]'::jsonb), sales_process = nullif(btrim(p_payload->>'sales_process'), ''),
      required_information = nullif(btrim(p_payload->>'required_information'), ''), material_guidance = nullif(btrim(p_payload->>'material_guidance'), ''),
      recommended_next_step = nullif(btrim(p_payload->>'recommended_next_step'), ''), sales_plan = nullif(btrim(p_payload->>'sales_plan'), '')
    where represented_company_id = p_company_id;
  elsif p_section = 'signals' then
    update public.represented_company_sales_playbooks set
      opportunity_triggers = coalesce(p_payload->'opportunity_triggers', '[]'::jsonb), cross_sell_use_cases = coalesce(p_payload->'cross_sell_use_cases', '[]'::jsonb)
    where represented_company_id = p_company_id;
  else raise exception 'REDCOM_INVALID_PLAYBOOK_SECTION'; end if;
  return public.get_red_comercial_company_workspace(p_company_id);
end;
$$;

revoke all on function public.get_red_comercial_company_workspace(uuid) from public;
revoke all on function public.update_red_comercial_company_playbook(uuid, text, jsonb) from public;
grant execute on function public.get_red_comercial_company_workspace(uuid) to authenticated;
grant execute on function public.update_red_comercial_company_playbook(uuid, text, jsonb) to authenticated;
