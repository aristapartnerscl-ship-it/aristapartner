alter table public.inquiries
  add column converted_opportunity_id uuid;

comment on column public.inquiries.converted_opportunity_id is
  'Preserves traceability between an inquiry and the opportunity created from it. Not every opportunity must originate from an inquiry.';

-- Historical converted inquiries created before this link existed cannot be matched safely.
-- They are normalized back to replied so they can be converted again through the controlled application flow.
update public.inquiries
set status = 'replied'
where status = 'converted'
  and converted_opportunity_id is null;

alter table public.inquiries
  add constraint inquiries_converted_opportunity_fk
  foreign key (converted_opportunity_id)
  references public.opportunities(id)
  on delete restrict,
  add constraint inquiries_conversion_link_status_check check (
    (status = 'converted' and converted_opportunity_id is not null)
    or (status <> 'converted' and converted_opportunity_id is null)
  );

create index inquiries_converted_opportunity_id_idx
  on public.inquiries (converted_opportunity_id);

-- A single opportunity should be produced by at most one inquiry conversion.
-- This does not prevent the opportunity from keeping its normal contact, supplier, activity, or agreement relations.
create unique index inquiries_converted_opportunity_id_unique_idx
  on public.inquiries (converted_opportunity_id)
  where converted_opportunity_id is not null;

comment on table public.inquiries is
  'General contact inquiries from the public site after digital reception is enabled. Historical converted inquiries without a conversion link are normalized to replied before enforcing conversion traceability.';
