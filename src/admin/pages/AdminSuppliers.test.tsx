import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminSupplierDetail, AdminSupplierFormPage, AdminSuppliers } from './AdminSuppliers'
import { adminRepository } from '../../repositories'
import type { ContactSelectorRecord, OpportunityRecord, SupplierOpportunityRecord, SupplierRecord, SupplierWithContact } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listContactsForSelector: vi.fn(),
    createContact: vi.fn(),
    getSupplierById: vi.fn(),
    createSupplier: vi.fn(),
    updateSupplier: vi.fn(),
    listSupplierOpportunities: vi.fn(),
    listAvailableBuyOpportunities: vi.fn(),
    linkSupplierToOpportunity: vi.fn(),
    updateOpportunitySupplier: vi.fn(),
    listSuppliers: vi.fn(),
  },
}))

const contact: ContactSelectorRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  contact_type: 'company',
  full_name: null,
  company_name: 'Arista Contacto',
  email: 'contacto@example.com',
  phone: '+569',
  city: 'Santiago',
  country: 'Chile',
}

const supplier: SupplierRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  contact_id: contact.id,
  business_name: 'Proveedor Norte',
  legal_name: 'Proveedor Norte SpA',
  tax_id: 'interno',
  description: null,
  categories: ['Acero'],
  geographic_coverage: 'Chile',
  supply_capacity: null,
  minimum_order: null,
  minimum_order_currency: null,
  issues_invoice: true,
  commercial_terms: null,
  status: 'pending',
  internal_notes: null,
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

const supplierWithContact: SupplierWithContact = {
  ...supplier,
  contact: { ...contact, position: null, website: null, social_media: null, region: null, notes: null, source: null, created_at: '', updated_at: '', created_by: null },
  opportunityCount: 1,
}

const opportunity: OpportunityRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  reference_code: 'ARI-2026-A1B2C3',
  opportunity_type: 'buy',
  title: 'Compra de acero',
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
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

const relation: SupplierOpportunityRecord = {
  id: '44444444-4444-4444-8444-444444444444',
  opportunity_id: opportunity.id,
  supplier_id: supplier.id,
  status: 'identified',
  notes: null,
  proposed_amount: null,
  currency: null,
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  opportunity,
  contact,
}

