import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { PublicProposal } from './PublicProposal'
import { resolvePublicProposal, respondToPublicProposal } from '../repositories/public-proposal-repository'

vi.mock('../repositories/public-proposal-repository', () => ({ resolvePublicProposal: vi.fn(), respondToPublicProposal: vi.fn() }))

const payload = {
  status: 'active', response: null, response_name: null, response_email: null, response_comment: null, responded_at: null,
  code: 'PROP-2026-00000001', version: 2, issued_at: '2026-08-31T12:00:00.000Z', valid_until: '2026-09-15', title: 'Propuesta comercial', description: 'Descripción para cliente', currency: 'CLP', subtotal: 1000000, tax_percentage: 19, tax_amount: 190000, total_amount: 1190000, client_notes: 'Condiciones comerciales', counterparty_name: 'Empresa XYZ', contact_name: 'Juan Pérez', opportunity_title: 'Representación', opportunity_type: 'sell', organization: { display_name: 'ARISTA PARTNERS', legal_name: null, public_email: 'hola@arista.cl', public_phone: null, website_url: null, address_line: null, city_region: null, country_code: 'CL' },
} as const

describe('PublicProposal', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(resolvePublicProposal).mockResolvedValue({ data: payload, error: null }) })
  afterEach(() => cleanup())

  test('muestra el snapshot público sin datos internos ni IDs', async () => {
    render(<MemoryRouter initialEntries={['/propuesta/secure-token']}><Routes><Route path="/propuesta/:token" element={<PublicProposal />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('PROP-2026-00000001 · Versión 2')).toBeInTheDocument()
    expect(screen.getByText('Empresa XYZ')).toBeInTheDocument()
    expect(screen.getByText('1.190.000 CLP')).toBeInTheDocument()
    expect(document.body.textContent).not.toContain('internal_notes')
    expect(document.body.textContent).not.toContain('proposal-')
  })

  test('registra una sola respuesta con confirmación explícita', async () => {
    const user = userEvent.setup()
    vi.mocked(respondToPublicProposal).mockResolvedValue({ data: { ok: true, response: 'accepted', version: 2 }, error: null })
    render(<MemoryRouter initialEntries={['/propuesta/secure-token']}><Routes><Route path="/propuesta/:token" element={<PublicProposal />} /></Routes></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: 'Aceptar propuesta' }))
    await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez')
    await user.type(screen.getByLabelText('Correo electrónico'), 'juan@example.com')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Confirmar respuesta' }))
    expect(respondToPublicProposal).toHaveBeenCalledWith('secure-token', 'accepted', 'Juan Pérez', 'juan@example.com', '')
    expect(await screen.findByText('Propuesta aceptada')).toBeInTheDocument()
  })
})
