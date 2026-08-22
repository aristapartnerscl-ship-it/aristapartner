import { ArrowUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { legalConfig, showDevelopmentLegalNotes } from '../../data/legal'

export type TocItem = {
  id: string
  label: string
}

type LegalDocumentProps = {
  eyebrow: string
  title: string
  intro: string
  toc: TocItem[]
  children: ReactNode
}

export function LegalDocument({ eyebrow, title, intro, toc, children }: LegalDocumentProps) {
  return (
    <article id="inicio" className="bg-white">
      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-6xl">{title}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">{intro}</p>
          {legalConfig.legalDocumentsDraft && (
            <div className="mt-8 rounded-lg border border-brand/25 bg-surface-muted p-4">
              <p className="text-sm leading-6 text-text-muted">
                Documento informativo en preparación. La versión definitiva será publicada antes de habilitar la
                recepción digital de formularios.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="border-y border-border bg-surface-muted px-5 py-4 lg:hidden">
        <label htmlFor="legal-nav" className="block text-sm font-semibold text-graphite">
          Índice del documento
        </label>
        <select
          id="legal-nav"
          className="mt-2 w-full rounded-md border border-border bg-white px-3 py-3 text-base text-slate-900"
          onChange={(event) => {
            const target = document.getElementById(event.target.value)
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' })
              target.focus({ preventScroll: true })
              window.history.replaceState(null, '', `#${event.target.value}`)
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Ir a una sección
          </option>
          {toc.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <section className="bg-surface-muted px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <nav className="sticky top-28 rounded-lg border border-border bg-white p-4" aria-label="Índice legal">
              <p className="text-sm font-semibold text-graphite">Índice</p>
              <div className="mt-4 grid gap-2">
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="text-sm leading-6 text-text-muted hover:text-brand">
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <div className="max-w-3xl rounded-lg border border-border bg-white p-6 text-base leading-7 text-text-muted shadow-sm md:p-8">
            {children}
            <div className="mt-12 border-t border-border pt-6">
              <a href="#inicio" className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
                <ArrowUp size={17} /> Volver arriba
              </a>
            </div>
          </div>
        </div>
      </section>
    </article>
  )
}

type LegalSectionProps = {
  id: string
  title: string
  children: ReactNode
}

export function LegalSection({ id, title, children }: LegalSectionProps) {
  return (
    <section id={id} className="scroll-mt-28 [&+section]:mt-10" tabIndex={-1}>
      <h2 className="text-2xl font-semibold tracking-tight text-graphite">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  )
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function MetadataLine({ version, effectiveDate }: { version?: string; effectiveDate?: string }) {
  return (
    <p className="rounded-md bg-surface-muted p-4 text-sm text-text-muted">
      {version && <span>Versión: {version}. </span>}
      {effectiveDate && <span>Fecha de vigencia: {effectiveDate}. </span>}
      {!version && !effectiveDate && <span>Fecha y versión pendientes de configuración.</span>}
    </p>
  )
}

export function DevelopmentNote({ children }: { children: ReactNode }) {
  if (!showDevelopmentLegalNotes) {
    return null
  }

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      {children}
    </div>
  )
}

export function InlinePrivacyLink() {
  return (
    <Link to="/privacidad" className="font-semibold text-brand hover:text-graphite">
      Política de privacidad
    </Link>
  )
}
