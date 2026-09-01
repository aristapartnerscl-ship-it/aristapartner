import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Archive, Eye, MailCheck, Repeat2 } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type {
  ContactRecord,
  ContactSelectorRecord,
  ContactType,
  InquiryConversionValues,
  InquiryFormValues,
  InquiryReason,
  InquiryStatus,
  InquiryWithContact,
  OpportunityRecord,
  PreferredContactMethod,
} from '../../types/admin'
import {
  contactName,
  formatDateTime,
  inquiryReasonLabels,
  inquiryReasons,
  inquiryStatusLabels,
  inquiryStatuses,
  opportunityStatusLabels,
  opportunityTypeLabels,
  preferredContactMethodLabels,
  preferredContactMethods,
} from '../opportunity-labels'

const emptyInquiryForm: InquiryFormValues = {
  contact_id: '',
  reason: '',
  subject: '',
  message: '',
  preferred_contact_method: '',
  status: 'new',
  internal_notes: '',
}

const emptyConversion: InquiryConversionValues = {
  opportunity_type: 'buy',
  title: '',
  description: '',
  internal_notes: '',
}

type QuickContactForm = {
  contact_type: ContactType
  full_name: string
  company_name: string
  email: string
  phone: string
}

const emptyQuickContact: QuickContactForm = {
  contact_type: 'person',
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
}

function nullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function inquiryToForm(inquiry: InquiryWithContact): InquiryFormValues {
  return {
    contact_id: inquiry.contact_id ?? '',
    reason: (inquiry.reason as InquiryReason | null) ?? '',
    subject: inquiry.subject ?? '',
    message: inquiry.message ?? '',
    preferred_contact_method: (inquiry.preferred_contact_method as PreferredContactMethod | null) ?? '',
    status: inquiry.status,
    internal_notes: inquiry.internal_notes ?? '',
  }
}

function validateInquiry(values: InquiryFormValues) {
  const errors: Partial<Record<keyof InquiryFormValues, string>> = {}
  if (!values.contact_id) errors.contact_id = 'Selecciona un contacto asociado.'
  if (!values.reason) errors.reason = 'Selecciona un motivo.'
  if (!values.subject.trim()) errors.subject = 'Ingresa un asunto.'
  if (values.message.trim().length < 10) errors.message = 'Ingresa un mensaje de al menos 10 caracteres.'
  if (!values.status) errors.status = 'Selecciona un estado.'
  return errors
}

function inquiryPayload(values: InquiryFormValues) {
  return {
    contact_id: values.contact_id,
    reason: values.reason,
    subject: values.subject.trim(),
    message: values.message.trim(),
    preferred_contact_method: values.preferred_contact_method || null,
    status: values.status,
    internal_notes: nullable(values.internal_notes),
  }
}

