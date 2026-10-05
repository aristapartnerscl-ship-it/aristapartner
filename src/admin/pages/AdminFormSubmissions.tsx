import { Archive, Ban, CheckCircle2, Eye, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { EmptyState } from '../../components/admin/EmptyState'
import { AdminKpiCard } from '../../components/admin/AdminVisualSystem'
import {
  buildContactInitialValues,
  buildInquiryDraft,
  buildBuyOpportunityDraft,
  buildSellOpportunityDraft,
  buildSupplierDraft,
  contactDisplayName,
  displayPayloadValue,
  labeledPayloadFields,
  normalizeSubmissionPayload,
} from '../form-submission-utils'
import { adminRepository } from '../../repositories'
import type {
  ContactFormValues,
  ContactRecord,
  ConvertedSubmissionEntity,
  FormSubmissionRecord,
  SubmissionContactStrategy,
  SubmissionConversionResult,
  SubmissionStatus,
  SubmissionType,
} from '../../types/admin'

const typeLabels: Record<SubmissionType, string> = {
  buy: 'Compra',
  sell: 'Venta',
  supplier: 'Proveedor',
  contact: 'Contacto',
}

const statusLabels: Record<SubmissionStatus, string> = {
  received: 'Recibida',
  under_review: 'En evaluación',
  converted: 'Convertida',
  rejected: 'Rechazada',
  spam: 'Spam',
  archived: 'Archivada',
}

const statusOptions: Array<{ value: SubmissionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'received', label: 'Recibida' },
  { value: 'under_review', label: 'En evaluación' },
  { value: 'converted', label: 'Convertida' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'spam', label: 'Spam' },
  { value: 'archived', label: 'Archivada' },
]

const typeOptions: Array<{ value: SubmissionType | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'buy', label: 'Compra' },
  { value: 'sell', label: 'Venta' },
  { value: 'supplier', label: 'Proveedor' },
  { value: 'contact', label: 'Contacto' },
]

const finalDraftLabels: Record<SubmissionType, Record<string, string>> = {
  contact: {
    contact_id: 'Contacto',
    subject: 'Asunto',
    reason: 'Motivo',
    message: 'Mensaje',
    preferred_contact_method: 'Medio de contacto preferido',
    status: 'Estado',
    internal_notes: 'Notas internas',
    converted_opportunity_id: 'Oportunidad vinculada',
  },
  buy: {
    opportunity_type: 'Tipo de oportunidad',
    title: 'Título',
    description: 'Descripción',
    contact_id: 'Contacto',
    status: 'Estado',
    priority: 'Prioridad',
    source: 'Origen',
    estimated_value: 'Valor estimado',
    currency: 'Moneda',
    expected_date: 'Fecha esperada',
    country: 'País',
    region: 'Región',
    city: 'Ciudad',
    internal_notes: 'Notas internas',
    rejection_reason: 'Motivo de rechazo',
    assigned_to: 'Responsable',
  },
  sell: {
    opportunity_type: 'Tipo de oportunidad',
    title: 'Título',
    description: 'Descripción',
    contact_id: 'Contacto',
    status: 'Estado',
    priority: 'Prioridad',
    source: 'Origen',
    estimated_value: 'Valor estimado',
    currency: 'Moneda',
    expected_date: 'Fecha esperada',
    country: 'País',
    region: 'Región',
    city: 'Ciudad',
    internal_notes: 'Notas internas',
    rejection_reason: 'Motivo de rechazo',
    assigned_to: 'Responsable',
  },
  supplier: {
    contact_id: 'Contacto',
    business_name: 'Nombre comercial',
    legal_name: 'Razón social',
    tax_id: 'Identificación tributaria',
    description: 'Descripción',
    categories: 'Categorías',
    geographic_coverage: 'Cobertura geográfica',
    supply_capacity: 'Capacidad',
    minimum_order: 'Pedido mínimo',
    minimum_order_currency: 'Moneda del mínimo',
    issues_invoice: 'Emite factura',
    commercial_terms: 'Condiciones comerciales',
    status: 'Estado',
    internal_notes: 'Notas internas',
  },
}

