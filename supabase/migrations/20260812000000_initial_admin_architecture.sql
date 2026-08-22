-- Arista Partners initial private-panel schema.
-- Created as a versioned migration file. It has not been applied to any remote database.
-- Supabase CLI was not available in this environment; validate filename with `supabase migration new`
-- when initializing Supabase locally.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Reusable trigger helper for updated_at columns.';

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_role_check check (role in ('owner'))
);

comment on table public.admin_profiles is 'Authorized users for the private Arista admin panel. Do not auto-create from public signup.';

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  contact_type text not null,
  full_name text,
  company_name text,
  position text,
  email text,
  phone text,
  website text,
  social_media text,
  country text,
  region text,
  city text,
  notes text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete set null,
  constraint contacts_contact_type_check check (contact_type in ('person', 'company'))
);

comment on table public.contacts is 'People and organizations related to commercial opportunities.';

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  opportunity_type text not null,
  title text not null,
  description text,
  contact_id uuid references public.contacts(id) on delete restrict,
  status text not null default 'new',
  priority text not null default 'medium',
  source text,
  estimated_value numeric(14,2),
  currency text,
  expected_date date,
  country text,
  region text,
  city text,
  internal_notes text,
  rejection_reason text,
  assigned_to uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete set null,
  constraint opportunities_type_check check (opportunity_type in ('buy', 'sell')),
  constraint opportunities_status_check check (
    status in (
      'new',
      'under_review',
      'information_requested',
      'accepted',
      'active',
      'negotiating',
      'won',
      'lost',
      'rejected',
      'archived'
    )
  ),
  constraint opportunities_priority_check check (priority in ('low', 'medium', 'high')),
  constraint opportunities_estimated_value_check check (estimated_value is null or estimated_value >= 0)
);

comment on table public.opportunities is 'Buy and sell opportunity records. Status won represents commercial result, not commission collection.';

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete restrict,
  business_name text not null,
  legal_name text,
  tax_id text,
  description text,
  categories text[] not null default '{}',
  geographic_coverage text,
  supply_capacity text,
  minimum_order numeric(14,2),
  minimum_order_currency text,
  issues_invoice boolean,
  commercial_terms text,
  status text not null default 'pending',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete set null,
  constraint suppliers_status_check check (status in ('pending', 'under_review', 'approved', 'inactive', 'rejected', 'archived')),
  constraint suppliers_minimum_order_check check (minimum_order is null or minimum_order >= 0)
);

comment on table public.suppliers is 'Supplier profiles considered for future commercial needs.';

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete restrict,
  subject text not null,
  reason text,
  message text not null,
  preferred_contact_method text,
  status text not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  assigned_to uuid references public.admin_profiles(id) on delete set null,
  constraint inquiries_status_check check (status in ('new', 'read', 'replied', 'converted', 'archived'))
);

comment on table public.inquiries is 'General contact inquiries from the public site after digital reception is enabled.';

create table public.opportunity_suppliers (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status text not null default 'identified',
  notes text,
  proposed_amount numeric(14,2),
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunity_suppliers_unique unique (opportunity_id, supplier_id),
  constraint opportunity_suppliers_status_check check (
    status in (
      'identified',
      'contacted',
      'information_requested',
      'quoted',
      'shortlisted',
      'selected',
      'discarded'
    )
  ),
  constraint opportunity_suppliers_amount_check check (proposed_amount is null or proposed_amount >= 0)
);

comment on table public.opportunity_suppliers is 'Suppliers considered for buy opportunities. Unique pair prevents duplicate evaluation records.';

create table public.opportunity_activities (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  activity_type text not null,
  title text not null,
  description text,
  occurred_at timestamptz not null default now(),
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete set null,
  constraint opportunity_activities_type_check check (
    activity_type in ('note', 'call', 'email', 'meeting', 'proposal', 'quotation', 'status_change', 'follow_up')
  )
);

comment on table public.opportunity_activities is 'Chronological activity log for commercial follow-up.';

