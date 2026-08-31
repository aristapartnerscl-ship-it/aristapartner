import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

describe('prospecting migration', () => {
  test('defines RLS, grants, atomic invoker RPCs, conversion idempotency and no unsafe privileges', () => {
    const sql = readFileSync('supabase/migrations/20260829021439_add_prospecting_module.sql', 'utf8')
    expect(sql).toContain('create table public.prospects')
    expect(sql).toContain('create table public.prospect_activities')
    expect(sql).toContain('alter table public.prospects enable row level security')
    expect(sql).toContain('grant select, insert, update on public.prospects to authenticated')
    expect(sql).toContain('grant select, insert, update on public.prospect_activities to authenticated')
    expect(sql).toContain('security invoker')
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain('for update')
    expect(sql).toContain("if v_prospect_status in ('converted', 'archived') then")
    expect(sql).toContain('already_converted')
    expect(sql).toContain('prospects_conversion_consistency_check')
    expect(sql).toContain('opportunities_reference_code_key')
    expect(sql).toContain('v_contact_increment integer := 0')
    expect(sql).toContain("if p_activity_type in ('call', 'whatsapp', 'email', 'meeting') then")
    expect(sql).not.toContain('prospects_search_idx')
    expect(sql).not.toMatch(/count\s*\(/i)
    expect(sql).not.toMatch(/security\s+definer/i)
    expect(sql).not.toMatch(/auth\.role/i)
    expect(sql).not.toMatch(/user_metadata/i)
    expect(sql).not.toMatch(/service_role/i)
    expect(sql).not.toMatch(/grant\s+.*\s+to\s+anon/i)
    expect(sql).not.toMatch(/for\s+delete/i)
    expect(sql).not.toMatch(/on\s+delete\s+cascade/i)
    expect(sql).not.toMatch(/mojibake|\u00c3[\u0080-\u00bf]|\ufffd/)
  })

  test('declares exact RPC signatures, execution grants and conversion integrity paths', () => {
    const sql = readFileSync('supabase/migrations/20260829021439_add_prospecting_module.sql', 'utf8')
    const activitySignature = 'public.create_prospect_activity_atomic(\n  uuid, text, text, text, text, timestamptz, text, timestamptz, text\n)'
    const conversionSignature = 'public.convert_prospect_to_opportunity(\n  uuid, text, text, text, date, text, text, text, numeric, text, text, uuid, text, text, text, text, text, text, text, text, text, text, text, text\n)'

    expect(sql).toContain(`revoke all on function ${activitySignature} from public`)
    expect(sql).toContain(`revoke all on function ${activitySignature} from anon`)
    expect(sql).toContain(`grant execute on function ${activitySignature} to authenticated`)
    expect(sql).toContain(`revoke all on function ${conversionSignature} from public`)
    expect(sql).toContain(`revoke all on function ${conversionSignature} from anon`)
    expect(sql).toContain(`grant execute on function ${conversionSignature} to authenticated`)
    expect(sql).toContain('AP_CONVERSION_INTEGRITY_ERROR')
    expect(sql).toContain('AP_CONTACT_STRATEGY_REQUIRED')
    expect(sql).toContain('v_reference_code, true')
    expect(sql).toContain('else\n        raise;')
  })
})
