import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type {
  ContactSelectorRecord,
  ContactType,
  OpportunityFormValues,
  OpportunityRecord,
  OpportunityStatus,
} from '../../types/admin'
import { useAdminAuth } from '../useAdminAuth'
import {
  contactName,
  opportunityStatusLabels,
  opportunityStatuses,
  priorities,
  priorityLabels,
} from '../opportunity-labels'

const emptyOpportunityForm: OpportunityFormValues = {
  opportunity_type: 'buy',
  title: '',
  description: '',
  contact_id: '',
  status: 'new',
  priority: 'medium',
  source: '',
  assigned_to: '',
  expected_date: '',
  country: '',
  region: '',
  city: '',
  estimated_value: '',
  currency: '',
  internal_notes: '',
  rejection_reason: '',
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

function opportunityToForm(opportunity: OpportunityRecord): OpportunityFormValues {
  return {
    opportunity_type: opportunity.opportunity_type,
    title: opportunity.title ?? '',
    description: opportunity.description ?? '',
    contact_id: opportunity.contact_id ?? '',
    status: opportunity.status,
    priority: opportunity.priority,
    source: opportunity.source ?? '',
    assigned_to: opportunity.assigned_to ?? '',
    expected_date: opportunity.expected_date ?? '',
    country: opportunity.country ?? '',
    region: opportunity.region ?? '',
    city: opportunity.city ?? '',
    estimated_value: opportunity.estimated_value === null ? '' : String(opportunity.estimated_value),
    currency: opportunity.currency ?? '',
    internal_notes: opportunity.internal_notes ?? '',
    rejection_reason: opportunity.rejection_reason ?? '',
  }
}

function validateOpportunity(values: OpportunityFormValues) {
  const errors: Partial<Record<keyof OpportunityFormValues, string>> = {}
  if (!values.opportunity_type) errors.opportunity_type = 'Selecciona el tipo.'
  if (!values.title.trim()) errors.title = 'Ingresa un título.'
  if (!values.contact_id) errors.contact_id = 'Selecciona un contacto principal.'
  if (!values.status) errors.status = 'Selecciona un estado.'
  if (!values.priority) errors.priority = 'Selecciona una prioridad.'
  if (values.estimated_value.trim()) {
    const amount = Number(values.estimated_value)
    if (!Number.isFinite(amount) || amount < 0) errors.estimated_value = 'El valor debe ser cero o mayor.'
    if (!values.currency.trim()) errors.currency = 'Selecciona una moneda.'
  }
  if (values.status === 'rejected' && !values.rejection_reason.trim()) {
    errors.rejection_reason = 'Ingresa el motivo de rechazo.'
  }
  return errors
}

function toPayload(values: OpportunityFormValues, fallbackAssignedTo: string | null) {
  const estimatedValue = values.estimated_value.trim() ? Number(values.estimated_value) : null
  return {
    opportunity_type: values.opportunity_type,
    title: values.title.trim(),
    description: nullable(values.description),
    contact_id: values.contact_id,
    status: values.status,
    priority: values.priority,
    source: nullable(values.source),
    estimated_value: estimatedValue,
    currency: estimatedValue === null ? null : nullable(values.currency),
    expected_date: nullable(values.expected_date),
    country: nullable(values.country),
    region: nullable(values.region),
    city: nullable(values.city),
    internal_notes: nullable(values.internal_notes),
    rejection_reason: values.status === 'rejected' ? nullable(values.rejection_reason) : null,
    assigned_to: nullable(values.assigned_to) ?? fallbackAssignedTo,
  }
}

function TextField({
  id,
  label,
  value,
  error,
  type = 'text',
  onChange,
}: {
  id: keyof OpportunityFormValues
  label: string
  value: string
  error?: string
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
      />
      {error && <span className="text-sm text-red-700">{error}</span>}
    </label>
  )
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
}: {
  id: keyof OpportunityFormValues
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
      />
    </label>
  )
}