create table public.commercial_agreements (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  compensation_model text not null,
  management_fee numeric(14,2),
  commission_type text,
  commission_value numeric(14,2),
  currency text,
  attribution_start date,
  attribution_end date,
  agreement_status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete set null,
  constraint commercial_agreements_model_check check (compensation_model in ('management_fee', 'commission', 'mixed')),
  constraint commercial_agreements_commission_type_check check (
    commission_type is null or commission_type in ('percentage', 'fixed_amount')
  ),
  constraint commercial_agreements_status_check check (
    agreement_status in ('draft', 'proposed', 'accepted', 'expired', 'terminated')
  ),
  constraint commercial_agreements_amounts_check check (
    (management_fee is null or management_fee >= 0)
    and (commission_value is null or commission_value >= 0)
  ),
  constraint commercial_agreements_percentage_check check (
    commission_type is null
    or commission_type <> 'percentage'
    or (commission_value is not null and commission_value between 0 and 100)
  )
);

comment on table public.commercial_agreements is 'Administrative record of agreed commercial terms with Arista; it does not replace a signed contract.';

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null,
  payload jsonb not null,
  status text not null default 'received',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.admin_profiles(id) on delete set null,
  converted_entity_type text,
  converted_entity_id uuid,
  source_ip_hash text,
  user_agent text,
  consent_contact boolean not null default false,
  consent_marketing boolean not null default false,
  privacy_version text,
  constraint form_submissions_type_check check (submission_type in ('buy', 'sell', 'supplier', 'contact')),
  constraint form_submissions_status_check check (status in ('received', 'under_review', 'converted', 'rejected', 'spam', 'archived')),
  constraint form_submissions_source_ip_hash_null_check check (source_ip_hash is null)
);

comment on table public.form_submissions is 'Temporary reception area for public forms. Public insert is intentionally disabled in this phase.';
comment on column public.form_submissions.source_ip_hash is 'Reserved for a future legal and technical decision; must remain null in this phase.';

create trigger admin_profiles_set_updated_at before update on public.admin_profiles
for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities
for each row execute function public.set_updated_at();
create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries
for each row execute function public.set_updated_at();
create trigger opportunity_suppliers_set_updated_at before update on public.opportunity_suppliers
for each row execute function public.set_updated_at();
create trigger commercial_agreements_set_updated_at before update on public.commercial_agreements
for each row execute function public.set_updated_at();

create index admin_profiles_active_owner_idx on public.admin_profiles (id) where is_active = true and role = 'owner';
create index contacts_contact_type_idx on public.contacts (contact_type);
create index contacts_email_idx on public.contacts (email);
create index contacts_company_name_idx on public.contacts (company_name);
create index contacts_created_by_idx on public.contacts (created_by);
create index opportunities_contact_id_idx on public.opportunities (contact_id);
create index opportunities_status_idx on public.opportunities (status);
create index opportunities_type_status_idx on public.opportunities (opportunity_type, status);
create index opportunities_priority_idx on public.opportunities (priority);
create index opportunities_expected_date_idx on public.opportunities (expected_date);
create index opportunities_assigned_to_idx on public.opportunities (assigned_to);
create index opportunities_created_by_idx on public.opportunities (created_by);
create index suppliers_contact_id_idx on public.suppliers (contact_id);
create index suppliers_status_idx on public.suppliers (status);
create index suppliers_categories_idx on public.suppliers using gin (categories);
create index suppliers_created_by_idx on public.suppliers (created_by);
create index inquiries_contact_id_idx on public.inquiries (contact_id);
create index inquiries_status_idx on public.inquiries (status);
create index inquiries_assigned_to_idx on public.inquiries (assigned_to);
create index opportunity_suppliers_opportunity_id_idx on public.opportunity_suppliers (opportunity_id);
create index opportunity_suppliers_supplier_id_idx on public.opportunity_suppliers (supplier_id);
create index opportunity_suppliers_status_idx on public.opportunity_suppliers (status);
create index opportunity_activities_opportunity_id_idx on public.opportunity_activities (opportunity_id);
create index opportunity_activities_type_idx on public.opportunity_activities (activity_type);
create index opportunity_activities_next_action_at_idx on public.opportunity_activities (next_action_at);
create index opportunity_activities_created_by_idx on public.opportunity_activities (created_by);
create index commercial_agreements_opportunity_id_idx on public.commercial_agreements (opportunity_id);
create index commercial_agreements_status_idx on public.commercial_agreements (agreement_status);
create index commercial_agreements_model_idx on public.commercial_agreements (compensation_model);
create index commercial_agreements_created_by_idx on public.commercial_agreements (created_by);
create index form_submissions_type_status_idx on public.form_submissions (submission_type, status);
create index form_submissions_submitted_at_idx on public.form_submissions (submitted_at);
create index form_submissions_reviewed_by_idx on public.form_submissions (reviewed_by);

