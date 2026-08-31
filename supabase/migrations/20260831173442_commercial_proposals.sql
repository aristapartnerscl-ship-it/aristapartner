create table public.commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_code text not null default ('PROP-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  title text not null,
  description text,
  currency text,
  subtotal numeric(14, 2) not null default 0,
  tax_percentage numeric(5, 2) not null default 0,
  tax_amount numeric(14, 2) generated always as (round(subtotal * tax_percentage / 100, 2)) stored,
  total_amount numeric(14, 2) generated always as (subtotal + round(subtotal * tax_percentage / 100, 2)) stored,
  valid_until date,
  status text not null default 'draft',
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  internal_notes text,
  client_notes text,
  archived_at timestamptz,
  archived_by uuid references public.admin_profiles(id) on delete restrict,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commercial_proposals_status_check check (status in ('draft', 'sent', 'viewed', 'negotiation', 'accepted', 'rejected', 'expired')),
  constraint commercial_proposals_subtotal_check check (subtotal >= 0),
  constraint commercial_proposals_tax_percentage_check check (tax_percentage between 0 and 100),
  constraint commercial_proposals_currency_check check (subtotal = 0 or (currency is not null and length(btrim(currency)) between 3 and 10)),
  constraint commercial_proposals_archived_pair_check check ((archived_at is null and archived_by is null) or (archived_at is not null and archived_by is not null)),
  constraint commercial_proposals_proposal_code_format_check check (proposal_code ~ '^PROP-[0-9]{4}-[0-9A-F]{8}$')
);

create unique index commercial_proposals_proposal_code_uidx on public.commercial_proposals (proposal_code);
create index commercial_proposals_opportunity_id_idx on public.commercial_proposals (opportunity_id);
create index commercial_proposals_status_idx on public.commercial_proposals (status);
create index commercial_proposals_valid_until_idx on public.commercial_proposals (valid_until) where archived_at is null;
create index commercial_proposals_created_at_idx on public.commercial_proposals (created_at desc);
create index commercial_proposals_created_by_idx on public.commercial_proposals (created_by);

create trigger commercial_proposals_set_updated_at
before update on public.commercial_proposals
for each row execute function public.set_updated_at();

alter table public.commercial_proposals enable row level security;
revoke all on public.commercial_proposals from anon, authenticated;
grant select, insert, update on public.commercial_proposals to authenticated;

create policy "active owner can read commercial proposals"
on public.commercial_proposals for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can insert commercial proposals"
on public.commercial_proposals for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can update commercial proposals"
on public.commercial_proposals for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
