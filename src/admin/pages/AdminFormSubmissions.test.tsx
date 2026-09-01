import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminFormSubmissions } from './AdminFormSubmissions'
import { labeledPayloadFields } from '../form-submission-utils'
import { adminRepository } from '../../repositories'
import type { ContactRecord, FormSubmissionRecord, OpportunityRecord, SupplierRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listFormSubmissions: vi.fn(),
    getConvertedSubmissionEntity: vi.fn(),
    updateFormSubmission: vi.fn(),
    findContactCandidatesForSubmission: vi.fn(),
    convertContactSubmission: vi.fn(),
    convertBuySubmission: vi.fn(),
    convertSellSubmission: vi.fn(),
    convertSupplierSubmission: vi.fn(),
  },
}))

const baseSubmission: FormSubmissionRecord = {
  id: '44444444-4444-4444-8444-444444444444',
  submission_type: 'contact',
  payload: {
    fullName: 'Ana Torres',
    organization: '',
    email: 'ana@example.com',
    phone: '+569',
    country: 'Chile',
    reason: 'Otro',
    subject: 'Consulta comercial',
    message: '<strong>Mensaje como texto</strong>',
    preferredContact: 'Correo electronico',
  },
  status: 'received',
  submitted_at: '2026-08-14T12:00:00.000Z',
  reviewed_at: null,
  reviewed_by: null,
  converted_entity_type: null,
  converted_entity_id: null,
  source_ip_hash: null,
  user_agent: 'Hidden agent',
  consent_contact: true,
  consent_marketing: false,
  privacy_version: 'Borrador 0.1',
}

const contact: ContactRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  contact_type: 'person',
  full_name: 'Ana Torres',
  company_name: 'Arista Cliente',
  position: null,
  email: 'ana@example.com',
  phone: '+569',
  website: null,
  social_media: null,
  country: 'Chile',
  region: null,
  city: 'Santiago',
  notes: null,
  source: null,
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
}

const opportunity: OpportunityRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  reference_code: 'ARI-2026-A1B2C3',
  opportunity_type: 'buy',
  title: 'Insumos',
  description: 'Detalle',
  contact_id: contact.id,
  status: 'under_review',
  priority: 'medium',
  source: 'public_form',
  estimated_value: null,
  currency: 'CLP',
  expected_date: null,
  country: 'Chile',
  region: null,
  city: null,
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
}

const supplier: SupplierRecord = {
  id: '55555555-5555-4555-8555-555555555555',
  contact_id: contact.id,
  business_name: 'Proveedor Test',
  legal_name: null,
  tax_id: null,
  description: 'Productos',
  categories: ['Servicios'],
  geographic_coverage: 'Chile',
  supply_capacity: null,
  minimum_order: null,
  minimum_order_currency: null,
  issues_invoice: true,
  commercial_terms: null,
  status: 'pending',
  internal_notes: null,
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
}

const convertedSubmission = {
  ...baseSubmission,
  status: 'converted' as const,
  converted_entity_type: 'opportunity',
  converted_entity_id: opportunity.id,
}

function conversionData(entity: 'inquiry' | 'opportunity' | 'supplier' = 'opportunity') {
  const record =
    entity === 'inquiry'
      ? {
          type: 'inquiry' as const,
          record: {
            id: 'inq-1',
            contact_id: contact.id,
            converted_opportunity_id: null,
            subject: 'Consulta comercial',
            reason: 'other',
            message: 'Mensaje',
            preferred_contact_method: 'email',
            status: 'new' as const,
            internal_notes: null,
            created_at: '',
            updated_at: '',
            assigned_to: 'owner-1',
          },
        }
      : entity === 'supplier'
        ? { type: 'supplier' as const, record: supplier }
        : { type: 'opportunity' as const, record: opportunity }

  return {
    submission: { ...convertedSubmission, converted_entity_type: entity, converted_entity_id: record.record.id },
    contact,
    entity: record,
    alreadyConverted: false,
    rpcResult: {
      submission_id: baseSubmission.id,
      contact_id: contact.id,
      entity_type: entity,
      entity_id: record.record.id,
      visible_identifier: entity === 'opportunity' ? opportunity.reference_code : record.record.id,
      already_converted: false,
    },
  }
}

