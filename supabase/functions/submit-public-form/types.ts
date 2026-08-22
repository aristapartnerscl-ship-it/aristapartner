export type SubmissionType = 'buy' | 'sell' | 'supplier' | 'contact'

export type PublicFormRequest = {
  submissionType: SubmissionType
  data: Record<string, unknown>
  consentContact: boolean
  consentMarketing?: boolean
  privacyVersion: string
  turnstileToken: string
  website: string
}

export type ValidatedSubmission = {
  submissionType: SubmissionType
  payload: Record<string, string | number | boolean | null | string[]>
  consentContact: boolean
  consentMarketing: boolean
  privacyVersion: string
}

export type ValidationResult =
  | { ok: true; value: ValidatedSubmission }
  | { ok: false; reason: 'validation' | 'honeypot'; message: string }

export type TurnstileSiteverifyResponse = {
  success?: boolean
  hostname?: string
  challenge_ts?: string
  action?: string
  cdata?: string
  'error-codes'?: string[]
}