alter table public.admin_profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;
alter table public.suppliers enable row level security;
alter table public.inquiries enable row level security;
alter table public.opportunity_suppliers enable row level security;
alter table public.opportunity_activities enable row level security;
alter table public.commercial_agreements enable row level security;
alter table public.form_submissions enable row level security;

revoke all on public.admin_profiles from anon, authenticated;
revoke all on public.contacts from anon, authenticated;
revoke all on public.opportunities from anon, authenticated;
revoke all on public.suppliers from anon, authenticated;
revoke all on public.inquiries from anon, authenticated;
revoke all on public.opportunity_suppliers from anon, authenticated;
revoke all on public.opportunity_activities from anon, authenticated;
revoke all on public.commercial_agreements from anon, authenticated;
revoke all on public.form_submissions from anon, authenticated;

-- GRANT controls Data API access to tables. RLS below still controls row authorization.
-- DELETE is intentionally not granted in this phase; records should be archived instead of removed.
grant select, update on public.admin_profiles to authenticated;
grant select, insert, update on public.contacts to authenticated;
grant select, insert, update on public.opportunities to authenticated;
grant select, insert, update on public.suppliers to authenticated;
grant select, insert, update on public.inquiries to authenticated;
grant select, insert, update on public.opportunity_suppliers to authenticated;
grant select, insert, update on public.opportunity_activities to authenticated;
grant select, insert, update on public.commercial_agreements to authenticated;
grant select, insert, update on public.form_submissions to authenticated;

create policy "active owner can read own admin profile"
on public.admin_profiles for select
to authenticated
using (id = (select auth.uid()) and is_active = true and role = 'owner');

create policy "active owner can update own admin profile"
on public.admin_profiles for update
to authenticated
using (id = (select auth.uid()) and is_active = true and role = 'owner')
with check (id = (select auth.uid()) and is_active = true and role = 'owner');

create policy "active owner can read contacts"
on public.contacts for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert contacts"
on public.contacts for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update contacts"
on public.contacts for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can read opportunities"
on public.opportunities for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert opportunities"
on public.opportunities for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update opportunities"
on public.opportunities for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can read suppliers"
on public.suppliers for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert suppliers"
on public.suppliers for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update suppliers"
on public.suppliers for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read inquiries"
on public.inquiries for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert inquiries"
on public.inquiries for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update inquiries"
on public.inquiries for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read opportunity suppliers"
on public.opportunity_suppliers for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert opportunity suppliers"
on public.opportunity_suppliers for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update opportunity suppliers"
on public.opportunity_suppliers for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read opportunity activities"
on public.opportunity_activities for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert opportunity activities"
on public.opportunity_activities for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update opportunity activities"
on public.opportunity_activities for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read commercial agreements"
on public.commercial_agreements for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert commercial agreements"
on public.commercial_agreements for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update commercial agreements"
on public.commercial_agreements for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read form submissions"
on public.form_submissions for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can insert form submissions"
on public.form_submissions for insert
to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
create policy "active owner can update form submissions"
on public.form_submissions for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));
