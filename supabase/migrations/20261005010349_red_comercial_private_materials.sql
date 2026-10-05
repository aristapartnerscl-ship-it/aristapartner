alter table public.represented_company_materials
  add column if not exists category text,
  add column if not exists file_name text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists sort_order integer not null default 0,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references public.admin_profiles(id) on delete set null,
  add column if not exists archived_at timestamptz;

create index if not exists represented_company_materials_access_idx
  on public.represented_company_materials (represented_company_id, visibility, is_archived, sort_order, created_at desc);

insert into storage.buckets (id, name, public)
values ('represented-company-materials', 'represented-company-materials', false)
on conflict (id) do update set public = false;

drop policy if exists "red comercial members read assigned company materials" on public.represented_company_materials;
create policy "red comercial members read assigned company materials"
on public.represented_company_materials for select to authenticated
using (
  visibility = 'assigned_only'
  and exists (
    select 1 from public.represented_company_memberships m
    where m.represented_company_id = represented_company_materials.represented_company_id
      and m.user_id = (select auth.uid()) and m.status = 'active'
  )
);

drop policy if exists "red comercial members read directory materials" on public.represented_company_materials;
create policy "red comercial members read directory materials"
on public.represented_company_materials for select to authenticated
using (
  visibility = 'directory'
  and exists (
    select 1 from public.admin_profiles ap
    where ap.id = (select auth.uid()) and ap.is_active = true and ap.role in ('owner', 'collaborator')
  )
);

