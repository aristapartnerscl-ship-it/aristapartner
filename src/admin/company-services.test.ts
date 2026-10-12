import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261005230000_red_comercial_company_services.sql?raw'
import correctiveSeedMigration from '../../supabase/migrations/20261006000000_seed_centro_psicovinculo_services.sql?raw'

describe('red comercial company services', () => {
  test('defines a separate structured service entity with safe priorities', () => {
    expect(migration).toContain('create table public.represented_company_services')
    expect(migration).toContain("priority in ('A', 'B', 'C', 'complementary')")
    expect(migration).toContain('represented_company_id uuid not null')
    expect(migration).toContain('is_active boolean not null default true')
  })

  test('scopes reads to active memberships and hides inactive services from collaborators', () => {
    expect(migration).toContain("m.status = 'active'")
    expect(migration).toContain('(public.is_red_comercial_admin() or s.is_active)')
    expect(migration).toContain('revoke all on public.represented_company_services from anon, authenticated')
  })

  test('keeps mutations admin-only and seeds Centro Psicovínculo idempotently', () => {
    expect(migration).toContain("raise exception 'REDCOM_ADMIN_REQUIRED'")
    expect(migration).toContain("where lower(c.name) = lower('Centro Psicovínculo')")
    expect(migration).toContain('and not exists')
    expect(migration).toContain("lower(btrim(s.name)) = lower(btrim(seed.name))")
  })
  test('hardens uniqueness, ambiguity and collaborator price privacy', () => {
    expect(migration).toContain('represented_company_services_company_name_unique_idx')
    expect(migration).toContain('is ambiguous')
    expect(migration).toContain("to_jsonb(s) - 'reference_price' - 'price_notes'")
    expect(migration).toContain("lower(btrim(s.name)) = lower(btrim(seed.name))")
  })

  test('corrective Centro seed accepts known accent variants and remains idempotent', () => {
    expect(correctiveSeedMigration).toContain("'Centro Psicovínculo'")
    expect(correctiveSeedMigration).toContain("'Centro psicovinculo'")
    expect(correctiveSeedMigration).toContain("raise exception 'Centro Psicovínculo not found'")
    expect(correctiveSeedMigration).toContain("raise exception 'Centro Psicovínculo is ambiguous'")
    expect(correctiveSeedMigration).toContain('on conflict (represented_company_id, (lower(btrim(name)))) do nothing')
    expect(correctiveSeedMigration.match(/\('(?:Reclutamiento|Consultoría|HR Tech|Capacitaciones|Desarrollo|Inclusión|Evaluaciones)/g)?.length).toBe(7)
  })
})
