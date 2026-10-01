alter table public.admin_profiles
  drop constraint if exists admin_profiles_role_check;

alter table public.admin_profiles
  add constraint admin_profiles_role_check check (role in ('owner', 'collaborator'));

alter table public.admin_profiles
  add column if not exists email text,
  add column if not exists last_activity_at timestamptz;

create index if not exists admin_profiles_active_role_idx on public.admin_profiles (role, is_active);
create index if not exists admin_profiles_email_idx on public.admin_profiles (lower(email)) where email is not null;

create or replace function public.is_red_comercial_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active = true
      and ap.role = 'owner'
  );
$$;

create or replace function public.is_red_comercial_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = (select auth.uid())
      and ap.is_active = true
      and ap.role in ('owner', 'collaborator')
  );
$$;

revoke all on function public.is_red_comercial_admin() from public;
revoke all on function public.is_red_comercial_member() from public;
grant execute on function public.is_red_comercial_admin() to authenticated;
grant execute on function public.is_red_comercial_member() to authenticated;

create table public.represented_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  website_url text,
  logo_storage_path text,
  logo_source text not null default 'fallback',
  status text not null default 'active',
  offer_summary text,
  problem_solved text,
  ideal_customer text,
  target_industries text[] not null default '{}',
  territory text,
  keywords text[] not null default '{}',
  opportunity_examples text[] not null default '{}',
  what_not_to_promise text,
  internal_owner_id uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_companies_name_check check (length(btrim(name)) > 0),
  constraint represented_companies_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint represented_companies_status_check check (status in ('active', 'inactive')),
  constraint represented_companies_logo_source_check check (logo_source in ('manual', 'detected', 'fallback')),
  constraint represented_companies_website_url_check check (website_url is null or website_url ~* '^https?://')
);

create table public.represented_company_private_details (
  represented_company_id uuid primary key references public.represented_companies(id) on delete cascade,
  agreed_commission text,
  contract_notes text,
  economic_terms text,
  sensitive_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.represented_company_memberships (
  id uuid primary key default gen_random_uuid(),
  represented_company_id uuid not null references public.represented_companies(id) on delete cascade,
  user_id uuid not null references public.admin_profiles(id) on delete restrict,
  status text not null default 'active',
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint represented_company_memberships_status_check check (status in ('active', 'inactive')),
  constraint represented_company_memberships_unique unique (represented_company_id, user_id)
);

comment on table public.represented_companies is 'Commercial public profile for companies represented by Arista.';
comment on table public.represented_company_private_details is 'Admin-only private commercial and economic details for represented companies.';
comment on table public.represented_company_memberships is 'Collaborator to represented company assignments for Red Comercial Arista.';

create trigger represented_companies_set_updated_at before update on public.represented_companies
for each row execute function public.set_updated_at();

create trigger represented_company_private_details_set_updated_at before update on public.represented_company_private_details
for each row execute function public.set_updated_at();

create trigger represented_company_memberships_set_updated_at before update on public.represented_company_memberships
for each row execute function public.set_updated_at();

create unique index represented_companies_slug_key on public.represented_companies (slug);
create index represented_companies_status_idx on public.represented_companies (status);
create index represented_company_memberships_company_idx on public.represented_company_memberships (represented_company_id);
create index represented_company_memberships_user_idx on public.represented_company_memberships (user_id);
create index represented_company_memberships_status_idx on public.represented_company_memberships (status);

alter table public.represented_companies enable row level security;
alter table public.represented_company_private_details enable row level security;
alter table public.represented_company_memberships enable row level security;

grant select, insert, update on public.represented_companies to authenticated;
grant select, insert, update on public.represented_company_private_details to authenticated;
grant select, insert, update on public.represented_company_memberships to authenticated;
grant insert on public.admin_profiles to authenticated;

create policy "red comercial admin can read admin profiles"
on public.admin_profiles for select
to authenticated
using (public.is_red_comercial_admin());

create policy "red comercial admin can insert collaborator profiles"
on public.admin_profiles for insert
to authenticated
with check (public.is_red_comercial_admin() and role = 'collaborator');

create policy "red comercial admin can update collaborator profiles"
on public.admin_profiles for update
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial admin can manage represented companies"
on public.represented_companies for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial members can read active represented companies"
on public.represented_companies for select
to authenticated
using (status = 'active' and public.is_red_comercial_member());

create policy "red comercial admin can manage private company details"
on public.represented_company_private_details for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial admin can manage memberships"
on public.represented_company_memberships for all
to authenticated
using (public.is_red_comercial_admin())
with check (public.is_red_comercial_admin());

create policy "red comercial members can read own memberships"
on public.represented_company_memberships for select
to authenticated
using (user_id = (select auth.uid()) and public.is_red_comercial_member());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "company logos are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'company-logos');

create policy "red comercial admin can insert company logos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'company-logos' and public.is_red_comercial_admin());

create policy "red comercial admin can update company logos"
on storage.objects for update
to authenticated
using (bucket_id = 'company-logos' and public.is_red_comercial_admin())
with check (bucket_id = 'company-logos' and public.is_red_comercial_admin());

create policy "red comercial admin can delete company logos"
on storage.objects for delete
to authenticated
using (bucket_id = 'company-logos' and public.is_red_comercial_admin());