create or replace function public.create_represented_company_material(p_company_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_type text := lower(coalesce(p_payload->>'material_type', ''));
  v_title text := nullif(trim(p_payload->>'title'), '');
  v_visibility text := coalesce(p_payload->>'visibility', 'directory');
  v_file_name text := nullif(trim(p_payload->>'file_name'), '');
  v_path text;
  v_row jsonb;
begin
  if (select auth.uid()) is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  if v_title is null then raise exception 'REDCOM_MATERIAL_TITLE_REQUIRED'; end if;
  if v_type not in ('file', 'link') then raise exception 'REDCOM_MATERIAL_TYPE_INVALID'; end if;
  if v_visibility not in ('directory', 'assigned_only', 'admin_only') then raise exception 'REDCOM_MATERIAL_VISIBILITY_INVALID'; end if;
  if v_type = 'link' and coalesce(p_payload->>'external_url', '') !~* '^https?://' then raise exception 'REDCOM_MATERIAL_URL_INVALID'; end if;
  if v_type = 'file' and v_file_name is null then raise exception 'REDCOM_MATERIAL_FILE_REQUIRED'; end if;
  if not exists (select 1 from public.represented_companies c where c.id = p_company_id) then raise exception 'REDCOM_COMPANY_NOT_FOUND'; end if;
  v_id := gen_random_uuid();
  if v_type = 'file' then
    v_path := p_company_id::text || '/' || v_id::text || '/' || left(regexp_replace(v_file_name, '[^a-zA-Z0-9._-]+', '-', 'g'), 160);
  end if;
  insert into public.represented_company_materials (id, represented_company_id, title, description, material_type, storage_path, external_url, visibility, uploaded_by, category, file_name, mime_type, file_size, sort_order, updated_by)
  values (v_id, p_company_id, v_title, nullif(trim(p_payload->>'description'), ''), v_type, v_path, case when v_type = 'link' then p_payload->>'external_url' end, v_visibility, (select auth.uid()), nullif(trim(p_payload->>'category'), ''), case when v_type = 'file' then v_file_name end, nullif(trim(p_payload->>'mime_type'), ''), nullif(p_payload->>'file_size', '')::bigint, coalesce(nullif(p_payload->>'sort_order', '')::integer, 0), (select auth.uid()))
  returning to_jsonb(represented_company_materials.*) into v_row;
  return v_row || jsonb_build_object('upload_path', v_path);
end;
$$;

create or replace function public.update_represented_company_material(p_material_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row jsonb; v_url text;
begin
  if (select auth.uid()) is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  v_url := nullif(trim(p_payload->>'external_url'), '');
  if v_url is not null and v_url !~* '^https?://' then raise exception 'REDCOM_MATERIAL_URL_INVALID'; end if;
  update public.represented_company_materials set
    title = coalesce(nullif(trim(p_payload->>'title'), ''), title),
    description = case when p_payload ? 'description' then nullif(trim(p_payload->>'description'), '') else description end,
    category = case when p_payload ? 'category' then nullif(trim(p_payload->>'category'), '') else category end,
    visibility = case when p_payload ? 'visibility' then p_payload->>'visibility' else visibility end,
    external_url = case when material_type = 'link' and p_payload ? 'external_url' then v_url else external_url end,
    sort_order = case when p_payload ? 'sort_order' then (p_payload->>'sort_order')::integer else sort_order end,
    updated_at = now(), updated_by = (select auth.uid())
  where id = p_material_id and not is_archived
  returning to_jsonb(represented_company_materials.*) into v_row;
  if v_row is null then raise exception 'REDCOM_MATERIAL_NOT_FOUND'; end if;
  return v_row;
end;
$$;

create or replace function public.archive_represented_company_material(p_material_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row jsonb;
begin
  if (select auth.uid()) is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  update public.represented_company_materials set is_archived = true, archived_at = now(), updated_at = now(), updated_by = (select auth.uid())
  where id = p_material_id and not is_archived returning to_jsonb(represented_company_materials.*) into v_row;
  if v_row is null then raise exception 'REDCOM_MATERIAL_NOT_FOUND'; end if;
  return v_row;
end;
$$;

create or replace function public.get_represented_company_material_access(p_material_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_row public.represented_company_materials%rowtype; v_admin boolean := public.is_red_comercial_admin(); v_allowed boolean;
begin
  select * into v_row from public.represented_company_materials where id = p_material_id and not is_archived;
  if not found then raise exception 'REDCOM_MATERIAL_NOT_FOUND'; end if;
  v_allowed := v_admin or (v_row.visibility = 'directory' and exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active and ap.role in ('owner','collaborator'))) or (v_row.visibility = 'assigned_only' and exists (select 1 from public.represented_company_memberships m where m.represented_company_id = v_row.represented_company_id and m.user_id = (select auth.uid()) and m.status = 'active'));
  if not v_allowed then raise exception 'REDCOM_MATERIAL_ACCESS_DENIED'; end if;
  return jsonb_build_object('id', v_row.id, 'material_type', v_row.material_type, 'external_url', v_row.external_url, 'storage_path', v_row.storage_path, 'file_name', v_row.file_name, 'mime_type', v_row.mime_type, 'file_size', v_row.file_size);
end;
$$;

create or replace function public.prepare_represented_company_material_replace(p_material_id uuid, p_file_name text, p_mime_type text, p_file_size bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row public.represented_company_materials%rowtype; v_path text;
begin
  if (select auth.uid()) is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  select * into v_row from public.represented_company_materials where id = p_material_id and material_type = 'file' and not is_archived for update;
  if not found then raise exception 'REDCOM_MATERIAL_NOT_FOUND'; end if;
  v_path := v_row.represented_company_id::text || '/' || v_row.id::text || '/' || left(regexp_replace(p_file_name, '[^a-zA-Z0-9._-]+', '-', 'g'), 160);
  return jsonb_build_object('id', v_row.id, 'old_storage_path', v_row.storage_path, 'upload_path', v_path, 'file_name', p_file_name, 'mime_type', p_mime_type, 'file_size', p_file_size);
end;
$$;

create or replace function public.confirm_represented_company_material_replace(p_material_id uuid, p_storage_path text, p_file_name text, p_mime_type text, p_file_size bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old text; v_row jsonb;
begin
  if (select auth.uid()) is null or not public.is_red_comercial_admin() then raise exception 'REDCOM_ADMIN_REQUIRED'; end if;
  select storage_path into v_old from public.represented_company_materials where id = p_material_id and material_type = 'file' and not is_archived for update;
  if not found or p_storage_path !~ ('^' || p_material_id::text || '/') then raise exception 'REDCOM_MATERIAL_PATH_INVALID'; end if;
  update public.represented_company_materials set storage_path = p_storage_path, file_name = p_file_name, mime_type = p_mime_type, file_size = p_file_size, updated_at = now(), updated_by = (select auth.uid()) where id = p_material_id returning to_jsonb(represented_company_materials.*) into v_row;
  return v_row || jsonb_build_object('old_storage_path', v_old);
end;
$$;

grant execute on function public.create_represented_company_material(uuid, jsonb) to authenticated;
grant execute on function public.update_represented_company_material(uuid, jsonb) to authenticated;
grant execute on function public.archive_represented_company_material(uuid) to authenticated;
grant execute on function public.get_represented_company_material_access(uuid) to authenticated;
grant execute on function public.prepare_represented_company_material_replace(uuid, text, text, bigint) to authenticated;
grant execute on function public.confirm_represented_company_material_replace(uuid, text, text, text, bigint) to authenticated;

drop policy if exists "red comercial materials storage read" on storage.objects;
create policy "red comercial materials storage read" on storage.objects for select to authenticated using (
  bucket_id = 'represented-company-materials' and exists (
    select 1 from public.represented_company_materials m
    where m.storage_path = name and not m.is_archived and (
      public.is_red_comercial_admin() or
      (m.visibility = 'directory' and exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active and ap.role in ('owner','collaborator'))) or
      (m.visibility = 'assigned_only' and exists (select 1 from public.represented_company_memberships mm where mm.represented_company_id = m.represented_company_id and mm.user_id = (select auth.uid()) and mm.status = 'active'))
    )
  )
);
create policy "red comercial admins upload materials" on storage.objects for insert to authenticated with check (bucket_id = 'represented-company-materials' and public.is_red_comercial_admin());
create policy "red comercial admins update materials" on storage.objects for update to authenticated using (bucket_id = 'represented-company-materials' and public.is_red_comercial_admin()) with check (bucket_id = 'represented-company-materials' and public.is_red_comercial_admin());
create policy "red comercial admins delete materials" on storage.objects for delete to authenticated using (bucket_id = 'represented-company-materials' and public.is_red_comercial_admin());

-- Keep internal storage paths out of the workspace payload. Access is resolved by material id.

create or replace function public.get_red_comercial_company_workspace(p_company_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_admin boolean := public.is_red_comercial_admin();
  v_assigned boolean;
  v_company jsonb;
  v_playbook jsonb;
  v_faqs jsonb := '[]'::jsonb;
  v_materials jsonb := '[]'::jsonb;
  v_private jsonb;
begin
  if v_user_id is null then raise exception 'REDCOM_AUTH_REQUIRED'; end if;
  v_assigned := exists (select 1 from public.represented_company_memberships m where m.represented_company_id = p_company_id and m.user_id = v_user_id and m.status = 'active');
  if not v_admin and not v_assigned and not exists (select 1 from public.represented_companies c where c.id = p_company_id and c.status = 'active') then raise exception 'REDCOM_COMPANY_NOT_AVAILABLE'; end if;
  select jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'description', c.description, 'website_url', c.website_url, 'logo_storage_path', c.logo_storage_path, 'logo_source', c.logo_source, 'status', c.status, 'offer_summary', c.offer_summary, 'problem_solved', c.problem_solved, 'ideal_customer', c.ideal_customer, 'target_industries', c.target_industries, 'territory', c.territory, 'keywords', c.keywords, 'opportunity_examples', c.opportunity_examples, 'what_not_to_promise', c.what_not_to_promise, 'internal_owner_id', c.internal_owner_id, 'created_at', c.created_at, 'updated_at', c.updated_at) into v_company
  from public.represented_companies c where c.id = p_company_id;
  if v_company is null then raise exception 'REDCOM_COMPANY_NOT_FOUND'; end if;
  select to_jsonb(p) - 'represented_company_id' into v_playbook from public.represented_company_sales_playbooks p where p.represented_company_id = p_company_id;
  v_playbook := coalesce(v_playbook, '{}'::jsonb);
  if not v_admin and not v_assigned then v_playbook := jsonb_build_object('value_proposition', v_playbook->'value_proposition', 'opportunity_triggers', coalesce(v_playbook->'opportunity_triggers', '[]'::jsonb), 'cross_sell_use_cases', coalesce(v_playbook->'cross_sell_use_cases', '[]'::jsonb), 'updated_at', v_playbook->'updated_at'); end if;
  if v_admin or v_assigned then
    select coalesce(jsonb_agg(to_jsonb(f) - 'represented_company_id' order by f.sort_order, f.created_at), '[]'::jsonb) into v_faqs from public.represented_company_faqs f where f.represented_company_id = p_company_id and f.is_active;
  end if;
  select coalesce(jsonb_agg((to_jsonb(m) - 'represented_company_id' - 'storage_path') order by m.sort_order, m.created_at desc), '[]'::jsonb) into v_materials
  from public.represented_company_materials m
  where m.represented_company_id = p_company_id and not m.is_archived and (v_admin or (v_assigned and m.visibility in ('directory', 'assigned_only')) or (not v_assigned and m.visibility = 'directory'));
  if v_admin then select to_jsonb(d) - 'represented_company_id' into v_private from public.represented_company_private_details d where d.represented_company_id = p_company_id; end if;
  return jsonb_build_object('company', v_company, 'playbook', v_playbook, 'faqs', v_faqs, 'materials', v_materials, 'private_details', coalesce(v_private, null), 'can_edit', v_admin, 'is_assigned', v_assigned, 'updated_at', greatest((v_company->>'updated_at')::timestamptz, nullif(v_playbook->>'updated_at', '')::timestamptz));
end;
$$;
