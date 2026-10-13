import { describe, expect, it } from 'vitest'
import migration from '../../supabase/migrations/20261017000000_red_comercial_economics.sql?raw'

describe('red comercial economic model', () => {
  it('keeps sale value, Arista commission, tax, total, and collaborator amount separate', () => {
    expect(migration).toContain('arista_commission_net_amount')
    expect(migration).toContain('commission_tax_amount')
    expect(migration).toContain('commission_total_amount')
    expect(migration).toContain('collaborator_commission_amount')
    expect(migration).toContain("v_net * v_tax_rate / 100")
    expect(migration).toContain("v_net + v_tax")
  })

  it('supports percentage and fixed commission terms with explicit collaborator base', () => {
    expect(migration).toContain("arista_commission_type in ('percentage', 'fixed_amount')")
    expect(migration).toContain("collaborator_compensation_base in ('arista_commission', 'sale_net_amount')")
    expect(migration).toContain("v_type = 'percentage'")
    expect(migration).toContain("v_type = 'fixed_amount'")
    expect(migration).toContain('REDCOM_ECONOMICS_INVALID_BASE')
  })

  it('takes an accepted agreement as a close snapshot without backfilling old opportunities', () => {
    expect(migration).toContain("agreement_status = 'accepted'")
    expect(migration).toContain("economic_source = case when v_agreement_type is not null then 'agreement'")
    expect(migration).toContain('economic_updated_by')
    expect(migration).not.toContain('update public.represented_company_opportunities set arista_commission')
  })

  it('sanitizes Arista financial values from collaborator economics payloads', () => {
    expect(migration).toContain("if not v_is_admin and v_opportunity.attributed_collaborator_id is distinct from v_user_id")
    expect(migration).toContain("'collaborator_commission_amount'")
    expect(migration).toContain("'arista_commission_net_amount', v_opportunity.arista_commission_net_amount")
  })
})
