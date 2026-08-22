begin;

alter table public.commercial_agreements
  add column agreement_code text,
  add column counterparty_type text,
  add column contact_id uuid,
  add column supplier_id uuid,
  add column payer_type text,
  add column archived_at timestamptz,
  add column archived_by uuid;

comment on column public.commercial_agreements.agreement_code is
  'Unique readable commercial agreement code. Existing rows are backfilled deterministically from their UUID and future rows receive a random non-count-based code.';
comment on column public.commercial_agreements.counterparty_type is
  'Identifies whether the agreement counterparty is a contact or supplier. Nullable during the transition for historical rows that cannot be inferred safely.';
comment on column public.commercial_agreements.contact_id is
  'Contact counterparty for agreements where counterparty_type = contact. References contacts without cascade deletes.';
comment on column public.commercial_agreements.supplier_id is
  'Supplier counterparty for agreements where counterparty_type = supplier. References suppliers without cascade deletes.';
comment on column public.commercial_agreements.payer_type is
  'Commercial party responsible for paying the commission: buyer, seller, supplier, both, or other. Nullable until reviewed explicitly.';
comment on column public.commercial_agreements.archived_at is
  'Administrative archive timestamp for the agreement. This does not replace agreement_status or represent contractual termination.';
comment on column public.commercial_agreements.archived_by is
  'Administrator who archived the agreement. Must be present when archived_at is present.';

-- Existing agreement codes are deterministic and use only the agreement UUID; no row counts or personal data are used.
update public.commercial_agreements
set agreement_code = 'ARI-AGR-' || upper(replace(id::text, '-', ''))
where agreement_code is null;

-- Historical counterparties can only be normalized when the linked opportunity has a direct contact_id.
-- Supplier counterparties are not inferred from text, notes, opportunity titles, or opportunity_suppliers.
update public.commercial_agreements ca
set
  counterparty_type = 'contact',
  contact_id = o.contact_id
from public.opportunities o
where ca.opportunity_id = o.id
  and o.contact_id is not null
  and ca.counterparty_type is null
  and ca.contact_id is null
  and ca.supplier_id is null;

alter table public.commercial_agreements
  alter column agreement_code set not null,
  alter column agreement_code set default ('ARI-AGR-' || upper(replace(gen_random_uuid()::text, '-', '')));

alter table public.commercial_agreements
  add constraint commercial_agreements_agreement_code_format_check
    check (agreement_code ~ '^ARI-AGR-[0-9A-F]{32}$'),
  add constraint commercial_agreements_agreement_code_unique
    unique (agreement_code),
  add constraint commercial_agreements_counterparty_type_check
    check (counterparty_type is null or counterparty_type in ('contact', 'supplier')),
  add constraint commercial_agreements_counterparty_consistency_check
    check (
      (counterparty_type is null and contact_id is null and supplier_id is null)
      or (counterparty_type = 'contact' and contact_id is not null and supplier_id is null)
      or (counterparty_type = 'supplier' and supplier_id is not null and contact_id is null)
    ),
  add constraint commercial_agreements_payer_type_check
    check (payer_type is null or payer_type in ('buyer', 'seller', 'supplier', 'both', 'other')),
  add constraint commercial_agreements_archived_pair_check
    check ((archived_at is null and archived_by is null) or (archived_at is not null and archived_by is not null)),
  add constraint commercial_agreements_contact_id_fkey
    foreign key (contact_id) references public.contacts(id) on delete restrict,
  add constraint commercial_agreements_supplier_id_fkey
    foreign key (supplier_id) references public.suppliers(id) on delete restrict,
  add constraint commercial_agreements_archived_by_fkey
    foreign key (archived_by) references public.admin_profiles(id) on delete restrict;

create index commercial_agreements_contact_id_idx
  on public.commercial_agreements (contact_id)
  where contact_id is not null;

create index commercial_agreements_supplier_id_idx
  on public.commercial_agreements (supplier_id)
  where supplier_id is not null;

create index commercial_agreements_payer_type_idx
  on public.commercial_agreements (payer_type)
  where payer_type is not null;

create index commercial_agreements_active_opportunity_idx
  on public.commercial_agreements (opportunity_id, updated_at desc)
  where archived_at is null;

commit;
