import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261012000000_red_comercial_opportunity_qualification.sql?raw'
import panel from './pages/RedComercialProspectDetailPanel.tsx?raw'

describe('red comercial opportunity qualification', () => {
  test('adds nullable qualification fields and a service reference without changing the pipeline', () => {
    expect(migration).toContain('represented_company_service_id uuid')
    expect(migration).toContain('pain_point text')
    expect(migration).toContain('identified_need text')
    expect(migration).toContain('qualification_notes text')
    expect(migration).toContain('client_expectation text')
    expect(migration).toContain('missing_information text')
    expect(migration).toContain('requires_specialist boolean not null default false')
    expect(migration).toContain('REDCOM_OPPORTUNITY_SERVICE_COMPANY_MISMATCH')
    expect(migration).not.toContain("status = 'qualified'")
  })

  test('keeps service ownership and collaborator qualification updates server-side', () => {
    expect(migration).toContain('s.represented_company_id = v_company_id')
    expect(migration).toContain('s.represented_company_id = v_existing.represented_company_id')
    expect(migration).toContain('s.is_active')
    expect(migration).toContain("raise exception 'AP_ADMIN_REQUIRED'")
    expect(migration).toContain('Calificacion de oportunidad actualizada')
  })

  test('exposes the contextual playbook and qualification UI without duplicating a pipeline', () => {
    expect(panel).toContain('ServicePlaybookModal')
    expect(panel).toContain('Ver playbook')
    expect(panel).toContain('Preguntas recomendadas')
    expect(panel).toContain('Requiere especialista del representado')
    expect(panel).toContain('QualificationEditor')
  })
})
