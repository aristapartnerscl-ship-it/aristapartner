import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminAuthContext, type AdminAuthContextValue } from '../admin-auth-context'
import type { RedComercialCompanyWorkspace, RepresentedCompanyRecord } from '../../types/admin'
import { CompanyDetailPage } from './RedComercialPages'

const repositoryMocks = vi.hoisted(() => ({
  getRedComercialCompanyWorkspace: vi.fn(),
  updateRedComercialCompanyPlaybook: vi.fn(),
  upsertRedComercialCompanyFaq: vi.fn(),
}))

vi.mock('../../repositories', () => ({ adminRepository: repositoryMocks }))

const company: RepresentedCompanyRecord = {
  id: '688cc959-1c1c-49c8-aa12-9a6eac2a53fd', name: 'Centro Psicovinculo', slug: 'centro-psicovinculo', description: 'Descripcion',
  website_url: null, logo_storage_path: null, logo_source: 'fallback', status: 'active', offer_summary: 'Oferta', problem_solved: 'Problema',
  ideal_customer: 'Cliente ideal', target_industries: [], territory: 'Chile', keywords: [], opportunity_examples: [], what_not_to_promise: null,
  internal_owner_id: null, created_at: '', updated_at: '',
}

const workspace: RedComercialCompanyWorkspace = {
  company, playbook: {}, faqs: [], materials: [], private_details: null, can_edit: true, is_assigned: false, updated_at: null,
}

const auth: AdminAuthContextValue = {
  status: 'ready', session: null, user: null, profile: { id: 'owner-1', full_name: 'Admin', email: null, role: 'owner', is_active: true, created_at: '', updated_at: '' },
  signIn: vi.fn(), signOut: vi.fn(),
}

function renderRoute(path: string) {
  return render(<AdminAuthContext.Provider value={auth}><MemoryRouter initialEntries={[path]}><Routes><Route path="/admin/empresas/:id" element={<CompanyDetailPage />} /><Route path="*" element={<CompanyDetailPage />} /></Routes></MemoryRouter></AdminAuthContext.Provider>)
}

describe('CompanyDetailPage company id routing', () => {
  beforeEach(() => {
    repositoryMocks.getRedComercialCompanyWorkspace.mockResolvedValue({ data: workspace, error: null })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  test('usa el UUID real de la URL al cargar el workspace', async () => {
    renderRoute('/admin/empresas/688cc959-1c1c-49c8-aa12-9a6eac2a53fd')

    await waitFor(() => expect(repositoryMocks.getRedComercialCompanyWorkspace).toHaveBeenCalledWith('688cc959-1c1c-49c8-aa12-9a6eac2a53fd'))
    expect(repositoryMocks.getRedComercialCompanyWorkspace).not.toHaveBeenCalledWith('00000000-0000-0000-0000-000000000000')
    expect(await screen.findByText('Centro Psicovinculo')).toBeInTheDocument()
  })

  test('no llama la RPC con un id invalido', async () => {
    renderRoute('/admin/empresas/not-a-uuid')

    expect(await screen.findByText('La empresa indicada en la URL no es valida.')).toBeInTheDocument()
    expect(repositoryMocks.getRedComercialCompanyWorkspace).not.toHaveBeenCalled()
  })

  test('no llama la RPC si la ruta no tiene id', async () => {
    renderRoute('/admin/empresas')

    expect(await screen.findByText('La empresa indicada en la URL no es valida.')).toBeInTheDocument()
    expect(repositoryMocks.getRedComercialCompanyWorkspace).not.toHaveBeenCalled()
  })
})
