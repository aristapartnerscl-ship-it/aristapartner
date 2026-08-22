import type {
  ContactFormValues,
  ContactRecord,
  FormSubmissionRecord,
  InquiryReason,
  PreferredContactMethod,
  SubmissionType,
} from '../types/admin'

type PayloadValue = string | number | boolean | null | string[]
export type NormalizedPayload = Record<string, PayloadValue>

export type LabeledPayloadField = {
  key: string
  label: string
  value: PayloadValue
}

const commonLabels = {
  fullName: 'Nombre completo',
  organization: 'Empresa u organización',
  company: 'Empresa',
  companyName: 'Empresa',
  role: 'Cargo o actividad',
  email: 'Correo electrónico',
  phone: 'Teléfono o WhatsApp',
  country: 'País',
  cityRegion: 'Ciudad o región',
  city: 'Ciudad',
  region: 'Región',
  website: 'Sitio web',
  social: 'Red social',
  socialMedia: 'Red social',
  reason: 'Motivo',
  subject: 'Asunto',
  message: 'Mensaje',
  preferredContact: 'Medio de contacto preferido',
  additionalInfo: 'Información adicional',
  additionalInformation: 'Información adicional',
} satisfies Record<string, string>

export const submissionFieldOrder: Record<SubmissionType, string[]> = {
  buy: [
    'fullName', 'organization', 'role', 'email', 'phone', 'city', 'region', 'country', 'need', 'needDetail',
    'volume', 'budget', 'currency', 'deadline', 'deliveryPlace', 'hasQuotes', 'additionalInfo',
  ],
  sell: [
    'fullName', 'company', 'role', 'email', 'phone', 'website', 'social', 'city', 'region', 'country', 'offer',
    'offerDetail', 'targetClient', 'coverage', 'capacity', 'priceRange', 'currency', 'channel', 'differentiators',
    'additionalInfo',
  ],
  supplier: [
    'fullName', 'company', 'email', 'phone', 'website', 'city', 'region', 'country', 'products', 'categories',
    'coverage', 'capacity', 'minimumSale', 'minimumOrderCurrency', 'invoice', 'conditions', 'additionalInfo',
  ],
  contact: [
    'fullName', 'organization', 'role', 'email', 'phone', 'country', 'cityRegion', 'reason', 'subject',
    'message', 'preferredContact',
  ],
}

export const submissionFieldLabels: Record<SubmissionType, Record<string, string>> = {
  buy: {
    ...commonLabels,
    need: 'Necesidad de compra',
    needDetail: 'Descripción de la necesidad',
    volume: 'Cantidad o volumen',
    budget: 'Presupuesto',
    currency: 'Moneda',
    deadline: 'Fecha o plazo requerido',
    deliveryPlace: 'Lugar de entrega o prestación',
    hasQuotes: 'Cotizaciones existentes',
  },
  sell: {
    ...commonLabels,
    offer: 'Oferta comercial',
    offerDetail: 'Descripción de la oferta',
    targetClient: 'Tipo de cliente buscado',
    coverage: 'Cobertura',
    capacity: 'Capacidad',
    priceRange: 'Precio o rango referencial',
    currency: 'Moneda',
    channel: 'Canal buscado',
    differentiators: 'Diferenciadores',
  },
  supplier: {
    ...commonLabels,
    products: 'Productos o servicios',
    categories: 'Categorías',
    coverage: 'Cobertura',
    capacity: 'Capacidad de suministro o atención',
    minimumSale: 'Venta mínima',
    minimumOrderCurrency: 'Moneda del mínimo',
    invoice: 'Emite factura',
    conditions: 'Condiciones comerciales',
  },
  contact: commonLabels,
}

export const reasonValueMap: Record<string, InquiryReason> = {
  'Consulta sobre servicios': 'services',
  'Consulta sobre representación comercial': 'commercial_representation',
  'Consulta sobre representacion comercial': 'commercial_representation',
  'Consulta sobre búsqueda de proveedores': 'supplier_search',
  'Consulta sobre busqueda de proveedores': 'supplier_search',
  'Consulta sobre oportunidades B2B': 'b2b_opportunity',
  'Propuesta de colaboración': 'collaboration',
  'Propuesta de colaboracion': 'collaboration',
  'Prensa o comunicación': 'press',
  'Prensa o comunicacion': 'press',
  Otro: 'other',
}

