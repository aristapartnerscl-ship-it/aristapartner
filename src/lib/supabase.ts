import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseConfig } from './supabase-config'
import type { Database } from '../types/supabase.generated'

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