const finalDraftValueLabels: Record<string, string> = {
  'new-contact': 'Nuevo contacto',
  services: 'Consulta sobre servicios',
  commercial_representation: 'Representación comercial',
  supplier_search: 'Búsqueda de proveedores',
  b2b_opportunity: 'Oportunidad B2B',
  collaboration: 'Propuesta de colaboración',
  press: 'Prensa o comunicación',
  other: 'Otro',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  whatsapp: 'WhatsApp',
  phone_whatsapp: 'Teléfono o WhatsApp',
  any: 'Cualquiera',
  new: 'Nueva',
  under_review: 'En evaluación',
  pending: 'Pendiente',
  medium: 'Media',
  low: 'Baja',
  high: 'Alta',
  buy: 'Compra',
  sell: 'Venta',
  public_form: 'Formulario público',
}

const conversionEntityLabels: Record<NonNullable<SubmissionConversionResult['entity']>['type'], string> = {
  inquiry: 'Consulta',
  opportunity: 'Oportunidad',
  supplier: 'Proveedor',
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function searchableText(submission: FormSubmissionRecord) {
  const payload = normalizeSubmissionPayload(submission)
  return `${submission.submission_type} ${submission.status} ${Object.values(payload).map((value) => displayPayloadValue(value)).join(' ')}`.toLowerCase()
}

function canConvert(submission: FormSubmissionRecord) {
  return ['received', 'under_review'].includes(submission.status) && !submission.converted_entity_id && !submission.converted_entity_type
}

function entityHref(entity: ConvertedSubmissionEntity) {
  if (!entity) return ''
  if (entity.type === 'inquiry') return `/admin/consultas/${entity.record.id}`
  if (entity.type === 'opportunity') return `/admin/oportunidades/${entity.record.id}`
  return `/admin/proveedores/${entity.record.id}`
}

function entityLabel(entity: ConvertedSubmissionEntity) {
  if (!entity) return 'Sin entidad vinculada'
  if (entity.type === 'inquiry') return entity.record.subject
  if (entity.type === 'opportunity') return `${entity.record.reference_code} · ${entity.record.title}`
  return entity.record.business_name
}

function detailEmpty(value: string | null | undefined) {
  return value?.trim() || 'Sin información'
}

function formatFinalDraftValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.length > 0 ? value.map((item): string => formatFinalDraftValue(key, item)).join(', ') : 'Sin información'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value === null || value === undefined || value === '') return 'Sin información'
  if (typeof value === 'number') return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(value)
  const stringValue = String(value)
  if (key === 'contact_id' && stringValue !== 'new-contact') return 'Contacto seleccionado'
  if (key.includes('date') && /^\d{4}-\d{2}-\d{2}/.test(stringValue)) return formatDate(stringValue)
  return finalDraftValueLabels[stringValue] ?? stringValue
}

function finalDraftFields(submissionType: SubmissionType, draft: Record<string, unknown>) {
  const labels = finalDraftLabels[submissionType]
  return Object.entries(draft)
    .filter(([, value]) => value !== null && value !== '')
    .map(([key, value]) => ({
      key,
      label: labels[key] ?? key,
      value: formatFinalDraftValue(key, value),
    }))
}