function withoutStatus<T extends { status: InquiryStatus }>(payload: T): Omit<T, 'status'> {
  const { status: _status, ...rest } = payload
  return rest
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function reasonLabel(value: string | null) {
  return value && value in inquiryReasonLabels ? inquiryReasonLabels[value as InquiryReason] : '\u2014'
}

function preferredLabel(value: string | null) {
  return value && value in preferredContactMethodLabels ? preferredContactMethodLabels[value as PreferredContactMethod] : '\u2014'
}

export function AdminInquiries() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [items, setItems] = useState<InquiryWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<InquiryStatus | 'all'>((searchParams.get('status') as InquiryStatus) || 'all')
  const [reason, setReason] = useState<InquiryReason | 'all'>('all')
  const [preferred, setPreferred] = useState<PreferredContactMethod | 'all'>('all')
  const [contactFilter, setContactFilter] = useState<'all' | 'with' | 'without'>('all')
  const [date, setDate] = useState('')

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listInquiries()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setItems(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      if (status !== 'all' && item.status !== status) return false
      if (reason !== 'all' && item.reason !== reason) return false
      if (preferred !== 'all' && item.preferred_contact_method !== preferred) return false
      if (contactFilter === 'with' && !item.contact_id) return false
      if (contactFilter === 'without' && item.contact_id) return false
      if (date && !item.created_at.startsWith(date)) return false
      if (!normalized) return true
      return [item.subject, item.message, contactName(item.contact), item.contact?.company_name, item.contact?.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    })
  }, [contactFilter, date, items, preferred, query, reason, status])

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <AdminPageHeader
        title="Consultas"
        text="Mensajes generales y solicitudes recibidas o registradas por Arista Partners."
        actionLabel="Nueva consulta"
        onAction={() => navigate('/admin/consultas/nueva')}
      />
      <section className="grid min-w-0 max-w-full gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Asunto, contacto, correo o mensaje" className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Select label="Estado" value={status} onChange={(value) => setStatus(value as InquiryStatus | 'all')} options={[['all', 'Todos'], ...inquiryStatuses.map((item) => [item, inquiryStatusLabels[item]] as [string, string])]} />
          <Select label="Motivo" value={reason} onChange={(value) => setReason(value as InquiryReason | 'all')} options={[['all', 'Todos'], ...inquiryReasons.map((item) => [item, inquiryReasonLabels[item]] as [string, string])]} />
          <Select label="Medio" value={preferred} onChange={(value) => setPreferred(value as PreferredContactMethod | 'all')} options={[['all', 'Todos'], ...preferredContactMethods.map((item) => [item, preferredContactMethodLabels[item]] as [string, string])]} />
          <Select label="Contacto" value={contactFilter} onChange={(value) => setContactFilter(value as typeof contactFilter)} options={[['all', 'Todos'], ['with', 'Con contacto'], ['without', 'Sin contacto']]} />
          <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
        </div>
      </section>

      {loading && <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />}
      {!loading && error && <ErrorState title="No fue posible cargar consultas" error={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-semibold text-[#17202d]">Aún no hay consultas</h2>
          <p className="mt-2 text-sm text-slate-600">Registra la primera consulta manualmente desde un contacto existente.</p>
          <Link to="/admin/consultas/nueva" className="mt-5 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Nueva consulta</Link>
        </section>
      )}
      {!loading && !error && items.length > 0 && visible.length === 0 && <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No hay consultas que coincidan con los filtros.</section>}
      {!loading && !error && visible.length > 0 && <InquiryList items={visible} />}
    </div>
  )
}
function InquiryList({ items }: { items: InquiryWithContact[] }) {
  function conversionCell(item: InquiryWithContact) {
    if (item.linkedOpportunity) {
      return (
        <Link to={`/admin/oportunidades/${item.linkedOpportunity.id}`} className="font-semibold text-[#235b3e]">
          Convertida · {item.linkedOpportunity.reference_code}
        </Link>
      )
    }
    if (item.status === 'converted' || item.converted_opportunity_id) {
      return <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">Revisión necesaria</span>
    }
    return '\u2014'
  }

  return (
      <section className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-white">
      <div className="hidden w-full min-w-0 max-w-full overflow-x-auto lg:block">
        <table className="min-w-[1080px] w-full table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>{['Asunto', 'Contacto', 'Motivo', 'Medio preferido', 'Estado', 'Conversión', 'Fecha de creación', 'Última actualización', 'Acción'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-4 font-semibold text-[#17202d]">{item.subject}</td>
                <td className="px-3 py-4">{contactName(item.contact)}</td>
                <td className="px-3 py-4">{reasonLabel(item.reason)}</td>
                <td className="px-3 py-4">{preferredLabel(item.preferred_contact_method)}</td>
                <td className="px-3 py-4">{inquiryStatusLabels[item.status]}</td>
                <td className="px-3 py-4">{conversionCell(item)}</td>
                <td className="px-3 py-4">{formatDateTime(item.created_at)}</td>
                <td className="px-3 py-4">{formatDateTime(item.updated_at)}</td>
                <td className="px-3 py-4"><Link to={`/admin/consultas/${item.id}`} className="font-semibold text-[#235b3e]">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-[#17202d]">{item.subject}</h2>
            <p className="mt-2 text-sm text-slate-700">{contactName(item.contact)}</p>
            <p className="mt-2 text-sm text-slate-600">{reasonLabel(item.reason)} · {inquiryStatusLabels[item.status]}</p>
            <div className="mt-2 text-sm">{conversionCell(item)}</div>
            <Link to={`/admin/consultas/${item.id}`} className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver</Link>
          </article>
        ))}
      </div>
    </section>
  )
}
export function AdminInquiryFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState<InquiryFormValues>(emptyInquiryForm)
  const [initialValues, setInitialValues] = useState<InquiryFormValues>(emptyInquiryForm)
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof InquiryFormValues, string>>>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showQuickContact, setShowQuickContact] = useState(false)
  const [quickContact, setQuickContact] = useState<QuickContactForm>(emptyQuickContact)
  const [creatingContact, setCreatingContact] = useState(false)
  const [convertedOpportunityId, setConvertedOpportunityId] = useState<string | null>(null)
  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty) event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    async function load() {
      const contactsResult = await adminRepository.listContactsForInquirySelector()
      if (contactsResult.error) {
        setLoadError(contactsResult.error)
        setLoading(false)
        return
      }
      setContacts(contactsResult.data)
      if (mode === 'create') {
        setLoading(false)
        return
      }
      if (!isUuid(id)) {
        setLoadError('El identificador de consulta no es válido.')
        setLoading(false)
        return
      }
      const inquiryResult = await adminRepository.getInquiryById(id!)
      if (inquiryResult.error) {
        setLoadError(inquiryResult.error)
        setLoading(false)
        return
      }
      if (!inquiryResult.data) {
        setLoadError('La consulta no existe o no está autorizada para tu usuario.')
        setLoading(false)
        return
      }
      const next = inquiryToForm(inquiryResult.data)
      setValues(next)
      setInitialValues(next)
      setConvertedOpportunityId(inquiryResult.data.converted_opportunity_id)
      setLoading(false)
    }
    void load()
  }, [id, mode])

  const filteredContacts = useMemo(() => {
    const normalized = contactQuery.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) => [contact.full_name, contact.company_name, contact.email, contact.phone].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)))
  }, [contactQuery, contacts])

  function setField<K extends keyof InquiryFormValues>(field: K, value: InquiryFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function requestCancel() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ?Descartarlos?')) return
    navigate(mode === 'edit' && id ? `/admin/consultas/${id}` : '/admin/consultas')
  }

  async function createQuickContact() {
    if (creatingContact) return
    const needsName = quickContact.contact_type === 'person' && !quickContact.full_name.trim()
    const needsCompany = quickContact.contact_type === 'company' && !quickContact.company_name.trim()
    if (needsName || needsCompany) {
      setStatusMessage('Completa el nombre requerido del contacto.')
      return
    }
    setCreatingContact(true)
    const result = await adminRepository.createContact({
      contact_type: quickContact.contact_type,
      full_name: nullable(quickContact.full_name),
      company_name: nullable(quickContact.company_name),
      position: null,
      email: nullable(quickContact.email),
      phone: nullable(quickContact.phone),
      website: null,
      social_media: null,
      country: null,
      region: null,
      city: null,
      notes: null,
      source: 'Panel administrativo',
    })
    setCreatingContact(false)
    if (result.error || !result.data) {
      setStatusMessage(result.error ?? 'No fue posible crear el contacto.')
      return
    }
    const selector: ContactSelectorRecord = {
      id: result.data.id,
      contact_type: result.data.contact_type,
      full_name: result.data.full_name,
      company_name: result.data.company_name,
      email: result.data.email,
      phone: result.data.phone,
      city: result.data.city,
      country: result.data.country,
    }
    setContacts((current) => [selector, ...current])
    setField('contact_id', selector.id)
    setQuickContact(emptyQuickContact)
    setShowQuickContact(false)
    setStatusMessage('Contacto creado y seleccionado.')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const nextErrors = validateInquiry(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Revisa los campos marcados.')
      return
    }
    setSaving(true)
    setStatusMessage('')
    const payload = inquiryPayload(values)
    const result =
      mode === 'create'
        ? await adminRepository.createInquiry(payload)
        : await adminRepository.updateInquiry(id!, convertedOpportunityId ? withoutStatus(payload) : payload)
    setSaving(false)
    if (result.error || !result.data) {
      setStatusMessage(result.error ?? 'No fue posible guardar la consulta.')
      return
    }
    navigate(`/admin/consultas/${result.data.id}`)
  }

  if (mode === 'edit' && !id) return <Navigate to="/admin/consultas" replace />
  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando consulta...</div>
  if (loadError) return <ErrorState title="No fue posible abrir la consulta" error={loadError} href="/admin/consultas" />

  return (
    <div className="grid gap-6">
      <AdminPageHeader title={mode === 'create' ? 'Nueva consulta' : 'Editar consulta'} text="Registra y administra consultas internas desde el panel privado." />
      <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact-search">Buscar contacto<input id="contact-search" value={contactQuery} onChange={(event) => setContactQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact_id">Contacto asociado *<select id="contact_id" value={values.contact_id} onChange={(event) => setField('contact_id', event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base"><option value="">Seleccionar contacto</option>{filteredContacts.map((contact) => <option key={contact.id} value={contact.id}>{contactName(contact)}{contact.company_name ? ` ? ${contact.company_name}` : ''}</option>)}</select>{errors.contact_id && <span className="text-sm text-red-700">{errors.contact_id}</span>}</label>
          </div>
          <button type="button" onClick={() => setShowQuickContact((value) => !value)} className="mt-4 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Crear nuevo contacto</button>
          {showQuickContact && <QuickContactPanel values={quickContact} saving={creatingContact} onChange={setQuickContact} onCreate={() => void createQuickContact()} />}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select label="Motivo *" value={values.reason} onChange={(value) => setField('reason', value as InquiryReason)} options={[['', 'Seleccionar'], ...inquiryReasons.map((item) => [item, inquiryReasonLabels[item]] as [string, string])]} error={errors.reason} />
            <TextField id="subject" label="Asunto *" value={values.subject} error={errors.subject} onChange={(value) => setField('subject', value)} />
            <Select label="Medio de contacto preferido" value={values.preferred_contact_method} onChange={(value) => setField('preferred_contact_method', value as PreferredContactMethod | '')} options={[['', 'Sin preferencia'], ...preferredContactMethods.map((item) => [item, preferredContactMethodLabels[item]] as [string, string])]} />
            <Select
              label="Estado *"
              value={convertedOpportunityId ? 'converted' : values.status}
              disabled={Boolean(convertedOpportunityId)}
              onChange={(value) => setField('status', value as InquiryStatus)}
              options={inquiryStatuses.map((item) => [item, inquiryStatusLabels[item]] as [string, string])}
              error={errors.status}
            />
          </div>
          {convertedOpportunityId && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Esta consulta está convertida. El estado queda bloqueado para conservar la trazabilidad con la oportunidad relacionada.
            </div>
          )}
          <TextArea id="message" label="Mensaje *" value={values.message} error={errors.message} onChange={(value) => setField('message', value)} />
          <TextArea id="internal_notes" label="Notas internas" value={values.internal_notes} onChange={(value) => setField('internal_notes', value)} />
        </section>
        <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{statusMessage}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={requestCancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar consulta'}</button>
        </div>
      </form>
    </div>
  )
}

export function AdminInquiryDetail() {
  const { id } = useParams()
  const [inquiry, setInquiry] = useState<InquiryWithContact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showConversion, setShowConversion] = useState(false)
  const [conversion, setConversion] = useState<InquiryConversionValues>(emptyConversion)
  const [convertedOpportunity, setConvertedOpportunity] = useState<OpportunityRecord | null>(null)

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    if (!isUuid(id)) {
      setError('El identificador de consulta no es válido.')
      setLoading(false)
      return
    }
    const result = await adminRepository.getInquiryById(id!)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (!result.data) {
      setError('La consulta no existe o no está autorizada para tu usuario.')
      return
    }
    setInquiry(result.data)
    setConversion({
      opportunity_type: 'buy',
      title: result.data.subject,
      description: result.data.message,
      internal_notes: '',
    })
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function updateStatus(nextStatus: InquiryStatus, confirmMessage?: string) {
    if (!inquiry || processing) return
    if (inquiry.converted_opportunity_id) {
      setStatus('No se puede cambiar el estado de una consulta convertida mientras conserva la trazabilidad con una oportunidad.')
      return
    }
    if (confirmMessage && !window.confirm(confirmMessage)) return
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.updateInquiry(inquiry.id, { status: nextStatus })
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible actualizar la consulta.')
      return
    }
    setInquiry((current) => (current ? { ...current, ...result.data! } : current))
    setStatus('Consulta actualizada.')
  }

  async function convert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inquiry || processing || inquiry.status === 'converted' || inquiry.converted_opportunity_id) return
    if (!conversion.title.trim() || !conversion.description.trim()) {
      setStatus('Completa título y descripción para convertir.')
      return
    }
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.convertInquiryToOpportunity(inquiry.id, conversion)
    setProcessing(false)
    if (result.data.opportunity) {
      setConvertedOpportunity(result.data.opportunity)
    }
    if (result.data.inquiry) {
      setInquiry((current) =>
        current
          ? {
              ...current,
              ...result.data.inquiry!,
              linkedOpportunity: result.data.opportunity
                ? {
                    id: result.data.opportunity.id,
                    reference_code: result.data.opportunity.reference_code,
                    title: result.data.opportunity.title,
                    status: result.data.opportunity.status,
                    opportunity_type: result.data.opportunity.opportunity_type,
                  }
                : current.linkedOpportunity,
            }
          : current,
      )
    }
    if (result.error) {
      setStatus(result.error)
      return
    }
    setShowConversion(false)
    setStatus(result.data.alreadyConverted ? 'Esta consulta ya estaba convertida. Se carg? la oportunidad vinculada.' : 'Consulta convertida en oportunidad.')
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando consulta...</div>
  if (error || !inquiry) return <ErrorState title="Consulta no disponible" error={error || 'No fue posible cargar la consulta.'} href="/admin/consultas" />

  const linkedOpportunity = inquiry.linkedOpportunity ?? convertedOpportunity
  const convertedWithoutLink = inquiry.status === 'converted' && !inquiry.converted_opportunity_id
  const linkWithoutConvertedStatus = Boolean(inquiry.converted_opportunity_id && inquiry.status !== 'converted')
  const canConvert = inquiry.status !== 'converted' && inquiry.status !== 'archived' && !inquiry.converted_opportunity_id

  return (
    <div className="grid gap-6">
      <AdminPageHeader eyebrow={reasonLabel(inquiry.reason)} title={inquiry.subject} text={inquiryStatusLabels[inquiry.status]} />
      <div className="flex flex-wrap gap-3">
        <Link to={`/admin/consultas/${inquiry.id}/editar`} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Editar</Link>
        {inquiry.status === 'new' && <button type="button" disabled={processing} onClick={() => void updateStatus('read')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]"><Eye size={18} aria-hidden="true" />Marcar como leída</button>}
        {inquiry.status === 'read' && <button type="button" disabled={processing} onClick={() => void updateStatus('replied')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]"><MailCheck size={18} aria-hidden="true" />Marcar como respondida</button>}
        {inquiry.status !== 'archived' && !inquiry.converted_opportunity_id && <button type="button" disabled={processing} onClick={() => void updateStatus('archived', '¿Archivar esta consulta? No se eliminar?.')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]"><Archive size={18} aria-hidden="true" />Archivar</button>}
        {canConvert && <button type="button" disabled={processing} onClick={() => setShowConversion((value) => !value)} className="inline-flex items-center gap-2 rounded-md border border-[#235b3e] px-4 py-3 text-sm font-semibold text-[#235b3e]"><Repeat2 size={18} aria-hidden="true" />Convertir en oportunidad</button>}
      </div>
      <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{status}</div>
      {(convertedWithoutLink || linkWithoutConvertedStatus) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Alerta de integridad: el estado de conversión y el vínculo a oportunidad no coinciden. Requiere revisión administrativa.
        </div>
      )}
      {showConversion && (
        <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6" onSubmit={convert}>
          <h2 className="text-xl font-semibold text-[#17202d]">Convertir en oportunidad</h2>
          <Select label="Tipo" value={conversion.opportunity_type} onChange={(value) => setConversion((current) => ({ ...current, opportunity_type: value as InquiryConversionValues['opportunity_type'] }))} options={Object.entries(opportunityTypeLabels)} />
          <TextLike label="Título" value={conversion.title} onChange={(value) => setConversion((current) => ({ ...current, title: value }))} />
          <label className="grid gap-2 text-sm font-medium text-slate-700">Descripción<textarea value={conversion.description} onChange={(event) => setConversion((current) => ({ ...current, description: event.target.value }))} rows={5} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
          <p className="text-sm text-slate-600">Contacto heredado: {contactName(inquiry.contact)}. Estado inicial: En evaluación. Prioridad: Media. Origen: Consulta.</p>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Notas internas<textarea value={conversion.internal_notes} onChange={(event) => setConversion((current) => ({ ...current, internal_notes: event.target.value }))} rows={3} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowConversion(false)} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
            <button type="submit" disabled={processing} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{processing ? 'Convirtiendo...' : 'Crear oportunidad'}</button>
          </div>
        </form>
      )}

      <DetailSection title="Mensaje">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{inquiry.message}</p>
        <Info label="FECHA DE RECEPCIÓN O CREACIÓN" value={formatDateTime(inquiry.created_at)} />
        <Info label="Medio preferido" value={preferredLabel(inquiry.preferred_contact_method)} />
      </DetailSection>
      <DetailSection title="Contacto">
        {inquiry.contact ? <ContactInfo contact={inquiry.contact} /> : <p className="text-sm text-slate-600">No hay contacto asociado.</p>}
        <Link to="/admin/contactos" className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Ir al contacto</Link>
      </DetailSection>
      <DetailSection title="Gestión">
        <Info label="Estado" value={inquiryStatusLabels[inquiry.status]} />
        <Info label="Responsable" value="Owner actual" />
        <Info label="Notas internas" value={inquiry.internal_notes} />
        <Info label="ÚLTIMA ACTUALIZACIÓN" value={formatDateTime(inquiry.updated_at)} />
      </DetailSection>
      {linkedOpportunity ? (
        <DetailSection title="Oportunidad vinculada">
          <Info label="Código" value={linkedOpportunity.reference_code} />
          <Info label="Título" value={linkedOpportunity.title} />
          <Info label="Tipo" value={opportunityTypeLabels[linkedOpportunity.opportunity_type]} />
          <Info label="Estado" value={opportunityStatusLabels[linkedOpportunity.status]} />
          <Link to={`/admin/oportunidades/${linkedOpportunity.id}`} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Ver oportunidad
          </Link>
        </DetailSection>
      ) : (
        <DetailSection title="Conversión">
          <p className="text-sm text-slate-600">
            {convertedWithoutLink ? 'Consulta marcada como convertida sin vínculo persistente. Requiere revisión administrativa.' : 'Sin oportunidad vinculada.'}
          </p>
        </DetailSection>
      )}
    </div>
  )
}

