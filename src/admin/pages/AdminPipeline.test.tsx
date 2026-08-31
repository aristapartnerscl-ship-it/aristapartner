import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminPipeline } from './AdminPipeline'
import { adminRepository } from '../../repositories'
import type { OpportunityRecord, ProspectRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: { listProspects: vi.fn(), listOpportunities: vi.fn() },
}))

const prospect: ProspectRecord = {
  id: 'prospect-1', prospect_type: 'person', full_name: 'Ana Prospecto', company_name: 'Empresa Uno', role_or_activity: null,
  email: null, phone: null, website: null, social_network: null, country: null, city_region: null, source: 'LinkedIn',
  product_or_service: null, commercial_origin: null, lead_temperature: 'qualified', status: 'interested', priority: 'high',
  preferred_contact_method: null, next_action_type: 'Llamar', next_action_at: '2099-01-01T10:00:00.000Z', last_contact_at: null,
  contact_attempts: 0, notes: null, assigned_to: 'owner-1', converted_contact_id: null, converted_opportunity_id: null,
  converted_at: null, created_by: 'owner-1', created_at: '2026-08-30T10:00:00.000Z', updated_at: '2026-08-30T10:00:00.000Z',
}

const opportunity: OpportunityRecord = {
  id: 'opportunity-1', reference_code: 'ARI-2026-ABC123', opportunity_type: 'buy', title: 'Compra de insumos', description: null,
  contact_id: null, status: 'active', priority: 'medium', source: 'prospecting', estimated_value: 100000, currency: 'CLP',
  expected_date: null, country: null, region: null, city: null, internal_notes: null, rejection_reason: null,
  assigned_to: 'owner-1', created_at: '2026-08-30T10:00:00.000Z', updated_at: '2026-08-30T10:00:00.000Z', created_by: 'owner-1',
}

describe('AdminPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.listProspects).mockResolvedValue({ data: [prospect], error: null })
    vi.mocked(adminRepository.listOpportunities).mockResolvedValue({ data: [opportunity], error: null })
  })

  test('muestra prospectos y oportunidades reales con enlaces de detalle', async () => {
    render(<MemoryRouter><AdminPipeline /></MemoryRouter>)
    expect(await screen.findByText('Pipeline comercial')).toBeInTheDocument()
    expect(screen.getByText('Ana Prospecto')).toHaveAttribute('href', '/admin/prospeccion/prospect-1')
    expect(screen.getByText('ARI-2026-ABC123')).toHaveAttribute('href', '/admin/oportunidades/opportunity-1')
    expect(screen.getByText('Prospectos activos')).toBeInTheDocument()
  })
})
