import type { AdminProfile, RedComercialRole } from '../types/admin'
import { supabase } from '../lib/supabase'

export function redComercialRole(profile: AdminProfile | null): RedComercialRole | null {
  if (!profile?.is_active) return null
  return profile.role === 'owner' ? 'admin' : 'collaborator'
}

export function isRedComercialAdmin(profile: AdminProfile | null) {
  return redComercialRole(profile) === 'admin'
}

export function companyInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function companyLogoUrl(company: { logo_storage_path?: string | null }) {
  if (!company.logo_storage_path || !supabase) return null
  return supabase.storage.from('company-logos').getPublicUrl(company.logo_storage_path).data.publicUrl
}

export function formatList(items: string[]) {
  return items.length > 0 ? items.join(' · ') : 'Sin definir'
}