export function AdminOpportunityFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const auth = useAdminAuth()
  const [values, setValues] = useState<OpportunityFormValues>(emptyOpportunityForm)
  const [initialValues, setInitialValues] = useState<OpportunityFormValues>(emptyOpportunityForm)
  const [originalStatus, setOriginalStatus] = useState<OpportunityStatus | null>(null)
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof OpportunityFormValues, string>>>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showQuickContact, setShowQuickContact] = useState(false)
  const [quickContact, setQuickContact] = useState<QuickContactForm>(emptyQuickContact)
  const [quickContactStatus, setQuickContactStatus] = useState('')
  const [creatingContact, setCreatingContact] = useState(false)
  const initializedRef = useRef(false)

  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  useEffect(() => {
    async function load() {
      setLoadError('')
      const contactsResult = await adminRepository.listContactsForSelector()
      if (contactsResult.error) {
        setLoadError(contactsResult.error)
        setLoading(false)
        return
      }
      setContacts(contactsResult.data)
      const settingsResult = mode === 'create' ? await adminRepository.getOrganizationSettings() : { data: null, error: null }

      if (mode === 'create') {
        const next = {
          ...emptyOpportunityForm,
          priority: settingsResult.data?.default_opportunity_priority ?? emptyOpportunityForm.priority,
          currency: settingsResult.data?.default_currency ?? emptyOpportunityForm.currency,
          assigned_to: auth.user?.id ?? '',
        }
        setValues(next)
        setInitialValues(next)
        initializedRef.current = true
        setLoading(false)
        return
      }

      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        setLoadError('El identificador de oportunidad no es válido.')
        setLoading(false)
        return
      }

      const result = await adminRepository.getOpportunityById(id)
      if (result.error) {
        setLoadError(result.error)
        setLoading(false)
        return
      }
      if (!result.data) {
        setLoadError('La oportunidad no existe o no está autorizada para tu usuario.')
        setLoading(false)
        return
      }
      const next = opportunityToForm(result.data)
      setValues(next)
      setInitialValues(next)
      setOriginalStatus(result.data.status)
      initializedRef.current = true
      setLoading(false)
    }

    void load()
  }, [auth.user?.id, id, mode])

  const filteredContacts = useMemo(() => {
    const normalized = contactQuery.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) =>
      [contact.full_name, contact.company_name, contact.email, contact.phone].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)),
    )
  }, [contactQuery, contacts])

  function setField<K extends keyof OpportunityFormValues>(field: K, value: OpportunityFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function requestCancel() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) return
    navigate(mode === 'edit' && id ? `/admin/oportunidades/${id}` : '/admin/oportunidades')
  }

  async function createQuickContact() {
    if (creatingContact) return
    setQuickContactStatus('')
    const needsName = quickContact.contact_type === 'person' && !quickContact.full_name.trim()
    const needsCompany = quickContact.contact_type === 'company' && !quickContact.company_name.trim()
    if (needsName || needsCompany) {
      setQuickContactStatus('Completa el nombre requerido del contacto.')
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
      setQuickContactStatus(result.error ?? 'No fue posible crear el contacto.')
      return
    }

    const selectorContact: ContactSelectorRecord = {
      id: result.data.id,
      contact_type: result.data.contact_type,
      full_name: result.data.full_name,
      company_name: result.data.company_name,
      email: result.data.email,
      phone: result.data.phone,
      city: result.data.city,
      country: result.data.country,
    }
    setContacts((current) => [selectorContact, ...current])
    setField('contact_id', result.data.id)
    setQuickContact(emptyQuickContact)
    setShowQuickContact(false)
    setQuickContactStatus('Contacto creado y seleccionado.')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !initializedRef.current) return

    const nextErrors = validateOpportunity(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Revisa los campos marcados.')
      return
    }

    setSaving(true)
    setStatusMessage('')
    const payload = toPayload(values, auth.user?.id ?? null)
    const result =
      mode === 'create' ? await adminRepository.createOpportunity(payload) : await adminRepository.updateOpportunity(id!, payload)

    if (result.error || !result.data) {
      setSaving(false)
      setStatusMessage(result.error ?? 'No fue posible guardar la oportunidad.')
      return
    }

    if (mode === 'edit' && originalStatus && originalStatus !== values.status) {
      const activity = await adminRepository.createOpportunityActivity({
        opportunity_id: result.data.id,
        activity_type: 'status_change',
        title: 'Cambio de estado',
        description: `Estado anterior: ${opportunityStatusLabels[originalStatus]}. Nuevo estado: ${opportunityStatusLabels[values.status]}.`,
        occurred_at: new Date().toISOString(),
        next_action_at: null,
      })
      if (activity.error) {
        setSaving(false)
        setInitialValues(opportunityToForm(result.data))
        setOriginalStatus(result.data.status)
        setStatusMessage('El estado cambió, pero el historial no pudo registrarse.')
        return
      }
    }

    setSaving(false)
    navigate(`/admin/oportunidades/${result.data.id}`, { state: { savedReference: result.data.reference_code } })
  }

  if (mode === 'edit' && !id) return <Navigate to="/admin/oportunidades" replace />

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando oportunidad...</div>
  }

  if (loadError) {
    return (
      <div className="grid gap-6">
        <AdminPageHeader title={mode === 'create' ? 'Nueva oportunidad' : 'Editar oportunidad'} />
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-xl font-semibold text-[#17202d]">No fue posible abrir la oportunidad</h1>
          <p className="mt-2 text-sm text-slate-700">{loadError}</p>
          <Link to="/admin/oportunidades" className="mt-4 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Volver al listado
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={mode === 'create' ? 'Nueva oportunidad' : 'Editar oportunidad'}
        text="Registra necesidades de compra u ofertas de venta sin duplicar datos completos del contacto."
      />

      <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Identificación</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="opportunity_type">
              Tipo de oportunidad *
              <select id="opportunity_type" value={values.opportunity_type} onChange={(event) => setField('opportunity_type', event.target.value as OpportunityFormValues['opportunity_type'])} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                <option value="buy">Necesidad de compra</option>
                <option value="sell">Oferta de venta</option>
              </select>
              {errors.opportunity_type && <span className="text-sm text-red-700">{errors.opportunity_type}</span>}
            </label>
            <TextField id="title" label="Título *" value={values.title} error={errors.title} onChange={(value) => setField('title', value)} />
          </div>
          <div className="mt-4">
            <TextAreaField id="description" label="Descripción" value={values.description} onChange={(value) => setField('description', value)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact-search">
              Buscar contacto
              <input id="contact-search" value={contactQuery} onChange={(event) => setContactQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact_id">
              Contacto principal *
              <select id="contact_id" value={values.contact_id} onChange={(event) => setField('contact_id', event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                <option value="">Seleccionar contacto</option>
                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contactName(contact)}{contact.company_name ? ` · ${contact.company_name}` : ''}
                  </option>
                ))}
              </select>
              {errors.contact_id && <span className="text-sm text-red-700">{errors.contact_id}</span>}
            </label>
          </div>
          <button type="button" onClick={() => setShowQuickContact((value) => !value)} className="mt-4 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">
            Crear nuevo contacto
          </button>
          {showQuickContact && (
            <div className="mt-4 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Tipo
                <select value={quickContact.contact_type} onChange={(event) => setQuickContact((current) => ({ ...current, contact_type: event.target.value as ContactType }))} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                  <option value="person">Persona</option>
                  <option value="company">Empresa</option>
                </select>
              </label>
              <TextLike label="Nombre completo" value={quickContact.full_name} onChange={(value) => setQuickContact((current) => ({ ...current, full_name: value }))} />
              <TextLike label="Empresa" value={quickContact.company_name} onChange={(value) => setQuickContact((current) => ({ ...current, company_name: value }))} />
              <TextLike label="Correo electrónico" value={quickContact.email} onChange={(value) => setQuickContact((current) => ({ ...current, email: value }))} />
              <TextLike label="Teléfono" value={quickContact.phone} onChange={(value) => setQuickContact((current) => ({ ...current, phone: value }))} />
              <div className="flex items-end gap-3">
                <button type="button" disabled={creatingContact} onClick={() => void createQuickContact()} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                  {creatingContact ? 'Creando...' : 'Crear y seleccionar'}
                </button>
              </div>
              {quickContactStatus && <p className="md:col-span-2 text-sm text-slate-700" aria-live="polite">{quickContactStatus}</p>}
            </div>
          )}
          <div className="mt-4">
            <TextField id="source" label="Origen" value={values.source} onChange={(value) => setField('source', value)} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Gestión</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Estado *
              <select value={values.status} onChange={(event) => setField('status', event.target.value as OpportunityStatus)} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                {opportunityStatuses.map((status) => <option key={status} value={status}>{opportunityStatusLabels[status]}</option>)}
              </select>
              {errors.status && <span className="text-sm text-red-700">{errors.status}</span>}
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Prioridad *
              <select value={values.priority} onChange={(event) => setField('priority', event.target.value as OpportunityFormValues['priority'])} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
              </select>
              {errors.priority && <span className="text-sm text-red-700">{errors.priority}</span>}
            </label>
            <TextField id="expected_date" label="Fecha esperada" type="date" value={values.expected_date} onChange={(value) => setField('expected_date', value)} />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Responsable: {auth.profile?.full_name || auth.user?.email || 'Administrador actual'}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Ubicación y valor</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <TextField id="country" label="País" value={values.country} onChange={(value) => setField('country', value)} />
            <TextField id="region" label="Región" value={values.region} onChange={(value) => setField('region', value)} />
            <TextField id="city" label="Ciudad" value={values.city} onChange={(value) => setField('city', value)} />
            <TextField id="estimated_value" label="Valor estimado" type="number" value={values.estimated_value} error={errors.estimated_value} onChange={(value) => setField('estimated_value', value)} />
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Moneda
              <select value={values.currency} onChange={(event) => setField('currency', event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                <option value="">Seleccionar</option>
                <option value="CLP">CLP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="Otra">Otra</option>
              </select>
              {errors.currency && <span className="text-sm text-red-700">{errors.currency}</span>}
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Notas</h2>
          <div className="mt-5 grid gap-4">
            <TextAreaField id="internal_notes" label="Notas internas" value={values.internal_notes} onChange={(value) => setField('internal_notes', value)} />
            {values.status === 'rejected' && (
              <TextField id="rejection_reason" label="Motivo de rechazo *" value={values.rejection_reason} error={errors.rejection_reason} onChange={(value) => setField('rejection_reason', value)} />
            )}
          </div>
        </section>

        <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{statusMessage}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={requestCancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar oportunidad'}
          </button>
        </div>
      </form>
    </div>
  )
}

function TextLike({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
    </label>
  )
}
