import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import type { CollaboratorRecord, RedComercialProspectDetailRecord, RedComercialProspectListItem, RepresentedCompanyMembershipRecord, RepresentedCompanyRecord } from '../../types/admin'
import { RedComercialProspectsPage } from './RedComercialProspectsPage'

const repositoryMocks = vi.hoisted(() => ({
  listRepresentedCompanies: vi.fn(),
  listMyRepresentedCompanies: vi.fn(),
  listCompanyMemberships: vi.fn(),
  listCollaborators: vi.fn(),
  listRedComercialProspects: vi.fn(),
  getRedComercialProspectMetrics: vi.fn(),
  getRedComercialProspectDetail: vi.fn(),
  detectRedComercialProspectDuplicates: vi.fn(),
  createRedComercialProspect: vi.fn(),
  updateRedComercialProspect: vi.fn(),
  createRedComercialProspectActivity: vi.fn(),
  getRedComercialProspectPanel: vi.fn(),
  createRedComercialOpportunity: vi.fn(),
  updateRedComercialOpportunity: vi.fn(),
  createRedComercialCrossOpportunity: vi.fn(),
  createRedComercialProspectNote: vi.fn(),
  updateRedComercialProspectNote: vi.fn(),
  uploadRedComercialProspectFile: vi.fn(),
  createRedComercialProspectFileSignedUrl: vi.fn(),
  archiveRedComercialProspectFile: vi.fn(),
}))

vi.mock('../../repositories', () => ({ adminRepository: repositoryMocks }))

const ownerProfile = {
  id: 'owner-1',
  full_name: 'Admin Owner',
  email: 'owner@arista.cl',
  role: 'owner',
  is_active: true,
  created_at: '',
  updated_at: '',
}

const collaboratorProfile = {
  id: 'collab-1',
  full_name: 'Camila Perez',
  email: 'camila@example.com',
  role: 'collaborator',
  is_active: true,
  created_at: '',
  updated_at: '',
  invitation_status: 'accepted',
  onboarding_completed_at: '2026-10-01T00:00:00Z',
}

const centro: RepresentedCompanyRecord = {
  id: 'company-1',
  name: 'Centro Psicovinculo',
  slug: 'centro-psicovinculo',
  description: null,
  website_url: null,
  logo_storage_path: null,
  logo_source: 'fallback',
  status: 'active',
  offer_summary: null,
  problem_solved: null,
  ideal_customer: null,
  target_industries: [],
  territory: null,
  keywords: [],
  opportunity_examples: [],
  what_not_to_promise: null,
  internal_owner_id: null,
  created_at: '',
  updated_at: '',
}

const questar: RepresentedCompanyRecord = { ...centro, id: 'company-2', name: 'Questar', slug: 'questar' }

const memberships: RepresentedCompanyMembershipRecord[] = [
  { id: 'm-1', represented_company_id: 'company-1', user_id: 'collab-1', status: 'active', assigned_at: '', assigned_by: 'owner-1', created_at: '', updated_at: '' },
  { id: 'm-2', represented_company_id: 'company-1', user_id: 'collab-2', status: 'active', assigned_at: '', assigned_by: 'owner-1', created_at: '', updated_at: '' },
]

const collaborators: CollaboratorRecord[] = [
  { id: 'collab-1', full_name: 'Camila Perez', email: 'camila@example.com', role: 'collaborator', is_active: true, created_at: '', updated_at: '', last_activity_at: null, invitation_status: 'accepted', invited_at: null, invitation_sent_at: null, invitation_revoked_at: null, onboarding_completed_at: '2026-10-01T00:00:00Z' },
  { id: 'collab-2', full_name: 'Felipe Soto', email: 'felipe@example.com', role: 'collaborator', is_active: true, created_at: '', updated_at: '', last_activity_at: null, invitation_status: 'accepted', invited_at: null, invitation_sent_at: null, invitation_revoked_at: null, onboarding_completed_at: '2026-10-01T00:00:00Z' },
]

const fullRow: RedComercialProspectListItem = {
  id: 'prospect-1',
  represented_company_id: 'company-1',
  company_name: 'Empresa ABC',
  contact_name: 'Daniel Perez',
  contact_role: 'Gerente',
  contact_email: 'daniel@example.com',
  contact_phone: '+56912345678',
  channel: 'email',
  status: 'follow_up',
  first_contact_at: '2026-09-30T12:00:00Z',
  last_contact_at: '2026-09-30T12:00:00Z',
  next_followup_at: '2026-10-04T12:00:00Z',
  owner_user_id: 'collab-1',
  owner_name: 'Camila Perez',
  is_archived: false,
  can_view_detail: true,
  total_count: 2,
}

