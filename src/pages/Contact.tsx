import {
  ArrowRight,
  BriefcaseBusiness,
  Factory,
  HelpCircle,
  MessageSquareText,
  ShieldAlert,
  ShoppingCart,
} from 'lucide-react'
import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { FieldError } from '../components/opportunities/FieldError'
import { SectionHeader } from '../components/SectionHeader'
import { contactChannels } from '../data/contact'
import { currentPrivacyVersion, publicFormsEnabled, submitPublicForm, turnstileSiteKey } from '../lib/public-forms'

type ContactFormData = {
  fullName: string
  organization: string
  role: string
  email: string
  phone: string
  country: string
  cityRegion: string
  reason: string
  subject: string
  message: string
  preferredContact: string
}

type ConsentState = {
  accuracy: boolean
  marketing: boolean
}

const initialForm: ContactFormData = {
  fullName: '',
  organization: '',
  role: '',
  email: '',
  phone: '',
  country: '',
  cityRegion: '',
  reason: '',
  subject: '',
  message: '',
  preferredContact: 'Correo electrónico',
}

const reasons = [
  'Consulta sobre servicios',
  'Consulta sobre representación comercial',
  'Consulta sobre búsqueda de proveedores',
  'Consulta sobre oportunidades B2B',
  'Propuesta de colaboración',
  'Prensa o comunicación',
  'Otro',
]

const orientationCards = [
  {
    icon: ShoppingCart,
    title: 'Necesito comprar',
    text: 'Presenta una necesidad de compra y entrega los antecedentes necesarios para buscar proveedores o soluciones.',
    action: 'Presentar una necesidad',
    href: '/oportunidades?tipo=comprar',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Quiero vender',
    text: 'Cuéntanos sobre el producto, servicio o capacidad comercial que deseas presentar a potenciales compradores.',
    action: 'Presentar mi oferta',
    href: '/oportunidades?tipo=vender',
  },
  {
    icon: Factory,
    title: 'Quiero ser proveedor',
    text: 'Registra los antecedentes de tu empresa y los productos o servicios que puedes suministrar.',
    action: 'Postular como proveedor',
    href: '/oportunidades?tipo=proveedor',
  },
  {
    icon: MessageSquareText,
    title: 'Tengo una consulta general',
    text: 'Utiliza el formulario de contacto para realizar preguntas sobre Arista Partners, sus servicios o su modelo de trabajo.',
    action: 'Ir al formulario',
    href: '#formulario-general',
  },
]

const responseSteps = [
  {
    title: 'Revisión de la consulta',
    text: 'Revisaremos el motivo y los antecedentes proporcionados para determinar cómo orientar la solicitud.',
  },
  {
    title: 'Contacto inicial',
    text: 'Si corresponde, responderemos por el medio indicado y podremos solicitar información adicional.',
  },
  {
    title: 'Derivación o evaluación',
    text: 'Las consultas generales serán respondidas directamente. Si se identifica una oportunidad comercial, podrá solicitarse completar el formulario especializado correspondiente.',
  },
]

const faqs = [
  {
    question: '¿Este formulario sirve para presentar una oportunidad?',
    answer:
      'Para una evaluación comercial más completa, utiliza los formularios de compra, venta o proveedor disponibles en la página Oportunidades.',
  },
  {
    question: '¿Puedo adjuntar documentos?',
    answer: 'Todavía no. La carga segura de documentos se habilitará en una etapa posterior.',
  },
  {
    question: '¿Enviar una consulta inicia una contratación?',
    answer:
      'No. Una contratación solamente comienza cuando el alcance, las condiciones y la modalidad de trabajo han sido aceptados expresamente.',
  },
]

