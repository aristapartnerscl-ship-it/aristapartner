import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import AdminRoutes from '../AdminRoutes'
import { AdminLogin } from './AdminLogin'
import { AdminPasswordRecoveryRequest, AdminPasswordUpdate } from './AdminPasswordRecovery'

const authMocks = vi.hoisted(() => {
  let authStateHandler: ((event: AuthChangeEvent, session: Session | null) => void) | null = null

  return {
    get authStateHandler() {
      return authStateHandler
    },
    setAuthStateHandler(handler: ((event: AuthChangeEvent, session: Session | null) => void) | null) {
      authStateHandler = handler
    },
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn((callback: (event: AuthChangeEvent, session: Session | null) => void) => {
      authStateHandler = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }),
  }
})

vi.mock('../../lib/supabase-config', () => ({ isSupabaseConfigured: true }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: authMocks.resetPasswordForEmail,
      updateUser: authMocks.updateUser,
      signOut: authMocks.signOut,
      signInWithPassword: authMocks.signInWithPassword,
      getSession: authMocks.getSession,
      onAuthStateChange: authMocks.onAuthStateChange,
    },
  },
}))
vi.mock('../../repositories', () => ({
  adminRepository: {
    getCurrentAdminProfile: vi.fn().mockResolvedValue({ data: null }),
  },
}))

const recoverySession = {
  user: {
    id: 'owner-user',
  },
} as Session

const neutralMessage = 'Si existe una cuenta autorizada asociada a ese correo, recibirás instrucciones para restablecer la contraseña.'

function renderRecoveryRequest() {
  return render(
    <MemoryRouter>
      <AdminPasswordRecoveryRequest />
    </MemoryRouter>,
  )
}

