import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import { Layout } from '../components/Layout'
import { Privacy } from './Privacy'

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <Privacy />
    </MemoryRouter>,
  )
}

describe('Privacy policy', () => {
  afterEach(() => cleanup())

  test('publishes the authorized identity and a single h1', () => {
    renderPrivacy()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Política de Privacidad')
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

  test('does not publish restricted legal identity details or personal owner data', () => {
    const { container } = renderPrivacy()
    const text = container.textContent ?? ''

    expect(text).not.toMatch(/\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/)
    expect(text).not.toMatch(/\bRUT\b/)
    expect(text).not.toMatch(/representante legal/i)
    expect(text).not.toMatch(/propietario/i)
    expect(text).not.toMatch(/domicilio/i)
    expect(text).not.toContain('\uFFFD')
    expect(text).not.toMatch(/\u00c3|\u00c2|\u00e2/)
  })

  test('declares only the confirmed technology providers and retention criteria', () => {
    renderPrivacy()

    expect(screen.getByText(/Supabase: infraestructura de base de datos/i)).toBeInTheDocument()
    expect(screen.getByText(/Cloudflare Turnstile: prevención de bots/i)).toBeInTheDocument()
    expect(screen.getByText(/Vercel: alojamiento y distribución/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Política de privacidad de Supabase/i })).toHaveAttribute(
      'href',
      'https://supabase.com/privacy',
    )
    expect(screen.getByRole('link', { name: /Política de privacidad de Cloudflare/i })).toHaveAttribute(
      'href',
      'https://www.cloudflare.com/privacypolicy/',
    )
    expect(screen.getByRole('link', { name: /Aviso de privacidad de Vercel/i })).toHaveAttribute(
      'href',
      'https://vercel.com/legal/privacy-notice',
    )
    expect(screen.getByText(/hasta 24 meses desde la última interacción/i)).toBeInTheDocument()
  })

  test('does not claim unavailable analytics, advertising, sale, or automated decisions', () => {
    const { container } = renderPrivacy()
    const text = container.textContent ?? ''

    expect(text).toMatch(/no se incorporan Google Analytics, Meta Pixel, newsletter/i)
    expect(text).not.toMatch(/usamos Google Analytics/i)
    expect(text).not.toMatch(/utilizamos Meta Pixel/i)
    expect(text).not.toMatch(/vendemos datos/i)
    expect(text).not.toMatch(/venta de datos/i)
    expect(text).not.toMatch(/decisiones exclusivamente automatizadas/i)
  })

  test('keeps keyboard navigation and semantic legal structure accessible', async () => {
    const user = userEvent.setup()
    renderPrivacy()

    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(20)
    expect(screen.getByRole('heading', { level: 3, name: /Validaciones implementadas/i })).toBeInTheDocument()

    const legalNav = screen.getByRole('navigation', { name: /Índice legal/i })
    expect(within(legalNav).getByRole('link', { name: /Responsable del tratamiento/i })).toHaveAttribute(
      'href',
      '#responsable',
    )

    await user.tab()
    expect(screen.getByLabelText(/Índice del documento/i)).toHaveFocus()
    await user.tab()
    expect(within(legalNav).getByRole('link', { name: /Responsable del tratamiento/i })).toHaveFocus()
    expect(screen.getByRole('link', { name: 'https://www.aristapartners.cl' })).toHaveAttribute(
      'href',
      'https://www.aristapartners.cl',
    )
  })

  test('is reachable from the public footer', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Privacidad' })).toHaveAttribute('href', '/privacidad')
  })
})
