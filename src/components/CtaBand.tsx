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
    <section className="bg-graphite px-5 py-14 text-dark-text lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-3 text-base leading-7 text-dark-text-muted">{text}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to={primaryTo}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-graphite shadow-sm transition hover:bg-surface-muted focus-visible:outline-white sm:w-fit"
          >
            {primaryLabel} <ArrowRight size={18} />
          </Link>
          {secondaryLabel && (
            <Link
              to={secondaryTo}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-dark-border px-5 py-3 text-sm font-semibold text-dark-text transition hover:bg-dark-card focus-visible:outline-white sm:w-fit"
            >
              {secondaryLabel} <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
