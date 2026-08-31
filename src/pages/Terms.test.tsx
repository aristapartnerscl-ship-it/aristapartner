import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import App from '../App'
import { Layout } from '../components/Layout'
import { OpportunityForm } from '../components/opportunities/OpportunityForm'
import { opportunityForms } from '../data/opportunityForms'
import { Terms } from './Terms'

function renderTerms() {
  return render(
    <MemoryRouter>
      <Terms />
    </MemoryRouter>,
  )
}

describe('Terms and Conditions', () => {
  afterEach(() => cleanup())

  test('publishes the authorized identity with a single h1', () => {
    renderTerms()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Términos y Condiciones')
    expect(screen.getByText('Arista Partners SpA')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://www.aristapartners.cl' })).toHaveAttribute(
      'href',
      'https://www.aristapartners.cl',
    )
    expect(screen.getAllByRole('link', { name: 'contacto@aristapartners.cl' })[0]).toHaveAttribute(
      'href',
      'mailto:contacto@aristapartners.cl',
    )
  })

  test('does not publish restricted legal identity details or fixed public percentages', () => {
    const { container } = renderTerms()
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/)
    expect(text).not.toMatch(/\bRUT\b/)
    expect(text).not.toMatch(/dirección|domicilio/i)
    expect(text).not.toMatch(/representante legal/i)
    expect(text).not.toMatch(/propietario/i)
    expect(text).toMatch(/No existen porcentajes públicos fijos/i)
    expect(text).not.toMatch(/\b\d+(?:[.,]\d+)?\s?%/)
  })

  test('states that public forms do not create contracts or commercial guarantees', () => {
    const { container } = renderTerms()
    const text = container.textContent ?? ''

    expect(text).toMatch(/El envío de un formulario no debe considerarse/i)
    expect(text).toMatch(/Contratación/i)
    expect(text).toMatch(/Mandato comercial/i)
    expect(text).toMatch(/Representación automática/i)
    expect(text).toMatch(/Acuerdo sobre honorarios o comisiones/i)
    expect(text).toMatch(/no se garantizan ventas, contratos, compradores, proveedores, cotizaciones, reuniones, respuestas ni resultados económicos/i)
  })

  test('distinguishes lead states and requires authorization for third-party data', () => {
    renderTerms()

    expect(screen.getByText(/Contacto frío:/i)).toBeInTheDocument()
    expect(screen.getByText(/Contacto identificado:/i)).toBeInTheDocument()
    expect(screen.getByText(/Lead calificado:/i)).toBeInTheDocument()
    expect(screen.getByText(/debe contar con autorización, fundamento o legitimidad suficiente/i)).toBeInTheDocument()
    expect(screen.getByText(/puede rechazar antecedentes cuya procedencia, calidad o autorización/i)).toBeInTheDocument()
    expect(screen.getByText(/El alcance, priorización y tratamiento comercial se acordarán por separado/i)).toBeInTheDocument()
  })

  test('keeps fees and commissions subject to a separate written agreement', () => {
    renderTerms()

    expect(screen.getByText(/Honorarios, fee mensual, comisión, moneda, impuestos, hitos, atribución/i)).toBeInTheDocument()
    expect(screen.getByText(/Ninguna cifra o condición económica se considera acordada/i)).toBeInTheDocument()
    expect(screen.getByText(/propuesta, cotización, orden de servicio, contrato o acuerdo comercial separado/i)).toBeInTheDocument()
  })

  test('links to the existing privacy route and keeps semantic keyboard navigation', async () => {
    const user = userEvent.setup()
    renderTerms()

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(24)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Política de Privacidad' })).toHaveAttribute('href', '/privacidad')

    const legalNav = screen.getByRole('navigation', { name: /Índice legal/i })
    expect(within(legalNav).getByRole('link', { name: /Identificación del sitio/i })).toHaveAttribute(
      'href',
      '#identificacion',
    )

    await user.tab()
    expect(screen.getByLabelText(/Índice del documento/i)).toHaveFocus()
    await user.tab()
    expect(within(legalNav).getByRole('link', { name: /Identificación del sitio/i })).toHaveFocus()
  })

  test('keeps legal routes and the bridge route functional', async () => {
    render(
      <MemoryRouter initialEntries={['/terminos-y-privacidad']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: /Términos y privacidad/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Política de privacidad/i })[0]).toHaveAttribute('href', '/privacidad')
    expect(screen.getAllByRole('link', { name: /Términos y condiciones/i })[0]).toHaveAttribute('href', '/terminos')
  })

  test('keeps footer and form legal links unchanged', () => {
    const form = opportunityForms.find((item) => item.type === 'comprar')!
    const { unmount } = render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
    expect(within(footer).getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad')
    unmount()

    render(
      <MemoryRouter>
        <OpportunityForm config={form} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Ver política de privacidad/i })).toHaveAttribute('href', '/privacidad')
    expect(screen.getByRole('checkbox', { name: /información proporcionada es correcta/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /recibir información relacionada/i })).not.toBeChecked()
  })

  test('uses safe links and contains no mojibake or unsafe html injection', () => {
    const { container } = renderTerms()
    const text = container.textContent ?? ''

    expect(text).not.toContain('\uFFFD')
    expect(text).not.toMatch(/\u00c3|\u00c2|\u00e2/)
    expect(container.innerHTML).not.toMatch(/dangerouslySetInnerHTML/i)

    container.querySelectorAll('a[target="_blank"]').forEach((link) => {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    })
  })
})
