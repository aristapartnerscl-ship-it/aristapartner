import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLockup } from '../../components/BrandLockup'
import { supabase } from '../../lib/supabase'
import { isSupabaseConfigured } from '../../lib/supabase-config'

const invalidInvitationMessage = 'La invitacion no es valida o ha expirado.'

const passwordRequirements = [
  { id: 'length', label: 'Al menos 12 caracteres', test: (value: string) => value.length >= 12 },
  { id: 'lowercase', label: 'Una letra minuscula', test: (value: string) => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'Una letra mayuscula', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'number', label: 'Un numero', test: (value: string) => /\d/.test(value) },
  { id: 'symbol', label: 'Un simbolo', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

type InvitationStatus = 'checking' | 'ready' | 'invalid' | 'activating' | 'activated'

type InvitationProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: string
  is_active: boolean
}

function getUrlParams(value: string) {
  try {
    return new URLSearchParams(value.replace(/^[?#]/, ''))
  } catch {
    return new URLSearchParams()
  }
}

function invitationUrlIndicatesInvalidLink() {
  const hash = getUrlParams(window.location.hash)
  const query = getUrlParams(window.location.search)
  const error = hash.get('error') || query.get('error')
  const errorCode = hash.get('error_code') || query.get('error_code')

  return error === 'access_denied' || errorCode === 'otp_expired'
}

function invitationUrlIndicatesSession() {
  const hash = getUrlParams(window.location.hash)
  const query = getUrlParams(window.location.search)
  return Boolean(hash.get('access_token') || query.get('access_token') || hash.get('type') === 'invite' || query.get('type') === 'invite')
}

function passwordMeetsRequirements(value: string) {
  return passwordRequirements.every((requirement) => requirement.test(value))
}

export function AdminInvitationAcceptance() {
  const navigate = useNavigate()
  const feedbackRef = useRef<HTMLDivElement>(null)
  const resolvedRef = useRef(false)
  const [status, setStatus] = useState<InvitationStatus>('checking')
  const [message, setMessage] = useState('Validando invitacion...')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('invalid')
      setMessage(invalidInvitationMessage)
      return undefined
    }

    if (invitationUrlIndicatesInvalidLink()) {
      setStatus('invalid')
      setMessage(invalidInvitationMessage)
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return undefined
    }

    async function resolveInvitation(session: Session | null) {
      if (!session?.user || resolvedRef.current || !supabase) return
      resolvedRef.current = true

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('id, email, full_name, role, is_active')
        .eq('id', session.user.id)
        .eq('role', 'collaborator')
        .eq('is_active', true)
        .in('invitation_status', ['pending', 'accepted'])
        .maybeSingle()

      const profile = data as InvitationProfile | null
      if (error || !profile) {
        setStatus('invalid')
        setMessage(invalidInvitationMessage)
        window.setTimeout(() => feedbackRef.current?.focus(), 0)
        return
      }

      setEmail(profile.email || session.user.email || '')
      setFullName(profile.full_name || '')
      setStatus('ready')
      setMessage('Define una contrasena para activar tu acceso a Red Comercial Arista.')

      if (window.location.hash || window.location.search) {
        window.history.replaceState(null, '', '/admin/aceptar-invitacion')
      }
    }

    function handleAuthEvent(event: AuthChangeEvent, session: Session | null) {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        void resolveInvitation(session)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthEvent)

    void supabase.auth.getSession().then(({ data }) => {
      if (invitationUrlIndicatesSession() || data.session?.user) void resolveInvitation(data.session)
    })

    const timeoutId = window.setTimeout(() => {
      if (resolvedRef.current) return
      setStatus('invalid')
      setMessage(invalidInvitationMessage)
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
    }, 1600)

    return () => {
      window.clearTimeout(timeoutId)
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status !== 'ready' || !supabase) return

    if (!passwordMeetsRequirements(newPassword)) {
      setMessage('La contrasena nueva debe cumplir todos los requisitos.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('La confirmacion debe coincidir con la contrasena nueva.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    setStatus('activating')
    setMessage('Activando cuenta...')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setStatus('ready')
      setMessage('No fue posible activar la cuenta. Solicita una nueva invitacion.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    const { error: completeError } = await supabase.functions.invoke('invite-collaborator', { body: { action: 'complete-onboarding' } })
    if (completeError) {
      setStatus('ready')
      setMessage('La contrasena fue actualizada, pero no fue posible completar la activacion. Vuelve a intentarlo.')
      window.setTimeout(() => feedbackRef.current?.focus(), 0)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setStatus('activated')
    setMessage('Cuenta activada. Redirigiendo a Red Comercial...')
    window.setTimeout(() => navigate('/admin', { replace: true }), 500)
  }

  const showForm = status === 'ready' || status === 'activating'

  return (
    <main className="min-h-screen bg-[#faf8f2] px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-[#ded8ca] bg-white p-6 shadow-sm">
          <BrandLockup />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#235b3e]">Red Comercial</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17202d]">Aceptar invitacion</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Completa tu acceso privado a Red Comercial Arista. No existe registro publico de colaboradores.
          </p>

          <div
            ref={feedbackRef}
            tabIndex={-1}
            className="mt-5 rounded-lg border border-[#ded8ca] bg-[#faf8f2] p-3 text-sm text-slate-700"
            role={status === 'invalid' ? 'alert' : 'status'}
            aria-live={status === 'invalid' ? 'assertive' : 'polite'}
          >
            {message}
          </div>

          {status === 'checking' && <p className="mt-5 text-sm text-slate-600">Espera un momento mientras se valida la invitacion.</p>}

          {status === 'invalid' && (
            <div className="mt-6 grid gap-3">
              <Link to="/admin/login" className="rounded-md bg-[#17202d] px-5 py-3 text-center text-sm font-semibold text-white shadow-sm">
                Volver al acceso
              </Link>
            </div>
          )}

          {showForm && (
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Correo
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-base text-slate-700 outline-none"
                  autoComplete="email"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Nombre
                <input
                  type="text"
                  value={fullName}
                  readOnly
                  className="rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-base text-slate-700 outline-none"
                  autoComplete="name"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Nueva contrasena
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
                    aria-label={showNewPassword ? 'Ocultar contrasena nueva' : 'Mostrar contrasena nueva'}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Confirmar contrasena
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
                    aria-label={showConfirmPassword ? 'Ocultar confirmacion de contrasena' : 'Mostrar confirmacion de contrasena'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </label>

              <div className="rounded-md border border-[#ded8ca] bg-[#faf8f2] p-4">
                <p className="text-sm font-semibold text-[#17202d]">Requisitos de la contrasena</p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                  {passwordRequirements.map((requirement) => (
                    <li key={requirement.id}>{requirement.test(newPassword) ? 'Cumple:' : 'Pendiente:'} {requirement.label}</li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                disabled={status === 'activating'}
                className="rounded-md bg-[#17202d] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'activating' ? 'Activando cuenta...' : 'Activar mi cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
