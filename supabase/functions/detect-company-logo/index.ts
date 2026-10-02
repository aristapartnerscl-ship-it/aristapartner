import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, isAllowedOrigin, parseCsv } from './cors.ts'

type LogoCandidate = {
  url: string
  source: 'schema' | 'logo-element' | 'apple-touch-icon' | 'favicon' | 'og-image'
  label: string
}

const maxHtmlBytes = 600_000
const maxImageBytes = 2_097_152
const maxRedirects = 4
const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...(init.headers ?? {}), 'Content-Type': 'application/json' },
  })
}

function safeError(message: string, status = 400, headers: HeadersInit = {}) {
  return json({ ok: false, message }, { status, headers })
}

function isPrivateIpv4(value: string) {
  const parts = value.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const [a, b] = parts
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
}

function isPrivateIpv6(value: string) {
  const normalized = value.toLowerCase()
  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
}

async function assertSafeHttpUrl(input: unknown) {
  if (typeof input !== 'string' || input.length > 2048) return null
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || isPrivateIpv4(host) || isPrivateIpv6(host)) return null

  let resolved = false
  try {
    const ipv4 = await Deno.resolveDns(host, 'A')
    resolved = true
    if (ipv4.some(isPrivateIpv4)) return null
  } catch {
    // Continue with AAAA below; if both lookups fail, reject fail-closed.
  }

  try {
    const ipv6 = await Deno.resolveDns(host, 'AAAA')
    resolved = true
    if (ipv6.some(isPrivateIpv6)) return null
  } catch {
    // If no DNS lookup succeeded, do not fetch user-controlled hosts.
  }

  if (!resolved) return null

  return url
}

async function fetchWithLimit(url: URL, accept: string, limit: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6500)
  try {
    let currentUrl: URL | null = url
    let response: Response | null = null
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
      currentUrl = await assertSafeHttpUrl(currentUrl.toString())
      if (!currentUrl) return null
      response = await fetch(currentUrl, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'Accept': accept, 'User-Agent': 'AristaLogoDetector/1.0' },
      })
      if (![301, 302, 303, 307, 308].includes(response.status)) break
      const location = response.headers.get('location')
      if (!location || redirectCount === maxRedirects) return null
      currentUrl = new URL(location, currentUrl)
    }

    if (!response) return null
    const finalUrl = await assertSafeHttpUrl(response.url)
    if (!response.ok || !finalUrl) return null
    const length = Number(response.headers.get('content-length') ?? '0')
    if (length > limit) return null
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > limit) return null
    return { response, buffer, finalUrl }
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function attr(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i')
  return tag.match(pattern)?.[1]?.trim() ?? null
}

function absolutize(value: string | null, base: URL) {
  if (!value || value.startsWith('data:') || value.startsWith('javascript:')) return null
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function pushUnique(candidates: LogoCandidate[], candidate: LogoCandidate) {
  if (candidates.some((item) => item.url === candidate.url)) return
  candidates.push(candidate)
}

async function validatedCandidateUrl(value: string | null, baseUrl: URL) {
  const absolute = absolutize(value, baseUrl)
  if (!absolute) return null
  const safeUrl = await assertSafeHttpUrl(absolute)
  return safeUrl?.toString() ?? null
}

async function parseCandidates(html: string, baseUrl: URL) {
  const candidates: LogoCandidate[] = []

  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(script[1].trim())
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const logo = item?.logo?.url ?? item?.logo
        const url = await validatedCandidateUrl(typeof logo === 'string' ? logo : null, baseUrl)
        if (url) pushUnique(candidates, { url, source: 'schema', label: 'Logo schema.org' })
      }
    } catch {
      // Ignore malformed structured data from third-party websites.
    }
  }

  for (const image of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = image[0]
    const marker = `${attr(tag, 'alt') ?? ''} ${attr(tag, 'class') ?? ''} ${attr(tag, 'id') ?? ''}`.toLowerCase()
    if (!marker.includes('logo')) continue
    const url = await validatedCandidateUrl(attr(tag, 'src') ?? attr(tag, 'data-src'), baseUrl)
    if (url) pushUnique(candidates, { url, source: 'logo-element', label: 'Imagen identificada como logo' })
  }

  for (const link of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = link[0]
    const rel = (attr(tag, 'rel') ?? '').toLowerCase()
    const href = await validatedCandidateUrl(attr(tag, 'href'), baseUrl)
    if (!href) continue
    if (rel.includes('apple-touch-icon')) pushUnique(candidates, { url: href, source: 'apple-touch-icon', label: 'Apple touch icon' })
    else if (rel.includes('icon')) pushUnique(candidates, { url: href, source: 'favicon', label: 'Icono del sitio' })
  }

  for (const meta of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = meta[0]
    const property = (attr(tag, 'property') ?? attr(tag, 'name') ?? '').toLowerCase()
    if (property !== 'og:image') continue
    const url = await validatedCandidateUrl(attr(tag, 'content'), baseUrl)
    if (url) pushUnique(candidates, { url, source: 'og-image', label: 'Imagen social del sitio' })
  }

  return candidates.slice(0, 8)
}

