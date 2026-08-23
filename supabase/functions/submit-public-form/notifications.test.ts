import { describe, expect, test, vi } from 'vitest'
import {
  adminNotificationActionPath,
  buildAdminNotification,
  createAdminNotifications,
  isInternalAdminActionPath,
  notificationTitleForSubmissionType,
  type AdminNotificationFailureCode,
  type AdminNotificationInsert,
  type AdminNotificationStore,
} from './notifications.ts'
import type { SubmissionType } from './types.ts'

const submissionId = '00000000-0000-4000-8000-000000000001'
const ownerId = '00000000-0000-4000-8000-000000000010'
const secondOwnerId = '00000000-0000-4000-8000-000000000011'
const payloadRecipientId = '00000000-0000-4000-8000-000000000099'

function createStore({
  owners = [{ id: ownerId }],
  existing = [],
  ownerError = null,
  existingError = null,
  insertError = null,
}: {
  owners?: Array<{ id: string }>
  existing?: Array<{ recipient_id: string }>
  ownerError?: { code?: string | null } | null
  existingError?: { code?: string | null } | null
  insertError?: { code?: string | null } | null
} = {}) {
  const insertedRows: AdminNotificationInsert[][] = []
  const calls: string[] = []
  const store: AdminNotificationStore = {
    async listActiveOwnerIds() {
      calls.push('owners')
      return { data: owners, error: ownerError }
    },
    async listExistingFormSubmissionNotifications(id, recipientIds) {
      calls.push(`existing:${id}:${recipientIds.join(',')}`)
      return { data: existing, error: existingError }
    },
    async insertAdminNotifications(rows) {
      calls.push('insert')
      insertedRows.push(rows)
      return { data: null, error: insertError }
    },
  }

  return { store, insertedRows, calls }
}

describe('submit-public-form admin notifications', () => {
  test.each([
    ['contact', 'Nueva consulta recibida'],
    ['buy', 'Nueva solicitud de compra'],
    ['sell', 'Nueva oferta de venta'],
    ['supplier', 'Nueva postulación de proveedor'],
  ] satisfies Array<[SubmissionType, string]>)('uses the Spanish title for %s submissions', (type, title) => {
    expect(notificationTitleForSubmissionType(type)).toBe(title)
  })

  test('creates one notification per active owner returned by the server-side lookup', async () => {
    const { store, insertedRows, calls } = createStore({
      owners: [{ id: ownerId }, { id: secondOwnerId }],
    })

    const result = await createAdminNotifications(store, submissionId, 'buy', vi.fn())

    expect(result).toEqual({ ok: true, inserted: 2 })
    expect(calls).toEqual(['owners', `existing:${submissionId}:${ownerId},${secondOwnerId}`, 'insert'])
    expect(insertedRows[0]).toHaveLength(2)
    expect(insertedRows[0].map((row) => row.recipient_id)).toEqual([ownerId, secondOwnerId])
  })

  test('does not accept recipients or entity data from the public payload', async () => {
    const { store, insertedRows } = createStore({ owners: [{ id: ownerId }] })
    const publicPayload = {
      recipient_id: payloadRecipientId,
      entity_id: '00000000-0000-4000-8000-000000000098',
      action_path: 'https://evil.example/admin/recepciones',
      title: 'Injected title',
    }

    await createAdminNotifications(store, submissionId, 'sell', vi.fn())

    expect(insertedRows[0][0].recipient_id).toBe(ownerId)
    expect(insertedRows[0][0].entity_id).toBe(submissionId)
    expect(insertedRows[0][0].action_path).toBe('/admin/recepciones')
    expect(insertedRows[0][0].title).toBe('Nueva oferta de venta')
    expect(JSON.stringify(insertedRows[0][0])).not.toContain(publicPayload.recipient_id)
    expect(JSON.stringify(insertedRows[0][0])).not.toContain(publicPayload.action_path)
    expect(JSON.stringify(insertedRows[0][0])).not.toContain(publicPayload.title)
  })

  test('keeps title, message and failure logs free of public PII', async () => {
    const pii = ['Ana Torres', 'ana@example.com', '+569 1234 5678']
    const logCodes: AdminNotificationFailureCode[] = []
    const { store } = createStore({ insertError: { code: '500' } })
    const row = buildAdminNotification(ownerId, submissionId, 'contact')

    await createAdminNotifications(store, submissionId, 'contact', (code) => logCodes.push(code))

    for (const value of pii) {
      expect(row.title).not.toContain(value)
      expect(row.message).not.toContain(value)
      expect(logCodes.join(' ')).not.toContain(value)
    }
    expect(logCodes).toEqual(['notification_insert_failed'])
  })

  test('is idempotent by skipping existing recipients and treating unique violations as benign', async () => {
    const existingCase = createStore({
      owners: [{ id: ownerId }, { id: secondOwnerId }],
      existing: [{ recipient_id: ownerId }],
    })

    await createAdminNotifications(existingCase.store, submissionId, 'supplier', vi.fn())

    expect(existingCase.insertedRows[0]).toEqual([
      expect.objectContaining({ recipient_id: secondOwnerId }),
    ])

    const duplicateCase = createStore({ insertError: { code: '23505' } })
    const logFailure = vi.fn()
    const result = await createAdminNotifications(duplicateCase.store, submissionId, 'supplier', logFailure)

    expect(result).toEqual({ ok: true, inserted: 0 })
    expect(logFailure).not.toHaveBeenCalled()
  })

  test('does not throw when notification creation fails', async () => {
    const { store, insertedRows } = createStore({ insertError: { code: '42501' } })
    const logFailure = vi.fn()

    await expect(createAdminNotifications(store, submissionId, 'buy', logFailure)).resolves.toEqual({ ok: false, inserted: 0 })

    expect(insertedRows).toHaveLength(1)
    expect(logFailure).toHaveBeenCalledWith('notification_insert_failed')
  })

  test('requires an internal admin action path', () => {
    expect(adminNotificationActionPath).toBe('/admin/recepciones')
    expect(isInternalAdminActionPath(adminNotificationActionPath)).toBe(true)
    expect(isInternalAdminActionPath('https://example.com/admin/recepciones')).toBe(false)
    expect(isInternalAdminActionPath('/admin//recepciones')).toBe(false)
    expect(isInternalAdminActionPath('/public/recepciones')).toBe(false)
  })
})
