import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import type { RedComercialFollowupListItem, RedComercialProspectDetailRecord, RepresentedCompanyRecord } from '../../types/admin'
import { RedComercialFollowupsPage } from './RedComercialFollowupsPage'

const repositoryMocks = vi.hoisted(() => ({
  listRepresentedCompanies: vi.fn(), listMyRepresentedCompanies: vi.fn(), listCollaborators: vi.fn(),
  listRedComercialFollowups: vi.fn(), getRedComercialFollowupMetrics: vi.fn(), getRedComercialProspectDetail: vi.fn(),
  createRedComercialProspectActivity: vi.fn(),
  getRedComercialProspectPanel: vi.fn(), updateRedComercialProspect: vi.fn(),
  createRedComercialOpportunity: vi.fn(), updateRedComercialOpportunity: vi.fn(), createRedComercialCrossOpportunity: vi.fn(),
  createRedComercialProspectNote: vi.fn(), updateRedComercialProspectNote: vi.fn(), uploadRedComercialProspectFile: vi.fn(),
  createRedComercialProspectFileSignedUrl: vi.fn(), archiveRedComercialProspectFile: vi.fn(),
}))

vi.mock('../../repositories', () => ({ adminRepository: repositoryMocks }))

const company: RepresentedCompanyRecord = {
  id: 'company-1', name: 'Centro Psicovinculo', slug: 'centro-psicovinculo', description: null, website_url: null,
  logo_storage_path: null, logo_source: 'fallback', status: 'active', offer_summary: null, problem_solved: null,
  ideal_customer: null, target_industries: [], territory: null, keywords: [], opportunity_examples: [],
  what_not_to_promise: null, internal_owner_id: null, created_at: '', updated_at: '',
}

const row: RedComercialFollowupListItem = {
  id: 'prospect-1', represented_company_id: company.id, represented_company_name: company.name,
  represented_company_logo_storage_path: null, company_name: 'Empresa ABC', status: 'follow_up', channel: 'whatsapp',
  last_contact_at: '2026-09-30T12:00:00Z', next_followup_at: '2026-10-01T12:00:00Z', owner_user_id: 'collab-1', owner_name: 'Camila Perez',
  latest_activity_title: 'WhatsApp enviado', latest_activity_type: 'whatsapp', latest_activity_at: '2026-09-30T12:00:00Z', is_no_movement: false, days_overdue: 0, total_count: 1,
}

const detail: RedComercialProspectDetailRecord = {
  id: row.id, represented_company_id: company.id, company_name: row.company_name, website_url: null, domain: null, rut: null,
  contact_name: 'Daniel Perez', contact_role: 'Gerente', contact_email: 'daniel@example.com', contact_phone: '+56912345678', channel: 'whatsapp', status: 'follow_up',
  first_contact_at: row.last_contact_at, last_contact_at: row.last_contact_at, next_followup_at: row.next_followup_at, owner_user_id: 'collab-1',
  owner: { id: 'collab-1', full_name: 'Camila Perez', email: null }, collaborators: [], internal_notes: null, is_archived: false, can_view_detail: true, activities: [], created_at: '', updated_at: '',
}

function auth(role: 'owner' | 'collaborator'): AdminAuthContextValue {
  return {
    status: 'ready', session: null, user: { id: role === 'owner' ? 'owner-1' : 'collab-1', email: 'user@example.com' } as AdminAuthContextValue['user'],
    profile: { id: role === 'owner' ? 'owner-1' : 'collab-1', full_name: 'User', email: 'user@example.com', role, is_active: true, created_at: '', updated_at: '' } as AdminAuthContextValue['profile'],
    signIn: vi.fn(), signOut: vi.fn(),
  }
}

function renderPage(role: 'owner' | 'collaborator' = 'collaborator') {
  return render(<MemoryRouter initialEntries={['/admin/seguimientos']}><AdminAuthContext.Provider value={auth(role)}><RedComercialFollowupsPage /></AdminAuthContext.Provider></MemoryRouter>)
}

describe('RedComercialFollowupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositoryMocks.listRepresentedCompanies.mockResolvedValue({ data: [company], error: null })
    repositoryMocks.listMyRepresentedCompanies.mockResolvedValue({ data: [company], error: null })
    repositoryMocks.listCollaborators.mockResolvedValue({ data: [], error: null })
    repositoryMocks.listRedComercialFollowups.mockResolvedValue({ data: { rows: [row], total: 1 }, error: null })
    repositoryMocks.getRedComercialFollowupMetrics.mockResolvedValue({ data: { today: 1, overdue: 0, upcoming: 0, no_followup: 0, no_movement: 0, total: 1 }, error: null })
    repositoryMocks.getRedComercialProspectDetail.mockResolvedValue({ data: detail, error: null })
    repositoryMocks.createRedComercialProspectActivity.mockResolvedValue({ data: detail, error: null })
    repositoryMocks.getRedComercialProspectPanel.mockResolvedValue({ data: { prospect: detail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
    repositoryMocks.updateRedComercialProspect.mockResolvedValue({ data: detail, error: null })
    repositoryMocks.updateRedComercialOpportunity.mockResolvedValue({ data: { prospect: detail, opportunities: [], cross_opportunities: [], notes: [], files: [] }, error: null })
  })

  afterEach(() => cleanup())

  test('collaborator consulta sólo su agenda mediante el repository global', async () => {
    renderPage()
    expect(await screen.findByText('Empresa ABC')).toBeInTheDocument()
    expect(repositoryMocks.listMyRepresentedCompanies).toHaveBeenCalled()
    expect(repositoryMocks.listRedComercialFollowups).toHaveBeenCalledWith(expect.objectContaining({ view: 'all' }))
  })

  test('los chips cambian la vista operativa sin cambiar de ruta', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: /Vencidos/ }))
    await waitFor(() => expect(repositoryMocks.listRedComercialFollowups).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'overdue' })))
  })

  test('abre el detalle existente y registra actividad de seguimiento', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByText('Empresa ABC'))
    await user.click(await screen.findByRole('button', { name: 'Reprogramar' }))
    await user.type(screen.getByLabelText('Fecha y hora'), '2026-10-05T10:30')
    await user.click(screen.getByRole('button', { name: 'Guardar seguimiento' }))
    expect(repositoryMocks.createRedComercialProspectActivity).toHaveBeenCalledWith('prospect-1', expect.objectContaining({ activity_type: 'followup', next_followup_at: expect.any(String) }))
  })
})
