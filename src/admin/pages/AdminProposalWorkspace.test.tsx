import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminProposalWorkspace } from './AdminProposalWorkspace'
import { adminRepository } from '../../repositories'
import type { CommercialProposalVersionRecord, CommercialProposalWithOpportunity } from '../../types/admin'

vi.mock('../../repositories', () => ({ adminRepository: {
  getCommercialProposalById: vi.fn(), listCommercialProposalVersions: vi.fn(), listCommercialProposalDocuments: vi.fn(), getOrganizationSettings: vi.fn(), listCommercialProposalPublicLinks: vi.fn(), createCommercialProposalPublicLink: vi.fn(), revokeCommercialProposalPublicLink: vi.fn(), createCommercialProposalVersion: vi.fn(), createCommercialProposalDocument: vi.fn(), updateCommercialProposal: vi.fn(),
} }))

const opportunity = { id: 'op-1', reference_code: 'ARI-2026-0001', title: 'Operación', opportunity_type: 'sell', status: 'active', contact_id: null }
const proposal = { id: 'proposal-1', proposal_code: 'PROP-2026-00000001', opportunity_id: 'op-1', title: 'Propuesta', description: 'Descripción', currency: 'CLP', subtotal: 1000, tax_percentage: 19, tax_amount: 190, total_amount: 1190, valid_until: '2099-01-01', status: 'draft', sent_at: null, viewed_at: null, accepted_at: null, accepted_version_id: null, rejected_at: null, internal_notes: 'privada', client_notes: 'cliente', archived_at: null, archived_by: null, created_by: 'owner-1', created_at: '2026-08-31T10:00:00.000Z', updated_at: '2026-08-31T10:00:00.000Z', opportunity, contact: null } as CommercialProposalWithOpportunity
const version = { id: 'version-1', proposal_id: 'proposal-1', version_number: 1, title: 'Propuesta', description: 'Descripción', currency: 'CLP', subtotal: 1000, tax_percentage: 19, tax_amount: 190, total_amount: 1190, valid_until: '2099-01-01', client_notes: 'cliente', snapshot_data: {}, created_by: 'owner-1', created_at: '2026-08-31T10:00:00.000Z' } as CommercialProposalVersionRecord

describe('AdminProposalWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.getCommercialProposalById).mockResolvedValue({ data: proposal, error: null })
    vi.mocked(adminRepository.listCommercialProposalVersions).mockResolvedValue({ data: [version], error: null })
    vi.mocked(adminRepository.listCommercialProposalDocuments).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.getOrganizationSettings).mockResolvedValue({ data: null, error: null })
    vi.mocked(adminRepository.listCommercialProposalPublicLinks).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.createCommercialProposalPublicLink).mockResolvedValue({ data: { id: 'link-1', proposal_id: proposal.id, version_id: version.id, token_hash: 'a'.repeat(64), status: 'active', expires_at: null, created_by: 'owner-1', created_at: version.created_at, revoked_at: null, first_viewed_at: null, last_viewed_at: null, view_count: 0, responded_at: null, response: null, response_name: null, response_email: null, response_comment: null }, error: null })
  })
  afterEach(() => cleanup())

  test('crea un enlace asociado a la versión visible sin enviar el token al repositorio', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/admin/propuestas/proposal-1']}><Routes><Route path="/admin/propuestas/:id" element={<AdminProposalWorkspace />} /></Routes></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Crear enlace' }))
    const call = vi.mocked(adminRepository.createCommercialProposalPublicLink).mock.calls[0][0]
    expect(call.proposal_id).toBe('proposal-1')
    expect(call.version_id).toBe('version-1')
    expect(call.token_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(screen.getByText(/\/propuesta\//)).toBeInTheDocument()
  })
})
