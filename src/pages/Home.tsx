import {
  ArrowRight,
  ArrowRightLeft,
  BriefcaseBusiness,
  Building2,
  Handshake,
  MessageSquareText,
  SearchCheck,
  ShoppingCart,
  Target,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CtaBand } from '../components/CtaBand'
import { SectionHeader } from '../components/SectionHeader'

const HERO_ROTATION_INTERVAL = 6000

const audiencePaths = [
  {
    icon: ShoppingCart,
    title: 'Necesito comprar',
    text: 'Para empresas y equipos que necesitan encontrar proveedores, comparar alternativas y avanzar con criterio comercial.',
    action: 'Presentar una necesidad',
    href: '/oportunidades?tipo=comprar',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Quiero vender',
    text: 'Para vendedores que buscan presentar su oferta ante compradores empresariales y abrir nuevos canales B2B.',
    action: 'Presentar mi oferta',
    href: '/oportunidades?tipo=vender',
  },
  {
    icon: Building2,
    title: 'Quiero ser proveedor',
    text: 'Para proveedores que quieren ser considerados en necesidades de compra concretas y evaluadas.',
    action: 'Registrar mi perfil',
    href: '/oportunidades?tipo=proveedor',
  },
]

const participationSteps = [
  { icon: MessageSquareText, title: 'Presentación', text: 'Ordenamos la información y presentamos la oportunidad a la contraparte adecuada.' },
  { icon: SearchCheck, title: 'Comparación', text: 'Ayudamos a revisar alternativas, condiciones y encaje con la necesidad.' },
  { icon: Handshake, title: 'Negociación', text: 'Coordinamos conversaciones y próximos pasos durante el avance comercial.' },
  { icon: Target, title: 'Seguimiento', text: 'Mantenemos trazabilidad para que la oportunidad no pierda continuidad.' },
]

const services = [
  { icon: Handshake, title: 'Representación comercial', text: 'Presentamos y gestionamos ofertas ante compradores, distribuidores y canales empresariales.' },
  { icon: SearchCheck, title: 'Búsqueda y evaluación de proveedores', text: 'Identificamos alternativas según la necesidad, el alcance y las condiciones de compra.' },
  { icon: ArrowRightLeft, title: 'Desarrollo de oportunidades B2B', text: 'Exploramos cómo una oferta orientada al consumidor puede encontrar usos y canales empresariales.' },
  { icon: MessageSquareText, title: 'Gestión y seguimiento comercial', text: 'Centralizamos coordinación, cotizaciones, comunicación y seguimiento durante el proceso.' },
]

const b2bChannels = ['Ventas por volumen', 'Distribución', 'Retail', 'Regalos corporativos', 'Canales empresariales']

const processSteps = [
  'Cuéntanos la necesidad u oferta.',
  'Evaluamos el encaje comercial.',
  'Buscamos y presentamos alternativas.',
  'Acompañamos negociación y seguimiento.',
]

