import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import { AdminShell } from '../../components/admin/AdminShell'
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
  getUnreadAdminNotificationCount: vi.fn(),
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
  attributed_collaborator_name: 'Camila Perez',
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

function renderPage(role: 'owner' | 'collaborator' = 'owner', initialEntry = '/admin/prospectos?company=company-1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdminAuthContext.Provider value={authValue(role)}>
        <RedComercialProspectsPage />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

function renderPageInShell(role: 'owner' | 'collaborator' = 'owner', initialEntry = '/admin/prospectos?company=company-1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdminAuthContext.Provider value={authValue(role)}>
        <AdminShell>
          <Routes>
            <Route path="/admin/prospectos" element={<RedComercialProspectsPage />} />
          </Routes>
        </AdminShell>
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
    repositoryMocks.getUnreadAdminNotificationCount.mockResolvedValue({ data: 0, error: null })
  })

  afterEach(() => cleanup())

  test('/admin/prospectos sin company muestra selector sin auto-seleccionar cartera', async () => {
    renderPage('owner', '/admin/prospectos')
    expect(await screen.findByText('Selecciona una Empresa Arista para gestionar su cartera comercial.')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Centro Psicovinculo/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Questar/ })).toBeInTheDocument()
    expect(repositoryMocks.listRedComercialProspects).not.toHaveBeenCalled()
  })

  test('selector base respeta carteras de collaborator', async () => {
    renderPage('collaborator', '/admin/prospectos')
    expect(await screen.findByRole('button', { name: /Centro Psicovinculo/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Questar/ })).not.toBeInTheDocument()
    expect(repositoryMocks.listMyRepresentedCompanies).toHaveBeenCalled()
  })

  test('click en tarjeta agrega company query y carga workspace actual', async () => {
    const user = userEvent.setup()
    renderPage('owner', '/admin/prospectos')
    await user.click(await screen.findByRole('button', { name: /Centro Psicovinculo/ }))
    await waitFor(() => expect(repositoryMocks.listRedComercialProspects).toHaveBeenCalledWith('company-1', expect.objectContaining({ page: 1 })))
    expect(await screen.findByText('Empresa ABC')).toBeInTheDocument()
    expect(await screen.findByLabelText('Empresa actual')).toBeInTheDocument()
  })

  test('/admin/prospectos con company mantiene workspace operativo', async () => {
    renderPage('owner', '/admin/prospectos?company=company-1')
    expect(await screen.findByLabelText('Empresa actual')).toBeInTheDocument()
    expect(await screen.findByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.queryByText('Selecciona una Empresa Arista para gestionar su cartera comercial.')).not.toBeInTheDocument()
  })

  test('selector Empresa actual cambia la cartera manteniendo la pantalla operativa', async () => {
    const user = userEvent.setup()
    renderPage('owner', '/admin/prospectos?company=company-1')
    await user.selectOptions(await screen.findByLabelText('Empresa actual'), 'company-2')
    await waitFor(() => expect(repositoryMocks.listRedComercialProspects).toHaveBeenCalledWith('company-2', expect.objectContaining({ page: 1 })))
  })

  test('sidebar Prospectos vuelve al selector global', async () => {
    const user = userEvent.setup()
    renderPageInShell('owner', '/admin/prospectos?company=company-1')
    await screen.findByLabelText('Empresa actual')
    await user.click(screen.getByRole('link', { name: /Prospectos/ }))
    expect(await screen.findByText('Selecciona una Empresa Arista para gestionar su cartera comercial.')).toBeInTheDocument()
  })

  test('deep link contextual con company y open abre el prospecto seleccionado', async () => {
    renderPage('owner', '/admin/prospectos?company=company-1&open=prospect-1')
    await waitFor(() => expect(repositoryMocks.getRedComercialProspectDetail).toHaveBeenCalledWith('prospect-1'))
    expect(await screen.findByText('Estado de la venta')).toBeInTheDocument()
  })

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
    expect(await screen.findByText('Gestion entregada a Arista')).toBeInTheDocument()
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

  test('admin no puede guardar participacion sin colaborador atribuido', async () => {
    const user = userEvent.setup()
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(await screen.findByRole('button', { name: /Crear oportunidad/ }))
    await user.selectOptions(screen.getByLabelText('Tipo de participacion'), 'percentage')
    await user.type(screen.getByLabelText('Participacion atribuida'), '40')
    await user.click(screen.getAllByRole('button', { name: 'Crear oportunidad' }).at(-1)!)
    expect(await screen.findByText('Selecciona un colaborador atribuido para registrar participacion.')).toBeInTheDocument()
    expect(repositoryMocks.createRedComercialOpportunity).not.toHaveBeenCalled()
  })

  test('admin ve participacion atribuida sin texto de propiedad personal', async () => {
    const user = userEvent.setup()
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    expect(await screen.findByText('Colaborador atribuido')).toBeInTheDocument()
    expect(screen.getAllByText('Camila Perez').length).toBeGreaterThan(0)
    expect(screen.getByText('Participacion atribuida')).toBeInTheDocument()
    expect(screen.queryByText('Tu participacion atribuida')).not.toBeInTheDocument()
  })

  test('admin asigna collaborator por UUID y el panel rehidratado lo conserva', async () => {
    const user = userEvent.setup()
    const orphanOpportunity = { ...aristaOpportunity, attributed_collaborator_id: null, attributed_collaborator_name: null }
    const assignedOpportunity = { ...aristaOpportunity, attributed_collaborator_id: 'collab-1', attributed_collaborator_name: 'Camila Perez' }
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [orphanOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.updateRedComercialOpportunity.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [assignedOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    await user.selectOptions(await screen.findByLabelText('Colaborador atribuido'), 'collab-1')
    expect(repositoryMocks.updateRedComercialOpportunity).toHaveBeenCalledWith('opportunity-1', { attributed_collaborator_id: 'collab-1' })
    await waitFor(() => expect((screen.getByLabelText('Colaborador atribuido') as HTMLSelectElement).value).toBe('collab-1'))
    expect(screen.getByText('Participacion atribuida')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  test('admin quita atribucion y la respuesta limpia participacion', async () => {
    const user = userEvent.setup()
    const clearedOpportunity = { ...aristaOpportunity, attributed_collaborator_id: null, attributed_collaborator_name: null, collaborator_compensation_type: null, collaborator_compensation_rate: null, collaborator_compensation_amount: null }
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.updateRedComercialOpportunity.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [clearedOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('owner')
    await user.click(await screen.findByText('Empresa ABC'))
    await user.selectOptions(await screen.findByLabelText('Colaborador atribuido'), '')
    expect(repositoryMocks.updateRedComercialOpportunity).toHaveBeenCalledWith('opportunity-1', { attributed_collaborator_id: '' })
    await waitFor(() => expect((screen.getByLabelText('Colaborador atribuido') as HTMLSelectElement).value).toBe(''))
    expect(screen.getAllByText('Sin definir').length).toBeGreaterThan(0)
    expect(screen.queryByText('40%')).not.toBeInTheDocument()
  })

  test('collaborator atribuido ve su participacion y no atribuido no ve compensacion', async () => {
    const user = userEvent.setup()
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('collaborator')
    await user.click(await screen.findByText('Empresa ABC'))
    expect((await screen.findAllByText('Mi participacion')).length).toBeGreaterThan(0)
    expect(screen.getByText('40%')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [{ ...aristaOpportunity, attributed_collaborator_id: null, attributed_collaborator_name: null }], cross_opportunities: [], notes: [], files: [] }, error: null })
    await user.click(await screen.findByText('Empresa ABC'))
    expect(await screen.findByText('Colaborador atribuido')).toBeInTheDocument()
    expect(screen.queryByText('Tu participacion atribuida')).not.toBeInTheDocument()
    expect(screen.queryByText('40%')).not.toBeInTheDocument()
  })

  test('collaborator no puede reasignar atribucion desde el panel', async () => {
    const user = userEvent.setup()
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValueOnce({ data: { prospect: fullDetail, opportunities: [aristaOpportunity], cross_opportunities: [], notes: [], files: [] }, error: null })
    renderPage('collaborator')
    await user.click(await screen.findByText('Empresa ABC'))
    expect(await screen.findByText('Colaborador atribuido')).toBeInTheDocument()
    expect(screen.queryByLabelText('Colaborador atribuido')).not.toBeInTheDocument()
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
