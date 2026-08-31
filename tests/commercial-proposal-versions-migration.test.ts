import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260831181509_commercial_proposal_versions.sql'), 'utf8').toLowerCase()

describe('commercial proposal versions migration', () => {
  test('define snapshots, documentos, restricciones y seguridad administrativa', () => {
    expect(migration).toContain('create table public.commercial_proposal_versions')
    expect(migration).toContain('create table public.commercial_proposal_documents')
    expect(migration).toContain('references public.commercial_proposals(id) on delete restrict')
    expect(migration).toContain('foreign key (version_id, proposal_id) references public.commercial_proposal_versions(id, proposal_id) on delete restrict')
    expect(migration).toContain('unique (proposal_id, version_number)')
    expect(migration).toContain('snapshot_data jsonb not null')
    expect(migration).toContain('enable row level security')
    expect(migration).toContain('revoke all on public.commercial_proposal_versions from anon, authenticated')
    expect(migration).toContain('grant select, insert on public.commercial_proposal_versions to authenticated')
    expect(migration).toContain('with check (exists')
    expect(migration).toContain('security invoker')
    expect(migration).toContain('set search_path = \'\'')
    expect(migration).toContain('revoke execute on function public.create_commercial_proposal_version(uuid) from public, anon')
    expect(migration).toContain('grant execute on function public.create_commercial_proposal_version(uuid) to authenticated')
    expect(migration).toContain('for update')
    expect(migration).toContain('max(v.version_number)')
    expect(migration).not.toContain('on delete cascade')
    expect(migration).not.toContain('for delete')
    expect(migration).not.toContain('security definer')
  })
})
