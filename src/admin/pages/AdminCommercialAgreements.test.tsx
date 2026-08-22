import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminCommercialAgreementDetail, AdminCommercialAgreementFormPage, AdminCommercialAgreements } from './AdminCommercialAgreements'
import { AdminOpportunityDetail } from './AdminOpportunityDetail'
import { adminRepository } from '../../repositories'
import type { CommercialAgreementRecord, CommercialAgreementWithOpportunity, ContactSelectorRecord, OpportunityActivityRecord, OpportunityRecord, SupplierWithContact } from '../../types/admin'
import { AdminAuthContext } from '../admin-auth-context'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listCommercialAgreements: vi.fn(),
    getOrganizationSettings: vi.fn(),
    getCommercialAgreementById: vi.fn(),
    createCommercialAgreement: vi.fn(),
    updateCommercialAgreement: vi.fn(),
    archiveCommercialAgreement: vi.fn(),
    restoreCommercialAgreement: vi.fn(),
    listOpportunitiesForAgreementSelector: vi.fn(),
    listContactsForAgreementSelector: vi.fn(),
    listSuppliersForAgreementSelector: vi.fn(),
    getOpportunityById: vi.fn(),
    listContactsForSelector: vi.fn(),
    listOpportunityActivities: vi.fn(),
    listAgreementsForOpportunity: vi.fn(),
    listOpportunitySuppliers: vi.fn(),
    listAvailableSuppliersForOpportunity: vi.fn(),
    completeFollowUp: vi.fn(),
    reopenFollowUp: vi.fn(),
    updateOpportunity: vi.fn(),
    createOpportunityActivity: vi.fn(),
  },
}))

const contact: ContactSelectorRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  contact_type: 'company',
  full_name: null,
  company_name: 'Contraparte Uno',
  email: 'contacto@example.com',
  phone: '+569',
  city: 'Santiago',
  country: 'Chile',
}

const opportunity: OpportunityRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  reference_code: 'ARI-2026-A1B2C3',
  opportunity_type: 'buy',
  title: 'Compra estrategica',
  description: null,
  contact_id: contact.id,
  status: 'active',
  priority: 'medium',
  source: null,
  estimated_value: null,
  currency: null,
  expected_date: null,
  country: null,
  region: null,
  city: null,
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
}

const supplier: SupplierWithContact = {
  id: '44444444-4444-4444-8444-444444444444',
  contact_id: contact.id,
  business_name: 'Proveedor Sur',
  legal_name: null,
  tax_id: null,
  description: null,
  categories: ['Servicios'],
  geographic_coverage: 'Chile',
  supply_capacity: null,
  minimum_order: null,
  minimum_order_currency: null,
  issues_invoice: true,
  commercial_terms: null,
  status: 'approved',
  internal_notes: null,
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
  contact: { ...contact, position: null, website: null, social_media: null, region: null, notes: null, source: null, created_at: '', updated_at: '', created_by: null },
  opportunityCount: 0,
}

const agreement: CommercialAgreementRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  agreement_code: 'ARI-AGR-33333333333343338333333333333333',
  opportunity_id: opportunity.id,
  counterparty_type: 'contact',
  contact_id: contact.id,
  supplier_id: null,
  payer_type: 'buyer',
  compensation_model: 'commission',
  management_fee: null,
  commission_type: 'percentage',
  commission_value: 7,
  currency: null,
  attribution_start: '2026-08-14',
  attribution_end: '2026-09-14',
  agreement_status: 'accepted',
  notes: 'Nota interna',
  archived_at: null,
  archived_by: null,
  created_at: '2026-08-14T12:00:00.000Z',
  updated_at: '2026-08-14T12:00:00.000Z',
  created_by: 'owner-1',
}

const agreementWithOpportunity: CommercialAgreementWithOpportunity = {
  ...agreement,
  opportunity,
  contact,
  supplier: null,
  archivedByProfile: null,
}

