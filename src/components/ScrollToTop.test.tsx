import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ScrollToTop } from './ScrollToTop'

function renderWithHash(hash: string) {
  return render(
    <MemoryRouter initialEntries={[`/${hash}`]}>
      <ScrollToTop />
      <main>
        <h1 id="contenido" tabIndex={-1}>Inicio</h1>
        <section id="ancla-valida" tabIndex={-1}>Ancla válida</section>
      </main>
    </MemoryRouter>,
  )
}

describe('ScrollToTop', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('mantiene funcionando un ancla HTML válida', async () => {
    renderWithHash('#ancla-valida')

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }))
    expect(document.getElementById('ancla-valida')).toHaveFocus()
  })

  test('ignora hash de Supabase con error sin lanzar excepción', () => {
    expect(() => renderWithHash('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')).not.toThrow()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  test('ignora hash malformado o con codificación inválida sin romper la aplicación', () => {
    expect(() => renderWithHash('#%E0%A4%A')).not.toThrow()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
