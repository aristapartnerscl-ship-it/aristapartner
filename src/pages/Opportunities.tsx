import { useEffect } from 'react'
import { ArrowRight, MessageSquareText, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { OpportunityForm } from '../components/opportunities/OpportunityForm'
import { opportunityForms, type OpportunityType } from '../data/opportunityForms'

const validTypes = new Set<OpportunityType>(['comprar', 'vender', 'proveedor'])

const followUpSteps = [
  'Recepción de antecedentes.',
  'Evaluación inicial según alcance y condiciones.',
  'Contacto para próximos pasos si existe encaje.',
]

export function Opportunities() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedType = searchParams.get('tipo')
  const activeType: OpportunityType = validTypes.has(selectedType as OpportunityType)
    ? (selectedType as OpportunityType)
    : 'comprar'
  const activeForm = opportunityForms.find((form) => form.type === activeType) ?? opportunityForms[0]

  useEffect(() => {
    if (!validTypes.has(selectedType as OpportunityType)) {
      setSearchParams({ tipo: 'comprar' }, { replace: true })
    }
  }, [selectedType, setSearchParams])

  function selectType(type: OpportunityType) {
    setSearchParams({ tipo: type })
  }

  return (
    <section className="bg-surface-muted px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Oportunidades</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-graphite md:text-5xl">
            Presenta una necesidad, una oferta o tu perfil de proveedor
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">
            Elige el punto de partida que mejor representa tu situación. Cada antecedente será evaluado antes de definir cómo avanzar.
          </p>
        </div>

        <div className="mt-10 grid gap-4 rounded-lg border border-border bg-white p-4 shadow-sm md:grid-cols-3" role="tablist" aria-label="Tipo de oportunidad">
          {opportunityForms.map((form) => {
            const Icon = form.icon
            const isActive = form.type === activeType

            return (
              <button
                key={form.type}
                id={`tab-${form.type}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${form.type}`}
                onClick={() => selectType(form.type)}
                className={`rounded-md border p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                  isActive
                    ? 'border-brand bg-surface-muted shadow-sm'
                    : 'border-border bg-white hover:border-brand/60 hover:bg-surface-muted'
                }`}
              >
                <Icon className="text-brand" size={28} aria-hidden="true" />
                <span className="mt-4 block text-lg font-semibold text-graphite">{form.title}</span>
                <span className="mt-2 block text-sm leading-6 text-text-muted">{form.description}</span>
              </button>
            )
          })}
        </div>

        <div id={`panel-${activeForm.type}`} className="mt-8 scroll-mt-28" role="tabpanel" aria-labelledby={`tab-${activeForm.type}`}>
          <div className="mx-auto max-w-5xl rounded-lg border border-border bg-white p-5 sm:p-7">
            <OpportunityForm config={activeForm} />
          </div>
          <div className="mx-auto mt-6 grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex gap-3 rounded-lg border border-brand/20 bg-surface-muted p-5">
              <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={22} aria-hidden="true" />
              <p className="text-sm leading-6 text-text-muted">Enviar estos antecedentes no garantiza aceptación. Arista puede solicitar información adicional y evalúa cada oportunidad según su alcance y condiciones.</p>
            </div>
            <section className="rounded-lg border border-on-brand-border bg-brand-dark p-5 text-on-brand" aria-labelledby="opportunity-follow-up-title">
              <p id="opportunity-follow-up-title" className="text-sm font-semibold uppercase tracking-[0.18em] text-on-brand">Qué ocurre después</p>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {followUpSteps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-on-brand-muted">
                    <span className="font-semibold text-on-brand">0{index + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <div className="mx-auto mt-6 flex max-w-5xl items-center gap-2 text-sm text-text-muted">
            <MessageSquareText className="shrink-0 text-brand" size={18} aria-hidden="true" />
            <span>¿Tienes una consulta general?</span>
            <Link to="/contacto" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-dark">Ir a Contacto <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
