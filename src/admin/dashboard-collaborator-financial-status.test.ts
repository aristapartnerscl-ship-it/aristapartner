import { describe, expect, it } from 'vitest'
import migration from '../../supabase/migrations/20261004215733_red_comercial_dashboard_collaborator_financial_status.sql?raw'

describe('dashboard collaborator financial status migration', () => {
  it('keeps the existing dashboard payload and enriches only authorized opportunities', () => {
    expect(migration).toContain('red_comercial_dashboard_base')
    expect(migration).toContain("o.attributed_collaborator_id = v_user_id")
    expect(migration).toContain("'commission_status'")
    expect(migration).toContain("'collaborator_compensation_type'")
    expect(migration).toContain("'collaborator_compensation_rate'")
    expect(migration).toContain("'collaborator_compensation_amount'")
  })

  it('does not expose sale_net_amount in the dashboard enrichment', () => {
    expect(migration).not.toContain('sale_net_amount')
    expect(migration).not.toContain('margin')
  })
})
