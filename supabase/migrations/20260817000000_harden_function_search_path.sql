-- Harden trigger helper functions reported by Supabase Advisors as having a mutable search_path.
-- This migration must run after the migrations that create both functions.
-- It does not change RLS, grants, roles, data, or trigger compatibility.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_organization_settings_audit_fields()
returns trigger
language plpgsql
set search_path = public, auth
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

comment on function public.set_updated_at() is
  'Maintains updated_at timestamps with an explicit search_path for safer trigger execution.';

comment on function public.set_organization_settings_audit_fields() is
  'Sets organization settings audit fields from the authenticated user context with an explicit search_path.';