export const preferredContactMap: Record<string, PreferredContactMethod> = {
  'Correo electrónico': 'email',
  'Correo electronico': 'email',
  'Teléfono o WhatsApp': 'phone_whatsapp',
  'Telefono o WhatsApp': 'phone_whatsapp',
  'Cualquiera de los anteriores': 'any',
}

export function normalizeSubmissionPayload(submission: FormSubmissionRecord): NormalizedPayload {
  if (!submission.payload || typeof submission.payload !== 'object' || Array.isArray(submission.payload)) return {}
  const allowed = new Set(submissionFieldOrder[submission.submission_type])
  const source = submission.payload as Record<string, unknown>
  const normalized: NormalizedPayload = {}
  for (const key of submissionFieldOrder[submission.submission_type]) {
    if (!allowed.has(key)) continue
    const value = source[key]
    if (Array.isArray(value)) normalized[key] = value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    else if (typeof value === 'string') normalized[key] = value.trim() || null
    else if (typeof value === 'number' && Number.isFinite(value)) normalized[key] = value
    else if (typeof value === 'boolean') normalized[key] = value
    else normalized[key] = null
  }
  return normalized
}

export function labeledPayloadFields(submission: FormSubmissionRecord, showEmpty = false): LabeledPayloadField[] {
  const payload = normalizeSubmissionPayload(submission)
  return submissionFieldOrder[submission.submission_type]
    .map((key) => ({ key, label: submissionFieldLabels[submission.submission_type][key], value: payload[key] ?? null }))
    .filter((field) => Boolean(field.label) && (showEmpty || !isEmptyValue(field.value)))
}

export function isEmptyValue(value: PayloadValue) {
  if (value === null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function displayPayloadValue(value: PayloadValue, key = '') {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value === null || value === '') return 'Sin información'
  if (/date|deadline/i.test(key)) return formatMaybeDate(String(value))
  if (/budget|price|minimum/i.test(key) && typeof value !== 'boolean') return formatMaybeAmount(value)
  return String(value)
}

export function buildContactInitialValues(submission: FormSubmissionRecord): ContactFormValues {
  const payload = normalizeSubmissionPayload(submission)
  const company = stringValue(payload.company) || stringValue(payload.organization)
  const fullName = stringValue(payload.fullName)
  return {
    contact_type: submission.submission_type === 'supplier' || (!fullName && company) ? 'company' : 'person',
    full_name: fullName,
    company_name: company,
    position: stringValue(payload.role),
    email: stringValue(payload.email),
    phone: stringValue(payload.phone),
    website: stringValue(payload.website),
    social_media: stringValue(payload.social) || stringValue(payload.socialMedia),
    country: stringValue(payload.country),
    region: stringValue(payload.region),
    city: stringValue(payload.city) || stringValue(payload.cityRegion),
    source: 'public_form',
    notes: 'Contacto revisado desde recepción pública.',
  }
}

export function contactDisplayName(contact: ContactRecord) {
  return contact.full_name || contact.company_name || 'Contacto sin nombre'
}

export function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export function normalizePhone(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '')
}

export function contactCandidateScore(contact: ContactRecord, submission: FormSubmissionRecord) {
  const payload = normalizeSubmissionPayload(submission)
  const email = normalizeEmail(stringValue(payload.email))
  const phone = normalizePhone(stringValue(payload.phone))
  const name = stringValue(payload.fullName).toLowerCase()
  const company = (stringValue(payload.company) || stringValue(payload.organization)).toLowerCase()
  if (email && normalizeEmail(contact.email) === email) return 100
  if (phone && normalizePhone(contact.phone) === phone) return 90
  let score = 0
  if (name && (contact.full_name ?? '').toLowerCase().includes(name)) score += 25
  if (company && (contact.company_name ?? '').toLowerCase().includes(company)) score += 25
  return score
}

export function buildInquiryDraft(submission: FormSubmissionRecord, contactId: string) {
  const payload = normalizeSubmissionPayload(submission)
  return {
    contact_id: contactId,
    subject: stringValue(payload.subject),
    reason: reasonValueMap[stringValue(payload.reason)] ?? 'other',
    message: stringValue(payload.message),
    preferred_contact_method: preferredContactMap[stringValue(payload.preferredContact)] ?? 'any',
    status: 'new' as const,
    internal_notes: 'Creada manualmente desde una recepción pública revisada por el owner.',
    converted_opportunity_id: null,
  }
}