const limitedRow: RedComercialProspectListItem = {
  ...fullRow,
  id: 'prospect-2',
  company_name: 'Empresa DEF',
  contact_name: null,
  contact_role: null,
  contact_email: null,
  contact_phone: null,
  owner_user_id: 'collab-2',
  owner_name: 'Felipe Soto',
  can_view_detail: false,
}

const fullDetail: RedComercialProspectDetailRecord = {
  ...fullRow,
  website_url: 'https://abc.cl',
  domain: 'abc.cl',
  rut: null,
  owner: { id: 'collab-1', full_name: 'Camila Perez', email: 'camila@example.com' },
  collaborators: [],
  internal_notes: 'Nota sensible',
  activities: [{ id: 'a-1', activity_type: 'email', title: 'Email enviado', description: 'Se envio presentacion', activity_at: '2026-09-30T12:00:00Z', created_at: '2026-09-30T12:00:00Z', created_by: 'collab-1', created_by_name: 'Camila Perez' }],
  created_at: '',
  updated_at: '',
}

const limitedDetail: RedComercialProspectDetailRecord = {
  ...fullDetail,
  id: 'prospect-2',
  company_name: 'Empresa DEF',
  contact_name: null,
  contact_role: null,
  contact_email: null,
  contact_phone: null,
  owner_user_id: 'collab-2',
  owner: { id: 'collab-2', full_name: 'Felipe Soto', email: 'felipe@example.com' },
  internal_notes: null,
  activities: [],
  can_view_detail: false,
}

const aristaOpportunity = {
  id: 'opportunity-1',
  prospect_id: 'prospect-1',
  status: 'in_process',
  control_mode: 'arista',
  contract_status: 'pending',
  payment_status: 'not_applicable',
  commission_status: 'to_validate',
  result_status: 'in_process',
  attributed_collaborator_id: 'collab-1',
  collaborator_compensation_type: 'percentage',
  collaborator_compensation_rate: 40,
  collaborator_compensation_amount: null,
  sale_net_amount: null,
  currency: 'CLP',
  handed_off_at: '2026-10-01T00:00:00Z',
  closed_at: null,
  created_by: 'owner-1',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
}

