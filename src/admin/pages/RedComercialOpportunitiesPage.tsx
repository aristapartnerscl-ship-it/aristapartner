import { BadgeCheck, Building2, CircleDollarSign, Clock3, FileCheck2, MoreHorizontal, Search, WalletCards } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { RedComercialOpportunityFilters, RedComercialOpportunityListItem, RedComercialOpportunityMetricsRecord, RedComercialProspectDetailRecord, RepresentedCompanyRecord } from '../../types/admin'
import { isRedComercialAdmin } from '../red-comercial-utils'
import { getOpportunityFinancialCue, getOpportunityPresentation } from '../opportunity-status'
import { useAdminAuth } from '../useAdminAuth'
import { ProspectDetailPanel } from './RedComercialProspectsPage'

const emptyMetrics: RedComercialOpportunityMetricsRecord = { total: 0, in_process: 0, arista: 0, collaborator: 0, contract_pending: 0, payment_pending: 0, commission_pending: 0, won: 0, lost: 0 }

function initials(value: string | null | undefined) { return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '—' }
function person(value: string | null | undefined) { return value?.trim().split(/\s+/).map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1).toLowerCase()}`).join(' ') || 'Sin atribución' }
function date(value: string | null | undefined) { return value ? new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : 'Sin fecha' }
function money(value: number | null, currency: string) { return value == null ? '—' : new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value) }
function participation(value: RedComercialOpportunityListItem) {
  if (value.collaborator_compensation_type === 'percentage' && value.collaborator_compensation_rate != null) return `${value.collaborator_compensation_rate}%`
  if (value.collaborator_compensation_type === 'fixed_amount' && value.collaborator_compensation_amount != null) return money(value.collaborator_compensation_amount, value.currency)
  return 'Sin definir'
}

function Badge({ kind, value }: { kind: 'control' | 'contract' | 'payment' | 'commission' | 'result'; value: string }) {
  const presentation = getOpportunityPresentation(kind, value)
  return <span className={`inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2 text-[10.5px] font-semibold ${presentation.className}`}>{presentation.label}</span>
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Building2; tone: string }) {
  return <div className="min-h-[78px] rounded-lg border border-[#ddd6ca] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)]"><div className="flex items-center justify-between gap-2"><div><p className="text-[25px] font-semibold leading-none text-[#17202d]">{value}</p><p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p></div><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tone}`}><Icon size={16} /></span></div></div>
}

