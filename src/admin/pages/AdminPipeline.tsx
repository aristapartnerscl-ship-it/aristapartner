import { ArrowRight, CalendarClock, Filter } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { CommercialProposalWithOpportunity, OpportunityRecord, ProspectRecord } from '../../types/admin'
import { opportunityStatusLabels, opportunityTypeLabels, priorityLabels, prospectStatusLabels, prospectTemperatureLabels } from '../opportunity-labels'

type PipelineFilter = 'all' | 'prospects' | 'opportunities' | 'overdue' | 'today' | 'converted'
const filters: Array<[PipelineFilter, string]> = [['all', 'Todos'], ['prospects', 'Solo prospectos'], ['opportunities', 'Solo oportunidades'], ['overdue', 'Vencidos'], ['today', 'Hoy'], ['converted', 'Convertidos / ganadas']]

function sameDay(value: string | null, date = new Date()) {
  if (!value) return false
  const target = new Date(value)
  return target.getFullYear() === date.getFullYear() && target.getMonth() === date.getMonth() && target.getDate() === date.getDate()
}
function overdue(value: string | null) { return Boolean(value && new Date(value).getTime() < Date.now()) }
function activeProspect(item: ProspectRecord) { return !['converted', 'archived', 'not_interested'].includes(item.status) }
function activeOpportunity(item: OpportunityRecord) { return !['won', 'lost', 'rejected', 'archived'].includes(item.status) }
function prospectName(item: ProspectRecord) { return item.full_name || item.company_name || 'Prospecto sin nombre' }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha' }

export function AdminPipeline() {
  const [params, setParams] = useSearchParams()
  const [prospects, setProspects] = useState<ProspectRecord[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([])
  const [proposals, setProposals] = useState<CommercialProposalWithOpportunity[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const filter = (params.get('vista') as PipelineFilter | null) ?? 'all'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const [prospectResult, opportunityResult, proposalResult] = await Promise.all([adminRepository.listProspects(), adminRepository.listOpportunities(), adminRepository.listCommercialProposals()])
      if (cancelled) return
      setLoading(false)
      if (prospectResult.error && opportunityResult.error) { setError('No fue posible cargar el pipeline comercial.'); return }
      setError('')
      setProspects(prospectResult.error ? [] : prospectResult.data)
      setOpportunities(opportunityResult.error ? [] : opportunityResult.data)
      setProposals(proposalResult.error ? [] : proposalResult.data)
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const visibleProspects = useMemo(() => prospects.filter((item) => {
    if (filter === 'opportunities') return false
    if (filter === 'overdue' && (!activeProspect(item) || !overdue(item.next_action_at))) return false
    if (filter === 'today' && (!activeProspect(item) || !sameDay(item.next_action_at))) return false
    if (filter === 'converted' && item.status !== 'converted') return false
    return true
  }), [filter, prospects])
  const visibleOpportunities = useMemo(() => opportunities.filter((item) => {
    if (filter === 'prospects' || filter === 'overdue' || filter === 'today') return false
    if (filter === 'converted' && item.status !== 'won') return false
    return true
  }), [filter, opportunities])
  const summary = {
    activeProspects: prospects.filter(activeProspect).length,
    activeOpportunities: opportunities.filter(activeOpportunity).length,
    overdue: prospects.filter((item) => activeProspect(item) && overdue(item.next_action_at)).length,
    converted: prospects.filter((item) => item.status === 'converted' && item.converted_at && new Date(item.converted_at).getMonth() === new Date().getMonth()).length + opportunities.filter((item) => item.status === 'won').length,
  }

  function setFilter(value: PipelineFilter) {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete('vista'); else next.set('vista', value)
    setParams(next)
  }

  return <div className="grid gap-6">
    <AdminPageHeader title="Pipeline comercial" text="Resumen operativo de prospectos y oportunidades." />
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros del pipeline">
      {filters.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === value ? 'bg-[#17202d] text-white' : 'border border-slate-300 text-[#17202d]'}`}><Filter size={15} className="mr-2 inline" />{label}</button>)}
    </div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Prospectos activos", summary.activeProspects], ["Oportunidades activas", summary.activeOpportunities], ["Seguimientos vencidos", summary.overdue], ["Convertidos / ganadas", summary.converted]].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-semibold text-[#17202d]">{value}</p></div>)}
    </section>
    {loading && <div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />}
    {!loading && error && <section className="rounded-lg border border-red-200 bg-red-50 p-6"><h2 className="font-semibold">No fue posible cargar el pipeline</h2><p className="mt-2 text-sm">{error}</p></section>}
    {!loading && !error && <><PipelineProspects items={visibleProspects} /><PipelineOpportunities items={visibleOpportunities} proposals={proposals} /></>}
  </div>
}

function PipelineProspects({ items }: { items: ProspectRecord[] }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold text-[#17202d]">Prospectos</h2>{items.length === 0 ? <EmptyState title="Sin prospectos en esta vista" text="Prueba otro filtro del pipeline." /> : <div className="mt-4 grid gap-3">{items.map((item) => <article key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr_auto] lg:items-center"><div><Link to={`/admin/prospeccion/${item.id}`} className="font-semibold text-[#17202d] hover:text-[#235b3e]">{prospectName(item)}</Link><p className="text-sm text-slate-600">{item.company_name || 'Sin empresa'}</p></div><span className="text-sm">{prospectStatusLabels[item.status]}</span><span className="text-sm">{priorityLabels[item.priority]} · {prospectTemperatureLabels[item.lead_temperature]}</span><span className="text-sm">{item.next_action_type || 'Sin acción'}</span><span className="text-sm text-slate-600">{formatDate(item.next_action_at)}</span><Link to={`/admin/prospeccion/${item.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#235b3e]">Abrir <ArrowRight size={16} /></Link></article>)}</div>}</section>
}

function PipelineOpportunities({ items, proposals }: { items: OpportunityRecord[]; proposals: CommercialProposalWithOpportunity[] }) {
  const latest = new Map<string, CommercialProposalWithOpportunity>()
  proposals.forEach((proposal) => { if (!latest.has(proposal.opportunity_id)) latest.set(proposal.opportunity_id, proposal) })
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="text-xl font-semibold text-[#17202d]">Oportunidades</h2>{items.length === 0 ? <EmptyState title="Sin oportunidades en esta vista" text="Prueba otro filtro del pipeline." /> : <div className="mt-4 grid gap-3">{items.map((item) => { const proposal = latest.get(item.id); return <article key={item.id} className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1fr_1.2fr_0.8fr_1fr_1fr_1.3fr_auto] lg:items-center"><div><Link to={`/admin/oportunidades/${item.id}`} className="font-semibold text-[#17202d] hover:text-[#235b3e]">{item.reference_code}</Link><p className="text-sm text-slate-600">{item.title}</p></div><span className="text-sm">{opportunityTypeLabels[item.opportunity_type]}</span><span className="text-sm">{opportunityStatusLabels[item.status]}</span><span className="text-sm">{item.estimated_value != null ? `${item.estimated_value.toLocaleString('es-CL')} ${item.currency || ''}` : 'Sin valor'}</span><span className="text-sm text-slate-600"><CalendarClock size={15} className="mr-1 inline" />{formatDate(item.expected_date)}</span><span className="text-sm text-slate-600">Propuesta: {proposal ? proposal.status : 'Sin propuesta'}{proposal ? ` · ${proposal.total_amount.toLocaleString('es-CL')} ${proposal.currency || ''}` : ''}</span><Link to={`/admin/oportunidades/${item.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#235b3e]">Abrir <ArrowRight size={16} /></Link></article> })}</div>}</section>
}
