import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'
import { AdminShell } from './AdminShell'

vi.mock('../../admin/useAdminAuth', () => ({
  useAdminAuth: () => ({ status: 'ready', signOut: vi.fn() }),
}))
vi.mock('./AdminNotificationsCenter', () => ({ AdminNotificationsCenter: () => null }))
vi.mock('../BrandLockup', () => ({ BrandLockup: () => <div>Arista Partners</div> }))

describe('AdminShell', () => {
  test('incluye el acceso al Pipeline comercial en el menú privado', () => {
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Pipeline comercial' })).toHaveAttribute('href', '/admin/pipeline')
    expect(screen.getByRole('link', { name: 'Propuestas' })).toHaveAttribute('href', '/admin/propuestas')
    expect(screen.queryByRole('link', { name: 'Contactar por WhatsApp' })).not.toBeInTheDocument()
  })
})

test('permite que el layout principal se contraiga sin crear overflow global', () => {
  render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)
  const main = screen.getAllByRole('main').at(-1)
  expect(main).toHaveClass('min-w-0', 'max-w-full')
  expect(main?.parentElement).toHaveClass('min-w-0')
})
