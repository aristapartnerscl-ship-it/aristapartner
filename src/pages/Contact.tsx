import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Factory,
  HelpCircle,
  Mail,
  MessageCircle,
  MessageSquareText,
  ShieldAlert,
  ShoppingCart,
} from 'lucide-react'
import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TurnstileWidget } from '../components/TurnstileWidget'
import { FieldError } from '../components/opportunities/FieldError'
import { SectionHeader } from '../components/SectionHeader'
import { publicContact } from '../data/contact'
import { currentPrivacyVersion, publicFormsEnabled, submitPublicForm, turnstileSiteKey } from '../lib/public-forms'

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-none stroke-current`} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" className="fill-current stroke-none" /></svg>
}

function FacebookIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.6 1.7-1.6h1.8V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8v3h2.6v8h2.9Z" /></svg>
}

function LinkedInIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className={`${className} fill-current`}><path d="M5.2 7.4a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM3.8 20.1h2.8V9.2H3.8v10.9Zm4.6 0h2.8v-6.1c0-1.6.3-3.1 2.3-3.1 1.9 0 1.9 1.8 1.9 3.2v6h2.8v-6.7c0-3.3-.7-5.8-4.5-5.8-1.8 0-3 .9-3.5 1.8h-.1V9.2H8.4v10.9Z" /></svg>
}

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

const contactLinks = [
  { label: 'WhatsApp', value: publicContact.phone, href: `https://wa.me/${publicContact.whatsappNumber}`, ariaLabel: 'Contactar Arista Partners por WhatsApp', Icon: MessageCircle, external: true },
  { label: 'Correo', value: publicContact.email, href: `mailto:${publicContact.email}`, ariaLabel: 'Enviar correo a Arista Partners', Icon: Mail, external: false },
  { label: 'Instagram', value: '@aristapartners', href: publicContact.instagram, ariaLabel: 'Instagram de Arista Partners', Icon: InstagramIcon, external: true },
  { label: 'Facebook', value: 'Arista Partners', href: publicContact.facebook, ariaLabel: 'Facebook de Arista Partners', Icon: FacebookIcon, external: true },
  { label: 'LinkedIn', value: 'Arista Partners', href: publicContact.linkedin, ariaLabel: 'LinkedIn de Arista Partners', Icon: LinkedInIcon, external: true },
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
      <section className="page-hero-dark px-5 py-14 sm:py-16 lg:px-8 lg:py-20">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.45fr)] lg:items-center">
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">Contacto</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Hablemos de su próxima oportunidad comercial
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">
            Ya sea que necesites comprar, vender, encontrar proveedores o desarrollar una oportunidad comercial, cuéntanos
            qué necesitas y revisaremos cómo podemos ayudarte.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`https://wa.me/${publicContact.whatsappNumber}?text=${encodeURIComponent('Hola Arista Partners, quisiera conversar sobre una oportunidad comercial.')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark" aria-label="Escribir por WhatsApp a Arista Partners"><MessageCircle size={18} aria-hidden="true" />Escribir por WhatsApp</a>
            <a href="#formulario-general" onClick={() => window.setTimeout(() => document.getElementById('contact-form-card')?.focus(), 0)} className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Completar formulario <ArrowRight size={17} aria-hidden="true" /></a>
          </div>
          </div>
          <div className="hidden justify-self-end lg:grid lg:h-56 lg:w-56 lg:place-items-center lg:rounded-full lg:border lg:border-white/20 lg:bg-white/5" aria-hidden="true"><div className="h-32 w-32 rotate-45 border border-brand/70 bg-brand/10" /></div>
        </div>
      </section>

      <section className="section-muted-depth bg-surface-muted px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Orientación" title="Elige el canal adecuado" text="Si quieres comprar, vender o ser proveedor, utiliza Oportunidades. Para una consulta general, continúa con este formulario." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {orientationCards.map((card) => {
              const Icon = card.icon
              const isAnchor = card.href.startsWith('#')
              const className =
                'mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-graphite'

              return (
                <article key={card.title} className="card-elevated card-accent-top rounded-lg border p-5">
                  <span className="icon-chip">
                    <Icon size={22} />
                  </span>
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

      <section id="formulario-general" className="contact-workspace scroll-mt-28 px-5 py-16 lg:px-8" tabIndex={-1}>
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-start">
          <div className="order-2 min-w-0 lg:order-1">
          <SectionHeader
            eyebrow="Formulario general"
            title="Envíanos una consulta"
            text="Completa los siguientes datos. Los campos marcados con asterisco son obligatorios."
          />
          <form id="contact-form-card" className="card-elevated mt-8 rounded-lg border bg-white p-5 sm:p-7" tabIndex={-1} onSubmit={handleSubmit} noValidate>
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
          <aside className="order-1 grid min-w-0 gap-6 lg:order-2">
            <article className="rounded-lg border border-graphite bg-graphite p-6 text-white shadow-sm">
              <h2 className="mt-4 text-2xl font-semibold">Diagnóstico inicial</h2>
              <p className="mt-3 text-sm leading-6 text-white/75">
                Conversemos sobre lo que necesitas comprar, vender o desarrollar. Podemos revisar tu contexto y definir el siguiente paso comercial.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <a
                  href={`https://wa.me/${publicContact.whatsappNumber}?text=${encodeURIComponent('Hola Arista Partners, quisiera conversar sobre una oportunidad comercial.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-graphite transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Escribir por WhatsApp a Arista Partners"
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  Escribir por WhatsApp
                </a>
                <a
                  href="#formulario-general"
                  onClick={() => window.setTimeout(() => document.getElementById('contact-form-card')?.focus(), 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Completar formulario <ArrowRight size={17} aria-hidden="true" />
                </a>
              </div>
            </article>
            <section className="contact-channels-card card-accent-top rounded-lg border p-6 shadow-sm text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Canales de contacto</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">Contacto directo</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">Elige el canal que te resulte más cómodo para conversar con Arista Partners.</p>
                </div>
                <MessageSquareText className="mt-1 h-6 w-6 shrink-0 text-white/65" aria-hidden="true" />
              </div>
              <div className="mt-6 grid gap-2">
                {contactLinks.map((link) => {
                  const Icon = link.Icon
                  const isWhatsApp = link.label === 'WhatsApp'
                  const isEmail = link.label === 'Correo'
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      aria-label={link.ariaLabel}
                      className={`group flex min-w-0 items-center gap-3 rounded-md border px-3 py-3.5 text-sm transition duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                        isWhatsApp
                          ? 'border-brand/25 bg-white shadow-sm hover:border-brand hover:bg-white'
                          : isEmail
                            ? 'border-brand/15 bg-white hover:border-brand/40 hover:bg-white'
                            : 'border-border bg-white/95 hover:border-brand/30 hover:bg-white'
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${isWhatsApp ? 'bg-brand/20 text-brand' : isEmail ? 'bg-brand/5 text-brand/80' : 'bg-surface-muted text-brand-dark'}`}>
                        <Icon size={20} className="h-5 w-5 shrink-0" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-graphite">{link.label}</span>
                        <span className="block break-words text-text-muted">{link.value}</span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand transition group-hover:text-graphite">
                        Abrir <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </a>
                  )
                })}
              </div>
              <div className="contact-direct-note mt-6 border-t border-white/20 pt-5">
                <p className="text-sm font-semibold text-graphite">¿Prefieres conversar primero?</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">Escríbenos y coordinamos la mejor forma de avanzar.</p>
              </div>
            </section>
          </aside>
        </div>
      </section>

      <section className="section-muted-depth bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Después del contacto" title="¿Qué ocurre después de contactarnos?" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {responseSteps.map((step, index) => (
            <article key={step.title} className="card-elevated card-accent-top rounded-lg border p-6">
                <span className="text-2xl font-semibold text-brand">0{index + 1}</span>
                <h2 className="mt-4 text-xl font-semibold text-graphite">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-text-muted">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-brand-depth bg-brand-dark px-5 py-16 text-on-brand lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="dark-card-solid rounded-lg border p-6">
            <span className="icon-chip-inverse">
              <ShieldAlert size={22} />
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-on-brand">Protege tu información</h2>
            <p className="mt-3 text-sm leading-6 text-on-brand-muted">
              No envíes contraseñas, datos bancarios, información financiera sensible ni documentos confidenciales mediante el formulario general. Si una gestión requiere antecedentes adicionales, Arista indicará posteriormente un canal apropiado para compartirlos.
            </p>
            <Link to="/privacidad" className="mt-5 inline-flex text-sm font-semibold text-on-brand underline underline-offset-4 hover:text-white focus-visible:outline-white">Revisar Política de Privacidad</Link>
          </div>
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="dark-card-solid rounded-lg border p-5">
                <span className="icon-chip-inverse">
                  <HelpCircle size={20} />
                </span>
                <h2 className="mt-3 text-lg font-semibold text-on-brand">{faq.question}</h2>
                <p className="mt-2 text-sm leading-6 text-on-brand-muted">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-4 border-brand bg-graphite px-5 py-12 text-white lg:px-8">
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
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base text-graphite outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
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
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base text-graphite outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
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
        className="mt-2 min-h-36 w-full resize-y rounded-md border border-border bg-white px-3 py-3 text-base text-graphite outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2">
        <FieldError id={`${id}-error`} message={error} />
      </div>
    </div>
  )
}
