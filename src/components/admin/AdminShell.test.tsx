import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminShell } from './AdminShell'

let profileRole: 'owner' | 'collaborator' = 'owner'

vi.mock('../../admin/useAdminAuth', () => ({
  useAdminAuth: () => ({
    status: 'ready',
    profile: { id: 'user-1', full_name: 'Admin', role: profileRole, is_active: true, created_at: '', updated_at: '' },
    signOut: vi.fn(),
  }),
}))
vi.mock('./AdminNotificationsCenter', () => ({ AdminNotificationsCenter: () => null }))
vi.mock('../BrandLockup', () => ({ BrandLockup: () => <div>Arista Partners</div> }))

describe('AdminShell', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    profileRole = 'owner'
  })

  test('muestra la navegacion principal y modulos anteriores para admin', () => {
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Empresas Arista' })).toHaveAttribute('href', '/admin/empresas')
    expect(screen.getByRole('link', { name: 'Colaboradores' })).toHaveAttribute('href', '/admin/colaboradores')

    fireEvent.click(screen.getByRole('button', { name: 'Modulos anteriores' }))
    expect(screen.getByRole('link', { name: 'Pipeline comercial' })).toHaveAttribute('href', '/admin/pipeline')
    expect(screen.getByRole('link', { name: 'Propuestas' })).toHaveAttribute('href', '/admin/propuestas')
  })

  test('oculta administracion y modulos anteriores para colaborador', () => {
    profileRole = 'collaborator'
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    expect(screen.getAllByRole('link', { name: 'Inicio' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: 'Colaboradores' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modulos anteriores' })).not.toBeInTheDocument()
  })
})

test('permite que el layout principal se contraiga sin crear overflow global', () => {
  render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)
  const main = screen.getAllByRole('main').at(-1)
  expect(main).toHaveClass('min-w-0', 'max-w-full')
  expect(main?.parentElement).toHaveClass('min-w-0')
})
