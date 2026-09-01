import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, isAllowedOrigin, parseCsv } from './cors.ts'
import { createAdminNotifications, createSupabaseAdminNotificationStore } from './notifications.ts'
import { sendSubmissionEmail } from './email-notification.ts'
import { parseJsonBody, validatePublicForm } from './validation.ts'
import type { TurnstileSiteverifyResponse } from './types.ts'

const successMessage = 'Hemos recibido tus antecedentes para evaluación.'
const genericErrorMessage = 'No fue posible recibir el formulario en este momento.'

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      'Content-Type': 'application/json',
    },
  })
}

function safeError(message: string, status = 400, headers: HeadersInit = {}) {
  return json({ ok: false, message }, { status, headers })
}

async function validateTurnstile(token: string, expectedHostnames: string[]) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret || expectedHostnames.length === 0) return { ok: false, reason: 'configuration' as const }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ secret, response: token, idempotency_key: crypto.randomUUID() }),
    })
    if (!response.ok) return { ok: false, reason: 'turnstile' as const }
    const result = await response.json() as TurnstileSiteverifyResponse
    if (result.success !== true) return { ok: false, reason: 'turnstile' as const }
    if (!result.hostname || !expectedHostnames.includes(result.hostname)) return { ok: false, reason: 'hostname' as const }
    return { ok: true as const }
  } catch {
    return { ok: false, reason: 'turnstile' as const }
  } finally {
    clearTimeout(timeout)
  }
}

Deno.serve(async (request) => {
  const allowedOrigins = parseCsv(Deno.env.get('PUBLIC_SITE_ORIGINS'))
  const expectedHostnames = parseCsv(Deno.env.get('TURNSTILE_EXPECTED_HOSTNAMES'))
  const origin = request.headers.get('Origin')
  const headers = corsHeaders(origin, allowedOrigins)

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return safeError('Solicitud no permitida.', 403, headers)
  }

  if (request.method === 'OPTIONS') {
    return json({ ok: true }, { status: 200, headers })
  }

  if (request.method !== 'POST') {
    return safeError('Metodo no permitido.', 405, headers)
  }

  const contentType = request.headers.get('Content-Type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return safeError('Content-Type no permitido.', 415, headers)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return safeError(genericErrorMessage, 503, headers)
  }

  const raw = await request.text()
  const parsed = parseJsonBody(raw)
  if (!parsed.ok) {
    return safeError(parsed.message, parsed.status, headers)
  }

  const validation = validatePublicForm(parsed.value)
  if (!validation.ok) {
    if (validation.reason === 'honeypot') {
      return json({ ok: true, submissionId: null, message: successMessage }, { status: 202, headers })
    }
    return safeError(validation.message, 400, headers)
  }

  const turnstile = await validateTurnstile((parsed.value as { turnstileToken: string }).turnstileToken, expectedHostnames)
  if (!turnstile.ok) {
    return safeError(turnstile.reason === 'configuration' ? genericErrorMessage : 'No fue posible validar la verificacion de seguridad.', turnstile.reason === 'configuration' ? 503 : 400, headers)
  }

  const userAgent = (request.headers.get('User-Agent') ?? '').slice(0, 300) || null
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from('form_submissions')
    .insert({
      submission_type: validation.value.submissionType,
      payload: validation.value.payload,
      status: 'received',
      user_agent: userAgent,
      consent_contact: validation.value.consentContact,
      consent_marketing: validation.value.consentMarketing,
      privacy_version: validation.value.privacyVersion,
      source_ip_hash: null,
    })
    .select('id')
    .single()

  if (error || !data?.id) {
    return safeError(genericErrorMessage, 503, headers)
  }

  await createAdminNotifications(
    createSupabaseAdminNotificationStore(supabase),
    data.id,
    validation.value.submissionType,
  )

  await sendSubmissionEmail(
    validation.value,
    {
      resendApiKey: Deno.env.get('RESEND_API_KEY'),
      notificationFrom: Deno.env.get('ARISTA_NOTIFICATION_FROM'),
      notificationTo: Deno.env.get('ARISTA_NOTIFICATION_TO'),
    },
    fetch,
  )

  return json({ ok: true, submissionId: data.id, message: successMessage }, { status: 201, headers })
})
