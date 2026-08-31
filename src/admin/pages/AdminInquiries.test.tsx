import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminDashboard } from './AdminDashboard'
import { AdminInquiries, AdminInquiryDetail, AdminInquiryFormPage } from './AdminInquiries'
import { adminRepository } from '../../repositories'
import type { ContactRecord, ContactSelectorRecord, DashboardData, InquiryRecord, InquiryWithContact, OpportunityRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listInquiries: vi.fn(),
    getInquiryById: vi.fn(),
    createInquiry: vi.fn(),
    updateInquiry: vi.fn(),
    convertInquiryToOpportunity: vi.fn(),
    repairInquiryConversionLink: vi.fn(),
    listContactsForInquirySelector: vi.fn(),
    createContact: vi.fn(),
    getDashboardData: vi.fn(),
  },
}))

const contactSelector: ContactSelectorRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  contact_type: 'person',
  full_name: 'Ana Torres',
  company_name: 'Arista Cliente',
  email: 'ana@example.com',
  phone: '+569',
  city: 'Santiago',
  country: 'Chile',
}

const contact: ContactRecord = {
  ...contactSelector,
  position: null,
  website: null,
  social_media: null,
  region: null,
  notes: null,
  source: null,
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

const inquiry: InquiryRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  contact_id: contact.id,
  converted_opportunity_id: null,
  subject: 'Necesito apoyo comercial',
  reason: 'services',
  message: 'Mensaje suficientemente largo para validar el formulario.',
  preferred_contact_method: 'email',
  status: 'new',
  internal_notes: null,
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  assigned_to: 'owner-1',
}

const opportunity: OpportunityRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  reference_code: 'ARI-2026-A1B2C3',
  opportunity_type: 'buy',
  title: inquiry.subject,
  description: inquiry.message,
  contact_id: contact.id,
  status: 'under_review',
  priority: 'medium',
  source: 'Consulta',
  estimated_value: null,
  currency: null,
  expected_date: null,
  country: 'Chile',
  region: null,
  city: 'Santiago',
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

const linkedOpportunity = {
  id: opportunity.id,
  reference_code: opportunity.reference_code,
  title: opportunity.title,
  status: opportunity.status,
  opportunity_type: opportunity.opportunity_type,
}

const inquiryWithContact: InquiryWithContact = { ...inquiry, contact, linkedOpportunity: null }