export function buildBuyOpportunityDraft(submission: FormSubmissionRecord, contactId: string) {
  const payload = normalizeSubmissionPayload(submission)
  return {
    opportunity_type: 'buy' as const,
    title: stringValue(payload.need) || 'Necesidad de compra recibida',
    description: joinText([stringValue(payload.need), stringValue(payload.needDetail), labelLine('Cantidad', payload.volume), labelLine('Entrega', payload.deliveryPlace), labelLine('Cotizaciones existentes', payload.hasQuotes), stringValue(payload.additionalInfo)]),
    contact_id: contactId,
    status: 'under_review' as const,
    priority: 'medium' as const,
    source: 'public_form',
    estimated_value: parseAmount(payload.budget),
    currency: stringValue(payload.currency) || null,
    expected_date: parseDateString(payload.deadline),
    country: stringValue(payload.country) || null,
    region: stringValue(payload.region) || null,
    city: stringValue(payload.city) || null,
    internal_notes: 'Creada manualmente desde una recepción pública revisada por el owner.',
    rejection_reason: null,
    assigned_to: null,
  }
}

export function buildSellOpportunityDraft(submission: FormSubmissionRecord, contactId: string) {
  const payload = normalizeSubmissionPayload(submission)
  return {
    opportunity_type: 'sell' as const,
    title: stringValue(payload.offer) || 'Oferta de venta recibida',
    description: joinText([stringValue(payload.offer), stringValue(payload.offerDetail), labelLine('Cliente buscado', payload.targetClient), labelLine('Cobertura', payload.coverage), labelLine('Capacidad', payload.capacity), labelLine('Canal', payload.channel), stringValue(payload.differentiators), stringValue(payload.additionalInfo)]),
    contact_id: contactId,
    status: 'under_review' as const,
    priority: 'medium' as const,
    source: 'public_form',
    estimated_value: parseAmount(payload.priceRange),
    currency: stringValue(payload.currency) || null,
    expected_date: null,
    country: stringValue(payload.country) || null,
    region: stringValue(payload.region) || null,
    city: stringValue(payload.city) || null,
    internal_notes: 'Creada manualmente desde una recepción pública revisada por el owner.',
    rejection_reason: null,
    assigned_to: null,
  }
}

export function buildSupplierDraft(submission: FormSubmissionRecord, contactId: string) {
  const payload = normalizeSubmissionPayload(submission)
  return {
    contact_id: contactId,
    business_name: stringValue(payload.company) || stringValue(payload.fullName) || 'Proveedor recibido',
    legal_name: null,
    tax_id: null,
    description: joinText([stringValue(payload.products), stringValue(payload.additionalInfo)]),
    categories: categoriesFrom(payload.categories),
    geographic_coverage: stringValue(payload.coverage) || null,
    supply_capacity: stringValue(payload.capacity) || null,
    minimum_order: parseAmount(payload.minimumSale),
    minimum_order_currency: stringValue(payload.minimumOrderCurrency) || null,
    issues_invoice: invoiceToBoolean(payload.invoice),
    commercial_terms: stringValue(payload.conditions) || null,
    status: 'pending' as const,
    internal_notes: 'Creado manualmente desde una recepción pública revisada por el owner.',
  }
}

export function stringValue(value: PayloadValue | undefined) {
  return typeof value === 'string' ? value : ''
}

function parseAmount(value: PayloadValue | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const normalized = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseDateString(value: PayloadValue | undefined) {
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

function categoriesFrom(value: PayloadValue | undefined) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return []
  return value.split(',').map((entry) => entry.trim()).filter(Boolean)
}

function invoiceToBoolean(value: PayloadValue | undefined) {
  if (typeof value === 'boolean') return value
  if (typeof value !== 'string') return null
  if (/^s[ií]/i.test(value)) return true
  if (/^no$/i.test(value)) return false
  return null
}

function labelLine(label: string, value: PayloadValue | undefined) {
  if (isEmptyValue(value ?? null)) return ''
  return `${label}: ${displayPayloadValue(value ?? null)}`
}

function joinText(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join('\n\n') || null
}

function formatMaybeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date)
}

function formatMaybeAmount(value: PayloadValue) {
  const amount = typeof value === 'number' ? value : parseAmount(value)
  if (amount === null) return String(value)
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(amount)
}