function activity(overrides: Partial<OpportunityActivityRecord> = {}): OpportunityActivityRecord {
  return {
    id: 'activity-1',
    opportunity_id: opportunity.id,
    activity_type: 'note',
    title: 'Nota',
    description: null,
    occurred_at: '2026-08-14T12:00:00.000Z',
    next_action_at: null,
    completed_at: null,
    completed_by: null,
    created_at: '2026-08-14T12:00:00.000Z',
    created_by: 'owner-1',
    ...overrides,
  }
}

function renderForm(route = `/admin/acuerdos/nuevo?opportunityId=${opportunity.id}`, mode: 'create' | 'edit' = 'create') {
  const path = mode === 'create' ? '/admin/acuerdos/nuevo' : '/admin/acuerdos/:id/editar'
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<AdminCommercialAgreementFormPage mode={mode} />} />
        <Route path="/admin/acuerdos/:id" element={<div>Acuerdo guardado</div>} />
        <Route path="/admin/acuerdos" element={<div>Listado</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderOpportunityDetail() {
  return render(
    <MemoryRouter initialEntries={[`/admin/oportunidades/${opportunity.id}`]}>
      <AdminAuthContext.Provider
        value={{
          status: 'ready',
          session: null,
          user: { id: 'owner-1', email: 'owner@example.com' } as never,
          profile: { id: 'owner-1', full_name: 'Owner Admin', role: 'owner', is_active: true, created_at: '', updated_at: '' },
          signIn: vi.fn(),
          signOut: vi.fn(),
          sendPasswordRecovery: vi.fn(),
        }}
      >
        <Routes>
          <Route path="/admin/oportunidades/:id" element={<AdminOpportunityDetail />} />
        </Routes>
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

async function fillRequiredCommercialFields(user: ReturnType<typeof userEvent.setup>, counterparty: 'contact' | 'supplier' = 'contact') {
  await user.click(await screen.findByRole('radio', { name: counterparty === 'contact' ? /Contacto/i : /Proveedor/i }))
  if (counterparty === 'contact') await user.selectOptions(screen.getByLabelText(/Contacto \*/i), contact.id)
  else await user.selectOptions(screen.getByLabelText(/Proveedor \*/i), supplier.id)
  await user.selectOptions(screen.getByLabelText(/Quién paga la comisión/i), 'buyer')
}

describe('AdminCommercialAgreements', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminRepository.listCommercialAgreements).mockResolvedValue({ data: [agreementWithOpportunity], error: null })
    vi.mocked(adminRepository.getOrganizationSettings).mockResolvedValue({ data: null, error: null })
    vi.mocked(adminRepository.getCommercialAgreementById).mockResolvedValue({ data: agreementWithOpportunity, error: null })
    vi.mocked(adminRepository.listOpportunitiesForAgreementSelector).mockResolvedValue({ data: [opportunity], error: null })
    vi.mocked(adminRepository.listContactsForAgreementSelector).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.listSuppliersForAgreementSelector).mockResolvedValue({ data: [supplier], error: null })
    vi.mocked(adminRepository.createCommercialAgreement).mockResolvedValue({ data: agreement, error: null })
    vi.mocked(adminRepository.updateCommercialAgreement).mockResolvedValue({ data: agreement, error: null })
    vi.mocked(adminRepository.archiveCommercialAgreement).mockResolvedValue({ data: { ...agreement, archived_at: '2026-08-14T13:00:00.000Z', archived_by: 'owner-1' }, error: null })
    vi.mocked(adminRepository.restoreCommercialAgreement).mockResolvedValue({ data: agreement, error: null })
    vi.mocked(adminRepository.getOpportunityById).mockResolvedValue({ data: opportunity, error: null })
    vi.mocked(adminRepository.listContactsForSelector).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.listOpportunityActivities).mockResolvedValue({ data: [activity()], error: null })
    vi.mocked(adminRepository.listOpportunitySuppliers).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listAvailableSuppliersForOpportunity).mockResolvedValue({ data: [], error: null })
  })

  test('lists agreements with code, real counterparty, payer and administrative state', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/acuerdos']}>
        <Routes>
          <Route path="/admin/acuerdos" element={<AdminCommercialAgreements />} />
        </Routes>
      </MemoryRouter>,
    )

    expect((await screen.findAllByText(agreement.agreement_code)).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contraparte Uno').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Comprador').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Activo').length).toBeGreaterThan(0)
  })

  test('creates agreement with contact and does not send generated or protected fields', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillRequiredCommercialFields(user, 'contact')
    await user.type(await screen.findByLabelText(/Valor de comisión/i), '7')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))

    await waitFor(() => expect(adminRepository.createCommercialAgreement).toHaveBeenCalled())
    expect(adminRepository.createCommercialAgreement).toHaveBeenCalledWith(expect.objectContaining({ counterparty_type: 'contact', contact_id: contact.id, supplier_id: null, payer_type: 'buyer' }))
    expect(adminRepository.createCommercialAgreement).toHaveBeenCalledWith(expect.not.objectContaining({ agreement_code: expect.anything(), created_by: expect.anything(), archived_by: expect.anything() }))
  })

  test('creates agreement with supplier and clears the contact side', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillRequiredCommercialFields(user, 'supplier')
    await user.type(await screen.findByLabelText(/Valor de comisión/i), '9')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))

    await waitFor(() => expect(adminRepository.createCommercialAgreement).toHaveBeenCalled())
    expect(adminRepository.createCommercialAgreement).toHaveBeenCalledWith(expect.objectContaining({ counterparty_type: 'supplier', supplier_id: supplier.id, contact_id: null }))
  })

  test('requires exactly one counterparty and payer type', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(await screen.findByLabelText(/Valor de comisión/i), '7')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))

    expect(screen.getByText('Selecciona el tipo de contraparte.')).toBeInTheDocument()
    expect(screen.getByText('Define quién paga la comisión.')).toBeInTheDocument()
    expect(adminRepository.createCommercialAgreement).not.toHaveBeenCalled()
  })

  test('cleans selected counterparty when switching type', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(await screen.findByRole('radio', { name: /Contacto/i }))
    await user.selectOptions(screen.getByLabelText(/Contacto \*/i), contact.id)
    expect(screen.getByLabelText(/Contacto \*/i)).toHaveValue(contact.id)

    await user.click(screen.getByRole('radio', { name: /Proveedor/i }))
    expect(window.confirm).toHaveBeenCalled()
    expect(screen.queryByLabelText(/Contacto \*/i)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(/Proveedor \*/i), supplier.id)
    await user.click(screen.getByRole('radio', { name: /Contacto/i }))
    expect(screen.queryByLabelText(/Proveedor \*/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Contacto \*/i)).toHaveValue('')
  })

  test('validates percentage, fixed amount currency and date order', async () => {
    const user = userEvent.setup()
    renderForm()
    await fillRequiredCommercialFields(user)

    const commission = await screen.findByLabelText(/Valor de comisión/i)
    await user.clear(commission)
    await user.type(commission, '120')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))
    expect(screen.getByText('El porcentaje debe estar entre 0 y 100.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Tipo de comisión/i), 'fixed_amount')
    await user.clear(commission)
    await user.type(commission, '1000')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))
    expect(screen.getByText('Selecciona moneda para el monto fijo.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/Moneda/i), 'USD')
    await user.type(screen.getByLabelText(/Fecha de inicio/i), '2026-09-15')
    await user.type(screen.getByLabelText(/Fecha de término/i), '2026-09-14')
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))
    expect(screen.getByText('La fecha de término no puede ser anterior a la fecha de inicio.')).toBeInTheDocument()
  })

  test('shows incomplete historical agreements and requires payer when editing', async () => {
    const historical: CommercialAgreementWithOpportunity = { ...agreementWithOpportunity, counterparty_type: null, contact_id: null, payer_type: null, contact: null }
    vi.mocked(adminRepository.listCommercialAgreements).mockResolvedValue({ data: [historical], error: null })
    vi.mocked(adminRepository.getCommercialAgreementById).mockResolvedValue({ data: historical, error: null })

    render(
      <MemoryRouter initialEntries={['/admin/acuerdos']}>
        <Routes>
          <Route path="/admin/acuerdos" element={<AdminCommercialAgreements />} />
        </Routes>
      </MemoryRouter>,
    )
    expect((await screen.findAllByText('Pendiente de completar')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pendiente de definir').length).toBeGreaterThan(0)

    cleanup()
    const user = userEvent.setup()
    renderForm(`/admin/acuerdos/${agreement.id}/editar`, 'edit')
    await screen.findByText(agreement.agreement_code)
    await user.click(screen.getByRole('button', { name: /Guardar acuerdo/i }))
    expect(screen.getByText('Define quién paga la comisión.')).toBeInTheDocument()
  })

  test('shows agreement code without an editable field and keeps focus while typing', async () => {
    const user = userEvent.setup()
    renderForm()
    expect(await screen.findByText('Se generará automáticamente al guardar')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Código del acuerdo/i)).not.toBeInTheDocument()
    const notes = screen.getByLabelText(/Notas internas/i)
    await user.click(notes)
    await user.type(notes, 'Acuerdo preliminar')
    expect(notes).toHaveValue('Acuerdo preliminar')
    expect(document.activeElement).toBe(notes)
  })

  test('confirms before discarding changes', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(await screen.findByLabelText(/Notas internas/i), 'cambio')
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(window.confirm).toHaveBeenCalledWith('Hay cambios sin guardar. ¿Descartarlos?')
  })

  test('archives with archived fields and does not change contractual status', async () => {
    render(
      <MemoryRouter initialEntries={[`/admin/acuerdos/${agreement.id}`]}>
        <Routes>
          <Route path="/admin/acuerdos/:id" element={<AdminCommercialAgreementDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: /Archivar/i }))
    await waitFor(() => expect(adminRepository.archiveCommercialAgreement).toHaveBeenCalledWith(agreement.id))
    expect(screen.getByText('Acuerdo archivado correctamente.')).toBeInTheDocument()
    expect(screen.getAllByText('Aceptado').length).toBeGreaterThan(0)
    expect('deleteCommercialAgreement' in adminRepository).toBe(false)
  })

  test('restores archived agreement and distinguishes terminated from archived', async () => {
    const archivedAgreement: CommercialAgreementWithOpportunity = {
      ...agreementWithOpportunity,
      agreement_status: 'terminated',
      archived_at: '2026-08-14T13:00:00.000Z',
      archived_by: 'owner-1',
      archivedByProfile: { id: 'owner-1', full_name: 'Owner Admin' },
    }
    vi.mocked(adminRepository.getCommercialAgreementById).mockResolvedValue({ data: archivedAgreement, error: null })
    render(
      <MemoryRouter initialEntries={[`/admin/acuerdos/${agreement.id}`]}>
        <Routes>
          <Route path="/admin/acuerdos/:id" element={<AdminCommercialAgreementDetail />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Terminado')).toBeInTheDocument()
    expect(screen.getByText('Archivado')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Restaurar/i }))
    await waitFor(() => expect(adminRepository.restoreCommercialAgreement).toHaveBeenCalledWith(agreement.id))
    expect('deleteCommercialAgreement' in adminRepository).toBe(false)
  })

  test('hides archived opportunity agreements by default and shows them on demand', async () => {
    const archivedAgreement: CommercialAgreementWithOpportunity = { ...agreementWithOpportunity, id: '55555555-5555-4555-8555-555555555555', agreement_code: 'ARI-AGR-55555555555545558555555555555555', archived_at: '2026-08-14T13:00:00.000Z', archived_by: 'owner-1' }
    vi.mocked(adminRepository.listAgreementsForOpportunity).mockResolvedValue({ data: [agreementWithOpportunity, archivedAgreement], error: null })
    renderOpportunityDetail()
    expect(await screen.findByText(agreement.agreement_code)).toBeInTheDocument()
    expect(screen.queryByText(archivedAgreement.agreement_code)).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText(/Mostrar archivados/i))
    expect(screen.getByText(archivedAgreement.agreement_code)).toBeInTheDocument()
  })
})
