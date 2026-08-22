import { isSupabaseConfigured } from '../lib/supabase-config'
import { supabase } from '../lib/supabase'
import { emptyAdminRepository } from './empty-admin-repository'
import { SupabaseAdminRepository } from './supabase-admin-repository'

export const adminRepository = isSupabaseConfigured && supabase ? new SupabaseAdminRepository(supabase) : emptyAdminRepository