export function Contact() {
  const [form, setForm] = useState<ContactFormData>(initialForm)
  const [consent, setConsent] = useState<ConsentState>({ accuracy: false, marketing: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const visibleChannels = contactChannels.filter((channel) => channel.value)
  const isErrorStatus = status.startsWith('Revisa')

  function updateField(name: keyof ContactFormData, value: string) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
    setStatus('')
  }

  function validate() {
    const nextErrors: Record<string, string> = {}

    if (!form.fullName.trim()) nextErrors.fullName = 'Ingresa tu nombre completo.'
    if (!form.email.trim()) {
      nextErrors.email = 'Ingresa tu correo electrónico.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Ingresa un correo electrónico válido.'
    }
    if (!form.country.trim()) nextErrors.country = 'Ingresa el país.'
    if (!form.reason) nextErrors.reason = 'Selecciona un motivo de contacto.'
    if (!form.subject.trim()) nextErrors.subject = 'Ingresa un asunto.'
    if (form.message.trim().length < 20) nextErrors.message = 'El mensaje debe tener al menos 20 caracteres.'
    if (form.preferredContact === 'Teléfono o WhatsApp' && !form.phone.trim()) {
      nextErrors.phone = 'Ingresa un teléfono o WhatsApp para usar este medio de contacto.'
    }
    if (!consent.accuracy) nextErrors.accuracy = 'Debes aceptar esta declaración para continuar.'

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
      setStatus('El formulario esta completo y listo para enviarse. La recepcion digital sera habilitada proximamente.')
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

    setSubmitting(true)
    const result = await submitPublicForm({
      submissionType: 'contact',
      data: form,
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

    setForm(initialForm)
    setConsent({ accuracy: false, marketing: false })
    setErrors({})
    setStatus(result.message)
    window.setTimeout(() => statusRef.current?.focus(), 0)
  }

  function clearForm() {
    const confirmed = window.confirm('¿Quieres limpiar el formulario general? Esta acción no se puede deshacer.')
    if (!confirmed) return

    setForm(initialForm)
    setConsent({ accuracy: false, marketing: false })
    setErrors({})
    setStatus('')
  }

  return (
    <>
      <section className="border-b border-border bg-surface-muted px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Contacto</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-5xl">
            Conversemos sobre tu consulta
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">
            Si tienes una consulta general sobre Arista Partners, nuestros servicios o la forma de trabajo, puedes
            completar el formulario. Para presentar una necesidad de compra, una oferta o un perfil de proveedor, utiliza
            el formulario de oportunidades correspondiente.
          </p>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Orientación" title="Elige el canal adecuado" text="Si quieres comprar, vender o ser proveedor, utiliza Oportunidades. Para una consulta general, continúa con este formulario." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {orientationCards.map((card) => {
              const Icon = card.icon
              const isAnchor = card.href.startsWith('#')
              const className =
                'mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-graphite'

              return (
                <article key={card.title} className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <Icon className="text-brand" size={28} />
                  <h2 className="mt-4 text-xl font-semibold text-graphite">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">{card.text}</p>
                  {isAnchor ? (
                    <a
                      href={card.href}
                      className={className}
                      onClick={() => {
                        window.setTimeout(() => document.getElementById('formulario-general')?.focus(), 0)
                      }}
                    >
                      {card.action} <ArrowRight size={17} />
                    </a>
                  ) : (
                    <Link to={card.href} className={className}>
                      {card.action} <ArrowRight size={17} />
                    </Link>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id="formulario-general" className="scroll-mt-28 bg-white px-5 py-16 lg:px-8" tabIndex={-1}>
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Formulario general"
            title="Envíanos una consulta"
            text="Completa los siguientes datos. Los campos marcados con asterisco son obligatorios."
          />
          <form className="rounded-lg border border-border bg-white p-5 shadow-sm sm:p-7" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField label="Nombre completo" name="fullName" value={form.fullName} error={errors.fullName} required onChange={updateField} />
              <TextField label="Empresa, marca u organización" name="organization" value={form.organization} error={errors.organization} onChange={updateField} />
              <TextField label="Cargo o actividad" name="role" value={form.role} error={errors.role} onChange={updateField} />
              <TextField label="Correo electrónico" name="email" type="email" value={form.email} error={errors.email} required onChange={updateField} />
              <TextField label="Teléfono o WhatsApp" name="phone" type="tel" value={form.phone} error={errors.phone} onChange={updateField} />
              <TextField label="País" name="country" value={form.country} error={errors.country} required onChange={updateField} />
              <TextField label="Ciudad o región" name="cityRegion" value={form.cityRegion} error={errors.cityRegion} onChange={updateField} />
              <SelectField label="Motivo de contacto" name="reason" value={form.reason} error={errors.reason} required options={reasons} onChange={updateField} />
              <TextField label="Asunto" name="subject" value={form.subject} error={errors.subject} required onChange={updateField} />
              <SelectField
                label="Medio de contacto preferido"
                name="preferredContact"
                value={form.preferredContact}
                error={errors.preferredContact}
                options={['Correo electrónico', 'Teléfono o WhatsApp', 'Cualquiera de los anteriores']}
                onChange={updateField}
              />
            </div>
            <TextAreaField label="Mensaje" name="message" value={form.message} error={errors.message} required onChange={updateField} />

            <div className="mt-7 grid gap-4 rounded-lg border border-border bg-surface-muted p-5">
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
                  aria-describedby={errors.accuracy ? 'contact-accuracy-error' : undefined}
                />
                <span>
                  Declaro que la información proporcionada es correcta y autorizo a Arista Partners a contactarme para
                  responder esta consulta. <span className="text-red-700">*</span>
                </span>
              </label>
              <FieldError id="contact-accuracy-error" message={errors.accuracy} />

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

            {status && (
              <div
                ref={statusRef}
                tabIndex={-1}
                className="mt-6 rounded-lg border border-brand/30 bg-white p-4 text-sm font-medium text-graphite"
                role={isErrorStatus ? 'alert' : 'status'}
                aria-live={isErrorStatus ? 'assertive' : 'polite'}
              >
                {status}
              </div>
            )}

            {publicFormsEnabled && (
              <div className="mt-6 rounded-lg border border-border bg-surface-muted p-5">
                {turnstileSiteKey ? (
                  <TurnstileWidget siteKey={turnstileSiteKey} enabled onToken={handleTurnstileToken} onError={handleTurnstileError} resetSignal={turnstileReset} />
                ) : (
                  <p className="text-sm font-medium text-red-700" role="alert">La verificacion de seguridad no esta configurada.</p>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={submitting} className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60">
                {publicFormsEnabled ? 'Enviar formulario' : 'Revisar formulario'}
              </button>
              <button type="button" onClick={clearForm} className="rounded-md border border-brand bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-surface-muted">
                Limpiar formulario
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Después del contacto" title="¿Qué ocurre después de contactarnos?" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {responseSteps.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-border bg-white p-6 shadow-sm">
                <span className="text-2xl font-semibold text-brand">0{index + 1}</span>
                <h2 className="mt-4 text-xl font-semibold text-graphite">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {visibleChannels.length > 0 && (
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="Canales directos" title="Canales oficiales" />
          <div className="rounded-lg border border-border bg-surface-muted p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {visibleChannels.map((channel) => (
                <div key={channel.label} className="rounded-md bg-white p-4">
                  <p className="text-sm font-semibold text-graphite">{channel.label}</p>
                  {channel.href ? (
                    <a className="mt-1 block text-sm text-brand" href={channel.href} target="_blank" rel="noopener noreferrer">
                      {channel.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-text-muted">{channel.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="bg-brand-dark px-5 py-16 text-on-brand lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border border-on-brand-border bg-on-brand-surface p-6">
            <ShieldAlert className="text-on-brand" size={30} />
            <h2 className="mt-4 text-2xl font-semibold text-on-brand">Protege tu información</h2>
            <p className="mt-3 text-sm leading-6 text-on-brand-muted">
              No envíes contraseñas, datos bancarios, información financiera sensible ni documentos confidenciales mediante el formulario general. Si una gestión requiere antecedentes adicionales, Arista indicará posteriormente un canal apropiado para compartirlos.
            </p>
            <Link to="/privacidad" className="mt-5 inline-flex text-sm font-semibold text-on-brand underline underline-offset-4 hover:text-white focus-visible:outline-white">Revisar Política de Privacidad</Link>
          </div>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-on-brand-border bg-on-brand-surface p-5">
                <HelpCircle className="text-on-brand" size={22} />
                <h2 className="mt-3 text-lg font-semibold text-on-brand">{faq.question}</h2>
                <p className="mt-2 text-sm leading-6 text-on-brand-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite px-5 py-12 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">¿Buscas presentar una oportunidad?</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">Utiliza el formulario especializado para entregar los antecedentes adecuados desde el comienzo.</p>
          </div>
          <Link to="/oportunidades" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-graphite transition hover:bg-surface-muted sm:w-fit">Ir a Oportunidades <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  )
}

type TextFieldProps = {
  label: string
  name: keyof ContactFormData
  value: string
  error?: string
  required?: boolean
  type?: string
  onChange: (name: keyof ContactFormData, value: string) => void
}

function TextField({ label, name, value, error, required, type = 'text', onChange }: TextFieldProps) {
  const id = `contact-${name}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-muted">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2">
        <FieldError id={`${id}-error`} message={error} />
      </div>
    </div>
  )
}

type SelectFieldProps = TextFieldProps & {
  options: string[]
}

function SelectField({ label, name, value, error, required, options, onChange }: SelectFieldProps) {
  const id = `contact-${name}`
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-muted">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <div className="mt-2">
        <FieldError id={`${id}-error`} message={error} />
      </div>
    </div>
  )
}

function TextAreaField({ label, name, value, error, required, onChange }: TextFieldProps) {
  const id = `contact-${name}`
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-sm font-medium text-text-muted">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 min-h-36 w-full resize-y rounded-md border border-border bg-white px-3 py-3 text-base text-slate-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2">
        <FieldError id={`${id}-error`} message={error} />
      </div>
    </div>
  )
}