function authValue(role: 'owner' | 'collaborator' = 'owner'): AdminAuthContextValue {
  const profile = role === 'owner' ? ownerProfile : collaboratorProfile
  return {
    status: 'ready',
    session: null,
    user: { id: profile.id, email: profile.email } as AdminAuthContextValue['user'],
    profile: profile as AdminAuthContextValue['profile'],
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
}

function renderPage(role: 'owner' | 'collaborator' = 'owner') {
  return render(
    <MemoryRouter initialEntries={['/admin/prospectos?company=company-1']}>
      <AdminAuthContext.Provider value={authValue(role)}>
        <RedComercialProspectsPage />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('RedComercialProspectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    repositoryMocks.listRepresentedCompanies.mockResolvedValue({ data: [centro, questar], error: null })
    repositoryMocks.listMyRepresentedCompanies.mockResolvedValue({ data: [centro], error: null })
    repositoryMocks.listCompanyMemberships.mockResolvedValue({ data: memberships, error: null })
    repositoryMocks.listCollaborators.mockResolvedValue({ data: collaborators, error: null })
    repositoryMocks.listRedComercialProspects.mockResolvedValue({ data: { rows: [fullRow, limitedRow], total: 2 }, error: null })
    repositoryMocks.getRedComercialProspectMetrics.mockResolvedValue({ data: { total_prospects: 2, to_contact: 0, contacted_no_response: 1, follow_up: 1, agreed: 0, overdue: 1, today: 1, interested: 0 }, error: null })
    repositoryMocks.getRedComercialProspectDetail.mockImplementation((id: string) => Promise.resolve({ data: id === 'prospect-1' ? fullDetail : limitedDetail, error: null }))
    repositoryMocks.detectRedComercialProspectDuplicates.mockResolvedValue({ data: [], error: null })
    repositoryMocks.createRedComercialProspect.mockResolvedValue({ data: fullDetail, error: null })
    repositoryMocks.updateRedComercialProspect.mockResolvedValue({ data: fullDetail, error: null })
    repositoryMocks.createRedComercialProspectActivity.mockResolvedValue({ data: fullDetail, error: null })
    repositoryMocks.getRedComercialProspectPanel.mockImplementation((id: string) => Promise.resolve({ data: { prospect: id === 'prospect-1' ? fullDetail : limitedDetail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null }))
    repositoryMocks.updateRedComercialOpportunity.mockResolvedValue({ data: { prospect: fullDetail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.createRedComercialOpportunity.mockResolvedValue({ data: { prospect: fullDetail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.createRedComercialCrossOpportunity.mockResolvedValue({ data: { prospect: fullDetail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.createRedComercialProspectNote.mockResolvedValue({ data: { prospect: fullDetail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
  })

  afterEach(() => cleanup())

  test('admin ve todas las empresas disponibles', async () => {
    renderPage('owner')
    const selector = await screen.findByLabelText('Empresa actual')
    expect(within(selector).getByRole('option', { name: 'Centro Psicovinculo' })).toBeInTheDocument()
    expect(within(selector).getByRole('option', { name: 'Questar' })).toBeInTheDocument()
  })

  test('collaborator usa solo sus carteras en selector', async () => {
    renderPage('collaborator')
    const selector = await screen.findByLabelText('Empresa actual')
    expect(within(selector).getByRole('option', { name: 'Centro Psicovinculo' })).toBeInTheDocument()
    expect(within(selector).queryByRole('option', { name: 'Questar' })).not.toBeInTheDocument()
    expect(repositoryMocks.listMyRepresentedCompanies).toHaveBeenCalled()
  })

  test('collaborator no responsable recibe listado limitado', async () => {
    renderPage('collaborator')
    expect(await screen.findByText('Empresa DEF')).toBeInTheDocument()
    expect(screen.getAllByText('Privado').length).toBeGreaterThan(0)
    expect(screen.queryByText('daniel@example.com')).toBeInTheDocument()
  })

  test('collaborator ve estado de venta entregado a Arista en modo lectura', async () => {
    const user = userEvent.setup()
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('collaborator')
    await user.click(await screen.findByText('Empresa ABC'))
    expect(await screen.findByText('Gestión entregada a Arista')).toBeInTheDocument()
    expect(screen.getByText('Contrato')).toBeInTheDocument()
    expect(screen.queryByLabelText('Control actual')).not.toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Por validar')).toBeInTheDocument()
  })

  test('admin conserva los controles editables del estado de venta', async () => {
    const user = userEvent.setup()
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    expect(await screen.findByLabelText('Control actual')).toBeInTheDocument()
    expect(screen.getByLabelText('Contrato')).toBeInTheDocument()
    expect(screen.getByLabelText('Pago cliente')).toBeInTheDocument()
  })

  test('panel lateral muestra detalle completo o aviso limitado', async () => {
    const user = userEvent.setup()
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(await screen.findByRole('button', { name: 'Notas' }))
    expect(await screen.findByText('Nota sensible')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Actividades' }))
    expect(screen.getByText('Email enviado')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('Nota sensible')).not.toBeInTheDocument())

    await user.click(screen.getByText('Empresa DEF'))
    expect(await screen.findByText(/Este prospecto/)).toBeInTheDocument()
    expect(screen.queryByText('Nota sensible')).not.toBeInTheDocument()
  })

  test('chips y filtros recargan prospectos sin perder pantalla', async () => {
    const user = userEvent.setup()
    renderPage('owner')
    await user.click(await screen.findByRole('button', { name: /Vencidos 1/ }))
    await waitFor(() => expect(repositoryMocks.listRedComercialProspects).toHaveBeenLastCalledWith('company-1', expect.objectContaining({ quickFilter: 'overdue' })))

    await user.type(screen.getByPlaceholderText('Buscar empresa, contacto o email...'), 'ABC')
    await waitFor(() => expect(repositoryMocks.listRedComercialProspects).toHaveBeenLastCalledWith('company-1', expect.objectContaining({ search: 'ABC' })))
  })

  test('bloquea duplicados evidentes al crear prospecto', async () => {
    const user = userEvent.setup()
    repositoryMocks.detectRedComercialProspectDuplicates.mockResolvedValueOnce({
      data: [{ id: 'dup-1', company_name: 'Empresa ABC', status: 'follow_up', owner_name: 'Camila Perez', duplicate_reason: 'company_name', same_company: true }],
      error: null,
    })
    renderPage('owner')
    await user.click(await screen.findByRole('button', { name: /Nuevo prospecto/ }))
    await user.type(screen.getByLabelText('Empresa *'), 'Empresa ABC')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText(/Este prospecto ya existe en esta cartera/)).toBeInTheDocument()
    expect(repositoryMocks.createRedComercialProspect).not.toHaveBeenCalled()
  })

  test('archiva y registra actividad desde el panel', async () => {
    const user = userEvent.setup()
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(await screen.findByRole('button', { name: /Archivar/ }))
    expect(repositoryMocks.updateRedComercialProspect).toHaveBeenCalledWith('prospect-1', expect.objectContaining({ is_archived: true, status: 'archived' }))

    await user.click(screen.getByRole('button', { name: '+ Actividad' }))
    await user.type(screen.getByLabelText('Titulo'), 'WhatsApp enviado')
    await user.click(screen.getByRole('button', { name: 'Registrar actividad' }))
    expect(repositoryMocks.createRedComercialProspectActivity).toHaveBeenCalledWith('prospect-1', expect.objectContaining({ title: 'WhatsApp enviado' }))
  })
})
