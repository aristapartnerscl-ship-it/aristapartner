import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminShell } from './AdminShell'
import { ADMIN_THEME_STORAGE_KEY, getInitialAdminTheme } from './admin-theme'

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
    window.localStorage.clear()
    delete document.documentElement.dataset.adminTheme
  })

  test('muestra la navegacion principal y modulos anteriores para admin', () => {
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Empresas Arista' })).toHaveAttribute('href', '/admin/empresas')
    expect(screen.getByRole('link', { name: 'Prospectos' })).toHaveAttribute('href', '/admin/prospectos')
    expect(screen.getByRole('link', { name: 'Colaboradores' })).toHaveAttribute('href', '/admin/colaboradores')

    fireEvent.click(screen.getByRole('button', { name: 'Modulos anteriores' }))
    expect(screen.getByRole('link', { name: 'Pipeline comercial' })).toHaveAttribute('href', '/admin/pipeline')
    expect(screen.getByRole('link', { name: 'Propuestas' })).toHaveAttribute('href', '/admin/propuestas')
  })

  test('oculta administracion y modulos anteriores para colaborador', () => {
    profileRole = 'collaborator'
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    expect(screen.getAllByRole('link', { name: 'Inicio' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Prospectos' })).toHaveAttribute('href', '/admin/prospectos')
    expect(screen.queryByRole('link', { name: 'Colaboradores' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Modulos anteriores' })).not.toBeInTheDocument()
  })

  test('permite alternar el tema y persistir la preferencia local', () => {
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    const toggle = screen.getByRole('button', { name: 'Activar modo oscuro' })
    fireEvent.click(toggle)

    expect(document.documentElement.dataset.adminTheme).toBe('dark')
    expect(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument()
  })

  test('mantiene el control de contraer visible y persiste el estado', () => {
    render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Contraer menú' }))

    expect(screen.getByRole('button', { name: 'Expandir menú' })).toBeInTheDocument()
    expect(window.localStorage.getItem('arista-admin-sidebar-collapsed')).toBe('true')
    expect(screen.getByRole('link', { name: 'Ir al inicio de Red Comercial Arista' })).toHaveAttribute('href', '/admin')
  })
})

test('permite que el layout principal se contraiga sin crear overflow global', () => {
  render(<MemoryRouter><AdminShell><div>Contenido</div></AdminShell></MemoryRouter>)
  const main = screen.getAllByRole('main').at(-1)
  expect(main).toHaveClass('min-w-0', 'max-w-full')
  expect(main?.parentElement).toHaveClass('min-w-0')
})

test('usa la preferencia del sistema sólo cuando no existe una selección manual', () => {
  window.localStorage.removeItem(ADMIN_THEME_STORAGE_KEY)
  delete document.documentElement.dataset.adminTheme
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
  expect(getInitialAdminTheme()).toBe('dark')

  window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'light')
  expect(getInitialAdminTheme()).toBe('light')
  vi.unstubAllGlobals()
})
