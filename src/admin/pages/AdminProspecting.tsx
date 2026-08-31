import { CalendarClock, CheckCircle2, Mail, MessageCircle, Pencil, Phone, Plus, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type {
  ContactFormValues,
  ContactRecord,
  OpportunityType,
  Priority,
  ProspectActivityFormValues,
  ProspectActivityRecord,
  ProspectActivityType,
  ProspectConversionValues,
  ProspectFormValues,
  ProspectRecord,
  ProspectStatus,
  ProspectType,
} from '../../types/admin'
import {
  formatDateTime,
  fromDateTimeLocal,
  priorities,
  priorityLabels,
  prospectActivityOutcomeLabels,
  prospectActivityOutcomes,
  prospectActivityTypeLabels,
  prospectActivityTypes,
  prospectStatusLabels,
  prospectStatuses,
  prospectTemperatureLabels,
  prospectTemperatures,
  prospectTypeLabels,
  prospectTypes,
  toDateTimeLocal,
} from '../opportunity-labels'

type QuickView = 'all' | 'today' | 'overdue' | 'uncontacted' | 'awaiting_response' | 'call_later' | 'interested' | 'converted' | 'archived'

const quickViews: Array<[QuickView, string]> = [
  ['all', 'Todos'],
  ['today', 'Hoy'],
  ['overdue', 'Vencidos'],
  ['uncontacted', 'Sin contactar'],
  ['awaiting_response', 'Esperando respuesta'],
  ['call_later', 'Llamar después'],
  ['interested', 'Interesados'],
  ['converted', 'Convertidos'],
  ['archived', 'Archivados'],
]

const emptyProspectForm: ProspectFormValues = {
  prospect_type: 'person',
  full_name: '',
  company_name: '',
  role_or_activity: '',
  email: '',
  phone: '',
  website: '',
  social_network: '',
  country: '',
  city_region: '',
  source: '',
  product_or_service: '',
  commercial_origin: '',
  lead_temperature: 'cold',
  status: 'new',
  priority: 'medium',
  preferred_contact_method: '',
  next_action_type: '',
  next_action_at: '',
  notes: '',
}

const emptyActivityForm: ProspectActivityFormValues = {
  activity_type: 'call',
  outcome: '',
  subject: '',
  notes: '',
  occurred_at: toDateTimeLocal(new Date().toISOString()),
  next_action_type: '',
  next_action_at: '',
  status: '',
}

const emptyContactForm: ContactFormValues = {
  contact_type: 'person',
  full_name: '',
  company_name: '',
  position: '',
  email: '',
  phone: '',
  website: '',
  social_media: '',
  country: '',
  region: '',
  city: '',
  source: 'prospecting',
  notes: '',
}

const emptyConversionForm: ProspectConversionValues = {
  opportunity_type: 'buy',
  title: '',
  description: '',
  expected_date: '',
  estimated_value: '',
  currency: 'CLP',
  internal_notes: '',
}

function nullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function prospectName(prospect: Pick<ProspectRecord, 'full_name' | 'company_name' | 'prospect_type'>) {
  return prospect.prospect_type === 'company'
    ? prospect.company_name?.trim() || prospect.full_name?.trim() || 'Sin nombre'
    : prospect.full_name?.trim() || prospect.company_name?.trim() || 'Sin nombre'
}

function basicProspectName(prospect: Pick<ProspectRecord, 'full_name' | 'company_name'>) {
  return prospect.full_name?.trim() || prospect.company_name?.trim() || 'Sin nombre'
}

function isSameDay(value: string | null, date = new Date()) {
  if (!value) return false
  const target = new Date(value)
  return target.getFullYear() === date.getFullYear() && target.getMonth() === date.getMonth() && target.getDate() === date.getDate()
}

function isOverdue(value: string | null) {
  return Boolean(value && new Date(value).getTime() < Date.now())
}

function isPendingProspect(prospect: Pick<ProspectRecord, 'status'>) {
  return prospect.status !== 'converted' && prospect.status !== 'archived' && prospect.status !== 'not_interested'
}

function rowTone(prospect: ProspectRecord) {
  if (prospect.status === 'archived' || prospect.status === 'not_interested') return 'bg-slate-50 text-slate-500'
  if (prospect.status === 'awaiting_response') return 'bg-amber-50'
  if (prospect.status === 'interested' || prospect.status === 'qualified') return 'bg-green-50'
  if (isOverdue(prospect.next_action_at)) return 'bg-red-50'
  if (isSameDay(prospect.next_action_at)) return 'bg-sky-50'
  return ''
}

function toProspectForm(prospect: ProspectRecord): ProspectFormValues {
  return {
    prospect_type: prospect.prospect_type,
    full_name: prospect.full_name ?? '',
    company_name: prospect.company_name ?? '',
    role_or_activity: prospect.role_or_activity ?? '',
    email: prospect.email ?? '',
    phone: prospect.phone ?? '',
    website: prospect.website ?? '',
    social_network: prospect.social_network ?? '',
    country: prospect.country ?? '',
    city_region: prospect.city_region ?? '',
    source: prospect.source ?? '',
    product_or_service: prospect.product_or_service ?? '',
    commercial_origin: prospect.commercial_origin ?? '',
    lead_temperature: prospect.lead_temperature,
    status: prospect.status,
    priority: prospect.priority,
    preferred_contact_method: prospect.preferred_contact_method ?? '',
    next_action_type: prospect.next_action_type ?? '',
    next_action_at: prospect.next_action_at ? toDateTimeLocal(prospect.next_action_at) : '',
    notes: prospect.notes ?? '',
  }
}

function prospectPayload(values: ProspectFormValues) {
  return {
    prospect_type: values.prospect_type,
    full_name: nullable(values.full_name),
    company_name: nullable(values.company_name),
    role_or_activity: nullable(values.role_or_activity),
    email: nullable(values.email)?.toLowerCase() ?? null,
    phone: nullable(values.phone),
    website: nullable(values.website),
    social_network: nullable(values.social_network),
    country: nullable(values.country),
    city_region: nullable(values.city_region),
    source: nullable(values.source),
    product_or_service: nullable(values.product_or_service),
    commercial_origin: nullable(values.commercial_origin),
    lead_temperature: values.lead_temperature,
    status: values.status,
    priority: values.priority,
    preferred_contact_method: nullable(values.preferred_contact_method),
    next_action_type: nullable(values.next_action_type),
    next_action_at: fromDateTimeLocal(values.next_action_at),
    notes: nullable(values.notes),
  }
}

function validateProspect(values: ProspectFormValues) {
  const errors: Partial<Record<keyof ProspectFormValues, string>> = {}
  if (values.prospect_type === 'person' && !values.full_name.trim()) errors.full_name = 'Ingresa el nombre del prospecto.'
  if (values.prospect_type === 'company' && !values.company_name.trim()) errors.company_name = 'Ingresa el nombre de la empresa.'
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Ingresa un correo válido.'
  if (values.phone.trim() && (values.phone.trim().length < 6 || values.phone.trim().length > 64)) errors.phone = 'Ingresa un teléfono válido.'
  if (values.next_action_at && new Date(values.next_action_at).getTime() <= Date.now()) errors.next_action_at = 'Usa una fecha futura.'
  return errors
}

function validateActivity(values: ProspectActivityFormValues) {
  const errors: Partial<Record<keyof ProspectActivityFormValues, string>> = {}
  if (!values.subject.trim()) errors.subject = 'Ingresa un asunto.'
  if (!values.occurred_at) errors.occurred_at = 'Ingresa fecha de realización.'
  if (values.next_action_at && new Date(values.next_action_at).getTime() <= Date.now()) errors.next_action_at = 'Usa una fecha futura.'
  return errors
}

function mergeProspect(current: ProspectRecord[], next: ProspectRecord) {
  const exists = current.some((item) => item.id === next.id)
  const rows = exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current]
  return rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export function AdminProspecting() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [prospects, setProspects] = useState<ProspectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<ProspectRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [activityFor, setActivityFor] = useState<ProspectRecord | null>(null)
  const actionButtonRef = useRef<HTMLElement | null>(null)

  const query = searchParams.get('q') ?? ''
  const status = (searchParams.get('status') as ProspectStatus | 'all' | null) ?? 'all'
  const priority = (searchParams.get('priority') as Priority | 'all' | null) ?? 'all'
  const source = searchParams.get('source') ?? ''
  const quick = (searchParams.get('view') as QuickView | null) ?? 'all'
  const dateFilter = searchParams.get('date') ?? ''
  const noContact = searchParams.get('sin_contacto') === '1'
  const overdue = searchParams.get('vencidos') === '1'

  async function load() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listProspects()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setProspects(result.data)
  }

  useEffect(() => {
    void load()
  }, [])

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const sources = useMemo(() => Array.from(new Set(prospects.map((item) => item.source).filter(Boolean) as string[])).sort(), [prospects])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return prospects.filter((prospect) => {
      if (status !== 'all' && prospect.status !== status) return false
      if (priority !== 'all' && prospect.priority !== priority) return false
      if (source && prospect.source !== source) return false
      if (dateFilter && (!prospect.next_action_at || !prospect.next_action_at.startsWith(dateFilter))) return false
      if (noContact && prospect.last_contact_at) return false
      if (overdue && (!isPendingProspect(prospect) || !isOverdue(prospect.next_action_at))) return false
      if (quick === 'today' && (!isPendingProspect(prospect) || !isSameDay(prospect.next_action_at))) return false
      if (quick === 'overdue' && (!isPendingProspect(prospect) || !isOverdue(prospect.next_action_at))) return false
      if (quick === 'uncontacted' && prospect.last_contact_at) return false
      if (quick === 'awaiting_response' && prospect.status !== 'awaiting_response') return false
      if (quick === 'call_later' && prospect.next_action_type?.toLowerCase() !== 'llamar') return false
      if (quick === 'interested' && prospect.status !== 'interested' && prospect.status !== 'qualified') return false
      if (quick === 'converted' && prospect.status !== 'converted') return false
      if (quick === 'archived' && prospect.status !== 'archived') return false
      if (!normalized) return true
      return [prospect.full_name, prospect.company_name, prospect.email, prospect.phone, prospect.source, prospect.product_or_service]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    })
  }, [dateFilter, noContact, overdue, priority, prospects, query, quick, source, status])

  function openCreate() {
    actionButtonRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(prospect: ProspectRecord) {
    actionButtonRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEditing(prospect)
    setShowForm(true)
  }

  function closeModal() {
    setShowForm(false)
    setActivityFor(null)
    setEditing(null)
    window.setTimeout(() => actionButtonRef.current?.focus(), 0)
  }

  function onSaved(prospect: ProspectRecord) {
    setProspects((current) => mergeProspect(current, prospect))
    setNotice('Prospecto guardado.')
    closeModal()
  }

  function onActivitySaved(prospect: ProspectRecord) {
    setProspects((current) => mergeProspect(current, prospect))
    setNotice('Actividad registrada.')
    closeModal()
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Prospección" text="Planilla comercial de prospectos preliminares." actionLabel="Nuevo prospecto" onAction={openCreate} />
      <div className="sr-only" aria-live="polite">{notice}</div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          {quickViews.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setParam('view', value === 'all' ? '' : value)} className={`rounded-md px-3 py-2 text-sm font-semibold ${quick === value ? 'bg-[#17202d] text-white' : 'border border-slate-300 text-[#17202d]'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Buscar
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input value={query} onChange={(event) => setParam('q', event.target.value)} className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-base" placeholder="Nombre, empresa, correo, teléfono u origen" />
            </span>
          </label>
          <Select label="Estado" value={status} onChange={(value) => setParam('status', value === 'all' ? '' : value)} options={[['all', 'Todos'], ...prospectStatuses.map((item) => [item, prospectStatusLabels[item]] as [string, string])]} />
          <Select label="Prioridad" value={priority} onChange={(value) => setParam('priority', value === 'all' ? '' : value)} options={[['all', 'Todas'], ...priorities.map((item) => [item, priorityLabels[item]] as [string, string])]} />
          <Select label="Origen" value={source} onChange={(value) => setParam('source', value)} options={[['', 'Todos'], ...sources.map((item) => [item, item] as [string, string])]} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Próxima acción
            <input type="date" value={dateFilter} onChange={(event) => setParam('date', event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={noContact} onChange={(event) => setParam('sin_contacto', event.target.checked ? '1' : '')} /> Sin contacto</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={overdue} onChange={(event) => setParam('vencidos', event.target.checked ? '1' : '')} /> Vencidos</label>
        </div>
      </section>

      {loading && <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />}
      {!loading && error && <ErrorPanel title="No fue posible cargar prospección" error={error} onRetry={() => void load()} />}
      {!loading && !error && prospects.length === 0 && <EmptyState title="Aún no hay prospectos" text="Crea prospectos preliminares antes de convertirlos en contactos formales." />}
      {!loading && !error && prospects.length > 0 && visible.length === 0 && <EmptyState title="Sin resultados" text="No hay prospectos que coincidan con los filtros." />}

      {!loading && !error && visible.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="hidden max-w-full overflow-x-auto lg:block">
            <table className="min-w-[1180px] w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>{['Prospecto', 'Empresa', 'Teléfono', 'Correo', 'Origen', 'Estado', 'Prioridad', 'Último contacto', 'Próxima acción', 'Intentos', 'Acción'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visible.map((prospect) => (
                  <tr key={prospect.id} className={rowTone(prospect)}>
                    <td className="px-3 py-4 font-semibold text-[#17202d]">{prospectName(prospect)}</td>
                    <td className="px-3 py-4">{prospect.company_name || '—'}</td>
                    <td className="px-3 py-4">{prospect.phone || '—'}</td>
                    <td className="break-words px-3 py-4">{prospect.email || '—'}</td>
                    <td className="px-3 py-4">{prospect.source || '—'}</td>
                    <td className="px-3 py-4">{prospectStatusLabels[prospect.status]}</td>
                    <td className="px-3 py-4">{priorityLabels[prospect.priority]}</td>
                    <td className="px-3 py-4">{formatDateTime(prospect.last_contact_at)}</td>
                    <td className="px-3 py-4">{prospect.next_action_type ? `${prospect.next_action_type} · ${formatDateTime(prospect.next_action_at)}` : formatDateTime(prospect.next_action_at)}</td>
                    <td className="px-3 py-4">{prospect.contact_attempts}</td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/prospeccion/${prospect.id}`} className="font-semibold text-[#235b3e]">Ver</Link>
                        <button type="button" onClick={() => setActivityFor(prospect)} className="font-semibold text-[#17202d]">Registrar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {visible.map((prospect) => <ProspectCard key={prospect.id} prospect={prospect} onActivity={() => setActivityFor(prospect)} onEdit={() => openEdit(prospect)} />)}
          </div>
        </section>
      )}

      {showForm && <ProspectFormModal prospect={editing} onClose={closeModal} onSaved={onSaved} />}
      {activityFor && <ActivityModal prospect={activityFor} onClose={closeModal} onSaved={onActivitySaved} />}
    </div>
  )
}

