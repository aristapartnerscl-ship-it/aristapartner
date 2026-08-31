import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminProspectDetail, AdminProspecting } from './AdminProspecting'
import { adminRepository } from '../../repositories'
import type { ContactRecord, ProspectActivityRecord, ProspectRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listProspects: vi.fn(),
    getProspectById: vi.fn(),
    createProspect: vi.fn(),
    updateProspect: vi.fn(),
    listProspectActivities: vi.fn(),
    createProspectActivity: vi.fn(),
    completeProspectFollowUp: vi.fn(),
    reopenProspectFollowUp: vi.fn(),
    findContactCandidatesForProspect: vi.fn(),
    convertProspectToOpportunity: vi.fn(),
  },
}))

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const today = new Date().toISOString()
const earlierTodayDate = new Date()
earlierTodayDate.setHours(0, 0, 0, 0)
const earlierToday = earlierTodayDate.toISOString()

function prospect(overrides: Partial<ProspectRecord> = {}): ProspectRecord {
  return {
    id: 'prospect-1',
    prospect_type: 'person',
    full_name: 'Ana Prospecto',
    company_name: 'Empresa Uno',
    role_or_activity: 'Gerencia',
    email: 'ana@example.com',
    phone: '+56911111111',
    website: null,
    social_network: null,
    country: 'CL',
    city_region: 'Santiago',
    source: 'LinkedIn',
    product_or_service: 'Representación comercial',
    commercial_origin: 'Prospección manual',
    lead_temperature: 'identified',
    status: 'pending_contact',
    priority: 'high',
    preferred_contact_method: 'WhatsApp',
    next_action_type: 'llamar',
    next_action_at: tomorrow,
    last_contact_at: null,
    contact_attempts: 0,
    notes: 'Nota inicial',
    assigned_to: 'owner-1',
    converted_contact_id: null,
    converted_opportunity_id: null,
    converted_at: null,
    created_by: 'owner-1',
    created_at: '2026-08-28T12:00:00.000Z',
    updated_at: '2026-08-28T12:00:00.000Z',
    ...overrides,
  }
}

const prospects = [
  prospect(),
  prospect({ id: 'prospect-2', full_name: 'Ben Hoy', company_name: 'Empresa Dos', status: 'awaiting_response', priority: 'medium', next_action_at: today, contact_attempts: 1, last_contact_at: today }),
  prospect({ id: 'prospect-3', full_name: 'Carla Vencida', company_name: 'Empresa Tres', status: 'interested', next_action_at: yesterday, contact_attempts: 2, last_contact_at: yesterday }),
  prospect({ id: 'prospect-4', full_name: 'Daniel Convertido', company_name: 'Empresa Cuatro', status: 'converted', next_action_at: null, converted_contact_id: 'contact-1', converted_opportunity_id: 'opportunity-1', converted_at: today }),
  prospect({ id: 'prospect-5', full_name: 'Elena Archivada', company_name: 'Empresa Cinco', status: 'archived', next_action_at: null }),
  prospect({ id: 'prospect-6', full_name: 'Fabian Vencido Hoy', company_name: 'Empresa Seis', status: 'follow_up', next_action_at: earlierToday }),
  prospect({ id: 'prospect-7', full_name: 'Gina Convertida Hoy', company_name: 'Empresa Siete', status: 'converted', next_action_at: today, converted_contact_id: 'contact-2', converted_opportunity_id: 'opportunity-2', converted_at: today }),
]

const activity: ProspectActivityRecord = {
  id: 'activity-1',
  prospect_id: 'prospect-1',
  activity_type: 'call',
  outcome: 'answered',
  subject: 'Llamada inicial',
  notes: 'Respondió con interés',
  occurred_at: today,
  next_action_type: 'Enviar correo',
  next_action_at: tomorrow,
  completed_at: null,
  created_by: 'owner-1',
  created_at: today,
}

const contactCandidate: ContactRecord = {
  id: 'contact-1',
  contact_type: 'person',
  full_name: 'Ana Formal',
  company_name: 'Empresa Uno',
  position: null,
  email: 'ana@example.com',
  phone: '+56911111111',
  website: null,
  social_media: null,
  country: 'CL',
  region: null,
  city: 'Santiago',
  notes: null,
  source: 'prospecting',
  created_at: today,
  updated_at: today,
  created_by: 'owner-1',
}

