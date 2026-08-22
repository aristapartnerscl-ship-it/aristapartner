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

    const menuButton = screen.getByRole('button', { name: /Abrir men/i })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('navigation', { name: /Navegaci/i })).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()

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
    expect(footer.querySelector('img[alt=""]')).toBeInTheDocument()
    expect(footer.querySelector('img[alt*="Representación"]')).not.toBeInTheDocument()
    expect(within(footer).getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contacto')
    expect(within(footer).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
  })
})
