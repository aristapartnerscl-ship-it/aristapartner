import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type {
  AdminProfile,
  AristaBusinessProspectRecord,
  AdminNotificationRecord,
  CommercialAgreementCreateValues,
  CommercialAgreementRecord,
  CommercialAgreementUpdateValues,
  CommercialAgreementWithOpportunity,
  CommercialProposalInsert,
  CommercialProposalRecord,
  CommercialProposalUpdate,
  CommercialProposalWithOpportunity,
  CommercialProposalDocumentInsert,
  CommercialProposalDocumentRecord,
  CommercialProposalVersionRecord,
  CommercialProposalPublicLinkInsert,
  CommercialProposalPublicLinkRecord,
  ContactFormValues,
  ContactInsert,
  ContactRecord,
  ContactSelectorRecord,
  CollaboratorRecord,
  DashboardActivity,
  DashboardData,
  FormSubmissionListItem,
  FormSubmissionRecord,
  FollowUpRecord,
  InquiryConversionResult,
  InquiryConversionValues,
  InquiryInsert,
  InquiryRecord,
  InquiryWithContact,
  OpportunityActivityInsert,
  OpportunityActivityRecord,
  OpportunitySupplierFormValues,
  OpportunitySupplierInsert,
  OpportunitySupplierRecord,
  OpportunitySupplierWithSupplier,
  OpportunityInsert,
  OrganizationSettingsCreateValues,
  OrganizationSettingsRecord,
  OrganizationSettingsUpdateValues,
  OpportunityRecord,
  ProspectActivityRecord,
  ProspectContactStrategy,
  ProspectConversionResult,
  ProspectConversionValues,
  ProspectFollowUpRecord,
  ProspectInsert,
  ProspectRecord,
  ProspectUpdate,
  RedComercialProspectActivityFormValues,
  RedComercialProspectDetailRecord,
  RedComercialProspectDuplicateRecord,
  RedComercialProspectFilters,
  RedComercialProspectFormValues,
  RedComercialProspectListItem,
  RedComercialProspectMetricsRecord,
  RedComercialProspectPanelRecord,
  RedComercialOpportunityFilters,
  RedComercialOpportunityListItem,
  RedComercialOpportunityMetricsRecord,
  RedComercialCrossOpportunityFilters,
  RedComercialCrossOpportunityMetricsRecord,
  RedComercialCrossOpportunityRecord,
  RedComercialResultsData,
  RedComercialResultsFilters,
  RedComercialFollowupFilters,
  RedComercialFollowupListItem,
  RedComercialFollowupMetricsRecord,
  RepositoryErrorKind,
  RepositoryResult,
  RedComercialHomeData,
  RedComercialDashboardData,
  RedComercialCompanyWorkspace,
  RepresentedCompanyMaterialRecord,
  RepresentedCompanyFaqRecord,
  RepresentedCompanyFormValues,
  RepresentedCompanyMembershipRecord,
  RepresentedCompanyRecord,
  SupplierOpportunityRecord,
  SupplierRecord,
  SupplierWithContact,
  SubmissionContactStrategy,
  SubmissionConversionResult,
} from '../types/admin'
import {
  buildBuyOpportunityDraft,
  buildInquiryDraft,
  buildSellOpportunityDraft,
  buildSupplierDraft,
  contactCandidateScore,
} from '../admin/form-submission-utils'
import type {
  ConvertBuySubmissionAtomicArgs,
  ConvertContactSubmissionAtomicArgs,
  ConvertInquiryToOpportunityAtomicArgs,
  ConvertInquiryToOpportunityAtomicRow,
  ConvertProspectToOpportunityArgs,
  ConvertSellSubmissionAtomicArgs,
  ConvertSubmissionAtomicRow,
  ConvertSupplierSubmissionAtomicArgs,
  CreateProspectActivityAtomicArgs,
  ConvertProspectToOpportunityRow,
  Database,
} from '../types/database'
import type { AdminRepository } from './admin-repository'

const contactColumns =
  'id, contact_type, full_name, company_name, position, email, phone, website, social_media, country, region, city, notes, source, created_at, updated_at, created_by'

const contactSelectorColumns = 'id, contact_type, full_name, company_name, email, phone, city, country'

const opportunityColumns =
  'id, reference_code, opportunity_type, title, description, contact_id, status, priority, source, estimated_value, currency, expected_date, country, region, city, internal_notes, rejection_reason, assigned_to, created_at, updated_at, created_by'

const opportunityActivityColumns =
  'id, opportunity_id, activity_type, title, description, occurred_at, next_action_at, completed_at, completed_by, created_at, created_by'

const dashboardActivityColumns = 'id, opportunity_id, title, activity_type, next_action_at, occurred_at, completed_at, completed_by'

const prospectColumns =
  'id, prospect_type, full_name, company_name, role_or_activity, email, phone, website, social_network, country, city_region, source, product_or_service, commercial_origin, lead_temperature, status, priority, preferred_contact_method, next_action_type, next_action_at, last_contact_at, contact_attempts, notes, assigned_to, converted_contact_id, converted_opportunity_id, converted_at, created_by, created_at, updated_at'

const prospectActivityColumns =
  'id, prospect_id, activity_type, outcome, subject, notes, occurred_at, next_action_type, next_action_at, completed_at, created_by, created_at'

const dashboardProspectActionColumns = 'id, full_name, company_name, status, priority, next_action_type, next_action_at'

const supplierColumns =
  'id, contact_id, business_name, legal_name, tax_id, description, categories, geographic_coverage, supply_capacity, minimum_order, minimum_order_currency, issues_invoice, commercial_terms, status, internal_notes, created_at, updated_at, created_by'

const opportunitySupplierColumns = 'id, opportunity_id, supplier_id, status, notes, proposed_amount, currency, created_at, updated_at'

const inquiryColumns =
  'id, contact_id, converted_opportunity_id, subject, reason, message, preferred_contact_method, status, internal_notes, created_at, updated_at, assigned_to'

const linkedOpportunityColumns = 'id, reference_code, title, status, opportunity_type'

const formSubmissionColumns =
  'id, submission_type, payload, status, submitted_at, reviewed_at, reviewed_by, converted_entity_type, converted_entity_id, source_ip_hash, user_agent, consent_contact, consent_marketing, privacy_version'

const adminNotificationColumns =
  'id, recipient_id, notification_type, entity_type, entity_id, title, message, action_path, read_at, created_at'

const commercialAgreementColumns =
  'id, agreement_code, opportunity_id, counterparty_type, contact_id, supplier_id, payer_type, compensation_model, management_fee, commission_type, commission_value, currency, attribution_start, attribution_end, agreement_status, notes, archived_at, archived_by, created_at, updated_at, created_by'

const commercialProposalColumns =
  'id, proposal_code, opportunity_id, title, description, currency, subtotal, tax_percentage, tax_amount, total_amount, valid_until, status, sent_at, viewed_at, accepted_at, accepted_version_id, rejected_at, internal_notes, client_notes, archived_at, archived_by, created_by, created_at, updated_at'

const commercialProposalVersionColumns =
  'id, proposal_id, version_number, title, description, currency, subtotal, tax_percentage, tax_amount, total_amount, valid_until, client_notes, snapshot_data, created_by, created_at'
const commercialProposalDocumentColumns = 'id, proposal_id, version_id, document_type, file_name, generated_at, generated_by'
const commercialProposalPublicLinkColumns = 'id, proposal_id, version_id, token_hash, status, expires_at, created_by, created_at, revoked_at, first_viewed_at, last_viewed_at, view_count, responded_at, response, response_name, response_email, response_comment'

const organizationSettingsColumns =
  'singleton_key, display_name, legal_name, tax_identifier, public_email, public_phone, website_url, address_line, city_region, country_code, timezone, locale, default_currency, default_opportunity_priority, default_follow_up_days, default_attribution_days, default_commission_type, default_commission_value, created_at, updated_at, created_by, updated_by'

const representedCompanyColumns =
  'id, name, slug, description, website_url, logo_storage_path, logo_source, status, offer_summary, problem_solved, ideal_customer, target_industries, territory, keywords, opportunity_examples, what_not_to_promise, internal_owner_id, created_at, updated_at'

const representedCompanyMembershipColumns =
  'id, represented_company_id, user_id, status, assigned_at, assigned_by, created_at, updated_at'

const collaboratorColumns = 'id, full_name, email, role, is_active, created_at, updated_at, last_activity_at, invitation_status, invited_at, invitation_sent_at, invitation_revoked_at, onboarding_completed_at'

const prospectEditableFields = [
  'prospect_type',
  'full_name',
  'company_name',
  'role_or_activity',
  'email',
  'phone',
  'website',
  'social_network',
  'country',
  'city_region',
  'source',
  'product_or_service',
  'commercial_origin',
  'lead_temperature',
  'status',
  'priority',
  'preferred_contact_method',
  'next_action_type',
  'next_action_at',
  'notes',
] as const

function prospectEditablePayload(values: Partial<ProspectInsert | ProspectUpdate>) {
  const payload: Record<string, unknown> = {}
  for (const field of prospectEditableFields) {
    if (field in values) payload[field] = values[field]
  }
  if ('email' in payload) payload.email = optionalText(payload.email as string | null | undefined)?.toLowerCase() ?? null
  return payload
}

const emptyDashboardData: DashboardData = {
  metrics: {
    newOpportunities: null,
    activeOpportunities: null,
    negotiations: null,
    overdueFollowUps: null,
    pendingSuppliers: null,
    newInquiries: null,
    newFormSubmissions: null,
    prospectsDueToday: null,
    overdueProspectFollowUps: null,
  },
  upcomingActions: [],
  upcomingProspectActions: [],
  recentActivities: [],
  hasMetricErrors: false,
  activityError: false,
}

function ok<T>(data: T): RepositoryResult<T> {
  return { data, error: null }
}

function classifyError(error: PostgrestError | Error | null): RepositoryErrorKind {
  if (!error) return 'unknown'
  if ('code' in error) {
    if (error.code === 'PGRST301') return 'auth'
    if (error.code === '42501') return 'authorization'
    if (error.code === 'PGRST116') return 'not_found'
    if (error.code === '23502' || error.code === '23514' || error.code === '22P02') return 'validation'
  }
  if (/fetch|network|failed to fetch/i.test(error.message)) return 'network'
  if (/jwt|auth|session/i.test(error.message)) return 'auth'
  if (/permission|policy|rls|authorized/i.test(error.message)) return 'authorization'
  return 'unknown'
}

function messageFor(kind: RepositoryErrorKind) {
  if (kind === 'auth') return 'Tu sesión ya no está activa. Vuelve a iniciar sesión.'
  if (kind === 'authorization') return 'Tu usuario no tiene permisos para realizar esta acción.'
  if (kind === 'network') return 'No fue posible conectar con Supabase. Revisa la conexión e intenta nuevamente.'
  if (kind === 'validation') return 'Revisa los datos ingresados antes de guardar.'
  if (kind === 'not_found') return 'No se encontró el registro solicitado.'
  return 'No fue posible completar la operación en este momento.'
}

function logSafeError(context: string, error: PostgrestError | Error | null) {
  if (!import.meta.env.DEV || !error) return
  const code = 'code' in error ? error.code : error.name
  console.warn('Supabase admin operation failed', { context, code })
}

function generateReferenceCode() {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
  return `ARI-${new Date().getFullYear()}-${suffix}`
}

function fail<T>(data: T, error: PostgrestError | Error | null, context: string): RepositoryResult<T> {
  const kind = classifyError(error)
  logSafeError(context, error)
  return { data, error: messageFor(kind), errorKind: kind }
}

function functionErrorKind(status?: number): RepositoryErrorKind {
  if (status === 401 || status === 403) return 'authorization'
  if (status === 404) return 'not_found'
  if (status === 400 || status === 409 || status === 422) return 'validation'
  return 'unknown'
}

async function failFunction<T>(data: T, error: Error | null, context: string): Promise<RepositoryResult<T>> {
  logSafeError(context, error)
  const response = (error as (Error & { context?: Response }) | null)?.context
  const payload = response
    ? await response.clone().json().catch(() => null) as { message?: unknown } | null
    : null
  const message = typeof payload?.message === 'string' ? payload.message : null
  if (message) return { data, error: message, errorKind: functionErrorKind(response?.status) }
  return fail(data, error, context)
}

const rpcErrorMessages: Record<string, string> = {
  AP_AUTH_REQUIRED: 'Tu sesión ya no está activa. Vuelve a iniciar sesión.',
  AP_OWNER_REQUIRED: 'Tu usuario no tiene permisos para realizar esta conversión.',
  AP_INQUIRY_NOT_FOUND: 'No se encontró la consulta solicitada.',
  AP_SUBMISSION_NOT_FOUND: 'No se encontró la recepción solicitada.',
  AP_PROSPECT_NOT_FOUND: 'No se encontró el prospecto solicitado.',
  AP_INVALID_SUBMISSION_TYPE: 'El tipo de recepción no coincide con la conversión solicitada.',
  AP_SOURCE_CLOSED: 'Este registro no está disponible para conversión.',
  AP_CONVERSION_INTEGRITY_ERROR: 'La trazabilidad de conversión requiere revisión administrativa.',
  AP_CONTACT_STRATEGY_REQUIRED: 'Selecciona un contacto existente o prepara un contacto nuevo, pero no ambos.',
  AP_CONTACT_NOT_FOUND: 'Selecciona un contacto válido.',
  AP_INVALID_CONTACT_TYPE: 'Selecciona un tipo de contacto válido.',
  AP_CONTACT_NAME_REQUIRED: 'Ingresa el nombre completo para crear el contacto.',
  AP_CONTACT_COMPANY_REQUIRED: 'Ingresa la empresa para crear el contacto.',
  AP_INVALID_EMAIL: 'Ingresa un correo electrónico válido.',
  AP_INVALID_PHONE: 'Ingresa un teléfono válido.',
  AP_INVALID_ACTIVITY_TYPE: 'Selecciona un tipo de actividad válido.',
  AP_INVALID_OUTCOME: 'Selecciona un resultado válido.',
  AP_INVALID_PROSPECT_STATUS: 'Selecciona un estado de prospecto válido.',
  AP_ACTIVITY_SUBJECT_REQUIRED: 'Ingresa un asunto para la actividad.',
  AP_NEXT_ACTION_IN_PAST: 'Programa la próxima acción para una fecha futura.',
  AP_INVALID_OPPORTUNITY_TYPE: 'Selecciona compra o venta para la oportunidad.',
  AP_TITLE_REQUIRED: 'Ingresa un título para la oportunidad.',
  AP_INQUIRY_FIELDS_REQUIRED: 'Completa asunto y mensaje para crear la consulta.',
  AP_SUPPLIER_NAME_REQUIRED: 'Ingresa el nombre comercial del proveedor.',
  AP_SUPPLIER_CATEGORIES_REQUIRED: 'Agrega al menos una categoría del proveedor.',
  AP_INVALID_AMOUNT: 'Revisa los montos antes de convertir.',
  AP_REFERENCE_CODE_COLLISION: 'No fue posible generar un código único. Intenta nuevamente.',
}

function rpcErrorCode(error: PostgrestError | Error | null) {
  if (!error) return null
  return Object.keys(rpcErrorMessages).find((code) => error.message.includes(code)) ?? null
}

function rpcErrorKind(code: string): RepositoryErrorKind {
  if (code.includes('NOT_FOUND')) return 'not_found'
  if (code.includes('AUTH')) return 'auth'
  if (code.includes('OWNER')) return 'authorization'
  return 'validation'
}

function failRpc<T>(data: T, error: PostgrestError | Error | null, context: string): RepositoryResult<T> {
  const code = rpcErrorCode(error)
  if (code) {
    logSafeError(context, error)
    return { data, error: rpcErrorMessages[code], errorKind: rpcErrorKind(code) }
  }
  return fail(data, error, context)
}

function singleRpcRow<T>(rows: T[] | null, context: string): RepositoryResult<T | null> {
  if (!rows || rows.length === 0) {
    return { data: null, error: 'La conversión no retornó un resultado verificable.', errorKind: 'unknown' }
  }
  if (rows.length > 1) {
    logSafeError(context, new Error('MULTIPLE_RPC_ROWS'))
    return { data: null, error: 'La conversión retornó un resultado inconsistente.', errorKind: 'unknown' }
  }
  return ok(rows[0])
}