export function AdminFormSubmissions({ modern = false }: { modern?: boolean }) {
  const [items, setItems] = useState<FormSubmissionRecord[]>([])
  const [selected, setSelected] = useState<FormSubmissionRecord | null>(null)
  const selectedTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [convertedEntity, setConvertedEntity] = useState<ConvertedSubmissionEntity>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const typeFilter = searchParams.get('type') ?? 'all'
  const dateFilter = searchParams.get('date') ?? ''

  async function loadSubmissions() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listFormSubmissions()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setItems(result.data)
    setSelected((current) => current ? result.data.find((item) => item.id === current.id) ?? null : null)
  }

  useEffect(() => {
    void loadSubmissions()
  }, [])

  useEffect(() => {
    if (!selected?.converted_entity_id) {
      setConvertedEntity(null)
      return
    }
    let cancelled = false
    void adminRepository.getConvertedSubmissionEntity(selected).then((result) => {
      if (!cancelled) setConvertedEntity(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [selected])

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (typeFilter !== 'all' && item.submission_type !== typeFilter) return false
      if (dateFilter && !item.submitted_at.startsWith(dateFilter)) return false
      if (normalized && !searchableText(item).includes(normalized)) return false
      return true
    })
  }, [dateFilter, items, search, statusFilter, typeFilter])

  function setParam(name: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all') next.delete(name)
    else next.set(name, value)
    setSearchParams(next)
  }

  function updateSubmission(updated: FormSubmissionRecord) {
    setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry))
    setSelected(updated)
  }

  async function changeStatus(item: FormSubmissionRecord, nextStatus: SubmissionStatus, message: string) {
    if (processing) return
    if (!window.confirm(message)) return
    setProcessing(item.id)
    setStatus('')
    const result = await adminRepository.updateFormSubmission(item.id, { status: nextStatus })
    setProcessing('')
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible actualizar la recepción.')
      return
    }
    updateSubmission(result.data)
    setStatus('Recepción actualizada.')
  }

  async function handleConversionResult(result: SubmissionConversionResult, message: string) {
    if (result.submission) updateSubmission(result.submission)
    if (result.entity) setConvertedEntity(result.entity)
    setStatus(message)
    await loadSubmissions()
  }

  async function convertToAristaProspect(item: FormSubmissionRecord) {
    setStatus('')
    const result = await adminRepository.convertFormSubmissionToAristaProspect(item.id)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible convertir la solicitud en prospección Arista.')
      return
    }
    const updated = { ...item, status: 'converted' as const, converted_entity_type: 'arista_business_prospect', converted_entity_id: result.data.id }
    updateSubmission(updated)
    setConvertedEntity(null)
    setStatus('Solicitud convertida en prospección Arista.')
    await loadSubmissions()
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={modern ? 'Solicitudes web' : 'Recepciones'}
        text={modern ? 'Solicitudes recibidas desde la web pública para gestión administrativa.' : 'Formularios públicos recibidos para revisión administrativa antes de crear entidades internas.'}
      />

      {modern && <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {([['Nuevas', items.filter((item) => item.status === 'received').length], ['Leídas', items.filter((item) => item.status === 'under_review').length], ['En gestión', items.filter((item) => item.status === 'under_review').length], ['Convertidas', items.filter((item) => item.status === 'converted').length], ['Archivadas', items.filter((item) => item.status === 'archived').length]] as const).map(([label, value]) => <AdminKpiCard key={label} label={label} value={value} tone="neutral" />)}
      </div>}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            {modern ? 'Buscar solicitudes' : 'Buscar recepciones'}
            <input type="search" value={search} placeholder="Buscar por campos básicos validados" onChange={(event) => setParam('q', event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2" />
          </label>
          <SelectFilter label="Estado" value={statusFilter} options={statusOptions} onChange={(value) => setParam('status', value)} />
          <SelectFilter label="Tipo" value={typeFilter} options={typeOptions} onChange={(value) => setParam('type', value)} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Fecha
            <input type="date" value={dateFilter} onChange={(event) => setParam('date', event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2" />
          </label>
        </div>
      </section>

      <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>

      {loading && <div className="h-44 animate-pulse rounded-lg border border-slate-200 bg-white" aria-label={modern ? 'Cargando solicitudes web' : 'Cargando recepciones'} />}
      {!loading && error && <ErrorState error={error} onRetry={loadSubmissions} />}
      {!loading && !error && items.length === 0 && <EmptyState title="Aún no hay recepciones" text="Los formularios públicos aparecerán aquí cuando la recepción digital sea habilitada." />}
      {!loading && !error && items.length > 0 && filtered.length === 0 && <EmptyState title="Sin resultados" text="No hay recepciones que coincidan con los filtros actuales." />}

      {!loading && !error && filtered.length > 0 && (
        <SubmissionList items={filtered} selectedId={selected?.id ?? null} onSelect={(item, trigger) => { selectedTriggerRef.current = trigger; setSelected(item) }} />
      )}

      {selected && (
        <AdminDetailModal
          title={`${typeLabels[selected.submission_type]} recibida`}
          subtitle={`${statusLabels[selected.status]} · ${formatDate(selected.submitted_at)}`}
          onClose={() => setSelected(null)}
          returnFocusRef={selectedTriggerRef}
        >
          <SubmissionDetail
            submission={selected}
            entity={convertedEntity}
            processing={processing}
            onClose={() => setSelected(null)}
            onStatusChange={changeStatus}
            onConverted={handleConversionResult}
            onAristaConverted={convertToAristaProspect}
          />
        </AdminDetailModal>
      )}
    </div>
  )
}
function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">No fue posible cargar recepciones</h2>
      <p className="mt-2 text-sm text-slate-700">{error}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Reintentar</button>
    </section>
  )
}

