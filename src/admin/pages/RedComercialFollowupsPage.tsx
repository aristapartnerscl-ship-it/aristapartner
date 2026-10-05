import { AlertCircle, CalendarCheck, CalendarClock, CircleDot, Clock3, Mail, MessageCircle, MoreHorizontal, Search, UserRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type {
  RedComercialFollowupFilters,
  RedComercialFollowupListItem,
  RedComercialFollowupMetricsRecord,
  RedComercialProspectActivityFormValues,
  RedComercialProspectDetailRecord,
  RedComercialProspectStatus,
  RepresentedCompanyRecord,
  CollaboratorRecord,
} from '../../types/admin'
import { isRedComercialAdmin } from '../red-comercial-utils'
import { useAdminAuth } from '../useAdminAuth'
import { ProspectDetailPanel } from './RedComercialProspectsPage'

const finalStatuses = new Set<RedComercialProspectStatus>(['agreed', 'not_interested', 'archived'])
const statusLabels: Record<string, string> = {
  to_contact: 'Por contactar', contacted_no_response: 'Sin respuesta', responded: 'Respondió', follow_up: 'En seguimiento',
  interested: 'Interesado', meeting_scheduled: 'Reunión agendada', agreed: 'Acordado', not_interested: 'No interesado', archived: 'Archivado',
}
const channelLabels: Record<string, string> = { email: 'Email', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', phone: 'Llamada', website: 'Sitio web', referral: 'Referido', other: 'Otro' }
const emptyMetrics: RedComercialFollowupMetricsRecord = { today: 0, overdue: 0, upcoming: 0, no_followup: 0, no_movement: 0, total: 0 }

function formatDate(value: string | null) {
  if (!value) return 'Sin contacto'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function initials(value: string | null | undefined) {
  return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '—'
}

function person(value: string | null) {
  return value?.trim().split(/\s+/).map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1).toLowerCase()}`).join(' ') || 'Sin responsable'
}

function activityIcon(type: string | null) {
  if (type === 'email') return <Mail size={13} className="text-sky-600" aria-hidden="true" />
  if (type === 'whatsapp') return <MessageCircle size={13} className="text-emerald-600" aria-hidden="true" />
  if (type === 'call') return <UserRound size={13} className="text-slate-600" aria-hidden="true" />
  return <CircleDot size={13} className="text-[#235b3e]" aria-hidden="true" />
}

function followupBadge(row: RedComercialFollowupListItem) {
  if (!row.next_followup_at) return <span className="text-slate-400">Sin programar</span>
  const date = new Date(row.next_followup_at)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"><CalendarCheck size={12} />Hoy</span>
  if (row.days_overdue > 0) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700"><AlertCircle size={12} />Vencido · {formatDate(row.next_followup_at)}</span>
  return <span className="inline-flex items-center gap-1 text-slate-700"><CalendarClock size={13} className="text-slate-400" />{formatDate(row.next_followup_at)}</span>
}

function DetailActivityModal({ prospect, onClose, onSaved }: { prospect: RedComercialProspectDetailRecord; onClose: () => void; onSaved: (detail: RedComercialProspectDetailRecord | null) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const values: RedComercialProspectActivityFormValues = {
      activity_type: data.get('activity_type') as RedComercialProspectActivityFormValues['activity_type'],
      title: String(data.get('title') ?? ''), description: String(data.get('description') ?? ''),
      activity_at: String(data.get('activity_at') ?? ''), next_followup_at: String(data.get('next_followup_at') ?? ''),
      status: '',
    }
    setSaving(true); setError('')
    const result = await adminRepository.createRedComercialProspectActivity(prospect.id, values)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onSaved(result.data)
  }
  return <AdminDetailModal title={`Registrar actividad · ${prospect.company_name}`} onClose={onClose}>
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget) }}>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <label className="grid gap-1 text-sm font-medium text-slate-700">Tipo<select name="activity_type" defaultValue="followup" className="rounded-md border border-[#c9c1b4] px-3 py-2.5"><option value="followup">Seguimiento</option><option value="call">Llamada</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="meeting">Reunión</option><option value="note">Nota</option></select></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Título<input name="title" defaultValue="Seguimiento realizado" className="rounded-md border border-[#c9c1b4] px-3 py-2.5" required /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Descripción<textarea name="description" rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Próximo seguimiento<input name="next_followup_at" type="datetime-local" className="rounded-md border border-[#c9c1b4] px-3 py-2.5" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-2 text-sm font-semibold">Cancelar</button><button disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-2 text-sm font-semibold text-white">Registrar actividad</button></div>
    </form>
  </AdminDetailModal>
}

function ScheduleModal({ prospect, onClose, onSave }: { prospect: RedComercialProspectDetailRecord; onClose: () => void; onSave: (date: string, note: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false)
  return <AdminDetailModal title="Reprogramar seguimiento" onClose={onClose}>
    <form className="grid gap-3" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); await onSave(String(data.get('next_followup_at') ?? ''), String(data.get('note') ?? '')); setSaving(false) }}>
      <p className="text-sm text-slate-600">Prospecto: <strong className="text-[#17202d]">{prospect.company_name}</strong></p>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Fecha y hora<input name="next_followup_at" type="datetime-local" required className="rounded-md border border-[#c9c1b4] px-3 py-2.5" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Nota opcional<textarea name="note" rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5" /></label>
      <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-2 text-sm font-semibold">Cancelar</button><button disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-2 text-sm font-semibold text-white">Guardar seguimiento</button></div>
    </form>
  </AdminDetailModal>
}

export function RedComercialFollowupsPage() {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [searchParams, setSearchParams] = useSearchParams()
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([])
  const [rows, setRows] = useState<RedComercialFollowupListItem[]>([])
  const [metrics, setMetrics] = useState(emptyMetrics)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<RedComercialProspectDetailRecord | null>(null)
  const [activityFor, setActivityFor] = useState<RedComercialProspectDetailRecord | null>(null)
  const [scheduleFor, setScheduleFor] = useState<RedComercialProspectDetailRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<RedComercialFollowupFilters>({ view: (searchParams.get('view') as RedComercialFollowupFilters['view']) || 'all', companyId: searchParams.get('company') || '', responsibleId: searchParams.get('responsible') || '', page: 1, pageSize: 25 })
  const pageSize = filters.pageSize ?? 25
  const page = filters.page ?? 1
  const selectedCompany = companies.find((company) => company.id === filters.companyId)

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      const [companyResult, collaboratorResult] = await Promise.all([admin ? adminRepository.listRepresentedCompanies() : adminRepository.listMyRepresentedCompanies(), admin ? adminRepository.listCollaborators() : Promise.resolve({ data: [], error: null })])
      if (cancelled) return
      const available = companyResult.data.filter((company) => company.status === 'active')
      setCompanies(available); setCollaborators(collaboratorResult.data); setError(companyResult.error ?? collaboratorResult.error ?? '')
      setFilters((current) => ({ ...current, companyId: current.companyId || available[0]?.id || '' }))
    }
    void loadOptions()
    return () => { cancelled = true }
  }, [admin])

  const load = useCallback(async () => {
    setLoading(true)
    const [listResult, metricResult] = await Promise.all([adminRepository.listRedComercialFollowups(filters), adminRepository.getRedComercialFollowupMetrics(filters)])
    setRows(listResult.data.rows); setTotal(listResult.data.total); setMetrics(metricResult.data); setError(listResult.error ?? metricResult.error ?? ''); setLoading(false)
  }, [filters])
  useEffect(() => { void load() }, [load])

  function updateFilters(next: Partial<RedComercialFollowupFilters>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }))
    const params = new URLSearchParams()
    if (next.view ?? filters.view) params.set('view', next.view ?? filters.view ?? 'all')
    if (next.companyId ?? filters.companyId) params.set('company', next.companyId ?? filters.companyId ?? '')
    if (next.responsibleId ?? filters.responsibleId) params.set('responsible', next.responsibleId ?? filters.responsibleId ?? '')
    setSearchParams(params, { replace: true })
  }

  async function openDetail(id: string) {
    const result = await adminRepository.getRedComercialProspectDetail(id)
    if (result.error) setError(result.error); else setSelected(result.data)
  }

  const chips = useMemo(() => [
    ['all', 'Todos', metrics.total], ['today', 'Hoy', metrics.today], ['overdue', 'Vencidos', metrics.overdue], ['upcoming', 'Próximos', metrics.upcoming], ['no_followup', 'Sin seguimiento', metrics.no_followup], ['stale', 'Sin movimiento', metrics.no_movement],
  ] as const, [metrics])

  async function saveScheduled(value: string, note: string): Promise<boolean> {
    if (!selected) return false
    const result = await adminRepository.createRedComercialProspectActivity(selected.id, { activity_type: 'followup', title: 'Seguimiento programado', description: note, activity_at: '', next_followup_at: value, status: '' })
    if (result.error) { setError(result.error); return false }
    setSelected(result.data); await load(); return true
  }

  return <div className={`grid min-w-0 grid-cols-1 items-start gap-3 ${selected ? 'xl:pr-[398px]' : ''}`}>
    <div className="grid min-w-0 gap-3">
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#235b3e]">Red Comercial / Seguimientos</p><h1 className="mt-1 text-[28px] font-semibold leading-tight text-[#17202d]">Seguimientos</h1><p className="mt-0.5 text-[13px] text-slate-600">Agenda comercial de prospectos, próximos contactos y tareas pendientes.</p></div>
      <span className="inline-flex items-center gap-2 rounded-md border border-[#ddd6ca] bg-white px-3 py-2 text-xs font-semibold text-slate-600"><CalendarCheck size={15} className="text-[#235b3e]" />Hoy: {formatDate(new Date().toISOString())}</span>
    </div>
    <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
      {([['Hoy', metrics.today, CalendarCheck, 'bg-amber-50 text-amber-700'], ['Vencidos', metrics.overdue, AlertCircle, 'bg-rose-50 text-rose-700'], ['Próximos 7 días', metrics.upcoming, CalendarClock, 'bg-sky-50 text-sky-700'], ['Sin seguimiento', metrics.no_followup, CircleDot, 'bg-slate-100 text-slate-600'], ['Sin movimiento', metrics.no_movement, Clock3, 'bg-violet-50 text-violet-700']] as const).map(([label, value, Icon, tone]) => <div key={label} className="min-h-[78px] rounded-lg border border-[#ddd6ca] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)]"><div className="flex items-center justify-between"><div><p className="text-[25px] font-semibold leading-none text-[#17202d]">{value}</p><p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p></div><span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tone}`}><Icon size={16} /></span></div></div>)}
    </div>
    <section className="rounded-lg border border-[#ddd6ca] bg-white p-2 shadow-[0_1px_2px_rgba(23,32,45,0.025)]">
      <div className="grid min-w-0 grid-cols-1 items-end gap-1.5 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1fr)_150px_140px_115px_115px_auto]">
        <label className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" /><input value={filters.search ?? ''} onChange={(event) => updateFilters({ search: event.target.value })} placeholder="Buscar prospecto o empresa..." className="h-9 w-full rounded-md border border-[#c9c1b4] pl-9 pr-3 text-[13px] outline-none focus:border-[#235b3e]" /></label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Empresa Arista<select value={filters.companyId ?? ''} onChange={(event) => updateFilters({ companyId: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todas</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Responsable<select value={filters.responsibleId ?? ''} onChange={(event) => updateFilters({ responsibleId: event.target.value })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option>{collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{person(collaborator.full_name)}</option>)}</select></label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Estado<select value={filters.status ?? ''} onChange={(event) => updateFilters({ status: event.target.value as RedComercialProspectStatus | '' })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option>{Object.entries(statusLabels).filter(([value]) => !finalStatuses.has(value as RedComercialProspectStatus)).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Canal<select value={filters.channel ?? ''} onChange={(event) => updateFilters({ channel: event.target.value as RedComercialFollowupFilters['channel'] })} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] font-normal normal-case tracking-normal text-slate-700"><option value="">Todos</option>{Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {admin && <button type="button" onClick={() => updateFilters({ mine: !filters.mine })} className={`h-9 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold ${filters.mine ? 'border-[#235b3e] bg-[#e7f0ea] text-[#235b3e]' : 'border-[#ddd6ca] text-slate-600'}`}>Mis seguimientos</button>}
      </div>
      <div className="mt-1.5 flex min-h-[28px] flex-wrap items-center gap-1.5">{chips.map(([key, label, count]) => <button key={key} type="button" onClick={() => updateFilters({ view: key })} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${filters.view === key ? 'border-[#235b3e] bg-[#e7f0ea] text-[#235b3e]' : 'border-[#ddd6ca] text-slate-600'}`}>{label}<span className="rounded-full bg-[#f0eee8] px-1.5 py-0.5 text-[10px] text-slate-500">{count}</span></button>)}</div>
    </section>
      <div className="min-w-0 rounded-lg border border-[#ddd6ca] bg-white shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
        {error && <p className="m-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
        {loading ? <p className="px-4 py-8 text-sm text-slate-500">Cargando seguimientos...</p> : rows.length === 0 ? <EmptyState title="Todo al día" text="No tienes seguimientos pendientes en esta vista." /> : <>
          <div className="overflow-x-auto"><table className="min-w-[980px] w-full text-left text-[12px]"><thead className="bg-[#fbfaf7] text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"><tr>{['Empresa Arista', 'Prospecto', 'Estado', 'Canal', 'Último contacto', 'Próximo seguimiento', 'Responsable', 'Última actividad', 'Acción'].map((header) => <th key={header} className="whitespace-nowrap border-b border-[#eee8dd] px-3 py-2.5">{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={() => void openDetail(row.id)} className="cursor-pointer border-b border-[#f1ece3] transition hover:bg-[#f7faf7]"><td className="px-3 py-2"><span className="flex items-center gap-2"><span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#e7f0ea] text-[10px] font-bold text-[#235b3e]">{selectedCompany && selectedCompany.id === row.represented_company_id ? <CompanyLogo company={selectedCompany} size="sm" /> : initials(row.represented_company_name)}</span><span className="max-w-[150px] truncate font-semibold text-[#17202d]">{row.represented_company_name}</span></span></td><td className="px-3 py-2 font-semibold text-[#17202d]">{row.company_name}</td><td className="px-3 py-2"><span className="rounded-full bg-[#e7f0ea] px-2 py-1 text-[11px] font-semibold text-[#235b3e]">{statusLabels[row.status] ?? row.status}</span></td><td className="px-3 py-2"><span className="inline-flex items-center gap-1">{activityIcon(row.channel)}{row.channel ? channelLabels[row.channel] : <span className="text-slate-400">Sin canal</span>}</span></td><td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDate(row.last_contact_at)}</td><td className="whitespace-nowrap px-3 py-2">{followupBadge(row)}</td><td className="px-3 py-2"><span className="inline-flex items-center gap-1.5"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ef] text-[10px] font-bold text-[#235b3e]">{initials(row.owner_name)}</span>{person(row.owner_name)}</span></td><td className="px-3 py-2 text-slate-600">{row.latest_activity_title ? <span className="inline-flex items-center gap-1">{activityIcon(row.latest_activity_type)}<span className="max-w-[150px] truncate">{row.latest_activity_title}</span></span> : <span className="text-slate-400">Sin actividad</span>}</td><td className="px-3 py-2"><button type="button" onClick={(event) => { event.stopPropagation(); void openDetail(row.id) }} aria-label={`Abrir ${row.company_name}`} className="rounded-md border border-[#c9c1b4] p-1.5 text-[#17202d]"><MoreHorizontal size={15} /></button></td></tr>)}</tbody></table></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8dd] bg-[#fdfcf9] px-3 py-2 text-[13px] text-slate-600"><span>{total} seguimientos</span><div className="flex items-center gap-2"><select value={pageSize} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))} className="rounded-md border border-[#c9c1b4] bg-white px-2 py-1">{[25, 50, 100].map((size) => <option key={size}>{size}</option>)}</select><button type="button" disabled={page <= 1} onClick={() => setFilters((current) => ({ ...current, page: page - 1 }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Anterior</button><span>Página {page}</span><button type="button" disabled={page * pageSize >= total} onClick={() => setFilters((current) => ({ ...current, page: page + 1 }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Siguiente</button></div></div>
        </>}
      </div>
      </div>
    {selected && <ProspectDetailPanel prospect={selected} onClose={() => setSelected(null)} onActivity={() => setActivityFor(selected)} onSchedule={() => setScheduleFor(selected)} onChanged={() => { void load() }} />}
    {activityFor && <DetailActivityModal prospect={activityFor} onClose={() => setActivityFor(null)} onSaved={(detail) => { setActivityFor(null); setSelected(detail); void load() }} />}
    {scheduleFor && <ScheduleModal prospect={scheduleFor} onClose={() => setScheduleFor(null)} onSave={async (date, note) => { if (await saveScheduled(new Date(date).toISOString(), note)) setScheduleFor(null) }} />}
  </div>
}
