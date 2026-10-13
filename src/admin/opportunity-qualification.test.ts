import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261012000000_red_comercial_opportunity_qualification.sql?raw'
import panelFix from '../../supabase/migrations/20261014000000_fix_red_comercial_prospect_panel_notes.sql?raw'
import panelFileFix from '../../supabase/migrations/20261014010000_fix_red_comercial_prospect_panel_file_archive.sql?raw'
import specialistOutcomeMigration from '../../supabase/migrations/20261014020000_red_comercial_specialist_outcomes.sql?raw'
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
    expect(panel).toContain("!admin && !readOnly")
    expect(panel).toContain("opportunity.control_mode === 'arista'")
  })

  test('exposes the contextual playbook and qualification UI without duplicating a pipeline', () => {
    expect(panel).toContain('ServicePlaybookModal')
    expect(panel).toContain('Ver playbook')
    expect(panel).toContain('Preguntas recomendadas')
    expect(panel).toContain('Requiere especialista del representado')
    expect(panel).toContain('QualificationEditor')
  })

  test('panel fix uses the real notes archive column and preserves empty opportunities as valid data', () => {
    expect(panelFix).toContain('n.is_archived = false')
    expect(panelFix).not.toContain('n.archived_at')
    expect(panelFix).toContain("'opportunities', v_opportunities")
    expect(panelFileFix).toContain('n.is_archived = false')
    expect(panelFileFix).toContain('f.is_archived = false')
    expect(panelFileFix).not.toContain('n.archived_at')
    expect(panelFileFix).not.toContain('f.archived_at')
  })

  test('normalizes optional compensation and validates selected compensation types', () => {
    expect(panel).toContain('attributedCollaboratorId || null')
    expect(panel).toContain('selectedCompensationType || null')
    expect(panel).toContain('La participacion debe ser un porcentaje entre 0 y 100.')
    expect(panel).toContain('Ingresa un monto fijo valido.')
  })

  test('records specialist outcomes and reuses the existing follow-up activity', () => {
    expect(specialistOutcomeMigration).toContain('meeting_summary text')
    expect(specialistOutcomeMigration).toContain('followup_activity_id uuid')
    expect(specialistOutcomeMigration).toContain('record_red_comercial_specialist_outcome')
    expect(specialistOutcomeMigration).toContain("v_request.status <> 'completed'")
    expect(specialistOutcomeMigration).toContain("'REDCOM_SPECIALIST_ACCOUNT_BLOCKED'")
    expect(specialistOutcomeMigration).toContain("activity_type, title, description, activity_at, created_by")
    expect(panel).toContain('Registrar resultado de reunion')
    expect(panel).toContain('recordRedComercialSpecialistOutcome')
    expect(panel).toContain('Editar resultado')
  })

  test('keeps the outcome separate from opportunity pipeline and control mode', () => {
    expect(specialistOutcomeMigration).not.toContain('control_mode =')
    expect(specialistOutcomeMigration).not.toContain('result_status =')
    expect(specialistOutcomeMigration).toContain('outcome_recorded_by')
    expect(specialistOutcomeMigration).toContain("'Resultado de reunion con especialista registrado'")
  })
})
