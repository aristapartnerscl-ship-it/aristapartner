import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLockup } from '../../components/BrandLockup'
import { supabase } from '../../lib/supabase'
import { isSupabaseConfigured } from '../../lib/supabase-config'

const neutralRecoveryMessage =
  'Si existe una cuenta autorizada asociada a ese correo, recibirás instrucciones para restablecer la contraseña.'

const invalidRecoveryMessage =
  'El enlace de recuperación no es válido, expiró o ya fue utilizado. Solicita un nuevo enlace para continuar.'

const passwordRequirements = [
  { id: 'length', label: 'Al menos 12 caracteres', test: (value: string) => value.length >= 12 },
  { id: 'lowercase', label: 'Una letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'Una letra mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'number', label: 'Un número', test: (value: string) => /\d/.test(value) },
  { id: 'symbol', label: 'Un símbolo', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function recoveryUrlIndicatesSession() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  return hash.get('type') === 'recovery' || query.get('type') === 'recovery'
}

function passwordMeetsRequirements(value: string) {
  return passwordRequirements.every((requirement) => requirement.test(value))
}

function AdminAccessFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#faf8f2] px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <BrandLockup />
          {children}
        </div>
      </div>
    </main>
  )
}

export function AdminPasswordRecoveryRequest() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const normalizedEmail = email.trim().toLowerCase()
    setMessage('')
    setError('')

    if (!isValidEmail(normalizedEmail)) {
      setError('Ingresa un correo electrónico válido.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    setLoading(true)
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/admin/actualizar-contrasena`,
      })
    }
    setLoading(false)
    setMessage(neutralRecoveryMessage)
    setEmail('')
    window.setTimeout(() => feedbackRef.current?.focus(), 0)
  }

  return (
    <AdminAccessFrame>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#235b3e]">Panel privado</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#17202d]">Recuperar contraseña</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Ingresa el correo asociado a una cuenta autorizada del panel administrativo.
      </p>

      <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e]"
            autoComplete="email"
            aria-invalid={Boolean(error)}
          />
        </label>

        {(error || message) && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className="rounded-md border border-slate-200 bg-[#faf8f2] p-3 text-sm text-slate-700"
            role={error ? 'alert' : 'status'}
            aria-live={error ? 'assertive' : 'polite'}
          >
            {error || message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isSupabaseConfigured}
          className="rounded-md bg-[#17202d] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
        </button>
        <Link to="/admin/login" className="text-center text-sm font-semibold text-[#235b3e]">
          Volver al inicio de sesión
        </Link>
      </form>
    </AdminAccessFrame>
  )
}

export function AdminPasswordUpdate() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'updated'>('checking')
  const [message, setMessage] = useState('Validando enlace de recuperación...')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('invalid')
      setMessage(invalidRecoveryMessage)
      return undefined
    }

    function resolveRecovery(session: Session | null) {
      if (!session?.user || resolvedRef.current) return
      resolvedRef.current = true
      setStatus('ready')
      setMessage('Ingresa una contraseña nueva para completar la recuperación.')
    }

    function handleAuthEvent(event: AuthChangeEvent, session: Session | null) {
      if (event === 'PASSWORD_RECOVERY') resolveRecovery(session)
    }

    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthEvent)

    void supabase.auth.getSession().then(({ data }) => {
      if (recoveryUrlIndicatesSession()) resolveRecovery(data.session)
    })

    const timeoutId = window.setTimeout(() => {
      if (resolvedRef.current) return
      setStatus('invalid')
      setMessage(invalidRecoveryMessage)
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || status !== 'ready') return

    if (!passwordMeetsRequirements(newPassword)) {
      setMessage('La contraseña nueva debe cumplir todos los requisitos.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('La confirmación debe coincidir con la contraseña nueva.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    if (!supabase) {
      setStatus('invalid')
      setMessage(invalidRecoveryMessage)
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setSubmitting(false)
      setMessage('No fue posible actualizar la contraseña. Solicita un nuevo enlace de recuperación.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setStatus('updated')
    setMessage('Contraseña actualizada. Redirigiendo al inicio de sesión...')
    await supabase.auth.signOut({ scope: 'global' })
    window.setTimeout(() => navigate('/admin/login', { replace: true, state: 'password-updated' }), 900)
  }

  const showForm = status === 'ready'

  return (
    <AdminAccessFrame>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#235b3e]">Panel privado</p>
      <h1 className="mt-2 text-3xl font-semibold text-[#17202d]">Actualizar contraseña</h1>

      <div
        ref={feedbackRef}
        tabIndex={-1}
        className="mt-5 rounded-md border border-slate-200 bg-[#faf8f2] p-3 text-sm text-slate-700"
        role={status === 'invalid' ? 'alert' : 'status'}
        aria-live={status === 'invalid' ? 'assertive' : 'polite'}
      >
        {message}
      </div>

      {status === 'checking' && <p className="mt-5 text-sm text-slate-600">Espera un momento mientras se valida la sesión de recuperación.</p>}

      {status === 'invalid' && (
        <div className="mt-6 grid gap-3">
          <Link to="/admin/recuperar-contrasena" className="rounded-md bg-[#17202d] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm">
            Solicitar un enlace nuevo
          </Link>
          <Link to="/admin/login" className="text-center text-sm font-semibold text-[#235b3e]">
            Volver al inicio de sesión
          </Link>
        </div>
      )}

      {showForm && (
        <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Nueva contraseña
            <span className="flex rounded-md border border-slate-300 bg-white focus-within:border-[#235b3e]">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="px-3 text-slate-600"
                onClick={() => setShowNewPassword((value) => !value)}
                aria-label={showNewPassword ? 'Ocultar contraseña nueva' : 'Mostrar contraseña nueva'}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </span>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Confirmar contraseña
            <span className="flex rounded-md border border-slate-300 bg-white focus-within:border-[#235b3e]">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="px-3 text-slate-600"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </span>
          </label>

          <div className="rounded-md border border-slate-200 bg-[#faf8f2] p-4">
            <p className="text-sm font-semibold text-[#17202d]">Requisitos de la contraseña</p>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700">
              {passwordRequirements.map((requirement) => (
                <li key={requirement.id}>{requirement.test(newPassword) ? 'Cumple:' : 'Pendiente:'} {requirement.label}</li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#17202d] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Actualizando contraseña...' : 'Actualizar contraseña'}
          </button>
        </form>
      )}
    </AdminAccessFrame>
  )
}
