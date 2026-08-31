import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminSettings } from './AdminSettings'
import { AdminCommercialAgreementFormPage } from './AdminCommercialAgreements'
import { AdminOpportunityFormPage } from './AdminOpportunityForm'
import { AdminAuthContext } from '../admin-auth-context'
import { adminRepository } from '../../repositories'
import type {
  ContactSelectorRecord,
  OpportunityRecord,
  OrganizationSettingsRecord,
} from '../../types/admin'

vi.mock('../../lib/supabase-config', () => ({ isSupabaseConfigured: true }))

vi.mock('../../repositories', () => ({
  adminRepository: {
    getOrganizationSettings: vi.fn(),
    updateOrganizationSettings: vi.fn(),
    createOrganizationSettingsIfMissing: vi.fn(),
    listContactsForSelector: vi.fn(),
    getOpportunityById: vi.fn(),
    createOpportunity: vi.fn(),
    updateOpportunity: vi.fn(),
    createContact: vi.fn(),
    createOpportunityActivity: vi.fn(),
    listOpportunitiesForAgreementSelector: vi.fn(),
    listContactsForAgreementSelector: vi.fn(),
    listSuppliersForAgreementSelector: vi.fn(),
    getCommercialAgreementById: vi.fn(),
    createCommercialAgreement: vi.fn(),
    updateCommercialAgreement: vi.fn(),
  },
}))

const settings: OrganizationSettingsRecord = {
  singleton_key: 'arista_partners',
  display_name: 'Arista Partners',
  legal_name: null,
  tax_identifier: null,
  public_email: null,
  public_phone: null,
  website_url: null,
  address_line: null,
  city_region: null,
  country_code: 'CL',
  timezone: 'America/Santiago',
  locale: 'es-CL',
  default_currency: 'USD',
  default_opportunity_priority: 'high',
  default_follow_up_days: 7,
  default_attribution_days: 30,
  default_commission_type: 'fixed_amount',
  default_commission_value: 250,
  created_at: '2026-08-16T12:00:00.000Z',
  updated_at: '2026-08-16T12:00:00.000Z',
  created_by: null,
  updated_by: 'owner-1',
  updatedByProfile: { id: 'owner-1', full_name: 'Owner Admin' },
}

const contact: ContactSelectorRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  contact_type: 'company',
  full_name: null,
  company_name: 'Cliente Uno',
  email: null,
  phone: null,
  city: null,
  country: 'Chile',
}

const opportunity: OpportunityRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  reference_code: 'ARI-2026-A1B2C3',
  opportunity_type: 'buy',
  title: 'Compra vigente',
  description: null,
  contact_id: contact.id,
  status: 'active',
  priority: 'low',
  source: null,
  estimated_value: 100,
  currency: 'CLP',
  expected_date: null,
  country: null,
  region: null,
  city: null,
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-16T12:00:00.000Z',
  updated_at: '2026-08-16T12:00:00.000Z',
  created_by: 'owner-1',
}

