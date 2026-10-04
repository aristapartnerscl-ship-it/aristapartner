import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext, type AdminAuthContextValue } from '../admin-auth-context'
import type { RedComercialDashboardData } from '../../types/admin'
import { RedComercialDashboardPage } from './RedComercialDashboardPage'

const mocks = vi.hoisted(() => ({ getRedComercialDashboard: vi.fn() }))
vi.mock('../../repositories', () => ({ adminRepository: mocks }))

const adminAuth: AdminAuthContextValue = {
  status: 'ready',
  session: null,
  user: { id: 'admin-1' } as AdminAuthContextValue['user'],
  profile: { id: 'admin-1', full_name: 'Admin', email: 'admin@test', role: 'owner', is_active: true, created_at: '', updated_at: '' } as AdminAuthContextValue['profile'],
  signIn: vi.fn(),
  signOut: vi.fn(),
}
const collaboratorAuth: AdminAuthContextValue = {
  ...adminAuth,
  user: { id: 'collab-1' } as AdminAuthContextValue['user'],
  profile: { ...adminAuth.profile, id: 'collab-1', role: 'collaborator' } as AdminAuthContextValue['profile'],
}
const dashboardData: RedComercialDashboardData = {
  summary: { followups_today: 2, followups_overdue: 1, active_prospects: 4, opportunities_in_process: 3, opportunities_arista: 1, payments_pending: 2, won_this_month: 1, commission_pending: 1 },
  attention_today: [{ type: 'followup_overdue', label: 'Seguimiento vencido', prospect_id: 'prospect-1', prospect_name: 'Empresa ABC', company_id: 'company-1', company_name: 'Centro Psicovinculo', reason: 'Contactar hoy', owner_name: 'Admin', at: '2026-10-04T12:00:00Z', href: '/admin/seguimientos?view=overdue' }],
  upcoming_followups: [],
  opportunities: [],
  cross_opportunities: [],
  recent_results: [],
  portfolios: [{ id: 'company-1', name: 'Centro Psicovinculo', logo_storage_path: null, active_prospects: 4, overdue: 1, opportunities_in_process: 3, href: '/admin/prospectos?company=company-1' }],
  recent_activity: [],
}

function renderPage(auth: AdminAuthContextValue = adminAuth) {
  return render(<MemoryRouter initialEntries={['/admin']}><AdminAuthContext.Provider value={auth}><RedComercialDashboardPage /></AdminAuthContext.Provider></MemoryRouter>)
}

function opportunity(overrides: Partial<RedComercialDashboardData['opportunities'][number]> = {}) {
  return {
    id: 'opportunity-1',
    prospect_id: 'prospect-1',
    prospect_name: 'Empresa ABC',
    company_id: 'company-1',
    company_name: 'Centro Psicovinculo',
    control_mode: 'arista',
    contract_status: 'signed',
    payment_status: 'paid',
    result_status: 'in_process',
    collaborator_name: 'Alonso Gonzalez',
    updated_at: '2026-10-04T12:00:00Z',
    href: '/admin/oportunidades',
    ...overrides,
  }
}

describe('RedComercialDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getRedComercialDashboard.mockResolvedValue({ data: dashboardData, error: null })
  })
  afterEach(() => cleanup())

  test('admin carga KPIs, atencion, carteras y deep links desde una consulta consolidada', async () => {
    renderPage()
    expect(await screen.findByText('Red Comercial Arista')).toBeInTheDocument()
    expect(screen.getByText('Seguimientos hoy')).toBeInTheDocument()
    expect(screen.getAllByText(/Atenci/).length).toBeGreaterThan(0)
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Centro Psicovinculo/i })).toHaveAttribute('href', '/admin/prospectos?company=company-1')
    expect(mocks.getRedComercialDashboard).toHaveBeenCalledWith('today')
  })

  test('collaborator usa labels propios y no expone metricas globales', async () => {
    renderPage(collaboratorAuth)
    await waitFor(() => expect(mocks.getRedComercialDashboard).toHaveBeenCalledWith('today'))
    expect(await screen.findByText('Mis seguimientos hoy')).toBeInTheDocument()
    expect(screen.getByText('Participaciones pendientes')).toBeInTheDocument()
    expect(screen.queryByText('Ganadas este mes')).not.toBeInTheDocument()
    expect(screen.queryByText('Pagos pendientes')).not.toBeInTheDocument()
  })

  test('muestra estados vacios sin romper la estructura', async () => {
    mocks.getRedComercialDashboard.mockResolvedValue({ data: { ...dashboardData, attention_today: [], portfolios: [] }, error: null })
    renderPage()
    expect(await screen.findByText(/Todo al d/)).toBeInTheDocument()
    expect(screen.getByText('No hay carteras disponibles.')).toBeInTheDocument()
  })

  test('muestra pago cliente y participacion propia en oportunidades del collaborator', async () => {
    mocks.getRedComercialDashboard.mockResolvedValue({ data: { ...dashboardData, opportunities: [opportunity({ commission_status: 'pending_payment', collaborator_compensation_type: 'percentage', collaborator_compensation_rate: 40 })] }, error: null })
    renderPage(collaboratorAuth)
    expect(await screen.findByText(/Cliente pag/)).toBeInTheDocument()
    expect(screen.getByText('Pago cliente')).toBeInTheDocument()
    expect(screen.getByText(/Mi particip/)).toBeInTheDocument()
    expect(screen.getByText('Pendiente de pago')).toBeInTheDocument()
    expect(screen.getByText('Control')).toBeInTheDocument()
    expect(screen.getByText('Contrato')).toBeInTheDocument()
    expect(screen.getByText('Firmado')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  test('muestra participacion pagada cuando la RPC entrega paid y porcentaje propio', async () => {
    mocks.getRedComercialDashboard.mockResolvedValue({ data: { ...dashboardData, opportunities: [opportunity({ id: 'opportunity-paid', commission_status: 'paid', collaborator_compensation_type: 'percentage', collaborator_compensation_rate: 40 })] }, error: null })
    renderPage(collaboratorAuth)
    expect(await screen.findByText(/Cliente pag/)).toBeInTheDocument()
    expect(screen.getByText('Pagada')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  test('no convierte commission_status ausente en una comision no generada', async () => {
    mocks.getRedComercialDashboard.mockResolvedValue({ data: { ...dashboardData, opportunities: [opportunity()] }, error: null })
    renderPage(collaboratorAuth)
    expect(await screen.findByText('Sin información')).toBeInTheDocument()
    expect(screen.queryByText(/A.n no generada/)).not.toBeInTheDocument()
  })

  test('agrupa actualizaciones consecutivas pero conserva eventos importantes', async () => {
    const activity = (created_at: string, title: string, activity_type = 'status_change') => ({ id: created_at, title, activity_type, created_by_name: 'Admin', created_at, prospect_name: 'Empresa ABC' })
    mocks.getRedComercialDashboard.mockResolvedValue({ data: { ...dashboardData, recent_activity: [activity('2026-10-04T18:30:00Z', 'Oportunidad actualizada'), activity('2026-10-04T18:31:00Z', 'Oportunidad actualizada'), activity('2026-10-04T18:32:00Z', 'Oportunidad actualizada'), activity('2026-10-04T18:33:00Z', 'Oportunidad actualizada'), activity('2026-10-04T18:34:00Z', 'Oportunidad entregada a Arista')] }, error: null })
    renderPage()
    expect(await screen.findByText(/4 cambios/)).toBeInTheDocument()
    expect(screen.getByText('Oportunidad entregada a Arista')).toBeInTheDocument()
  })
})
