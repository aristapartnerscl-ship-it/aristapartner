import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TurnstileWidget } from '../TurnstileWidget'
import { getInitialFormData, type OpportunityFormConfig } from '../../data/opportunityForms'
import { currentPrivacyVersion, publicFormsEnabled, submitPublicForm, turnstileSiteKey, type PublicSubmissionType } from '../../lib/public-forms'
import { FormSection } from './FormSection'

type OpportunityFormProps = {
  config: OpportunityFormConfig
}

type ConsentState = {
  accuracy: boolean
  marketing: boolean
}

export function OpportunityForm({ config }: OpportunityFormProps) {
  const initialValues = useMemo(() => getInitialFormData(config), [config])
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [consent, setConsent] = useState<ConsentState>({ accuracy: false, marketing: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const isErrorStatus = status.startsWith('Revisa')

  useEffect(() => {
    setValues(initialValues)
    setConsent({ accuracy: false, marketing: false })
    setErrors({})
    setStatus('')
  }, [initialValues])

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    setStatus('')
  }

  function validate() {
    const nextErrors: Record<string, string> = {}

    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !values[field.name]?.trim()) {
          nextErrors[field.name] = 'Este campo es obligatorio.'
        }
        if (field.type === 'email' && values[field.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.name])) {
          nextErrors[field.name] = 'Ingresa un correo electrónico válido.'
        }
      })
    })

    if (!consent.accuracy) {
      nextErrors.accuracy = 'Debes aceptar esta declaración para continuar.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken('')
  }, [])

  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    if (!validate()) {
      setStatus('Revisa los campos marcados antes de continuar.')
      window.setTimeout(() => statusRef.current?.focus(), 0)
      return
    }

    if (!publicFormsEnabled) {
      setStatus('El formulario está completo y listo para enviarse. La recepción digital será habilitada próximamente.')
      window.setTimeout(() => statusRef.current?.focus(), 0)
      return
    }

    if (!turnstileSiteKey) {
      setStatus('Revisa la configuracion de seguridad antes de enviar.')
      window.setTimeout(() => statusRef.current?.focus(), 0)
      return
    }

    if (!turnstileToken) {
      setStatus('Completa la verificacion de seguridad antes de enviar.')
      window.setTimeout(() => statusRef.current?.focus(), 0)
      return
    }

    const typeMap: Record<string, PublicSubmissionType> = { comprar: 'buy', vender: 'sell', proveedor: 'supplier' }
    setSubmitting(true)
    const result = await submitPublicForm({
      submissionType: typeMap[config.type],
      data: values,
      consentContact: consent.accuracy,
      consentMarketing: consent.marketing,
      privacyVersion: currentPrivacyVersion(),
      turnstileToken,
      website: '',
    })
    setSubmitting(false)
    setTurnstileToken('')
    setTurnstileReset((current) => current + 1)
    if (!result.ok || !result.submissionId) {
      setStatus(result.message)
      window.setTimeout(() => statusRef.current?.focus(), 0)
      return
    }

    setValues(initialValues)
    setConsent({ accuracy: false, marketing: false })
    setErrors({})
    setStatus(result.message)
    window.setTimeout(() => statusRef.current?.focus(), 0)
  }

  function clearForm() {
    const confirmed = window.confirm('¿Quieres limpiar este formulario? Esta acción no se puede deshacer.')
    if (!confirmed) {
      return
    }

    setValues(initialValues)
    setConsent({ accuracy: false, marketing: false })
    setErrors({})
    setStatus('')
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
      <div className="rounded-lg border border-brand/20 bg-surface-muted p-5">
        <p className="text-sm font-medium text-graphite">Los campos marcados con * son obligatorios.</p>
      </div>

      {config.sections.map((section) => (
        <FormSection
          key={section.title}
          section={section}
          values={values}
          errors={errors}
          formType={config.type}
          onChange={updateValue}
        />
      ))}

      <section className="card-elevated rounded-lg border bg-white p-5">
        <div className="grid gap-4">
          <label className="flex items-start gap-3 text-sm leading-6 text-text-muted">
            <input
              type="checkbox"
              checked={consent.accuracy}
              onChange={(event) => {
                setConsent((current) => ({ ...current, accuracy: event.target.checked }))
                setErrors((current) => {
                  const next = { ...current }
                  delete next.accuracy
                  return next
                })
              }}
              className="mt-1 h-4 w-4 shrink-0 accent-brand"
              aria-invalid={Boolean(errors.accuracy)}
              aria-describedby={errors.accuracy ? `${config.type}-accuracy-error` : undefined}
            />
            <span>
              Declaro que la información proporcionada es correcta y autorizo a Arista Partners a contactarme para
              evaluar esta oportunidad. <span className="text-red-700">*</span>
            </span>
          </label>
          {errors.accuracy && (
            <p id={`${config.type}-accuracy-error`} className="text-sm font-medium text-red-700">
              {errors.accuracy}
            </p>
          )}

          <label className="flex items-start gap-3 text-sm leading-6 text-text-muted">
            <input
              type="checkbox"
              checked={consent.marketing}
              onChange={(event) => setConsent((current) => ({ ...current, marketing: event.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 accent-brand"
            />
            <span>Acepto recibir información relacionada con oportunidades y servicios de Arista Partners.</span>
          </label>

          <Link to="/privacidad" className="w-fit text-sm font-semibold text-brand hover:text-graphite">
            Ver política de privacidad
          </Link>
        </div>
      </section>

      <div className="rounded-lg border border-graphite/15 bg-surface-muted p-5">
        <p className="text-sm leading-6 text-text-muted">
          Enviar este formulario no garantiza la aceptación ni el cierre de una operación. Arista Partners revisará los
          antecedentes y podrá solicitar información adicional antes de iniciar una gestión comercial.
        </p>
      </div>

      {status && (
        <div
          ref={statusRef}
          tabIndex={-1}
          className="rounded-lg border border-brand/30 bg-white p-4 text-sm font-medium text-graphite"
          role={isErrorStatus ? 'alert' : 'status'}
          aria-live={isErrorStatus ? 'assertive' : 'polite'}
        >
          {status}
        </div>
      )}

      {publicFormsEnabled && (
        <section className="card-elevated rounded-lg border bg-white p-5">
          {turnstileSiteKey ? (
            <TurnstileWidget siteKey={turnstileSiteKey} enabled onToken={handleTurnstileToken} onError={handleTurnstileError} resetSignal={turnstileReset} />
          ) : (
            <p className="text-sm font-medium text-red-700" role="alert">La verificacion de seguridad no esta configurada.</p>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          {publicFormsEnabled ? 'Enviar formulario' : 'Revisar formulario'}
        </button>
        <button
          type="button"
          onClick={clearForm}
          className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-graphite shadow-sm transition hover:border-brand"
        >
          Limpiar formulario
        </button>
      </div>
    </form>
  )
}
