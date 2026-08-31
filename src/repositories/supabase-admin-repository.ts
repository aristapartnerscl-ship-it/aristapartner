import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type {
  AdminProfile,
  AdminNotificationRecord,
  CommercialAgreementCreateValues,
  CommercialAgreementRecord,
  CommercialAgreementUpdateValues,
  CommercialAgreementWithOpportunity,
  ContactFormValues,
  ContactInsert,
  ContactRecord,
  ContactSelectorRecord,
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
  RepositoryErrorKind,
  RepositoryResult,
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

const organizationSettingsColumns =
  'singleton_key, display_name, legal_name, tax_identifier, public_email, public_phone, website_url, address_line, city_region, country_code, timezone, locale, default_currency, default_opportunity_priority, default_follow_up_days, default_attribution_days, default_commission_type, default_commission_value, created_at, updated_at, created_by, updated_by'

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

  async getCurrentAdminProfile(userId: string) {
    const { data, error } = await this.client
      .from('admin_profiles')
      .select('id, full_name, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .eq('is_active', true)
      .eq('role', 'owner')
      .maybeSingle()

    if (error) return fail<AdminProfile | null>(null, error, 'admin_profile.read')
    return ok(data as AdminProfile | null)
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

    return ok(data)
  }

  async listOpportunities() {
    const { data, error } = await this.client.from('opportunities').select(opportunityColumns).order('updated_at', { ascending: false })
    if (error) return fail<OpportunityRecord[]>([], error, 'opportunities.list')
    return ok((data ?? []) as OpportunityRecord[])
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
