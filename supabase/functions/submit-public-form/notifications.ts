import type { SubmissionType } from './types.ts'

export type AdminNotificationInsert = {
  recipient_id: string
  notification_type: 'form_submission_received'
  entity_type: 'form_submission'
  entity_id: string
  title: string
  message: string
  action_path: string
}

type AdminOwnerRow = {
  id: string
}

type ExistingNotificationRow = {
  recipient_id: string
}

type QueryError = {
  code?: string | null
}

type QueryResult<T> = {
  data: T | null
  error: QueryError | null
}

export type AdminNotificationFailureCode =
  | 'owners_lookup_failed'
  | 'notification_lookup_failed'
  | 'notification_insert_failed'

export type AdminNotificationStore = {
  listActiveOwnerIds(): Promise<QueryResult<AdminOwnerRow[]>>
  listExistingFormSubmissionNotifications(submissionId: string, recipientIds: string[]): Promise<QueryResult<ExistingNotificationRow[]>>
  insertAdminNotifications(rows: AdminNotificationInsert[]): Promise<QueryResult<null>>
}

type SupabaseQuery<T> = PromiseLike<QueryResult<T>> & {
  eq(column: string, value: boolean | string): SupabaseQuery<T>
  in(column: string, values: string[]): Promise<QueryResult<T>>
}

type SupabaseAdminProfilesTable = {
  select(columns: string): SupabaseQuery<AdminOwnerRow[]>
}

type SupabaseAdminNotificationsTable = {
  select(columns: string): SupabaseQuery<ExistingNotificationRow[]>
  insert(rows: AdminNotificationInsert[]): Promise<QueryResult<null>>
}

type SupabaseNotificationClient = {
  from(table: 'admin_profiles'): SupabaseAdminProfilesTable
  from(table: 'admin_notifications'): SupabaseAdminNotificationsTable
}

const notificationTitles: Record<SubmissionType, string> = {
  contact: 'Nueva consulta recibida',
  buy: 'Nueva solicitud de compra',
  sell: 'Nueva oferta de venta',
  supplier: 'Nueva postulación de proveedor',
}

const notificationMessage = 'Hay una nueva recepcion publica pendiente de revision administrativa.'
export const adminNotificationActionPath = '/admin/recepciones'

export function notificationTitleForSubmissionType(submissionType: SubmissionType) {
  return notificationTitles[submissionType]
}

export function isInternalAdminActionPath(actionPath: string) {
  return actionPath.startsWith('/admin/') && !actionPath.startsWith('/admin//') && !actionPath.includes('://') && !/\s/.test(actionPath)
}

export function buildAdminNotification(recipientId: string, submissionId: string, submissionType: SubmissionType): AdminNotificationInsert {
  if (!isInternalAdminActionPath(adminNotificationActionPath)) {
    throw new Error('Invalid admin notification action path')
  }
  return {
    recipient_id: recipientId,
    notification_type: 'form_submission_received',
    entity_type: 'form_submission',
    entity_id: submissionId,
    title: notificationTitleForSubmissionType(submissionType),
    message: notificationMessage,
    action_path: adminNotificationActionPath,
  }
}

export function isDuplicateAdminNotificationError(error: QueryError | null) {
  return error?.code === '23505'
}

export function createSupabaseAdminNotificationStore(supabase: SupabaseNotificationClient): AdminNotificationStore {
  return {
    listActiveOwnerIds() {
      return supabase
        .from('admin_profiles')
        .select('id')
        .eq('role', 'owner')
        .eq('is_active', true)
    },
    listExistingFormSubmissionNotifications(submissionId, recipientIds) {
      return supabase
        .from('admin_notifications')
        .select('recipient_id')
        .eq('notification_type', 'form_submission_received')
        .eq('entity_type', 'form_submission')
        .eq('entity_id', submissionId)
        .in('recipient_id', recipientIds)
    },
    insertAdminNotifications(rows) {
      return supabase.from('admin_notifications').insert(rows)
    },
  }
}

export async function createAdminNotifications(
  store: AdminNotificationStore,
  submissionId: string,
  submissionType: SubmissionType,
  logFailure: (code: AdminNotificationFailureCode) => void = logAdminNotificationFailure,
) {
  const owners = await store.listActiveOwnerIds()
  if (owners.error) {
    logFailure('owners_lookup_failed')
    return { ok: false as const, inserted: 0 }
  }

  const recipientIds = Array.from(new Set((owners.data ?? []).map((owner) => owner.id).filter(Boolean)))
  if (recipientIds.length === 0) return { ok: true as const, inserted: 0 }

  const existing = await store.listExistingFormSubmissionNotifications(submissionId, recipientIds)
  if (existing.error) {
    logFailure('notification_lookup_failed')
    return { ok: false as const, inserted: 0 }
  }

  const existingRecipientIds = new Set((existing.data ?? []).map((notification) => notification.recipient_id))
  const rows = recipientIds
    .filter((recipientId) => !existingRecipientIds.has(recipientId))
    .map((recipientId) => buildAdminNotification(recipientId, submissionId, submissionType))

  if (rows.length === 0) return { ok: true as const, inserted: 0 }

  const inserted = await store.insertAdminNotifications(rows)
  if (inserted.error) {
    if (isDuplicateAdminNotificationError(inserted.error)) return { ok: true as const, inserted: 0 }
    logFailure('notification_insert_failed')
    return { ok: false as const, inserted: 0 }
  }

  return { ok: true as const, inserted: rows.length }
}

export function logAdminNotificationFailure(code: AdminNotificationFailureCode) {
  console.warn('submit-public-form notification skipped', { code })
}
