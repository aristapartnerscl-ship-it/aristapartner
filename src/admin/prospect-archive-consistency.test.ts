import { describe, expect, test } from 'vitest'
import consistencyMigration from '../../supabase/migrations/20261005214000_red_comercial_prospect_archive_consistency.sql?raw'
import deleteMigration from '../../supabase/migrations/20261005202849_red_comercial_delete_archived_prospect.sql?raw'

describe('red comercial prospect archive consistency', () => {
  test('normalizes historical archive mismatches and enforces the invariant', () => {
    expect(consistencyMigration).toContain("where status = 'archived'")
    expect(consistencyMigration).toContain('set is_archived = true')
    expect(consistencyMigration).toContain("where is_archived = true")
    expect(consistencyMigration).toContain("set status = 'archived'")
    expect(consistencyMigration).toContain('represented_company_prospects_archive_consistency_check')
    expect(consistencyMigration).toContain("check ((status = 'archived') = is_archived)")
  })

  test('derives both archive fields server-side for archive and restore payloads', () => {
    expect(consistencyMigration).toContain("v_is_archived := v_status = 'archived'")
    expect(consistencyMigration).toContain("v_status := case when v_is_archived then 'archived' else 'to_contact' end")
    expect(consistencyMigration).toContain('public.update_red_comercial_prospect')
  })

  test('keeps permanent deletion restricted to admins, archived records, and no history', () => {
    expect(deleteMigration).toContain('public.is_red_comercial_admin()')
    expect(deleteMigration).toContain("v_prospect.status <> 'archived'")
    expect(deleteMigration).toContain('not v_prospect.is_archived')
    expect(deleteMigration).toContain('AP_PROSPECT_HAS_HISTORY')
  })
})
