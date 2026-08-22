import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../lib/supabase-config'
import { supabase } from '../lib/supabase'
import { adminRepository } from '../repositories'
import type { AdminProfile } from '../types/admin'
import { AdminAuthContext, type AdminAuthContextValue, type AuthStatus } from './admin-auth-context'

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'configuration_pending')
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('configuration_pending')
      return
    }

    let isMounted = true

    async function loadSession() {
      setStatus('loading')
      const { data } = await supabase!.auth.getSession()
      if (!isMounted) return
      setSession(data.session)

      if (!data.session?.user) {
        setProfile(null)
        setStatus('signed_out')
        return
      }

      const result = await adminRepository.getCurrentAdminProfile(data.session.user.id)
      if (!isMounted) return
      setProfile(result.data)
      setStatus(result.data ? 'ready' : 'unauthorized')
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      if (!nextSession?.user) {
        setProfile(null)
        setStatus('signed_out')
        return
      }
      void adminRepository.getCurrentAdminProfile(nextSession.user.id).then((result) => {
        if (!isMounted) return
        setProfile(result.data)
        setStatus(result.data ? 'ready' : 'unauthorized')
      })
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured || !supabase) {
      return 'La conexión del panel administrativo aún no está configurada.'
    }

    setStatus('loading')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('signed_out')
      return 'No fue posible iniciar sesión. Revisa el correo y la contraseña.'
    }
    return null
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setStatus('signed_out')
  }

  async function sendPasswordRecovery(email: string) {
    if (!isSupabaseConfigured || !supabase) {
      return 'La recuperación de contraseña estará disponible cuando Supabase esté configurado.'
    }
    if (!email.trim()) {
      return 'Ingresa tu correo electrónico para preparar la recuperación.'
    }
    return 'La recuperación de contraseña está preparada, pero no se habilitará hasta definir el flujo de correo.'
  }

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      profile,
      signIn,
      signOut,
      sendPasswordRecovery,
    }),
    [profile, session, status],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
