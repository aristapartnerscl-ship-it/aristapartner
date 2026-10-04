import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import type { RedComercialCrossOpportunityRecord } from '../../types/admin'
import { RedComercialCrossOpportunitiesPage } from './RedComercialCrossOpportunitiesPage'

const repositoryMocks = vi.hoisted(() => ({
  listRepresentedCompanies: vi.fn(),
  listMyRepresentedCompanies: vi.fn(),
  listCollaborators: vi.fn(),
  listCompanyMemberships: vi.fn(),
  listRedComercialCrossOpportunities: vi.fn(),
  getRedComercialCrossOpportunityMetrics: vi.fn(),
  updateRedComercialCrossOpportunityStatus: vi.fn(),
  assignRedComercialCrossOpportunity: vi.fn(),
  convertRedComercialCrossOpportunity: vi.fn(),
  discardRedComercialCrossOpportunity: vi.fn(),
}))

vi.mock('../../repositories', () => ({ adminRepository: repositoryMocks }))

const authValue: AdminAuthContextValue = {
  status: 'ready',
  session: null,
  user: { id: 'owner-1', email: 'owner@arista.cl' } as AdminAuthContextValue['user'],
  profile: { id: 'owner-1', full_name: 'Admin Owner', email: 'owner@arista.cl', role: 'owner', is_active: true, created_at: '', updated_at: '' } as AdminAuthContextValue['profile'],
  signIn: vi.fn(),
  signOut: vi.fn(),
}

const row: RedComercialCrossOpportunityRecord = {
  id: 'cross-1',
  source_prospect_id: 'prospect-source',
  source_prospect_company_name: 'Empresa ABC',
  source_prospect_logo_storage_path: null,
  source_represented_company_id: 'company-source',
  source_represented_company_name: 'Centro Psicovinculo',
  source_represented_company_logo_storage_path: null,
  target_represented_company_id: 'company-target',
  target_company_name: 'Noveli Editorial',
  target_company_logo_storage_path: null,
  detected_by: 'collab-1',
  detected_by_name: 'Alonso Gonzalez',
  reason: 'Podria necesitar servicios editoriales para sus publicaciones.',
  status: 'detected',
  assigned_to: null,
  assigned_to_name: null,
  converted_prospect_id: null,
  converted_prospect_company_name: null,
  converted_at: null,
  converted_by: null,
  converted_by_name: null,
  discarded_at: null,
  discarded_by: null,
  discarded_by_name: null,
  discard_reason: null,
  discard_note: null,
  created_at: '2026-10-03T00:00:00Z',
  updated_at: '2026-10-03T00:00:00Z',
  can_manage: true,
}

function renderPage(auth = authValue) {
  return render(
    <MemoryRouter initialEntries={['/admin/oportunidades-cruzadas']}>
      <AdminAuthContext.Provider value={auth}>
        <RedComercialCrossOpportunitiesPage />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('RedComercialCrossOpportunitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositoryMocks.listRepresentedCompanies.mockResolvedValue({ data: [{ id: 'company-source', name: 'Centro Psicovinculo', status: 'active' }, { id: 'company-target', name: 'Noveli Editorial', status: 'active' }], error: null })
    repositoryMocks.listMyRepresentedCompanies.mockResolvedValue({ data: [{ id: 'company-source', name: 'Centro Psicovinculo', status: 'active' }], error: null })
    repositoryMocks.listCollaborators.mockResolvedValue({ data: [{ id: 'collab-1', full_name: 'Alonso Gonzalez', email: 'a@example.com' }, { id: 'collab-2', full_name: 'Bea Destino', email: 'b@example.com' }], error: null })
    repositoryMocks.listCompanyMemberships.mockResolvedValue({ data: [{ represented_company_id: 'company-target', user_id: 'collab-2', status: 'active' }], error: null })
    repositoryMocks.listRedComercialCrossOpportunities.mockResolvedValue({ data: { rows: [row], total: 1 }, error: null })
    repositoryMocks.getRedComercialCrossOpportunityMetrics.mockResolvedValue({ data: { total: 1, detected: 1, under_review: 0, assigned: 0, converted: 0, discarded: 0 }, error: null })
    repositoryMocks.updateRedComercialCrossOpportunityStatus.mockResolvedValue({ data: { ...row, status: 'under_review' }, error: null })
    repositoryMocks.assignRedComercialCrossOpportunity.mockResolvedValue({ data: { ...row, status: 'assigned', assigned_to: 'collab-2', assigned_to_name: 'Bea Destino' }, error: null })
    repositoryMocks.convertRedComercialCrossOpportunity.mockResolvedValue({ data: { ...row, status: 'converted', converted_prospect_id: 'prospect-new', converted_prospect_company_name: 'Empresa ABC' }, error: null })
    repositoryMocks.discardRedComercialCrossOpportunity.mockResolvedValue({ data: { ...row, status: 'discarded', discard_reason: 'no_fit' }, error: null })
  })

  afterEach(() => cleanup())

  test('renders the global route table with safe metadata', async () => {
    renderPage()
    expect(await screen.findByText('Oportunidades cruzadas')).toBeInTheDocument()
    expect(screen.getAllByText('Centro Psicovinculo').length).toBeGreaterThan(0)
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getAllByText('Noveli Editorial').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Alonso Gonzalez').length).toBeGreaterThan(0)
    expect(screen.queryByText('a@example.com')).not.toBeInTheDocument()
  })

  test('opens a fixed detail panel and can move to under review', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))
    expect(document.documentElement.dataset.redProspectDetail).toBe('open')
    await user.selectOptions(screen.getByLabelText('Estado oportunidad cruzada'), 'under_review')
    expect(repositoryMocks.updateRedComercialCrossOpportunityStatus).toHaveBeenCalledWith('cross-1', 'under_review')
  })

  test('assignment modal only shows collaborators with destination membership', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(screen.getAllByRole('button', { name: 'Asignar' }).at(-1)!)
    expect((await screen.findAllByText('Bea Destino')).length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Responsable asignado')).not.toHaveTextContent('Alonso Gonzalez')
    await user.selectOptions(screen.getByLabelText('Responsable asignado'), 'collab-2')
    await user.click(screen.getAllByRole('button', { name: 'Asignar' }).at(-1)!)
    await waitFor(() => expect(repositoryMocks.assignRedComercialCrossOpportunity).toHaveBeenCalledWith('cross-1', 'collab-2'))
  })

  test('convert action calls its RPC', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(screen.getByRole('button', { name: 'Convertir en prospecto' }))
    await waitFor(() => expect(repositoryMocks.convertRedComercialCrossOpportunity).toHaveBeenCalledWith('cross-1'))
  })

  test('discard action calls its RPC', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    await user.selectOptions(await screen.findByLabelText('Motivo'), 'no_fit')
    await user.click(screen.getAllByRole('button', { name: 'Descartar' }).at(-1)!)
    await waitFor(() => expect(repositoryMocks.discardRedComercialCrossOpportunity).toHaveBeenCalledWith('cross-1', 'no_fit', ''))
  })
})
