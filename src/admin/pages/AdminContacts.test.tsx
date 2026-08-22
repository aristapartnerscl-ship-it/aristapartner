import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { AdminContacts } from './AdminContacts'
import { adminRepository } from '../../repositories'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listContacts: vi.fn().mockResolvedValue({ data: [], error: null }),
    createContact: vi.fn(),
    updateContact: vi.fn(),
  },
}))

describe('AdminContacts', () => {
  afterEach(() => {
    cleanup()
  })

  test('keeps focus in the company field while typing in the contact modal', async () => {
    const user = userEvent.setup()
    render(<AdminContacts />)

    await user.click(screen.getByRole('button', { name: 'Nuevo contacto' }))

    const companyField = screen.getByRole('textbox', { name: 'Empresa' })
    const modal = screen.getByTestId('contact-form-modal')

    await user.click(companyField)
    await user.type(companyField, 'Arista Partners')

    expect(companyField).toHaveValue('Arista Partners')
    expect(document.activeElement).toBe(companyField)
    expect(screen.getByTestId('contact-form-modal')).toBe(modal)
  })

  test('shows translated source labels and stable empty values', async () => {
    vi.mocked(adminRepository.listContacts).mockResolvedValueOnce({
      data: [{
        id: '11111111-1111-4111-8111-111111111111',
        contact_type: 'person',
        full_name: 'Ana Torres',
        company_name: null,
        position: null,
        email: null,
        phone: null,
        website: null,
        social_media: null,
        country: null,
        region: null,
        city: null,
        notes: null,
        source: 'public_form',
        created_at: '2026-08-14T12:00:00.000Z',
        updated_at: '2026-08-14T12:00:00.000Z',
        created_by: 'owner-1',
      }],
      error: null,
    })

    render(<AdminContacts />)

    expect((await screen.findAllByText('Formulario público')).length).toBeGreaterThan(0)
    expect(screen.queryByText('public_form')).not.toBeInTheDocument()
    expect(screen.getAllByText('\u2014').length).toBeGreaterThan(0)
  })
})