function renderPage(submission = baseSubmission) {
  vi.mocked(adminRepository.listFormSubmissions).mockResolvedValue({ data: [submission], error: null })
  return render(
    <MemoryRouter initialEntries={['/admin/recepciones']}>
      <AdminFormSubmissions />
    </MemoryRouter>,
  )
}

async function openWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Ver/i }))
  await user.click(screen.getByRole('button', { name: /^Convertir$/i }))
}

async function advanceToContactStep(user: ReturnType<typeof userEvent.setup>) {
  await openWizard(user)
  await user.click(screen.getByRole('button', { name: /Continuar/i }))
}

describe('AdminFormSubmissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminRepository.getConvertedSubmissionEntity).mockResolvedValue({ data: null, error: null })
    vi.mocked(adminRepository.findContactCandidatesForSubmission).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.updateFormSubmission).mockResolvedValue({ data: { ...baseSubmission, status: 'under_review' }, error: null })
    vi.mocked(adminRepository.convertContactSubmission).mockResolvedValue({ data: conversionData('inquiry'), error: null })
    vi.mocked(adminRepository.convertBuySubmission).mockResolvedValue({ data: conversionData('opportunity'), error: null })
    vi.mocked(adminRepository.convertSellSubmission).mockResolvedValue({ data: conversionData('opportunity'), error: null })
    vi.mocked(adminRepository.convertSupplierSubmission).mockResolvedValue({ data: conversionData('supplier'), error: null })
  })

  afterEach(() => {
    cleanup()
  })

  test('uses explicit Spanish labels, hides empty fields, keeps logical order, and renders payload as text', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /Ver/i }))
    expect(screen.getByText('Nombre completo')).toBeInTheDocument()
    expect(screen.queryByText('fullName')).not.toBeInTheDocument()
    expect(screen.queryByText(/Empresa u organizaci/)).not.toBeInTheDocument()
    expect(screen.getByText('<strong>Mensaje como texto</strong>')).toBeInTheDocument()
    expect(screen.queryByText('Hidden agent')).not.toBeInTheDocument()

    const fields = labeledPayloadFields(baseSubmission)
    expect(fields.map((field) => field.label).slice(0, 3)).toEqual(['Nombre completo', 'Correo electrónico', 'Teléfono o WhatsApp'])
  })

  test('opens a same-page modal without navigation or a new window and restores focus on close', async () => {
    const user = userEvent.setup()
    renderPage()

    const trigger = await screen.findByRole('button', { name: /^Ver$/i })
    const originalPath = window.location.pathname
    const openSpy = vi.spyOn(window, 'open')
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('Nombre completo')
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('dialog').parentElement?.parentElement).toBe(document.body)
    expect(screen.getByRole('button', { name: /^Ver$/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe(originalPath)
    expect(openSpy).not.toHaveBeenCalled()
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    openSpy.mockRestore()
  })

  test('renders Recepciones copy with valid Spanish accents and no question-mark mojibake', async () => {
    renderPage({ ...baseSubmission, status: 'under_review' })

    expect(await screen.findByText(/Formularios públicos/)).toBeInTheDocument()
    expect(screen.getByText(/revisión administrativa/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar por campos básicos validados')).toBeInTheDocument()
    expect(screen.getByText('RECEPCIÓN')).toBeInTheDocument()
    expect(screen.getByText('ACCIÓN')).toBeInTheDocument()
    expect(screen.getAllByText('En evaluación').length).toBeGreaterThan(0)

    const damagedTexts = [
      `p${'?'}blicos`,
      `revisi${'?'}n`,
      `b${'?'}sicos`,
      `RECEPCI${'?'}N`,
      `ACCI${'?'}N`,
      `evaluaci${'?'}n`,
    ]
    for (const damagedText of damagedTexts) {
      expect(screen.queryByText((content) => content.includes(damagedText))).not.toBeInTheDocument()
    }
  })

  test('starts review and shows duplicate contact candidates', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: /Ver/i }))
    await user.click(screen.getByRole('button', { name: /Iniciar revisi/i }))
    expect(adminRepository.updateFormSubmission).toHaveBeenCalledWith(baseSubmission.id, { status: 'under_review' })
    await user.click(screen.getByRole('button', { name: /^Convertir$/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    expect(await screen.findByText(/Posibles contactos duplicados/i)).toBeInTheDocument()
    expect(screen.getByText(/Arista Cliente/i)).toBeInTheDocument()
  })

  test('uses an existing contact and converts contact submission to inquiry with one repository call', async () => {
    const user = userEvent.setup()
    renderPage()
    await advanceToContactStep(user)
    await user.click(await screen.findByLabelText(/Ana Torres/i))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar conversi/i }))
    expect(adminRepository.convertContactSubmission).toHaveBeenCalledWith(baseSubmission.id, { existing_contact_id: contact.id })
    expect(adminRepository.convertContactSubmission).toHaveBeenCalledTimes(1)
  })

  test('shows Spanish labels and translated values in the final entity step', async () => {
    const user = userEvent.setup()
    renderPage()
    await advanceToContactStep(user)
    await user.click(screen.getByRole('button', { name: /Usar estos datos/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))

    expect(screen.getAllByText('Contacto').length).toBeGreaterThan(0)
    expect(screen.getByText('Nuevo contacto')).toBeInTheDocument()
    expect(screen.getAllByText('Asunto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Medio de contacto preferido').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Correo electrónico').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Estado').length).toBeGreaterThan(0)
    expect(screen.getByText('Nueva')).toBeInTheDocument()
    expect(screen.queryByText('contact_id')).not.toBeInTheDocument()
    expect(screen.queryByText('preferred_contact_method')).not.toBeInTheDocument()
    expect(screen.queryByText('new-contact')).not.toBeInTheDocument()
    expect(screen.queryByText('email')).not.toBeInTheDocument()
    expect(screen.queryByText('new')).not.toBeInTheDocument()
  })

  test('shows pending and completed conversion result states without leaving Convirtiendo visible', async () => {
    const user = userEvent.setup()
    let resolveConversion: (value: Awaited<ReturnType<typeof adminRepository.convertContactSubmission>>) => void = () => undefined
    vi.mocked(adminRepository.convertContactSubmission).mockReturnValueOnce(new Promise((resolve) => { resolveConversion = resolve }))
    renderPage()
    await advanceToContactStep(user)
    await user.click(await screen.findByLabelText(/Ana Torres/i))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar conversión/i }))

    expect(screen.getByText('Convirtiendo...')).toBeInTheDocument()
    resolveConversion({ data: conversionData('inquiry'), error: null })
    expect(await screen.findByText('Conversión finalizada.')).toBeInTheDocument()
    expect(screen.queryByText('Convirtiendo...')).not.toBeInTheDocument()
    expect(screen.getByText('Entidad creada:')).toBeInTheDocument()
    expect(screen.getByText('Consulta')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Ver entidad/i }).length).toBeGreaterThan(0)
    const closeButton = screen.getByRole('button', { name: /Cerrar asistente/i })
    expect(screen.getByRole('dialog')).toContainElement(closeButton)
    await user.click(closeButton)
    expect(screen.queryByText('Conversión finalizada.')).not.toBeInTheDocument()
  })

  test('keeps failed conversion editable and removes Convirtiendo', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertContactSubmission).mockResolvedValueOnce({ data: conversionData('inquiry'), error: 'No fue posible completar la conversión.' })
    renderPage()
    await advanceToContactStep(user)
    await user.click(await screen.findByLabelText(/Ana Torres/i))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar conversión/i }))

    expect(await screen.findByText('No fue posible completar la conversión.')).toBeInTheDocument()
    expect(screen.queryByText('Convirtiendo...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Atrás/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Confirmar conversión/i })).toBeEnabled()
  })

  test('uses new contact values in the RPC strategy and preserves focus while editing', async () => {
    const user = userEvent.setup()
    renderPage()
    await advanceToContactStep(user)
    const companyInput = screen.getByLabelText('Empresa')
    companyInput.focus()
    fireEvent.change(companyInput, { target: { value: 'Empresa Nueva' } })
    expect(document.activeElement).toBe(companyInput)
    await user.click(screen.getByRole('button', { name: /Usar estos datos/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar conversi/i }))
    expect(adminRepository.convertContactSubmission).toHaveBeenCalledWith(baseSubmission.id, expect.objectContaining({
      existing_contact_id: null,
      contact: expect.objectContaining({ company_name: 'Empresa Nueva' }),
    }))
  })

  test('converts buy, sell, and supplier submissions with fixed methods', async () => {
    const payload = baseSubmission.payload as Record<string, unknown>
    const buy = { ...baseSubmission, submission_type: 'buy' as const, payload: { ...payload, need: 'Insumos', needDetail: 'Detalle suficiente', currency: 'CLP' } }
    const sell = { ...baseSubmission, submission_type: 'sell' as const, payload: { ...payload, company: 'Marca', offer: 'Servicio', offerDetail: 'Detalle suficiente', currency: 'USD' } }
    const supp = { ...baseSubmission, submission_type: 'supplier' as const, payload: { ...payload, company: 'Proveedor Test', products: 'Servicios', categories: 'Servicios', invoice: 'Si' } }

    for (const [submission, method] of [[buy, adminRepository.convertBuySubmission], [sell, adminRepository.convertSellSubmission], [supp, adminRepository.convertSupplierSubmission]] as const) {
      cleanup()
      const user = userEvent.setup()
      renderPage(submission)
      await advanceToContactStep(user)
      await user.click(await screen.findByLabelText(/Ana Torres/i))
      await user.click(screen.getByRole('button', { name: /Continuar/i }))
      await user.click(screen.getByRole('button', { name: /Continuar/i }))
      await user.click(screen.getByRole('button', { name: /Confirmar conversi/i }))
      expect(method).toHaveBeenCalledWith(submission.id, { existing_contact_id: contact.id })
    }
  })

  test('loads persistent converted entity and prevents duplicate conversion', async () => {
    vi.mocked(adminRepository.getConvertedSubmissionEntity).mockResolvedValue({ data: { type: 'opportunity', record: opportunity }, error: null })
    renderPage(convertedSubmission)
    await screen.findByText('Convertida')
    fireEvent.click(await screen.findByRole('button', { name: /Ver/i }))
    expect(await screen.findByText(/Entidad vinculada/i)).toBeInTheDocument()
    expect(screen.getByText('Esta recepción fue revisada y convertida correctamente.')).toBeInTheDocument()
    expect(screen.queryByText(/Datos recibidos desde formulario público/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Convertir$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Rechazar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Marcar spam/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Archivar/i })).not.toBeInTheDocument()
  })

  test('keeps entered data if the atomic RPC fails and does not expose partial conversion repair', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.convertBuySubmission).mockResolvedValueOnce({ data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'No fue posible completar la conversion.' })
    const buy = { ...baseSubmission, submission_type: 'buy' as const, payload: { ...(baseSubmission.payload as Record<string, unknown>), need: 'Insumos', needDetail: 'Detalle suficiente' } }
    renderPage(buy)
    await advanceToContactStep(user)
    const companyInput = screen.getByLabelText('Empresa')
    await user.clear(companyInput)
    await user.type(companyInput, 'Empresa Conservada')
    await user.click(screen.getByRole('button', { name: /Usar estos datos/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Continuar/i }))
    await user.click(screen.getByRole('button', { name: /Confirmar conversi/i }))
    expect(await screen.findByText(/No fue posible completar la conversion/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Atr/i }))
    await user.click(screen.getByRole('button', { name: /Atr/i }))
    expect(screen.getByDisplayValue('Empresa Conservada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reparar/i })).not.toBeInTheDocument()
    expect(adminRepository.convertBuySubmission).toHaveBeenCalledTimes(1)
  })
})
