import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AdminRoutes from '../AdminRoutes'
import { AdminInvitationAcceptance } from './AdminInvitationAcceptance'

const authMocks = vi.hoisted(() => {
  return {
    verifyOtp: vi.fn(),
    updateUser: vi.fn(),
    invoke: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  }
})

const dbMocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
}))

vi.mock('../../lib/supabase-config', () => ({ isSupabaseConfigured: true }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      verifyOtp: authMocks.verifyOtp,
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

function renderInvitation(initialPath = '/admin/aceptar-invitacion?token_hash=token-hash&type=invite') {
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
    authMocks.verifyOtp.mockResolvedValue({ data: { session: invitationSession }, error: null })
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
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

  test('muestra invitacion invalida cuando faltan parametros validos', () => {
    renderInvitation('/admin/aceptar-invitacion')

    expect(screen.getByRole('alert')).toHaveTextContent('La invitacion no es valida o ha expirado.')
    expect(screen.getByRole('link', { name: 'Volver al acceso' })).toHaveAttribute('href', '/admin/login')
    expect(screen.queryByRole('button', { name: 'Activar mi cuenta' })).not.toBeInTheDocument()
    expect(authMocks.verifyOtp).not.toHaveBeenCalled()
  })

  test('abrir pagina con token no consume el token automaticamente', () => {
    renderInvitation()

    expect(screen.getByRole('button', { name: 'Aceptar invitacion' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Has sido invitado a Red Comercial Arista.')
    expect(authMocks.verifyOtp).not.toHaveBeenCalled()
  })

  test('solo acepta type invite', () => {
    renderInvitation('/admin/aceptar-invitacion?token_hash=token-hash&type=email')

    expect(screen.getByRole('alert')).toHaveTextContent('La invitacion no es valida o ha expirado.')
    expect(authMocks.verifyOtp).not.toHaveBeenCalled()
  })

  test('click aceptar ejecuta verifyOtp y muestra correo y nombre', async () => {
    const user = userEvent.setup()
    renderInvitation()

    await user.click(screen.getByRole('button', { name: 'Aceptar invitacion' }))

    expect(authMocks.verifyOtp).toHaveBeenCalledWith({ token_hash: 'token-hash', type: 'invite' })
    expect(await screen.findByRole('button', { name: 'Activar mi cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveValue('camila@example.com')
    expect(screen.getByLabelText('Correo')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Camila Rojas')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('readonly')
  })

  test('token invalido muestra error', async () => {
    const user = userEvent.setup()
    authMocks.verifyOtp.mockResolvedValueOnce({ data: { session: null }, error: new Error('expired') })
    renderInvitation()

    await user.click(screen.getByRole('button', { name: 'Aceptar invitacion' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('La invitacion no es valida o ha expirado.')
    expect(screen.getByRole('link', { name: 'Volver al acceso' })).toHaveAttribute('href', '/admin/login')
  })

  test('valida coincidencia de contrasena antes de activar', async () => {
    const user = userEvent.setup()
    renderInvitation()

    await user.click(screen.getByRole('button', { name: 'Aceptar invitacion' }))
    await user.type(await screen.findByLabelText('Nueva contrasena'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contrasena'), 'Password123?')
    await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }))

    expect(screen.getByRole('status')).toHaveTextContent('La confirmacion debe coincidir con la contrasena nueva.')
    expect(authMocks.updateUser).not.toHaveBeenCalled()
  })

  test('activa la cuenta con updateUser y redirige a /admin', async () => {
    const user = userEvent.setup()
    renderInvitation()

    await user.click(screen.getByRole('button', { name: 'Aceptar invitacion' }))
    await user.type(await screen.findByLabelText('Nueva contrasena'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contrasena'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Activar mi cuenta' }))

    expect(authMocks.updateUser).toHaveBeenCalledWith({ password: 'Password123!' })
    expect(authMocks.invoke).toHaveBeenCalledWith('invite-collaborator', { body: { action: 'complete-onboarding' } })
    expect(await screen.findByText('Red Comercial Arista')).toBeInTheDocument()
  })

  test('la ruta aceptar invitacion no queda bloqueada por AdminGuard', async () => {
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