function SubmissionList({ items, selectedId, onSelect }: { items: FormSubmissionRecord[]; selectedId: string | null; onSelect: (item: FormSubmissionRecord, trigger: HTMLButtonElement) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="hidden grid-cols-[1fr_120px_150px_180px_80px] gap-4 border-b border-slate-200 bg-[#faf8f2] px-4 py-3 text-xs font-semibold uppercase text-slate-600 md:grid">
        <span>RECEPCIÓN</span><span>Tipo</span><span>Estado</span><span>Fecha</span><span>ACCIÓN</span>
      </div>
      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <article key={item.id} className={`grid gap-3 px-4 py-4 md:grid-cols-[1fr_120px_150px_180px_80px] md:items-center ${item.id === selectedId ? 'bg-[#eef5f1]' : ''}`}>
            <div>
              <p className="font-semibold text-[#17202d]">{typeLabels[item.submission_type]} recibida</p>
              {item.converted_entity_id && <p className="mt-1 text-sm font-medium text-[#235b3e]">Convertida</p>}
            </div>
            <p className="text-sm text-slate-700">{typeLabels[item.submission_type]}</p>
            <p className="text-sm font-medium text-slate-800">{statusLabels[item.status]}</p>
            <p className="text-sm text-slate-600">{formatDate(item.submitted_at)}</p>
            <button type="button" onClick={(event) => onSelect(item, event.currentTarget)} className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">
              <Eye size={16} aria-hidden="true" />Ver
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

function SubmissionDetail({
  submission,
  entity,
  processing,
  onClose,
  onStatusChange,
  onConverted,
  onAristaConverted,
}: {
  submission: FormSubmissionRecord
  entity: ConvertedSubmissionEntity
  processing: string
  onClose: () => void
  onStatusChange: (item: FormSubmissionRecord, status: SubmissionStatus, message: string) => Promise<void>
  onConverted: (result: SubmissionConversionResult, message: string) => Promise<void>
  onAristaConverted: (item: FormSubmissionRecord) => Promise<void>
}) {
  const [showEmpty, setShowEmpty] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const fields = labeledPayloadFields(submission, showEmpty)

  return (
    <section className="grid gap-5">
      <div className="hidden">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#235b3e]">Detalle</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#17202d]">{typeLabels[submission.submission_type]} recibida</h2>
          <p className="mt-1 text-sm text-slate-600">{statusLabels[submission.status]} · {formatDate(submission.submitted_at)}</p>
        </div>
        <button type="button" onClick={onClose} className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cerrar</button>
      </div>

      {submission.status === 'converted' ? (
        <div className="mt-5 rounded-md border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm text-[#17202d]">
          <CheckCircle2 className="mr-2 inline text-[#235b3e]" size={18} aria-hidden="true" />
          Esta recepción fue revisada y convertida correctamente.
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="mr-2 inline" size={17} aria-hidden="true" />
          Datos recibidos desde formulario público. Revisar antes de convertir manualmente en entidades administrativas.
        </div>
      )}

      {entity && (
        <div className="mt-5 rounded-md border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm text-[#17202d]">
          <CheckCircle2 className="mr-2 inline text-[#235b3e]" size={18} aria-hidden="true" />
          Entidad vinculada: {entityLabel(entity)}
          <Link to={entityHref(entity)} className="ml-3 font-semibold text-[#235b3e]">Ver entidad</Link>
        </div>
      )}

      <div className="mt-5">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)} className="h-4 w-4 accent-[#235b3e]" />
          Mostrar campos vacíos
        </label>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="rounded-md border border-slate-200 bg-[#faf8f2] p-4">
            <dt className="text-xs font-semibold uppercase text-slate-500">{field.label}</dt>
            <dd className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{displayPayloadValue(field.value, field.key)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {submission.status === 'archived' && <button type="button" disabled={processing === submission.id} onClick={() => void onStatusChange(submission, 'under_review', '¿Restaurar esta solicitud para continuar su gestión?')} className="rounded-md border border-[#235b3e] px-4 py-3 text-sm font-semibold text-[#235b3e]">Restaurar</button>}
        {submission.status === 'received' && (
          <button type="button" disabled={processing === submission.id} onClick={() => void onStatusChange(submission, 'under_review', '¿Marcar esta recepción como en evaluación?')} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Iniciar revisión</button>
        )}
        {canConvert(submission) && <button type="button" onClick={() => setWizardOpen((value) => !value)} className="rounded-md border border-[#235b3e] px-4 py-3 text-sm font-semibold text-[#235b3e]">Convertir</button>}
        {!['converted', 'archived'].includes(submission.status) && <button type="button" disabled={processing === submission.id} onClick={() => void onAristaConverted(submission)} className="rounded-md border border-[#235b3e] px-4 py-3 text-sm font-semibold text-[#235b3e]">Convertir en Prospección Arista</button>}
        {!['converted'].includes(submission.status) && <button type="button" disabled={processing === submission.id} onClick={() => void onStatusChange(submission, 'rejected', '¿Rechazar esta recepción?')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60"><Ban size={17} aria-hidden="true" />Rechazar</button>}
        {!['converted'].includes(submission.status) && <button type="button" disabled={processing === submission.id} onClick={() => void onStatusChange(submission, 'spam', '¿Marcar esta recepción como spam?')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60"><ShieldAlert size={17} aria-hidden="true" />Marcar spam</button>}
        {!['converted'].includes(submission.status) && <button type="button" disabled={processing === submission.id} onClick={() => void onStatusChange(submission, 'archived', '¿Archivar esta recepción? No se eliminará.')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60"><Archive size={17} aria-hidden="true" />Archivar</button>}
      </div>

      {wizardOpen && <ConversionWizard submission={submission} onConverted={onConverted} onClose={() => setWizardOpen(false)} />}
    </section>
  )
}

function ConversionWizard({ submission, onConverted, onClose }: { submission: FormSubmissionRecord; onConverted: (result: SubmissionConversionResult, message: string) => Promise<void>; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)
  const [conversionResult, setConversionResult] = useState<SubmissionConversionResult | null>(null)
  const [candidates, setCandidates] = useState<ContactRecord[]>([])
  const [selectedContactId, setSelectedContactId] = useState('')
  const [useNewContact, setUseNewContact] = useState(false)
  const [contactValues, setContactValues] = useState<ContactFormValues>(() => buildContactInitialValues(submission))
  const fields = labeledPayloadFields(submission)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void adminRepository.findContactCandidatesForSubmission(submission.id).then((result) => {
      if (!cancelled) setCandidates(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [submission.id])

  useEffect(() => {
    if (step === 5) resultRef.current?.focus()
  }, [step])

  const contactId = selectedContactId || (useNewContact ? 'new-contact' : '')
  const finalDraft = useMemo(() => {
    if (!contactId) return null
    if (submission.submission_type === 'contact') return buildInquiryDraft(submission, contactId)
    if (submission.submission_type === 'buy') return buildBuyOpportunityDraft(submission, contactId)
    if (submission.submission_type === 'sell') return buildSellOpportunityDraft(submission, contactId)
    return buildSupplierDraft(submission, contactId)
  }, [contactId, submission])

  function updateContactField(name: keyof ContactFormValues, value: string) {
    setContactValues((current) => ({ ...current, [name]: value }))
    setStatus('')
  }

  async function confirmConversion() {
    if (processing || !contactId) return
    if (!window.confirm('¿Confirmar conversión manual de esta recepción?')) return
    setProcessing(true)
    setStatus('Convirtiendo...')
    const strategy: SubmissionContactStrategy = selectedContactId
      ? { existing_contact_id: selectedContactId }
      : { existing_contact_id: null, contact: contactValues }
    const result = submission.submission_type === 'contact'
      ? await adminRepository.convertContactSubmission(submission.id, strategy)
      : submission.submission_type === 'buy'
        ? await adminRepository.convertBuySubmission(submission.id, strategy)
        : submission.submission_type === 'sell'
          ? await adminRepository.convertSellSubmission(submission.id, strategy)
          : await adminRepository.convertSupplierSubmission(submission.id, strategy)
    setProcessing(false)
    if (result.error) {
      setStatus(result.error)
      return
    }
    setConversionResult(result.data)
    setStatus('')
    await onConverted(
      result.data,
      result.data.alreadyConverted
        ? 'Esta recepción ya estaba convertida. Se cargó la entidad vinculada.'
        : 'Recepción convertida correctamente.',
    )
    setStep(5)
  }

  return (
    <section className="mt-8 rounded-lg border border-[#235b3e]/25 bg-[#f8fbf9] p-5">
      <h3 className="text-xl font-semibold text-[#17202d]">Asistente de conversión</h3>
      <ol className="mt-4 flex flex-wrap gap-2 text-sm">
        {['Revisar datos', 'Contacto', 'Entidad final', 'Confirmar', 'Resultado'].map((label, index) => (
          <li key={label} className={`rounded-md px-3 py-2 ${step === index + 1 ? 'bg-[#235b3e] text-white' : 'bg-white text-slate-700'}`}>{index + 1}. {label}</li>
        ))}
      </ol>
      <div aria-live="polite" className="mt-4 min-h-6 text-sm text-slate-700">{status}</div>

      {step === 1 && (
        <div className="grid gap-4">
          <p className="text-sm text-slate-700">Revisa los datos normalizados antes de crear entidades internas.</p>
          <dl className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => <div key={field.key} className="rounded-md bg-white p-3"><dt className="text-xs font-semibold uppercase text-slate-500">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{displayPayloadValue(field.value, field.key)}</dd></div>)}
          </dl>
          <button type="button" onClick={() => setStep(2)} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Continuar</button>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-md bg-white p-4">
            <h4 className="font-semibold text-[#17202d]">Posibles contactos duplicados</h4>
            <div className="mt-3 grid gap-2">
              {candidates.length === 0 && <p className="text-sm text-slate-600">No se encontraron coincidencias por correo, teléfono, nombre o empresa.</p>}
              {candidates.map((contact) => (
                <label key={contact.id} className="flex items-start gap-3 rounded-md border border-slate-200 p-3 text-sm">
                  <input type="radio" name="candidate" checked={selectedContactId === contact.id} onChange={() => { setSelectedContactId(contact.id); setUseNewContact(false) }} className="mt-1 accent-[#235b3e]" />
                  <span><strong>{contactDisplayName(contact)}</strong><br />{[contact.company_name, contact.email, contact.phone].filter(Boolean).join(' · ')}</span>
                </label>
              ))}
            </div>
          </section>
          <section className="rounded-md bg-white p-4">
            <h4 className="font-semibold text-[#17202d]">Crear contacto nuevo</h4>
            <ContactFields values={contactValues} onChange={updateContactField} />
            <button type="button" disabled={processing} onClick={() => { setUseNewContact(true); setSelectedContactId('') }} className="mt-4 rounded-md border border-[#235b3e] px-4 py-3 text-sm font-semibold text-[#235b3e] disabled:opacity-60">Usar estos datos para crear contacto</button>
          </section>
          <div className="lg:col-span-2 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold">Atrás</button>
            <button type="button" disabled={!contactId} onClick={() => setStep(3)} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Continuar</button>
          </div>
        </div>
      )}

      {step === 3 && finalDraft && (
        <div className="grid gap-4">
          <h4 className="font-semibold text-[#17202d]">Entidad final a crear</h4>
          <dl className="grid gap-3 md:grid-cols-2">
            {finalDraftFields(submission.submission_type, finalDraft).map((field) => (
              <div key={field.key} className="rounded-md bg-white p-3">
                <dt className="text-xs font-semibold uppercase text-slate-500">{field.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">{field.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-3">
            <button type="button" disabled={processing} onClick={() => setStep(2)} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60">Atrás</button>
            <button type="button" disabled={processing} onClick={() => setStep(4)} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Continuar</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4">
          <p className="text-sm text-slate-700">La conversión será ejecutada en una RPC transaccional con el cliente autenticado y respetando RLS.</p>
          <div className="flex gap-3">
            <button type="button" disabled={processing} onClick={() => setStep(3)} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-60">Atrás</button>
            <button type="button" disabled={processing || !contactId} onClick={() => void confirmConversion()} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Confirmar conversión</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div ref={resultRef} tabIndex={-1} className="grid gap-3 rounded-md border border-[#235b3e]/25 bg-white p-4 text-sm text-[#17202d] outline-none focus:ring-2 focus:ring-[#235b3e]/30">
          <p className="font-semibold text-[#235b3e]">Conversión finalizada.</p>
          <p>La recepción mantiene trazabilidad hacia la entidad creada.</p>
          {conversionResult?.entity && (
            <div className="rounded-md bg-[#eef5f1] p-3">
              <p><strong>Entidad creada:</strong> {conversionEntityLabels[conversionResult.entity.type]}</p>
              <p><strong>Identificador:</strong> {detailEmpty(entityLabel(conversionResult.entity))}</p>
              <Link to={entityHref(conversionResult.entity)} className="mt-3 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Ver entidad</Link>
            </div>
          )}
          <button type="button" onClick={onClose} className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cerrar asistente</button>
        </div>
      )}
    </section>
  )
}

function ContactFields({ values, onChange }: { values: ContactFormValues; onChange: (name: keyof ContactFormValues, value: string) => void }) {
  const fields: Array<[keyof ContactFormValues, string]> = [
    ['full_name', 'Nombre completo'],
    ['company_name', 'Empresa'],
    ['position', 'Cargo o actividad'],
    ['email', 'Correo electrónico'],
    ['phone', 'Teléfono o WhatsApp'],
    ['website', 'Sitio web'],
    ['social_media', 'Red social'],
    ['country', 'País'],
    ['region', 'Región'],
    ['city', 'Ciudad'],
  ]
  return (
    <div className="mt-3 grid gap-3">
      <label className="grid gap-1 text-sm">
        Tipo de contacto
        <select value={values.contact_type} onChange={(event) => onChange('contact_type', event.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
          <option value="person">Persona</option>
          <option value="company">Empresa</option>
        </select>
      </label>
      {fields.map(([name, label]) => (
        <label key={name} className="grid gap-1 text-sm">
          {label}
          <input value={String(values[name] ?? '')} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(name, event.target.value)} className="rounded-md border border-slate-300 px-3 py-2" />
        </label>
      ))}
    </div>
  )
}