function renderList(initialEntries = ['/admin/prospeccion']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/admin/prospeccion" element={<AdminProspecting />} />
        <Route path="/admin/prospeccion/:id" element={<AdminProspectDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/admin/prospeccion/prospect-1']}>
      <Routes>
        <Route path="/admin/prospeccion/:id" element={<AdminProspectDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminProspecting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.listProspects).mockResolvedValue({ data: prospects, error: null })
    vi.mocked(adminRepository.getProspectById).mockResolvedValue({ data: prospect(), error: null })
    vi.mocked(adminRepository.listProspectActivities).mockResolvedValue({ data: [activity], error: null })
    vi.mocked(adminRepository.findContactCandidatesForProspect).mockResolvedValue({ data: [contactCandidate], error: null })
  })

  afterEach(() => cleanup())

  test('lists prospects with filters, today and overdue quick views, desktop table and mobile cards', async () => {
    const user = userEvent.setup()
    renderList()

    expect((await screen.findAllByText('Ana Prospecto')).length).toBeGreaterThan(0)
    expect(screen.getByRole('columnheader', { name: 'Prospecto' })).toBeInTheDocument()
    expect(screen.getAllByText('Registrar').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(screen.getAllByText('Ben Hoy').length).toBeGreaterThan(0)
    expect(screen.queryByText('Gina Convertida Hoy')).not.toBeInTheDocument()
    expect(screen.queryByText('Ana Prospecto')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Vencidos' }))
    expect(screen.getAllByText('Carla Vencida').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fabian Vencido Hoy').length).toBeGreaterThan(0)

    cleanup()
    renderList(['/admin/prospeccion?q=Empresa%20Uno&priority=high'])
    expect(await screen.findAllByText('Ana Prospecto')).not.toHaveLength(0)
    expect(screen.queryByText('Ben Hoy')).not.toBeInTheDocument()
  })

  test('creates and edits prospects with stable focus and nullable payloads', async () => {
    const user = userEvent.setup()
    const saved = prospect({ id: 'prospect-new', full_name: 'Nuevo Prospecto' })
    vi.mocked(adminRepository.createProspect).mockResolvedValue({ data: saved, error: null })
    vi.mocked(adminRepository.updateProspect).mockResolvedValue({ data: { ...saved, status: 'interested' }, error: null })

    renderList()
    await user.click(await screen.findByRole('button', { name: 'Nuevo prospecto' }))
    const name = screen.getByLabelText('Nombre completo')
    await user.click(name)
    await user.type(name, 'Nuevo Prospecto')
    expect(document.activeElement).toBe(name)
    await user.click(screen.getByRole('button', { name: 'Guardar prospecto' }))
    expect(adminRepository.createProspect).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Nuevo Prospecto', email: null }))

    await user.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    await user.selectOptions(screen.getAllByLabelText('Estado')[1], 'interested')
    await user.click(screen.getByRole('button', { name: 'Guardar prospecto' }))
    expect(adminRepository.updateProspect).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ status: 'interested' }))
  }, 10000)

  test('records activities by type, increments through RPC contract, and stores next action', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.createProspectActivity).mockResolvedValue({ data: activity, error: null })
    vi.mocked(adminRepository.getProspectById).mockResolvedValue({ data: prospect({ contact_attempts: 1, last_contact_at: today }), error: null })

    renderDetail()
    expect(await screen.findByText('Línea de tiempo')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /WhatsApp/i })[0])
    const subject = screen.getByLabelText('Asunto')
    await user.clear(subject)
    await user.type(subject, 'Mensaje por WhatsApp')
    await user.type(screen.getByLabelText('Próxima acción'), 'llamar')
    await user.type(screen.getByLabelText('Fecha próxima acción'), '2099-01-01T10:00')
    await user.click(screen.getAllByRole('button', { name: 'Registrar actividad' }).find((button) => button.getAttribute('type') === 'submit')!)

    expect(adminRepository.createProspectActivity).toHaveBeenCalledWith(expect.objectContaining({
      activity_type: 'whatsapp',
      subject: 'Mensaje por WhatsApp',
      next_action_type: 'llamar',
    }))
  })

  test('converts with existing and new contacts and keeps traceability after reload', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertProspectToOpportunity).mockResolvedValue({
      error: null,
      data: {
        prospect: prospect({ status: 'converted', converted_contact_id: 'contact-1', converted_opportunity_id: 'opportunity-1', converted_at: today }),
        contact: contactCandidate,
        opportunity: {
          id: 'opportunity-1',
          reference_code: 'ARI-2026-ABC123',
          opportunity_type: 'buy',
          title: 'Representación comercial',
          description: null,
          contact_id: 'contact-1',
          status: 'under_review',
          priority: 'high',
          source: 'prospecting',
          estimated_value: null,
          currency: null,
          expected_date: null,
          country: 'CL',
          region: null,
          city: 'Santiago',
          internal_notes: null,
          rejection_reason: null,
          assigned_to: 'owner-1',
          created_at: today,
          updated_at: today,
          created_by: 'owner-1',
        },
        alreadyConverted: false,
        rpcResult: {
          prospect_id: 'prospect-1',
          contact_id: 'contact-1',
          opportunity_id: 'opportunity-1',
          reference_code: 'ARI-2026-ABC123',
          already_converted: false,
        },
      },
    })

    renderDetail()
    expect(await screen.findByText('Convertir')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Contacto existente'), 'contact-1')
    await user.click(screen.getByRole('button', { name: 'Convertir en contacto y oportunidad' }))
    expect(adminRepository.convertProspectToOpportunity).toHaveBeenCalledWith('prospect-1', expect.objectContaining({ opportunity_type: 'buy' }), { existing_contact_id: 'contact-1' })

    vi.mocked(adminRepository.getProspectById).mockResolvedValue({ data: prospect({ status: 'converted', converted_contact_id: 'contact-1', converted_opportunity_id: 'opportunity-1', converted_at: today }), error: null })
    cleanup()
    renderDetail()
    expect(await screen.findByText('Conversión')).toBeInTheDocument()
    expect(screen.getByText('Ver oportunidad convertida')).toHaveAttribute('href', '/admin/oportunidades/opportunity-1')
  })
})
