import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import { OpportunityForm } from '../components/opportunities/OpportunityForm'
import { opportunityForms } from '../data/opportunityForms'
import { Contact } from './Contact'
import { Opportunities } from './Opportunities'

describe('public forms', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    document.querySelectorAll('script[src*="turnstile"]').forEach((script) => script.remove())
  })

  test('renders the public form according to the feature flag', () => {
    const form = opportunityForms.find((item) => item.type === 'comprar')!
    const { container } = render(
      <MemoryRouter>
        <OpportunityForm config={form} />
      </MemoryRouter>,
    )

    expect(container.querySelector('[name="fullName"]')).toBeInTheDocument()
    if (import.meta.env.VITE_PUBLIC_FORMS_ENABLED === 'true') {
      expect(screen.getByRole('button', { name: /Enviar formulario/i })).toBeInTheDocument()
    } else {
      expect(screen.getByRole('button', { name: /Revisar formulario/i })).toBeInTheDocument()
      expect(document.querySelector('script[src*="turnstile"]')).toBeNull()
    }
  })

  test('does not persist opportunity form data in localStorage while typing', async () => {
    const user = userEvent.setup()
    const form = opportunityForms.find((item) => item.type === 'comprar')!
    render(
      <MemoryRouter>
        <OpportunityForm config={form} />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Persona de prueba')

    expect(window.localStorage.length).toBe(0)
    expect(screen.getByLabelText(/Nombre completo/i)).toHaveValue('Persona de prueba')
  })

  test('does not persist contact form data in localStorage while typing', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/Nombre completo/i), 'Persona de prueba')

    expect(window.localStorage.length).toBe(0)
    expect(screen.getByLabelText(/Nombre completo/i)).toHaveValue('Persona de prueba')
  })

  test('keeps the opportunity selector accessible and updates the existing query parameter', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/oportunidades?tipo=comprar']}>
        <Opportunities />
      </MemoryRouter>,
    )

    const sellTab = screen.getByRole('tab', { name: /Quiero vender/i })
    expect(screen.getByRole('tab', { name: /Necesito comprar/i })).toHaveAttribute('aria-selected', 'true')
    await user.click(sellTab)
    expect(sellTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-vender')
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument()
  })

  test('keeps the public contact form distinct from opportunities', () => {
    render(
      <MemoryRouter>
        <Contact />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: /Ir a Oportunidades/i })).toHaveAttribute('href', '/oportunidades')
    expect(screen.getAllByRole('link', { name: /Ver política de privacidad/i })[0]).toHaveAttribute('href', '/privacidad')
    expect(screen.getByRole('link', { name: /Revisar Política de Privacidad/i })).toHaveAttribute('href', '/privacidad')
    expect(screen.getByText(/Canales oficiales/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'contacto@aristapartners.cl' })).toHaveAttribute(
      'href',
      'mailto:contacto@aristapartners.cl',
    )
    expect(screen.getByRole('checkbox', { name: /información proporcionada es correcta/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /recibir información relacionada/i })).not.toBeChecked()
  })

  test('links opportunity consent to the current privacy policy without preselected consent', () => {
    const form = opportunityForms.find((item) => item.type === 'vender')!
    render(
      <MemoryRouter>
        <OpportunityForm config={form} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /Ver política de privacidad/i })).toHaveAttribute('href', '/privacidad')
    expect(screen.getByRole('checkbox', { name: /información proporcionada es correcta/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /recibir información relacionada/i })).not.toBeChecked()
  })
})