function renderSupplierForm(mode: 'create' | 'edit' = 'create') {
  const route = mode === 'create' ? '/admin/proveedores/nuevo' : `/admin/proveedores/${supplier.id}/editar`
  const path = mode === 'create' ? '/admin/proveedores/nuevo' : '/admin/proveedores/:id/editar'
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={<AdminSupplierFormPage mode={mode} />} />
        <Route path="/admin/proveedores/:id" element={<div>Proveedor guardado</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderSupplierDetail() {
  return render(
    <MemoryRouter initialEntries={[`/admin/proveedores/${supplier.id}`]}>
      <Routes>
        <Route path="/admin/proveedores/:id" element={<AdminSupplierDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminSuppliers', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminRepository.listContactsForSelector).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.getSupplierById).mockResolvedValue({ data: supplierWithContact, error: null })
    vi.mocked(adminRepository.createSupplier).mockResolvedValue({ data: supplier, error: null })
    vi.mocked(adminRepository.updateSupplier).mockResolvedValue({ data: supplier, error: null })
    vi.mocked(adminRepository.listSupplierOpportunities).mockResolvedValue({ data: [relation], error: null })
    vi.mocked(adminRepository.listAvailableBuyOpportunities).mockResolvedValue({ data: [opportunity], error: null })
    vi.mocked(adminRepository.linkSupplierToOpportunity).mockResolvedValue({ data: relation, error: null })
    vi.mocked(adminRepository.updateOpportunitySupplier).mockResolvedValue({ data: relation, error: null })
    vi.mocked(adminRepository.listSuppliers).mockResolvedValue({ data: [], error: null })
  })

  test('opens supplier detail in a modal without changing the list URL', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.listSuppliers).mockResolvedValue({ data: [supplierWithContact], error: null })
    render(<MemoryRouter initialEntries={['/admin/proveedores?status=pending']}><AdminSuppliers /></MemoryRouter>)
    await user.click((await screen.findAllByRole('button', { name: 'Ver' }))[0])
    expect(screen.getByRole('dialog')).toHaveTextContent('Proveedor Norte')
    expect(screen.queryByRole('link', { name: /Proveedor Norte/i })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('creates supplier with contact and validates required category', async () => {
    const user = userEvent.setup()
    renderSupplierForm()

    await user.selectOptions(await screen.findByLabelText(/Contacto asociado/i), contact.id)
    await user.type(screen.getByLabelText(/Nombre comercial/i), 'Proveedor Sur')
    await user.click(screen.getByRole('button', { name: /Guardar proveedor/i }))
    expect(await screen.findByText('Agrega al menos una categoría.')).toBeInTheDocument()

    const categoryInput = screen.getByLabelText(/Categorías/i)
    categoryInput.focus()
    await user.type(categoryInput, 'Minería')
    expect(document.activeElement).toBe(categoryInput)
    await user.click(screen.getByRole('button', { name: /Agregar/i }))
    await user.click(screen.getByRole('button', { name: /Guardar proveedor/i }))

    expect(adminRepository.createSupplier).toHaveBeenCalledWith(expect.objectContaining({
      contact_id: contact.id,
      business_name: 'Proveedor Sur',
      categories: ['Minería'],
    }))
  })

  test('prevents duplicate categories ignoring case', async () => {
    const user = userEvent.setup()
    renderSupplierForm()

    const categoryInput = await screen.findByLabelText(/Categorías/i)
    await user.type(categoryInput, 'Acero')
    await user.click(screen.getByRole('button', { name: /Agregar/i }))
    await user.type(categoryInput, 'acero')
    await user.click(screen.getByRole('button', { name: /Agregar/i }))

    expect(await screen.findByText('La categoría ya existe.')).toBeInTheDocument()
    expect(screen.getAllByText('Acero')).toHaveLength(1)
  })

  test('edits and archives supplier without deleting it', async () => {
    const user = userEvent.setup()
    const editView = renderSupplierForm('edit')

    const name = await screen.findByLabelText(/Nombre comercial/i)
    await user.clear(name)
    await user.type(name, 'Proveedor Editado')
    await user.click(screen.getByRole('button', { name: /Guardar proveedor/i }))

    expect(adminRepository.updateSupplier).toHaveBeenCalledWith(supplier.id, expect.objectContaining({ business_name: 'Proveedor Editado' }))

    editView.unmount()
    renderSupplierDetail()
    await user.click(await screen.findByRole('button', { name: /Archivar/i }))
    expect(adminRepository.updateSupplier).toHaveBeenCalledWith(supplier.id, { status: 'archived' })
  })

  test('links buy opportunity, does not duplicate existing relation, and edits quotation state', async () => {
    const user = userEvent.setup()
    renderSupplierDetail()

    expect((await screen.findAllByText(/Compra de acero/i)).length).toBeGreaterThan(0)
    const selector = screen.getByLabelText(/Oportunidad de compra/i)
    expect(within(selector).queryByRole('option', { name: /Compra de acero/i })).toBeInTheDocument()

    await user.selectOptions(selector, opportunity.id)
    await user.click(screen.getByRole('button', { name: /Vincular/i }))
    expect(adminRepository.linkSupplierToOpportunity).toHaveBeenCalledWith(expect.objectContaining({
      supplier_id: supplier.id,
      opportunity_id: opportunity.id,
    }))

    await user.click(screen.getByRole('button', { name: /Editar relación/i }))
    await user.selectOptions(screen.getByLabelText(/Estado/i), 'quoted')
    await user.type(screen.getByLabelText(/Monto propuesto/i), '1500')
    await user.selectOptions(screen.getByLabelText(/Moneda/i), 'USD')
    await user.click(screen.getByRole('button', { name: /Guardar relación/i }))

    expect(adminRepository.updateOpportunitySupplier).toHaveBeenCalledWith(relation.id, expect.objectContaining({
      status: 'quoted',
      proposed_amount: '1500',
      currency: 'USD',
    }))
  })
})
