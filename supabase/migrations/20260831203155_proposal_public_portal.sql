alter table public.commercial_proposals
  add column accepted_version_id uuid references public.commercial_proposal_versions(id) on delete restrict;

create table public.commercial_proposal_public_links (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete restrict,
  version_id uuid not null,
  token_hash text not null,
  status text not null default 'active',
  expires_at timestamptz,
  created_by uuid not null references public.admin_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0,
  responded_at timestamptz,
  response text,
  response_name text,
  response_email text,
  response_comment text,
  constraint commercial_proposal_public_links_version_fk foreign key (version_id, proposal_id) references public.commercial_proposal_versions(id, proposal_id) on delete restrict,
  constraint commercial_proposal_public_links_token_hash_check check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint commercial_proposal_public_links_status_check check (status in ('active', 'revoked', 'expired', 'responded')),
  constraint commercial_proposal_public_links_response_check check (response is null or response in ('accepted', 'rejected')),
  constraint commercial_proposal_public_links_view_count_check check (view_count >= 0),
  constraint commercial_proposal_public_links_response_pair_check check ((response is null and responded_at is null) or (response is not null and responded_at is not null)),
  constraint commercial_proposal_public_links_revoked_check check ((status = 'revoked') = (revoked_at is not null)),
  constraint commercial_proposal_public_links_identity_check check ((response is null and response_name is null and response_email is null) or (response is not null and length(btrim(response_name)) between 1 and 160 and length(btrim(response_email)) between 3 and 320)),
  constraint commercial_proposal_public_links_email_check check (response_email is null or response_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint commercial_proposal_public_links_comment_length_check check (response_comment is null or length(response_comment) <= 2000)
);

create unique index commercial_proposal_public_links_token_hash_uidx on public.commercial_proposal_public_links(token_hash);
create index commercial_proposal_public_links_proposal_created_idx on public.commercial_proposal_public_links(proposal_id, created_at desc);
create index commercial_proposal_public_links_version_idx on public.commercial_proposal_public_links(version_id);
create index commercial_proposal_public_links_active_idx on public.commercial_proposal_public_links(proposal_id, created_at desc) where status = 'active';

alter table public.commercial_proposal_public_links enable row level security;
revoke all on public.commercial_proposal_public_links from anon, authenticated;
grant select, insert, update on public.commercial_proposal_public_links to authenticated;

create policy "active owner can read commercial proposal public links"
on public.commercial_proposal_public_links for select to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can insert commercial proposal public links"
on public.commercial_proposal_public_links for insert to authenticated
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can update commercial proposal public links"
on public.commercial_proposal_public_links for update to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

-- These SECURITY DEFINER functions are intentionally narrow public endpoints: they never expose table rows,
-- accept only a token hash, and return a sanitized snapshot instead of internal CRM columns.
create or replace function public.resolve_commercial_proposal_public_link(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  link public.commercial_proposal_public_links;
  version public.commercial_proposal_versions;
  proposal public.commercial_proposals;
  contact public.contacts;
  organization public.organization_settings;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  select l.* into link from public.commercial_proposal_public_links l
  where l.token_hash = p_token_hash and l.status in ('active', 'responded')
  for update;
  if not found then return null; end if;
  if link.status = 'active' and link.expires_at is not null and link.expires_at <= now() then
    update public.commercial_proposal_public_links set status = 'expired' where id = link.id;
    return null;
  end if;

  select v.* into version from public.commercial_proposal_versions v where v.id = link.version_id and v.proposal_id = link.proposal_id;
  select p.* into proposal from public.commercial_proposals p where p.id = link.proposal_id;
  if not found then return null; end if;
  if proposal.status in ('expired', 'archived') then return null; end if;
  select c.* into contact from public.contacts c where c.id = proposal.contact_id;
  select s.* into organization from public.organization_settings s order by s.created_at asc limit 1;

  if link.status = 'active' then
    update public.commercial_proposal_public_links
    set first_viewed_at = coalesce(first_viewed_at, now()), last_viewed_at = now(), view_count = view_count + 1
    where id = link.id;
    if proposal.status = 'sent' then
      update public.commercial_proposals set status = 'viewed', viewed_at = coalesce(viewed_at, now()) where id = proposal.id and status = 'sent';
    end if;
  end if;

  return jsonb_build_object(
    'status', link.status,
    'response', link.response,
    'response_name', link.response_name,
    'response_email', link.response_email,
    'response_comment', link.response_comment,
    'responded_at', link.responded_at,
    'code', version.snapshot_data ->> 'proposal_code',
    'version', version.version_number,
    'issued_at', version.created_at,
    'valid_until', version.valid_until,
    'title', version.title,
    'description', version.description,
    'currency', version.currency,
    'subtotal', version.subtotal,
    'tax_percentage', version.tax_percentage,
    'tax_amount', version.tax_amount,
    'total_amount', version.total_amount,
    'client_notes', version.client_notes,
    'counterparty_name', coalesce(contact.company_name, contact.full_name),
    'contact_name', contact.full_name,
    'opportunity_title', (select o.title from public.opportunities o where o.id = proposal.opportunity_id),
    'opportunity_type', (select o.opportunity_type from public.opportunities o where o.id = proposal.opportunity_id),
    'organization', jsonb_build_object(
      'display_name', organization.display_name,
      'legal_name', organization.legal_name,
      'public_email', organization.public_email,
      'public_phone', organization.public_phone,
      'website_url', organization.website_url,
      'address_line', organization.address_line,
      'city_region', organization.city_region,
      'country_code', organization.country_code
    )
  );
end;
$$;

create or replace function public.respond_commercial_proposal_public_link(
  p_token_hash text,
  p_response text,
  p_response_name text,
  p_response_email text,
  p_response_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  link public.commercial_proposal_public_links;
  proposal public.commercial_proposals;
  version public.commercial_proposal_versions;
  clean_name text := btrim(coalesce(p_response_name, ''));
  clean_email text := lower(btrim(coalesce(p_response_email, '')));
  clean_comment text := nullif(btrim(coalesce(p_response_comment, '')), '');
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' or p_response not in ('accepted', 'rejected') or length(clean_name) not between 1 and 160 or clean_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(clean_email) > 320 or length(coalesce(clean_comment, '')) > 2000 then
    return jsonb_build_object('ok', false, 'message', 'Esta propuesta no está disponible.');
  end if;
  select l.* into link from public.commercial_proposal_public_links l where l.token_hash = p_token_hash and l.status = 'active' for update;
  if not found or (link.expires_at is not null and link.expires_at <= now()) then return jsonb_build_object('ok', false, 'message', 'Esta propuesta no está disponible.'); end if;
  select p.* into proposal from public.commercial_proposals p where p.id = link.proposal_id for update;
  if not found or proposal.status in ('accepted', 'rejected', 'expired', 'archived') then return jsonb_build_object('ok', false, 'message', 'Esta propuesta no está disponible.'); end if;
  select v.* into version from public.commercial_proposal_versions v where v.id = link.version_id and v.proposal_id = link.proposal_id;
  if not found then return jsonb_build_object('ok', false, 'message', 'Esta propuesta no está disponible.'); end if;

  update public.commercial_proposal_public_links set status = 'responded', responded_at = now(), response = p_response, response_name = clean_name, response_email = clean_email, response_comment = clean_comment where id = link.id;
  update public.commercial_proposals set status = p_response, accepted_at = case when p_response = 'accepted' then now() else null end, rejected_at = case when p_response = 'rejected' then now() else null end, accepted_version_id = case when p_response = 'accepted' then link.version_id else null end where id = proposal.id;
  return jsonb_build_object('ok', true, 'response', p_response, 'version', version.version_number);
end;
$$;

revoke execute on function public.resolve_commercial_proposal_public_link(text) from public, anon, authenticated;
revoke execute on function public.respond_commercial_proposal_public_link(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.resolve_commercial_proposal_public_link(text) to anon;
grant execute on function public.respond_commercial_proposal_public_link(text, text, text, text, text) to anon;