function renderWithAuth(ui: ReactNode, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AdminAuthContext.Provider
        value={{
          status: 'ready',
          session: null,
          user: { id: 'owner-1', email: 'owner@example.com' } as never,
          profile: { id: 'owner-1', full_name: 'Owner Admin', role: 'owner', is_active: true, created_at: '', updated_at: '' },
          signIn: vi.fn(),
          signOut: vi.fn(),
        }}
      >
        {ui}
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminSettings', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.getOrganizationSettings).mockResolvedValue({ data: settings, error: null })
    vi.mocked(adminRepository.updateOrganizationSettings).mockResolvedValue({ data: settings, error: null })
    vi.mocked(adminRepository.createOrganizationSettingsIfMissing).mockResolvedValue({ data: settings, error: null })
    vi.mocked(adminRepository.listContactsForSelector).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.getOpportunityById).mockResolvedValue({ data: opportunity, error: null })
    vi.mocked(adminRepository.listOpportunitiesForAgreementSelector).mockResolvedValue({ data: [opportunity], error: null })
    vi.mocked(adminRepository.listContactsForAgreementSelector).mockResolvedValue({ data: [contact], error: null })
    vi.mocked(adminRepository.listSuppliersForAgreementSelector).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.getCommercialAgreementById).mockResolvedValue({ data: null, error: null })
  })

  test('loads real organization settings without showing environment variable names or secrets', async () => {
    render(<AdminSettings />)

    expect(await screen.findByDisplayValue('Arista Partners')).toBeInTheDocument()
    expect(screen.getByText('Owner Admin')).toBeInTheDocument()
    expect(screen.getByText('Supabase conectado')).toBeInTheDocument()
    expect(screen.queryByText(/VITE_|service_role|Turnstile|SUPABASE_SERVICE|TURNSTILE_SECRET/i)).not.toBeInTheDocument()
    expect(screen.getByText(/contraseñas, claves API, tokens ni datos bancarios/i)).toBeInTheDocument()
  })

  test('edits and saves, converting empty optional fields to null and excluding protected fields', async () => {
    const user = userEvent.setup()
    render(<AdminSettings />)

    const email = await screen.findByLabelText('Correo público')
    await user.type(email, 'contacto@example.com')
    await user.selectOptions(screen.getByLabelText('Tipo de comisión predeterminado'), '')
    await user.click(screen.getByRole('button', { name: /Guardar configuración/i }))

    await waitFor(() => expect(adminRepository.updateOrganizationSettings).toHaveBeenCalled())
    expect(adminRepository.updateOrganizationSettings).toHaveBeenCalledWith(expect.objectContaining({
      public_email: 'contacto@example.com',
      legal_name: null,
      default_commission_type: null,
      default_commission_value: null,
    }))
    expect(adminRepository.updateOrganizationSettings).toHaveBeenCalledWith(expect.not.objectContaining({
      singleton_key: expect.anything(),
      created_by: expect.anything(),
      updated_by: expect.anything(),
    }))
  })

  test('validates URL, email, country, currency, days and percentage constraints', async () => {
    const user = userEvent.setup()
    render(<AdminSettings />)

    await user.clear(await screen.findByLabelText('Sitio web'))
    await user.type(screen.getByLabelText('Sitio web'), 'http://example.com')
    await user.type(screen.getByLabelText('Correo público'), 'correo-invalido')
    await user.clear(screen.getByLabelText('País'))
    await user.type(screen.getByLabelText('País'), 'chl')
    await user.clear(screen.getByLabelText('Moneda predeterminada'))
    await user.type(screen.getByLabelText('Moneda predeterminada'), 'usd')
    await user.clear(screen.getByLabelText('Días predeterminados para seguimiento'))
    await user.type(screen.getByLabelText('Días predeterminados para seguimiento'), '366')
    await user.clear(screen.getByLabelText('Días predeterminados de atribución'))
    await user.type(screen.getByLabelText('Días predeterminados de atribución'), '3651')
    await user.selectOptions(screen.getByLabelText('Tipo de comisión predeterminado'), 'percentage')
    await user.clear(screen.getByLabelText('Valor de comisión predeterminado'))
    await user.type(screen.getByLabelText('Valor de comisión predeterminado'), '101')
    await user.click(screen.getByRole('button', { name: /Guardar configuración/i }))

    expect(screen.getByText('El sitio web debe comenzar con https://.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('El porcentaje debe estar entre 0 y 100.')).toBeInTheDocument()
    expect(adminRepository.updateOrganizationSettings).not.toHaveBeenCalled()
  }, 10000)

  test('recovers the singleton only when missing and does not create a second row', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.getOrganizationSettings).mockResolvedValueOnce({ data: null, error: null })
    render(<AdminSettings />)

    await user.click(await screen.findByRole('button', { name: /Crear configuración inicial/i }))
    await waitFor(() => expect(adminRepository.createOrganizationSettingsIfMissing).toHaveBeenCalledTimes(1))

    cleanup()
    render(<AdminSettings />)
    expect(await screen.findByDisplayValue('Arista Partners')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear configuración inicial/i })).not.toBeInTheDocument()
  })

  test('confirms unsaved changes through beforeunload and keeps focus while typing', async () => {
    const user = userEvent.setup()
    render(<AdminSettings />)

    const name = await screen.findByLabelText('Nombre público *')
    await user.click(name)
    await user.type(name, ' Global')
    expect(document.activeElement).toBe(name)

    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  test('new opportunities use configured priority and currency, while existing records keep their own values', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/admin/oportunidades/nueva" element={<AdminOpportunityFormPage mode="create" />} />
        <Route path="/admin/oportunidades/:id/editar" element={<AdminOpportunityFormPage mode="edit" />} />
      </Routes>,
      '/admin/oportunidades/nueva',
    )
    expect(await screen.findByLabelText(/Prioridad/i)).toHaveValue('high')
    expect(screen.getByLabelText(/Moneda/i)).toHaveValue('USD')

    cleanup()
    renderWithAuth(
      <Routes>
        <Route path="/admin/oportunidades/:id/editar" element={<AdminOpportunityFormPage mode="edit" />} />
      </Routes>,
      `/admin/oportunidades/${opportunity.id}/editar`,
    )
    expect(await screen.findByLabelText(/Prioridad/i)).toHaveValue('low')
    expect(screen.getByLabelText(/Moneda/i)).toHaveValue('CLP')
  })

  test('configuration load failure does not block new opportunities', async () => {
    vi.mocked(adminRepository.getOrganizationSettings).mockResolvedValueOnce({ data: null, error: 'No fue posible cargar configuración.' })
    renderWithAuth(
      <Routes>
        <Route path="/admin/oportunidades/nueva" element={<AdminOpportunityFormPage mode="create" />} />
      </Routes>,
      '/admin/oportunidades/nueva',
    )
    expect(await screen.findByLabelText(/Prioridad/i)).toHaveValue('medium')
  })

  test('new commercial agreements use configured currency, commission and attribution defaults', async () => {
    render(
      <MemoryRouter initialEntries={[`/admin/acuerdos/nuevo?opportunityId=${opportunity.id}`]}>
        <Routes>
          <Route path="/admin/acuerdos/nuevo" element={<AdminCommercialAgreementFormPage mode="create" />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText(/Oportunidad relacionada/i)).toHaveValue(opportunity.id)
    expect(screen.getByLabelText(/Tipo de comisión/i)).toHaveValue('fixed_amount')
    expect(screen.getByLabelText(/Valor de comisión/i)).toHaveValue(250)
    expect(screen.getByLabelText(/Moneda/i)).toHaveValue('USD')
    expect(screen.getByLabelText(/Fecha de inicio/i)).not.toHaveValue('')
    expect(screen.getByLabelText(/Fecha de término/i)).not.toHaveValue('')
  })

  test('does not expose DELETE operations through the admin repository', () => {
    expect('deleteOrganizationSettings' in adminRepository).toBe(false)
    expect('deleteCommercialAgreement' in adminRepository).toBe(false)
  })
})
