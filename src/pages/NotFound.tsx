import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Error 404</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-6xl">
          No encontramos la página que buscas
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
          Es posible que el enlace haya cambiado o que la dirección no sea correcta. Puedes volver al inicio o presentar
          una oportunidad comercial.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
          >
            Volver al inicio <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            to="/oportunidades"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-brand/30 bg-white px-5 py-3 text-sm font-semibold text-graphite shadow-sm transition hover:border-brand"
          >
            Presentar una oportunidad <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