export function AdminProspectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prospect, setProspect] = useState<ProspectRecord | null>(null)
  const [activities, setActivities] = useState<ProspectActivityRecord[]>([])
  const [candidates, setCandidates] = useState<ContactRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [showActivity, setShowActivity] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState('')
  const [contactForm, setContactForm] = useState<ContactFormValues>(emptyContactForm)
  const [conversion, setConversion] = useState<ProspectConversionValues>(emptyConversionForm)
  const [converting, setConverting] = useState(false)

  const load = useCallback(async function loadProspect() {
    if (!id) return
    setLoading(true)
    setError('')
    const [prospectResult, activitiesResult, candidatesResult] = await Promise.all([
      adminRepository.getProspectById(id),
      adminRepository.listProspectActivities(id),
      adminRepository.findContactCandidatesForProspect(id),
    ])
    setLoading(false)
    if (prospectResult.error) {
      setError(prospectResult.error)
      return
    }
    setProspect(prospectResult.data)
    if (!activitiesResult.error) setActivities(activitiesResult.data)
    if (!candidatesResult.error) setCandidates(candidatesResult.data)
    if (prospectResult.data) {
      setContactForm({
        ...emptyContactForm,
        contact_type: prospectResult.data.prospect_type,
        full_name: prospectResult.data.full_name ?? '',
        company_name: prospectResult.data.company_name ?? '',
        position: prospectResult.data.role_or_activity ?? '',
        email: prospectResult.data.email ?? '',
        phone: prospectResult.data.phone ?? '',
        website: prospectResult.data.website ?? '',
        social_media: prospectResult.data.social_network ?? '',
        country: prospectResult.data.country ?? '',
        city: prospectResult.data.city_region ?? '',
        notes: prospectResult.data.notes ?? '',
      })
      const loadedProspect = prospectResult.data
      setConversion((current) => ({ ...current, title: loadedProspect.product_or_service || basicProspectName(loadedProspect) }))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function archive() {
    if (!prospect || !window.confirm('¿Archivar este prospecto?')) return
    const result = await adminRepository.updateProspect(prospect.id, { status: 'archived' })
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible archivar.')
      return
    }
    setProspect(result.data)
    setStatus('Prospecto archivado.')
  }

  async function convert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!prospect || converting) return
    if (!conversion.title.trim()) {
      setStatus('Ingresa un título para la oportunidad.')
      return
    }
    if (!selectedContactId && contactForm.contact_type === 'person' && !contactForm.full_name.trim()) {
      setStatus('Ingresa el nombre del contacto nuevo.')
      return
    }
    if (!selectedContactId && contactForm.contact_type === 'company' && !contactForm.company_name.trim()) {
      setStatus('Ingresa la empresa del contacto nuevo.')
      return
    }
    setConverting(true)
    setStatus('')
    const result = await adminRepository.convertProspectToOpportunity(
      prospect.id,
      conversion,
      selectedContactId ? { existing_contact_id: selectedContactId } : { contact: contactForm },
    )
    setConverting(false)
    if (result.error || !result.data.prospect) {
      setStatus(result.error ?? 'No fue posible convertir el prospecto.')
      return
    }
    setProspect(result.data.prospect)
    setStatus(result.data.alreadyConverted ? 'El prospecto ya estaba convertido.' : 'Prospecto convertido.')
    void load()
  }

  if (loading) return <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />
  if (error) return <ErrorPanel title="No fue posible cargar el prospecto" error={error} onRetry={() => void load()} />
  if (!prospect) return <EmptyState title="Prospecto no encontrado" text="El registro solicitado no está disponible." />

  return (
    <div className="grid gap-6">
      <AdminPageHeader title={prospectName(prospect)} text="Detalle y trazabilidad de prospección." />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setShowActivity(true)} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} /> Registrar actividad</button>
        <button type="button" onClick={() => setShowEdit(true)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]"><Pencil size={18} /> Editar</button>
        {prospect.status !== 'archived' && prospect.status !== 'converted' && <button type="button" onClick={() => void archive()} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Archivar</button>}
        <button type="button" onClick={() => navigate('/admin/prospeccion')} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Volver</button>
      </div>
      <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2">
        <Info label="Tipo" value={prospectTypeLabels[prospect.prospect_type]} />
        <Info label="Estado" value={prospectStatusLabels[prospect.status]} />
        <Info label="Prioridad" value={priorityLabels[prospect.priority]} />
        <Info label="Temperatura" value={prospectTemperatureLabels[prospect.lead_temperature]} />
        <Info label="Empresa" value={prospect.company_name} />
        <Info label="Cargo o actividad" value={prospect.role_or_activity} />
        <Info label="Producto o servicio" value={prospect.product_or_service} />
        <Info label="Origen comercial" value={prospect.commercial_origin} />
        <Info label="Fuente" value={prospect.source} />
        <Info label="Ubicación" value={[prospect.city_region, prospect.country].filter(Boolean).join(', ')} />
        <Info label="Último contacto" value={formatDateTime(prospect.last_contact_at)} />
        <Info label="Próxima acción" value={prospect.next_action_type ? `${prospect.next_action_type} · ${formatDateTime(prospect.next_action_at)}` : formatDateTime(prospect.next_action_at)} />
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Datos de contacto</h2>
        <Info label="Correo" value={prospect.email} />
        <Info label="Teléfono" value={prospect.phone} />
        <Info label="Sitio web" value={prospect.website} />
        <Info label="Red social" value={prospect.social_network} />
        <Info label="Método preferido" value={prospect.preferred_contact_method} />
        <Info label="Notas" value={prospect.notes} />
      </section>

      {prospect.status === 'converted' && (
        <section className="grid gap-3 rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">Conversión</h2>
          <Info label="Fecha" value={formatDateTime(prospect.converted_at)} />
          {prospect.converted_contact_id && <Link to="/admin/contactos" className="font-semibold text-[#235b3e]">Ver contacto convertido</Link>}
          {prospect.converted_opportunity_id && <Link to={`/admin/oportunidades/${prospect.converted_opportunity_id}`} className="font-semibold text-[#235b3e]">Ver oportunidad convertida</Link>}
        </section>
      )}

      {prospect.status !== 'converted' && (
        <ConversionPanel
          candidates={candidates}
          selectedContactId={selectedContactId}
          setSelectedContactId={setSelectedContactId}
          contactForm={contactForm}
          setContactForm={setContactForm}
          conversion={conversion}
          setConversion={setConversion}
          converting={converting}
          onSubmit={convert}
        />
      )}

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Línea de tiempo</h2>
        <QuickActivityForm prospect={prospect} onSaved={(updated) => { setProspect(updated); void load() }} />
        {activities.length === 0 && <p className="text-sm text-slate-600">No hay actividades registradas.</p>}
        {activities.map((activity) => <TimelineItem key={activity.id} activity={activity} />)}
      </section>

      {showActivity && <ActivityModal prospect={prospect} onClose={() => setShowActivity(false)} onSaved={(updated) => { setProspect(updated); setShowActivity(false); void load() }} />}
      {showEdit && <ProspectFormModal prospect={prospect} onClose={() => setShowEdit(false)} onSaved={(updated) => { setProspect(updated); setShowEdit(false); void load() }} />}
    </div>
  )
}

