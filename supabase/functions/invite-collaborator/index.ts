import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, isAllowedOrigin, parseCsv } from './cors.ts'

type InviteBody = {
  action?: 'invite' | 'reissue' | 'revoke' | 'remove' | 'complete-onboarding'
  email?: string
  fullName?: string
  userId?: string
}

type AdminProfile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'owner' | 'collaborator'
  is_active: boolean
  invitation_status?: 'pending' | 'accepted' | 'revoked'
  onboarding_completed_at?: string | null
}

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...(init.headers ?? {}), 'Content-Type': 'application/json' },
  })
}

function safeError(message: string, status = 400, headers: HeadersInit = {}) {
  return json({ ok: false, message }, { status, headers })
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function collaboratorColumns() {
  return 'id, full_name, email, role, is_active, created_at, updated_at, last_activity_at, invitation_status, invited_at, invitation_sent_at, invitation_revoked_at, onboarding_completed_at'
}

function inviteRedirectTo() {
  return Deno.env.get('ARISTA_INVITE_REDIRECT_TO') || undefined
}

async function requireAuthenticatedUser(supabase: ReturnType<typeof createClient>, request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return { userId: null, error: true }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { userId: null, error: true }
  return { userId: data.user.id, error: false }
}

async function requireAdmin(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('id', userId)
    .eq('role', 'owner')
    .eq('is_active', true)
    .maybeSingle()
  return Boolean(data)
}

async function getProfile(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, email, full_name, role, is_active, invitation_status, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle()
  return { profile: data as AdminProfile | null, error }
}

async function hasRows(supabase: ReturnType<typeof createClient>, table: string, column: string, userId: string) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, userId)
  if (error) return true
  return (count ?? 0) > 0
}

async function hasCollaboratorHistory(supabase: ReturnType<typeof createClient>, userId: string) {
  const checks: Array<[string, string]> = [
    ['represented_company_memberships', 'user_id'],
    ['contacts', 'created_by'],
    ['opportunities', 'created_by'],
    ['opportunities', 'assigned_to'],
    ['suppliers', 'created_by'],
    ['inquiries', 'assigned_to'],
    ['opportunity_activities', 'created_by'],
    ['opportunity_activities', 'completed_by'],
    ['prospects', 'created_by'],
    ['prospects', 'assigned_to'],
    ['prospect_activities', 'created_by'],
    ['commercial_proposals', 'created_by'],
    ['commercial_proposals', 'archived_by'],
    ['commercial_agreements', 'created_by'],
    ['commercial_agreements', 'archived_by'],
    ['form_submissions', 'reviewed_by'],
  ]

  for (const [table, column] of checks) {
    if (await hasRows(supabase, table, column, userId)) return true
  }
  return false
}

async function inviteCollaborator(
  supabase: ReturnType<typeof createClient>,
  email: string,
  fullName: string | null,
  invitedBy: string,
  headers: HeadersInit,
) {
  const redirectTo = inviteRedirectTo()
  const invite = await supabase.auth.admin.inviteUserByEmail(email, redirectTo ? { redirectTo } : undefined)
  if (invite.error || !invite.data.user) return safeError('No fue posible enviar la invitacion.', 503, headers)

  const { profile: existingProfile, error: existingProfileError } = await getProfile(supabase, invite.data.user.id)
  if (existingProfileError) return safeError('No fue posible validar el perfil existente.', 503, headers)
  if (existingProfile?.role === 'owner') return safeError('Este usuario ya es administrador y no puede convertirse en colaborador.', 409, headers)
  if (existingProfile?.invitation_status === 'accepted' || existingProfile?.onboarding_completed_at) {
    return safeError('Este colaborador ya completo su invitacion.', 409, headers)
  }

  const now = new Date().toISOString()
  const profile = {
    id: invite.data.user.id,
    email,
    full_name: fullName ?? existingProfile?.full_name ?? null,
    role: 'collaborator',
    is_active: true,
    invitation_status: 'pending',
    invited_at: now,
    invitation_sent_at: now,
    invitation_revoked_at: null,
    onboarding_completed_at: null,
    invited_by: invitedBy,
  }

  const { data: collaborator, error } = await supabase
    .from('admin_profiles')
    .upsert(profile, { onConflict: 'id' })
    .select(collaboratorColumns())
    .single()

  if (error) return safeError('La invitacion fue enviada, pero no fue posible crear el perfil.', 503, headers)
  return json({ ok: true, collaborator }, { status: 201, headers })
}

