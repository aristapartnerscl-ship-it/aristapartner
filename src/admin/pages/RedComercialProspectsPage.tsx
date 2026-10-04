import { BriefcaseBusiness, CalendarClock, CalendarDays, CheckCircle2, CircleDot, Clock3, Globe2, Mail, MessageCircle, MoreHorizontal, Phone, Plus, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type {
  CollaboratorRecord,
  RedComercialProspectActivityFormValues,
  RedComercialProspectChannel,
  RedComercialProspectDetailRecord,
  RedComercialProspectFilters,
  RedComercialProspectFormValues,
  RedComercialProspectListItem,
  RedComercialProspectMetricsRecord,
  RedComercialProspectStatus,
  RepresentedCompanyMembershipRecord,
  RepresentedCompanyRecord,
} from '../../types/admin'
import { getCompanyAccentColor, hexToRgba, isRedComercialAdmin } from '../red-comercial-utils'
import { getProspectStatusPresentation } from '../prospect-status'
import { useAdminAuth } from '../useAdminAuth'
import { RedComercialProspectDetailPanel } from './RedComercialProspectDetailPanel'

const statusOptions: Array<{ value: RedComercialProspectStatus; label: string; className: string }> = [
  { value: 'to_contact', label: 'Por contactar', className: 'bg-stone-100 text-stone-700 ring-stone-200' },
  { value: 'contacted_no_response', label: 'Contactado - sin respuesta', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { value: 'responded', label: 'Respondio', className: 'bg-sky-50 text-sky-800 ring-sky-200' },
  { value: 'follow_up', label: 'En seguimiento', className: 'bg-blue-50 text-blue-800 ring-blue-200' },
  { value: 'interested', label: 'Interesado', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  { value: 'meeting_scheduled', label: 'Reunion agendada', className: 'bg-violet-50 text-violet-800 ring-violet-200' },
  { value: 'agreed', label: 'Acordado', className: 'bg-[#e7f0ea] text-[#235b3e] ring-[#c9dfd0]' },
  { value: 'not_interested', label: 'No interesado', className: 'bg-red-50 text-red-800 ring-red-200' },
  { value: 'archived', label: 'Archivado', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
]

const channelOptions: Array<{ value: RedComercialProspectChannel; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'phone', label: 'Llamada' },
  { value: 'website', label: 'Sitio web' },
  { value: 'referral', label: 'Referido' },
  { value: 'other', label: 'Otro' },
]

const emptyMetrics: RedComercialProspectMetricsRecord = {
  total_prospects: 0,
  to_contact: 0,
  contacted_no_response: 0,
  follow_up: 0,
  agreed: 0,
  overdue: 0,
  today: 0,
  interested: 0,
}

const emptyProspectForm: RedComercialProspectFormValues = {
  represented_company_id: '',
  company_name: '',
  website_url: '',
  rut: '',
  contact_name: '',
  contact_role: '',
  contact_email: '',
  contact_phone: '',
  channel: '',
  status: 'to_contact',
  first_contact_at: '',
  last_contact_at: '',
  next_followup_at: '',
  owner_user_id: '',
  collaborator_ids: [],
  internal_notes: '',
}

const emptyActivityForm: RedComercialProspectActivityFormValues = {
  activity_type: 'note',
  title: '',
  description: '',
  activity_at: '',
  next_followup_at: '',
  status: '',
}

function channelLabel(channel: RedComercialProspectChannel | null) {
  return channelOptions.find((item) => item.value === channel)?.label ?? 'Sin canal'
}

function channelIcon(channel: RedComercialProspectChannel | null) {
  const iconClass = channel === 'whatsapp' ? 'text-emerald-600' : channel === 'email' ? 'text-sky-600' : channel === 'linkedin' ? 'text-blue-600' : channel === 'phone' ? 'text-slate-600' : 'text-[#235b3e]'
  if (channel === 'email') return <Mail className={iconClass} size={13} aria-hidden="true" />
  if (channel === 'whatsapp') return <MessageCircle className={iconClass} size={13} aria-hidden="true" />
  if (channel === 'linkedin') return <BriefcaseBusiness className={iconClass} size={13} aria-hidden="true" />
  if (channel === 'phone') return <Phone className={iconClass} size={13} aria-hidden="true" />
  if (channel === 'website') return <Globe2 className={iconClass} size={13} aria-hidden="true" />
  return <CircleDot className={iconClass} size={13} aria-hidden="true" />
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function displayPersonName(value: string | null | undefined) {
  return value?.trim().split(/\s+/).map((part) => part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : '').join(' ') || ''
}

function initials(value: string | null | undefined) {
  return value?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '—'
}

function followupDisplay(value: string | null, status: RedComercialProspectStatus) {
  if (!value) return <span className="text-slate-400">Sin fecha</span>
  const date = new Date(value)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isFinal = status === 'agreed' || status === 'not_interested' || status === 'archived'
  if (isToday) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"><CalendarDays size={12} aria-hidden="true" />Hoy</span>
  if (date < now && !isFinal) return <span className="inline-flex items-center gap-1 text-red-700"><CalendarClock size={13} aria-hidden="true" />{formatDate(value)}</span>
  return <span className="inline-flex items-center gap-1"><CalendarDays size={13} className="text-slate-400" aria-hidden="true" />{formatDate(value)}</span>
}

function formatDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16)
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : ''
}

function MetricCard({ label, value, icon: Icon, tone = 'green' }: { label: string; value: number; icon: typeof BriefcaseBusiness; tone?: 'green' | 'amber' | 'coral' | 'blue' }) {
  const toneClass = { green: 'bg-[#e7f0ea] text-[#235b3e]', amber: 'bg-amber-50 text-amber-700', coral: 'bg-rose-50 text-rose-700', blue: 'bg-sky-50 text-sky-700' }[tone]
  return (
    <div className="min-h-[78px] rounded-lg border border-[#ddd6ca] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[25px] font-semibold leading-none text-[#17202d]">{value}</p>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">{label}</p>
        </div>
        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: RedComercialProspectStatus }) {
  const meta = getProspectStatusPresentation(status)
  return <span className={`inline-flex h-6 max-w-full items-center whitespace-nowrap rounded-full border px-2 text-[10.5px] font-semibold leading-none ${meta.backgroundClass} ${meta.borderClass} ${meta.textClass}`}>{meta.label}</span>
}

function LoadingBlock({ text = 'Cargando prospectos...' }: { text?: string }) {
  return <div className="rounded-xl border border-[#ddd6ca] bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_1px_2px_rgba(23,32,45,0.03)]">{text}</div>
}

function ErrorBlock({ text }: { text: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{text}</div>
}

function CompanyProspectSelector({ companies, metrics, loading, admin, onSelect }: { companies: RepresentedCompanyRecord[]; metrics: Record<string, RedComercialProspectMetricsRecord>; loading: boolean; admin: boolean; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const visible = companies
    .filter((company) => company.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  return <div className="grid min-w-0 gap-3">
    <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#235b3e]">Red Comercial / Prospectos</p><h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-[#17202d]">Prospectos</h1><p className="mt-0.5 text-[13px] text-slate-600">Selecciona una Empresa Arista para gestionar su cartera comercial.</p></div>
    <label className="relative max-w-md"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar Empresa Arista..." className="h-9 w-full rounded-md border border-[#c9c1b4] bg-white pl-9 pr-3 text-[13px] outline-none focus:border-[#235b3e]" /></label>
    {loading ? <LoadingBlock text="Cargando empresas..." /> : visible.length === 0 ? <div className="grid gap-3"><EmptyState title={admin ? 'No hay Empresas Arista activas.' : 'Aun no tienes empresas asignadas.'} text={admin ? 'Crea o activa una empresa para gestionar sus prospectos.' : 'Cuando tengas una cartera asignada aparecera en esta vista.'} />{admin && <Link to="/admin/empresas" className="mx-auto inline-flex rounded-md bg-[#235b3e] px-4 py-2 text-sm font-semibold text-white">Ir a Empresas Arista</Link>}</div> : <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visible.map((company) => {
      const companyMetrics = metrics[company.id] ?? emptyMetrics
      const accentColor = getCompanyAccentColor(company)
      const cardStyle = {
        '--company-accent': accentColor,
        '--company-accent-border': hexToRgba(accentColor, 0.32),
        background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.1)} 0%, rgba(255, 255, 255, 0.96) 68%)`,
      } as CSSProperties
      return <button key={company.id} type="button" onClick={() => onSelect(company.id)} style={cardStyle} className="grid min-h-[108px] cursor-pointer gap-1.5 rounded-lg border border-[#ddd6ca] p-2.5 text-left shadow-[0_1px_2px_rgba(23,32,45,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--company-accent-border)] hover:shadow-[0_3px_8px_rgba(23,32,45,0.07)]"><span className="flex min-w-0 items-center gap-2"><CompanyLogo company={company} size="sm" /><span className="truncate text-[14px] font-semibold text-[#17202d]">{company.name}</span></span><span className="grid gap-0.5 text-[12px] text-slate-600"><strong className="text-[13px] text-[#17202d]">{companyMetrics.total_prospects} {companyMetrics.total_prospects === 1 ? 'prospecto' : 'prospectos'}</strong><span className={companyMetrics.overdue > 0 ? 'text-amber-700' : 'text-slate-600'}>{companyMetrics.today} hoy &middot; {companyMetrics.overdue} vencidos</span></span><span className="mt-auto text-[11px] font-semibold text-[#235b3e]">Ver prospectos &gt;</span></button>
    })}</div>}
  </div>
}

function prospectToForm(prospect: RedComercialProspectDetailRecord): RedComercialProspectFormValues {
  return {
    represented_company_id: prospect.represented_company_id,
    company_name: prospect.company_name,
    website_url: prospect.website_url ?? '',
    rut: prospect.rut ?? '',
    contact_name: prospect.contact_name ?? '',
    contact_role: prospect.contact_role ?? '',
    contact_email: prospect.contact_email ?? '',
    contact_phone: prospect.contact_phone ?? '',
    channel: prospect.channel ?? '',
    status: prospect.status,
    first_contact_at: formatDateTimeLocal(prospect.first_contact_at),
    last_contact_at: formatDateTimeLocal(prospect.last_contact_at),
    next_followup_at: formatDateTimeLocal(prospect.next_followup_at),
    owner_user_id: prospect.owner_user_id ?? '',
    collaborator_ids: prospect.collaborators.map((item) => item.id),
    internal_notes: prospect.internal_notes ?? '',
  }
}

function ProspectForm({
  initial,
  collaborators,
  memberships,
  isAdmin,
  currentUserId,
  submitting,
  message,
  onSubmit,
  onCancel,
}: {
  initial: RedComercialProspectFormValues
  collaborators: CollaboratorRecord[]
  memberships: RepresentedCompanyMembershipRecord[]
  isAdmin: boolean
  currentUserId: string | null
  submitting: boolean
  message: string
  onSubmit: (values: RedComercialProspectFormValues, keepOpen: boolean) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState(initial)
  useEffect(() => setValues(initial), [initial])
  const availableCollaborators = collaborators.filter((collaborator) =>
    collaborator.role === 'collaborator'
    && collaborator.is_active
    && memberships.some((membership) => membership.user_id === collaborator.id && membership.represented_company_id === values.represented_company_id && membership.status === 'active'),
  )

  function update<Key extends keyof RedComercialProspectFormValues>(key: Key, value: RedComercialProspectFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>, keepOpen = false) {
    event.preventDefault()
    const owner = isAdmin ? values.owner_user_id : currentUserId ?? values.owner_user_id
    onSubmit({
      ...values,
      owner_user_id: owner,
      first_contact_at: toIso(values.first_contact_at),
      last_contact_at: toIso(values.last_contact_at),
      next_followup_at: toIso(values.next_followup_at),
    }, keepOpen)
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => submit(event)}>
      {message && <ErrorBlock text={message} />}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Empresa *
          <input value={values.company_name} onChange={(event) => update('company_name', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Sitio web
          <input type="url" value={values.website_url} onChange={(event) => update('website_url', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Contacto
          <input value={values.contact_name} onChange={(event) => update('contact_name', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Cargo / area
          <input value={values.contact_role} onChange={(event) => update('contact_role', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">RUT
          <input value={values.rut} onChange={(event) => update('rut', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Email
          <input type="email" value={values.contact_email} onChange={(event) => update('contact_email', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Telefono
          <input value={values.contact_phone} onChange={(event) => update('contact_phone', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Canal
          <select value={values.channel} onChange={(event) => update('channel', event.target.value as RedComercialProspectChannel | '')} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]">
            <option value="">Sin canal</option>
            {channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Estado
          <select value={values.status} onChange={(event) => update('status', event.target.value as RedComercialProspectStatus)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]">
            {statusOptions.filter((option) => option.value !== 'archived').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Responsable
          <select value={isAdmin ? values.owner_user_id : currentUserId ?? ''} onChange={(event) => update('owner_user_id', event.target.value)} disabled={!isAdmin} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none disabled:bg-slate-50 focus:border-[#235b3e]">
            <option value="">Sin responsable</option>
            {availableCollaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || collaborator.email}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Fecha primer contacto
          <input type="datetime-local" value={values.first_contact_at} onChange={(event) => update('first_contact_at', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Ultimo contacto
          <input type="datetime-local" value={values.last_contact_at} onChange={(event) => update('last_contact_at', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Proximo seguimiento
          <input type="datetime-local" value={values.next_followup_at} onChange={(event) => update('next_followup_at', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      {isAdmin && (
        <label className="grid gap-2 text-sm font-medium text-slate-700">Coasignados
          <select multiple value={values.collaborator_ids} onChange={(event) => update('collaborator_ids', Array.from(event.target.selectedOptions).map((option) => option.value))} className="min-h-28 rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]">
            {availableCollaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || collaborator.email}</option>)}
          </select>
        </label>
      )}
      <label className="grid gap-2 text-sm font-medium text-slate-700">Notas internas
        <textarea value={values.internal_notes} onChange={(event) => update('internal_notes', event.target.value)} rows={4} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#c9c1b4] px-4 py-2 text-sm font-semibold text-[#17202d]">Cancelar</button>
        <button type="button" disabled={submitting} onClick={(event) => submit(event as unknown as FormEvent<HTMLFormElement>, true)} className="rounded-md border border-[#235b3e] px-4 py-2 text-sm font-semibold text-[#235b3e] disabled:opacity-60">Guardar y agregar otro</button>
        <button type="submit" disabled={submitting} className="rounded-md bg-[#17202d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Guardar</button>
      </div>
    </form>
  )
}

export function LegacyProspectDetailPanel({ prospect, onClose, onEdit, onActivity, onArchive, onSchedule }: { prospect: RedComercialProspectDetailRecord; onClose: () => void; onEdit?: () => void; onActivity?: () => void; onArchive?: () => void; onSchedule?: () => void }) {
  const [tab, setTab] = useState<'summary' | 'activities' | 'files' | 'notes'>('summary')
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <aside className="min-h-[640px] min-w-0 w-full rounded-lg border border-[#ddd6ca] bg-white shadow-[0_6px_20px_rgba(23,32,45,0.06)] xl:fixed xl:right-0 xl:top-[var(--admin-topbar-height)] xl:bottom-0 xl:z-40 xl:h-[calc(100vh-var(--admin-topbar-height))] xl:min-h-0 xl:min-w-[390px] xl:w-[var(--detail-panel-width)] xl:overflow-y-auto">
      <div className="border-b border-[#eee8dd] p-3">
        <div className="flex items-start gap-3">
          <CompanyLogo company={{ name: prospect.company_name, logo_storage_path: prospect.logo_storage_path }} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[#17202d]">{prospect.company_name}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Empresa prospecto</p>
          </div>
          <button type="button" className="rounded-md border border-[#c9c1b4] p-2 text-[#17202d]" aria-label="Cerrar panel" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="mt-3 flex items-center gap-1.5 whitespace-nowrap">
          <StatusChip status={prospect.status} />
          {prospect.can_view_detail && onEdit && <button type="button" onClick={onEdit} className="rounded-md border border-[#c9c1b4] px-2.5 py-1.5 text-xs font-semibold text-[#17202d]">Editar</button>}
          {prospect.can_view_detail && onActivity && <button type="button" onClick={onActivity} className="rounded-md bg-[#235b3e] px-2.5 py-1.5 text-xs font-semibold text-white">+ Actividad</button>}
          {prospect.can_view_detail && onSchedule && <button type="button" onClick={onSchedule} className="rounded-md border border-[#c9c1b4] px-2.5 py-1.5 text-xs font-semibold text-[#17202d]">Reprogramar</button>}
          {prospect.can_view_detail && onArchive && <button type="button" onClick={onArchive} className="rounded-md border border-[#c9c1b4] px-2.5 py-1.5 text-xs font-semibold text-[#17202d]">{prospect.is_archived ? 'Restaurar' : 'Archivar'}</button>}
        </div>
      </div>
      <div className="grid grid-cols-4 border-b border-[#eee8dd] text-sm">
        {(['summary', 'activities', 'files', 'notes'] as const).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`px-3 py-2 font-semibold ${tab === item ? 'border-b-2 border-[#235b3e] text-[#235b3e]' : 'text-slate-500'}`}>
            {item === 'summary' ? 'Resumen' : item === 'activities' ? 'Actividades' : item === 'files' ? 'Archivos' : 'Notas'}
          </button>
        ))}
      </div>
      <div className="p-3.5">
        {!prospect.can_view_detail && (
          <div className="rounded-lg border border-[#ddd6ca] bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700">
            <p className="font-semibold text-[#17202d]">{prospect.company_name}</p>
            <p className="mt-2">Este prospecto esta siendo gestionado por otro colaborador.</p>
            <p className="mt-2">Responsable: {prospect.owner?.full_name ? displayPersonName(prospect.owner.full_name) : 'Sin responsable'}</p>
          </div>
        )}
        {prospect.can_view_detail && tab === 'summary' && (
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-[13px] font-semibold text-[#17202d]">Información general</h3>
              <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#235b3e]">Editar</button>
            </div>
            {[
              ['Empresa', prospect.company_name],
              ['Contacto', prospect.contact_name],
              ['Cargo / area', prospect.contact_role],
              ['Email', prospect.contact_email],
              ['Telefono', prospect.contact_phone],
              ['Canal', channelLabel(prospect.channel)],
              ['Responsable', prospect.owner?.full_name ? displayPersonName(prospect.owner.full_name) : prospect.owner?.email],
              ['Coasignados', prospect.collaborators.map((item) => item.full_name ? displayPersonName(item.full_name) : item.email).join(', ')],
              ['Fecha primer contacto', formatDate(prospect.first_contact_at)],
              ['Ultimo contacto', formatDate(prospect.last_contact_at)],
              ['Proximo seguimiento', formatDate(prospect.next_followup_at)],
            ].map(([label, value]) => (
              <div key={label} className="grid min-h-[36px] grid-cols-[130px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3] py-1">
                <span className="font-semibold text-slate-500">{label}</span>
                <span className={`min-w-0 ${value ? 'text-[#17202d]' : 'text-slate-400'}`}>{value || 'Sin definir'}</span>
              </div>
            ))}
            <div>
              <h3 className="font-semibold text-[#17202d]">Actividad reciente</h3>
              <div className="mt-2 grid gap-2">
                {prospect.activities.slice(0, 3).length === 0 ? <p className="text-slate-500">Sin actividad registrada.</p> : prospect.activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="rounded-lg bg-[#fbfaf7] p-3">
                    <p className="font-semibold text-[#17202d]">{activity.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(activity.activity_at)} · {activity.created_by_name || 'Red Comercial'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {prospect.can_view_detail && tab === 'activities' && (
          <div className="grid gap-3">
            {prospect.activities.length === 0 ? <p className="text-sm text-slate-500">Sin actividad registrada.</p> : prospect.activities.map((activity) => (
              <div key={activity.id} className="border-l-2 border-[#c9dfd0] pl-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{formatDate(activity.activity_at)} · {activity.created_by_name || 'Red Comercial'}</p>
                <p className="mt-1 font-semibold text-[#17202d]">{activity.title}</p>
                {activity.description && <p className="mt-1 text-sm leading-6 text-slate-600">{activity.description}</p>}
              </div>
            ))}
          </div>
        )}
        {prospect.can_view_detail && tab === 'files' && (
          <div className="rounded-lg border border-dashed border-[#ddd6ca] bg-[#fbfaf7] p-4 text-sm text-slate-500">
            Los archivos estarán disponibles en una etapa posterior.
          </div>
        )}
        {prospect.can_view_detail && tab === 'notes' && (
          <div className="rounded-lg border border-[#ddd6ca] bg-[#fbfaf7] p-4 text-sm leading-6 text-slate-700">
            {prospect.internal_notes || 'Sin notas internas.'}
          </div>
        )}
      </div>
    </aside>
  )
}

export function ProspectDetailPanel({ prospect, opportunityId, onClose, onEdit, onActivity, onArchive, onSchedule, onChanged }: { prospect: RedComercialProspectDetailRecord; opportunityId?: string; onClose: () => void; onEdit?: () => void; onActivity?: () => void; onArchive?: () => void; onSchedule?: () => void; onChanged?: () => void }) {
  return <RedComercialProspectDetailPanel prospect={prospect} opportunityId={opportunityId} onClose={onClose} onEdit={onEdit} onActivity={onActivity} onArchive={onArchive} onSchedule={onSchedule} onChanged={onChanged} />
}

export function RedComercialProspectsPage() {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [searchParams, setSearchParams] = useSearchParams()
  const companyParam = searchParams.get('company') ?? ''
  const openProspectId = searchParams.get('open')
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [memberships, setMemberships] = useState<RepresentedCompanyMembershipRecord[]>([])
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyParam)
  const [selectorMetrics, setSelectorMetrics] = useState<Record<string, RedComercialProspectMetricsRecord>>({})
  const [metrics, setMetrics] = useState<RedComercialProspectMetricsRecord>(emptyMetrics)
  const [rows, setRows] = useState<RedComercialProspectListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<RedComercialProspectFilters>({ pageSize: 25, page: 1, quickFilter: 'all' })
  const [selected, setSelected] = useState<RedComercialProspectDetailRecord | null>(null)
  const [editing, setEditing] = useState<RedComercialProspectDetailRecord | 'new' | null>(null)
  const [activityFor, setActivityFor] = useState<RedComercialProspectDetailRecord | null>(null)
  const [formMessage, setFormMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null
  const pageSize = filters.pageSize ?? 25
  const page = filters.page ?? 1

  useEffect(() => {
    document.documentElement.dataset.redProspectDetail = selected ? 'open' : 'closed'
    window.dispatchEvent(new Event('arista-red-prospect-detail'))
    return () => {
      delete document.documentElement.dataset.redProspectDetail
      window.dispatchEvent(new Event('arista-red-prospect-detail'))
    }
  }, [selected])

  useEffect(() => {
    async function loadOptions() {
      setOptionsLoading(true)
      const [companyResult, membershipResult, collaboratorResult] = await Promise.all([
        admin ? adminRepository.listRepresentedCompanies() : adminRepository.listMyRepresentedCompanies(),
        adminRepository.listCompanyMemberships(),
        admin ? adminRepository.listCollaborators() : Promise.resolve({ data: [], error: null }),
      ])
      const availableCompanies = companyResult.data.filter((company) => company.status === 'active')
      setCompanies(availableCompanies)
      setMemberships(membershipResult.data)
      setCollaborators(collaboratorResult.data)
      setError(companyResult.error ?? membershipResult.error ?? collaboratorResult.error ?? '')
      const metricEntries = await Promise.all(availableCompanies.map(async (company) => {
        const result = await adminRepository.getRedComercialProspectMetrics(company.id)
        return [company.id, result.data] as const
      }))
      setSelectorMetrics(Object.fromEntries(metricEntries))
      setOptionsLoading(false)
    }
    void loadOptions()
  }, [admin])

  useEffect(() => {
    setSelectedCompanyId(companyParam)
    if (!companyParam) {
      setSelected(null)
      setEditing(null)
      setRows([])
      setTotal(0)
      setMetrics(emptyMetrics)
      setLoading(false)
    }
  }, [companyParam])

  const loadProspects = useCallback(async () => {
    if (!selectedCompanyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [listResult, metricResult] = await Promise.all([
      adminRepository.listRedComercialProspects(selectedCompanyId, filters),
      adminRepository.getRedComercialProspectMetrics(selectedCompanyId),
    ])
    setRows(listResult.data.rows)
    setTotal(listResult.data.total)
    setMetrics(metricResult.data)
    setError(listResult.error ?? metricResult.error ?? '')
    setLoading(false)
  }, [filters, selectedCompanyId])

  useEffect(() => { void loadProspects() }, [loadProspects])

  async function openDetail(id: string) {
    const result = await adminRepository.getRedComercialProspectDetail(id)
    if (result.error) {
      setError(result.error)
      return
    }
    setSelected(result.data)
  }

  useEffect(() => {
    if (selectedCompanyId && openProspectId && selected?.id !== openProspectId) void openDetail(openProspectId)
  }, [openProspectId, selected?.id, selectedCompanyId])

  function selectCompany(id: string) {
    setFilters((current) => ({ ...current, page: 1 }))
    setSelected(null)
    setSearchParams({ company: id })
  }

  function returnToCompanies() {
    setSelected(null)
    setEditing(null)
    setSearchParams({})
  }

  function baseForm(): RedComercialProspectFormValues {
    return {
      ...emptyProspectForm,
      represented_company_id: selectedCompanyId,
      owner_user_id: admin ? '' : auth.user?.id ?? '',
    }
  }

  async function saveProspect(values: RedComercialProspectFormValues, keepOpen: boolean) {
    setSubmitting(true)
    setFormMessage('')
    const duplicates = await adminRepository.detectRedComercialProspectDuplicates(values, editing && editing !== 'new' ? editing.id : undefined)
    if (duplicates.data.some((item) => item.same_company)) {
      setSubmitting(false)
      setFormMessage(`Posible duplicado: ${duplicates.data.find((item) => item.same_company)?.company_name}. Este prospecto ya existe en esta cartera.`)
      return
    }
    const result = editing === 'new' ? await adminRepository.createRedComercialProspect(values) : await adminRepository.updateRedComercialProspect((editing as RedComercialProspectDetailRecord).id, values)
    setSubmitting(false)
    if (result.error) {
      setFormMessage(result.error)
      return
    }
    await loadProspects()
    if (result.data) setSelected(result.data)
    if (keepOpen) setEditing('new')
    else setEditing(null)
  }

  async function saveActivity(values: RedComercialProspectActivityFormValues) {
    if (!activityFor) return
    setSubmitting(true)
    const result = await adminRepository.createRedComercialProspectActivity(activityFor.id, { ...values, activity_at: toIso(values.activity_at), next_followup_at: toIso(values.next_followup_at) })
    setSubmitting(false)
    if (result.error) {
      setFormMessage(result.error)
      return
    }
    setActivityFor(null)
    setSelected(result.data)
    await loadProspects()
  }

  async function archiveSelected(prospect: RedComercialProspectDetailRecord) {
    const result = await adminRepository.updateRedComercialProspect(prospect.id, { is_archived: !prospect.is_archived, status: prospect.is_archived ? prospect.status : 'archived' })
    if (result.error) {
      setError(result.error)
      return
    }
    setSelected(result.data)
    await loadProspects()
  }

  const quickChips = [
    { key: 'all' as const, label: 'Todos', count: metrics.total_prospects },
    { key: 'today' as const, label: 'Hoy', count: metrics.today },
    { key: 'overdue' as const, label: 'Vencidos', count: metrics.overdue },
    { key: 'no_response' as const, label: 'Sin respuesta', count: metrics.contacted_no_response },
    { key: 'interested' as const, label: 'Interesados', count: metrics.interested },
  ]

  if (!selectedCompanyId) {
    return <CompanyProspectSelector companies={companies} metrics={selectorMetrics} loading={optionsLoading} admin={admin} onSelect={selectCompany} />
  }

  const table = (
    <div className="min-w-0 overflow-hidden rounded-xl border border-[#ddd6ca] bg-white shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
      <div className="overflow-x-auto">
        <table className="min-w-[1298px] w-full table-fixed border-separate border-spacing-0 text-left text-[12px]">
          <colgroup>
            {[140, 130, 118, 140, 82, 120, 148, 115, 130, 118, 60].map((width, index) => <col key={index} style={{ width }} />)}
          </colgroup>
          <thead className="sticky top-0 bg-[#fbfaf7] text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {['Empresa', 'Contacto', 'Cargo / area', 'Email / telefono', 'Canal', 'Fecha primer contacto', 'Estado', 'Ultimo contacto', 'Proximo seguimiento', 'Responsable', 'Accion'].map((header) => (
                <th key={header} className={`whitespace-nowrap border-b border-[#eee8dd] px-2.5 py-2 ${header === 'Empresa' ? 'sticky left-0 z-20 bg-[#fbfaf7] shadow-[2px_0_5px_-4px_rgba(23,32,45,0.35)]' : ''}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => void openDetail(row.id)} className={`group cursor-pointer border-b border-[#f1ece3] transition hover:bg-[#f7faf7] ${selected?.id === row.id ? 'bg-[#edf6ef]' : ''}`}>
                <td className={`sticky left-0 z-10 border-b border-r border-[#f1ece3] px-2.5 py-2 font-semibold text-[#17202d] shadow-[2px_0_5px_-4px_rgba(23,32,45,0.35)] ${selected?.id === row.id ? 'bg-[#edf6ef]' : 'bg-white group-hover:bg-[#f7faf7]'}`}><span className="flex min-w-0 items-center gap-2"><CompanyLogo company={{ name: row.company_name, logo_storage_path: row.logo_storage_path }} size="xs" /><span className="truncate">{row.company_name}</span></span></td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-700">{row.contact_name || <span className="text-slate-400">{row.can_view_detail ? 'Sin contacto' : 'Privado'}</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{row.contact_role || <span className="text-slate-400">{row.can_view_detail ? 'Sin cargo' : 'Privado'}</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{row.can_view_detail ? (row.contact_email || row.contact_phone || <span className="text-slate-400">Sin dato</span>) : <span className="text-slate-400">Privado</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2">{row.channel ? <span className="inline-flex items-center gap-1.5 text-slate-700">{channelIcon(row.channel)}{channelLabel(row.channel)}</span> : <span className="text-slate-400">Sin canal</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{row.first_contact_at ? formatDate(row.first_contact_at) : <span className="text-slate-400">Sin fecha</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2"><StatusChip status={row.status} /></td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{row.last_contact_at ? formatDate(row.last_contact_at) : <span className="text-slate-400">Sin fecha</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-600">{followupDisplay(row.next_followup_at, row.status)}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2 text-slate-700">{row.owner_name ? <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ef] text-[10px] font-bold text-[#235b3e]">{initials(row.owner_name)}</span>{displayPersonName(row.owner_name)}</span> : <span className="text-slate-400">Sin responsable</span>}</td>
                <td className="whitespace-nowrap border-b border-[#f1ece3] px-2.5 py-2">
                  <button type="button" onClick={(event) => { event.stopPropagation(); void openDetail(row.id) }} className="rounded-md border border-[#c9c1b4] p-1.5 text-[#17202d]" aria-label={`Ver ${row.company_name}`}><MoreHorizontal size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee8dd] bg-[#fdfcf9] px-3 py-2 text-[13px] text-slate-600">
        <span>{total} prospectos</span>
        <div className="flex items-center gap-2">
          <select value={pageSize} onChange={(event) => setFilters((current) => ({ ...current, pageSize: Number(event.target.value), page: 1 }))} className="rounded-md border border-[#c9c1b4] bg-white px-2 py-1">
            {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <button type="button" disabled={page <= 1} onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, page - 1) }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Anterior</button>
          <span>Pagina {page}</span>
          <button type="button" disabled={page * pageSize >= total} onClick={() => setFilters((current) => ({ ...current, page: page + 1 }))} className="rounded-md border border-[#c9c1b4] px-3 py-1 disabled:opacity-50">Siguiente</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="grid min-w-0 gap-3">
      <div className="grid min-w-0 grid-cols-1 items-start gap-3">
        <div className="grid min-w-0 gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#235b3e]">Empresas Arista / {selectedCompany?.name ?? 'Cartera'} / Prospectos</p>
          <div className="mt-2 flex min-w-0 items-center gap-2.5">
            {selectedCompany && <CompanyLogo company={selectedCompany} size="sm" />}
            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-semibold leading-tight tracking-tight text-[#17202d]">{selectedCompany?.name ?? 'Prospectos'}</h1>
              <p className="mt-0.5 text-[13px] text-slate-600">Gestion comercial interna de prospectos y seguimiento.</p>
            </div>
          </div>
        </div>
        <label className="grid min-w-[260px] gap-1 text-[13px] font-semibold text-slate-700">Empresa actual
          <select value={selectedCompanyId} onChange={(event) => selectCompany(event.target.value)} className="h-10 rounded-md border border-[#c9c1b4] bg-white px-3 text-[13px] outline-none focus:border-[#235b3e]">
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
          <button type="button" onClick={returnToCompanies} className="w-fit text-[12px] font-semibold text-[#235b3e] hover:underline">&lt;- Todas las empresas</button>
        </label>
      </div>
      {error && <ErrorBlock text={error} />}
      <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
        <MetricCard label="Total prospectos" value={metrics.total_prospects} icon={BriefcaseBusiness} tone="green" />
        <MetricCard label="Por contactar" value={metrics.to_contact} icon={CircleDot} tone="amber" />
        <MetricCard label="Sin respuesta" value={metrics.contacted_no_response} icon={Mail} tone="coral" />
        <MetricCard label="En seguimiento" value={metrics.follow_up} icon={Clock3} tone="blue" />
        <MetricCard label="Acordados" value={metrics.agreed} icon={CheckCircle2} tone="green" />
        <MetricCard label="Vencidos" value={metrics.overdue} icon={CalendarClock} tone="coral" />
      </div>
      <section className="rounded-lg border border-[#ddd6ca] bg-white p-2 shadow-[0_1px_2px_rgba(23,32,45,0.025)]">
        <div className={`grid min-w-0 grid-cols-1 items-end gap-2 sm:grid-cols-2 ${selected ? 'xl:grid-cols-4 2xl:grid-cols-[minmax(240px,1fr)_110px_110px_130px_145px_auto_auto]' : 'xl:grid-cols-[minmax(240px,1fr)_110px_110px_130px_145px_auto_auto]'}`}>
          <label className="relative xl:col-span-2 2xl:col-span-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input value={filters.search ?? ''} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="Buscar empresa, contacto o email..." className="h-9 w-full min-w-[230px] rounded-md border border-[#c9c1b4] pl-9 pr-3 text-[13px] outline-none focus:border-[#235b3e]" />
          </label>
          <label className="grid min-w-0 gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Estado</span><select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as RedComercialProspectStatus | '', page: 1 }))} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] outline-none focus:border-[#235b3e]"><option value="">Todos</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid min-w-0 gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Canal</span><select value={filters.channel ?? ''} onChange={(event) => setFilters((current) => ({ ...current, channel: event.target.value as RedComercialProspectChannel | '', page: 1 }))} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] outline-none focus:border-[#235b3e]"><option value="">Todos</option>{channelOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid min-w-0 gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Responsable</span><select value={filters.ownerUserId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, ownerUserId: event.target.value, page: 1 }))} className="h-9 rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] outline-none focus:border-[#235b3e]"><option value="">Todos</option>{collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || collaborator.email}</option>)}</select></label>
          <label className="grid min-w-0 gap-1"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Próximo seguimiento</span><select value={filters.followupFilter ?? ''} onChange={(event) => setFilters((current) => ({ ...current, followupFilter: event.target.value as 'today' | 'overdue' | '', page: 1 }))} className="h-9 whitespace-nowrap rounded-md border border-[#d7d0c4] bg-white px-2.5 text-[13px] outline-none focus:border-[#235b3e]"><option value="">Todas las fechas</option><option value="today">Hoy</option><option value="overdue">Vencidos</option></select></label>
          <button type="button" onClick={() => setFilters((current) => ({ ...current, mine: !current.mine, page: 1 }))} className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border px-2.5 text-[12px] font-semibold ${filters.mine ? 'border-[#235b3e] bg-[#e7f0ea] text-[#235b3e]' : 'border-[#ddd6ca] text-slate-600'}`}>Mis prospectos</button>
          <button type="button" onClick={() => setEditing('new')} disabled={!selectedCompanyId} className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#235b3e] px-3 text-[13px] font-semibold text-white transition hover:bg-[#1b4732] disabled:opacity-60">
            <Plus size={16} /> Nuevo prospecto
          </button>
        </div>
        <div className="mt-1.5 flex min-h-[28px] flex-wrap items-center gap-1.5">
          {quickChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => setFilters((current) => ({ ...current, quickFilter: chip.key, page: 1 }))} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${filters.quickFilter === chip.key ? 'border-[#235b3e] bg-[#e7f0ea] text-[#235b3e]' : 'border-[#ddd6ca] text-slate-600'}`}>
              {chip.label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filters.quickFilter === chip.key ? 'bg-[#c9dfd0] text-[#235b3e]' : 'bg-[#f0eee8] text-slate-500'}`}>{chip.count}</span>
            </button>
          ))}
          <button type="button" onClick={() => setFilters((current) => ({ ...current, includeArchived: !current.includeArchived, page: 1 }))} className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold ${filters.includeArchived ? 'border-slate-500 bg-slate-100 text-slate-700' : 'border-[#ddd6ca] text-slate-600'}`}>Archivados</button>
        </div>
      </section>
      {loading ? <LoadingBlock /> : rows.length === 0 ? (
        <div className="grid gap-3">
          <EmptyState title="Aun no hay prospectos" text="Agrega el primer prospecto de esta cartera para comenzar el seguimiento comercial." />
          <button type="button" onClick={() => setEditing('new')} className="mx-auto inline-flex items-center gap-2 rounded-md bg-[#235b3e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b4732]"><Plus size={16} /> Nuevo prospecto</button>
        </div>
      ) : <div className="min-w-0">{table}</div>}
        </div>
        {selected && <ProspectDetailPanel prospect={selected} onClose={() => setSelected(null)} onEdit={() => setEditing(selected)} onActivity={() => setActivityFor(selected)} onArchive={() => void archiveSelected(selected)} onChanged={() => { void loadProspects() }} />}
      </div>
      {editing && (
        <AdminDetailModal title={editing === 'new' ? 'Nuevo prospecto' : `Editar ${editing.company_name}`} size="large" onClose={() => setEditing(null)}>
          <ProspectForm
            initial={editing === 'new' ? baseForm() : prospectToForm(editing)}
            collaborators={collaborators}
            memberships={memberships}
            isAdmin={admin}
            currentUserId={auth.user?.id ?? null}
            submitting={submitting}
            message={formMessage}
            onSubmit={saveProspect}
            onCancel={() => setEditing(null)}
          />
        </AdminDetailModal>
      )}
      {activityFor && (
        <AdminDetailModal title="Registrar actividad" onClose={() => setActivityFor(null)}>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void saveActivity({
            activity_type: form.get('activity_type') as RedComercialProspectActivityFormValues['activity_type'],
            title: String(form.get('title') ?? ''),
            description: String(form.get('description') ?? ''),
            activity_at: String(form.get('activity_at') ?? ''),
            next_followup_at: String(form.get('next_followup_at') ?? ''),
            status: form.get('status') as RedComercialProspectStatus | '',
          }) }}>
            {formMessage && <ErrorBlock text={formMessage} />}
            <label className="grid gap-2 text-sm font-medium text-slate-700">Tipo
              <select name="activity_type" defaultValue={emptyActivityForm.activity_type} className="rounded-md border border-[#c9c1b4] px-3 py-2.5">
                {['call', 'email', 'whatsapp', 'linkedin', 'meeting', 'note', 'followup'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Titulo
              <input name="title" className="rounded-md border border-[#c9c1b4] px-3 py-2.5" required />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Descripcion
              <textarea name="description" rows={4} className="rounded-md border border-[#c9c1b4] px-3 py-2.5" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">Fecha actividad
                <input name="activity_at" type="datetime-local" className="rounded-md border border-[#c9c1b4] px-3 py-2.5" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">Proximo seguimiento
                <input name="next_followup_at" type="datetime-local" className="rounded-md border border-[#c9c1b4] px-3 py-2.5" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Estado
              <select name="status" className="rounded-md border border-[#c9c1b4] px-3 py-2.5">
                <option value="">Sin cambio</option>
                {statusOptions.filter((option) => option.value !== 'archived').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActivityFor(null)} className="rounded-md border border-[#c9c1b4] px-4 py-2 text-sm font-semibold text-[#17202d]">Cancelar</button>
              <button type="submit" disabled={submitting} className="rounded-md bg-[#17202d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Registrar actividad</button>
            </div>
          </form>
        </AdminDetailModal>
      )}
    </div>
  )
}