const heroSlides = [
  {
    name: 'arista-hero-intermediacion-v3',
    alt: 'Mesa de trabajo preparada para coordinar una oportunidad comercial B2B',
    caption: 'Intermediación B2B con seguimiento comercial.',
    sources: {
      avif: '/images/arista-hero-intermediacion-v3-960.avif 960w, /images/arista-hero-intermediacion-v3-1600.avif 1600w',
      webp: '/images/arista-hero-intermediacion-v3-960.webp 960w, /images/arista-hero-intermediacion-v3-1600.webp 1600w',
      png: '/images/arista-hero-intermediacion-v3.png',
    },
    width: 1672,
    height: 941,
    objectPosition: 'object-[center_52%]',
  },
  {
    name: 'arista-hero-productos-b2b-v3',
    alt: 'Productos presentados para evaluar oportunidades comerciales entre empresas',
    caption: 'Ofertas listas para explorar canales empresariales.',
    sources: {
      avif: '/images/arista-hero-productos-b2b-v3-960.avif 960w, /images/arista-hero-productos-b2b-v3-1600.avif 1600w',
      webp: '/images/arista-hero-productos-b2b-v3-960.webp 960w, /images/arista-hero-productos-b2b-v3-1600.webp 1600w',
      png: '/images/arista-hero-productos-b2b-v3.png',
    },
    width: 1672,
    height: 941,
    objectPosition: 'object-[center_50%]',
  },
  {
    name: 'arista-hero-proveedores-v3',
    alt: 'Documentos y muestras de proveedores revisados para una necesidad de compra',
    caption: 'Búsqueda y comparación de proveedores.',
    sources: {
      avif: '/images/arista-hero-proveedores-v3-960.avif 960w, /images/arista-hero-proveedores-v3-1600.avif 1600w',
      webp: '/images/arista-hero-proveedores-v3-960.webp 960w, /images/arista-hero-proveedores-v3-1600.webp 1600w',
      png: '/images/arista-hero-proveedores-v3.png',
    },
    width: 1672,
    height: 941,
    objectPosition: 'object-[center_52%]',
  },
  {
    name: 'arista-hero-negociacion-v3',
    alt: 'Espacio de negociación comercial con antecedentes organizados',
    caption: 'Coordinación para avanzar conversaciones.',
    sources: {
      avif: '/images/arista-hero-negociacion-v3-960.avif 960w, /images/arista-hero-negociacion-v3-1600.avif 1600w',
      webp: '/images/arista-hero-negociacion-v3-960.webp 960w, /images/arista-hero-negociacion-v3-1600.webp 1600w',
      png: '/images/arista-hero-negociacion-v3.png',
    },
    width: 1672,
    height: 941,
    objectPosition: 'object-[center_48%]',
  },
  {
    name: 'arista-hero-seguimiento-v3',
    alt: 'Planificación de seguimiento para oportunidades comerciales B2B',
    caption: 'Trazabilidad desde el primer contacto.',
    sources: {
      avif: '/images/arista-hero-seguimiento-v3-960.avif 960w, /images/arista-hero-seguimiento-v3-1600.avif 1600w',
      webp: '/images/arista-hero-seguimiento-v3-960.webp 960w, /images/arista-hero-seguimiento-v3-1600.webp 1600w',
      png: '/images/arista-hero-seguimiento-v3.png',
    },
    width: 1672,
    height: 941,
    objectPosition: 'object-[center_50%]',
  },
]

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mediaQuery) return undefined

    setPrefersReducedMotion(mediaQuery.matches)
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

