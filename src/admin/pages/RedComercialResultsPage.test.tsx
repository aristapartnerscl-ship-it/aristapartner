import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import { RedComercialResultsPage } from './RedComercialResultsPage'

const mocks = vi.hoisted(() => ({ listRepresentedCompanies: vi.fn(), listMyRepresentedCompanies: vi.fn(), listCollaborators: vi.fn(), getRedComercialResults: vi.fn(), getRedComercialProspectDetail: vi.fn() }))
vi.mock('../../repositories', () => ({ adminRepository: mocks }))

const adminAuth: AdminAuthContextValue = { status: 'ready', session: null, user: { id: 'admin-1' } as AdminAuthContextValue['user'], profile: { id: 'admin-1', full_name: 'Admin', email: 'admin@test', role: 'owner', is_active: true, created_at: '', updated_at: '' } as AdminAuthContextValue['profile'], signIn: vi.fn(), signOut: vi.fn() }
const collaboratorAuth = { ...adminAuth, user: { id: 'collab-1' } as AdminAuthContextValue['user'], profile: { ...adminAuth.profile, id: 'collab-1', role: 'collaborator' } as AdminAuthContextValue['profile'] }
const data = { summary: { closures: 2, won: 1, lost: 1, cancelled: 1, in_process: 2, paid: 1, payment_pending: 1, commission_pending: 1, close_rate: 50, avg_close_days: 4 }, volume_by_currency: { CLP: 100000 }, companies: [], collaborators: [], closures: [], total_closures: 0 }

function renderPage(auth = adminAuth) { return render(<MemoryRouter initialEntries={['/admin/resultados']}><AdminAuthContext.Provider value={auth}><RedComercialResultsPage /></AdminAuthContext.Provider></MemoryRouter>) }

describe('RedComercialResultsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.listRepresentedCompanies.mockResolvedValue({ data: [{ id: 'company-1', name: 'Empresa', status: 'active' }], error: null }); mocks.listMyRepresentedCompanies.mockResolvedValue({ data: [], error: null }); mocks.listCollaborators.mockResolvedValue({ data: [], error: null }); mocks.getRedComercialResults.mockResolvedValue({ data, error: null }) })
  afterEach(() => cleanup())
  test('admin muestra resumen y excluye canceladas de la tasa', async () => { renderPage(); expect(await screen.findByText('Resultados')).toBeInTheDocument(); expect(screen.getByText('50%')).toBeInTheDocument(); expect(screen.getAllByText('1').length).toBeGreaterThan(0); expect(mocks.getRedComercialResults).toHaveBeenCalledWith(expect.objectContaining({ from: expect.any(String), to: expect.any(String) })) })
  test('collaborator usa sus carteras y no muestra tab global de colaboradores', async () => { renderPage(collaboratorAuth); await waitFor(() => expect(mocks.listMyRepresentedCompanies).toHaveBeenCalled()); expect(screen.queryByText('Colaboradores')).not.toBeInTheDocument(); expect(screen.getByText('Mis resultados')).toBeInTheDocument(); expect(mocks.getRedComercialResults).toHaveBeenCalled() })
})
