import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminRoutes from '../AdminRoutes'
import { AdminInvitationAcceptance } from './AdminInvitationAcceptance'

const authMocks = vi.hoisted(() => {
  let authStateHandler: ((event: AuthChangeEvent, session: Session | null) => void) | null = null

  return {
    get authStateHandler() {
      return authStateHandler
    },
    setAuthStateHandler(handler: ((event: AuthChangeEvent, session: Session | null) => void) | null) {
      authStateHandler = handler
    },
    updateUser: vi.fn(),
    invoke: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn((callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      authStateHandler = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
  }
})

const dbMocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
}))

vi.mock('../../lib/supabase-config', () => ({ isSupabaseConfigured: true }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
    updateUser: authMocks.updateUser,
      getSession: authMocks.getSession,
    onAuthStateChange: authMocks.onAuthStateChange,
    },
    functions: {
      invoke: authMocks.invoke,
    },
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        maybeSingle: dbMocks.maybeSingle,
      }
      return builder
    }),
  },
}))
vi.mock('../../repositories', () => ({
  adminRepository: {
    getCurrentAdminProfile: vi.fn().mockResolvedValue({ data: null }),
  },
}))

const invitationSession = {
  user: {
    id: 'collaborator-user',
    email: 'camila@example.com',
  },
} as Session

const collaboratorProfile = {
  id: 'collaborator-user',
  email: 'camila@example.com',
  full_name: 'Camila Rojas',
  role: 'collaborator',
  is_active: true,
  invitation_status: 'pending',
}

function renderInvitation(initialPath = '/admin/aceptar-invitacion#access_token=token&type=invite') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/aceptar-invitacion" element={<AdminInvitationAcceptance />} />
        <Route path="/admin" element={<p>Red Comercial Arista</p>} />
        <Route path="/admin/login" element={<p>Acceso administrativo</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('admin invitation acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.setAuthStateHandler(null)
    authMocks.getSession.mockResolvedValue({ data: { session: invitationSession }, error: null })
    authMocks.updateUser.mockResolvedValue({ data: { user: invitationSession.user }, error: null })
    authMocks.invoke.mockResolvedValue({ data: { ok: true }, error: null })
    dbMocks.maybeSingle.mockResolvedValue({ data: collaboratorProfile, error: null })
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('muestra invitacion invalida cuando no hay sesion valida', async () => {
    vi.useFakeTimers()
    authMocks.getSession.mockResolvedValueOnce({ data: { session: null }, error: null })
    renderInvitation('/admin/aceptar-invitacion')

    await act(async () => {
      vi.advanceTimersByTime(1700)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('La invitacion no es valida o ha expirado.')
    expect(screen.getByRole('link', { name: 'Volver al acceso' })).toHaveAttribute('href', '/admin/login')
    expect(screen.queryByRole('button', { name: 'Activar mi cuenta' })).not.toBeInTheDocument()
  })

  test('muestra correo y nombre del perfil collaborator invitado', async () => {
    renderInvitation()

    expect(await screen.findByRole('button', { name: 'Activar mi cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveValue('camila@example.com')
    expect(screen.getByLabelText('Correo')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Camila Rojas')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('readonly')
  })

  test('valida coincidencia de contrasena antes de activar', async () => {
    const user = userEvent.setup()
    renderInvitation()

    await user.type(await screen.findByLabelText('Nueva contrasena'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contrasena'), 'Password123?')
    await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }))

    expect(screen.getByRole('status')).toHaveTextContent('La confirmacion debe coincidir con la contrasena nueva.')
    expect(authMocks.updateUser).not.toHaveBeenCalled()
  })

  test('activa la cuenta con updateUser y redirige a /admin', async () => {
    const user = userEvent.setup()
    renderInvitation()

    await user.type(await screen.findByLabelText('Nueva contrasena'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contrasena'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }))

    expect(authMocks.updateUser).toHaveBeenCalledWith({ password: 'Password123!' })
    expect(authMocks.invoke).toHaveBeenCalledWith('invite-collaborator', { body: { action: 'complete-onboarding' } })
    expect(await screen.findByText('Red Comercial Arista')).toBeInTheDocument()
  })

  test('la ruta aceptar invitacion no queda bloqueada por AdminGuard', async () => {
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    render(
      <MemoryRouter initialEntries={['/admin/aceptar-invitacion']}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Aceptar invitacion' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Acceso administrativo' })).not.toBeInTheDocument())
  })
})
