create table public.commercial_proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete restrict,
  version_number integer not null,
  title text not null,
  description text,
  currency text,
  subtotal numeric(14, 2) not null,
  tax_percentage numeric(5, 2) not null,
  tax_amount numeric(14, 2) not null,
  total_amount numeric(14, 2) not null,
  valid_until date,
  client_notes text,
  snapshot_data jsonb not null,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint commercial_proposal_versions_number_check check (version_number > 0),
  constraint commercial_proposal_versions_amounts_check check (subtotal >= 0 and tax_percentage between 0 and 100 and tax_amount >= 0 and total_amount >= subtotal),
  constraint commercial_proposal_versions_snapshot_object_check check (jsonb_typeof(snapshot_data) = 'object'),
  constraint commercial_proposal_versions_proposal_number_key unique (proposal_id, version_number),
  constraint commercial_proposal_versions_id_proposal_key unique (id, proposal_id)
);

create table public.commercial_proposal_documents (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete restrict,
  version_id uuid not null,
  document_type text not null default 'pdf',
  file_name text not null,
  generated_at timestamptz not null default now(),
  generated_by uuid not null references public.admin_profiles(id) on delete restrict,
  constraint commercial_proposal_documents_type_check check (document_type = 'pdf'),
  constraint commercial_proposal_documents_file_name_check check (length(btrim(file_name)) between 1 and 255),
  constraint commercial_proposal_documents_version_fk foreign key (version_id, proposal_id) references public.commercial_proposal_versions(id, proposal_id) on delete restrict
);

create index commercial_proposal_versions_proposal_created_idx on public.commercial_proposal_versions (proposal_id, created_at desc);
create index commercial_proposal_versions_created_by_idx on public.commercial_proposal_versions (created_by);
create index commercial_proposal_documents_proposal_generated_idx on public.commercial_proposal_documents (proposal_id, generated_at desc);
create index commercial_proposal_documents_version_idx on public.commercial_proposal_documents (version_id);

alter table public.commercial_proposal_versions enable row level security;
alter table public.commercial_proposal_documents enable row level security;

revoke all on public.commercial_proposal_versions from anon, authenticated;
revoke all on public.commercial_proposal_documents from anon, authenticated;
grant select, insert on public.commercial_proposal_versions to authenticated;
grant select, insert on public.commercial_proposal_documents to authenticated;

create policy "active owner can read commercial proposal versions"
on public.commercial_proposal_versions for select to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can insert commercial proposal versions"
on public.commercial_proposal_versions for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can read commercial proposal documents"
on public.commercial_proposal_documents for select to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can insert commercial proposal documents"
on public.commercial_proposal_documents for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create or replace function public.create_commercial_proposal_version(p_proposal_id uuid)
returns public.commercial_proposal_versions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  proposal public.commercial_proposals;
  created_version public.commercial_proposal_versions;
  next_version integer;
begin
  if (select auth.uid()) is null or not exists (
    select 1 from public.admin_profiles ap
    where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'
  ) then
    raise exception 'No autorizado';
  end if;

  select * into proposal from public.commercial_proposals
  where id = p_proposal_id and archived_at is null
  for update;
  if not found then raise exception 'Propuesta no disponible'; end if;

  select coalesce(max(v.version_number), 0) + 1 into next_version
  from public.commercial_proposal_versions v where v.proposal_id = proposal.id;

  insert into public.commercial_proposal_versions (
    proposal_id, version_number, title, description, currency, subtotal,
    tax_percentage, tax_amount, total_amount, valid_until, client_notes,
    snapshot_data, created_by
  ) values (
    proposal.id, next_version, proposal.title, proposal.description, proposal.currency,
    proposal.subtotal, proposal.tax_percentage, proposal.tax_amount, proposal.total_amount,
    proposal.valid_until, proposal.client_notes,
    jsonb_build_object(
      'proposal_code', proposal.proposal_code,
      'title', proposal.title,
      'description', proposal.description,
      'currency', proposal.currency,
      'subtotal', proposal.subtotal,
      'tax_percentage', proposal.tax_percentage,
      'tax_amount', proposal.tax_amount,
      'total_amount', proposal.total_amount,
      'valid_until', proposal.valid_until,
      'client_notes', proposal.client_notes
    ),
    (select auth.uid())
  ) returning * into created_version;
  return created_version;
end;
$$;

revoke execute on function public.create_commercial_proposal_version(uuid) from public, anon;
grant execute on function public.create_commercial_proposal_version(uuid) to authenticated;
