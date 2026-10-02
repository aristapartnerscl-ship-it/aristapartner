import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AdminProfile } from '../types/admin'

export type AuthStatus = 'configuration_pending' | 'loading' | 'signed_out' | 'unauthorized' | 'ready'

export type AdminAuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  profile: AdminProfile | null
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile?: () => Promise<void>
}

export const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)
