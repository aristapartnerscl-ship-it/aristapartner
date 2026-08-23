import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminAuthContext } from '../admin-auth-context'
import { AdminOpportunityDetail } from './AdminOpportunityDetail'
import { adminRepository } from '../../repositories'
import type { OpportunityActivityRecord, OpportunityRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    getOpportunityById: vi.fn(),
    listContactsForSelector: vi.fn(),
    listOpportunityActivities: vi.fn(),
    completeFollowUp: vi.fn(),
    reopenFollowUp: vi.fn(),
    updateOpportunity: vi.fn(),
    createOpportunityActivity: vi.fn(),
    listAgreementsForOpportunity: vi.fn(),
    listOpportunitySuppliers: vi.fn(),
    listAvailableSuppliersForOpportunity: vi.fn(),
    linkSupplierToOpportunity: vi.fn(),
    updateOpportunitySupplier: vi.fn(),
  },
}))

const opportunity: OpportunityRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  reference_code: 'ARI-2026-ABC123',
  opportunity_type: 'buy',
  title: 'Compra de insumos',
  description: null,
  contact_id: null,
  status: 'active',
  priority: 'medium',
  source: null,
  estimated_value: null,
  currency: null,
  expected_date: null,
  country: null,
  region: null,
  city: null,
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

function activity(overrides: Partial<OpportunityActivityRecord>): OpportunityActivityRecord {
  return {
    id: 'activity-1',
    opportunity_id: opportunity.id,
    activity_type: 'note',
    title: 'Nota interna',
    description: null,
    occurred_at: '2026-08-13T12:00:00.000Z',
    next_action_at: null,
    completed_at: null,
    completed_by: null,
    created_at: '2026-08-13T12:00:00.000Z',
    created_by: 'owner-1',
    ...overrides,
  }
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/admin/oportunidades/${opportunity.id}`]}>
      <AdminAuthContext.Provider
        value={{
          status: 'ready',
          session: null,
          user: { id: 'owner-1', email: 'owner@example.com' } as never,
          profile: {
            id: 'owner-1',
            full_name: 'Owner Admin',
            role: 'owner',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        <Routes>
          <Route path="/admin/oportunidades/:id" element={<AdminOpportunityDetail />} />
        </Routes>
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminOpportunityDetail', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.getOpportunityById).mockResolvedValue({ data: opportunity, error: null })
    vi.mocked(adminRepository.listContactsForSelector).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listOpportunitySuppliers).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listAvailableSuppliersForOpportunity).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listAgreementsForOpportunity).mockResolvedValue({ data: [], error: null })
  })

  test('does not show follow-up buttons for activities without next_action_at', async () => {
    vi.mocked(adminRepository.listOpportunityActivities).mockResolvedValue({ data: [activity({ next_action_at: null })], error: null })

    renderDetail()

    expect((await screen.findAllByText((_, element) => element?.textContent?.includes('Nota interna') ?? false)).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /Marcar como completada/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reabrir seguimiento/i })).not.toBeInTheDocument()
  })

  test('shows pending and completed follow-up states in the timeline', async () => {
    vi.mocked(adminRepository.listOpportunityActivities).mockResolvedValue({
      data: [
        activity({ id: 'pending', title: 'Pendiente', next_action_at: '2026-08-14T12:00:00.000Z' }),
        activity({
          id: 'completed',
          title: 'Completada',
          next_action_at: '2026-08-13T12:00:00.000Z',
          completed_at: '2026-08-13T13:00:00.000Z',
          completed_by: 'owner-1',
        }),
      ],
      error: null,
    })

    renderDetail()

    expect(await screen.findByText('Próxima acción pendiente')).toBeInTheDocument()
    expect(screen.getByText('Completada')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Marcar como completada/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reabrir seguimiento/i })).toBeInTheDocument()
  })

  test('does not show supplier association for sell opportunities', async () => {
    vi.mocked(adminRepository.getOpportunityById).mockResolvedValue({
      data: { ...opportunity, opportunity_type: 'sell' },
      error: null,
    })
    vi.mocked(adminRepository.listOpportunityActivities).mockResolvedValue({ data: [activity({ next_action_at: null })], error: null })

    renderDetail()

    expect((await screen.findAllByText('Compra de insumos')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Proveedores considerados')).not.toBeInTheDocument()
    expect(adminRepository.listOpportunitySuppliers).not.toHaveBeenCalled()
  })

  test('translates the opportunity source without exposing technical values', async () => {
    vi.mocked(adminRepository.getOpportunityById).mockResolvedValue({
      data: { ...opportunity, source: 'public_form' },
      error: null,
    })
    vi.mocked(adminRepository.listOpportunityActivities).mockResolvedValue({ data: [], error: null })

    renderDetail()

    expect(await screen.findByText('Formulario p\u00fablico')).toBeInTheDocument()
    expect(screen.queryByText('public_form')).not.toBeInTheDocument()
    expect(screen.queryByText('internal')).not.toBeInTheDocument()
    expect(screen.queryByText('inquiry')).not.toBeInTheDocument()
  })
})