function optionalText(value: string | null | undefined) {
  const trimmed = (value ?? '').trim()
  return trimmed || undefined
}

function nullableText(value: string | null | undefined) {
  return optionalText(value) ?? null
}

function textList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 30)
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function representedCompanyPayload(values: RepresentedCompanyFormValues) {
  const name = values.name.trim()
  const slug = slugify(values.slug || values.name)
  if (!name || !slug) return { error: 'Ingresa nombre y slug de la empresa.' as const }
  let website_url: string | null = null
  if (values.website_url.trim()) {
    try {
      const url = new URL(values.website_url.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid')
      website_url = url.toString()
    } catch {
      return { error: 'Ingresa una URL web válida.' as const }
    }
  }

  return {
    data: {
      name,
      slug,
      description: nullableText(values.description),
      website_url,
      logo_storage_path: nullableText(values.logo_storage_path),
      logo_source: values.logo_storage_path.trim() ? values.logo_source : 'fallback',
      status: values.status,
      offer_summary: nullableText(values.offer_summary),
      problem_solved: nullableText(values.problem_solved),
      ideal_customer: nullableText(values.ideal_customer),
      target_industries: textList(values.target_industries),
      territory: nullableText(values.territory),
      keywords: textList(values.keywords),
      opportunity_examples: textList(values.opportunity_examples),
      what_not_to_promise: nullableText(values.what_not_to_promise),
      internal_owner_id: null,
    },
  }
}

function domainFromUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    return url.hostname.toLowerCase().replace(/^www\./, '') || null
  } catch {
    return null
  }
}

function timestampOrNull(value: string | null | undefined) {
  return optionalText(value) ?? null
}

function redComercialProspectPayload(values: Partial<RedComercialProspectFormValues & { is_archived: boolean }>) {
  return {
    ...values,
    company_name: values.company_name?.trim(),
    website_url: nullableText(values.website_url),
    rut: nullableText(values.rut),
    contact_name: nullableText(values.contact_name),
    contact_role: nullableText(values.contact_role),
    contact_email: optionalText(values.contact_email)?.toLowerCase() ?? null,
    contact_phone: nullableText(values.contact_phone),
    channel: values.channel || null,
    first_contact_at: timestampOrNull(values.first_contact_at),
    last_contact_at: timestampOrNull(values.last_contact_at),
    next_followup_at: timestampOrNull(values.next_followup_at),
    owner_user_id: nullableText(values.owner_user_id),
    internal_notes: nullableText(values.internal_notes),
    collaborator_ids: values.collaborator_ids ?? undefined,
  }
}

function prospectRpcErrorMessage(error: PostgrestError | Error | null) {
  const message = error?.message ?? ''
  const code = 'code' in (error ?? {}) ? (error as PostgrestError).code : null
  if (code === 'PGRST202') return 'La función de eliminación aún no está disponible en el servidor. Aplica la migration pendiente.'
  if (message.includes('AP_DUPLICATE_PROSPECT')) return 'Este prospecto ya existe en esta cartera.'
  if (message.includes('AP_ACCESS_DENIED')) return 'Tu usuario no tiene permisos para gestionar este prospecto.'
  if (message.includes('AP_INVALID_OWNER')) return 'El responsable debe pertenecer a la cartera seleccionada.'
  if (message.includes('AP_INVALID_ASSIGNEE')) return 'El responsable debe tener una membresia activa en la empresa destino.'
  if (message.includes('AP_ADMIN_REQUIRED')) return 'No tienes permisos para eliminar este prospecto.'
  if (message.includes('AP_PROSPECT_MUST_BE_ARCHIVED')) return 'El prospecto debe estar archivado antes de eliminarse.'
  if (message.includes('AP_PROSPECT_HAS_HISTORY')) return 'No puede eliminarse porque tiene historial comercial asociado. Mantén este prospecto archivado.'
  if (message.includes('AP_INVALID_STATUS')) return 'Estado de oportunidad cruzada no valido.'
  if (message.includes('AP_INVALID_DISCARD_REASON')) return 'Selecciona un motivo de descarte valido.'
  if (message.includes('AP_COMPANY_NAME_REQUIRED')) return 'Ingresa la empresa prospecto.'
  return null
}

function failProspectRpc<T>(data: T, error: PostgrestError | Error | null, context: string): RepositoryResult<T> {
  const message = prospectRpcErrorMessage(error)
  if (message) {
    logSafeError(context, error)
    return { data, error: message, errorKind: message.includes('permisos') ? 'authorization' : 'validation' }
  }
  return fail(data, error, context)
}

function optionalUpperText(value: string | null | undefined) {
  const trimmed = optionalText(value)
  return trimmed ? trimmed.toUpperCase() : undefined
}

function contactRpcArgs(strategy: SubmissionContactStrategy) {
  if ('existing_contact_id' in strategy && strategy.existing_contact_id) {
    return { p_existing_contact_id: strategy.existing_contact_id }
  }
  const contact = strategy.contact
  if (!contact) return {}
  return {
    p_contact_type: contact.contact_type,
    p_contact_full_name: optionalText(contact.full_name),
    p_contact_company_name: optionalText(contact.company_name),
    p_contact_position: optionalText(contact.position),
    p_contact_email: optionalText(contact.email),
    p_contact_phone: optionalText(contact.phone),
    p_contact_website: optionalText(contact.website),
    p_contact_social_media: optionalText(contact.social_media),
    p_contact_country: optionalText(contact.country),
    p_contact_region: optionalText(contact.region),
    p_contact_city: optionalText(contact.city),
    p_contact_notes: optionalText(contact.notes),
  }
}

function prospectContactRpcArgs(contact: ContactFormValues | undefined) {
  if (!contact) return {}
  return {
    p_contact_type: contact.contact_type,
    p_contact_full_name: optionalText(contact.full_name),
    p_contact_company_name: optionalText(contact.company_name),
    p_contact_position: optionalText(contact.position),
    p_contact_email: optionalText(contact.email),
    p_contact_phone: optionalText(contact.phone),
    p_contact_website: optionalText(contact.website),
    p_contact_social_media: optionalText(contact.social_media),
    p_contact_country: optionalText(contact.country),
    p_contact_region: optionalText(contact.region),
    p_contact_city: optionalText(contact.city),
    p_contact_notes: optionalText(contact.notes),
  }
}

export class SupabaseAdminRepository implements AdminRepository {
  private readonly client: SupabaseClient<Database>

  constructor(client: SupabaseClient<Database>) {
    this.client = client
  }

  private async prospectLogoMap(ids: string[]) {
    if (ids.length === 0) return new Map<string, { logo_storage_path: string | null; logo_source: 'manual' | 'detected' | 'fallback'; logo_updated_at: string | null }>()
    const { data } = await (this.client as SupabaseClient).rpc('get_red_comercial_prospect_logos', { p_prospect_ids: ids })
    const items = (data ?? []) as Array<{ id: string; logo_storage_path: string | null; logo_source: 'manual' | 'detected' | 'fallback'; logo_updated_at: string | null }>
    return new Map(items.map((item) => [item.id, item]))
  }

  private async enrichProspectLogo<T extends { id: string }>(rows: T[]) {
    const logos = await this.prospectLogoMap(rows.map((row) => row.id))
    return rows.map((row) => ({
      ...row,
      logo_storage_path: logos.get(row.id)?.logo_storage_path ?? null,
      logo_source: logos.get(row.id)?.logo_source ?? 'fallback',
      logo_updated_at: logos.get(row.id)?.logo_updated_at ?? null,
    }))
  }

  private async autoImportRedComercialProspectLogo(prospectId: string, websiteUrl: string) {
    if (!websiteUrl.trim()) return null
    const detected = await this.client.functions.invoke('detect-company-logo', { body: { action: 'detect', prospectId, websiteUrl } })
    if (detected.error) return null
    const candidate = (detected.data as { candidates?: Array<{ url?: string }> } | null)?.candidates?.find((item) => item.url)
    if (!candidate?.url) return null
    const imported = await this.client.functions.invoke('detect-company-logo', { body: { action: 'import', prospectId, imageUrl: candidate.url } })
    if (imported.error) return null
    return (imported.data as { path?: string } | null)?.path ?? null
  }

  async getCurrentAdminProfile(userId: string) {
    const { data, error } = await this.client
      .from('admin_profiles')
      .select('id, full_name, email, role, is_active, created_at, updated_at, last_activity_at, invitation_status, invited_at, invitation_sent_at, invitation_revoked_at, onboarding_completed_at')
      .eq('id', userId)
      .eq('is_active', true)
      .in('role', ['owner', 'collaborator'])
      .maybeSingle()

    if (error) return fail<AdminProfile | null>(null, error, 'admin_profile.read')
    const profile = data as AdminProfile | null
    if (profile?.role === 'collaborator' && (profile.invitation_status !== 'accepted' || !profile.onboarding_completed_at)) {
      return ok(null)
    }
    return ok(profile)
  }

