import { ArrowRight, CheckCircle2, Handshake, MessageSquareText, SearchCheck, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CtaBand } from '../components/CtaBand'
import { SectionHeader } from '../components/SectionHeader'

const steps = [
  { icon: MessageSquareText, title: 'Recibimos la necesidad u oferta', text: 'Conocemos el contexto, la propuesta, los criterios comerciales y el tipo de contraparte que buscas.' },
  { icon: SearchCheck, title: 'Evaluamos el encaje comercial', text: 'Revisamos si existen condiciones razonables para avanzar y podemos solicitar información adicional.' },
  { icon: Target, title: 'Buscamos o presentamos alternativas', text: 'Identificamos proveedores o acercamos la oferta a perfiles que puedan evaluarla.' },
  { icon: Handshake, title: 'Coordinamos negociación y seguimiento', text: 'Acompañamos conversaciones, cotizaciones y próximos pasos durante el alcance acordado.' },
]

const paths = [
  { title: 'Si necesitas comprar', text: 'Cuéntanos qué buscas, para qué aplicación y bajo qué condiciones. Revisaremos cómo identificar y comparar alternativas.', href: '/oportunidades?tipo=comprar', label: 'Presentar una necesidad' },
  { title: 'Si quieres vender', text: 'Presenta tu producto, servicio o capacidad para explorar posibles usos, compradores y canales empresariales.', href: '/oportunidades?tipo=vender', label: 'Presentar una oferta' },
  { title: 'Si quieres ser considerado como proveedor', text: 'Comparte tu perfil, categorías y cobertura para que pueda ser evaluado frente a necesidades de compra.', href: '/oportunidades?tipo=proveedor', label: 'Registrar perfil proveedor' },
]

export function HowItWorks() {
  return (
    <>
      <section className="border-b border-border bg-surface-muted px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Cómo funciona</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-graphite md:text-6xl">Una ruta clara para evaluar y desarrollar oportunidades</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted">El proceso se adapta al punto de partida, pero mantiene una secuencia simple: entender, evaluar, conectar y acompañar.</p>
        </div>
      </section>

      <section className="bg-graphite px-5 py-16 text-on-brand lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tone="inverse" eyebrow="Proceso principal" title="Cuatro pasos para avanzar con criterio" />
          <ol className="relative mt-10 grid gap-0 overflow-hidden rounded-lg border border-dark-border md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="relative border-b border-dark-border bg-dark-card p-6 last:border-b-0 md:border-r md:last:border-r-0 lg:border-b-0">
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-on-brand">0{index + 1}</span>
                <Icon className="mt-5 text-on-brand" size={27} aria-hidden="true" />
                <h2 className="mt-5 text-xl font-semibold text-on-brand">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-on-brand-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Tres rutas" title="El proceso parte desde tu situación" text="Selecciona el camino que describe mejor lo que necesitas presentar." />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {paths.map((path) => (
              <article key={path.title} className="flex h-full flex-col border-t-2 border-brand pt-5">
                <h2 className="text-2xl font-semibold text-graphite">{path.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-text-muted">{path.text}</p>
                <Link to={path.href} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand hover:text-brand-dark">{path.label} <ArrowRight size={17} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader eyebrow="Después de enviar" title="La recepción no implica avance automático" text="Cada antecedente se revisa antes de definir los próximos pasos." />
          <ol className="grid gap-4">
            {['Recepción de antecedentes.', 'Revisión y posible solicitud de información adicional.', 'Decisión de avanzar, ajustar o no aceptar la gestión.', 'Coordinación de próximos pasos según el caso.'].map((item, index) => (
              <li key={item} className="flex gap-4 rounded-lg border border-border bg-white p-4 shadow-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand text-sm font-semibold text-brand">{index + 1}</span>
                <span className="self-center text-sm leading-6 text-text-muted">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="Durante la oportunidad" title="Arista mantiene una participación definida" />
          <div className="grid gap-3 sm:grid-cols-2">
            {['Presentación de antecedentes', 'Comparación de alternativas', 'Coordinación entre las partes', 'Apoyo en la negociación', 'Seguimiento de próximos pasos'].map((item) => (
              <div key={item} className="flex gap-3 border-l-2 border-brand p-3 text-sm leading-6 text-text-muted">
                <CheckCircle2 className="shrink-0 text-brand" size={19} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-muted px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader eyebrow="Acuerdos y condiciones" title="El alcance se conversa antes de gestionar" />
          <p className="text-base leading-7 text-text-muted">Antes de desarrollar ciertas operaciones pueden definirse el alcance, las responsabilidades, la compensación, el periodo de participación o atribución y otras condiciones particulares. Esta explicación no reemplaza los acuerdos ni documentos que correspondan a cada caso.</p>
        </div>
      </section>

      <CtaBand title="Presenta el punto de partida" text="Cuéntanos qué necesitas comprar, qué quieres ofrecer o qué capacidad puedes aportar como proveedor." primaryLabel="Presentar una necesidad" primaryTo="/oportunidades?tipo=comprar" secondaryLabel="Presentar una oferta" secondaryTo="/oportunidades?tipo=vender" />
    </>
  )
}
