import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import { Layout } from './Layout'

describe('public Layout', () => {
  afterEach(() => cleanup())

  test('keeps accessible navigation and mobile menu behavior', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Layout /></MemoryRouter>)

    const header = screen.getByRole('banner')
    const headerSymbol = header.querySelector('img[src="/brand/arista-symbol-v2.png"]')
    expect(headerSymbol).toBeInTheDocument()
    expect(headerSymbol).toHaveClass('object-contain')
    const headerLogo = within(header).getByAltText(/Arista Partners - Representación/i)
    expect(headerLogo).toHaveAttribute('src', '/brand/arista-logo-horizontal.png')
    expect(headerLogo).toHaveClass('object-contain')
    expect(headerLogo).not.toHaveClass('hidden')
    expect(headerLogo.parentElement).toHaveClass('min-w-0')

    const menuButton = screen.getByRole('button', { name: /Abrir men/i })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('navigation', { name: /Navegaci/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    const whatsapp = screen.getByRole('link', { name: 'Contactar por WhatsApp' })
    expect(whatsapp).toHaveAttribute('href', expect.stringContaining('https://wa.me/56982891168'))
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent('Hola Arista Partners, quisiera realizar una consulta.'))
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')

    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: /Navegaci.*m/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(menuButton).toHaveFocus()
  })

  test('uses the compact footer brand composition and preserves footer navigation', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('Arista Partners')
    expect(footer).toHaveTextContent('Representación & Desarrollo Comercial')
    expect(footer.querySelector('img[alt=""]')).toHaveAttribute('src', '/brand/arista-symbol-v2.png')
    expect(footer.querySelector('img[alt*="Representación"]')).not.toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
    expect(within(footer).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
  })

  test('publishes official contact and social links without repeating them in the brand block', () => {
    render(<MemoryRouter><Layout /></MemoryRouter>)

    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText('CONTACTO')).toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Enviar correo a Arista Partners' })).toHaveAttribute('href', 'mailto:contacto@aristapartners.cl')
    expect(within(footer).getByRole('link', { name: 'Contactar Arista Partners por WhatsApp' })).toHaveAttribute('href', 'https://wa.me/56982891168')
    expect(within(footer).getByRole('link', { name: 'Instagram de Arista Partners' })).toHaveAttribute('href', 'https://www.instagram.com/aristapartners/')
    expect(within(footer).getByRole('link', { name: 'Facebook de Arista Partners' })).toHaveAttribute('href', 'https://www.facebook.com/profile.php?id=61593622778886')
    const linkedin = within(footer).getByRole('link', { name: 'LinkedIn de Arista Partners' })
    expect(linkedin).toHaveAttribute('href', 'https://www.linkedin.com/company/arista-partners/?viewAsMember=true')
    for (const link of [within(footer).getByRole('link', { name: 'Contactar Arista Partners por WhatsApp' }), within(footer).getByRole('link', { name: 'Instagram de Arista Partners' }), within(footer).getByRole('link', { name: 'Facebook de Arista Partners' }), linkedin]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
    expect(footer).not.toHaveTextContent('+56 9 8289 1168')
    expect(footer).not.toHaveTextContent('aristapartnerscl@gmail.com')
  })
})