Deno.serve(async (request) => {
  const allowedOrigins = parseCsv(Deno.env.get('PUBLIC_SITE_ORIGINS'))
  const origin = request.headers.get('Origin')
  const headers = corsHeaders(origin, allowedOrigins)

  if (!isAllowedOrigin(origin, allowedOrigins)) return safeError('Solicitud no permitida.', 403, headers)
  if (request.method === 'OPTIONS') return json({ ok: true }, { status: 200, headers })
  if (request.method !== 'POST') return safeError('Metodo no permitido.', 405, headers)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return safeError('Configuracion incompleta.', 503, headers)

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const authenticated = await requireAuthenticatedUser(supabase, request)
  if (authenticated.error || !authenticated.userId) return safeError('No autorizado.', 403, headers)

  const body = await request.json().catch(() => null) as InviteBody | null
  const action = body?.action ?? 'invite'

  if (action === 'complete-onboarding') {
    const { profile, error } = await getProfile(supabase, authenticated.userId)
    if (error || !profile || profile.role !== 'collaborator' || !profile.is_active || profile.invitation_status === 'revoked') {
      return safeError('La invitacion no es valida o ha expirado.', 403, headers)
    }

    const now = new Date().toISOString()
    const { data: collaborator, error: updateError } = await supabase
      .from('admin_profiles')
      .update({ invitation_status: 'accepted', onboarding_completed_at: now, invitation_revoked_at: null })
      .eq('id', authenticated.userId)
      .eq('role', 'collaborator')
      .select(collaboratorColumns())
      .single()

    if (updateError) return safeError('No fue posible completar la activacion.', 503, headers)
    return json({ ok: true, collaborator }, { status: 200, headers })
  }

  if (!(await requireAdmin(supabase, authenticated.userId))) return safeError('No autorizado.', 403, headers)

  if (action === 'invite') {
    const email = body?.email?.trim().toLowerCase() ?? ''
    const fullName = body?.fullName?.trim() || null
    if (!validEmail(email)) return safeError('Ingresa un correo valido.', 400, headers)
    return inviteCollaborator(supabase, email, fullName, authenticated.userId, headers)
  }

  const userId = body?.userId?.trim() ?? ''
  if (!validUuid(userId)) return safeError('Colaborador no valido.', 400, headers)

  const { profile, error } = await getProfile(supabase, userId)
  if (error || !profile) return safeError('Colaborador no encontrado.', 404, headers)
  if (profile.role === 'owner') return safeError('No se puede modificar un administrador owner desde esta accion.', 403, headers)

  if (action === 'reissue') {
    if (profile.invitation_status === 'accepted' || profile.onboarding_completed_at) {
      return safeError('Este colaborador ya completo su invitacion.', 409, headers)
    }
    if (await hasCollaboratorHistory(supabase, userId)) {
      return safeError('No se puede reenviar automaticamente porque existen referencias asociadas.', 409, headers)
    }
    if (!profile.email || !validEmail(profile.email)) return safeError('El colaborador no tiene email valido.', 400, headers)

    const { error: deleteProfileError } = await supabase.from('admin_profiles').delete().eq('id', userId).eq('role', 'collaborator')
    if (deleteProfileError) return safeError('No fue posible preparar el reenvio de la invitacion.', 503, headers)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteUserError) return safeError('No fue posible invalidar la invitacion anterior.', 503, headers)
    return inviteCollaborator(supabase, profile.email, profile.full_name, authenticated.userId, headers)
  }

  if (action === 'revoke') {
    if (profile.invitation_status === 'accepted' || profile.onboarding_completed_at) {
      return safeError('No se puede revocar una invitacion ya aceptada.', 409, headers)
    }

    const { data: collaborator, error: updateError } = await supabase
      .from('admin_profiles')
      .update({ invitation_status: 'revoked', is_active: false, invitation_revoked_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('role', 'collaborator')
      .select(collaboratorColumns())
      .single()
    if (updateError) return safeError('No fue posible revocar la invitacion.', 503, headers)
    return json({ ok: true, collaborator }, { status: 200, headers })
  }

  if (action === 'remove') {
    if (profile.invitation_status === 'accepted' || profile.onboarding_completed_at) {
      return safeError('No se puede eliminar un colaborador que ya completo su invitacion.', 409, headers)
    }
    if (await hasCollaboratorHistory(supabase, userId)) {
      return safeError('No se puede eliminar porque existen referencias o historial asociado.', 409, headers)
    }

    const { error: deleteProfileError } = await supabase.from('admin_profiles').delete().eq('id', userId).eq('role', 'collaborator')
    if (deleteProfileError) return safeError('No fue posible eliminar el perfil pendiente.', 503, headers)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteUserError) return safeError('El perfil fue eliminado, pero no fue posible eliminar el usuario Auth.', 503, headers)
    return json({ ok: true, removed: true }, { status: 200, headers })
  }

  return safeError('Accion no permitida.', 400, headers)
})
