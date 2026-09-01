import { describe, expect, test, vi } from 'vitest'
import { buildSubmissionEmail, escapeHtml, INTERNAL_NOTIFICATION_EMAIL, resolveNotificationRecipient, sendSubmissionEmail } from './email-notification.ts'
import type { SubmissionType, ValidatedSubmission } from './types.ts'

const baseSubmission = (submissionType: SubmissionType, payload: Record<string, string | number | boolean | null | string[]>): ValidatedSubmission => ({
  submissionType,
  payload,
  consentContact: true,
  consentMarketing: false,
  privacyVersion: '1.0',
})

describe('submit-public-form email notifications', () => {
  test.each([
    ['contact', '[Nuevo contacto] Arista Partners'],
    ['buy', '[Nueva solicitud] Quiero comprar - Arista Partners'],
    ['sell', '[Nueva solicitud] Quiero vender - Arista Partners'],
    ['supplier', '[Nuevo proveedor] Arista Partners'],
  ] satisfies Array<[SubmissionType, string]>)('uses the expected subject for %s', (submissionType, subject) => {
    expect(buildSubmissionEmail(baseSubmission(submissionType, { fullName: 'Ana Torres', email: 'ana@example.com' }), new Date('2026-08-31T21:30:00.000Z')).subject).toBe(subject)
  })

  test('always targets the internal mailbox and never the public mailbox', () => {
    expect(resolveNotificationRecipient()).toBe(INTERNAL_NOTIFICATION_EMAIL)
    expect(resolveNotificationRecipient('contacto@aristapartners.cl')).toBe(INTERNAL_NOTIFICATION_EMAIL)
    expect(resolveNotificationRecipient(INTERNAL_NOTIFICATION_EMAIL)).toBe(INTERNAL_NOTIFICATION_EMAIL)
  })

  test('uses a valid visitor email as Reply-To without using it as From', () => {
    const email = buildSubmissionEmail(baseSubmission('contact', { fullName: 'Ana Torres', email: 'ana@example.com' }))
    expect(email.reply_to).toBe('ana@example.com')
    expect(email.from).toBe('')
  })

  test('omits empty fields and keeps the HTML and text versions useful', () => {
    const email = buildSubmissionEmail(baseSubmission('buy', { fullName: 'Ana Torres', email: 'ana@example.com', phone: null, need: '', needDetail: 'Necesitamos evaluar alternativas.' }), new Date('2026-08-31T21:30:00.000Z'))
    expect(email.text).toContain('Nombre:\nAna Torres')
    expect(email.text).toContain('Detalle de la necesidad:\nNecesitamos evaluar alternativas.')
    expect(email.text).not.toContain('Teléfono')
    expect(email.html).not.toContain('undefined')
    expect(email.html).not.toContain('null')
  })

  test('escapes visitor-controlled content before inserting it into HTML', () => {
    const malicious = '<script>alert("x")</script>&'
    const email = buildSubmissionEmail(baseSubmission('contact', { fullName: malicious, email: 'ana@example.com', message: malicious }))
    expect(escapeHtml(malicious)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;')
    expect(email.html).not.toContain(malicious)
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.text).toContain(malicious)
  })

  test('sends exactly one request when configured and never includes the API key in the message', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const apiKey = 'secret-resend-key'
    await expect(sendSubmissionEmail(baseSubmission('sell', { fullName: 'Ana Torres', email: 'ana@example.com' }), { resendApiKey: apiKey, notificationFrom: 'Arista Partners <verified@example.com>' }, fetcher, new Date('2026-08-31T21:30:00.000Z'))).resolves.toEqual({ ok: true, sent: true })
    expect(fetcher).toHaveBeenCalledTimes(1)
    const request = fetcher.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(request.body)) as Record<string, unknown>
    expect(request.headers).toEqual({ Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' })
    expect(body.to).toEqual([INTERNAL_NOTIFICATION_EMAIL])
    expect(body.reply_to).toBe('ana@example.com')
    expect(JSON.stringify(body.html)).not.toContain(apiKey)
  })

  test('does not attempt delivery when server configuration is incomplete', async () => {
    const fetcher = vi.fn()
    await expect(sendSubmissionEmail(baseSubmission('supplier', { fullName: 'Ana Torres' }), { notificationFrom: 'verified@example.com' }, fetcher)).resolves.toEqual({ ok: false, sent: false })
    expect(fetcher).not.toHaveBeenCalled()
  })

  test('does not expose provider errors and treats delivery failure as secondary', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('provider secret details', { status: 500 }))
    const log = vi.fn()
    await expect(sendSubmissionEmail(baseSubmission('contact', { fullName: 'Ana Torres' }), { resendApiKey: 'secret', notificationFrom: 'verified@example.com' }, fetcher, new Date(), log)).resolves.toEqual({ ok: false, sent: false })
    expect(log).toHaveBeenCalledWith('Notification email failed', { status: 500 })
    expect(log.mock.calls.flat().join(' ')).not.toContain('secret')
    expect(log.mock.calls.flat().join(' ')).not.toContain('Ana Torres')
  })

  test('does not send with an invalid Reply-To address', () => {
    const email = buildSubmissionEmail(baseSubmission('contact', { fullName: 'Ana Torres', email: 'not-an-email' }))
    expect(email.reply_to).toBeUndefined()
  })
})
