import { readFileSync } from 'node:fs'
import { readdirSync } from 'node:fs'
import { statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function findMigration(name: string) {
  const migrations = readdirSync(resolve(process.cwd(), 'supabase/migrations')).sort()
  const fileName = migrations.find((migration) => migration.endsWith(`_${name}.sql`))
  if (!fileName) throw new Error(`Migration not found: ${name}`)
  return {
    fileName,
    version: Number(fileName.slice(0, 14)),
    sql: readProjectFile(`supabase/migrations/${fileName}`),
  }
}

function listTextFiles(root: string): string[] {
  const fullRoot = resolve(process.cwd(), root)
  if (!statSync(fullRoot, { throwIfNoEntry: false })?.isDirectory()) return []
  const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.svg', '.txt'])
  const entries = readdirSync(fullRoot, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const relative = `${root}/${entry.name}`
    if (entry.isDirectory()) return listTextFiles(relative)
    const extension = entry.name.includes('.') ? entry.name.slice(entry.name.lastIndexOf('.')) : ''
    if (!textExtensions.has(extension)) return []
    if (/\.(test|spec)\.[tj]sx?$/.test(entry.name)) return []
    return [relative]
  })
}

function containsMojibake(text: string) {
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)
    if (code === 0xfffd || code === 0x00c3 || code === 0x00c2) return true
    if (code === 0x00ef && text.charCodeAt(index + 1) === 0x00bf && text.charCodeAt(index + 2) === 0x00bd) return true
    if (code === 0x00e2) {
      const next = text.charCodeAt(index + 1)
      if (next >= 0x0080 && next <= 0x00bf) return true
    }
  }
  return false
}