function HeroCarousel() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [activeSlide, setActiveSlide] = useState(0)
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => !document.hidden)
  const shouldRotate = !prefersReducedMotion && isDocumentVisible

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (!shouldRotate) return undefined

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length)
    }, HERO_ROTATION_INTERVAL)

    return () => window.clearInterval(intervalId)
  }, [shouldRotate])

  return (
    <div
      className="relative h-[clamp(190px,31svh,240px)] overflow-hidden rounded-md border border-dark-border bg-dark-card shadow-[0_18px_38px_rgba(0,0,0,0.18)] sm:aspect-video sm:h-auto sm:rounded-lg sm:shadow-[0_22px_54px_rgba(0,0,0,0.2)]"
      data-testid="hero-carousel"
      aria-label="Imágenes de apoyo de Arista Partners"
    >
      <div className="relative h-full w-full">
        {heroSlides.map((slide, index) => {
          const isActive = index === activeSlide
          return (
            <div
              key={slide.name}
              className={`absolute inset-0 transition-opacity duration-[900ms] motion-reduce:transition-none ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
              data-active={isActive ? 'true' : 'false'}
              data-testid="hero-slide"
            >
              <picture>
                <source type="image/avif" srcSet={slide.sources.avif} sizes="(min-width: 1024px) 56vw, 100vw" />
                <source type="image/webp" srcSet={slide.sources.webp} sizes="(min-width: 1024px) 56vw, 100vw" />
                <img
                  src={slide.sources.png}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className={`h-full w-full object-cover ${slide.objectPosition}`}
                />
              </picture>
              <div className="pointer-events-none absolute inset-0 bg-brand-dark/15" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(90deg,var(--color-brand-dark)_0%,rgba(22,57,44,0.42)_28%,rgba(26,31,35,0)_100%)]" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(22,57,44,0.82)_0%,rgba(22,57,44,0.52)_55%,rgba(22,57,44,0)_100%)] px-4 pb-3 pt-10 sm:hidden" aria-hidden="true">
                <p className="text-xs font-semibold leading-5 text-white">{slide.caption}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="absolute bottom-3 right-3 z-20 flex gap-1.5" aria-hidden="true">
        {heroSlides.map((slide, index) => (
          <span key={`${slide.name}-indicator`} className={`h-1.5 w-1.5 rounded-full ${index === activeSlide ? 'bg-white' : 'bg-white/45'}`} />
        ))}
      </div>
    </div>
  )
}

export function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-dark-border bg-dark-accent bg-[linear-gradient(115deg,var(--color-brand-dark)_0%,var(--color-dark-surface)_100%)] px-4 py-6 text-dark-text sm:px-5 sm:py-14 lg:px-8 lg:py-16" data-testid="home-hero">
        <div className="pointer-events-none absolute right-0 top-8 hidden h-48 w-48 rotate-45 border border-dark-border lg:block" aria-hidden="true" />
        <div className="pointer-events-none absolute right-24 top-24 hidden h-20 w-20 rotate-45 border border-dark-border lg:block" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-5 sm:gap-8 lg:grid-cols-[0.46fr_0.54fr] lg:gap-12">
          <div className="relative z-10 max-w-xl sm:max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dark-text-muted sm:text-sm sm:tracking-[0.22em]">Arista Partners</p>
            <h1 className="mt-3 max-w-xl text-[2rem] font-semibold leading-[1.08] tracking-tight text-on-brand sm:mt-5 sm:max-w-2xl sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
              Intermediación comercial para abrir oportunidades B2B.
            </h1>
            <p className="mt-3 max-w-[34rem] text-sm leading-6 text-dark-text-muted sm:mt-5 sm:text-lg sm:leading-8">
              Representamos ofertas, buscamos proveedores y acompañamos conversaciones comerciales desde la primera presentación hasta el seguimiento.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 min-[360px]:flex min-[360px]:flex-row sm:mt-7 sm:gap-3" data-testid="home-hero-ctas">
              <Link to="/oportunidades?tipo=comprar" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-white bg-white px-3 py-2 text-center text-[0.82rem] font-semibold text-brand-dark shadow-sm transition hover:bg-surface-muted focus-visible:outline-white sm:gap-2 sm:px-5 sm:py-3 sm:text-sm">
                Necesito comprar <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/oportunidades?tipo=vender" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-dark-border bg-transparent px-3 py-2 text-center text-[0.82rem] font-semibold text-on-brand transition hover:bg-dark-card focus-visible:outline-white sm:gap-2 sm:px-5 sm:py-3 sm:text-sm">
                Quiero vender <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <HeroCarousel />
        </div>
      </section>

      <section className="section-soft-depth bg-white px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Tres caminos" title="Una forma clara de comenzar" text="Elige el punto de partida que mejor representa tu necesidad. Arista participa activamente en la evaluación y coordinación comercial." />
          <div className="mt-7 grid gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3" data-testid="home-audience-grid">
            {audiencePaths.map((path, index) => {
              const Icon = path.icon
              const featured = index === 1
              return (
                <article key={path.title} className={`card-accent-top flex h-full flex-col rounded-md border p-3.5 sm:rounded-lg sm:p-6 ${featured ? 'brand-feature-card text-on-brand' : 'card-elevated text-graphite'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <span className={featured ? 'icon-chip-inverse' : 'icon-chip'}>
                      <Icon size={24} aria-hidden="true" />
                    </span>
                    <span className={`text-sm font-semibold ${featured ? 'text-on-brand-muted' : 'text-text-soft'}`}>0{index + 1}</span>
                  </div>
                  <h2 className={`mt-3 text-lg font-semibold sm:mt-5 sm:text-2xl ${featured ? 'text-on-brand' : 'text-graphite'}`}>{path.title}</h2>
                  <p className={`mt-2 flex-1 text-sm leading-6 sm:mt-3 sm:text-base sm:leading-7 ${featured ? 'text-on-brand-muted' : 'text-text-muted'}`}>{path.text}</p>
                  <Link to={path.href} className={`mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold sm:mt-6 ${featured ? 'text-on-brand hover:text-white' : 'text-brand hover:text-brand-dark'}`}>
                    {path.action} <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-green-wash bg-surface-muted px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Intermediación" title="Una conexión comercial con Arista al centro" text="Ordenamos antecedentes, conectamos a las partes y acompañamos el avance de la conversación sin sustituir la evaluación de cada empresa." />
          <div className="relative mt-7 grid items-stretch gap-2 before:absolute before:bottom-8 before:left-5 before:top-8 before:w-1 before:rounded-full before:bg-brand/45 before:content-[''] sm:mt-10 sm:gap-4 lg:grid-cols-[1fr_auto_1.15fr_auto_1fr] lg:before:hidden">
            {[
              { icon: ShoppingCart, label: 'Comprador', text: 'Presenta una necesidad concreta y criterios para evaluar alternativas.' },
              { icon: UsersRound, label: 'Arista Partners', text: 'Conecta, coordina y da continuidad a la gestión comercial.', featured: true },
              { icon: Building2, label: 'Vendedor o proveedor', text: 'Presenta una oferta, capacidad o perfil para ser evaluado.' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={`card-accent-top relative z-10 rounded-md border p-3.5 sm:rounded-lg sm:p-6 ${item.featured ? 'brand-feature-card text-on-brand ring-4 ring-brand/15' : 'card-elevated text-graphite'} ${index === 0 ? 'lg:col-start-1' : index === 1 ? 'lg:col-start-3' : 'lg:col-start-5'}`}>
                  <span className={item.featured ? 'icon-chip-inverse' : 'icon-chip'}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h2 className={`mt-4 text-xl font-semibold ${item.featured ? 'text-on-brand' : 'text-graphite'}`}>{item.label}</h2>
                  <p className={`mt-3 text-sm leading-6 ${item.featured ? 'text-on-brand-muted' : 'text-text-muted'}`}>{item.text}</p>
                </div>
              )
            })}
            <div className="hidden items-center justify-center text-brand lg:flex lg:col-start-2 lg:row-start-1" aria-hidden="true">
              <ArrowRight size={28} />
            </div>
            <div className="hidden items-center justify-center text-brand lg:flex lg:col-start-4 lg:row-start-1" aria-hidden="true">
              <ArrowRight size={28} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader eyebrow="Participación activa" title="Arista acompaña lo que ocurre entre las partes" text="Una oportunidad necesita más que un contacto inicial. Aportamos orden, criterio y continuidad en cada etapa." />
          <div className="relative mt-7 grid gap-3 before:absolute before:left-6 before:right-6 before:top-6 before:hidden before:h-1 before:bg-brand/35 before:content-[''] min-[390px]:grid-cols-2 sm:mt-10 sm:gap-5 lg:grid-cols-4 lg:before:block">
            {participationSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <article key={step.title} className={`card-accent-top relative z-10 rounded-md border p-3.5 sm:rounded-lg sm:p-4 ${index % 2 === 0 ? 'card-elevated' : 'border-brand/20 bg-[var(--surface-green-soft)] shadow-[var(--shadow-card)]'}`}>
                  <div className="flex items-center gap-3">
                    <span className="icon-chip">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">0{index + 1}</p>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-graphite sm:text-xl">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{step.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-muted-depth bg-surface-muted px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 sm:gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-stretch">
          <div className="dark-card-solid rounded-md border p-5 text-on-brand sm:rounded-lg sm:p-7">
            <SectionHeader tone="inverse" eyebrow="Servicios" title="Gestión comercial con foco en el siguiente paso" text="El alcance se define según la oportunidad, con una gestión ordenada entre compradores, vendedores y proveedores." />
          </div>
          <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <article key={service.title} className={`card-accent-top rounded-md border p-4 sm:rounded-lg sm:p-5 ${service.title === 'Representación comercial' ? 'brand-feature-card text-on-brand' : 'card-elevated text-graphite'}`}>
                  <span className={service.title === 'Representación comercial' ? 'icon-chip-inverse' : 'icon-chip'}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <h2 className={`mt-4 text-lg font-semibold ${service.title === 'Representación comercial' ? 'text-on-brand' : 'text-graphite'}`}>{service.title}</h2>
                  <p className={`mt-3 text-sm leading-6 ${service.title === 'Representación comercial' ? 'text-white/82' : 'text-text-muted'}`}>{service.text}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section-soft-depth bg-surface-muted px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader eyebrow="Enfoque B2B" title="Del consumidor al mercado empresarial" text="Algunas ofertas creadas para el consumidor final pueden encontrar nuevas aplicaciones en empresas. Exploramos el encaje comercial sin prometer resultados garantizados." />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {b2bChannels.map((channel) => <div key={channel} className="rounded-md border border-border bg-white px-4 py-3 text-sm font-medium text-text-muted">{channel}</div>)}
            </div>
          </div>
          <div className="mx-auto aspect-[3/2] w-full max-w-[600px] overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:max-w-[560px] lg:justify-self-end">
            <picture className="block h-full w-full">
              <source type="image/avif" srcSet="/images/arista-b2b-desarrollo-720.avif 720w, /images/arista-b2b-desarrollo-1200.avif 1200w" sizes="(min-width: 1024px) 560px, (min-width: 640px) 600px, calc(100vw - 2.5rem)" />
              <source type="image/webp" srcSet="/images/arista-b2b-desarrollo-720.webp 720w, /images/arista-b2b-desarrollo-1200.webp 1200w" sizes="(min-width: 1024px) 560px, (min-width: 640px) 600px, calc(100vw - 2.5rem)" />
              <img src="/images/arista-b2b-desarrollo.png" alt="Producto de consumo presentado para explorar una oportunidad empresarial" width={1536} height={1024} loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
            </picture>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader eyebrow="Búsqueda de proveedores" title="Alternativas para comprar con mejor información" text="Partimos desde una necesidad concreta para identificar, comparar y presentar opciones que puedan ser evaluadas por el comprador." />
            <Link to="/oportunidades?tipo=comprar" className="mt-7 inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark">
              Presentar una necesidad <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="mx-auto aspect-[3/2] w-full max-w-[600px] overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:order-first lg:max-w-[560px] lg:justify-self-start">
            <picture className="block h-full w-full">
              <source type="image/avif" srcSet="/images/arista-proveedores-comparacion-720.avif 720w, /images/arista-proveedores-comparacion-1200.avif 1200w" sizes="(min-width: 1024px) 560px, (min-width: 640px) 600px, calc(100vw - 2.5rem)" />
              <source type="image/webp" srcSet="/images/arista-proveedores-comparacion-720.webp 720w, /images/arista-proveedores-comparacion-1200.webp 1200w" sizes="(min-width: 1024px) 560px, (min-width: 640px) 600px, calc(100vw - 2.5rem)" />
              <img src="/images/arista-proveedores-comparacion.png" alt="Alternativas de proveedores comparadas para una necesidad de compra" width={1448} height={1086} loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
            </picture>
          </div>
        </div>
      </section>

      <section className="bg-graphite px-4 py-9 text-on-brand sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader tone="inverse" eyebrow="Proceso" title="Así empieza una oportunidad" />
          <ol className="mt-7 grid gap-2 overflow-hidden rounded-md border border-dark-border sm:mt-10 sm:gap-0 sm:rounded-lg md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <li key={step} className="dark-card-solid flex items-center gap-4 border-b border-dark-border p-3.5 last:border-b-0 sm:block sm:p-5 md:border-r md:last:border-r-0 lg:border-b-0">
                <span className="shrink-0 text-3xl font-semibold text-on-brand sm:text-2xl">0{index + 1}</span>
                <p className="text-sm font-semibold leading-6 text-white/85 sm:mt-4 sm:text-base">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white px-4 py-9 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeader eyebrow="Criterio y alcance" title="Una gestión comercial responsable" />
          <div className="grid gap-4 text-base leading-7 text-text-muted">
            <p>Arista facilita y gestiona oportunidades comerciales, pero cada operación está sujeta a evaluación.</p>
            <p>No garantizamos aceptación, disponibilidad ni cierre. Tampoco reemplazamos asesoría legal, financiera, tributaria o técnica especializada.</p>
          </div>
        </div>
      </section>

      <CtaBand title="Conversemos sobre tu próxima oportunidad comercial" text="Cuéntanos si necesitas comprar, vender o encontrar proveedores y revisaremos el punto de partida adecuado." primaryLabel="Conversemos" primaryTo="/contacto" secondaryLabel="Necesito comprar" secondaryTo="/oportunidades?tipo=comprar" />
    </>
  )
}
