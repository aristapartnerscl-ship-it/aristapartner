import type { AdminProfile, RedComercialRole } from '../types/admin'
import { supabase } from '../lib/supabase'

export function redComercialRole(profile: AdminProfile | null): RedComercialRole | null {
  if (!profile?.is_active) return null
  return profile.role === 'owner' ? 'admin' : 'collaborator'
}

export function isRedComercialAdmin(profile: AdminProfile | null) {
  return redComercialRole(profile) === 'admin'
}

export function isRedComercialProspectArchived(prospect: { status?: string | null; is_archived?: boolean | null; isArchived?: boolean | null }) {
  return prospect.status === 'archived' || prospect.is_archived === true || prospect.isArchived === true
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

export function getCompanyAccentColor(company: { name: string; slug: string }) {
  const identity = `${company.slug} ${company.name}`.toLowerCase()
  if (identity.includes('centro-psicovinculo') || identity.includes('centro psicovinculo')) return '#8d73b8'
  if (identity.includes('noveli-editorial') || identity.includes('noveli editorial')) return '#b28a42'
  return '#3f7a5b'
}

export function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function formatList(items: string[]) {
  return items.length > 0 ? items.join(' · ') : 'Sin definir'
}