  async getRedComercialHomeData(): Promise<RepositoryResult<RedComercialHomeData>> {
    const client = this.client as SupabaseClient
    const [companies, collaborators, memberships, myCompanies] = await Promise.all([
      client.from('represented_companies').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      client.from('admin_profiles').select('id', { count: 'exact', head: true }).eq('role', 'collaborator').eq('is_active', true).eq('invitation_status', 'accepted').not('onboarding_completed_at', 'is', null),
      client.from('represented_company_memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      this.listMyRepresentedCompanies(),
    ])

    const error = companies.error ?? collaborators.error ?? memberships.error ?? (myCompanies.error ? new Error(myCompanies.error) : null)
    if (error) return fail<RedComercialHomeData>({ representedCompanies: 0, activeCollaborators: 0, activeMemberships: 0, myMemberships: [], myCompanies: [] }, error, 'red_comercial.home')

    const { data: userData } = await this.client.auth.getUser()
    let myMemberships: RepresentedCompanyMembershipRecord[] = []
    if (userData.user) {
      const { data } = await client
        .from('represented_company_memberships')
        .select(representedCompanyMembershipColumns)
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
      myMemberships = (data ?? []) as RepresentedCompanyMembershipRecord[]
    }

    return ok({
      representedCompanies: companies.count ?? 0,
      activeCollaborators: collaborators.count ?? 0,
      activeMemberships: memberships.count ?? 0,
      myMemberships,
      myCompanies: myCompanies.data,
    })
  }

  async getRedComercialDashboard(period: 'today' | 'week' = 'today') {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_dashboard', { p_period: period })
    const empty = { summary: { followups_today: 0, followups_overdue: 0, active_prospects: 0, opportunities_in_process: 0, opportunities_arista: 0, payments_pending: 0, won_this_month: 0, commission_pending: 0 }, attention_today: [], upcoming_followups: [], opportunities: [], cross_opportunities: [], recent_results: [], portfolios: [], recent_activity: [] } as RedComercialDashboardData
    if (error) return fail<RedComercialDashboardData>(empty, error, 'red_comercial.dashboard')
    return ok((data ?? empty) as RedComercialDashboardData)
  }

  async listRepresentedCompanies() {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('represented_companies').select(representedCompanyColumns).order('name')
    if (error) return fail<RepresentedCompanyRecord[]>([], error, 'represented_companies.list')
    return ok((data ?? []) as RepresentedCompanyRecord[])
  }

  async listMyRepresentedCompanies() {
    const { data: userData, error: userError } = await this.client.auth.getUser()
    if (userError || !userData.user) return fail<RepresentedCompanyRecord[]>([], userError, 'represented_companies.my.auth')
    const profile = await this.getCurrentAdminProfile(userData.user.id)
    if (profile.data?.role === 'owner') return this.listRepresentedCompanies()

    const client = this.client as SupabaseClient
    const { data: memberships, error } = await client
      .from('represented_company_memberships')
      .select(representedCompanyMembershipColumns)
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
    if (error) return fail<RepresentedCompanyRecord[]>([], error, 'represented_companies.my.memberships')
    const ids = ((memberships ?? []) as RepresentedCompanyMembershipRecord[]).map((membership) => membership.represented_company_id)
    if (ids.length === 0) return ok([])
    const { data, error: companyError } = await client.from('represented_companies').select(representedCompanyColumns).in('id', ids).eq('status', 'active').order('name')
    if (companyError) return fail<RepresentedCompanyRecord[]>([], companyError, 'represented_companies.my.companies')
    return ok((data ?? []) as RepresentedCompanyRecord[])
  }

  async getRepresentedCompanyById(id: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('represented_companies').select(representedCompanyColumns).eq('id', id).maybeSingle()
    if (error) return fail<RepresentedCompanyRecord | null>(null, error, 'represented_companies.get')
    return ok(data as RepresentedCompanyRecord | null)
  }

  async getRedComercialCompanyWorkspace(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_company_workspace', { p_company_id: id })
    if (error) return fail<RedComercialCompanyWorkspace | null>(null, error, 'red_comercial.company.workspace')
    return ok((data ?? null) as RedComercialCompanyWorkspace | null)
  }

  async updateRedComercialCompanyPlaybook(id: string, section: string, payload: Record<string, unknown>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_company_playbook', { p_company_id: id, p_section: section, p_payload: payload })
    if (error) return fail<RedComercialCompanyWorkspace | null>(null, error, 'red_comercial.company.playbook.update')
    return ok((data ?? null) as RedComercialCompanyWorkspace | null)
  }

  async upsertRedComercialCompanyFaq(companyId: string, values: Partial<RepresentedCompanyFaqRecord>) {
    const { data, error } = await (this.client as SupabaseClient).from('represented_company_faqs').upsert({
      id: values.id,
      represented_company_id: companyId,
      type: values.type ?? 'faq',
      question: values.question ?? '',
      answer: values.answer ?? '',
      requires_escalation: values.requires_escalation ?? false,
      sort_order: values.sort_order ?? 0,
      is_active: values.is_active ?? true,
    }).select('*').single()
    if (error) return fail<RepresentedCompanyFaqRecord | null>(null, error, 'red_comercial.company.faq.upsert')
    return ok(data as RepresentedCompanyFaqRecord)
  }

  async createRepresentedCompanyMaterial(companyId: string, payload: Record<string, unknown>, file?: File) {
    const normalized = file ? { ...payload, material_type: 'file', file_name: file.name, mime_type: file.type, file_size: file.size } : { ...payload, material_type: 'link' }
    if (file && !this.isAllowedCompanyMaterialFile(file)) return { data: null, error: 'Formato de archivo no permitido.', errorKind: 'validation' as const }
    if (file && file.size > 25 * 1024 * 1024) return { data: null, error: 'El archivo no debe superar 25 MB.', errorKind: 'validation' as const }
    const { data, error } = await (this.client as SupabaseClient).rpc('create_represented_company_material', { p_company_id: companyId, p_payload: normalized })
    if (error) return fail<RepresentedCompanyMaterialRecord | null>(null, error, 'red_comercial.materials.create')
    const created = data as (RepresentedCompanyMaterialRecord & { upload_path?: string }) | null
    if (file && created?.upload_path) {
      const uploaded = await this.client.storage.from('represented-company-materials').upload(created.upload_path, file, { contentType: file.type, upsert: false })
      if (uploaded.error) {
        await (this.client as SupabaseClient).rpc('archive_represented_company_material', { p_material_id: created.id })
        return fail<RepresentedCompanyMaterialRecord | null>(null, uploaded.error, 'red_comercial.materials.upload')
      }
    }
    return ok(created as RepresentedCompanyMaterialRecord | null)
  }

  async updateRepresentedCompanyMaterial(id: string, payload: Record<string, unknown>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_represented_company_material', { p_material_id: id, p_payload: payload })
    if (error) return fail<RepresentedCompanyMaterialRecord | null>(null, error, 'red_comercial.materials.update')
    return ok((data ?? null) as RepresentedCompanyMaterialRecord | null)
  }

  async archiveRepresentedCompanyMaterial(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('archive_represented_company_material', { p_material_id: id })
    if (error) return fail<RepresentedCompanyMaterialRecord | null>(null, error, 'red_comercial.materials.archive')
    return ok((data ?? null) as RepresentedCompanyMaterialRecord | null)
  }

  async createRepresentedCompanyMaterialSignedUrl(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_represented_company_material_access', { p_material_id: id })
    if (error) return fail<string | null>(null, error, 'red_comercial.materials.access')
    const path = (data as { storage_path?: string } | null)?.storage_path
    if (!path) return ok(null)
    const signed = await this.client.storage.from('represented-company-materials').createSignedUrl(path, 600)
    if (signed.error) return fail<string | null>(null, signed.error, 'red_comercial.materials.signed_url')
    return ok(signed.data?.signedUrl ?? null)
  }

  async replaceRepresentedCompanyMaterial(id: string, file: File) {
    if (!this.isAllowedCompanyMaterialFile(file)) return { data: null, error: 'Formato de archivo no permitido.', errorKind: 'validation' as const }
    if (file.size > 25 * 1024 * 1024) return { data: null, error: 'El archivo no debe superar 25 MB.', errorKind: 'validation' as const }
    const prepared = await (this.client as SupabaseClient).rpc('prepare_represented_company_material_replace', { p_material_id: id, p_file_name: file.name, p_mime_type: file.type, p_file_size: file.size })
    if (prepared.error) return fail<RepresentedCompanyMaterialRecord | null>(null, prepared.error, 'red_comercial.materials.replace.prepare')
    const value = prepared.data as { upload_path: string; old_storage_path?: string | null }
    const uploaded = await this.client.storage.from('represented-company-materials').upload(value.upload_path, file, { contentType: file.type, upsert: false })
    if (uploaded.error) return fail<RepresentedCompanyMaterialRecord | null>(null, uploaded.error, 'red_comercial.materials.replace.upload')
    const confirmed = await (this.client as SupabaseClient).rpc('confirm_represented_company_material_replace', { p_material_id: id, p_storage_path: value.upload_path, p_file_name: file.name, p_mime_type: file.type, p_file_size: file.size })
    if (confirmed.error) return fail<RepresentedCompanyMaterialRecord | null>(null, confirmed.error, 'red_comercial.materials.replace.confirm')
    if (value.old_storage_path) await this.client.storage.from('represented-company-materials').remove([value.old_storage_path])
    return ok(confirmed.data as RepresentedCompanyMaterialRecord)
  }

  private isAllowedCompanyMaterialFile(file: File) {
    return new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv']).has(file.type)
  }

  async createRepresentedCompany(values: RepresentedCompanyFormValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const payload = representedCompanyPayload(values)
    if ('error' in payload) return { data: null, error: payload.error ?? 'Revisa los datos ingresados antes de guardar.', errorKind: 'validation' as const }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('represented_companies').insert(payload.data).select(representedCompanyColumns).single()
    if (error) return fail<RepresentedCompanyRecord | null>(null, error, 'represented_companies.create')
    return ok(data as RepresentedCompanyRecord)
  }

  async updateRepresentedCompany(id: string, values: RepresentedCompanyFormValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const payload = representedCompanyPayload(values)
    if ('error' in payload) return { data: null, error: payload.error ?? 'Revisa los datos ingresados antes de guardar.', errorKind: 'validation' as const }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('represented_companies').update(payload.data).eq('id', id).select(representedCompanyColumns).single()
    if (error) return fail<RepresentedCompanyRecord | null>(null, error, 'represented_companies.update')
    return ok(data as RepresentedCompanyRecord)
  }

  async uploadCompanyLogo(companyId: string, file: File) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const allowed = new Map([['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']])
    const extension = allowed.get(file.type)
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !fileExtension || !['png', 'jpg', 'jpeg', 'webp'].includes(fileExtension)) {
      return { data: null, error: 'Sube un logo PNG, JPG, JPEG o WEBP.', errorKind: 'validation' as const }
    }
    if (file.size > 2_097_152) return { data: null, error: 'El logo no debe superar 2 MB.', errorKind: 'validation' as const }
    const path = `${companyId}/manual-${crypto.randomUUID()}.${extension}`
    const { error } = await this.client.storage.from('company-logos').upload(path, file, { contentType: file.type, upsert: true })
    if (error) return fail<string | null>(null, error, 'company_logos.upload')
    return ok(path)
  }

  async detectCompanyLogos(websiteUrl: string) {
    const { data, error } = await this.client.functions.invoke('detect-company-logo', { body: { action: 'detect', websiteUrl } })
    if (error) return fail<Array<{ url: string; source: string; label: string }>>([], error, 'company_logos.detect')
    return ok(((data as { candidates?: Array<{ url: string; source: string; label: string }> })?.candidates ?? []))
  }

  async importDetectedCompanyLogo(companyId: string, imageUrl: string) {
    const { data, error } = await this.client.functions.invoke('detect-company-logo', { body: { action: 'import', companyId, imageUrl } })
    if (error) return fail<string | null>(null, error, 'company_logos.import')
    return ok((data as { path?: string })?.path ?? null)
  }

  async listCollaborators() {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('admin_profiles').select(collaboratorColumns).in('role', ['owner', 'collaborator']).order('created_at', { ascending: false })
    if (error) return fail<CollaboratorRecord[]>([], error, 'collaborators.list')
    return ok((data ?? []) as CollaboratorRecord[])
  }

  async inviteCollaborator(email: string, fullName = '') {
    const { data, error } = await this.client.functions.invoke('invite-collaborator', { body: { action: 'invite', email, fullName } })
    if (error) return failFunction<CollaboratorRecord | null>(null, error, 'collaborators.invite')
    return ok((data as { collaborator?: CollaboratorRecord })?.collaborator ?? null)
  }

  async reissueCollaboratorInvitation(userId: string) {
    const { data, error } = await this.client.functions.invoke('invite-collaborator', { body: { action: 'reissue', userId } })
    if (error) return failFunction<CollaboratorRecord | null>(null, error, 'collaborators.reissue')
    return ok((data as { collaborator?: CollaboratorRecord })?.collaborator ?? null)
  }

  async revokeCollaboratorInvitation(userId: string) {
    const { data, error } = await this.client.functions.invoke('invite-collaborator', { body: { action: 'revoke', userId } })
    if (error) return failFunction<CollaboratorRecord | null>(null, error, 'collaborators.revoke')
    return ok((data as { collaborator?: CollaboratorRecord })?.collaborator ?? null)
  }

  async removeCollaboratorInvitation(userId: string) {
    const { data, error } = await this.client.functions.invoke('invite-collaborator', { body: { action: 'remove', userId } })
    if (error) return failFunction<boolean>(false, error, 'collaborators.remove')
    return ok(Boolean((data as { removed?: boolean })?.removed))
  }

  async updateCollaboratorStatus(userId: string, isActive: boolean) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('admin_profiles')
      .update({ is_active: isActive })
      .eq('id', userId)
      .eq('role', 'collaborator')
      .eq('invitation_status', 'accepted')
      .select(collaboratorColumns)
      .single()
    if (error) return fail<CollaboratorRecord | null>(null, error, 'collaborators.status')
    return ok(data as CollaboratorRecord)
  }

  async updateRedComercialUserRole(userId: string, role: 'owner' | 'collaborator') {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_user_role', { p_user_id: userId, p_role: role })
    if (error) return fail<{ id: string; old_role: string; new_role: string } | null>(null, error, 'users.role.update')
    return ok((data ?? null) as { id: string; old_role: string; new_role: string } | null)
  }

  async listAristaBusinessProspects(filters: { search?: string; status?: string; ownerUserId?: string; includeArchived?: boolean } = {}) {
    const { data, error } = await (this.client as SupabaseClient).rpc('list_arista_business_prospects', {
      p_search: filters.search?.trim() || null,
      p_status: filters.status || null,
      p_owner_user_id: filters.ownerUserId || null,
      p_include_archived: Boolean(filters.includeArchived),
      p_limit: 100,
      p_offset: 0,
    })
    if (error) return fail<AristaBusinessProspectRecord[]>([], error, 'arista_prospects.list')
    return ok((data ?? []) as AristaBusinessProspectRecord[])
  }

  async getAristaBusinessProspect(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_arista_business_prospect', { p_prospect_id: id })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'arista_prospects.get')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async createAristaBusinessProspect(payload: Partial<AristaBusinessProspectRecord>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('create_arista_business_prospect', { p_payload: payload })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'arista_prospects.create')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async updateAristaBusinessProspect(id: string, payload: Partial<AristaBusinessProspectRecord>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_arista_business_prospect', { p_prospect_id: id, p_payload: payload })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'arista_prospects.update')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async addAristaBusinessProspectActivity(id: string, payload: { activity_type: string; subject: string; notes?: string; occurred_at?: string; next_followup_at?: string }) {
    const { data, error } = await (this.client as SupabaseClient).rpc('add_arista_business_prospect_activity', { p_prospect_id: id, p_payload: payload })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'arista_prospects.activity')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async convertAristaBusinessProspect(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('convert_arista_business_prospect', { p_prospect_id: id, p_payload: {} })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'arista_prospects.convert')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async convertFormSubmissionToAristaProspect(id: string, payload: Record<string, unknown> = {}) {
    const { data, error } = await (this.client as SupabaseClient).rpc('convert_form_submission_to_arista_prospect', { p_submission_id: id, p_payload: payload })
    if (error) return fail<AristaBusinessProspectRecord | null>(null, error, 'form_submissions.convert_arista')
    return ok((data ?? null) as AristaBusinessProspectRecord | null)
  }

  async listCompanyMemberships() {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('represented_company_memberships').select(representedCompanyMembershipColumns).order('assigned_at', { ascending: false })
    if (error) return fail<RepresentedCompanyMembershipRecord[]>([], error, 'memberships.list')
    return ok((data ?? []) as RepresentedCompanyMembershipRecord[])
  }

  async upsertCompanyMembership(companyId: string, userId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('represented_company_memberships')
      .upsert({ represented_company_id: companyId, user_id: userId, status: 'active', assigned_by: admin.userId, assigned_at: new Date().toISOString() }, { onConflict: 'represented_company_id,user_id' })
      .select(representedCompanyMembershipColumns)
      .single()
    if (error) return fail<RepresentedCompanyMembershipRecord | null>(null, error, 'memberships.upsert')
    return ok(data as RepresentedCompanyMembershipRecord)
  }

  async deactivateCompanyMembership(companyId: string, userId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('represented_company_memberships')
      .update({ status: 'inactive' })
      .eq('represented_company_id', companyId)
      .eq('user_id', userId)
      .select(representedCompanyMembershipColumns)
      .single()
    if (error) return fail<RepresentedCompanyMembershipRecord | null>(null, error, 'memberships.deactivate')
    return ok(data as RepresentedCompanyMembershipRecord)
  }

  async listRedComercialProspects(companyId: string, filters: RedComercialProspectFilters = {}) {
    const pageSize = filters.pageSize ?? 25
    const page = filters.page ?? 1
    const { data, error } = await (this.client as SupabaseClient).rpc('list_red_comercial_prospects', {
      p_company_id: companyId,
      p_search: optionalText(filters.search),
      p_status: filters.status || null,
      p_channel: filters.channel || null,
      p_owner_user_id: optionalText(filters.ownerUserId),
      p_followup_filter: filters.followupFilter || null,
      p_mine: Boolean(filters.mine),
      p_quick_filter: filters.quickFilter || null,
      p_include_archived: Boolean(filters.includeArchived),
      p_limit: pageSize,
      p_offset: Math.max(0, page - 1) * pageSize,
    })
    if (error) return failProspectRpc<{ rows: RedComercialProspectListItem[]; total: number }>({ rows: [], total: 0 }, error, 'red_comercial.prospects.list')
    const rows = await this.enrichProspectLogo((data ?? []) as RedComercialProspectListItem[])
    return ok({ rows, total: rows[0]?.total_count ?? 0 })
  }

  async getRedComercialProspectMetrics(companyId: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_prospect_metrics', { p_company_id: companyId })
    if (error) return failProspectRpc<RedComercialProspectMetricsRecord>({ total_prospects: 0, to_contact: 0, contacted_no_response: 0, follow_up: 0, agreed: 0, overdue: 0, today: 0, interested: 0 }, error, 'red_comercial.prospects.metrics')
    return ok(((data as RedComercialProspectMetricsRecord[] | null)?.[0] ?? { total_prospects: 0, to_contact: 0, contacted_no_response: 0, follow_up: 0, agreed: 0, overdue: 0, today: 0, interested: 0 }))
  }

  async getRedComercialProspectDetail(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_prospect_detail', { p_prospect_id: id })
    if (error) return failProspectRpc<RedComercialProspectDetailRecord | null>(null, error, 'red_comercial.prospects.detail')
    const detail = (data ?? null) as RedComercialProspectDetailRecord | null
    if (!detail) return ok(null)
    const logos = await this.prospectLogoMap([id])
    return ok({ ...detail, ...(logos.get(id) ?? { logo_storage_path: null, logo_source: 'fallback', logo_updated_at: null }) } as RedComercialProspectDetailRecord)
  }

  async getRedComercialProspectPanel(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_prospect_panel', { p_prospect_id: id })
    if (error) {
      const missingPanelRpc = error.code === 'PGRST202' || /get_red_comercial_prospect_panel|function .* does not exist/i.test(error.message)
      if (missingPanelRpc) {
        const legacy = await this.getRedComercialProspectDetail(id)
        if (legacy.data) return ok<RedComercialProspectPanelRecord>({ prospect: legacy.data, opportunities: [], cross_opportunities: [], notes: [], files: [] })
      }
      return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.prospects.panel')
    }
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async getRedComercialOpportunityPanel(opportunityId: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_opportunity_panel', { p_opportunity_id: opportunityId })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.opportunity.panel')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async createRedComercialOpportunity(prospectId: string, payload: Record<string, unknown>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_opportunity', { p_prospect_id: prospectId, p_payload: payload })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.opportunity.create')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async listRedComercialOpportunities(filters: RedComercialOpportunityFilters = {}) {
    const pageSize = filters.pageSize ?? 25
    const page = filters.page ?? 1
    const { data, error } = await (this.client as SupabaseClient).rpc('list_red_comercial_opportunities', {
      p_search: filters.search || null,
      p_company_id: filters.companyId || null,
      p_control_mode: filters.controlMode || null,
      p_contract_status: filters.contractStatus || null,
      p_payment_status: filters.paymentStatus || null,
      p_responsible_id: filters.responsibleId || null,
      p_result_status: filters.resultStatus || null,
      p_view: filters.view || 'all',
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize,
    })
    if (error) return fail<{ rows: RedComercialOpportunityListItem[]; total: number }>({ rows: [], total: 0 }, error, 'red_comercial.opportunities.list')
    const payload = (data ?? {}) as { rows?: RedComercialOpportunityListItem[]; total?: number }
    return ok({ rows: payload.rows ?? [], total: payload.total ?? 0 })
  }

  async getRedComercialOpportunityMetrics(filters: Pick<RedComercialOpportunityFilters, 'search' | 'companyId' | 'controlMode' | 'contractStatus' | 'paymentStatus' | 'responsibleId' | 'resultStatus'> = {}) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_opportunity_metrics', {
      p_search: filters.search || null,
      p_company_id: filters.companyId || null,
      p_control_mode: filters.controlMode || null,
      p_contract_status: filters.contractStatus || null,
      p_payment_status: filters.paymentStatus || null,
      p_responsible_id: filters.responsibleId || null,
      p_result_status: filters.resultStatus || null,
    })
    if (error) return fail<RedComercialOpportunityMetricsRecord>({ total: 0, in_process: 0, arista: 0, collaborator: 0, contract_pending: 0, payment_pending: 0, commission_pending: 0, won: 0, lost: 0 }, error, 'red_comercial.opportunities.metrics')
    return ok((data ?? { total: 0, in_process: 0, arista: 0, collaborator: 0, contract_pending: 0, payment_pending: 0, commission_pending: 0, won: 0, lost: 0 }) as RedComercialOpportunityMetricsRecord)
  }

  async getRedComercialResults(filters: RedComercialResultsFilters = {}) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_results', {
      p_from: filters.from || null,
      p_to: filters.to || null,
      p_company_id: filters.companyId || null,
      p_collaborator_id: filters.collaboratorId || null,
      p_result_status: filters.resultStatus || null,
      p_payment_status: filters.paymentStatus || null,
      p_control_mode: filters.controlMode || null,
      p_search: filters.search || null,
      p_limit: filters.pageSize ?? 25,
      p_offset: Math.max(0, (filters.page ?? 1) - 1) * (filters.pageSize ?? 25),
    })
    if (error) return failProspectRpc<RedComercialResultsData>({ summary: { closures: 0, won: 0, lost: 0, cancelled: 0, in_process: 0, paid: 0, payment_pending: 0, commission_pending: 0, close_rate: null, avg_close_days: null }, volume_by_currency: {}, companies: [], collaborators: [], closures: [], total_closures: 0 }, error, 'red_comercial.results')
    return ok((data ?? { summary: {}, volume_by_currency: {}, companies: [], collaborators: [], closures: [], total_closures: 0 }) as RedComercialResultsData)
  }

  async updateRedComercialOpportunity(opportunityId: string, payload: Record<string, unknown>) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_opportunity', { p_opportunity_id: opportunityId, p_payload: payload })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.opportunity.update')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async createRedComercialCrossOpportunity(prospectId: string, targetCompanyId: string, reason: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_cross_opportunity', { p_prospect_id: prospectId, p_target_company_id: targetCompanyId, p_reason: reason })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.cross_opportunity.create')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async listRedComercialCrossOpportunities(filters: RedComercialCrossOpportunityFilters = {}) {
    const pageSize = filters.pageSize ?? 25
    const page = filters.page ?? 1
    const { data, error } = await (this.client as SupabaseClient).rpc('list_red_comercial_cross_opportunities', {
      p_search: filters.search || null,
      p_source_company_id: filters.sourceCompanyId || null,
      p_target_company_id: filters.targetCompanyId || null,
      p_status: filters.status || null,
      p_assigned_to: filters.assignedTo || null,
      p_view: filters.view || 'all',
      p_limit: pageSize,
      p_offset: Math.max(0, page - 1) * pageSize,
    })
    if (error) return failProspectRpc<{ rows: RedComercialCrossOpportunityRecord[]; total: number }>({ rows: [], total: 0 }, error, 'red_comercial.cross_opportunities.list')
    const payload = (data ?? {}) as { rows?: RedComercialCrossOpportunityRecord[]; total?: number }
    return ok({ rows: payload.rows ?? [], total: payload.total ?? 0 })
  }

  async getRedComercialCrossOpportunityMetrics(filters: Pick<RedComercialCrossOpportunityFilters, 'search' | 'sourceCompanyId' | 'targetCompanyId' | 'assignedTo'> = {}) {
    const empty: RedComercialCrossOpportunityMetricsRecord = { total: 0, detected: 0, under_review: 0, assigned: 0, converted: 0, discarded: 0 }
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_cross_opportunity_metrics', {
      p_search: filters.search || null,
      p_source_company_id: filters.sourceCompanyId || null,
      p_target_company_id: filters.targetCompanyId || null,
      p_assigned_to: filters.assignedTo || null,
    })
    if (error) return failProspectRpc<RedComercialCrossOpportunityMetricsRecord>(empty, error, 'red_comercial.cross_opportunities.metrics')
    return ok((data ?? empty) as RedComercialCrossOpportunityMetricsRecord)
  }

  async getRedComercialCrossOpportunityDetail(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_cross_opportunity_detail', { p_cross_id: id })
    if (error) return failProspectRpc<RedComercialCrossOpportunityRecord | null>(null, error, 'red_comercial.cross_opportunities.detail')
    return ok((data ?? null) as RedComercialCrossOpportunityRecord | null)
  }

  async updateRedComercialCrossOpportunityStatus(id: string, status: RedComercialCrossOpportunityRecord['status']) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_cross_opportunity', { p_cross_id: id, p_status: status })
    if (error) return failProspectRpc<RedComercialCrossOpportunityRecord | null>(null, error, 'red_comercial.cross_opportunities.update')
    return ok((data ?? null) as RedComercialCrossOpportunityRecord | null)
  }

  async assignRedComercialCrossOpportunity(id: string, assignedTo: string | null) {
    const { data, error } = await (this.client as SupabaseClient).rpc('assign_red_comercial_cross_opportunity', { p_cross_id: id, p_assigned_to: assignedTo || null })
    if (error) return failProspectRpc<RedComercialCrossOpportunityRecord | null>(null, error, 'red_comercial.cross_opportunities.assign')
    return ok((data ?? null) as RedComercialCrossOpportunityRecord | null)
  }

  async convertRedComercialCrossOpportunity(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('convert_red_comercial_cross_opportunity', { p_cross_id: id })
    if (error) return failProspectRpc<RedComercialCrossOpportunityRecord | null>(null, error, 'red_comercial.cross_opportunities.convert')
    return ok((data ?? null) as RedComercialCrossOpportunityRecord | null)
  }

  async discardRedComercialCrossOpportunity(id: string, reason: NonNullable<RedComercialCrossOpportunityRecord['discard_reason']>, note = '') {
    const { data, error } = await (this.client as SupabaseClient).rpc('discard_red_comercial_cross_opportunity', { p_cross_id: id, p_reason: reason, p_note: note })
    if (error) return failProspectRpc<RedComercialCrossOpportunityRecord | null>(null, error, 'red_comercial.cross_opportunities.discard')
    return ok((data ?? null) as RedComercialCrossOpportunityRecord | null)
  }

  async createRedComercialProspectNote(prospectId: string, body: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_prospect_note', { p_prospect_id: prospectId, p_body: body })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.notes.create')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async updateRedComercialProspectNote(noteId: string, body: string, archived = false) {
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_prospect_note', { p_note_id: noteId, p_body: body, p_archived: archived })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.notes.update')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async uploadRedComercialProspectFile(prospectId: string, file: File, category = 'general') {
    const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    if (!allowed.has(file.type)) return { data: null, error: 'Formato de archivo no permitido.', errorKind: 'validation' as const }
    if (file.size <= 0 || file.size > 10_485_760) return { data: null, error: 'El archivo no debe superar 10 MB.', errorKind: 'validation' as const }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120) || 'archivo'
    const path = `prospects/${prospectId}/${crypto.randomUUID()}-${safeName}`
    const uploaded = await this.client.storage.from('prospect-files').upload(path, file, { contentType: file.type, upsert: false })
    if (uploaded.error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, uploaded.error, 'red_comercial.files.upload')
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_prospect_file', { p_prospect_id: prospectId, p_storage_path: path, p_file_name: file.name, p_mime_type: file.type, p_size_bytes: file.size, p_category: category })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.files.metadata')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async archiveRedComercialProspectFile(fileId: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('archive_red_comercial_prospect_file', { p_file_id: fileId })
    if (error) return failProspectRpc<RedComercialProspectPanelRecord | null>(null, error, 'red_comercial.files.archive')
    return ok((data ?? null) as RedComercialProspectPanelRecord | null)
  }

  async createRedComercialProspectFileSignedUrl(path: string) {
    const { data, error } = await this.client.storage.from('prospect-files').createSignedUrl(path, 3600)
    if (error) return fail<string | null>(null, error, 'red_comercial.files.signed_url')
    return ok(data?.signedUrl ?? null)
  }

  async detectRedComercialProspectDuplicates(values: Pick<RedComercialProspectFormValues, 'represented_company_id' | 'company_name' | 'website_url' | 'contact_email' | 'contact_phone'>, excludeProspectId?: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('detect_red_comercial_prospect_duplicates', {
      p_company_id: values.represented_company_id,
      p_company_name: values.company_name,
      p_domain: domainFromUrl(values.website_url),
      p_contact_email: optionalText(values.contact_email),
      p_contact_phone: optionalText(values.contact_phone),
      p_exclude_prospect_id: excludeProspectId ?? null,
    })
    if (error) return failProspectRpc<RedComercialProspectDuplicateRecord[]>([], error, 'red_comercial.prospects.duplicates')
    return ok((data ?? []) as RedComercialProspectDuplicateRecord[])
  }

  async createRedComercialProspect(values: RedComercialProspectFormValues) {
    if (!values.company_name.trim()) return { data: null, error: 'Ingresa la empresa prospecto.', errorKind: 'validation' as const }
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_prospect', {
      p_payload: redComercialProspectPayload(values),
    })
    if (error) return failProspectRpc<RedComercialProspectDetailRecord | null>(null, error, 'red_comercial.prospects.create')
    let prospect = (data ?? null) as RedComercialProspectDetailRecord | null
    if (!prospect) return ok(null)
    const websiteUrl = values.website_url?.trim() ?? ''
    const shouldDetect = Boolean(websiteUrl) && (!prospect.logo_storage_path || (await this.getRedComercialProspectDetail(prospect.id)).data?.website_url !== websiteUrl)
    if (shouldDetect) {
      await this.autoImportRedComercialProspectLogo(prospect.id, websiteUrl)
      const refreshed = await this.getRedComercialProspectDetail(prospect.id)
      prospect = refreshed.data ?? prospect
    }
    return ok(prospect)
  }

  async updateRedComercialProspect(id: string, values: Partial<RedComercialProspectFormValues & { is_archived: boolean }>) {
    const previous = values.website_url !== undefined ? await this.getRedComercialProspectDetail(id) : null
    const { data, error } = await (this.client as SupabaseClient).rpc('update_red_comercial_prospect', {
      p_prospect_id: id,
      p_payload: redComercialProspectPayload(values),
    })
    if (error) return failProspectRpc<RedComercialProspectDetailRecord | null>(null, error, 'red_comercial.prospects.update')
    let prospect = (data ?? null) as RedComercialProspectDetailRecord | null
    if (!prospect) return ok(null)
    const websiteUrl = values.website_url?.trim() ?? ''
    if (websiteUrl) {
      const changedWebsite = previous?.data?.website_url !== websiteUrl
      if (!prospect.logo_storage_path || changedWebsite) {
        await this.autoImportRedComercialProspectLogo(id, websiteUrl)
        const refreshed = await this.getRedComercialProspectDetail(id)
        prospect = refreshed.data ?? prospect
      }
    }
    return ok(prospect)
  }

  async deleteRedComercialArchivedProspect(id: string) {
    const { data, error } = await (this.client as SupabaseClient).rpc('delete_red_comercial_archived_prospect', { p_prospect_id: id })
    if (error) return failProspectRpc<{ id: string; deleted: boolean } | null>(null, error, 'red_comercial.prospects.delete')
    return ok((data ?? null) as { id: string; deleted: boolean } | null)
  }

  async createRedComercialProspectActivity(prospectId: string, values: RedComercialProspectActivityFormValues) {
    if (!values.title.trim()) return { data: null, error: 'Ingresa un titulo para la actividad.', errorKind: 'validation' as const }
    const { data, error } = await (this.client as SupabaseClient).rpc('create_red_comercial_prospect_activity', {
      p_prospect_id: prospectId,
      p_activity_type: values.activity_type,
      p_title: values.title.trim(),
      p_description: nullableText(values.description),
      p_activity_at: timestampOrNull(values.activity_at),
      p_next_followup_at: timestampOrNull(values.next_followup_at),
      p_status: values.status || null,
    })
    if (error) return failProspectRpc<RedComercialProspectDetailRecord | null>(null, error, 'red_comercial.prospects.activity')
    return ok((data ?? null) as RedComercialProspectDetailRecord | null)
  }

  async listRedComercialFollowups(filters: RedComercialFollowupFilters = {}) {
    const pageSize = filters.pageSize ?? 25
    const page = filters.page ?? 1
    const { data, error } = await (this.client as SupabaseClient).rpc('list_red_comercial_followups', {
      p_search: optionalText(filters.search),
      p_company_id: optionalText(filters.companyId),
      p_responsible_id: optionalText(filters.responsibleId),
      p_status: filters.status || null,
      p_channel: filters.channel || null,
      p_view: filters.view || 'all',
      p_mine: Boolean(filters.mine),
      p_limit: pageSize,
      p_offset: Math.max(0, page - 1) * pageSize,
    })
    if (error) return failProspectRpc<{ rows: RedComercialFollowupListItem[]; total: number }>({ rows: [], total: 0 }, error, 'red_comercial.followups.list')
    const rows = await this.enrichProspectLogo((data ?? []) as RedComercialFollowupListItem[])
    return ok({ rows, total: rows[0]?.total_count ?? 0 })
  }

  async getRedComercialFollowupMetrics(filters: Omit<RedComercialFollowupFilters, 'page' | 'pageSize' | 'view'> = {}) {
    const { data, error } = await (this.client as SupabaseClient).rpc('get_red_comercial_followup_metrics', {
      p_search: optionalText(filters.search),
      p_company_id: optionalText(filters.companyId),
      p_responsible_id: optionalText(filters.responsibleId),
      p_status: filters.status || null,
      p_channel: filters.channel || null,
      p_mine: Boolean(filters.mine),
    })
    const empty: RedComercialFollowupMetricsRecord = { today: 0, overdue: 0, upcoming: 0, no_followup: 0, no_movement: 0, total: 0 }
    if (error) return failProspectRpc<RedComercialFollowupMetricsRecord>(empty, error, 'red_comercial.followups.metrics')
    return ok(((data as RedComercialFollowupMetricsRecord[] | null)?.[0] ?? empty))
  }

  async listAdminNotifications(limit = 10) {
    const safeLimit = Math.min(Math.max(limit, 1), 20)
    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('admin_notifications')
      .select(adminNotificationColumns)
      .order('created_at', { ascending: false })
      .limit(safeLimit)

    if (error) return fail<AdminNotificationRecord[]>([], error, 'admin_notifications.list')
    return ok((data ?? []) as AdminNotificationRecord[])
  }

  async getUnreadAdminNotificationCount() {
    const client = this.client as SupabaseClient
    const { count, error } = await client
      .from('admin_notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)

    if (error) return fail<number>(0, error, 'admin_notifications.unread_count')
    return ok(count ?? 0)
  }

  async markAdminNotificationRead(id: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_id', admin.userId)
      .select(adminNotificationColumns)
      .single()

    if (error) return fail<AdminNotificationRecord | null>(null, error, 'admin_notifications.mark_read')
    return ok(data as AdminNotificationRecord)
  }

  async markAllAdminNotificationsRead() {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: 0, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', admin.userId)
      .is('read_at', null)
      .select('id')

    if (error) return fail<number>(0, error, 'admin_notifications.mark_all_read')
    return ok((data ?? []).length)
  }

  async getOrganizationSettings() {
    const { data, error } = await this.client
      .from('organization_settings')
      .select(organizationSettingsColumns)
      .eq('singleton_key', 'arista_partners')
      .maybeSingle()

    if (error) return fail<OrganizationSettingsRecord | null>(null, error, 'organization_settings.get')
    if (!data) return ok(null)
    return this.hydrateOrganizationSettings(data as OrganizationSettingsRecord)
  }

  async updateOrganizationSettings(input: OrganizationSettingsUpdateValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('organization_settings')
      .update({
        ...input,
        updated_by: admin.userId,
      })
      .eq('singleton_key', 'arista_partners')
      .select(organizationSettingsColumns)
      .single()

    if (error) return fail<OrganizationSettingsRecord | null>(null, error, 'organization_settings.update')
    return this.hydrateOrganizationSettings(data as OrganizationSettingsRecord)
  }

  async createOrganizationSettingsIfMissing(input: OrganizationSettingsCreateValues = {}) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const existing = await this.getOrganizationSettings()
    if (existing.error) return existing
    if (existing.data) return existing

    const { data, error } = await this.client
      .from('organization_settings')
      .insert({
        singleton_key: 'arista_partners',
        display_name: 'Arista Partners',
        country_code: 'CL',
        timezone: 'America/Santiago',
        locale: 'es-CL',
        default_currency: 'CLP',
        default_opportunity_priority: 'medium',
        default_follow_up_days: 0,
        default_attribution_days: 0,
        ...input,
        created_by: admin.userId,
        updated_by: admin.userId,
      })
      .select(organizationSettingsColumns)
      .single()

    if (error) return fail<OrganizationSettingsRecord | null>(null, error, 'organization_settings.create_missing')
    return this.hydrateOrganizationSettings(data as OrganizationSettingsRecord)
  }

  private async hydrateOrganizationSettings(settings: OrganizationSettingsRecord) {
    if (!settings.updated_by) return ok({ ...settings, updatedByProfile: null })

    const { data, error } = await this.client
      .from('admin_profiles')
      .select('id, full_name')
      .eq('id', settings.updated_by)
      .maybeSingle()

    if (error) {
      logSafeError('organization_settings.updated_by_profile', error)
      return ok({ ...settings, updatedByProfile: null })
    }

    return ok({
      ...settings,
      updatedByProfile: data as OrganizationSettingsRecord['updatedByProfile'],
    })
  }

  async getDashboardData() {
    const data: DashboardData = structuredClone(emptyDashboardData)
    const now = new Date().toISOString()

    const countQueries = [
      ['proposalsOpen', (this.client as SupabaseClient).from('commercial_proposals').select('id', { count: 'exact', head: true }).in('status', ['sent', 'viewed', 'negotiation'])],
      ['proposalsNegotiation', (this.client as SupabaseClient).from('commercial_proposals').select('id', { count: 'exact', head: true }).eq('status', 'negotiation')],
      ['proposalsAccepted', (this.client as SupabaseClient).from('commercial_proposals').select('id', { count: 'exact', head: true }).eq('status', 'accepted')],
      ['proposalsExpired', (this.client as SupabaseClient).from('commercial_proposals').select('id', { count: 'exact', head: true }).eq('status', 'expired')],
      ['prospectsTotal', (this.client as SupabaseClient).from('prospects').select('id', { count: 'exact', head: true })],
      ['prospectsUncontacted', (this.client as SupabaseClient).from('prospects').select('id', { count: 'exact', head: true }).is('last_contact_at', null).not('status', 'in', '(converted,archived,not_interested)')],
      ['prospectsConverted', (this.client as SupabaseClient).from('prospects').select('id', { count: 'exact', head: true }).eq('status', 'converted')],
      ['newOpportunities', this.client.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'new')],
      [
        'activeOpportunities',
        this.client.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ],
      ['negotiations', this.client.from('opportunities').select('id', { count: 'exact', head: true }).eq('status', 'negotiating')],
      ['pendingSuppliers', this.client.from('suppliers').select('id', { count: 'exact', head: true }).eq('status', 'pending')],
      ['newInquiries', this.client.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new')],
      ['newFormSubmissions', this.client.from('form_submissions').select('id', { count: 'exact', head: true }).eq('status', 'received')],
      [
        'prospectsDueToday',
        (this.client as SupabaseClient)
          .from('prospects')
          .select('id', { count: 'exact', head: true })
          .gte('next_action_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .lt('next_action_at', new Date(new Date().setHours(24, 0, 0, 0)).toISOString())
          .not('status', 'in', '(converted,archived,not_interested)'),
      ],
      [
        'overdueProspectFollowUps',
        (this.client as SupabaseClient)
          .from('prospects')
          .select('id', { count: 'exact', head: true })
          .lt('next_action_at', now)
          .not('status', 'in', '(converted,archived,not_interested)'),
      ],
      [
        'pendingFollowUpsToday',
        (this.client as SupabaseClient)
          .from('prospect_activities')
          .select('id', { count: 'exact', head: true })
          .gte('next_action_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString())
          .lt('next_action_at', new Date(new Date().setHours(24, 0, 0, 0)).toISOString())
          .is('completed_at', null),
      ],
    ] as const

    const results = await Promise.all(countQueries.map(([, query]) => query))
    results.forEach((result, index) => {
      const key = countQueries[index][0]
      if (result.error) {
        data.hasMetricErrors = true
        logSafeError(`dashboard.count.${key}`, result.error)
        data.metrics[key] = null
        return
      }
      data.metrics[key] = result.count ?? 0
    })

    const [pendingFollowUps, recent] = await Promise.all([
      this.listFollowUps(),
      this.client.from('opportunity_activities').select(dashboardActivityColumns).order('occurred_at', { ascending: false }).limit(5),
    ])

    if (pendingFollowUps.error) {
      data.activityError = true
      data.hasMetricErrors = true
      data.metrics.overdueFollowUps = null
    } else {
      data.metrics.overdueFollowUps = pendingFollowUps.data.filter(
        (activity) => activity.next_action_at && activity.next_action_at < now,
      ).length
      data.upcomingActions = pendingFollowUps.data
        .filter((activity) => activity.next_action_at && activity.next_action_at >= now)
        .slice(0, 5) as DashboardActivity[]
    }

    if (recent.error) {
      data.activityError = true
      logSafeError('dashboard.recent_activities', recent.error)
    } else {
      data.recentActivities = (recent.data ?? []) as DashboardActivity[]
    }

    const prospectActions = await (this.client as SupabaseClient)
      .from('prospects')
      .select(dashboardProspectActionColumns)
      .not('next_action_at', 'is', null)
      .not('status', 'in', '(converted,archived,not_interested)')
      .order('next_action_at', { ascending: true })
      .limit(5)

    if (prospectActions.error) {
      data.activityError = true
      logSafeError('dashboard.prospect_actions', prospectActions.error)
    } else {
      data.upcomingProspectActions = (prospectActions.data ?? []) as DashboardData['upcomingProspectActions']
    }

    const [recentProspects, recentOpportunities] = await Promise.all([
      (this.client as SupabaseClient).from('prospects').select(prospectColumns).order('created_at', { ascending: false }).limit(5),
      this.client.from('opportunities').select(opportunityColumns).order('created_at', { ascending: false }).limit(5),
    ])
    if (recentProspects.error) { data.activityError = true; logSafeError('dashboard.recent_prospects', recentProspects.error) }
    else data.recentProspects = (recentProspects.data ?? []) as ProspectRecord[]
    if (recentOpportunities.error) { data.activityError = true; logSafeError('dashboard.recent_opportunities', recentOpportunities.error) }
    else data.recentOpportunities = (recentOpportunities.data ?? []) as OpportunityRecord[]
    const recentProposals = await this.listCommercialProposals()
    if (recentProposals.error) { data.activityError = true; logSafeError('dashboard.recent_proposals', new Error(recentProposals.error)) }
    else data.recentProposals = recentProposals.data.slice(0, 5)

    return ok(data)
  }

  async listOpportunities() {
    const { data, error } = await this.client.from('opportunities').select(opportunityColumns).order('updated_at', { ascending: false })
    if (error) return fail<OpportunityRecord[]>([], error, 'opportunities.list')
    return ok((data ?? []) as OpportunityRecord[])
  }

  async listCommercialProposals() {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposals').select(commercialProposalColumns).order('updated_at', { ascending: false })
    if (error) return fail<CommercialProposalWithOpportunity[]>([], error, 'commercial_proposals.list')
    return this.hydrateCommercialProposals((data ?? []) as CommercialProposalRecord[], 'commercial_proposals.list')
  }

  async getCommercialProposalById(id: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposals').select(commercialProposalColumns).eq('id', id).maybeSingle()
    if (error) return fail<CommercialProposalWithOpportunity | null>(null, error, 'commercial_proposals.get')
    if (!data) return ok(null)
    const result = await this.hydrateCommercialProposals([data as CommercialProposalRecord], 'commercial_proposals.get')
    if (result.error) return { data: null, error: result.error, errorKind: result.errorKind }
    return ok(result.data[0] ?? null)
  }

  async createCommercialProposal(values: Omit<CommercialProposalInsert, 'created_by'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposals').insert({
      opportunity_id: values.opportunity_id,
      title: values.title,
      description: values.description ?? null,
      currency: values.currency ?? null,
      subtotal: values.subtotal,
      tax_percentage: values.tax_percentage,
      valid_until: values.valid_until ?? null,
      status: values.status ?? 'draft',
      sent_at: values.sent_at ?? null,
      viewed_at: values.viewed_at ?? null,
      accepted_at: values.accepted_at ?? null,
      rejected_at: values.rejected_at ?? null,
      internal_notes: values.internal_notes ?? null,
      client_notes: values.client_notes ?? null,
      created_by: admin.userId,
    }).select(commercialProposalColumns).single()
    if (error) return fail<CommercialProposalRecord | null>(null, error, 'commercial_proposals.create')
    return ok(data as CommercialProposalRecord)
  }

  async updateCommercialProposal(id: string, values: CommercialProposalUpdate) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const payload: Record<string, unknown> = {}
    const editable = ['opportunity_id', 'title', 'description', 'currency', 'subtotal', 'tax_percentage', 'valid_until', 'status', 'sent_at', 'viewed_at', 'accepted_at', 'rejected_at', 'internal_notes', 'client_notes', 'archived_at'] as const
      editable.forEach((field) => { if (field in values) payload[field] = values[field] })
      if ('archived_at' in values) payload.archived_by = values.archived_at ? admin.userId : null
      if (values.status === 'sent' && !('sent_at' in values)) payload.sent_at = new Date().toISOString()
    if (values.status === 'viewed' && !('viewed_at' in values)) payload.viewed_at = new Date().toISOString()
    if (values.status === 'accepted' && !('accepted_at' in values)) payload.accepted_at = new Date().toISOString()
    if (values.status === 'rejected' && !('rejected_at' in values)) payload.rejected_at = new Date().toISOString()
    if ('currency' in payload && typeof payload.currency === 'string') payload.currency = optionalText(payload.currency)?.toUpperCase() ?? null
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposals').update(payload).eq('id', id).select(commercialProposalColumns).single()
    if (error) return fail<CommercialProposalRecord | null>(null, error, 'commercial_proposals.update')
    return ok(data as CommercialProposalRecord)
  }

  async listCommercialProposalsForOpportunity(opportunityId: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposals').select(commercialProposalColumns).eq('opportunity_id', opportunityId).is('archived_at', null).order('updated_at', { ascending: false })
    if (error) return fail<CommercialProposalRecord[]>([], error, 'commercial_proposals.by_opportunity')
    return ok((data ?? []) as CommercialProposalRecord[])
  }

  async createCommercialProposalVersion(proposalId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client.rpc('create_commercial_proposal_version', { p_proposal_id: proposalId })
    if (error) return fail<CommercialProposalVersionRecord | null>(null, error, 'commercial_proposal_versions.create')
    return ok(data as CommercialProposalVersionRecord)
  }

  async listCommercialProposalVersions(proposalId: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_versions').select(commercialProposalVersionColumns).eq('proposal_id', proposalId).order('version_number', { ascending: false })
    if (error) return fail<CommercialProposalVersionRecord[]>([], error, 'commercial_proposal_versions.list')
    return ok((data ?? []) as CommercialProposalVersionRecord[])
  }

  async listCommercialProposalDocuments(proposalId: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_documents').select(commercialProposalDocumentColumns).eq('proposal_id', proposalId).order('generated_at', { ascending: false })
    if (error) return fail<CommercialProposalDocumentRecord[]>([], error, 'commercial_proposal_documents.list')
    return ok((data ?? []) as CommercialProposalDocumentRecord[])
  }

  async createCommercialProposalDocument(values: Omit<CommercialProposalDocumentInsert, 'generated_by'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_documents').insert({
      proposal_id: values.proposal_id,
      version_id: values.version_id,
      document_type: 'pdf',
      file_name: values.file_name,
      generated_by: admin.userId,
    }).select(commercialProposalDocumentColumns).single()
    if (error) return fail<CommercialProposalDocumentRecord | null>(null, error, 'commercial_proposal_documents.create')
    return ok(data as CommercialProposalDocumentRecord)
  }

  async listCommercialProposalPublicLinks(proposalId: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_public_links').select(commercialProposalPublicLinkColumns).eq('proposal_id', proposalId).order('created_at', { ascending: false })
    if (error) return fail<CommercialProposalPublicLinkRecord[]>([], error, 'commercial_proposal_public_links.list')
    return ok((data ?? []) as CommercialProposalPublicLinkRecord[])
  }

  async createCommercialProposalPublicLink(values: Omit<CommercialProposalPublicLinkInsert, 'token_hash'> & { token_hash: string }) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_public_links').insert({ proposal_id: values.proposal_id, version_id: values.version_id, token_hash: values.token_hash, expires_at: values.expires_at, created_by: admin.userId }).select(commercialProposalPublicLinkColumns).single()
    if (error) return fail<CommercialProposalPublicLinkRecord | null>(null, error, 'commercial_proposal_public_links.create')
    return ok(data as CommercialProposalPublicLinkRecord)
  }

  async revokeCommercialProposalPublicLink(id: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('commercial_proposal_public_links').update({ status: 'revoked', revoked_at: new Date().toISOString() }).eq('id', id).eq('status', 'active').select(commercialProposalPublicLinkColumns).single()
    if (error) return fail<CommercialProposalPublicLinkRecord | null>(null, error, 'commercial_proposal_public_links.revoke')
    return ok(data as CommercialProposalPublicLinkRecord)
  }

  private async hydrateCommercialProposals(proposals: CommercialProposalRecord[], context: string) {
    const opportunityIds = Array.from(new Set(proposals.map((proposal) => proposal.opportunity_id)))
    const client = this.client as SupabaseClient
    const { data: opportunities, error } = await client.from('opportunities').select('id, reference_code, title, opportunity_type, status, contact_id').in('id', opportunityIds)
    if (error) return fail<CommercialProposalWithOpportunity[]>([], error, `${context}.opportunities`)
    const opportunityMap = new Map((opportunities ?? []).map((item) => [item.id, item]))
    const contactIds = Array.from(new Set((opportunities ?? []).map((item) => item.contact_id).filter(Boolean) as string[]))
    const { data: contacts } = contactIds.length > 0 ? await client.from('contacts').select(contactSelectorColumns).in('id', contactIds) : { data: [] }
    const contactMap = new Map((contacts ?? []).map((item) => [item.id, item]))
    return ok(proposals.map((proposal) => ({ ...proposal, opportunity: opportunityMap.get(proposal.opportunity_id), contact: contactMap.get(opportunityMap.get(proposal.opportunity_id)?.contact_id ?? '') ?? null })).filter((item) => item.opportunity) as CommercialProposalWithOpportunity[])
  }

  async getOpportunityById(id: string) {
    const { data, error } = await this.client.from('opportunities').select(opportunityColumns).eq('id', id).maybeSingle()
    if (error) return fail<OpportunityRecord | null>(null, error, 'opportunities.get')
    return ok(data as OpportunityRecord | null)
  }

  async createOpportunity(values: Omit<OpportunityInsert, 'created_by' | 'reference_code'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error } = await this.client
        .from('opportunities')
        .insert({
          ...values,
          assigned_to: values.assigned_to ?? admin.userId,
          created_by: admin.userId,
          reference_code: generateReferenceCode(),
        })
        .select(opportunityColumns)
        .single()

      if (!error) return ok(data as OpportunityRecord)
      if (error.code !== '23505') return fail<OpportunityRecord | null>(null, error, 'opportunities.create')
      logSafeError('opportunities.reference_collision', error)
    }

    return {
      data: null,
      error: 'No fue posible generar un código único. Intenta guardar nuevamente.',
      errorKind: 'validation' as const,
    }
  }

  async updateOpportunity(id: string, values: Partial<Omit<OpportunityInsert, 'created_by' | 'reference_code'>>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client.from('opportunities').update(values).eq('id', id).select(opportunityColumns).single()
    if (error) return fail<OpportunityRecord | null>(null, error, 'opportunities.update')
    return ok(data as OpportunityRecord)
  }

  async listOpportunityActivities(opportunityId: string) {
    const { data, error } = await this.client
      .from('opportunity_activities')
      .select(opportunityActivityColumns)
      .eq('opportunity_id', opportunityId)
      .order('occurred_at', { ascending: false })

    if (error) return fail<OpportunityActivityRecord[]>([], error, 'opportunity_activities.list')
    return ok((data ?? []) as OpportunityActivityRecord[])
  }

  async createOpportunityActivity(values: Omit<OpportunityActivityInsert, 'created_by'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('opportunity_activities')
      .insert({ ...values, created_by: admin.userId })
      .select(opportunityActivityColumns)
      .single()

    if (error) return fail<OpportunityActivityRecord | null>(null, error, 'opportunity_activities.create')
    return ok(data as OpportunityActivityRecord)
  }

  async listProspects() {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('prospects').select(prospectColumns).order('updated_at', { ascending: false })
    if (error) return fail<ProspectRecord[]>([], error, 'prospects.list')
    return ok((data ?? []) as ProspectRecord[])
  }

  async getProspectById(id: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('prospects').select(prospectColumns).eq('id', id).maybeSingle()
    if (error) return fail<ProspectRecord | null>(null, error, 'prospects.get')
    return ok(data as ProspectRecord | null)
  }

  async createProspect(values: Omit<ProspectInsert, 'created_by' | 'assigned_to'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('prospects')
      .insert({ ...prospectEditablePayload(values), assigned_to: admin.userId, created_by: admin.userId })
      .select(prospectColumns)
      .single()

    if (error) return fail<ProspectRecord | null>(null, error, 'prospects.create')
    return ok(data as ProspectRecord)
  }

  async updateProspect(id: string, values: ProspectUpdate) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }
    if (values.status === 'converted') {
      return {
        data: null,
        error: 'La conversión debe realizarse desde la acción Convertir.',
        errorKind: 'validation' as const,
      }
    }

    const payload = prospectEditablePayload(values)
    const client = this.client as SupabaseClient
    const { data, error } = await client.from('prospects').update(payload).eq('id', id).select(prospectColumns).single()
    if (error) return fail<ProspectRecord | null>(null, error, 'prospects.update')
    return ok(data as ProspectRecord)
  }

  async listProspectActivities(prospectId: string) {
    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('prospect_activities')
      .select(prospectActivityColumns)
      .eq('prospect_id', prospectId)
      .order('occurred_at', { ascending: false })

    if (error) return fail<ProspectActivityRecord[]>([], error, 'prospect_activities.list')
    return ok((data ?? []) as ProspectActivityRecord[])
  }

  async createProspectActivity(values: {
    prospect_id: string
    activity_type: ProspectActivityRecord['activity_type']
    outcome?: ProspectActivityRecord['outcome']
    subject: string
    notes?: string | null
    occurred_at?: string | null
    next_action_type?: string | null
    next_action_at?: string | null
    status?: ProspectRecord['status'] | null
  }) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const rpcArgs: CreateProspectActivityAtomicArgs = {
      p_prospect_id: values.prospect_id,
      p_activity_type: values.activity_type,
      p_outcome: values.outcome ?? null,
      p_subject: optionalText(values.subject),
      p_notes: optionalText(values.notes),
      p_occurred_at: values.occurred_at ?? null,
      p_next_action_type: optionalText(values.next_action_type),
      p_next_action_at: values.next_action_at ?? null,
      p_status: values.status ?? null,
    }

    const { data, error } = await client.rpc('create_prospect_activity_atomic', rpcArgs)

    if (error) return failRpc<ProspectActivityRecord | null>(null, error, 'prospect_activities.create.rpc')
    const row = singleRpcRow<ProspectActivityRecord>(data as ProspectActivityRecord[] | null, 'prospect_activities.create.rpc_result')
    if (row.error) return { data: null, error: row.error, errorKind: row.errorKind }
    return ok(row.data)
  }

  async completeProspectFollowUp(activityId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('prospect_activities')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', activityId)
      .select(prospectActivityColumns)
      .single()

    if (error) return fail<ProspectActivityRecord | null>(null, error, 'prospect_followups.complete')
    return ok(data as ProspectActivityRecord)
  }

  async reopenProspectFollowUp(activityId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const client = this.client as SupabaseClient
    const { data, error } = await client
      .from('prospect_activities')
      .update({ completed_at: null })
      .eq('id', activityId)
      .select(prospectActivityColumns)
      .single()

    if (error) return fail<ProspectActivityRecord | null>(null, error, 'prospect_followups.reopen')
    return ok(data as ProspectActivityRecord)
  }

  async listProspectFollowUps() {
    const client = this.client as SupabaseClient
    const { data: activities, error } = await client
      .from('prospect_activities')
      .select(prospectActivityColumns)
      .not('next_action_at', 'is', null)
      .is('completed_at', null)
      .order('next_action_at', { ascending: true })
      .limit(1000)

    if (error) return fail<ProspectFollowUpRecord[]>([], error, 'prospect_followups.list.activities')
    return this.hydrateProspectFollowUps((activities ?? []) as ProspectActivityRecord[], 'prospect_followups.list')
  }

  async listCompletedProspectFollowUps() {
    const client = this.client as SupabaseClient
    const { data: activities, error } = await client
      .from('prospect_activities')
      .select(prospectActivityColumns)
      .not('next_action_at', 'is', null)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (error) return fail<ProspectFollowUpRecord[]>([], error, 'prospect_followups.completed.activities')
    return this.hydrateProspectFollowUps((activities ?? []) as ProspectActivityRecord[], 'prospect_followups.completed')
  }

  private async hydrateProspectFollowUps(activities: ProspectActivityRecord[], context: string) {
    const prospectIds = Array.from(new Set(activities.map((item) => item.prospect_id)))
    if (prospectIds.length === 0) return ok([] as ProspectFollowUpRecord[])

    const client = this.client as SupabaseClient
    const { data: prospects, error: prospectError } = await client
      .from('prospects')
      .select('id, full_name, company_name, status, priority, phone, email')
      .in('id', prospectIds)
      .not('status', 'in', '(converted,archived,not_interested)')

    if (prospectError) return fail<ProspectFollowUpRecord[]>([], prospectError, `${context}.prospects`)
    const prospectMap = new Map((prospects ?? []).map((item) => [item.id, item]))
    return ok(
      activities
        .map((activity) => {
          const prospect = prospectMap.get(activity.prospect_id)
          if (!prospect) return null
          return { ...activity, prospect, completedByProfile: null }
        })
        .filter(Boolean) as ProspectFollowUpRecord[],
    )
  }

  async findContactCandidatesForProspect(prospectId: string) {
    const prospect = await this.getProspectById(prospectId)
    if (prospect.error) return fail<ContactRecord[]>([], new Error(prospect.error), 'prospects.contact_candidates.prospect')
    if (!prospect.data) return { data: [], error: 'No se encontró el prospecto solicitado.', errorKind: 'not_found' as const }
    const contacts = await this.listContacts()
    if (contacts.error) return contacts
    const target = prospect.data
    return ok(
      contacts.data
        .map((contact) => ({
          contact,
          score:
            Number(Boolean(target.email && contact.email && target.email.toLowerCase() === contact.email.toLowerCase())) * 4 +
            Number(Boolean(target.phone && contact.phone && target.phone === contact.phone)) * 3 +
            Number(Boolean(target.company_name && contact.company_name && target.company_name.toLowerCase() === contact.company_name.toLowerCase())) * 2 +
            Number(Boolean(target.full_name && contact.full_name && target.full_name.toLowerCase() === contact.full_name.toLowerCase())),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((entry) => entry.contact),
    )
  }

  async convertProspectToOpportunity(id: string, values: ProspectConversionValues, strategy: ProspectContactStrategy): Promise<RepositoryResult<ProspectConversionResult>> {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: { prospect: null, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: admin.error, errorKind: admin.errorKind }

    const prospect = await this.getProspectById(id)
    if (prospect.error) return { data: { prospect: null, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: prospect.error, errorKind: prospect.errorKind }
    if (!prospect.data) return { data: { prospect: null, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró el prospecto solicitado.', errorKind: 'not_found' as const }

    const contactArgs: Partial<ConvertProspectToOpportunityArgs> = 'existing_contact_id' in strategy && strategy.existing_contact_id
      ? { p_existing_contact_id: strategy.existing_contact_id }
      : prospectContactRpcArgs(strategy.contact)

    const estimatedValue = values.estimated_value.trim() ? Number(values.estimated_value) : null
    const client = this.client as SupabaseClient
    const rpcArgs: ConvertProspectToOpportunityArgs = {
      p_prospect_id: id,
      p_opportunity_type: values.opportunity_type,
      p_title: values.title.trim(),
      p_description: optionalText(values.description),
      p_expected_date: values.expected_date || null,
      p_country: optionalText(prospect.data.country),
      p_region: null,
      p_city: optionalText(prospect.data.city_region),
      p_estimated_value: estimatedValue,
      p_currency: optionalUpperText(values.currency) ?? null,
      p_internal_notes: optionalText(values.internal_notes),
      ...contactArgs,
    }

    const { data, error } = await client.rpc('convert_prospect_to_opportunity', rpcArgs)

    if (error) return failRpc<ProspectConversionResult>({ prospect: prospect.data, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error, 'prospects.convert.rpc')
    const row = singleRpcRow<ConvertProspectToOpportunityRow>(data as ConvertProspectToOpportunityRow[] | null, 'prospects.convert.rpc_result')
    if (row.error || !row.data) return { data: { prospect: prospect.data, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: row.error, errorKind: row.errorKind }

    const [updatedProspect, contact, opportunity] = await Promise.all([
      this.getProspectById(row.data.prospect_id),
      this.getContactById(row.data.contact_id),
      this.getOpportunityById(row.data.opportunity_id),
    ])
    if (updatedProspect.error) return { data: { prospect: prospect.data, contact: contact.data, opportunity: opportunity.data, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: updatedProspect.error, errorKind: updatedProspect.errorKind }
    if (contact.error) return { data: { prospect: updatedProspect.data, contact: null, opportunity: opportunity.data, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: contact.error, errorKind: contact.errorKind }
    if (opportunity.error) return { data: { prospect: updatedProspect.data, contact: contact.data, opportunity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: opportunity.error, errorKind: opportunity.errorKind }

    return ok({ prospect: updatedProspect.data, contact: contact.data, opportunity: opportunity.data, alreadyConverted: row.data.already_converted, rpcResult: row.data })
  }

  async listContactsForSelector() {
    const { data, error } = await this.client.from('contacts').select(contactSelectorColumns).order('updated_at', { ascending: false })
    if (error) return fail<ContactSelectorRecord[]>([], error, 'contacts.selector')
    return ok((data ?? []) as ContactSelectorRecord[])
  }

  async listFollowUps() {
    const { data: activities, error } = await this.client
      .from('opportunity_activities')
      .select(opportunityActivityColumns)
      .not('next_action_at', 'is', null)
      .is('completed_at', null)
      .order('next_action_at', { ascending: true })
      .limit(1000)

    if (error) return fail<FollowUpRecord[]>([], error, 'followups.list.activities')

    return this.hydrateFollowUps((activities ?? []) as OpportunityActivityRecord[], 'followups.list')
  }

  async listCompletedFollowUps() {
    const { data: activities, error } = await this.client
      .from('opportunity_activities')
      .select(opportunityActivityColumns)
      .not('next_action_at', 'is', null)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50)

    if (error) return fail<FollowUpRecord[]>([], error, 'followups.completed.activities')

    return this.hydrateFollowUps((activities ?? []) as OpportunityActivityRecord[], 'followups.completed')
  }

  async completeFollowUp(activityId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('opportunity_activities')
      .update({
        completed_at: new Date().toISOString(),
        completed_by: admin.userId,
      })
      .eq('id', activityId)
      .select(opportunityActivityColumns)
      .single()

    if (error) return fail<OpportunityActivityRecord | null>(null, error, 'followups.complete')
    return ok(data as OpportunityActivityRecord)
  }

  async reopenFollowUp(activityId: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('opportunity_activities')
      .update({
        completed_at: null,
        completed_by: null,
      })
      .eq('id', activityId)
      .select(opportunityActivityColumns)
      .single()

    if (error) return fail<OpportunityActivityRecord | null>(null, error, 'followups.reopen')
    return ok(data as OpportunityActivityRecord)
  }

  private async hydrateFollowUps(activities: OpportunityActivityRecord[], context: string) {
    const opportunityIds = Array.from(new Set((activities ?? []).map((item) => item.opportunity_id)))
    if (opportunityIds.length === 0) return ok([])

    const { data: opportunities, error: opportunityError } = await this.client
      .from('opportunities')
      .select('id, reference_code, title, status, contact_id')
      .in('id', opportunityIds)
      .not('status', 'in', '(archived,rejected,won,lost)')

    if (opportunityError) return fail<FollowUpRecord[]>([], opportunityError, `${context}.opportunities`)

    const opportunityMap = new Map((opportunities ?? []).map((item) => [item.id, item]))
    const contactIds = Array.from(new Set((opportunities ?? []).map((item) => item.contact_id).filter(Boolean) as string[]))
    const contactMap = new Map<string, ContactSelectorRecord>()
    const profileIds = Array.from(new Set(activities.map((item) => item.completed_by).filter(Boolean) as string[]))
    const profileMap = new Map<string, Pick<AdminProfile, 'id' | 'full_name'>>()

    if (contactIds.length > 0) {
      const { data: contacts, error: contactError } = await this.client
        .from('contacts')
        .select(contactSelectorColumns)
        .in('id', contactIds)

      if (contactError) {
        logSafeError(`${context}.contacts`, contactError)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactSelectorRecord))
      }
    }

    if (profileIds.length > 0) {
      const { data: profiles, error: profileError } = await this.client
        .from('admin_profiles')
        .select('id, full_name')
        .in('id', profileIds)

      if (profileError) {
        logSafeError(`${context}.profiles`, profileError)
      } else {
        ;(profiles ?? []).forEach((profile) => profileMap.set(profile.id, profile as Pick<AdminProfile, 'id' | 'full_name'>))
      }
    }

    const records = (activities ?? [])
      .filter((activity) => activity.next_action_at)
      .map((activity) => {
        const opportunity = opportunityMap.get(activity.opportunity_id)
        if (!opportunity) return null
        return {
          ...(activity as OpportunityActivityRecord),
          opportunity,
          contact: opportunity.contact_id ? contactMap.get(opportunity.contact_id) ?? null : null,
          completedByProfile: activity.completed_by ? profileMap.get(activity.completed_by) ?? null : null,
        }
      })
      .filter(Boolean) as FollowUpRecord[]

    return ok(records)
  }

  async listSuppliers() {
    const { data, error } = await this.client.from('suppliers').select(supplierColumns).order('updated_at', { ascending: false })
    if (error) return fail<SupplierWithContact[]>([], error, 'suppliers.list')
    return this.hydrateSuppliers((data ?? []) as SupplierRecord[], 'suppliers.list')
  }

  async getSupplierById(id: string) {
    const { data, error } = await this.client.from('suppliers').select(supplierColumns).eq('id', id).maybeSingle()
    if (error) return fail<SupplierWithContact | null>(null, error, 'suppliers.get')
    if (!data) return ok(null)
    const hydrated = await this.hydrateSuppliers([data as SupplierRecord], 'suppliers.get')
    if (hydrated.error) return fail<SupplierWithContact | null>(null, new Error(hydrated.error), 'suppliers.get.hydrate')
    return ok(hydrated.data[0] ?? null)
  }

  async createSupplier(values: Omit<SupplierRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('suppliers')
      .insert({ ...values, created_by: admin.userId })
      .select(supplierColumns)
      .single()

    if (error) return fail<SupplierRecord | null>(null, error, 'suppliers.create')
    return ok(data as SupplierRecord)
  }

  async updateSupplier(id: string, values: Partial<Omit<SupplierRecord, 'id' | 'created_at' | 'created_by'>>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client.from('suppliers').update(values).eq('id', id).select(supplierColumns).single()
    if (error) return fail<SupplierRecord | null>(null, error, 'suppliers.update')
    return ok(data as SupplierRecord)
  }

  async listSupplierOpportunities(supplierId: string) {
    const { data, error } = await this.client
      .from('opportunity_suppliers')
      .select(opportunitySupplierColumns)
      .eq('supplier_id', supplierId)
      .order('updated_at', { ascending: false })

    if (error) return fail<SupplierOpportunityRecord[]>([], error, 'supplier_opportunities.list.relations')
    return this.hydrateSupplierOpportunities((data ?? []) as OpportunitySupplierRecord[], 'supplier_opportunities.list')
  }

  async listAvailableBuyOpportunities(supplierId: string) {
    const existing = await this.listSupplierOpportunities(supplierId)
    if (existing.error) return fail<OpportunityRecord[]>([], new Error(existing.error), 'supplier_opportunities.available.existing')
    const excludedIds = existing.data.map((item) => item.opportunity_id)
    let query = this.client
      .from('opportunities')
      .select(opportunityColumns)
      .eq('opportunity_type', 'buy')
      .not('status', 'in', '(archived,rejected,won,lost)')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`)
    const { data, error } = await query
    if (error) return fail<OpportunityRecord[]>([], error, 'supplier_opportunities.available')
    return ok((data ?? []) as OpportunityRecord[])
  }

  async linkSupplierToOpportunity(values: Omit<OpportunitySupplierInsert, 'status'> & { status?: OpportunitySupplierInsert['status'] }) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const opportunity = await this.getOpportunityById(values.opportunity_id)
    if (opportunity.error) return { data: null, error: opportunity.error, errorKind: opportunity.errorKind }
    if (!opportunity.data || opportunity.data.opportunity_type !== 'buy') {
      return { data: null, error: 'Solo se pueden asociar proveedores a oportunidades de compra.', errorKind: 'validation' as const }
    }

    const { data, error } = await this.client
      .from('opportunity_suppliers')
      .insert({ ...values, status: values.status ?? 'identified' })
      .select(opportunitySupplierColumns)
      .single()

    if (error) return fail<OpportunitySupplierRecord | null>(null, error, 'opportunity_suppliers.link')
    return ok(data as OpportunitySupplierRecord)
  }

  async updateOpportunitySupplier(id: string, values: OpportunitySupplierFormValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const proposedAmount = values.proposed_amount.trim() ? Number(values.proposed_amount) : null
    const { data, error } = await this.client
      .from('opportunity_suppliers')
      .update({
        status: values.status,
        proposed_amount: proposedAmount,
        currency: proposedAmount === null ? null : values.currency.trim() || null,
        notes: values.notes.trim() || null,
      })
      .eq('id', id)
      .select(opportunitySupplierColumns)
      .single()

    if (error) return fail<OpportunitySupplierRecord | null>(null, error, 'opportunity_suppliers.update')
    return ok(data as OpportunitySupplierRecord)
  }

  async listOpportunitySuppliers(opportunityId: string) {
    const { data, error } = await this.client
      .from('opportunity_suppliers')
      .select(opportunitySupplierColumns)
      .eq('opportunity_id', opportunityId)
      .order('updated_at', { ascending: false })

    if (error) return fail<OpportunitySupplierWithSupplier[]>([], error, 'opportunity_suppliers.list')
    return this.hydrateOpportunitySuppliers((data ?? []) as OpportunitySupplierRecord[], 'opportunity_suppliers.list')
  }

  async listAvailableSuppliersForOpportunity(opportunityId: string) {
    const existing = await this.listOpportunitySuppliers(opportunityId)
    if (existing.error) return fail<SupplierWithContact[]>([], new Error(existing.error), 'opportunity_suppliers.available.existing')
    const excludedIds = existing.data.map((item) => item.supplier_id)
    let query = this.client
      .from('suppliers')
      .select(supplierColumns)
      .not('status', 'in', '(archived,rejected)')
      .order('updated_at', { ascending: false })
      .limit(200)
    if (excludedIds.length > 0) query = query.not('id', 'in', `(${excludedIds.join(',')})`)
    const { data, error } = await query
    if (error) return fail<SupplierWithContact[]>([], error, 'opportunity_suppliers.available')
    return this.hydrateSuppliers((data ?? []) as SupplierRecord[], 'opportunity_suppliers.available')
  }

  private async hydrateSuppliers(suppliers: SupplierRecord[], context: string) {
    const contactIds = Array.from(new Set(suppliers.map((supplier) => supplier.contact_id).filter(Boolean) as string[]))
    const supplierIds = suppliers.map((supplier) => supplier.id)
    const contactMap = new Map<string, ContactRecord>()
    const countMap = new Map<string, number>()

    if (contactIds.length > 0) {
      const { data: contacts, error } = await this.client.from('contacts').select(contactColumns).in('id', contactIds)
      if (error) {
        logSafeError(`${context}.contacts`, error)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactRecord))
      }
    }

    if (supplierIds.length > 0) {
      const { data: relations, error } = await this.client.from('opportunity_suppliers').select('supplier_id').in('supplier_id', supplierIds)
      if (error) {
        logSafeError(`${context}.opportunity_counts`, error)
      } else {
        ;(relations ?? []).forEach((relation) => countMap.set(relation.supplier_id, (countMap.get(relation.supplier_id) ?? 0) + 1))
      }
    }

    return ok(
      suppliers.map((supplier) => ({
        ...supplier,
        contact: supplier.contact_id ? contactMap.get(supplier.contact_id) ?? null : null,
        opportunityCount: countMap.get(supplier.id) ?? 0,
      })),
    )
  }

  private async hydrateSupplierOpportunities(relations: OpportunitySupplierRecord[], context: string) {
    const opportunityIds = Array.from(new Set(relations.map((relation) => relation.opportunity_id)))
    if (opportunityIds.length === 0) return ok([])

    const { data: opportunities, error } = await this.client.from('opportunities').select(opportunityColumns).in('id', opportunityIds)
    if (error) return fail<SupplierOpportunityRecord[]>([], error, `${context}.opportunities`)

    const opportunityMap = new Map((opportunities ?? []).map((opportunity) => [opportunity.id, opportunity as OpportunityRecord]))
    const contactIds = Array.from(new Set((opportunities ?? []).map((opportunity) => opportunity.contact_id).filter(Boolean) as string[]))
    const contactMap = new Map<string, ContactSelectorRecord>()

    if (contactIds.length > 0) {
      const { data: contacts, error: contactError } = await this.client.from('contacts').select(contactSelectorColumns).in('id', contactIds)
      if (contactError) {
        logSafeError(`${context}.contacts`, contactError)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactSelectorRecord))
      }
    }

    return ok(
      relations
        .map((relation) => {
          const opportunity = opportunityMap.get(relation.opportunity_id)
          if (!opportunity) return null
          return {
            ...relation,
            opportunity,
            contact: opportunity.contact_id ? contactMap.get(opportunity.contact_id) ?? null : null,
          }
        })
        .filter(Boolean) as SupplierOpportunityRecord[],
    )
  }

  private async hydrateOpportunitySuppliers(relations: OpportunitySupplierRecord[], context: string) {
    const supplierIds = Array.from(new Set(relations.map((relation) => relation.supplier_id)))
    if (supplierIds.length === 0) return ok([])

    const { data: suppliers, error } = await this.client.from('suppliers').select(supplierColumns).in('id', supplierIds)
    if (error) return fail<OpportunitySupplierWithSupplier[]>([], error, `${context}.suppliers`)

    const supplierMap = new Map((suppliers ?? []).map((supplier) => [supplier.id, supplier as SupplierRecord]))
    const contactIds = Array.from(new Set((suppliers ?? []).map((supplier) => supplier.contact_id).filter(Boolean) as string[]))
    const contactMap = new Map<string, ContactSelectorRecord>()

    if (contactIds.length > 0) {
      const { data: contacts, error: contactError } = await this.client.from('contacts').select(contactSelectorColumns).in('id', contactIds)
      if (contactError) {
        logSafeError(`${context}.contacts`, contactError)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactSelectorRecord))
      }
    }

    return ok(
      relations
        .map((relation) => {
          const supplier = supplierMap.get(relation.supplier_id)
          if (!supplier) return null
          return {
            ...relation,
            supplier,
            contact: supplier.contact_id ? contactMap.get(supplier.contact_id) ?? null : null,
          }
        })
        .filter(Boolean) as OpportunitySupplierWithSupplier[],
    )
  }

  async listContacts() {
    const { data, error } = await this.client.from('contacts').select(contactColumns).order('updated_at', { ascending: false })
    if (error) return fail<ContactRecord[]>([], error, 'contacts.list')
    return ok((data ?? []) as ContactRecord[])
  }

  async getContactById(id: string) {
    const { data, error } = await this.client.from('contacts').select(contactColumns).eq('id', id).maybeSingle()
    if (error) return fail<ContactRecord | null>(null, error, 'contacts.get')
    return ok(data as ContactRecord | null)
  }

  private async ensureActiveOwner() {
    const { data, error } = await this.client.auth.getUser()
    if (error || !data.user) {
      logSafeError('auth.get_user', error)
      return { userId: null, error: messageFor('auth'), errorKind: 'auth' as const }
    }

    const profile = await this.getCurrentAdminProfile(data.user.id)
    if (profile.error || !profile.data) {
      return { userId: null, error: messageFor('authorization'), errorKind: 'authorization' as const }
    }

    return { userId: data.user.id, error: null }
  }

  async createContact(values: Omit<ContactInsert, 'created_by'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('contacts')
      .insert({ ...values, created_by: admin.userId })
      .select(contactColumns)
      .single()

    if (error) return fail<ContactRecord | null>(null, error, 'contacts.create')
    return ok(data as ContactRecord)
  }

  async updateContact(id: string, values: Partial<Omit<ContactInsert, 'created_by'>>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client.from('contacts').update(values).eq('id', id).select(contactColumns).single()
    if (error) return fail<ContactRecord | null>(null, error, 'contacts.update')
    return ok(data as ContactRecord)
  }

  async listInquiries() {
    const { data, error } = await this.client.from('inquiries').select(inquiryColumns).order('updated_at', { ascending: false })
    if (error) return fail<InquiryWithContact[]>([], error, 'inquiries.list')
    return this.hydrateInquiries((data ?? []) as InquiryRecord[], 'inquiries.list')
  }

  async getInquiryById(id: string) {
    const { data, error } = await this.client.from('inquiries').select(inquiryColumns).eq('id', id).maybeSingle()
    if (error) return fail<InquiryWithContact | null>(null, error, 'inquiries.get')
    if (!data) return ok(null)
    const hydrated = await this.hydrateInquiries([data as InquiryRecord], 'inquiries.get')
    if (hydrated.error) return fail<InquiryWithContact | null>(null, new Error(hydrated.error), 'inquiries.get.hydrate')
    return ok(hydrated.data[0] ?? null)
  }

  async createInquiry(values: Omit<InquiryInsert, 'assigned_to' | 'converted_opportunity_id'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('inquiries')
      .insert({ ...values, assigned_to: admin.userId, converted_opportunity_id: null })
      .select(inquiryColumns)
      .single()

    if (error) return fail<InquiryRecord | null>(null, error, 'inquiries.create')
    return ok(data as InquiryRecord)
  }

  async updateInquiry(id: string, values: Partial<Omit<InquiryInsert, 'assigned_to' | 'converted_opportunity_id'>>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    if (values.status && values.status !== 'converted') {
      const current = await this.getInquiryById(id)
      if (current.error) return { data: null, error: current.error, errorKind: current.errorKind }
      if (current.data?.converted_opportunity_id) {
        return {
          data: null,
          error: 'La consulta convertida conserva trazabilidad con una oportunidad y no puede cambiarse a otro estado desde esta acción.',
          errorKind: 'validation' as const,
        }
      }
    }

    if (values.status === 'converted') {
      return {
        data: null,
        error: 'La conversión debe realizarse desde la acción Convertir en oportunidad.',
        errorKind: 'validation' as const,
      }
    }

    const { data, error } = await this.client.from('inquiries').update(values).eq('id', id).select(inquiryColumns).single()
    if (error) return fail<InquiryRecord | null>(null, error, 'inquiries.update')
    return ok(data as InquiryRecord)
  }

  async convertInquiryToOpportunity(id: string, values: InquiryConversionValues): Promise<RepositoryResult<InquiryConversionResult>> {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: admin.error, errorKind: admin.errorKind }

    const inquiry = await this.getInquiryById(id)
    if (inquiry.error) return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: inquiry.error, errorKind: inquiry.errorKind }
    if (!inquiry.data) {
      return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró la consulta solicitada.', errorKind: 'not_found' as const }
    }

    const args: ConvertInquiryToOpportunityAtomicArgs = {
      p_inquiry_id: id,
      p_opportunity_type: values.opportunity_type,
      p_title: values.title.trim(),
      p_description: optionalText(values.description),
      p_country: optionalText(inquiry.data.contact?.country),
      p_region: optionalText(inquiry.data.contact?.region),
      p_city: optionalText(inquiry.data.contact?.city),
      p_internal_notes: optionalText(values.internal_notes),
    }

    const { data, error } = await this.client.rpc('convert_inquiry_to_opportunity_atomic', args)
    if (error) return failRpc<InquiryConversionResult>({ inquiry: inquiry.data, opportunity: null, alreadyConverted: false, rpcResult: null }, error, 'inquiries.convert.rpc')

    const row = singleRpcRow<ConvertInquiryToOpportunityAtomicRow>(data, 'inquiries.convert.rpc_result')
    if (row.error || !row.data) return { data: { inquiry: inquiry.data, opportunity: null, alreadyConverted: false, rpcResult: null }, error: row.error, errorKind: row.errorKind }

    const [updatedInquiry, convertedOpportunity] = await Promise.all([this.getInquiryById(row.data.inquiry_id), this.getOpportunityById(row.data.opportunity_id)])
    if (updatedInquiry.error) return { data: { inquiry: inquiry.data, opportunity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: updatedInquiry.error, errorKind: updatedInquiry.errorKind }
    if (convertedOpportunity.error || !convertedOpportunity.data) return { data: { inquiry: updatedInquiry.data, opportunity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: convertedOpportunity.error ?? 'No fue posible cargar la oportunidad convertida.', errorKind: convertedOpportunity.errorKind ?? 'unknown' }

    return ok({ inquiry: updatedInquiry.data, opportunity: convertedOpportunity.data, alreadyConverted: row.data.already_converted, rpcResult: row.data } satisfies InquiryConversionResult)

  }

  async repairInquiryConversionLink(inquiryId: string, opportunityId: string): Promise<RepositoryResult<InquiryConversionResult>> {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: admin.error, errorKind: admin.errorKind }

    const [inquiry, opportunity] = await Promise.all([this.getInquiryById(inquiryId), this.getOpportunityById(opportunityId)])
    if (inquiry.error) return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: inquiry.error, errorKind: inquiry.errorKind }
    if (opportunity.error) return { data: { inquiry: inquiry.data, opportunity: null, alreadyConverted: false, rpcResult: null }, error: opportunity.error, errorKind: opportunity.errorKind }
    if (!inquiry.data || !opportunity.data) {
      return { data: { inquiry: inquiry.data, opportunity: opportunity.data, alreadyConverted: false, rpcResult: null }, error: 'No se encontró el registro solicitado.', errorKind: 'not_found' as const }
    }
    if (inquiry.data.converted_opportunity_id) {
      return { data: { inquiry: inquiry.data, opportunity: opportunity.data, alreadyConverted: true, rpcResult: null }, error: 'Esta consulta ya fue convertida.', errorKind: 'validation' as const }
    }
    if (inquiry.data.status === 'archived') {
      return { data: { inquiry: inquiry.data, opportunity: opportunity.data, alreadyConverted: false, rpcResult: null }, error: 'La consulta archivada no puede repararse sin revisión administrativa.', errorKind: 'validation' as const }
    }

    const { data, error } = await this.client
      .from('inquiries')
      .update({ status: 'converted', converted_opportunity_id: opportunityId })
      .eq('id', inquiryId)
      .is('converted_opportunity_id', null)
      .neq('status', 'archived')
      .select(inquiryColumns)
      .single()

    if (error) return fail<InquiryConversionResult>({ inquiry: inquiry.data, opportunity: opportunity.data, alreadyConverted: false, rpcResult: null }, error, 'inquiries.conversion_repair')
    return ok({ inquiry: data as InquiryRecord, opportunity: opportunity.data, alreadyConverted: false, rpcResult: null })
  }

  async listContactsForInquirySelector() {
    return this.listContactsForSelector()
  }

  private async hydrateInquiries(inquiries: InquiryRecord[], context: string) {
    const contactIds = Array.from(new Set(inquiries.map((inquiry) => inquiry.contact_id).filter(Boolean) as string[]))
    const opportunityIds = Array.from(new Set(inquiries.map((inquiry) => inquiry.converted_opportunity_id).filter(Boolean) as string[]))
    const contactMap = new Map<string, ContactRecord>()
    const opportunityMap = new Map<string, Pick<OpportunityRecord, 'id' | 'reference_code' | 'title' | 'status' | 'opportunity_type'>>()
    if (contactIds.length > 0) {
      const { data: contacts, error } = await this.client.from('contacts').select(contactColumns).in('id', contactIds)
      if (error) {
        logSafeError(`${context}.contacts`, error)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactRecord))
      }
    }

    if (opportunityIds.length > 0) {
      const { data: opportunities, error } = await this.client.from('opportunities').select(linkedOpportunityColumns).in('id', opportunityIds)
      if (error) {
        logSafeError(`${context}.linked_opportunities`, error)
      } else {
        ;(opportunities ?? []).forEach((opportunity) => opportunityMap.set(opportunity.id, opportunity as Pick<OpportunityRecord, 'id' | 'reference_code' | 'title' | 'status' | 'opportunity_type'>))
      }
    }

    return ok(
      inquiries.map((inquiry) => ({
        ...inquiry,
        contact: inquiry.contact_id ? contactMap.get(inquiry.contact_id) ?? null : null,
        linkedOpportunity: inquiry.converted_opportunity_id ? opportunityMap.get(inquiry.converted_opportunity_id) ?? null : null,
      })),
    )
  }

  async listAgreements() {
    const { data, error } = await this.client
      .from('commercial_agreements')
      .select(commercialAgreementColumns)
      .order('updated_at', { ascending: false })
    if (error) return fail<CommercialAgreementRecord[]>([], error, 'agreements.list')
    return ok((data ?? []) as CommercialAgreementRecord[])
  }

  async listCommercialAgreements() {
    const { data, error } = await this.client
      .from('commercial_agreements')
      .select(commercialAgreementColumns)
      .order('updated_at', { ascending: false })
    if (error) return fail<CommercialAgreementWithOpportunity[]>([], error, 'commercial_agreements.list')
    return this.hydrateCommercialAgreements((data ?? []) as CommercialAgreementRecord[], 'commercial_agreements.list')
  }

  async getCommercialAgreementById(id: string) {
    const { data, error } = await this.client
      .from('commercial_agreements')
      .select(commercialAgreementColumns)
      .eq('id', id)
      .maybeSingle()
    if (error) return fail<CommercialAgreementWithOpportunity | null>(null, error, 'commercial_agreements.get')
    if (!data) return ok(null)
    const hydrated = await this.hydrateCommercialAgreements([data as CommercialAgreementRecord], 'commercial_agreements.get')
    if (hydrated.error) return fail<CommercialAgreementWithOpportunity | null>(null, new Error(hydrated.error), 'commercial_agreements.get.hydrate')
    return ok(hydrated.data[0] ?? null)
  }

  async createCommercialAgreement(values: CommercialAgreementCreateValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('commercial_agreements')
      .insert({ ...values, created_by: admin.userId })
      .select(commercialAgreementColumns)
      .single()

    if (error) return fail<CommercialAgreementRecord | null>(null, error, 'commercial_agreements.create')
    return ok(data as CommercialAgreementRecord)
  }

  async updateCommercialAgreement(id: string, values: CommercialAgreementUpdateValues) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('commercial_agreements')
      .update(values)
      .eq('id', id)
      .select(commercialAgreementColumns)
      .single()

    if (error) return fail<CommercialAgreementRecord | null>(null, error, 'commercial_agreements.update')
    return ok(data as CommercialAgreementRecord)
  }

  async archiveCommercialAgreement(id: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('commercial_agreements')
      .update({ archived_at: new Date().toISOString(), archived_by: admin.userId })
      .eq('id', id)
      .select(commercialAgreementColumns)
      .single()

    if (error) return fail<CommercialAgreementRecord | null>(null, error, 'commercial_agreements.archive')
    return ok(data as CommercialAgreementRecord)
  }

  async restoreCommercialAgreement(id: string) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('commercial_agreements')
      .update({ archived_at: null, archived_by: null })
      .eq('id', id)
      .select(commercialAgreementColumns)
      .single()

    if (error) return fail<CommercialAgreementRecord | null>(null, error, 'commercial_agreements.restore')
    return ok(data as CommercialAgreementRecord)
  }

  async listOpportunitiesForAgreementSelector() {
    const { data, error } = await this.client
      .from('opportunities')
      .select(opportunityColumns)
      .not('status', 'eq', 'archived')
      .order('updated_at', { ascending: false })
      .limit(300)
    if (error) return fail<OpportunityRecord[]>([], error, 'commercial_agreements.opportunities')
    return ok((data ?? []) as OpportunityRecord[])
  }

  async listContactsForAgreementSelector() {
    return this.listContactsForSelector()
  }

  async listSuppliersForAgreementSelector() {
    const { data, error } = await this.client
      .from('suppliers')
      .select(supplierColumns)
      .not('status', 'in', '(archived,rejected)')
      .order('updated_at', { ascending: false })
      .limit(300)
    if (error) return fail<SupplierWithContact[]>([], error, 'commercial_agreements.suppliers')
    return this.hydrateSuppliers((data ?? []) as SupplierRecord[], 'commercial_agreements.suppliers')
  }

  async listAgreementsForOpportunity(opportunityId: string) {
    let query = this.client
      .from('commercial_agreements')
      .select(commercialAgreementColumns)
      .order('updated_at', { ascending: false })
    if (opportunityId) query = query.eq('opportunity_id', opportunityId)
    const { data, error } = await query
    if (error) return fail<CommercialAgreementWithOpportunity[]>([], error, 'commercial_agreements.by_opportunity')
    return this.hydrateCommercialAgreements((data ?? []) as CommercialAgreementRecord[], 'commercial_agreements.by_opportunity')
  }

  private async hydrateCommercialAgreements(agreements: CommercialAgreementRecord[], context: string) {
    const opportunityIds = Array.from(new Set(agreements.map((agreement) => agreement.opportunity_id)))
    const contactIds = Array.from(new Set(agreements.map((agreement) => agreement.contact_id).filter(Boolean) as string[]))
    const supplierIds = Array.from(new Set(agreements.map((agreement) => agreement.supplier_id).filter(Boolean) as string[]))
    const archivedByIds = Array.from(new Set(agreements.map((agreement) => agreement.archived_by).filter(Boolean) as string[]))
    const opportunityMap = new Map<string, OpportunityRecord>()
    const contactMap = new Map<string, ContactSelectorRecord>()
    const supplierMap = new Map<string, SupplierWithContact>()
    const profileMap = new Map<string, Pick<AdminProfile, 'id' | 'full_name'>>()

    if (opportunityIds.length > 0) {
      const { data: opportunities, error } = await this.client.from('opportunities').select(opportunityColumns).in('id', opportunityIds)
      if (error) return fail<CommercialAgreementWithOpportunity[]>([], error, `${context}.opportunities`)
      ;(opportunities ?? []).forEach((opportunity) => opportunityMap.set(opportunity.id, opportunity as OpportunityRecord))
    }

    if (contactIds.length > 0) {
      const { data: contacts, error: contactError } = await this.client.from('contacts').select(contactSelectorColumns).in('id', contactIds)
      if (contactError) {
        logSafeError(`${context}.contacts`, contactError)
      } else {
        ;(contacts ?? []).forEach((contact) => contactMap.set(contact.id, contact as ContactSelectorRecord))
      }
    }

    if (supplierIds.length > 0) {
      const { data: suppliers, error: supplierError } = await this.client.from('suppliers').select(supplierColumns).in('id', supplierIds)
      if (supplierError) {
        logSafeError(`${context}.suppliers`, supplierError)
      } else {
        const hydratedSuppliers = await this.hydrateSuppliers((suppliers ?? []) as SupplierRecord[], `${context}.suppliers`)
        if (!hydratedSuppliers.error) hydratedSuppliers.data.forEach((supplier) => supplierMap.set(supplier.id, supplier))
      }
    }

    if (archivedByIds.length > 0) {
      const { data: profiles, error: profileError } = await this.client.from('admin_profiles').select('id, full_name').in('id', archivedByIds)
      if (profileError) {
        logSafeError(`${context}.profiles`, profileError)
      } else {
        ;(profiles ?? []).forEach((profile) => profileMap.set(profile.id, profile as Pick<AdminProfile, 'id' | 'full_name'>))
      }
    }

    return ok(
      agreements.map((agreement) => {
        const opportunity = opportunityMap.get(agreement.opportunity_id) ?? null
        return {
          ...agreement,
          opportunity,
          contact: agreement.contact_id ? contactMap.get(agreement.contact_id) ?? null : null,
          supplier: agreement.supplier_id ? supplierMap.get(agreement.supplier_id) ?? null : null,
          archivedByProfile: agreement.archived_by ? profileMap.get(agreement.archived_by) ?? null : null,
        }
      }),
    )
  }

  async listFormSubmissions() {
    const { data, error } = await this.client.from('form_submissions').select(formSubmissionColumns).order('submitted_at', { ascending: false })
    if (error) return fail<FormSubmissionListItem[]>([], error, 'form_submissions.list')
    return ok((data ?? []) as FormSubmissionListItem[])
  }

  async getFormSubmissionById(id: string) {
    const { data, error } = await this.client.from('form_submissions').select(formSubmissionColumns).eq('id', id).maybeSingle()
    if (error) return fail<FormSubmissionRecord | null>(null, error, 'form_submissions.get')
    return ok(data as FormSubmissionRecord | null)
  }

  async updateFormSubmission(id: string, values: Pick<FormSubmissionRecord, 'status'>) {
    const admin = await this.ensureActiveOwner()
    if (!admin.userId) return { data: null, error: admin.error, errorKind: admin.errorKind }

    const { data, error } = await this.client
      .from('form_submissions')
      .update({ status: values.status, reviewed_at: new Date().toISOString(), reviewed_by: admin.userId })
      .eq('id', id)
      .select(formSubmissionColumns)
      .single()

    if (error) return fail<FormSubmissionRecord | null>(null, error, 'form_submissions.update')
    return ok(data as FormSubmissionRecord)
  }

  async findContactCandidatesForSubmission(submissionId: string) {
    const submission = await this.getFormSubmissionById(submissionId)
    if (submission.error) return fail<ContactRecord[]>([], new Error(submission.error), 'form_submissions.contact_candidates.submission')
    if (!submission.data) return { data: [], error: 'No se encontró la recepción solicitada.', errorKind: 'not_found' as const }
    const contacts = await this.listContacts()
    if (contacts.error) return contacts
    return ok(
      contacts.data
        .map((contact) => ({ contact, score: contactCandidateScore(contact, submission.data!) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((entry) => entry.contact),
    )
  }

  async convertContactSubmission(submissionId: string, strategy: SubmissionContactStrategy) {
    const submission = await this.getFormSubmissionById(submissionId)
    if (submission.error) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: submission.error, errorKind: submission.errorKind }
    if (!submission.data) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró la recepción solicitada.', errorKind: 'not_found' as const }
    const draft = buildInquiryDraft(submission.data, '')
    const args: ConvertContactSubmissionAtomicArgs = {
      p_submission_id: submissionId,
      ...contactRpcArgs(strategy),
      p_reason: optionalText(draft.reason),
      p_subject: optionalText(draft.subject),
      p_message: optionalText(draft.message),
      p_preferred_contact_method: optionalText(draft.preferred_contact_method),
      p_internal_notes: optionalText(draft.internal_notes),
    }
    const { data, error } = await this.client.rpc('convert_contact_submission_atomic', args)
    return this.finishAtomicSubmissionConversion(data, error, 'form_submissions.convert_contact.rpc')
  }

  async convertBuySubmission(submissionId: string, strategy: SubmissionContactStrategy) {
    const submission = await this.getFormSubmissionById(submissionId)
    if (submission.error) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: submission.error, errorKind: submission.errorKind }
    if (!submission.data) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró la recepción solicitada.', errorKind: 'not_found' as const }
    const draft = buildBuyOpportunityDraft(submission.data, '')
    const args: ConvertBuySubmissionAtomicArgs = {
      p_submission_id: submissionId,
      ...contactRpcArgs(strategy),
      p_title: optionalText(draft.title),
      p_description: optionalText(draft.description),
      p_expected_date: draft.expected_date ?? undefined,
      p_country: optionalText(draft.country),
      p_region: optionalText(draft.region),
      p_city: optionalText(draft.city),
      p_estimated_value: draft.estimated_value ?? undefined,
      p_currency: optionalUpperText(draft.currency),
      p_internal_notes: optionalText(draft.internal_notes),
    }
    const { data, error } = await this.client.rpc('convert_buy_submission_atomic', args)
    return this.finishAtomicSubmissionConversion(data, error, 'form_submissions.convert_buy.rpc')
  }

  async convertSellSubmission(submissionId: string, strategy: SubmissionContactStrategy) {
    const submission = await this.getFormSubmissionById(submissionId)
    if (submission.error) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: submission.error, errorKind: submission.errorKind }
    if (!submission.data) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró la recepción solicitada.', errorKind: 'not_found' as const }
    const draft = buildSellOpportunityDraft(submission.data, '')
    const args: ConvertSellSubmissionAtomicArgs = {
      p_submission_id: submissionId,
      ...contactRpcArgs(strategy),
      p_title: optionalText(draft.title),
      p_description: optionalText(draft.description),
      p_expected_date: draft.expected_date ?? undefined,
      p_country: optionalText(draft.country),
      p_region: optionalText(draft.region),
      p_city: optionalText(draft.city),
      p_estimated_value: draft.estimated_value ?? undefined,
      p_currency: optionalUpperText(draft.currency),
      p_internal_notes: optionalText(draft.internal_notes),
    }
    const { data, error } = await this.client.rpc('convert_sell_submission_atomic', args)
    return this.finishAtomicSubmissionConversion(data, error, 'form_submissions.convert_sell.rpc')
  }

  async convertSupplierSubmission(submissionId: string, strategy: SubmissionContactStrategy) {
    const submission = await this.getFormSubmissionById(submissionId)
    if (submission.error) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: submission.error, errorKind: submission.errorKind }
    if (!submission.data) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'No se encontró la recepción solicitada.', errorKind: 'not_found' as const }
    const draft = buildSupplierDraft(submission.data, '')
    const args: ConvertSupplierSubmissionAtomicArgs = {
      p_submission_id: submissionId,
      ...contactRpcArgs(strategy),
      p_business_name: optionalText(draft.business_name),
      p_legal_name: optionalText(draft.legal_name),
      p_tax_id: optionalText(draft.tax_id),
      p_description: optionalText(draft.description),
      p_categories: draft.categories.length > 0 ? draft.categories : undefined,
      p_geographic_coverage: optionalText(draft.geographic_coverage),
      p_supply_capacity: optionalText(draft.supply_capacity),
      p_minimum_order: draft.minimum_order ?? undefined,
      p_minimum_order_currency: optionalUpperText(draft.minimum_order_currency),
      p_issues_invoice: draft.issues_invoice ?? undefined,
      p_commercial_terms: optionalText(draft.commercial_terms),
      p_internal_notes: optionalText(draft.internal_notes),
    }
    const { data, error } = await this.client.rpc('convert_supplier_submission_atomic', args)
    return this.finishAtomicSubmissionConversion(data, error, 'form_submissions.convert_supplier.rpc')
  }

  private async finishAtomicSubmissionConversion(rows: ConvertSubmissionAtomicRow[] | null, error: PostgrestError | null, context: string): Promise<RepositoryResult<SubmissionConversionResult>> {
    if (error) return failRpc<SubmissionConversionResult>({ submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error, context)
    const row = singleRpcRow<ConvertSubmissionAtomicRow>(rows, `${context}.result`)
    if (row.error || !row.data) return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: row.error, errorKind: row.errorKind }

    const [submission, contact] = await Promise.all([this.getFormSubmissionById(row.data.submission_id), this.getContactById(row.data.contact_id)])
    if (submission.error || !submission.data) return { data: { submission: submission.data, contact: contact.data, entity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: submission.error ?? 'No fue posible cargar la recepción convertida.', errorKind: submission.errorKind ?? 'unknown' }
    if (contact.error) return { data: { submission: submission.data, contact: null, entity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: contact.error, errorKind: contact.errorKind }
    const entity = await this.getConvertedSubmissionEntity(submission.data)
    if (entity.error) return { data: { submission: submission.data, contact: contact.data, entity: null, alreadyConverted: row.data.already_converted, rpcResult: row.data }, error: entity.error, errorKind: entity.errorKind }

    return ok({ submission: submission.data, contact: contact.data, entity: entity.data, alreadyConverted: row.data.already_converted, rpcResult: row.data })
  }
  async getConvertedSubmissionEntity(submission: FormSubmissionRecord) {
    if (!submission.converted_entity_id || !submission.converted_entity_type) return ok(null)
    if (submission.converted_entity_type === 'inquiry') {
      const { data, error } = await this.client.from('inquiries').select(inquiryColumns).eq('id', submission.converted_entity_id).maybeSingle()
      if (error) return fail<SubmissionConversionResult['entity']>(null, error, 'form_submissions.entity.inquiry')
      return ok(data ? { type: 'inquiry' as const, record: data as InquiryRecord } : null)
    }
    if (submission.converted_entity_type === 'opportunity') {
      const opportunity = await this.getOpportunityById(submission.converted_entity_id)
      if (opportunity.error) return { data: null, error: opportunity.error, errorKind: opportunity.errorKind }
      return ok(opportunity.data ? { type: 'opportunity' as const, record: opportunity.data } : null)
    }
    if (submission.converted_entity_type === 'supplier') {
      const { data, error } = await this.client.from('suppliers').select(supplierColumns).eq('id', submission.converted_entity_id).maybeSingle()
      if (error) return fail<SubmissionConversionResult['entity']>(null, error, 'form_submissions.entity.supplier')
      return ok(data ? { type: 'supplier' as const, record: data as SupplierRecord } : null)
    }
    return { data: null, error: 'La recepción tiene una entidad convertida no reconocida.', errorKind: 'validation' as const }
  }

}
