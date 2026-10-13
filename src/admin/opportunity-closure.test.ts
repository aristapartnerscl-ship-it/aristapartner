import { describe, expect, it } from 'vitest'
import migration from '../../supabase/migrations/20261016000000_red_comercial_opportunity_closure.sql?raw'

describe('red comercial opportunity closure', () => {
  it('keeps closure dimensions separate and adds explicit close actions', () => {
    expect(migration).toContain('add column if not exists loss_reason text')
    expect(migration).toContain('add column if not exists closing_notes text')
    expect(migration).toContain("v_action = 'close_won'")
    expect(migration).toContain("v_action = 'close_lost'")
    expect(migration).toContain("v_action = 'reopen'")
    expect(migration).toContain("result_status = 'won'")
    expect(migration).toContain("result_status = 'lost'")
    expect(migration).toContain("result_status = 'in_process'")
    expect(migration).not.toContain('payment_status =')
    expect(migration).not.toContain('contract_status =')
    expect(migration).not.toContain('commission_status =')
  })

  it('requires admin access, a loss reason, and prevents duplicate closure', () => {
    expect(migration).toContain('AP_ADMIN_REQUIRED')
    expect(migration).toContain('REDCOM_LOSS_REASON_REQUIRED')
    expect(migration).toContain('REDCOM_OPPORTUNITY_ALREADY_CLOSED')
    expect(migration).toContain("grant execute on function public.close_red_comercial_opportunity(uuid, jsonb) to authenticated")
  })

  it('records won, lost, and reopened events in the existing activity timeline', () => {
    expect(migration).toContain("'Oportunidad ganada'")
    expect(migration).toContain("'Oportunidad perdida'")
    expect(migration).toContain("'Oportunidad reabierta'")
    expect(migration).toContain('represented_company_prospect_activities')
  })
})