function QuickContactPanel({ values, saving, onChange, onCreate }: { values: QuickContactForm; saving: boolean; onChange: (values: QuickContactForm) => void; onCreate: () => void }) {
  return (
    <div className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <Select label="Tipo" value={values.contact_type} onChange={(value) => onChange({ ...values, contact_type: value as ContactType })} options={[['person', 'Persona'], ['company', 'Empresa']]} />
      <TextLike label="Nombre completo" value={values.full_name} onChange={(value) => onChange({ ...values, full_name: value })} />
      <TextLike label="Empresa" value={values.company_name} onChange={(value) => onChange({ ...values, company_name: value })} />
      <TextLike label="Correo electrónico" value={values.email} onChange={(value) => onChange({ ...values, email: value })} />
      <TextLike label="Teléfono" value={values.phone} onChange={(value) => onChange({ ...values, phone: value })} />
      <div className="flex items-end"><button type="button" disabled={saving} onClick={onCreate} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Creando...' : 'Crear y seleccionar'}</button></div>
    </div>
  )
}

function TextField({ id, label, value, error, onChange }: { id: keyof InquiryFormValues; label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20" />{error && <span className="text-sm text-red-700">{error}</span>}</label>
}

function TextLike({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
}

function TextArea({ id, label, value, error, onChange }: { id: keyof InquiryFormValues; label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>{label}<textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={5} aria-invalid={Boolean(error)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />{error && <span className="text-sm text-red-700">{error}</span>}</label>
}

function Select({ label, value, options, error, disabled = false, onChange }: { label: string; value: string; options: [string, string][]; error?: string; disabled?: boolean; onChange: (value: string) => void }) {
  return <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">{label}<select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-3 text-base disabled:bg-slate-100 disabled:text-slate-600">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select>{error && <span className="text-sm text-red-700">{error}</span>}</label>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-[#17202d]">{title}</h2>{children}</section>
}

function ContactInfo({ contact }: { contact: ContactRecord }) {
  return (
    <>
      <Info label="Nombre" value={contactName(contact)} />
      <Info label="Empresa" value={contact.company_name} />
      <Info label="Correo" value={contact.email} />
      <Info label="Teléfono" value={contact.phone} />
      <Info label="UBICACIÓN" value={[contact.city, contact.region, contact.country].filter(Boolean).join(', ')} />
    </>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === '\u2014') return null
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-700">{value}</dd></div>
}

function ErrorState({ title, error, onRetry, href }: { title: string; error: string; onRetry?: () => void; href?: string }) {
  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">{title}</h2>
      <p className="mt-2 text-sm text-slate-700">{error}</p>
      {onRetry && <button type="button" onClick={() => void onRetry()} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Reintentar</button>}
      {href && <Link to={href} className="mt-4 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Volver al listado</Link>}
    </section>
  )
}
