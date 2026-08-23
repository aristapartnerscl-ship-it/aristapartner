import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { BrandLockup } from '../../components/BrandLockup'
import { isSupabaseConfigured } from '../../lib/supabase-config'
import { useAdminAuth } from '../useAdminAuth'

export function AdminLogin() {
  const auth = useAdminAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(location.state === 'password-updated' ? 'Contraseña actualizada. Ya puedes iniciar sesión.' : '')
  const [loading, setLoading] = useState(false)

  if (auth.status === 'ready') {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (!email.trim() || !password) {
      setMessage('Ingresa correo electrónico y contraseña.')
      return
    }
    setLoading(true)
    const error = await auth.signIn(email, password)
    setLoading(false)
    if (error) setMessage(error)
  }

  return (
    <main className="min-h-screen bg-[#faf8f2] px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <BrandLockup />
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#235b3e]">Panel privado</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17202d]">Acceso administrativo</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ingresa con una cuenta autorizada. No existe registro público de administradores.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-5 rounded-md border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm leading-6 text-slate-700">
              La conexión del panel administrativo aún no está configurada.
            </div>
          )}

          <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e]"
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Contraseña
              <span className="flex rounded-md border border-slate-300 bg-white focus-within:border-[#235b3e]">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 px-3 py-3 text-base outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="px-3 text-slate-600"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </span>
            </label>

            {message && (
              <div className="rounded-md border border-slate-200 bg-[#faf8f2] p-3 text-sm text-slate-700" role="status">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="rounded-md bg-[#17202d] px-5 py-3 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
            <Link to="/admin/recuperar-contrasena" className="text-center text-sm font-semibold text-[#235b3e]">
              Recuperación de contraseña
            </Link>
          </form>
        </div>
      </div>
    </main>
  )
}