function ProspectCard({ prospect, onActivity, onEdit }: { prospect: ProspectRecord; onActivity: () => void; onEdit: () => void }) {
  return (
    <article className={`rounded-lg border border-slate-200 p-4 ${rowTone(prospect)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#17202d]">{prospectName(prospect)}</h2>
          <p className="mt-1 text-sm text-slate-600">{prospect.company_name || prospect.source || 'Sin empresa'}</p>
        </div>
        <Link to={`/admin/prospeccion/${prospect.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver</Link>
      </div>
      <dl className="mt-4 grid gap-2 text-sm text-slate-700">
        <Info label="Estado" value={`${prospectStatusLabels[prospect.status]} · ${priorityLabels[prospect.priority]}`} />
        <Info label="Teléfono" value={prospect.phone} />
        <Info label="Correo" value={prospect.email} />
        <Info label="Próxima acción" value={prospect.next_action_type ? `${prospect.next_action_type} · ${formatDateTime(prospect.next_action_at)}` : formatDateTime(prospect.next_action_at)} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onActivity} className="rounded-md bg-[#17202d] px-3 py-2 text-sm font-semibold text-white">Registrar</button>
        <button type="button" onClick={onEdit} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Editar</button>
      </div>
    </article>
  )
}

function ProspectFormModal({ prospect, onClose, onSaved }: { prospect: ProspectRecord | null; onClose: () => void; onSaved: (prospect: ProspectRecord) => void }) {
  const [values, setValues] = useState(() => (prospect ? toProspectForm(prospect) : emptyProspectForm))
  const [initialValues] = useState(() => (prospect ? toProspectForm(prospect) : emptyProspectForm))
  const [errors, setErrors] = useState<Partial<Record<keyof ProspectFormValues, string>>>({})
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  function setField<K extends keyof ProspectFormValues>(field: K, value: ProspectFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function requestClose() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) return
    onClose()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validateProspect(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('Revisa los campos marcados.')
      return
    }
    setSaving(true)
    setStatus('')
    const result = prospect
      ? await adminRepository.updateProspect(prospect.id, prospectPayload(values))
      : await adminRepository.createProspect(prospectPayload(values))
    setSaving(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible guardar el prospecto.')
      return
    }
    onSaved(result.data)
  }

  return (
    <Modal title={prospect ? 'Editar prospecto' : 'Nuevo prospecto'} onClose={requestClose} closeRef={closeRef}>
      <form className="grid gap-5" onSubmit={submit} noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Tipo" value={values.prospect_type} onChange={(value) => setField('prospect_type', value as ProspectType)} options={prospectTypes.map((item) => [item, prospectTypeLabels[item]])} />
          <Select label="Estado" value={values.status} onChange={(value) => setField('status', value as ProspectStatus)} options={prospectStatuses.filter((item) => item !== 'converted').map((item) => [item, prospectStatusLabels[item]])} />
          <TextField id="prospect-full-name" label="Nombre completo" value={values.full_name} error={errors.full_name} onChange={(value) => setField('full_name', value)} />
          <TextField id="prospect-company" label="Empresa" value={values.company_name} error={errors.company_name} onChange={(value) => setField('company_name', value)} />
          <TextField id="prospect-role" label="Cargo o actividad" value={values.role_or_activity} onChange={(value) => setField('role_or_activity', value)} />
          <TextField id="prospect-email" label="Correo" value={values.email} error={errors.email} type="email" onChange={(value) => setField('email', value)} />
          <TextField id="prospect-phone" label="Teléfono" value={values.phone} error={errors.phone} onChange={(value) => setField('phone', value)} />
          <TextField id="prospect-website" label="Sitio web" value={values.website} onChange={(value) => setField('website', value)} />
          <TextField id="prospect-social" label="Red social" value={values.social_network} onChange={(value) => setField('social_network', value)} />
          <TextField id="prospect-country" label="País" value={values.country} onChange={(value) => setField('country', value)} />
          <TextField id="prospect-city" label="Ciudad o región" value={values.city_region} onChange={(value) => setField('city_region', value)} />
          <TextField id="prospect-source" label="Origen" value={values.source} onChange={(value) => setField('source', value)} />
          <TextField id="prospect-product" label="Producto o servicio" value={values.product_or_service} onChange={(value) => setField('product_or_service', value)} />
          <TextField id="prospect-commercial-origin" label="Origen comercial" value={values.commercial_origin} onChange={(value) => setField('commercial_origin', value)} />
          <Select label="Temperatura" value={values.lead_temperature} onChange={(value) => setField('lead_temperature', value as ProspectFormValues['lead_temperature'])} options={prospectTemperatures.map((item) => [item, prospectTemperatureLabels[item]])} />
          <Select label="Prioridad" value={values.priority} onChange={(value) => setField('priority', value as Priority)} options={priorities.map((item) => [item, priorityLabels[item]])} />
          <TextField id="prospect-method" label="Método preferido" value={values.preferred_contact_method} onChange={(value) => setField('preferred_contact_method', value)} />
          <TextField id="prospect-next-type" label="Próxima acción" value={values.next_action_type} onChange={(value) => setField('next_action_type', value)} />
          <TextField id="prospect-next-at" label="Fecha próxima acción" value={values.next_action_at} error={errors.next_action_at} type="datetime-local" onChange={(value) => setField('next_action_at', value)} />
        </div>
        <TextArea id="prospect-notes" label="Notas" value={values.notes} onChange={(value) => setField('notes', value)} />
        <FormFooter status={status} saving={saving} submitLabel="Guardar prospecto" onCancel={requestClose} />
      </form>
    </Modal>
  )
}

