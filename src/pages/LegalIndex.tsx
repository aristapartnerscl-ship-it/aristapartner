import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function LegalIndex() {
  return (
    <section className="bg-white px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Documentos legales</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-6xl">
          Términos y privacidad
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">
          La información legal del sitio se organiza ahora en dos documentos separados.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            ['Política de privacidad', '/privacidad', 'Información sobre datos personales, formularios públicos y solicitudes comerciales.'],
            ['Términos y condiciones', '/terminos', 'Condiciones de uso de la web pública y recepción de solicitudes comerciales.'],
          ].map(([title, href, text]) => (
            <Link key={href} to={href} className="group rounded-lg border border-border bg-surface-muted p-6 transition hover:border-brand">
              <h2 className="text-2xl font-semibold text-graphite">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">{text}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                Ver documento <ArrowRight size={17} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