type Actor = { id: string; role: 'owner' | 'collaborator' }

async function getActor(request: Request): Promise<{ actor: Actor; supabase: ReturnType<typeof createClient> } | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return null
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData.user) return null
  const { data } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active, invitation_status, onboarding_completed_at')
    .eq('id', userData.user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!data || (data.role !== 'owner' && (data.invitation_status !== 'accepted' || !data.onboarding_completed_at))) return null
  return { actor: { id: data.id, role: data.role }, supabase }
}

async function canManageProspect(supabase: ReturnType<typeof createClient>, actor: Actor, prospectId: string) {
  const { data: prospect } = await supabase
    .from('represented_company_prospects')
    .select('id, represented_company_id, owner_user_id')
    .eq('id', prospectId)
    .maybeSingle()
  if (!prospect) return false
  if (actor.role === 'owner') return true

  const { data: membership } = await supabase
    .from('represented_company_memberships')
    .select('id')
    .eq('represented_company_id', prospect.represented_company_id)
    .eq('user_id', actor.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!membership) return false
  if (prospect.owner_user_id === actor.id) return true

  const { data: assignment } = await supabase
    .from('represented_company_prospect_collaborators')
    .select('id')
    .eq('prospect_id', prospectId)
    .eq('user_id', actor.id)
    .eq('status', 'active')
    .maybeSingle()
  return Boolean(assignment)
}

Deno.serve(async (request) => {
  const allowedOrigins = parseCsv(Deno.env.get('PUBLIC_SITE_ORIGINS'))
  const origin = request.headers.get('Origin')
  const headers = corsHeaders(origin, allowedOrigins)

  if (!isAllowedOrigin(origin, allowedOrigins)) return safeError('Solicitud no permitida.', 403, headers)
  if (request.method === 'OPTIONS') return json({ ok: true }, { status: 200, headers })
  if (request.method !== 'POST') return safeError('Metodo no permitido.', 405, headers)
  const body = await request.json().catch(() => null) as { action?: string; websiteUrl?: string; imageUrl?: string; companyId?: string; prospectId?: string } | null
  if (!body) return safeError('Solicitud invalida.', 400, headers)
  const auth = await getActor(request)
  if (!auth) return safeError('No autorizado.', 403, headers)
  const prospectId = body.prospectId
  if (prospectId) {
    if (!await canManageProspect(auth.supabase, auth.actor, prospectId)) return safeError('No autorizado para este prospecto.', 403, headers)
  } else if (auth.actor.role !== 'owner') {
    return safeError('No autorizado.', 403, headers)
  }

  if (body.action === 'detect') {
    const websiteUrl = await assertSafeHttpUrl(body.websiteUrl)
    if (!websiteUrl) return safeError('Ingresa una URL publica http/https valida.', 400, headers)
    const fetched = await fetchWithLimit(websiteUrl, 'text/html', maxHtmlBytes)
    const contentType = fetched?.response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!fetched || !contentType.includes('text/html')) return safeError('No fue posible leer HTML desde el sitio.', 400, headers)
    const html = new TextDecoder().decode(fetched.buffer)
    return json({ ok: true, candidates: await parseCandidates(html, fetched.finalUrl) }, { status: 200, headers })
  }

  if (body.action === 'import') {
    const imageUrl = await assertSafeHttpUrl(body.imageUrl)
    if (!imageUrl || (!body.companyId && !prospectId)) return safeError('Selecciona una imagen valida.', 400, headers)
    const fetched = await fetchWithLimit(imageUrl, 'image/png,image/jpeg,image/webp', maxImageBytes)
    const contentType = fetched?.response.headers.get('content-type')?.split(';')[0].toLowerCase() ?? ''
    if (!fetched || !allowedImageTypes.has(contentType)) return safeError('La imagen detectada no tiene un formato permitido.', 400, headers)

    const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
    const path = prospectId
      ? `prospects/${prospectId}/detected-${crypto.randomUUID()}.${extension}`
      : `${body.companyId}/detected-${crypto.randomUUID()}.${extension}`
    const supabase = auth.supabase
    const { error } = await supabase.storage.from('company-logos').upload(path, fetched.buffer, { contentType, upsert: true })
    if (error) return safeError('No fue posible guardar el logo detectado.', 503, headers)
    if (prospectId) {
      const { error: updateError } = await supabase
        .from('represented_company_prospects')
        .update({ logo_storage_path: path, logo_source: 'detected', logo_updated_at: new Date().toISOString() })
        .eq('id', prospectId)
      if (updateError) return safeError('El logo se guardo, pero no fue posible asociarlo al prospecto.', 503, headers)
    }
    return json({ ok: true, path }, { status: 201, headers })
  }

  return safeError('Accion no reconocida.', 400, headers)
})