function renderForm(mode: 'create' | 'edit' = 'create') {
  const route = mode === 'create' ? '/admin/consultas/nueva' : `/admin/consultas/${inquiry.id}/editar`
  const path = mode === 'create' ? '/admin/consultas/nueva' : '/admin/consultas/:id/editar'
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<AdminInquiryFormPage mode={mode} />} />
        <Route path="/admin/consultas/:id" element={<div>Consulta guardada</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={[`/admin/consultas/${inquiry.id}`]}>
      <Routes>
        <Route path="/admin/consultas/:id" element={<AdminInquiryDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

function convertedResult(alreadyConverted = false) {
  return {
    inquiry: { ...inquiry, status: 'converted' as const, converted_opportunity_id: opportunity.id },
    opportunity,
    alreadyConverted,
    rpcResult: {
      inquiry_id: inquiry.id,
      opportunity_id: opportunity.id,
      reference_code: opportunity.reference_code,
      already_converted: alreadyConverted,
    },
  }
}

describe('AdminInquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminRepository.listContactsForInquirySelector).mockResolvedValue({ data: [contactSelector], error: null })
    vi.mocked(adminRepository.getInquiryById).mockResolvedValue({ data: inquiryWithContact, error: null })
    vi.mocked(adminRepository.createInquiry).mockResolvedValue({ data: inquiry, error: null })
    vi.mocked(adminRepository.updateInquiry).mockResolvedValue({ data: inquiry, error: null })
    vi.mocked(adminRepository.repairInquiryConversionLink).mockResolvedValue({ data: { ...convertedResult(false), rpcResult: null }, error: null })
    vi.mocked(adminRepository.listInquiries).mockResolvedValue({ data: [inquiryWithContact], error: null })
  })

  afterEach(() => {
    cleanup()
  })

  test('creates inquiry and validates subject and message while preserving focus', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.selectOptions(await screen.findByLabelText(/Contacto asociado/i), contact.id)
    await user.selectOptions(screen.getByLabelText(/Motivo/i), 'services')
    await user.click(screen.getByRole('button', { name: /Guardar consulta/i }))
    expect(await screen.findByText('Ingresa un asunto.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa un mensaje de al menos 10 caracteres.')).toBeInTheDocument()

    const subject = screen.getByLabelText(/Asunto/i)
    subject.focus()
    await user.type(subject, 'Consulta comercial')
    expect(document.activeElement).toBe(subject)
    await user.type(screen.getByLabelText(/Mensaje/i), 'Necesito una evaluacion comercial completa.')
    await user.click(screen.getByRole('button', { name: /Guardar consulta/i }))

    expect(adminRepository.createInquiry).toHaveBeenCalledWith(expect.objectContaining({
      contact_id: contact.id,
      reason: 'services',
      subject: 'Consulta comercial',
      status: 'new',
    }))
  }, 10000)

  test('changes new to read to replied and archives without deleting', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.updateInquiry)
      .mockResolvedValueOnce({ data: { ...inquiry, status: 'read' }, error: null })
      .mockResolvedValueOnce({ data: { ...inquiry, status: 'replied' }, error: null })
      .mockResolvedValueOnce({ data: { ...inquiry, status: 'archived' }, error: null })

    renderDetail()

    await user.click(await screen.findByRole('button', { name: /Marcar como/i }))
    expect(adminRepository.updateInquiry).toHaveBeenCalledWith(inquiry.id, { status: 'read' })
    await user.click(await screen.findByRole('button', { name: /Marcar como respondida/i }))
    expect(adminRepository.updateInquiry).toHaveBeenCalledWith(inquiry.id, { status: 'replied' })
    await user.click(await screen.findByRole('button', { name: /Archivar/i }))
    expect(adminRepository.updateInquiry).toHaveBeenCalledWith(inquiry.id, { status: 'archived' })
  })

  test('renders inquiry detail copy with valid Spanish accents and no question-mark mojibake', async () => {
    renderDetail()

    expect(await screen.findByRole('button', { name: /Marcar como leída/i })).toBeInTheDocument()
    expect(screen.getByText('FECHA DE RECEPCIÓN O CREACIÓN')).toBeInTheDocument()
    expect(screen.getByText('UBICACIÓN')).toBeInTheDocument()
    expect(screen.getByText('Gestión')).toBeInTheDocument()
    expect(screen.getByText('ÚLTIMA ACTUALIZACIÓN')).toBeInTheDocument()
    expect(screen.getByText('Conversión')).toBeInTheDocument()

    const damagedTexts = [
      `Marcar como le${'?'}da`,
      `FECHA DE RECEPCI${'?'}N O CREACI${'?'}N`,
      `UBICACI${'?'}N`,
      `Gesti${'?'}n`,
      `${'?'}LTIMA ACTUALIZACI${'?'}N`,
      `Conversi${'?'}n`,
    ]
    for (const damagedText of damagedTexts) {
      expect(screen.queryByText((content) => content.includes(damagedText))).not.toBeInTheDocument()
    }
  })

  test('converts inquiry through one atomic repository operation', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertInquiryToOpportunity).mockResolvedValue({ data: convertedResult(false), error: null })

    renderDetail()

    await user.click(await screen.findByRole('button', { name: /Convertir en oportunidad/i }))
    await user.click(screen.getByRole('button', { name: /Crear oportunidad/i }))
    expect(adminRepository.convertInquiryToOpportunity).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Oportunidad vinculada')).toBeInTheDocument()
    expect(screen.getByText('ARI-2026-A1B2C3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Convertir en oportunidad/i })).not.toBeInTheDocument()
  })

  test('loads idempotent already-converted RPC result without partial repair', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertInquiryToOpportunity).mockResolvedValue({ data: convertedResult(true), error: null })

    renderDetail()

    await user.click(await screen.findByRole('button', { name: /Convertir en oportunidad/i }))
    await user.click(screen.getByRole('button', { name: /Crear oportunidad/i }))
    expect(await screen.findByText(/ya estaba convertida/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reparar/i })).not.toBeInTheDocument()
    expect(adminRepository.convertInquiryToOpportunity).toHaveBeenCalledTimes(1)
  })

  test('keeps inquiry unconverted when atomic conversion fails', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertInquiryToOpportunity).mockResolvedValue({
      data: { inquiry: inquiryWithContact, opportunity: null, alreadyConverted: false, rpcResult: null },
      error: 'No fue posible completar la operacion en este momento.',
    })

    renderDetail()

    await user.click(await screen.findByRole('button', { name: /Convertir en oportunidad/i }))
    await user.click(screen.getByRole('button', { name: /Crear oportunidad/i }))
    expect(await screen.findByText(/No fue posible completar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Convertir en oportunidad/i })).toBeInTheDocument()
    expect(screen.queryByText('Oportunidad vinculada')).not.toBeInTheDocument()
    expect(adminRepository.updateInquiry).not.toHaveBeenCalled()
  })

  test('reloads converted inquiry with persistent linked opportunity and prevents duplicate conversion or archive', async () => {
    vi.mocked(adminRepository.getInquiryById).mockResolvedValue({
      data: { ...inquiryWithContact, status: 'converted', converted_opportunity_id: opportunity.id, linkedOpportunity },
      error: null,
    })

    renderDetail()

    expect(await screen.findByText('Oportunidad vinculada')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver oportunidad/i })).toHaveAttribute('href', `/admin/oportunidades/${opportunity.id}`)
    expect(screen.queryByRole('button', { name: /Convertir en oportunidad/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Archivar/i })).not.toBeInTheDocument()
  })

  test('converted inquiry cannot change status from the normal edit form', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.getInquiryById).mockResolvedValue({
      data: { ...inquiryWithContact, status: 'converted', converted_opportunity_id: opportunity.id, linkedOpportunity },
      error: null,
    })

    renderForm('edit')

    const status = await screen.findByLabelText(/Estado/i)
    expect(status).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /Guardar consulta/i }))
    expect(adminRepository.updateInquiry).toHaveBeenCalledWith(inquiry.id, expect.not.objectContaining({ status: 'converted' }))
  })

  test('shows defensive integrity alerts without inferring relationships by text', async () => {
    vi.mocked(adminRepository.getInquiryById).mockResolvedValueOnce({
      data: { ...inquiryWithContact, status: 'converted', converted_opportunity_id: null, linkedOpportunity: null },
      error: null,
    })
    const first = renderDetail()
    expect(await screen.findByText(/Alerta de integridad/i)).toBeInTheDocument()
    expect(screen.queryByText('Oportunidad vinculada')).not.toBeInTheDocument()
    first.unmount()

    vi.mocked(adminRepository.getInquiryById).mockResolvedValueOnce({
      data: { ...inquiryWithContact, status: 'read', converted_opportunity_id: opportunity.id, linkedOpportunity },
      error: null,
    })
    renderDetail()
    expect(await screen.findByText(/Alerta de integridad/i)).toBeInTheDocument()
    expect(screen.getByText('Oportunidad vinculada')).toBeInTheDocument()
  })

  test('lists inquiries and dashboard links new inquiries filter', async () => {
    const dashboard: DashboardData = {
      metrics: {
        newOpportunities: 0,
        activeOpportunities: 0,
        negotiations: 0,
        overdueFollowUps: 0,
        pendingSuppliers: 0,
        newInquiries: 1,
        newFormSubmissions: 0,
        prospectsDueToday: 0,
        overdueProspectFollowUps: 0,
      },
      upcomingActions: [],
      upcomingProspectActions: [],
      recentActivities: [],
      hasMetricErrors: false,
      activityError: false,
    }
    vi.mocked(adminRepository.getDashboardData).mockResolvedValue({ data: dashboard, error: null })

    render(
      <MemoryRouter>
        <AdminInquiries />
      </MemoryRouter>,
    )
    expect((await screen.findAllByText('Necesito apoyo comercial')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('\u2014').length).toBeGreaterThan(0)
    expect(screen.queryByText('?')).not.toBeInTheDocument()
    cleanup()

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )
    const metricLabel = await screen.findByText('Consultas nuevas')
    expect(metricLabel.closest('a')).toHaveAttribute('href', '/admin/consultas?status=new')
  })
})
