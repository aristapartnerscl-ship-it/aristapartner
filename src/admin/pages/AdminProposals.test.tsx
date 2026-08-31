import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminProposalFormPage, AdminProposals } from './AdminProposals'
import { adminRepository } from '../../repositories'
import type { CommercialProposalWithOpportunity, OpportunityRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listCommercialProposals: vi.fn(), listOpportunities: vi.fn(), createCommercialProposal: vi.fn(),
  },
}))

const opportunity: OpportunityRecord = { id: 'op-1', reference_code: 'ARI-2026-ABC123', opportunity_type: 'sell', title: 'Representación', description: null, contact_id: null, status: 'active', priority: 'medium', source: 'internal', estimated_value: null, currency: null, expected_date: null, country: null, region: null, city: null, internal_notes: null, rejection_reason: null, assigned_to: 'owner-1', created_at: '2026-08-30T10:00:00.000Z', updated_at: '2026-08-30T10:00:00.000Z', created_by: 'owner-1' }
const proposal: CommercialProposalWithOpportunity = { id: 'proposal-1', proposal_code: 'PROP-2026-ABC12345', opportunity_id: 'op-1', title: 'Propuesta inicial', description: null, currency: 'CLP', subtotal: 1000000, tax_percentage: 19, tax_amount: 190000, total_amount: 1190000, valid_until: '2099-01-01', status: 'negotiation', sent_at: null, viewed_at: null, accepted_at: null, rejected_at: null, internal_notes: null, client_notes: null, archived_at: null, archived_by: null, created_by: 'owner-1', created_at: '2026-08-30T10:00:00.000Z', updated_at: '2026-08-30T10:00:00.000Z', opportunity, contact: null }

describe('AdminProposals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.listCommercialProposals).mockResolvedValue({ data: [proposal], error: null })
    vi.mocked(adminRepository.listOpportunities).mockResolvedValue({ data: [opportunity], error: null })
  })
  afterEach(() => cleanup())

  test('lista propuestas y enlaza la oportunidad relacionada', async () => {
    render(<MemoryRouter><AdminProposals /></MemoryRouter>)
    expect((await screen.findAllByText('PROP-2026-ABC12345')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('ARI-2026-ABC123').some((element) => element.getAttribute('href') === '/admin/oportunidades/op-1')).toBe(true)
    expect(screen.getAllByText('En negociación').length).toBeGreaterThan(0)
  })

  test('calcula impuesto y total, exige oportunidad y no permite editar código', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><AdminProposalFormPage mode="create" /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Nueva propuesta' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument()
    await user.type(screen.getByLabelText('Título de propuesta *'), 'Propuesta nueva')
    await user.type(screen.getByLabelText('Subtotal'), '1000000')
    await user.clear(screen.getByLabelText('Impuesto %'))
    await user.type(screen.getByLabelText('Impuesto %'), '19')
    expect(screen.getAllByText(/1\.190\.000/).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Guardar propuesta' }))
    expect(screen.getByText('Selecciona una oportunidad.')).toBeInTheDocument()
  })
})