function ActivityModal({ prospect, onClose, onSaved }: { prospect: ProspectRecord; onClose: () => void; onSaved: (prospect: ProspectRecord) => void }) {
  return (
    <Modal title={`Registrar actividad · ${prospectName(prospect)}`} onClose={onClose}>
      <QuickActivityForm prospect={prospect} onSaved={onSaved} onCancel={onClose} />
    </Modal>
  )
}

function QuickActivityForm({ prospect, onSaved, onCancel }: { prospect: ProspectRecord; onSaved: (prospect: ProspectRecord) => void; onCancel?: () => void }) {
  const [values, setValues] = useState(emptyActivityForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ProspectActivityFormValues, string>>>({})
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  function setActivityType(type: ProspectActivityType) {
    setValues((current) => ({
      ...current,
      activity_type: type,
      subject: current.subject || prospectActivityTypeLabels[type],
      status: type === 'follow_up' ? 'follow_up' : current.status,
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validateActivity(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('Revisa los campos marcados.')
      return
    }
    setSaving(true)
    setStatus('')
    const result = await adminRepository.createProspectActivity({
      prospect_id: prospect.id,
      activity_type: values.activity_type,
      outcome: values.outcome || null,
      subject: values.subject,
      notes: nullable(values.notes),
      occurred_at: fromDateTimeLocal(values.occurred_at),
      next_action_type: nullable(values.next_action_type),
      next_action_at: fromDateTimeLocal(values.next_action_at),
      status: values.status || null,
    })
    if (result.error || !result.data) {
      setSaving(false)
      setStatus(result.error ?? 'No fue posible registrar la actividad.')
      return
    }
    const updated = await adminRepository.getProspectById(prospect.id)
    setSaving(false)
    if (updated.error || !updated.data) {
      setStatus(updated.error ?? 'Actividad registrada, pero no fue posible recargar el prospecto.')
      return
    }
    onSaved(updated.data)
    setValues(emptyActivityForm)
  }

  return (
    <form className="grid gap-4 rounded-md border border-slate-200 p-4" onSubmit={submit} noValidate>
      <div className="flex flex-wrap gap-2">
        {[
          ['call', Phone],
          ['whatsapp', MessageCircle],
          ['email', Mail],
          ['meeting', CalendarClock],
          ['note', Pencil],
          ['follow_up', CalendarClock],
        ].map(([type, Icon]) => (
          <button key={type as string} type="button" onClick={() => setActivityType(type as ProspectActivityType)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${values.activity_type === type ? 'bg-[#17202d] text-white' : 'border border-slate-300 text-[#17202d]'}`}>
            <Icon size={17} aria-hidden="true" /> {prospectActivityTypeLabels[type as ProspectActivityType]}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="Tipo" value={values.activity_type} onChange={(value) => setActivityType(value as ProspectActivityType)} options={prospectActivityTypes.map((item) => [item, prospectActivityTypeLabels[item]])} />
        <Select label="Resultado" value={values.outcome} onChange={(value) => setValues((current) => ({ ...current, outcome: value as ProspectActivityFormValues['outcome'] }))} options={[['', 'Sin resultado'], ...prospectActivityOutcomes.map((item) => [item, prospectActivityOutcomeLabels[item]] as [string, string])]} />
        <TextField id="activity-subject" label="Asunto" value={values.subject} error={errors.subject} onChange={(value) => setValues((current) => ({ ...current, subject: value }))} />
        <TextField id="activity-occurred" label="Realizada" value={values.occurred_at} error={errors.occurred_at} type="datetime-local" onChange={(value) => setValues((current) => ({ ...current, occurred_at: value }))} />
        <TextField id="activity-next-type" label="Próxima acción" value={values.next_action_type} onChange={(value) => setValues((current) => ({ ...current, next_action_type: value }))} />
        <TextField id="activity-next-at" label="Fecha próxima acción" value={values.next_action_at} error={errors.next_action_at} type="datetime-local" onChange={(value) => setValues((current) => ({ ...current, next_action_at: value }))} />
        <Select label="Cambiar estado" value={values.status} onChange={(value) => setValues((current) => ({ ...current, status: value as ProspectActivityFormValues['status'] }))} options={[['', 'Mantener'], ...prospectStatuses.filter((item) => item !== 'converted').map((item) => [item, prospectStatusLabels[item]] as [string, string])]} />
      </div>
      <TextArea id="activity-notes" label="Notas" value={values.notes} onChange={(value) => setValues((current) => ({ ...current, notes: value }))} />
      <FormFooter status={status} saving={saving} submitLabel="Registrar actividad" onCancel={onCancel} />
    </form>
  )
}

function ConversionPanel({
  candidates,
  selectedContactId,
  setSelectedContactId,
  contactForm,
  setContactForm,
  conversion,
  setConversion,
  converting,
  onSubmit,
}: {
  candidates: ContactRecord[]
  selectedContactId: string
  setSelectedContactId: (value: string) => void
  contactForm: ContactFormValues
  setContactForm: (value: ContactFormValues) => void
  conversion: ProspectConversionValues
  setConversion: (value: ProspectConversionValues) => void
  converting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  function setContactField<K extends keyof ContactFormValues>(field: K, value: ContactFormValues[K]) {
    setContactForm({ ...contactForm, [field]: value })
  }
  function setConversionField<K extends keyof ProspectConversionValues>(field: K, value: ProspectConversionValues[K]) {
    setConversion({ ...conversion, [field]: value })
  }
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">Convertir</h2>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Tipo de oportunidad" value={conversion.opportunity_type} onChange={(value) => setConversionField('opportunity_type', value as OpportunityType)} options={[['buy', 'Compra'], ['sell', 'Venta']]} />
          <TextField id="conversion-title" label="Título oportunidad" value={conversion.title} onChange={(value) => setConversionField('title', value)} />
          <TextField id="conversion-date" label="Fecha esperada" type="date" value={conversion.expected_date} onChange={(value) => setConversionField('expected_date', value)} />
          <TextField id="conversion-value" label="Valor estimado" type="number" value={conversion.estimated_value} onChange={(value) => setConversionField('estimated_value', value)} />
          <TextField id="conversion-currency" label="Moneda" value={conversion.currency} onChange={(value) => setConversionField('currency', value)} />
        </div>
        <TextArea id="conversion-description" label="Descripción" value={conversion.description} onChange={(value) => setConversionField('description', value)} />
        <TextArea id="conversion-notes" label="Notas internas" value={conversion.internal_notes} onChange={(value) => setConversionField('internal_notes', value)} />
        <Select label="Contacto existente" value={selectedContactId} onChange={setSelectedContactId} options={[['', 'Crear contacto nuevo'], ...candidates.map((contact) => [contact.id, contact.full_name || contact.company_name || contact.email || contact.id] as [string, string])]} />
        {!selectedContactId && (
          <div className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-2">
            <Select label="Tipo contacto" value={contactForm.contact_type} onChange={(value) => setContactField('contact_type', value as ProspectType)} options={prospectTypes.map((item) => [item, prospectTypeLabels[item]])} />
            <TextField id="new-contact-name" label="Nombre" value={contactForm.full_name} onChange={(value) => setContactField('full_name', value)} />
            <TextField id="new-contact-company" label="Empresa" value={contactForm.company_name} onChange={(value) => setContactField('company_name', value)} />
            <TextField id="new-contact-email" label="Correo" value={contactForm.email} onChange={(value) => setContactField('email', value)} />
            <TextField id="new-contact-phone" label="Teléfono" value={contactForm.phone} onChange={(value) => setContactField('phone', value)} />
          </div>
        )}
        <button type="submit" disabled={converting} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {converting ? 'Convirtiendo...' : 'Convertir en contacto y oportunidad'}
        </button>
      </form>
    </section>
  )
}

function TimelineItem({ activity }: { activity: ProspectActivityRecord }) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-[#17202d]">{prospectActivityTypeLabels[activity.activity_type]} · {activity.subject}</p>
          <p className="mt-1 text-sm text-slate-600">{formatDateTime(activity.occurred_at)}</p>
        </div>
        {activity.next_action_at && (
          <span className={`inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${activity.completed_at ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            {activity.completed_at ? <CheckCircle2 size={18} /> : <CalendarClock size={18} />}
            {activity.completed_at ? 'Completada' : 'Pendiente'}
          </span>
        )}
      </div>
      {activity.outcome && <p className="mt-2 text-sm text-slate-700">{prospectActivityOutcomeLabels[activity.outcome]}</p>}
      {activity.notes && <p className="mt-2 text-sm text-slate-700">{activity.notes}</p>}
      {activity.next_action_at && <p className="mt-2 text-sm font-medium text-[#235b3e]">Próxima acción: {activity.next_action_type || 'Seguimiento'} · {formatDateTime(activity.next_action_at)}</p>}
    </article>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-3 text-base">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function TextField({ id, label, value, error, type = 'text', onChange }: { id: string; label: string; value: string; error?: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20" />
      {error && <span className="text-sm text-red-700">{error}</span>}
    </label>
  )
}

function TextArea({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20" />
    </label>
  )
}

function FormFooter({ status, saving, submitLabel, onCancel }: { status: string; saving: boolean; submitLabel: string; onCancel?: () => void }) {
  return (
    <>
      <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{status}</div>
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>}
        <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : submitLabel}</button>
      </div>
    </>
  )
}

function Modal({ title, children, onClose, closeRef }: { title: string; children: ReactNode; onClose: () => void; closeRef?: RefObject<HTMLButtonElement | null> }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="prospecting-modal-title">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <h2 id="prospecting-modal-title" className="text-xl font-semibold text-[#17202d]">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Cerrar"><X size={22} /></button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

function ErrorPanel({ title, error, onRetry }: { title: string; error: string; onRetry: () => void }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">{title}</h2>
      <p className="mt-2 text-sm text-slate-700">{error}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Reintentar</button>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-700">{value}</dd>
    </div>
  )
}
