import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261004003015_red_comercial_cross_opportunities_global.sql?raw'

describe('red comercial cross opportunities global migration', () => {
  test('reuses the existing cross opportunities table and adds conversion traceability', () => {
    expect(migration).not.toContain('create table public.represented_company_cross_opportunities')
    expect(migration).toContain('alter table public.represented_company_cross_opportunities')
    expect(migration).toContain('converted_prospect_id uuid references public.represented_company_prospects')
    expect(migration).toContain('converted_at timestamptz')
    expect(migration).toContain('converted_by uuid references public.admin_profiles')
    expect(migration).toContain('discard_reason text')
  })

  test('creates the global RPC surface', () => {
    expect(migration).toContain('public.list_red_comercial_cross_opportunities')
    expect(migration).toContain('public.get_red_comercial_cross_opportunity_metrics')
    expect(migration).toContain('public.get_red_comercial_cross_opportunity_detail')
    expect(migration).toContain('public.update_red_comercial_cross_opportunity')
    expect(migration).toContain('public.assign_red_comercial_cross_opportunity')
    expect(migration).toContain('public.convert_red_comercial_cross_opportunity')
    expect(migration).toContain('public.discard_red_comercial_cross_opportunity')
  })

  test('scopes collaborator visibility to detected or assigned records', () => {
    expect(migration).toContain('(v_is_admin or c.detected_by = v_user_id or c.assigned_to = v_user_id)')
    expect(migration).toContain('(c.detected_by = (select auth.uid()) or c.assigned_to = (select auth.uid()))')
  })

  test('requires destination membership for assignment', () => {
    expect(migration).toContain('not public.red_comercial_is_company_member(v_cross.target_represented_company_id, p_assigned_to)')
    expect(migration).toContain('AP_INVALID_ASSIGNEE')
  })

  test('conversion is admin-only and does not copy private contact data', () => {
    expect(migration).toContain('if not public.is_red_comercial_admin() then')
    expect(migration).toContain('AP_ADMIN_REQUIRED')
    const convertBody = migration.slice(migration.indexOf('create or replace function public.convert_red_comercial_cross_opportunity'), migration.indexOf('create or replace function public.discard_red_comercial_cross_opportunity'))
    expect(convertBody).toContain('for update')
    expect(convertBody).toContain('v_source.website_url')
    expect(convertBody).toContain('v_source.domain')
    expect(convertBody).not.toContain('contact_email')
    expect(convertBody).not.toContain('contact_phone')
    expect(convertBody).not.toContain('contact_name')
  })

  test('conversion links duplicate destination prospect instead of deleting or duplicating blindly', () => {
    expect(migration).toContain('select p.id into v_existing_id')
    expect(migration).toContain('converted_prospect_id = v_new_id')
    expect(migration).not.toContain('delete from public.represented_company_cross_opportunities')
  })
})
