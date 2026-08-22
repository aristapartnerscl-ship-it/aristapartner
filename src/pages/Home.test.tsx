import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Home } from './Home'

describe('public Home', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  })

  function mockReducedMotion(matches: boolean) {
    const mediaQuery = {
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery))
  }

  function activeSlide() {
    return document.querySelector('[data-testid="hero-slide"][data-active="true"]') as HTMLElement
  }

  test('renders one h1, three paths and their routes', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Intermediación comercial para abrir oportunidades B2B.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Necesito comprar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quiero vender' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quiero ser proveedor' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /Necesito comprar/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=comprar')).toBe(true)
    expect(screen.getAllByRole('link', { name: /Quiero vender/i }).some((link) => link.getAttribute('href') === '/oportunidades?tipo=vender')).toBe(true)
    expect(screen.getByRole('link', { name: /Registrar mi perfil/i })).toHaveAttribute('href', '/oportunidades?tipo=proveedor')
  })

  test('loads approved images with explicit dimensions and appropriate loading', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    const images = [...document.querySelectorAll('img')]
    const heroImages = [...document.querySelectorAll('[data-testid="hero-slide"] img')]
    expect(images).toHaveLength(7)
    expect(images[0]).toHaveAttribute('src', '/images/arista-hero-intermediacion-v3.png')
    expect(images[0]).toHaveAccessibleName(/Mesa de trabajo/i)
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[0]).toHaveAttribute('width', '1672')
    expect(images[0]).toHaveAttribute('height', '941')
    expect(images[1]).toHaveAttribute('src', '/images/arista-hero-productos-b2b-v3.png')
    expect(images[1]).toHaveAttribute('loading', 'lazy')
    expect(images[1]).not.toHaveAttribute('fetchpriority', 'high')
    expect(images[2]).toHaveAttribute('src', '/images/arista-hero-proveedores-v3.png')
    expect(images[2]).toHaveAttribute('loading', 'lazy')
    expect(images[3]).toHaveAttribute('src', '/images/arista-hero-negociacion-v3.png')
    expect(images[3]).toHaveAttribute('loading', 'lazy')
    expect(images[4]).toHaveAttribute('src', '/images/arista-hero-seguimiento-v3.png')
    expect(images[4]).toHaveAttribute('loading', 'lazy')
    expect(images[5]).toHaveAttribute('src', '/images/arista-b2b-desarrollo.png')
    expect(images[5]).toHaveAttribute('loading', 'lazy')
    expect(images[6]).toHaveAttribute('src', '/images/arista-proveedores-comparacion.png')
    expect(images[6]).toHaveAttribute('loading', 'lazy')
    images.forEach((image) => expect(image).toHaveAttribute('alt'))
    heroImages.forEach((image) => {
      expect(image.getAttribute('alt')).toBeTruthy()
      expect(image).toHaveClass('h-full', 'w-full', 'object-cover')
      expect(image).not.toHaveClass('w-screen')
    })
  })

  test('uses AVIF, WebP and PNG fallback sources for every approved image', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    const pictures = [...document.querySelectorAll('picture')]
    expect(pictures).toHaveLength(7)
    for (const picture of pictures) {
      expect(picture.querySelector('source[type="image/avif"]')).toHaveAttribute('srcset')
      expect(picture.querySelector('source[type="image/avif"]')).toHaveAttribute('sizes')
      expect(picture.querySelector('source[type="image/webp"]')).toHaveAttribute('srcset')
      expect(picture.querySelector('source[type="image/webp"]')).toHaveAttribute('sizes')
      expect(picture.querySelector('img')).toHaveAttribute('src')
    }
  })

  test('keeps visual sections ordered semantically and preserves responsive image loading', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    const b2bHeading = screen.getByRole('heading', { name: 'Del consumidor al mercado empresarial' })
    const b2bImage = screen.getByAltText('Producto de consumo presentado para explorar una oportunidad empresarial')
    const supplierHeading = screen.getByRole('heading', { name: 'Alternativas para comprar con mejor información' })
    const supplierImage = screen.getByAltText('Alternativas de proveedores comparadas para una necesidad de compra')

    expect(b2bHeading.compareDocumentPosition(b2bImage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(supplierHeading.compareDocumentPosition(supplierImage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(b2bImage).toHaveAttribute('loading', 'lazy')
    expect(supplierImage).toHaveAttribute('loading', 'lazy')
    expect(b2bImage.parentElement).toHaveClass('block', 'h-full', 'w-full')
    expect(supplierImage.parentElement).toHaveClass('block', 'h-full', 'w-full')
    expect(b2bImage).toHaveClass('h-full', 'w-full', 'object-cover', 'object-center')
    expect(supplierImage).toHaveClass('h-full', 'w-full', 'object-cover', 'object-center')
    expect(b2bImage.parentElement?.parentElement).toHaveClass('aspect-[3/2]', 'max-w-[600px]', 'overflow-hidden', 'rounded-lg', 'lg:max-w-[560px]')
    expect(supplierImage.parentElement?.parentElement).toHaveClass('aspect-[3/2]', 'max-w-[600px]', 'overflow-hidden', 'rounded-lg', 'lg:max-w-[560px]', 'lg:order-first')
  })

  test('does not add unsupported commercial claims', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    const pageText = document.body.textContent ?? ''

    expect(pageText).not.toMatch(/casos de éxito|líderes|testimonios|\b\d+(?:[.,]\d+)?%/i)
  })

  test('renders five ambient hero slides without visible carousel controls', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(screen.getAllByTestId('hero-slide')).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /imagen anterior|imagen siguiente|pausar|reanudar|reproducir|play|pause|diapositiva/i })).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Comparación de proveedores/)
    expect(activeSlide().querySelector('img')).toHaveAttribute('src', '/images/arista-hero-intermediacion-v3.png')
  })

  test('uses compact mobile hero, CTA and carousel layout classes', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    const hero = screen.getByTestId('home-hero')
    const carousel = screen.getByTestId('hero-carousel')
    const ctas = screen.getByTestId('home-hero-ctas')
    const buyCta = screen.getAllByRole('link', { name: /Necesito comprar/i }).find((link) => link.getAttribute('href') === '/oportunidades?tipo=comprar')
    const sellCta = screen.getAllByRole('link', { name: /Quiero vender/i }).find((link) => link.getAttribute('href') === '/oportunidades?tipo=vender')

    expect(hero).toHaveClass('overflow-hidden', 'px-4', 'py-6', 'sm:py-14', 'lg:py-16')
    expect(carousel).toHaveClass('h-[clamp(190px,31svh,240px)]', 'overflow-hidden', 'sm:aspect-video')
    expect(carousel).not.toHaveClass('w-screen')
    expect(ctas).toHaveClass('grid', 'grid-cols-2', 'gap-2')
    expect(buyCta).toHaveClass('min-h-11')
    expect(sellCta).toHaveClass('min-h-11')
    expect(buyCta).toHaveAttribute('href', '/oportunidades?tipo=comprar')
    expect(sellCta).toHaveAttribute('href', '/oportunidades?tipo=vender')
  })

  test('keeps public card groups compact on mobile without horizontal overflow classes', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    const audienceGrid = screen.getByTestId('home-audience-grid')
    const cards = [...audienceGrid.querySelectorAll('article')]

    expect(audienceGrid).toHaveClass('grid', 'gap-3', 'sm:gap-5')
    expect(audienceGrid).not.toHaveClass('w-screen')
    cards.forEach((card) => {
      expect(card).toHaveClass('p-3.5', 'sm:p-6')
      expect(card).not.toHaveClass('rounded-3xl')
    })
  })

  test('rotates automatically after the carousel interval', () => {
    vi.useFakeTimers()
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(activeSlide().querySelector('img')).toHaveAttribute('src', '/images/arista-hero-intermediacion-v3.png')
    act(() => vi.advanceTimersByTime(6000))
    expect(activeSlide().querySelector('img')).toHaveAttribute('src', '/images/arista-hero-productos-b2b-v3.png')
  })

  test('prefers-reduced-motion disables automatic rotation', () => {
    mockReducedMotion(true)
    vi.useFakeTimers()
    render(<MemoryRouter><Home /></MemoryRouter>)

    act(() => vi.advanceTimersByTime(12000))
    expect(activeSlide().querySelector('img')).toHaveAttribute('src', '/images/arista-hero-intermediacion-v3.png')
  })

  test('does not rotate automatically while the document is hidden', () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    render(<MemoryRouter><Home /></MemoryRouter>)
    act(() => document.dispatchEvent(new Event('visibilitychange')))

    act(() => vi.advanceTimersByTime(12000))
    expect(activeSlide().querySelector('img')).toHaveAttribute('src', '/images/arista-hero-intermediacion-v3.png')
  })

  test('does not render mojibake or replacement characters', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)

    expect(document.body.textContent).not.toMatch(/[\u00c3\u00c2\ufffd]/)
  })
})