export function RedComercialOpportunitiesPage() {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [searchParams, setSearchParams] = useSearchParams()
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [collaborators, setCollaborators] = useState<Array<{ id: string; full_name: string | null }>>([])
  const [rows, setRows] = useState<RedComercialOpportunityListItem[]>([])
  const [metrics, setMetrics] = useState(emptyMetrics)
  const [selected, setSelected] = useState<{ row: RedComercialOpportunityListItem; prospect: RedComercialProspectDetailRecord } | null>(null)
  const [filters, setFilters] = useState<RedComercialOpportunityFilters>({ view: (searchParams.get('view') as RedComercialOpportunityFilters['view']) || 'all', companyId: searchParams.get('company') || '', controlMode: (searchParams.get('control') as RedComercialOpportunityFilters['controlMode']) || '', responsibleId: searchParams.get('responsible') || '', page: 1, pageSize: 25 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.dataset.redProspectDetail = selected ? 'open' : 'closed'
    window.dispatchEvent(new Event('arista-red-prospect-detail'))
    return () => { delete document.documentElement.dataset.redProspectDetail; window.dispatchEvent(new Event('arista-red-prospect-detail')) }
  }, [selected])

  useEffect(() => {
    async function loadOptions() {
      const companyResult = admin ? await adminRepository.listRepresentedCompanies() : await adminRepository.listMyRepresentedCompanies()
      const collaboratorResult = admin ? await adminRepository.listCollaborators() : { data: [], error: null }
      setCompanies(companyResult.data.filter((company) => company.status === 'active'))
      setCollaborators(collaboratorResult.data.map((item) => ({ id: item.id, full_name: item.full_name })))
      setError(companyResult.error ?? collaboratorResult.error ?? '')
    }
    void loadOptions()
  }, [admin])

  const load = useCallback(async () => {
    setLoading(true)
    const [listResult, metricResult] = await Promise.all([adminRepository.listRedComercialOpportunities(filters), adminRepository.getRedComercialOpportunityMetrics(filters)])
    setRows(listResult.data.rows)
    setTotal(listResult.data.total)
    setMetrics(metricResult.data)
    setError(listResult.error ?? metricResult.error ?? '')
    setLoading(false)
  }, [filters])

  useEffect(() => { void load() }, [load])

  function updateFilters(next: Partial<RedComercialOpportunityFilters>) {
    const updated = { ...filters, ...next, page: 1 }
    setFilters(updated)
    const params: Record<string, string> = {}
    if (updated.view && updated.view !== 'all') params.view = updated.view
    if (updated.companyId) params.company = updated.companyId
    if (updated.controlMode) params.control = updated.controlMode
    if (updated.responsibleId) params.responsible = updated.responsibleId
    setSearchParams(params)
  }

  async function openRow(row: RedComercialOpportunityListItem) {
    const result = await adminRepository.getRedComercialProspectDetail(row.prospect_id)
    if (result.data) setSelected({ row, prospect: result.data }); else setError(result.error ?? 'No fue posible abrir la oportunidad.')
  }

  const chips: Array<{ key: NonNullable<RedComercialOpportunityFilters['view']>; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: metrics.total }, { key: 'in_process', label: 'En proceso', count: metrics.in_process }, { key: 'arista', label: 'Entregadas a Arista', count: metrics.arista }, { key: 'contract_pending', label: 'Contrato pendiente', count: metrics.contract_pending }, { key: 'payment_pending', label: 'Pago pendiente', count: metrics.payment_pending }, { key: 'commission_pending', label: 'Participación pendiente', count: metrics.commission_pending }, { key: 'won', label: 'Ganadas', count: metrics.won }, { key: 'lost', label: 'Perdidas', count: metrics.lost },
  ]

  return <div className="grid min-w-0 gap-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#235b3e]">Red Comercial / Oportunidades</p><h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-[#17202d]">Oportunidades</h1><p className="mt-0.5 text-[13px] text-slate-600">Gestión de operaciones comerciales, contratos, pagos y cierres.</p></div></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">No fue posible cargar las oportunidades.</div>}
    <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2"><Metric label="En proceso" value={metrics.in_process} icon={Clock3} tone="bg-sky-50 text-sky-700" /><Metric label="Gestión Arista" value={metrics.arista} icon={Building2} tone="bg-[#e7f0ea] text-[#235b3e]" /><Metric label="Gestión colaborador" value={metrics.collaborator} icon={CircleDollarSign} tone="bg-violet-50 text-violet-700" /><Metric label="Contrato pendiente" value={metrics.contract_pending} icon={FileCheck2} tone="bg-amber-50 text-amber-700" /><Metric label="Pago pendiente" value={metrics.payment_pending} icon={WalletCards} tone="bg-orange-50 text-orange-700" /><Metric label="Ganadas" value={metrics.won} icon={BadgeCheck} tone="bg-[#e7f0ea] text-[#235b3e]" /></div>
    <section className="rounded-lg border border-[#ddd6ca] bg-white p-2 shadow-[0_1px_2px_rgba(23,32,45,0.025)]"><div className="grid min-w-0 grid-cols-1 items-end gap-2 xl:grid-cols-[minmax(230px,1fr)_180px_130px_140px_130px_145px]"><label className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={filters.search ?? ''} onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Buscar cliente o empresa..." className="h-9 w-full rounded-md border border-[#c9c1b4] pl-9 pr-3 text-[13px]" /></label><label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Empresa Arista<select value={filters.companyId ?? ''} onChange={(event) => updateFilters({ companyId: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Control<select value={filters.controlMode ?? ''} onChange={(event) => updateFilters({ controlMode: event.target.value as RedComercialOpportunityFilters['controlMode'] })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option><option value="collaborator">Colaborador</option><option value="arista">Arista</option><option value="shared">Compartida</option></select></label><label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Contrato<select value={filters.contractStatus ?? ''} onChange={(event) => updateFilters({ contractStatus: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option><option value="pending">Pendiente</option><option value="signed">Firmado</option></select></label><label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Pago cliente<select value={filters.paymentStatus ?? ''} onChange={(event) => updateFilters({ paymentStatus: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option><option value="pending">Pendiente</option><option value="partial">Parcial</option><option value="paid">Pagado</option><option value="overdue">Vencido</option></select></label><label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Responsable<select value={filters.responsibleId ?? ''} onChange={(event) => updateFilters({ responsibleId: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option>{collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || 'Sin nombre'}</option>)}</select></label></div><div className="mt-1.5 flex flex-wrap gap-1.5">{chips.map((chip) => <button key={chip.key} type="button" onClick={() => updateFilters({ view: chip.key })} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${filters.view === chip.key ? 'border-[#235b3e] bg-[#e7f0ea] text-[#235b3e]' : 'border-[#ddd6ca] text-slate-600'}`}>{chip.label}<span className="rounded-full bg-[#f0eee8] px-1.5 py-0.5 text-[10px]">{chip.count}</span></button>)}</div></section>
    {loading ? <div className="rounded-lg border border-[#ddd6ca] bg-white px-4 py-5 text-sm text-slate-500">Cargando oportunidades...</div> : rows.length === 0 ? <EmptyState title="Sin oportunidades" text="Aún no existen oportunidades comerciales para esta vista." /> : <div className="min-w-0 overflow-hidden rounded-xl border border-[#ddd6ca] bg-white shadow-[0_1px_2px_rgba(23,32,45,0.035)]"><div className="overflow-x-auto"><table className="min-w-[1240px] w-full table-fixed border-separate border-spacing-0 text-left text-[12px]"><colgroup>{[145, 160, 145, 125, 125, 125, 145, 110, 105, 60].map((width, index) => <col key={index} style={{ width }} />)}</colgroup><thead className="bg-[#fbfaf7] text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"><tr>{['Empresa Arista', 'Cliente / Prospecto', 'Responsable / atribución', 'Control', 'Contrato', 'Pago cliente', admin ? 'Comisión colaborador' : 'Mi participación', 'Resultado', 'Actualizado', 'Acción'].map((header) => <th key={header} className="border-b border-[#eee8dd] px-2.5 py-2">{header}</th>)}</tr></thead><tbody>{rows.map((row) => { const cue = getOpportunityFinancialCue(row.payment_status, row.commission_status); return <tr key={row.id} onClick={() => void openRow(row)} className={`group cursor-pointer border-b border-[#f1ece3] hover:bg-[#f7faf7] ${cue.rowClassName}`}><td className="border-b border-[#f1ece3] px-2.5 py-2"><span className="inline-flex items-center gap-2 font-semibold text-[#17202d]"><CompanyLogo company={{ name: row.represented_company_name, logo_storage_path: row.represented_company_logo_storage_path }} size="xs" />{row.represented_company_name}</span></td><td className="border-b border-[#f1ece3] px-2.5 py-2"><span className="inline-flex items-center gap-2 font-semibold text-[#17202d]"><CompanyLogo company={{ name: row.prospect_company_name, logo_storage_path: row.prospect_logo_storage_path }} size="xs" />{row.prospect_company_name}</span></td><td className="border-b border-[#f1ece3] px-2.5 py-2">{row.attributed_collaborator_name ? <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ef] text-[10px] font-bold text-[#235b3e]">{initials(row.attributed_collaborator_name)}</span>{person(row.attributed_collaborator_name)}</span> : <span className="text-slate-400">Sin atribución</span>}</td><td className="border-b border-[#f1ece3] px-2.5 py-2"><Badge kind="control" value={row.control_mode} /></td><td className="border-b border-[#f1ece3] px-2.5 py-2"><Badge kind="contract" value={row.contract_status} /></td><td className="border-b border-[#f1ece3] px-2.5 py-2"><Badge kind="payment" value={row.payment_status} /></td><td className="border-b border-[#f1ece3] px-2.5 py-2"><div className="grid gap-1"><Badge kind="commission" value={row.commission_status} />{!admin && <span className="text-[10px] font-semibold text-slate-500">{participation(row)}</span>}</div></td><td className="border-b border-[#f1ece3] px-2.5 py-2"><Badge kind="result" value={row.result_status} /></td><td className="border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{date(row.updated_at)}{admin && <div className="text-[10px] text-slate-400">{money(row.sale_net_amount, row.currency)}</div>}</td><td className="border-b border-[#f1ece3] px-2.5 py-2"><button type="button" onClick={(event) => { event.stopPropagation(); void openRow(row) }} aria-label={`Abrir ${row.prospect_company_name}`} className="rounded-md border border-[#c9c1b4] p-1.5"><MoreHorizontal size={15} /></button></td></tr>})}</tbody></table></div><div className="flex items-center justify-between border-t border-[#eee8dd] bg-[#fdfcf9] px-3 py-2 text-[13px] text-slate-600"><span>{total} oportunidades</span><div className="flex items-center gap-2"><select value={filters.pageSize ?? 25} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))} className="rounded-md border border-[#c9c1b4] bg-white px-2 py-1">{[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select><button type="button" disabled={(filters.page ?? 1) <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, (current.page ?? 1) - 1) }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Anterior</button><span>Página {filters.page ?? 1}</span><button type="button" disabled={(filters.page ?? 1) * (filters.pageSize ?? 25) >= total} onClick={() => setFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Siguiente</button></div></div></div>}
    {selected && <ProspectDetailPanel prospect={selected.prospect} opportunityId={selected.row.id} onClose={() => setSelected(null)} onChanged={() => { void load() }} />}
  </div>
}
