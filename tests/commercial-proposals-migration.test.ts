import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'

describe('commercial proposals migration', () => {
  test('defines the proposal model, ownership controls and logical archive', () => {
    const sql = readFileSync('supabase/migrations/20260831173442_commercial_proposals.sql', 'utf8')
    expect(sql).toContain('create table public.commercial_proposals')
    expect(sql).toContain('references public.opportunities(id) on delete restrict')
    expect(sql).toContain('proposal_code text not null')
    expect(sql).toContain('generated always as')
    expect(sql).toContain('alter table public.commercial_proposals enable row level security')
    expect(sql).toContain('revoke all on public.commercial_proposals from anon, authenticated')
    expect(sql).toContain('grant select, insert, update on public.commercial_proposals to authenticated')
    expect(sql).toContain('to authenticated')
    expect(sql).not.toMatch(/for\s+delete/i)
    expect(sql).not.toMatch(/on\s+delete\s+cascade/i)
    expect(sql).not.toMatch(/security\s+definer/i)
    expect(sql).not.toMatch(/auth\.role/i)
    expect(sql).not.toMatch(/service_role/i)
  })
})
