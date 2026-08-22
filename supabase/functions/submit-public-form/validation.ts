import type { PublicFormRequest, SubmissionType, ValidatedSubmission, ValidationResult } from './types.ts'

export const MAX_BODY_BYTES = 50 * 1024
const MAX_TEXT = 1000
const MAX_SHORT_TEXT = 180
const MAX_TOKEN = 2048
const currencies = new Set(['CLP', 'USD', 'EUR', 'Otra', ''])
const submissionTypes = new Set<SubmissionType>(['buy', 'sell', 'supplier', 'contact'])

const schemas: Record<SubmissionType, Set<string>> = {
  buy: new Set([
    'fullName', 'organization', 'role', 'email', 'phone', 'city', 'region', 'country', 'need', 'needDetail',
    'volume', 'budget', 'currency', 'deadline', 'deliveryPlace', 'hasQuotes', 'additionalInfo',
  ]),
  sell: new Set([
    'fullName', 'company', 'role', 'email', 'phone', 'website', 'social', 'city', 'region', 'country', 'offer',
    'offerDetail', 'targetClient', 'coverage', 'capacity', 'priceRange', 'currency', 'channel', 'differentiators',
    'additionalInfo',
  ]),
  supplier: new Set([
    'fullName', 'company', 'email', 'phone', 'website', 'city', 'region', 'country', 'products', 'categories',
    'coverage', 'capacity', 'minimumSale', 'invoice', 'conditions', 'additionalInfo',
  ]),
  contact: new Set([
    'fullName', 'organization', 'role', 'email', 'phone', 'country', 'cityRegion', 'reason', 'subject',
    'message', 'preferredContact',
  ]),
}

const requiredFields: Record<SubmissionType, string[]> = {
  buy: ['fullName', 'email', 'phone', 'country', 'need', 'needDetail'],
  sell: ['fullName', 'company', 'email', 'phone', 'offer', 'offerDetail'],
  supplier: ['fullName', 'company', 'email', 'phone', 'products', 'categories'],
  contact: ['fullName', 'email', 'country', 'reason', 'subject', 'message'],
}

const longFields = new Set(['needDetail', 'offerDetail', 'differentiators', 'products', 'conditions', 'additionalInfo', 'message'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[0-9+()\s.-]{0,40}$/

export function parseJsonBody(raw: string) {
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return { ok: false as const, status: 413, message: 'La solicitud supera el tamano permitido.' }
  }
  try {
    return { ok: true as const, value: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false as const, status: 400, message: 'La solicitud no tiene un JSON valido.' }
  }
}

export function validatePublicForm(input: unknown): ValidationResult {
  if (!isPlainObject(input)) return invalid('La solicitud no tiene la estructura esperada.')

  const allowedTopLevel = new Set(['submissionType', 'data', 'consentContact', 'consentMarketing', 'privacyVersion', 'turnstileToken', 'website'])
  for (const key of Object.keys(input)) {
    if (!allowedTopLevel.has(key)) return invalid('La solicitud contiene campos no permitidos.')
  }

  const request = input as Partial<PublicFormRequest>
  if (typeof request.website === 'string' && request.website.trim()) {
    return { ok: false, reason: 'honeypot', message: 'Hemos recibido tus antecedentes para evaluacion.' }
  }
  if (request.website !== '') return invalid('La solicitud no tiene la estructura esperada.')
  if (typeof request.submissionType !== 'string' || !submissionTypes.has(request.submissionType as SubmissionType)) return invalid('Tipo de formulario no valido.')
  if (!isPlainObject(request.data)) return invalid('Los datos del formulario no son validos.')
  if (request.consentContact !== true) return invalid('Debes autorizar el contacto para enviar el formulario.')
  if (request.consentMarketing !== undefined && typeof request.consentMarketing !== 'boolean') return invalid('Consentimiento de marketing no valido.')
  if (typeof request.privacyVersion !== 'string' || !request.privacyVersion.trim() || request.privacyVersion.length > MAX_SHORT_TEXT) return invalid('Version de privacidad no valida.')
  if (typeof request.turnstileToken !== 'string' || !request.turnstileToken.trim() || request.turnstileToken.length > MAX_TOKEN) return invalid('Verificacion de seguridad requerida.')

  const type = request.submissionType as SubmissionType
  const payload = normalizeData(type, request.data)
  if (!payload.ok) return payload

  return {
    ok: true,
    value: {
      submissionType: type,
      payload: payload.value,
      consentContact: true,
      consentMarketing: request.consentMarketing === true,
      privacyVersion: request.privacyVersion.trim(),
    },
  }
}

function normalizeData(type: SubmissionType, data: Record<string, unknown>): ValidationResult | { ok: true; value: ValidatedSubmission['payload'] } {
  const allowed = schemas[type]
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) return invalid('El formulario contiene campos no permitidos.')
  }

  const normalized: ValidatedSubmission['payload'] = {}
  for (const key of allowed) {
    const value = data[key]
    if (Array.isArray(value)) {
      if (key !== 'categories') return invalid('El formulario contiene listas no permitidas.')
      const categories = normalizeCategories(value)
      if (!categories.ok) return categories
      normalized[key] = categories.value
      continue
    }
    if (isPlainObject(value)) return invalid('El formulario contiene campos anidados no permitidos.')
    if (value === undefined || value === null) {
      normalized[key] = null
      continue
    }
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return invalid('El formulario contiene valores no permitidos.')
    normalized[key] = normalizeScalar(key, value)
    if (typeof normalized[key] === 'string' && normalized[key].length > (longFields.has(key) ? MAX_TEXT : MAX_SHORT_TEXT)) {
      return invalid('Uno de los campos supera el largo permitido.')
    }
  }

  for (const key of requiredFields[type]) {
    const value = normalized[key]
    if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return invalid('Completa los campos obligatorios.')
  }

  if (typeof normalized.email === 'string' && !emailPattern.test(normalized.email)) return invalid('Ingresa un correo electronico valido.')
  if (typeof normalized.phone === 'string' && normalized.phone && !phonePattern.test(normalized.phone)) return invalid('Ingresa un telefono valido.')
  if (typeof normalized.website === 'string' && normalized.website && !isValidUrl(normalized.website)) return invalid('Ingresa una URL valida.')
  if (typeof normalized.currency === 'string' && !currencies.has(normalized.currency)) return invalid('Moneda no valida.')
  if (typeof normalized.country === 'string' && normalized.country.length > 80) return invalid('Pais no valido.')
  if (type === 'contact' && typeof normalized.message === 'string' && normalized.message.length < 20) return invalid('El mensaje debe tener al menos 20 caracteres.')

  return { ok: true, value: normalized }
}

function normalizeScalar(_key: string, value: string | number | boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeCategories(value: unknown[]) {
  const seen = new Set<string>()
  const categories: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') return invalid('Categorias no validas.')
    const trimmed = entry.trim()
    if (!trimmed) continue
    if (trimmed.length > 80) return invalid('Categorias no validas.')
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      categories.push(trimmed)
    }
  }
  return { ok: true as const, value: categories }
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function invalid(message: string): ValidationResult {
  return { ok: false, reason: 'validation', message }
}
