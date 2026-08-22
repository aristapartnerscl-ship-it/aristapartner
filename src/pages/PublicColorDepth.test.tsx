import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test } from 'vitest'
import { About } from './About'
import { Contact } from './Contact'
import { Home } from './Home'
import { HowItWorks } from './HowItWorks'
import { Opportunities } from './Opportunities'
import { Services } from './Services'

afterEach(() => cleanup())

describe('ritmo cromático público', () => {
  test('Inicio usa hero oscuro oficial, mantiene un h1 y conserva rutas CTA', () => {
    const { container } = render(<MemoryRouter><Home /></MemoryRouter>)
    const hero = container.querySelector('section.bg-dark-accent')

    expect(hero).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: /Necesito comprar/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=comprar')).toBe(true)
    expect(screen.getAllByRole('link', { name: /Quiero vender/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=vender')).toBe(true)
  })

  test('Inicio mantiene picture optimizado, prioridad del hero y lazy loading secundario', () => {
    const { container } = render(<MemoryRouter><Home /></MemoryRouter>)
    const pictures = [...container.querySelectorAll('picture')]
    const images = [...container.querySelectorAll('img')]

    expect(pictures).toHaveLength(7)
    for (const picture of pictures) {
      expect(picture.querySelector('source[type="image/avif"]')).toBeInTheDocument()
      expect(picture.querySelector('source[type="image/webp"]')).toBeInTheDocument()
      expect(picture.querySelector('img[src$=".png"]')).toBeInTheDocument()
    }
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[1]).toHaveAttribute('loading', 'lazy')
    expect(images[2]).toHaveAttribute('loading', 'lazy')
  })

  test('Inicio y Cómo funciona tienen banda oscura de proceso', () => {
    const home = render(<MemoryRouter><Home /></MemoryRouter>)
    expect(home.container.querySelector('section.bg-graphite ol')).toBeInTheDocument()
    home.unmount()

    const how = render(<MemoryRouter><HowItWorks /></MemoryRouter>)
    expect(how.container.querySelector('section.bg-graphite ol')).toBeInTheDocument()
  })

  test('los formularios no están dentro de una sección verde y las imágenes no reciben filtros', () => {
    const { container } = render(
      <MemoryRouter>
        <>
          <Opportunities />
          <Contact />
        </>
      </MemoryRouter>,
    )

    container.querySelectorAll('form').forEach((form) => {
      expect(form.closest('section.bg-brand-dark')).toBeNull()
      expect(form.closest('.bg-white')).toBeInTheDocument()
    })
    container.querySelectorAll('img').forEach((image) => {
      expect(image.className).not.toMatch(/filter|sepia|hue-rotate|brightness|contrast/)
    })
  })

  test.each([
    ['Nosotros', <About key="about" />],
    ['Servicios', <Services key="services" />],
    ['Cómo funciona', <HowItWorks key="how" />],
    ['Oportunidades', <Opportunities key="opportunities" />],
    ['Contacto', <Contact key="contact" />],
  ])('%s mantiene como máximo dos bandas oscuras de contenido', (_, page) => {
    const { container } = render(<MemoryRouter>{page}</MemoryRouter>)
    const darkSections = container.querySelectorAll('section.bg-brand-dark, section.bg-graphite, section.bg-dark-accent')
    expect(darkSections.length).toBeLessThanOrEqual(2)
  })

  test('no contiene mojibake, colores antiguos, cifras, testimonios ni claims inventados', () => {
    const pages = [<Home key="home" />, <About key="about" />, <Services key="services" />, <HowItWorks key="how" />, <Opportunities key="opportunities" />, <Contact key="contact" />]
    for (const page of pages) {
      const { container, unmount } = render(<MemoryRouter>{page}</MemoryRouter>)
      const text = container.textContent ?? ''
      expect(text).not.toMatch(/[ÃƒÃ‚Ã¢�]/)
      expect(container.innerHTML).not.toMatch(/#235B3E|#17202D|#FAF8F2|#EEF5F1/i)
      expect(text).not.toMatch(/casos de éxito|testimonios|clientes líderes|\b\d+(?:[.,]\d+)?%/i)
      expect(text).not.toMatch(/(?:sí|se)\s+garantiza|garantizamos (?:cierres|resultados)/i)
      unmount()
    }
  })

})
