import { ArrowRight, Handshake, MessageSquareText, SearchCheck, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CtaBand } from '../components/CtaBand'
import { SectionHeader } from '../components/SectionHeader'

const serviceBlocks = [
  { icon: Handshake, title: 'Representación comercial', forWho: 'Para vendedores con una oferta que busca compradores o canales empresariales.', problem: 'Una buena oferta puede necesitar una presentación ordenada y una gestión comercial sostenida.', role: 'Revisamos el encaje, preparamos antecedentes y coordinamos el acercamiento con potenciales contrapartes.', action: 'Presentar mi oferta', href: '/oportunidades?tipo=vender' },
  { icon: SearchCheck, title: 'Búsqueda y evaluación de proveedores', forWho: 'Para compradores que necesitan alternativas frente a una necesidad concreta.', problem: 'Encontrar opciones comparables requiere ordenar criterios, condiciones y disponibilidad de información.', role: 'Identificamos, comparamos y presentamos alternativas para apoyar la evaluación del comprador.', action: 'Presentar una necesidad', href: '/oportunidades?tipo=comprar' },
  { icon: Store, title: 'Desarrollo de oportunidades B2B', forWho: 'Para productos y servicios que buscan explorar aplicaciones empresariales.', problem: 'Una oferta orientada al consumidor puede no tener todavía definido su canal o propuesta B2B.', role: 'Exploramos posibilidades en volumen, distribución, retail, regalos corporativos y canales empresariales.', action: 'Explorar una oportunidad', href: '/oportunidades?tipo=vender' },
  { icon: MessageSquareText, title: 'Gestión y seguimiento comercial', forWho: 'Para operaciones que necesitan coordinación entre varias conversaciones y próximos pasos.', problem: 'La falta de continuidad puede hacer que una conversación pierda información o impulso.', role: 'Centralizamos comunicaciones relevantes, cotizaciones, acuerdos y seguimiento durante la gestión.', action: 'Conversemos', href: '/contacto' },
]

function ResponsiveImage({ name, alt, width, height, sizes }: { name: string; alt: string; width: number; height: number; sizes: string }) {
  return (
    <picture>
      <source type="image/avif" srcSet={`/images/${name}-720.avif 720w, /images/${name}-1200.avif 1200w`} sizes={sizes} />
      <source type="image/webp" srcSet={`/images/${name}-720.webp 720w, /images/${name}-1200.webp 1200w`} sizes={sizes} />
      <img src={`/images/${name}.png`} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="h-full w-full object-cover" />
    </picture>
  )
}

export function Services() {
  return (
    <>
      <section className="page-hero-dark px-5 py-12 sm:py-14 lg:px-8 lg:py-16">
        <div className="relative z-10 mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">Servicios</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">Gestión comercial para conectar y avanzar</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">Arista puede participar desde la búsqueda inicial hasta la coordinación de conversaciones, según el alcance que corresponda a cada oportunidad.</p>
          <Link to="/oportunidades" className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">Presentar una oportunidad <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="section-soft-depth bg-white px-5 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="card-dark-raised rounded-lg border p-6 text-on-brand sm:p-7">
            <SectionHeader tone="inverse" eyebrow="Cuatro líneas de trabajo" title="El alcance se define según la oportunidad" text="Cada servicio aborda una necesidad distinta, sin reemplazar las decisiones finales de las partes." />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {serviceBlocks.map(({ icon: Icon, title, forWho, problem, role, action, href }) => (
              <article key={title} className={`card-accent-top flex h-full flex-col rounded-lg border p-4 sm:p-6 ${title === 'Representación comercial' ? 'brand-feature-card text-on-brand' : 'card-elevated text-graphite'}`}>
                <span className={title === 'Representación comercial' ? 'icon-chip-inverse' : 'icon-chip'}>
                  <Icon size={22} aria-hidden="true" />
                </span>
                <h2 className={`mt-4 text-xl font-semibold sm:mt-5 sm:text-2xl ${title === 'Representación comercial' ? 'text-on-brand' : 'text-graphite'}`}>{title}</h2>
                <p className={`mt-3 text-sm font-semibold ${title === 'Representación comercial' ? 'text-white/86' : 'text-brand'}`}>{forWho}</p>
                <p className={`mt-3 text-sm leading-6 sm:mt-4 ${title === 'Representación comercial' ? 'text-white/80' : 'text-text-muted'}`}>{problem}</p>
                <p className={`mt-3 flex-1 text-sm leading-6 ${title === 'Representación comercial' ? 'text-white/80' : 'text-text-muted'}`}>{role}</p>
                <Link to={href} className={`mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold sm:mt-6 ${title === 'Representación comercial' ? 'text-on-brand hover:text-white' : 'text-brand hover:text-brand-dark'}`}>{action} <ArrowRight size={17} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-brand-depth bg-brand-dark px-5 py-12 text-on-brand sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader tone="inverse" eyebrow="Comparar alternativas" title="Buscar proveedores con mejor información" text="Partimos de una necesidad concreta para identificar, comparar y presentar opciones que puedan ser revisadas por el comprador." />
            <Link to="/oportunidades?tipo=comprar" className="mt-7 inline-flex items-center gap-2 rounded-md border border-on-brand-border px-5 py-3 text-sm font-semibold text-on-brand transition hover:bg-on-brand-surface focus-visible:outline-white">Necesito comprar <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-lg border border-on-brand-border bg-white shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <ResponsiveImage name="arista-proveedores-comparacion" alt="Muestras y alternativas organizadas para comparar una necesidad de compra" width={1448} height={1086} sizes="(min-width: 1024px) 560px, calc(100vw - 2.5rem)" />
          </div>
        </div>
      </section>

      <section className="section-muted-depth bg-surface-muted px-5 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader eyebrow="De B2C a B2B" title="Explorar nuevos usos y canales empresariales" text="Algunas ofertas pueden encontrar aplicaciones en ventas por volumen, distribución, retail, regalos corporativos y canales empresariales. Evaluamos el encaje sin prometer resultados." />
            <Link to="/oportunidades?tipo=vender" className="mt-7 inline-flex items-center gap-2 rounded-md border border-brand bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-surface-muted">Quiero vender <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
          <div className="mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:order-first">
            <ResponsiveImage name="arista-b2b-desarrollo" alt="Producto de consumo presentado para explorar aplicaciones empresariales" width={1536} height={1024} sizes="(min-width: 1024px) 560px, calc(100vw - 2.5rem)" />
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="Límites del servicio" title="Qué no está incluido automáticamente" />
          <ul className="grid gap-3 text-base leading-7 text-text-muted sm:grid-cols-2">
            {['Asesoría legal o contractual.', 'Asesoría tributaria.', 'Evaluación técnica especializada.', 'Garantías de disponibilidad o cierre.', 'Contratación o representación exclusiva sin acuerdo.', 'Decisiones finales de compra, venta o contratación.'].map((item) => <li key={item} className="border-l-2 border-border pl-4">{item}</li>)}
          </ul>
        </div>
      </section>

      <CtaBand title="Elige el punto de partida" text="Puedes presentar una necesidad de compra, una oferta comercial o un perfil de proveedor para una evaluación inicial." primaryLabel="Necesito comprar" primaryTo="/oportunidades?tipo=comprar" secondaryLabel="Quiero vender" secondaryTo="/oportunidades?tipo=vender" />
    </>
  )
}
