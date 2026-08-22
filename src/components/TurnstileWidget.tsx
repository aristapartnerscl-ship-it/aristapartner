import { useEffect, useRef, useState } from 'react'

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('turnstile_load_failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile_load_failed'))
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

export function TurnstileWidget({
  siteKey,
  enabled,
  onToken,
  onError,
  resetSignal,
}: {
  siteKey: string
  enabled: boolean
  onToken: (token: string) => void
  onError: () => void
  resetSignal: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!enabled || !siteKey || !containerRef.current) return
    let cancelled = false
    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current || widgetRef.current) return
        widgetRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => {
            setStatus('Verificacion completada.')
            onToken(token)
          },
          'error-callback': () => {
            setStatus('No fue posible completar la verificacion.')
            onError()
          },
          'expired-callback': () => {
            setStatus('La verificacion expiro.')
            onError()
          },
        })
      })
      .catch(() => {
        setStatus('No fue posible cargar la verificacion.')
        onError()
      })

    return () => {
      cancelled = true
      if (widgetRef.current && window.turnstile?.remove) window.turnstile.remove(widgetRef.current)
      widgetRef.current = null
    }
  }, [enabled, onError, onToken, siteKey])

  useEffect(() => {
    if (widgetRef.current && window.turnstile) window.turnstile.reset(widgetRef.current)
  }, [resetSignal])

  if (!enabled) return null

  return (
    <div className="grid gap-2">
      <div ref={containerRef} />
      <p className="text-sm text-text-muted" aria-live="polite">{status}</p>
    </div>
  )
}
