import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { User } from '@supabase/supabase-js'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminAuthContext } from '../../admin/admin-auth-context'
import type { AdminAuthContextValue } from '../../admin/admin-auth-context'
import { adminRepository } from '../../repositories'
import type { AdminNotificationRecord, AdminProfile } from '../../types/admin'
import { AdminShell } from './AdminShell'
import { AdminNotificationsCenter } from './AdminNotificationsCenter'

vi.mock('../../repositories', () => ({
  adminRepository: {
    getUnreadAdminNotificationCount: vi.fn(),
    listAdminNotifications: vi.fn(),
    markAdminNotificationRead: vi.fn(),
    markAllAdminNotificationsRead: vi.fn(),
  },
}))

const unreadNotification: AdminNotificationRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  recipient_id: 'owner-1',
  notification_type: 'form_submission_received',
  entity_type: 'form_submission',
  entity_id: '22222222-2222-4222-8222-222222222222',
  title: 'Nueva recepcion publica',
  message: 'Hay una recepcion pendiente de revision.',
  action_path: '/admin/recepciones?status=received',
  read_at: null,
  created_at: '2026-08-23T12:00:00.000Z',
}

const readNotification: AdminNotificationRecord = {
  ...unreadNotification,
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Recepcion revisada',
  read_at: '2026-08-23T13:00:00.000Z',
  created_at: '2026-08-23T11:00:00.000Z',
}

const externalPathNotification: AdminNotificationRecord = {
  ...unreadNotification,
  id: '44444444-4444-4444-8444-444444444444',
  title: 'Ruta externa bloqueada',
  action_path: 'https://example.com/admin/recepciones',
}

function renderCenter() {
  return render(
    <MemoryRouter>
      <AdminNotificationsCenter />
    </MemoryRouter>,
  )
}

function renderShell(status: AdminAuthContextValue['status']) {
  const value: AdminAuthContextValue = {
    status,
    session: null,
    user: status === 'ready' ? ({ id: 'owner-1' } as User) : null,
    profile: status === 'ready' ? ({ id: 'owner-1', role: 'owner', is_active: true } as AdminProfile) : null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  return render(
    <MemoryRouter>
      <AdminAuthContext.Provider value={value}>
        <AdminShell>
          <p>Contenido privado</p>
        </AdminShell>
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminNotificationsCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.getUnreadAdminNotificationCount).mockResolvedValue({ data: 2, error: null })
    vi.mocked(adminRepository.listAdminNotifications).mockResolvedValue({ data: [unreadNotification, readNotification], error: null })
    vi.mocked(adminRepository.markAdminNotificationRead).mockResolvedValue({
      data: { ...unreadNotification, read_at: '2026-08-23T14:00:00.000Z' },
      error: null,
    })
    vi.mocked(adminRepository.markAllAdminNotificationsRead).mockResolvedValue({ data: 1, error: null })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  test('muestra campana con contador de no leidas', async () => {
    renderCenter()

    const button = await screen.findByRole('button', { name: /2 sin leer/i })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('muestra estado vacio', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.getUnreadAdminNotificationCount).mockResolvedValue({ data: 0, error: null })
    vi.mocked(adminRepository.listAdminNotifications).mockResolvedValue({ data: [], error: null })
    renderCenter()

    await user.click(await screen.findByRole('button', { name: /0 sin leer/i }))

    expect(await screen.findByText(/Aún no hay notificaciones administrativas/i)).toBeInTheDocument()
  })

  test('muestra listado reciente con estado leida y no leida', async () => {
    const user = userEvent.setup()
    renderCenter()

    await user.click(await screen.findByRole('button', { name: /2 sin leer/i }))

    expect(await screen.findByText('Nueva recepcion publica')).toBeInTheDocument()
    expect(screen.getAllByText('Hay una recepcion pendiente de revision.').length).toBeGreaterThan(0)
    expect(screen.getByText('Recepcion revisada')).toBeInTheDocument()
    expect(screen.getByText('No leida')).toBeInTheDocument()
    expect(screen.getByText('Leida')).toBeInTheDocument()
  })

  test('marca una notificacion como leida', async () => {
    const user = userEvent.setup()
    renderCenter()

    await user.click(await screen.findByRole('button', { name: /2 sin leer/i }))
    await user.click(await screen.findByRole('button', { name: /Marcar como leida: Nueva recepcion publica/i }))

    expect(adminRepository.markAdminNotificationRead).toHaveBeenCalledWith(unreadNotification.id)
    await waitFor(() => expect(screen.getByRole('button', { name: /0 sin leer/i })).toBeInTheDocument())
  })

  test('marca todas las notificaciones como leidas', async () => {
    const user = userEvent.setup()
    renderCenter()

    await user.click(await screen.findByRole('button', { name: /2 sin leer/i }))
    await user.click(screen.getByRole('button', { name: 'Marcar todas las notificaciones como leidas' }))

    expect(adminRepository.markAllAdminNotificationsRead).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('button', { name: /0 sin leer/i })).toBeInTheDocument())
  })

  test('permite enlace interno seguro y omite action_path externa', async () => {
    const user = userEvent.setup()
    vi.mocked(adminRepository.listAdminNotifications).mockResolvedValue({ data: [unreadNotification, externalPathNotification], error: null })
    renderCenter()

    await user.click(await screen.findByRole('button', { name: /2 sin leer/i }))

    const safeItem = (await screen.findByText('Nueva recepcion publica')).closest('li')
    expect(within(safeItem!).getByRole('link', { name: 'Ver detalle' })).toHaveAttribute('href', '/admin/recepciones?status=received')

    const externalItem = screen.getByText('Ruta externa bloqueada').closest('li')
    expect(within(externalItem!).queryByRole('link', { name: 'Ver detalle' })).not.toBeInTheDocument()
  })

  test('soporta navegacion por teclado y cierra con Escape', async () => {
    const user = userEvent.setup()
    renderCenter()

    await user.tab()
    expect(await screen.findByRole('button', { name: /2 sin leer/i })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('button', { name: 'Actualizar notificaciones' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('button', { name: 'Actualizar notificaciones' })).not.toBeInTheDocument()
  })

  test('no muestra campana si el owner no esta autenticado', () => {
    renderShell('signed_out')

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /centro de notificaciones/i })).not.toBeInTheDocument()
    expect(adminRepository.getUnreadAdminNotificationCount).not.toHaveBeenCalled()
  })
})
