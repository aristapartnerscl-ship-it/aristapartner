import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { About } from './About'
import { HowItWorks } from './HowItWorks'
import { Services } from './Services'

afterEach(() => cleanup())

function renderPage(page: ReactNode) {
  return render(<MemoryRouter>{page}</MemoryRouter>)
}

describe('public Phase 3 pages', () => {
  test.each([
    ['Nosotros', <About key="about" />],
    ['Servicios', <Services key="services" />],
    ['Cómo funciona', <HowItWorks key="how-it-works" />],
  ])('%s mantiene un solo h1 y contenido sin claims inventados', (_, page) => {
    renderPage(page)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.queryByText(/clientes|testimonios|oficinas|alianzas/i)).not.toBeInTheDocument()
  })

  test('Servicios usa solo imágenes aprobadas, lazy loading y picture con fallback', () => {
    renderPage(<Services />)
    const pictures = screen.getAllByRole('img')
    expect(pictures).toHaveLength(2)

    expect(screen.getByAltText(/Muestras y alternativas/i)).toHaveAttribute('loading', 'lazy')
    expect(screen.getByAltText(/Producto de consumo/i)).toHaveAttribute('loading', 'lazy')

    const providerPicture = screen.getByAltText(/Muestras y alternativas/i).closest('picture') as HTMLElement
    const b2bPicture = screen.getByAltText(/Producto de consumo/i).closest('picture') as HTMLElement
    expect(providerPicture).toBeInTheDocument()
    expect(b2bPicture).toBeInTheDocument()
    expect(providerPicture).toHaveClass('block', 'h-full', 'w-full')
    expect(b2bPicture).toHaveClass('block', 'h-full', 'w-full')
    expect(providerPicture.querySelector('source[type="image/avif"]')).toBeInTheDocument()
    expect(providerPicture.querySelector('source[type="image/webp"]')).toBeInTheDocument()
    expect(providerPicture.querySelector('img[src="/images/arista-proveedores-comparacion.png"]')).toBeInTheDocument()
    expect(b2bPicture.querySelector('img[src="/images/arista-b2b-desarrollo.png"]')).toBeInTheDocument()
  })

  test('las rutas comerciales principales conservan enlaces descriptivos', () => {
    renderPage(<HowItWorks />)
    expect(screen.getAllByRole('link', { name: /Presentar una necesidad/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=comprar')).toBe(true)
    expect(screen.getAllByRole('link', { name: /Presentar una oferta/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=vender')).toBe(true)
    expect(screen.getByRole('link', { name: /Registrar perfil proveedor/i })).toHaveAttribute('href', '/oportunidades?tipo=proveedor')
  })

  test('no contiene mojibake ni colores antiguos en las páginas de la fase', () => {
    const pages = [<About key="about" />, <Services key="services" />, <HowItWorks key="how-it-works" />]
    for (const page of pages) {
      const { container, unmount } = renderPage(page)
      expect(container.textContent).not.toMatch(/[ÃÂâ�]|\b\w+\?\w+/)
      expect(container.innerHTML).not.toMatch(/#235B3E|#17202D|#FAF8F2|#EEF5F1/i)
      unmount()
    }
  })
})
