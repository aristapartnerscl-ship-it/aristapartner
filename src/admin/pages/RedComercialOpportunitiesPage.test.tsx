import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import type { RedComercialOpportunityListItem, RedComercialProspectDetailRecord } from '../../types/admin'
import { RedComercialOpportunitiesPage } from './RedComercialOpportunitiesPage'

const repositoryMocks = vi.hoisted(() => ({
  listRepresentedCompanies: vi.fn(),
  listMyRepresentedCompanies: vi.fn(),
  listCollaborators: vi.fn(),
  listRedComercialOpportunities: vi.fn(),
  getRedComercialOpportunityMetrics: vi.fn(),
  getRedComercialProspectDetail: vi.fn(),
  getRedComercialOpportunityPanel: vi.fn(),
  updateRedComercialOpportunity: vi.fn(),
  updateRedComercialProspect: vi.fn(),
  createRedComercialOpportunity: vi.fn(),
  createRedComercialCrossOpportunity: vi.fn(),
  createRedComercialProspectNote: vi.fn(),
  uploadRedComercialProspectFile: vi.fn(),
  createRedComercialProspectFileSignedUrl: vi.fn(),
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

const row: RedComercialOpportunityListItem = {
  id: 'opportunity-1',
  prospect_id: 'prospect-1',
  represented_company_name: 'Arista Company',
  represented_company_logo_storage_path: null,
  prospect_company_name: 'Empresa ABC',
  prospect_logo_storage_path: null,
  status: 'in_process',
  control_mode: 'collaborator',
  contract_status: 'pending',
  payment_status: 'not_applicable',
  commission_status: 'to_validate',
  result_status: 'in_process',
  attributed_collaborator_id: 'collab-1',
  attributed_collaborator_name: 'Alonso Gonzalez',
  collaborator_compensation_type: 'percentage',
  collaborator_compensation_rate: 40,
  collaborator_compensation_amount: null,
  sale_net_amount: null,
  currency: 'CLP',
  handed_off_at: null,
  closed_at: null,
  created_by: 'owner-1',
  created_at: '2026-10-02T00:00:00Z',
  updated_at: '2026-10-03T00:00:00Z',
  can_edit: true,
}

const prospect: RedComercialProspectDetailRecord = {
  id: 'prospect-1',
  represented_company_id: 'company-1',
  company_name: 'Empresa ABC',
  website_url: null,
  domain: null,
  rut: null,
  contact_name: null,
  contact_role: null,
  contact_email: null,
  contact_phone: null,
  channel: null,
  status: 'follow_up',
  first_contact_at: null,
  last_contact_at: null,
  next_followup_at: null,
  owner_user_id: 'collab-2',
  owner: { id: 'collab-2', full_name: 'Different Owner', email: null },
  collaborators: [],
  internal_notes: null,
  is_archived: false,
  can_view_detail: true,
  activities: [],
  created_at: '',
  updated_at: '',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/oportunidades']}>
      <AdminAuthContext.Provider value={authValue}>
        <RedComercialOpportunitiesPage />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('RedComercialOpportunitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositoryMocks.listRepresentedCompanies.mockResolvedValue({ data: [], error: null })
    repositoryMocks.listMyRepresentedCompanies.mockResolvedValue({ data: [], error: null })
    repositoryMocks.listCollaborators.mockResolvedValue({ data: [{ id: 'collab-1', full_name: 'Alonso Gonzalez' }], error: null })
    repositoryMocks.listRedComercialOpportunities.mockResolvedValue({ data: { rows: [row], total: 1 }, error: null })
    repositoryMocks.getRedComercialOpportunityMetrics.mockResolvedValue({ data: { total: 1, in_process: 1, arista: 0, collaborator: 1, contract_pending: 1, payment_pending: 0, commission_pending: 1, won: 0, lost: 0 }, error: null })
    repositoryMocks.getRedComercialProspectDetail.mockResolvedValue({ data: prospect, error: null })
    repositoryMocks.getRedComercialOpportunityPanel.mockResolvedValue({ data: { prospect, opportunities: [row], cross_opportunities: [], notes: [], files: [] }, error: null })
  })

  afterEach(() => cleanup())

  test('tabla global muestra el collaborator atribuido de la opportunity', async () => {
    renderPage()
    expect(await screen.findByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getAllByText('Alonso Gonzalez').length).toBeGreaterThan(0)
    expect(screen.queryByText('Sin atribucion')).not.toBeInTheDocument()
  })

  test('tabla global se actualiza despues de asignar collaborator en el panel', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    const orphanRow = { ...row, attributed_collaborator_id: null, attributed_collaborator_name: null, collaborator_compensation_type: 'percentage' as const, collaborator_compensation_rate: 40 }
    const assignedRow = { ...row, attributed_collaborator_id: 'collab-1', attributed_collaborator_name: 'Alonso Gonzalez', collaborator_compensation_type: 'percentage' as const, collaborator_compensation_rate: 40 }
    repositoryMocks.listRedComercialOpportunities
      .mockResolvedValueOnce({ data: { rows: [orphanRow], total: 1 }, error: null })
      .mockResolvedValueOnce({ data: { rows: [assignedRow], total: 1 }, error: null })
    repositoryMocks.getRedComercialOpportunityPanel.mockResolvedValueOnce({ data: { prospect, opportunities: [orphanRow], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.updateRedComercialOpportunity.mockResolvedValueOnce({ data: { prospect, opportunities: [assignedRow], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage()
    expect(await screen.findByText('Sin atribución')).toBeInTheDocument()
    await user.click(screen.getByText('Empresa ABC'))
    await user.selectOptions(await screen.findByLabelText('Colaborador atribuido'), 'collab-1')
    expect(repositoryMocks.updateRedComercialOpportunity).toHaveBeenCalledWith('opportunity-1', { attributed_collaborator_id: 'collab-1' })
    await waitFor(() => expect(screen.getAllByText('Alonso Gonzalez').length).toBeGreaterThan(0))
  })

  test('abre el panel global con el id exacto de la opportunity seleccionada', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('Empresa ABC'))

    await waitFor(() => expect(repositoryMocks.getRedComercialProspectDetail).toHaveBeenCalledWith('prospect-1'))
    await waitFor(() => expect(repositoryMocks.getRedComercialOpportunityPanel).toHaveBeenCalledWith('opportunity-1'))
  })

  test('si un prospect tiene dos opportunities carga la seleccionada y no la ultima', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    const opportunityA = { ...row, id: 'opportunity-a', control_mode: 'collaborator' as const, contract_status: 'pending' as const, updated_at: '2026-10-03T00:00:00Z' }
    const opportunityB = { ...row, id: 'opportunity-b', control_mode: 'arista' as const, contract_status: 'signed' as const, payment_status: 'pending' as const, commission_status: 'pending_payment' as const, updated_at: '2026-10-02T00:00:00Z' }
    repositoryMocks.listRedComercialOpportunities.mockResolvedValue({ data: { rows: [opportunityA, opportunityB], total: 2 }, error: null })
    repositoryMocks.getRedComercialOpportunityPanel.mockResolvedValueOnce({ data: { prospect, opportunities: [opportunityB], cross_opportunities: [], notes: [], files: [] }, error: null })

    renderPage()
    await waitFor(() => expect(screen.getAllByText('Empresa ABC')).toHaveLength(2))
    await user.click(screen.getAllByLabelText('Abrir Empresa ABC')[1])

    await waitFor(() => expect(repositoryMocks.getRedComercialOpportunityPanel).toHaveBeenCalledWith('opportunity-b'))
    expect(await screen.findByText('Gestion entregada a Arista')).toBeInTheDocument()
  })

  test('un error del panel no muestra estado vacio ni crear oportunidad', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    repositoryMocks.getRedComercialOpportunityPanel.mockResolvedValueOnce({ data: null, error: 'No fue posible completar la operacion en este momento.' })

    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))

    expect(await screen.findByText('No fue posible completar la operacion en este momento.')).toBeInTheDocument()
    expect(screen.queryByText('Aun no existe una oportunidad comercial.')).not.toBeInTheDocument()
    expect(screen.queryByText('Crear oportunidad')).not.toBeInTheDocument()
  })
})
