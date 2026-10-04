import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261003225402_red_comercial_opportunity_attribution_integrity.sql?raw'

describe('red comercial opportunity attribution integrity migration', () => {
  test('blocks compensation without attributed collaborator server-side', () => {
    expect(migration).toContain('AP_ATTRIBUTED_COLLABORATOR_REQUIRED')
    expect(migration).toContain('(v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) and v_attributed is null')
  })

  test('auto-attributes collaborator-created compensated opportunities', () => {
    expect(migration).toContain('if not v_is_admin and (v_compensation_type is not null or v_compensation_rate is not null or v_compensation_amount is not null) then')
    expect(migration).toContain('v_attributed := v_user_id;')
  })

  test('handoff preserves attribution and compensation fields', () => {
    const handoffBranch = migration.slice(migration.indexOf('if not v_is_admin then'), migration.indexOf('v_attributed := v_existing.attributed_collaborator_id;'))
    expect(handoffBranch).toContain("set control_mode = 'arista', handed_off_at = now()")
    expect(handoffBranch).not.toContain('attributed_collaborator_id')
    expect(handoffBranch).not.toContain('collaborator_compensation_rate')
  })

  test('admin clearing attribution also clears compensation instead of leaving orphan values', () => {
    expect(migration).toContain('v_clearing_attribution boolean := false')
    expect(migration).toContain('v_clearing_attribution := v_attributed is null')
    expect(migration).toContain('if v_attributed is null or v_compensation_type is null then')
  })

  test('invalid attributed UUID without active membership is rejected', () => {
    expect(migration).toContain('not public.red_comercial_is_company_member(v_existing.represented_company_id, v_attributed)')
    expect(migration).toContain('AP_INVALID_ATTRIBUTED_COLLABORATOR')
  })
})
