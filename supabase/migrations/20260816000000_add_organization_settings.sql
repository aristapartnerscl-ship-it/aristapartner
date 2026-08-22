begin;

create table public.organization_settings (
  singleton_key text primary key default 'arista_partners',
  display_name text not null default 'Arista Partners',
  legal_name text,
  tax_identifier text,
  public_email text,
  public_phone text,
  website_url text,
  address_line text,
  city_region text,
  country_code text not null default 'CL',
  timezone text not null default 'America/Santiago',
  locale text not null default 'es-CL',
  default_currency text not null default 'CLP',
  default_opportunity_priority text not null default 'medium',
  default_follow_up_days integer not null default 0,
  default_attribution_days integer not null default 0,
  default_commission_type text,
  default_commission_value numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.admin_profiles(id) on delete restrict,
  updated_by uuid references public.admin_profiles(id) on delete restrict,
  constraint organization_settings_singleton_key_check
    check (singleton_key = 'arista_partners'),
  constraint organization_settings_country_code_check
    check (country_code ~ '^[A-Z]{2}$'),
  constraint organization_settings_default_currency_check
    check (default_currency ~ '^[A-Z]{3}$'),
  constraint organization_settings_locale_check
    check (locale ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  constraint organization_settings_follow_up_days_check
    check (default_follow_up_days between 0 and 365),
  constraint organization_settings_attribution_days_check
    check (default_attribution_days between 0 and 3650),
  constraint organization_settings_default_priority_check
    check (default_opportunity_priority in ('low', 'medium', 'high')),
  constraint organization_settings_default_commission_type_check
    check (default_commission_type is null or default_commission_type in ('percentage', 'fixed_amount')),
  constraint organization_settings_default_commission_value_check
    check (
      (default_commission_type is null and default_commission_value is null)
      or (default_commission_type = 'percentage' and default_commission_value is not null and default_commission_value between 0 and 100)
      or (default_commission_type = 'fixed_amount' and default_commission_value is not null and default_commission_value >= 0)
    ),
  constraint organization_settings_website_url_check
    check (website_url is null or website_url like 'https://%'),
  constraint organization_settings_public_email_check
    check (public_email is null or public_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.organization_settings is
  'Singleton operational configuration for Arista Partners. This table stores public corporate settings and safe defaults only; credentials, API keys, tokens, banking data, and security policy switches must never be stored here.';
comment on column public.organization_settings.singleton_key is
  'Fixed singleton key. The CHECK constraint allows only arista_partners, preventing multiple organization settings rows.';
comment on column public.organization_settings.display_name is
  'Public display name for the organization.';
comment on column public.organization_settings.legal_name is
  'Legal name, configured later by the owner when confirmed.';
comment on column public.organization_settings.tax_identifier is
  'Tax identifier, configured later by the owner when confirmed.';
comment on column public.organization_settings.public_email is
  'Public contact email shown by administrative or public views when enabled.';
comment on column public.organization_settings.public_phone is
  'Public contact phone shown by administrative or public views when enabled.';
comment on column public.organization_settings.website_url is
  'Canonical public website URL. It must be HTTPS when present.';
comment on column public.organization_settings.address_line is
  'Public address line, configured only when appropriate.';
comment on column public.organization_settings.city_region is
  'Public city or region label.';
comment on column public.organization_settings.country_code is
  'Two-letter ISO-style country code used as the operational default.';
comment on column public.organization_settings.timezone is
  'Operational timezone used for administrative defaults.';
comment on column public.organization_settings.locale is
  'Operational locale used for formatting defaults.';
comment on column public.organization_settings.default_currency is
  'Three-letter currency code used as the default currency.';
comment on column public.organization_settings.default_opportunity_priority is
  'Default priority for opportunities, matching opportunities.priority values.';
comment on column public.organization_settings.default_follow_up_days is
  'Default number of days for follow-up suggestions. Zero means no automatic offset.';
comment on column public.organization_settings.default_attribution_days is
  'Default attribution window for commercial agreements. Zero means no automatic attribution window.';
comment on column public.organization_settings.default_commission_type is
  'Default commission type, matching commercial_agreements.commission_type values when configured.';
comment on column public.organization_settings.default_commission_value is
  'Default commission percentage or fixed amount. Required only when a default commission type is configured.';
comment on column public.organization_settings.created_at is
  'Timestamp when the singleton settings row was created.';
comment on column public.organization_settings.updated_at is
  'Timestamp updated automatically on each settings update.';
comment on column public.organization_settings.created_by is
  'Administrator who created the row through the authenticated panel. The initial migration row is allowed to remain null because it is system-created.';
comment on column public.organization_settings.updated_by is
  'Administrator who last updated the row through the authenticated panel. The first owner save will populate this field.';

create function public.set_organization_settings_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = (select auth.uid());
    new.updated_by = (select auth.uid());
  elsif tg_op = 'UPDATE' then
    new.created_by = old.created_by;
    new.updated_by = (select auth.uid());
  end if;

  return new;
end;
$$;

comment on function public.set_organization_settings_audit_fields() is
  'Sets organization settings audit fields from the authenticated user context without trusting frontend-provided audit identifiers.';

create trigger organization_settings_set_audit_fields
before insert or update on public.organization_settings
for each row execute function public.set_organization_settings_audit_fields();

create trigger organization_settings_set_updated_at
before update on public.organization_settings
for each row execute function public.set_updated_at();

insert into public.organization_settings (
  singleton_key,
  display_name,
  country_code,
  timezone,
  locale,
  default_currency,
  default_opportunity_priority,
  default_follow_up_days,
  default_attribution_days
) values (
  'arista_partners',
  'Arista Partners',
  'CL',
  'America/Santiago',
  'es-CL',
  'CLP',
  'medium',
  0,
  0
);

comment on column public.organization_settings.created_by is
  'Administrator who created the row through the authenticated panel. The initial migration row remains null because it is system-created and does not invent an administrator.';

alter table public.organization_settings enable row level security;

revoke all on public.organization_settings from anon, authenticated;

grant select, insert, update on public.organization_settings to authenticated;

create policy "active owner can read organization settings"
on public.organization_settings for select
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'));

create policy "active owner can insert organization settings"
on public.organization_settings for insert
to authenticated
with check (
  singleton_key = 'arista_partners'
  and exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner')
);

create policy "active owner can update organization settings"
on public.organization_settings for update
to authenticated
using (exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner'))
with check (
  singleton_key = 'arista_partners'
  and exists (select 1 from public.admin_profiles ap where ap.id = (select auth.uid()) and ap.is_active = true and ap.role = 'owner')
);

commit;
