import { ArrowRight, MessageSquareText, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { OpportunityForm } from '../components/opportunities/OpportunityForm'
import { opportunityForms, type OpportunityType } from '../data/opportunityForms'

const validTypes = new Set<OpportunityType>(['comprar', 'vender', 'proveedor'])
const followUpSteps = ['Recepcion de antecedentes.', 'Evaluacion inicial segun alcance y condiciones.', 'Contacto para proximos pasos si existe encaje.']

export function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedType = searchParams.get('tipo')
  const activeType: OpportunityType = validTypes.has(selectedType as OpportunityType) ? (selectedType as OpportunityType) : 'comprar'
  const activeForm = opportunityForms.find((form) => form.type === activeType) ?? opportunityForms[0]

  useEffect(() => {
    if (!validTypes.has(selectedType as OpportunityType)) setSearchParams({ tipo: 'comprar' }, { replace: true })
  }, [selectedType, setSearchParams])

  function selectType(type: OpportunityType) {
    setSearchParams({ tipo: type })
  }

  return (
    <>
      <section className="page-hero-dark px-5 py-14 sm:py-16 lg:px-8 lg:py-20">
        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] lg:items-center">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">Oportunidades</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">Presenta una necesidad, una oferta o tu perfil de proveedor</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">Elige el punto de partida que mejor representa tu situacion. Cada antecedente sera evaluado antes de definir como avanzar.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {opportunityForms.map((form) => <button key={form.type} type="button" onClick={() => selectType(form.type)} className="rounded-md border border-white/25 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10">{form.title}</button>)}
            </div>
          </div>
          <div className="hidden justify-self-end lg:grid lg:h-64 lg:w-64 lg:place-items-center lg:rounded-full lg:border lg:border-white/20 lg:bg-white/5" aria-hidden="true"><div className="h-36 w-36 rotate-45 border border-brand/70 bg-brand/10" /></div>
        </div>
      </section>

      <section className="section-soft-depth bg-white px-5 py-14 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Tres caminos comerciales</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-graphite md:text-4xl">Elige tu punto de partida</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">Selecciona la ruta que mejor describe lo que necesitas presentar para ordenar los antecedentes adecuados desde el comienzo.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3" role="tablist" aria-label="Tipo de oportunidad">
            {opportunityForms.map((form, index) => {
              const Icon = form.icon
              const isActive = form.type === activeType
              return <button key={form.type} id={`tab-${form.type}`} type="button" role="tab" aria-selected={isActive} aria-controls={`panel-${form.type}`} onClick={() => selectType(form.type)} className={`card-accent-top flex h-full flex-col rounded-lg border p-6 text-left transition focus:outline-none focus:ring-2 focus:ring-brand/30 ${isActive ? 'border-brand bg-surface-muted shadow-md' : 'card-elevated border-border bg-white hover:border-brand/60 hover:bg-surface-muted'}`}><span className="text-sm font-semibold tracking-[0.18em] text-brand">0{index + 1}</span><Icon className="mt-5 text-brand" size={30} aria-hidden="true" /><span className="mt-5 block text-xl font-semibold text-graphite">{form.title}</span><span className="mt-3 block flex-1 text-sm leading-6 text-text-muted">{form.description}</span><span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">Presentar {form.type === 'comprar' ? 'una necesidad' : form.type === 'vender' ? 'mi oferta' : 'mi perfil'} <ArrowRight size={16} aria-hidden="true" /></span></button>
            })}
          </div>
        </div>
      </section>

      <section className="section-muted-depth bg-surface-muted px-5 py-14 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Presenta tu oportunidad</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-graphite md:text-4xl">Cuéntanos el contexto y los antecedentes necesarios</h2><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text-muted">Revisaremos la informacion antes de definir los proximos pasos.</p></div>
          <div id={`panel-${activeForm.type}`} className="mx-auto mt-10 max-w-5xl scroll-mt-28" role="tabpanel" aria-labelledby={`tab-${activeForm.type}`}>
            <div className="card-elevated rounded-lg border border-border bg-white p-5 sm:p-7"><OpportunityForm config={activeForm} /></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
              <div className="card-elevated flex gap-3 rounded-lg border bg-white p-5"><ShieldCheck className="mt-0.5 shrink-0 text-brand" size={22} aria-hidden="true" /><p className="text-sm leading-6 text-text-muted">Enviar estos antecedentes no garantiza aceptacion. Arista puede solicitar informacion adicional y evalua cada oportunidad segun su alcance y condiciones.</p></div>
              <section className="brand-feature-card rounded-lg border p-6 text-on-brand" aria-labelledby="opportunity-follow-up-title"><p id="opportunity-follow-up-title" className="text-sm font-semibold uppercase tracking-[0.18em] text-on-brand">Que ocurre despues</p><ol className="mt-5 grid gap-4 sm:grid-cols-3">{followUpSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-on-brand-muted"><span className="font-semibold text-on-brand">0{index + 1}</span><span>{step}</span></li>)}</ol></section>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-text-muted"><MessageSquareText className="shrink-0 text-brand" size={18} aria-hidden="true" /><span>¿Tienes una consulta general?</span><Link to="/contacto" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">Ir a Contacto <ArrowRight size={16} aria-hidden="true" /></Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
