import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

type CtaBandProps = {
  title?: string
  text?: string
  primaryLabel?: string
  primaryTo?: string
  secondaryLabel?: string
  secondaryTo?: string
}

export function CtaBand({
  title = '¿Tienes una oferta o una necesidad comercial concreta?',
  text = 'Cuéntanos el contexto y evaluaremos cómo Arista puede ayudarte a conectar con la contraparte adecuada.',
  primaryLabel = 'Iniciar contacto',
  primaryTo = '/contacto',
  secondaryLabel,
  secondaryTo = '/contacto',
}: CtaBandProps) {
  return (
    <section className="section-brand-depth border-t-4 border-brand bg-brand-dark px-4 py-9 text-dark-text sm:px-5 sm:py-14 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-6 text-dark-text-muted sm:text-base sm:leading-7">{text}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:w-auto sm:flex sm:flex-row sm:gap-3">
          <Link
            to={primaryTo}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-center text-sm font-semibold text-graphite shadow-sm transition hover:bg-surface-muted focus-visible:outline-white sm:w-fit sm:px-5 sm:py-3"
          >
            {primaryLabel} <ArrowRight size={18} />
          </Link>
          {secondaryLabel && (
            <Link
              to={secondaryTo}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dark-border px-3 py-2 text-center text-sm font-semibold text-dark-text transition hover:bg-dark-card focus-visible:outline-white sm:w-fit sm:px-5 sm:py-3"
            >
              {secondaryLabel} <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
