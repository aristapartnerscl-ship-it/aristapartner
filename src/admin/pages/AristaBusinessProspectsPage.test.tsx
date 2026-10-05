import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AristaBusinessProspectsPage } from './AristaBusinessProspectsPage'

const repositoryMocks = vi.hoisted(() => ({
  listAristaBusinessProspects: vi.fn(),
  createAristaBusinessProspect: vi.fn(),
  getAristaBusinessProspect: vi.fn(),
  updateAristaBusinessProspect: vi.fn(),
  convertAristaBusinessProspect: vi.fn(),
}))

vi.mock('../../repositories', () => ({ adminRepository: repositoryMocks }))

const prospect = {
  id: 'arista-prospect-1', company_name: 'Nova Software', website: 'https://nova.example', domain: 'nova.example',
  industry: 'Software', country: 'Chile', contact_name: 'Ana', contact_role: 'CEO', contact_email: 'ana@nova.example', contact_phone: null,
  source: 'manual', what_they_sell: 'Software', why_interesting: 'Buen encaje', fit_notes: null, estimated_ticket: null, territory: null,
  status: 'negotiation', owner_user_id: null, owner_name: null, first_contact_at: null, last_contact_at: null, next_followup_at: null,
  is_archived: false, converted_represented_company_id: null, converted_at: null, created_at: '', updated_at: '', activities: [],
}

describe('AristaBusinessProspectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositoryMocks.listAristaBusinessProspects.mockResolvedValue({ data: [prospect], error: null })
    repositoryMocks.createAristaBusinessProspect.mockResolvedValue({ data: prospect, error: null })
    repositoryMocks.getAristaBusinessProspect.mockResolvedValue({ data: prospect, error: null })
  })

  test('muestra prospecciones y permite abrir el detalle', async () => {
    const user = userEvent.setup()
    render(<AristaBusinessProspectsPage />)
    expect(await screen.findByText('Nova Software')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    await waitFor(() => expect(repositoryMocks.getAristaBusinessProspect).toHaveBeenCalledWith('arista-prospect-1'))
  })

  test('crea una prospección desde el formulario administrativo', async () => {
    const user = userEvent.setup()
    render(<AristaBusinessProspectsPage />)
    await user.click(screen.getAllByRole('button', { name: /Nueva prospección/i })[0])
    await user.type(screen.getByLabelText('Empresa'), 'Nueva Empresa')
    await user.click(screen.getByRole('button', { name: 'Crear prospección' }))
    await waitFor(() => expect(repositoryMocks.createAristaBusinessProspect).toHaveBeenCalledWith(expect.objectContaining({ company_name: 'Nueva Empresa' })))
  })
})
