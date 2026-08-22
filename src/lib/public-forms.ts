import { legalConfig } from '../data/legal'
import { supabase } from './supabase'

export const publicFormsEnabled = import.meta.env.VITE_PUBLIC_FORMS_ENABLED === 'true'
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

export type PublicSubmissionType = 'buy' | 'sell' | 'supplier' | 'contact'

export type PublicSubmissionRequest = {
  submissionType: PublicSubmissionType
  data: Record<string, string | string[] | number | boolean | null>
  consentContact: boolean
  consentMarketing: boolean
  privacyVersion: string
  turnstileToken: string
  website: string
}

export type PublicSubmissionResult = {
  ok: boolean
  submissionId?: string | null
  message: string
}

export function currentPrivacyVersion() {
  return legalConfig.privacy.version ?? ''
}

export async function submitPublicForm(request: PublicSubmissionRequest): Promise<PublicSubmissionResult> {
  if (!supabase) return { ok: false, message: 'La recepcion digital no esta configurada.' }

  const { data, error } = await supabase.functions.invoke<PublicSubmissionResult>('submit-public-form', {
    body: request,
  })

  if (error || !data?.ok) {
    return { ok: false, message: data?.message ?? 'No fue posible enviar el formulario. Intenta nuevamente.' }
  }

  return data
}

export function resetTurnstile(widgetId: string | null) {
  const turnstile = window.turnstile
  if (!turnstile || widgetId === null) return
  turnstile.reset(widgetId)
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'error-callback': () => void; 'expired-callback': () => void }) => string
      reset: (widgetId: string) => void
      remove?: (widgetId: string) => void
    }
  }
}