function stripLegitimateQuestionMarkSyntax(text: string) {
  return text
    .replace(/https?:\/\/[^'"`\s)]+/g, '')
    .replace(/\/[A-Za-z0-9_./-]+\?[A-Za-z0-9_=&%.-]+/g, '')
    .replace(/\?\./g, '')
    .replace(/\?\?/g, '')
    .replace(/\w+\?:/g, '')
}

function containsQuestionMarkInsideWord(text: string) {
  const stripped = stripLegitimateQuestionMarkSyntax(text)
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/u.test(stripped)
}

function listPublicBrowserFiles() {
  return [...listTextFiles('src/components'), ...listTextFiles('src/pages'), ...listTextFiles('src/data'), 'src/index.css', 'index.html']
    .filter((file) => !file.startsWith('src/components/admin/'))
}

describe('production readiness hardening', () => {
  test('centralizes the accessible on-brand tokens', () => {
    const css = readProjectFile('src/index.css')
    expect(css).toContain('--color-on-brand:')
    expect(css).toContain('--color-on-brand-muted:')
    expect(css).toContain('--color-on-brand-border:')
    expect(css).toContain('--color-on-brand-surface:')
  })
  test('keeps browser-delivered text free of common mojibake sequences', () => {
    const browserFiles = [...listTextFiles('src'), ...listTextFiles('public'), 'index.html']
    const offenders = browserFiles.filter((file) => containsMojibake(readProjectFile(file)))

    expect(offenders).toEqual([])
  })

  test('keeps browser-delivered text free of question-mark mojibake inside words', () => {
    const browserFiles = [...listTextFiles('src'), ...listTextFiles('public'), 'index.html']
    const offenders = browserFiles.filter((file) => containsQuestionMarkInsideWord(readProjectFile(file)))

    expect(offenders).toEqual([])
  })

  test('keeps the public surface on the official color token system', () => {
    const publicFiles = listPublicBrowserFiles()
    const oldColors = ['#235B3E', '#17202D', '#FAF8F2', '#EEF5F1']
    const offenders = publicFiles.filter((file) => {
      const content = readProjectFile(file).toUpperCase()
      return oldColors.some((color) => content.includes(color))
    })
    const css = readProjectFile('src/index.css')

    expect(offenders).toEqual([])
    expect(css).toContain('--color-brand: #1E4D3A')
    expect(css).toContain('--color-brand-dark: #16392C')
    expect(css).toContain('--color-graphite: #1A1F23')
    expect(css).toContain('--color-graphite-soft: #2A3138')
    expect(css).toContain('--color-surface: #FFFFFF')
    expect(css).toContain('--color-surface-muted: #F6F7F5')
    expect(css).toContain('--color-border: #E7EAE6')
    expect(css).toContain('--color-text: #1A1F23')
    expect(css).toContain('--color-text-muted: #4C5552')
    expect(css).toContain('--color-text-soft: #6D7571')
  })

  test('keeps optimized public image variants present and non-empty', () => {
    const variants = [
      'public/images/arista-hero-intermediacion-960.webp',
      'public/images/arista-hero-intermediacion-1600.webp',
      'public/images/arista-hero-intermediacion-960.avif',
      'public/images/arista-hero-intermediacion-1600.avif',
      'public/images/arista-b2b-desarrollo-720.webp',
      'public/images/arista-b2b-desarrollo-1200.webp',
      'public/images/arista-b2b-desarrollo-720.avif',
      'public/images/arista-b2b-desarrollo-1200.avif',
      'public/images/arista-proveedores-comparacion-720.webp',
      'public/images/arista-proveedores-comparacion-1200.webp',
      'public/images/arista-proveedores-comparacion-720.avif',
      'public/images/arista-proveedores-comparacion-1200.avif',
      'public/images/arista-hero-intermediacion-v3-960.webp',
      'public/images/arista-hero-intermediacion-v3-1600.webp',
      'public/images/arista-hero-intermediacion-v3-960.avif',
      'public/images/arista-hero-intermediacion-v3-1600.avif',
      'public/images/arista-hero-productos-b2b-v3-960.webp',
      'public/images/arista-hero-productos-b2b-v3-1600.webp',
      'public/images/arista-hero-productos-b2b-v3-960.avif',
      'public/images/arista-hero-productos-b2b-v3-1600.avif',
      'public/images/arista-hero-proveedores-v3-960.webp',
      'public/images/arista-hero-proveedores-v3-1600.webp',
      'public/images/arista-hero-proveedores-v3-960.avif',
      'public/images/arista-hero-proveedores-v3-1600.avif',
      'public/images/arista-hero-negociacion-v3-960.webp',
      'public/images/arista-hero-negociacion-v3-1600.webp',
      'public/images/arista-hero-negociacion-v3-960.avif',
      'public/images/arista-hero-negociacion-v3-1600.avif',
      'public/images/arista-hero-seguimiento-v3-960.webp',
      'public/images/arista-hero-seguimiento-v3-1600.webp',
      'public/images/arista-hero-seguimiento-v3-960.avif',
      'public/images/arista-hero-seguimiento-v3-1600.avif',
    ]

    expect(variants.every((file) => statSync(resolve(process.cwd(), file), { throwIfNoEntry: false })?.size > 0)).toBe(true)
  })

  test('keeps Supabase local temp state out of version control', () => {
    expect(readProjectFile('.gitignore')).toContain('supabase/.temp/')
  })

  test('configures safe Vercel headers without an unvalidated CSP', () => {
    const vercel = JSON.parse(readProjectFile('vercel.json')) as {
      headers?: Array<{ headers?: Array<{ key: string; value: string }> }>
    }
    const headerEntries = vercel.headers?.flatMap((entry) => entry.headers ?? []) ?? []
    const headers = new Map(headerEntries.map((entry) => [entry.key, entry.value]))

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Permissions-Policy')).toContain('camera=()')
    expect(headers.has('Content-Security-Policy')).toBe(false)
  })

  test('adds a local migration that hardens SQL function search paths only', () => {
    const migration = readProjectFile('supabase/migrations/20260817000000_harden_function_search_path.sql')

    expect(migration).toContain('set search_path = public')
    expect(migration).toContain('public.set_updated_at()')
    expect(migration).toContain('public.set_organization_settings_audit_fields()')
    expect(migration).not.toMatch(/\bdelete\b/i)
    expect(migration).not.toMatch(/\banon\b/i)
    expect(migration).not.toMatch(/service_role/i)
    expect(migration).not.toMatch(/security\s+definer/i)
  })

  test('prepares atomic conversion RPCs after function search-path hardening', () => {
    const migration = findMigration('add_transactional_conversions')
    const sql = migration.sql.toLowerCase()
    const functions = [
      'convert_inquiry_to_opportunity_atomic',
      'convert_contact_submission_atomic',
      'convert_buy_submission_atomic',
      'convert_sell_submission_atomic',
      'convert_supplier_submission_atomic',
    ]

    expect(migration.version).toBeGreaterThan(20260817000000)
    for (const functionName of functions) {
      expect(sql).toContain(`create or replace function public.${functionName}(`)
      expect(sql).toContain(`security invoker`)
      expect(sql).toContain(`revoke all on function public.${functionName}(`)
      expect(sql).toContain(') from public;')
      expect(sql).toContain(') from anon;')
      expect(sql).toContain(') to authenticated;')
    }

    expect(sql.match(/security invoker/g)?.length).toBeGreaterThanOrEqual(5)
    expect(sql.match(/set search_path = ''/g)?.length).toBe(5)
    expect(sql.match(/for update/g)?.length).toBeGreaterThanOrEqual(5)
    expect(sql).toContain('update public.inquiries')
    expect(sql.match(/update public\.form_submissions/g)?.length).toBeGreaterThanOrEqual(4)
    expect(sql.match(/insert into public\.contacts/g)?.length).toBeGreaterThanOrEqual(4)
    expect(sql.match(/insert into public\.opportunities/g)?.length).toBeGreaterThanOrEqual(3)
    expect(sql).toContain('insert into public.suppliers')
    expect(sql).toContain('converted_entity_type =')
    expect(sql).toContain('converted_entity_id =')
    expect(sql).toContain('converted_opportunity_id =')
    expect(sql).toContain('already_converted')
    expect(sql).toContain('ap_conversion_integrity_error')
    expect(sql).toContain('num_nonnulls(')
    expect(sql).toContain('auth.uid()')
    expect(sql).toContain('extensions.gen_random_bytes(6)')
    expect(sql).toContain('pg_catalog.now()')
    expect(sql).toContain('get stacked diagnostics v_constraint_name = constraint_name')
    expect(sql).toContain("v_constraint_name = 'opportunities_reference_code_key'")
    expect(sql).not.toMatch(/security\s+definer/i)
    expect(sql).not.toMatch(/\bdelete\b/i)
    expect(sql).not.toMatch(/service_role/i)
    expect(sql).not.toMatch(/auth\.role\(/i)
    expect(sql).not.toMatch(/user_metadata/i)
    expect(sql).not.toMatch(/jsonb_populate_record/i)
    expect(sql).not.toMatch(/count\s*\(\s*\*/i)
    expect(sql).not.toMatch(/\bexecute\s+format\b/i)
    expect(sql).not.toMatch(/\bgrant\s+(select|insert|update|delete)\b/i)
    expect(sql).not.toMatch(/\bp_contact_source\b/i)
    expect(sql).not.toMatch(/\bp_source\b/i)
  })

  test('keeps atomic conversion RPC signatures explicit and fixed per submission type', () => {
    const { sql } = findMigration('add_transactional_conversions')

    expect(sql).toContain(
      'create or replace function public.convert_inquiry_to_opportunity_atomic(\n' +
        '  p_inquiry_id uuid,\n' +
        '  p_opportunity_type text,\n' +
        '  p_title text,',
    )
    expect(sql).toContain("v_reference_code := 'ARI-'")
    expect(sql).toContain("'inquiry',")
    expect(sql).toContain("v_submission.submission_type <> 'contact'")
    expect(sql).toContain("v_submission.submission_type <> 'buy'")
    expect(sql).toContain("v_submission.submission_type <> 'sell'")
    expect(sql).toContain("v_submission.submission_type <> 'supplier'")
    expect(sql).toContain("v_reference_code, 'buy'")
    expect(sql).toContain("v_reference_code, 'sell'")
    expect(sql).toContain("converted_entity_type = 'inquiry'")
    expect(sql).toContain("converted_entity_type = 'opportunity'")
    expect(sql).toContain("converted_entity_type = 'supplier'")
    expect(sql).toContain('status,\n    internal_notes,\n    created_by')
    expect(sql).toContain("'pending',")
    expect(sql).toContain('already_converted boolean')
    expect(sql).toContain('entity_type text')
    expect(sql).not.toMatch(/\b(email|phone|message|payload|notes)\s+(text|jsonb)\s*,?\s*\n\s*already_converted/i)
  })

  test('requires an unambiguous contact strategy for public submission conversions', () => {
    const { sql } = findMigration('add_transactional_conversions')

    expect(sql.match(/v_has_new_contact_payload := num_nonnulls\(/g)?.length).toBe(4)
    expect(sql.match(/p_existing_contact_id is null and p_contact_type is null/g)?.length).toBe(4)
    expect(sql.match(/p_existing_contact_id is not null and v_has_new_contact_payload/g)?.length).toBe(4)
    expect(sql.match(/message = 'AP_CONTACT_STRATEGY_REQUIRED'/g)?.length).toBe(4)
    expect(sql.match(/message = 'AP_INVALID_EMAIL'/g)?.length).toBe(4)
    expect(sql.match(/message = 'AP_INVALID_PHONE'/g)?.length).toBe(4)
    expect(sql.match(/created_by\s*\)\s*values/g)?.length).toBeGreaterThanOrEqual(4)
    expect(sql).not.toContain('created_by uuid')
    expect(sql).not.toContain('assigned_to uuid')
    expect(sql).not.toContain('reviewed_by uuid')
  })

  test('uses the five transactional conversion RPCs from the authenticated repository', () => {
    const repository = readProjectFile('src/repositories/supabase-admin-repository.ts')
    const rpcNames = [
      'convert_inquiry_to_opportunity_atomic',
      'convert_contact_submission_atomic',
      'convert_buy_submission_atomic',
      'convert_sell_submission_atomic',
      'convert_supplier_submission_atomic',
    ]

    for (const rpcName of rpcNames) {
      expect(repository).toContain(`.rpc('${rpcName}'`)
    }

    expect(repository).toContain('singleRpcRow')
    expect(repository).toContain('alreadyConverted')
    expect(repository).toContain('rpcErrorMessages')
    expect(repository).toContain('AP_AUTH_REQUIRED')
    expect(repository).toContain('AP_CONVERSION_INTEGRITY_ERROR')
    expect(repository).toContain('AP_CONTACT_STRATEGY_REQUIRED')
    expect(repository).not.toContain('markSubmissionConverted')
  })

  test('keeps new submission conversions out of client-side multi-request flows', () => {
    const repository = readProjectFile('src/repositories/supabase-admin-repository.ts')
    const conversionBlock = repository.slice(
      repository.indexOf('async convertContactSubmission'),
      repository.indexOf('async getConvertedSubmissionEntity'),
    )

    expect(conversionBlock).toContain("this.client.rpc('convert_contact_submission_atomic'")
    expect(conversionBlock).toContain("this.client.rpc('convert_buy_submission_atomic'")
    expect(conversionBlock).toContain("this.client.rpc('convert_sell_submission_atomic'")
    expect(conversionBlock).toContain("this.client.rpc('convert_supplier_submission_atomic'")
    expect(conversionBlock).not.toContain('.insert(')
    expect(conversionBlock).not.toContain('.update(')
    expect(conversionBlock).not.toContain('createContact(')
    expect(conversionBlock).not.toContain('createOpportunity(')
    expect(conversionBlock).not.toContain('createSupplier(')
    expect(conversionBlock).not.toContain('reviewed_by')
    expect(conversionBlock).not.toContain('created_by')
    expect(conversionBlock).not.toContain('assigned_to')
    expect(conversionBlock).not.toContain('p_source')
    expect(conversionBlock).not.toContain('p_contact_source')
  })

  test('keeps inquiry conversion atomic and leaves only explicit legacy repair outside the normal flow', () => {
    const repository = readProjectFile('src/repositories/supabase-admin-repository.ts')
    const normalConversion = repository.slice(
      repository.indexOf('async convertInquiryToOpportunity'),
      repository.indexOf('async repairInquiryConversionLink'),
    )
    const legacyRepair = repository.slice(
      repository.indexOf('async repairInquiryConversionLink'),
      repository.indexOf('async listContactsForInquirySelector'),
    )
    const inquiriesPage = readProjectFile('src/admin/pages/AdminInquiries.tsx')

    expect(normalConversion).toContain("this.client.rpc('convert_inquiry_to_opportunity_atomic'")
    expect(normalConversion).not.toContain('createOpportunity(')
    expect(normalConversion).not.toContain(".from('inquiries').update")
    expect(normalConversion).not.toContain('reference_code')
    expect(normalConversion).not.toContain('created_by')
    expect(normalConversion).not.toContain('assigned_to')
    expect(normalConversion).not.toContain('source')

    expect(legacyRepair).toContain(".from('inquiries')")
    expect(legacyRepair).toContain('inquiries.conversion_repair')
    expect(inquiriesPage).not.toContain('repairInquiryConversionLink')
    expect(inquiriesPage).not.toMatch(/conversi[oó]n parcial/i)
  })

  test('does not hide conversion type issues with unsafe TypeScript casts or client DELETEs', () => {
    const files = [
      'src/repositories/supabase-admin-repository.ts',
      'src/admin/pages/AdminFormSubmissions.tsx',
      'src/admin/pages/AdminInquiries.tsx',
      'src/types/admin.ts',
      'src/types/database.ts',
    ]
    const source = files.map((file) => readProjectFile(file)).join('\n')

    expect(source).not.toMatch(/\bas any\b/)
    expect(source).not.toMatch(/unknown\s+as/)
    expect(source).not.toMatch(/@ts-ignore/)
    expect(source).not.toMatch(/\.from\([^)]*\)[\s\S]{0,120}\.delete\s*\(/)
    expect(source).not.toMatch(/console\.(log|error|warn)\s*\([^)]*(payload|message|email|phone|token|session)/i)
  })
})