function renderPasswordUpdate(initialPath = '/admin/actualizar-contrasena') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/actualizar-contrasena" element={<AdminPasswordUpdate />} />
        <Route path="/admin/login" element={<p>Login de administrador</p>} />
        <Route path="/admin/recuperar-contrasena" element={<p>Solicitar enlace nuevo</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderLoginWithAuth() {
  const value: AdminAuthContextValue = {
    status: 'signed_out',
    session: null,
    user: null,
    profile: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <AdminAuthContext.Provider value={value}>
        <AdminLogin />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('admin password recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    authMocks.updateUser.mockResolvedValue({ data: { user: { id: 'owner-user' } }, error: null })
    authMocks.signOut.mockResolvedValue({ error: null })
    authMocks.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    authMocks.getSession.mockResolvedValue({ data: { session: null }, error: null })
    authMocks.setAuthStateHandler(null)
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('muestra enlace de recuperación desde login', () => {
    renderLoginWithAuth()

    expect(screen.getByRole('link', { name: 'Recuperación de contraseña' })).toHaveAttribute('href', '/admin/recuperar-contrasena')
  })

  test('valida formato de correo y enfoca el mensaje de error', async () => {
    const user = userEvent.setup()
    renderRecoveryRequest()

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Ingresa un correo electrónico válido.')
    await waitFor(() => expect(alert).toHaveFocus())
    expect(authMocks.resetPasswordForEmail).not.toHaveBeenCalled()
  })

  test('envía resetPasswordForEmail con redirectTo fijo basado en window.location.origin', async () => {
    const user = userEvent.setup()
    renderRecoveryRequest()

    await user.type(screen.getByLabelText('Correo electrónico'), 'OWNER@EXAMPLE.COM')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))

    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith('owner@example.com', {
      redirectTo: `${window.location.origin}/admin/actualizar-contrasena`,
    })
  })

  test('muestra respuesta neutra ante éxito o error no revelador y no enumera usuarios', async () => {
    const user = userEvent.setup()
    authMocks.resetPasswordForEmail.mockResolvedValueOnce({ data: null, error: { message: 'User not found' } })
    renderRecoveryRequest()

    await user.type(screen.getByLabelText('Correo electrónico'), 'nadie@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))

    expect(screen.getByRole('status')).toHaveTextContent(neutralMessage)
    expect(screen.queryByText(/no existe|user not found|cuenta no encontrada/i)).not.toBeInTheDocument()
  })

  test('mantiene loading y previene doble envío', async () => {
    const user = userEvent.setup()
    authMocks.resetPasswordForEmail.mockReturnValue(new Promise(() => undefined))
    renderRecoveryRequest()

    await user.type(screen.getByLabelText('Correo electrónico'), 'owner@example.com')
    const submit = screen.getByRole('button', { name: 'Enviar enlace de recuperación' })
    await user.click(submit)
    await user.click(submit)

    expect(screen.getByRole('button', { name: 'Enviando enlace...' })).toBeDisabled()
    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledTimes(1)
  })

  test('PASSWORD_RECOVERY habilita el formulario de actualización', async () => {
    renderPasswordUpdate()

    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    expect(await screen.findByRole('button', { name: 'Actualizar contraseña' })).toBeInTheDocument()
    expect(screen.getByText('Ingresa una contraseña nueva para completar la recuperación.')).toBeInTheDocument()
  })

  test('enlace inválido o expirado no muestra formulario', async () => {
    vi.useFakeTimers()
    renderPasswordUpdate()

    await act(async () => {
      vi.advanceTimersByTime(1300)
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/no es válido, expiró o ya fue utilizado/i)
    expect(screen.queryByRole('button', { name: 'Actualizar contraseña' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Solicitar un enlace nuevo' })).toHaveAttribute('href', '/admin/recuperar-contrasena')
  })

  test('rechaza contraseña menor a 12 caracteres y requisitos incompletos', async () => {
    const user = userEvent.setup()
    renderPasswordUpdate()
    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    await user.type(await screen.findByLabelText('Nueva contraseña'), 'Aa1!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Aa1!')
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(screen.getByRole('status')).toHaveTextContent('La contraseña nueva debe cumplir todos los requisitos.')
    expect(authMocks.updateUser).not.toHaveBeenCalled()
  })

  test('exige mayúscula, minúscula, número y símbolo', async () => {
    const user = userEvent.setup()
    renderPasswordUpdate()
    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    await user.type(await screen.findByLabelText('Nueva contraseña'), 'passwordsimple')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'passwordsimple')
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(screen.getByRole('status')).toHaveTextContent('La contraseña nueva debe cumplir todos los requisitos.')
    expect(authMocks.updateUser).not.toHaveBeenCalled()
  })

  test('valida coincidencia de confirmación', async () => {
    const user = userEvent.setup()
    renderPasswordUpdate()
    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    await user.type(await screen.findByLabelText('Nueva contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Password123?')
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(screen.getByRole('status')).toHaveTextContent('La confirmación debe coincidir con la contraseña nueva.')
    expect(authMocks.updateUser).not.toHaveBeenCalled()
  })

  test('updateUser recibe únicamente password, no guarda datos sensibles y cierra sesión global', async () => {
    const user = userEvent.setup()
    const storageSetItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    renderPasswordUpdate()
    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    await user.type(await screen.findByLabelText('Nueva contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(authMocks.updateUser).toHaveBeenCalledWith({ password: 'Password123!' })
    expect(authMocks.signOut).toHaveBeenCalledWith({ scope: 'global' })
    expect(storageSetItemSpy).not.toHaveBeenCalled()
  })

  test('redirige al login con mensaje de confirmación', async () => {
    const user = userEvent.setup()
    renderPasswordUpdate()
    act(() => authMocks.authStateHandler?.('PASSWORD_RECOVERY', recoverySession))

    await user.type(await screen.findByLabelText('Nueva contraseña'), 'Password123!')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Actualizar contraseña' }))

    expect(await screen.findByText('Login de administrador')).toBeInTheDocument()
  })

  test('rutas de recuperación no pasan por AdminGuard y rutas admin normales siguen protegidas', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/recuperar-contrasena']}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument()
    cleanup()

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Acceso administrativo' })).toBeInTheDocument()
  })

  test('no registra datos sensibles en consola', async () => {
    const user = userEvent.setup()
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    renderRecoveryRequest()

    await user.type(screen.getByLabelText('Correo electrónico'), 'owner@example.com')
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }))

    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
