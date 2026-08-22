import { ArrowRight, Check, Compass, Eye, Handshake, Route, Scale, SearchCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CtaBand } from '../components/CtaBand'
import { SectionHeader } from '../components/SectionHeader'

const principles = [
  { icon: Compass, title: 'Criterio comercial', text: 'Revisamos el encaje entre la necesidad, la oferta y las condiciones de cada caso.' },
  { icon: Eye, title: 'Claridad', text: 'Ordenamos antecedentes, alcance y próximos pasos para que las partes puedan evaluar mejor.' },
  { icon: Route, title: 'Trazabilidad', text: 'Mantenemos registro de presentaciones, conversaciones y avances relevantes.' },
  { icon: Scale, title: 'Evaluación caso a caso', text: 'No todas las solicitudes siguen el mismo camino ni se aceptan automáticamente.' },
]

export function About() {
  return (
    <>
      <section className="border-b border-border bg-surface-muted px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Arista Partners</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-6xl">
            Conectamos necesidades, ofertas y oportunidades comerciales
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">
            Arista Partners representa ofertas, busca proveedores y desarrolla oportunidades B2B con una operación directa, ordenada y cercana.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/contacto" className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Conversemos <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/como-funciona" className="inline-flex items-center justify-center gap-2 rounded-md border border-brand bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-surface-muted">
              Cómo trabajamos <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeader eyebrow="Qué hacemos" title="Una gestión activa entre las partes" text="Arista participa en las etapas que ayudan a que una oportunidad avance con mejor información y coordinación." />
          <div className="grid gap-4 text-base leading-7 text-text-muted">
            <p className="border-l-2 border-brand pl-5">Representamos ofertas ante compradores, distribuidores y canales empresariales.</p>
            <p className="border-l-2 border-brand pl-5">Buscamos proveedores para necesidades de compra concretas.</p>
            <p className="border-l-2 border-brand pl-5">Exploramos aplicaciones B2B para productos y servicios orientados al consumidor.</p>
            <p className="border-l-2 border-brand pl-5">Acompañamos presentación, comparación, negociación y seguimiento comercial.</p>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Dos puntos de partida" title="La gestión puede comenzar desde ambos lados" text="El punto de partida define la información que necesitamos revisar y el tipo de gestión que corresponde." />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-lg border border-border bg-surface-muted p-6 shadow-sm">
              <SearchCheck className="text-brand" size={28} aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold text-graphite">Desde una necesidad de compra</h2>
              <p className="mt-3 text-base leading-7 text-text-muted">Levantamos requerimientos, identificamos alternativas y presentamos opciones para que el comprador pueda evaluarlas.</p>
              <Link to="/oportunidades?tipo=comprar" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">Presentar una necesidad <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
            <article className="rounded-lg border border-border bg-white p-6 shadow-sm">
              <Handshake className="text-brand" size={28} aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold text-graphite">Desde una oferta que busca mercado</h2>
              <p className="mt-3 text-base leading-7 text-text-muted">Revisamos la propuesta y exploramos compradores, distribuidores o canales empresariales donde pueda tener sentido.</p>
              <Link to="/oportunidades?tipo=vender" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">Presentar una oferta <ArrowRight size={17} aria-hidden="true" /></Link>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-brand-dark px-5 py-16 text-on-brand lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <SectionHeader tone="inverse" eyebrow="Participación activa" title="No nos limitamos a entregar contactos" text="Centralizamos inicialmente la presentación, organizamos antecedentes, comparamos alternativas y coordinamos conversaciones para mantener continuidad." />
          <div className="grid gap-3 sm:grid-cols-2">
            {['Presentación ordenada', 'Comparación de alternativas', 'Coordinación de conversaciones', 'Seguimiento comercial'].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-on-brand-border bg-on-brand-surface p-4 text-sm font-medium text-on-brand">
                <Check className="shrink-0 text-on-brand" size={20} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Principios de trabajo" title="Una forma de trabajar clara y responsable" />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="border-t-2 border-brand pt-5">
                <Icon className="text-brand" size={26} aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold text-graphite">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="Alcance responsable" title="Cada operación requiere una evaluación" />
          <div className="grid gap-4 text-base leading-7 text-text-muted">
            <p>Cada solicitud está sujeta a revisión y a las condiciones reales de las partes.</p>
            <p>No garantizamos aceptación, disponibilidad, precios ni cierre de una operación.</p>
            <p>Arista no reemplaza asesoría legal, financiera, tributaria ni técnica especializada.</p>
          </div>
        </div>
      </section>

      <CtaBand title="Conversemos sobre una oportunidad concreta" text="Cuéntanos si necesitas comprar, vender o encontrar proveedores y revisaremos el punto de partida adecuado." primaryLabel="Conversemos" primaryTo="/contacto" secondaryLabel="Necesito comprar" secondaryTo="/oportunidades?tipo=comprar" />
    </>
  )
}
