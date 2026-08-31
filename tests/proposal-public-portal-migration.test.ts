import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260831203155_proposal_public_portal.sql'), 'utf8').toLowerCase()

describe('proposal public portal migration', () => {
  test('keeps public links private and exposes only controlled RPCs', () => {
    expect(migration).toContain('add column accepted_version_id uuid references public.commercial_proposal_versions(id) on delete restrict')
    expect(migration).toContain('create table public.commercial_proposal_public_links')
    expect(migration).toContain('token_hash text not null')
    expect(migration).toContain("token_hash ~ '^[0-9a-f]{64}$'")
    expect(migration).toContain('foreign key (version_id, proposal_id) references public.commercial_proposal_versions(id, proposal_id) on delete restrict')
    expect(migration).toContain('enable row level security')
    expect(migration).toContain('revoke all on public.commercial_proposal_public_links from anon, authenticated')
    expect(migration).not.toContain('grant select, insert, update on public.commercial_proposal_public_links to anon')
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = \'\'')
    expect(migration).toContain('revoke execute on function public.resolve_commercial_proposal_public_link(text) from public, anon, authenticated')
    expect(migration).toContain('grant execute on function public.resolve_commercial_proposal_public_link(text) to anon')
    expect(migration).toContain('for update')
    expect(migration).toContain("status = 'viewed'")
    expect(migration).toContain("status = 'responded'")
    expect(migration).not.toContain('on delete cascade')
    expect(migration).not.toContain('for delete')
  })

  test('never exposes internal notes, IDs or creator metadata from resolve RPC', () => {
    const returnSection = migration.slice(migration.indexOf('return jsonb_build_object'), migration.indexOf('create or replace function public.respond'))
    expect(returnSection).not.toContain('internal_notes')
    expect(returnSection).not.toContain('created_by')
    expect(returnSection).not.toContain('proposal_id')
    expect(returnSection).not.toContain('version_id')
  })
})
