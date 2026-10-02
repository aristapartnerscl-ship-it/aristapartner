alter table public.represented_company_prospects
  add column if not exists logo_storage_path text,
  add column if not exists logo_source text not null default 'fallback',
  add column if not exists logo_updated_at timestamptz;

alter table public.represented_company_prospects
  drop constraint if exists represented_company_prospects_logo_source_check;

alter table public.represented_company_prospects
  add constraint represented_company_prospects_logo_source_check
  check (logo_source in ('manual', 'detected', 'fallback'));

create index if not exists represented_company_prospects_logo_path_idx
  on public.represented_company_prospects (logo_storage_path)
  where logo_storage_path is not null;

create or replace function public.get_red_comercial_prospect_logos(p_prospect_ids uuid[])
returns table (
  id uuid,
  logo_storage_path text,
  logo_source text,
  logo_updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.logo_storage_path,
    p.logo_source,
    p.logo_updated_at
  from public.represented_company_prospects p
  where p.id = any(coalesce(p_prospect_ids, '{}'::uuid[]))
    and public.red_comercial_can_access_company(p.represented_company_id);
$$;

revoke all on function public.get_red_comercial_prospect_logos(uuid[]) from public;
grant execute on function public.get_red_comercial_prospect_logos(uuid[]) to authenticated;
