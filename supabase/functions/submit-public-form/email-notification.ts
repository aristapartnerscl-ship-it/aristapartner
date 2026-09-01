import type { SubmissionType, ValidatedSubmission } from './types.ts'

export const INTERNAL_NOTIFICATION_EMAIL = 'aristapartnerscl@gmail.com'
const resendEndpoint = 'https://api.resend.com/emails'
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type NotificationEnvironment = {
  resendApiKey?: string
  notificationFrom?: string
  notificationTo?: string
}

type EmailRequest = {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
  reply_to?: string
}

type EmailFetch = (input: string, init: RequestInit) => Promise<Response>

const labels: Record<string, string> = {
  fullName: 'Nombre', organization: 'Empresa', company: 'Empresa', role: 'Cargo o actividad', email: 'Correo', phone: 'Teléfono',
  website: 'Sitio web', social: 'Red social', city: 'Ciudad', cityRegion: 'Ciudad o región', region: 'Región', country: 'País',
  need: 'Necesidad', needDetail: 'Detalle de la necesidad', offer: 'Oferta', offerDetail: 'Detalle de la oferta', products: 'Productos o servicios',
  categories: 'Categorías', targetClient: 'Cliente objetivo', coverage: 'Cobertura', capacity: 'Capacidad', priceRange: 'Rango de precios',
  currency: 'Moneda', volume: 'Volumen', budget: 'Presupuesto', deadline: 'Plazo', deliveryPlace: 'Lugar de entrega', hasQuotes: 'Cotizaciones previas',
  minimumSale: 'Venta mínima', invoice: 'Facturación', conditions: 'Condiciones', additionalInfo: 'Información adicional', reason: 'Motivo',
  subject: 'Asunto', message: 'Mensaje / necesidad', preferredContact: 'Medio de contacto preferido',
}

const subjectByType: Record<SubmissionType, string> = {
  contact: '[Nuevo contacto] Arista Partners',
  buy: '[Nueva solicitud] Quiero comprar - Arista Partners',
  sell: '[Nueva solicitud] Quiero vender - Arista Partners',
  supplier: '[Nuevo proveedor] Arista Partners',
}

const typeLabel: Record<SubmissionType, string> = {
  contact: 'Contacto',
  buy: 'Quiero comprar',
  sell: 'Quiero vender',
  supplier: 'Quiero ser proveedor',
}

export function resolveNotificationRecipient(configuredRecipient?: string) {
  return configuredRecipient?.trim().toLowerCase() === INTERNAL_NOTIFICATION_EMAIL
    ? INTERNAL_NOTIFICATION_EMAIL
    : INTERNAL_NOTIFICATION_EMAIL
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

function displayValue(value: string | number | boolean | null | string[]) {
  if (value === null || value === '') return null
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : null
  return String(value)
}

export function buildSubmissionEmail(submission: ValidatedSubmission, receivedAt = new Date()): EmailRequest {
  const rows = Object.entries(submission.payload)
    .map(([key, value]) => ({ label: labels[key] ?? key, value: displayValue(value) }))
    .filter((row): row is { label: string; value: string } => row.value !== null)
  const date = receivedAt.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Santiago' })
  const allRows = [{ label: 'Tipo', value: typeLabel[submission.submissionType] }, ...rows, { label: 'Fecha de recepción', value: date }]
  const text = ['NUEVA SOLICITUD EN ARISTA PARTNERS', '', ...allRows.map((row) => `${row.label}:\n${row.value}`)].join('\n\n')
  const htmlRows = allRows.map((row) => `<tr><th align="left" valign="top">${escapeHtml(row.label)}</th><td>${escapeHtml(row.value).replace(/\n/g, '<br>')}</td></tr>`).join('')
  const html = `<div style="font-family:Arial,sans-serif;color:#1a1f23"><h1 style="font-size:20px">NUEVA SOLICITUD EN ARISTA PARTNERS</h1><table cellpadding="8" cellspacing="0" style="border-collapse:collapse"><tbody>${htmlRows}</tbody></table></div>`
  const email = typeof submission.payload.email === 'string' && emailPattern.test(submission.payload.email) ? submission.payload.email : undefined
  return { from: '', to: [INTERNAL_NOTIFICATION_EMAIL], subject: subjectByType[submission.submissionType], html, text, ...(email ? { reply_to: email } : {}) }
}

export async function sendSubmissionEmail(
  submission: ValidatedSubmission,
  environment: NotificationEnvironment,
  fetcher: EmailFetch,
  receivedAt = new Date(),
  log: (message: string, context: Record<string, number | string>) => void = (message, context) => console.warn(message, context),
) {
  if (!environment.resendApiKey || !environment.notificationFrom) {
    log('submit-public-form email notification skipped', { code: 'email_configuration_missing' })
    return { ok: false as const, sent: false }
  }

  try {
    const email = buildSubmissionEmail(submission, receivedAt)
    const request: EmailRequest = { ...email, from: environment.notificationFrom, to: [resolveNotificationRecipient(environment.notificationTo)] }
    const response = await fetcher(resendEndpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${environment.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!response.ok) {
      log('Notification email failed', { status: response.status })
      return { ok: false as const, sent: false }
    }
    return { ok: true as const, sent: true }
  } catch {
    log('Notification email failed', { status: 0 })
    return { ok: false as const, sent: false }
  }
}
