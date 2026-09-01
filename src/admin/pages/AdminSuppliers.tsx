import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Archive, LinkIcon, Pencil, Plus, X } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { adminRepository } from '../../repositories'
import type {
  ContactRecord,
  ContactSelectorRecord,
  ContactType,
  OpportunityRecord,
  OpportunitySupplierFormValues,
  OpportunitySupplierStatus,
  SupplierFormValues,
  SupplierOpportunityRecord,
  SupplierRecord,
  SupplierStatus,
  SupplierWithContact,
} from '../../types/admin'
import {
  contactName,
  formatDateTime,
  formatMoney,
  opportunitySupplierStatusLabels,
  opportunitySupplierStatuses,
  supplierStatusLabels,
  supplierStatuses,
} from '../opportunity-labels'

const emptySupplierForm: SupplierFormValues = {
  contact_id: '',
  business_name: '',
  legal_name: '',
  tax_id: '',
  description: '',
  categories: [],
  categoryInput: '',
  geographic_coverage: '',
  supply_capacity: '',
  minimum_order: '',
  minimum_order_currency: '',
  issues_invoice: 'unknown',
  commercial_terms: '',
  status: 'pending',
  internal_notes: '',
}

const emptyRelationForm: OpportunitySupplierFormValues = {
  status: 'identified',
  proposed_amount: '',
  currency: '',
  notes: '',
}

type QuickContactForm = {
  contact_type: ContactType
  full_name: string
  company_name: string
  email: string
  phone: string
}

const emptyQuickContact: QuickContactForm = {
  contact_type: 'company',
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
}

function nullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function supplierToForm(supplier: SupplierRecord): SupplierFormValues {
  return {
    contact_id: supplier.contact_id ?? '',
    business_name: supplier.business_name ?? '',
    legal_name: supplier.legal_name ?? '',
    tax_id: supplier.tax_id ?? '',
    description: supplier.description ?? '',
    categories: supplier.categories ?? [],
    categoryInput: '',
    geographic_coverage: supplier.geographic_coverage ?? '',
    supply_capacity: supplier.supply_capacity ?? '',
    minimum_order: supplier.minimum_order === null ? '' : String(supplier.minimum_order),
    minimum_order_currency: supplier.minimum_order_currency ?? '',
    issues_invoice: supplier.issues_invoice === null ? 'unknown' : supplier.issues_invoice ? 'yes' : 'no',
    commercial_terms: supplier.commercial_terms ?? '',
    status: supplier.status,
    internal_notes: supplier.internal_notes ?? '',
  }
}

function validateSupplier(values: SupplierFormValues) {
  const errors: Partial<Record<keyof SupplierFormValues, string>> = {}
  if (!values.contact_id) errors.contact_id = 'Selecciona un contacto asociado.'
  if (!values.business_name.trim()) errors.business_name = 'Ingresa el nombre comercial.'
  if (values.categories.length === 0) errors.categories = 'Agrega al menos una categoría.'
  if (!values.status) errors.status = 'Selecciona un estado.'
  if (values.minimum_order.trim()) {
    const amount = Number(values.minimum_order)
    if (!Number.isFinite(amount) || amount < 0) errors.minimum_order = 'El pedido mínimo debe ser cero o mayor.'
    if (!values.minimum_order_currency.trim()) errors.minimum_order_currency = 'Selecciona una moneda.'
  }
  return errors
}

function supplierPayload(values: SupplierFormValues) {
  const minimumOrder = values.minimum_order.trim() ? Number(values.minimum_order) : null
  return {
    contact_id: values.contact_id,
    business_name: values.business_name.trim(),
    legal_name: nullable(values.legal_name),
    tax_id: nullable(values.tax_id),
    description: nullable(values.description),
    categories: values.categories,
    geographic_coverage: nullable(values.geographic_coverage),
    supply_capacity: nullable(values.supply_capacity),
    minimum_order: minimumOrder,
    minimum_order_currency: minimumOrder === null ? null : nullable(values.minimum_order_currency),
    issues_invoice: values.issues_invoice === 'unknown' ? null : values.issues_invoice === 'yes',
    commercial_terms: nullable(values.commercial_terms),
    status: values.status,
    internal_notes: nullable(values.internal_notes),
  }
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function invoiceLabel(value: boolean | null) {
  if (value === null) return 'Sin información'
  return value ? 'Sí' : 'No'
}

export function AdminSuppliers() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<SupplierWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<SupplierStatus | 'all'>((searchParams.get('status') as SupplierStatus) || 'all')
  const [category, setCategory] = useState('all')
  const [invoice, setInvoice] = useState<'all' | 'yes' | 'no' | 'unknown'>('all')
  const [coverage, setCoverage] = useState('all')
  const [linked, setLinked] = useState<'all' | 'with' | 'without'>('all')
  const [detailId, setDetailId] = useState<string | null>(null)
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null)

  async function load() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listSuppliers()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuppliers(result.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const categories = useMemo(() => Array.from(new Set(suppliers.flatMap((supplier) => supplier.categories))).sort(), [suppliers])
  const coverages = useMemo(
    () => Array.from(new Set(suppliers.map((supplier) => supplier.geographic_coverage).filter(Boolean) as string[])).sort(),
    [suppliers],
  )
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      if (status !== 'all' && supplier.status !== status) return false
      if (category !== 'all' && !supplier.categories.includes(category)) return false
      if (invoice !== 'all') {
        if (invoice === 'yes' && supplier.issues_invoice !== true) return false
        if (invoice === 'no' && supplier.issues_invoice !== false) return false
        if (invoice === 'unknown' && supplier.issues_invoice !== null) return false
      }
      if (coverage !== 'all' && supplier.geographic_coverage !== coverage) return false
      if (linked === 'with' && supplier.opportunityCount === 0) return false
      if (linked === 'without' && supplier.opportunityCount > 0) return false
      if (!normalized) return true
      return [
        supplier.business_name,
        supplier.legal_name,
        contactName(supplier.contact),
        supplier.contact?.email,
        supplier.contact?.city,
        supplier.contact?.country,
        supplier.geographic_coverage,
        ...supplier.categories,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized))
    })
  }, [category, coverage, invoice, linked, query, status, suppliers])

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <AdminPageHeader
        title="Proveedores"
        text="Empresas y personas evaluadas para responder a necesidades de compra y oportunidades comerciales."
        actionLabel="Nuevo proveedor"
        onAction={() => navigate('/admin/proveedores/nuevo')}
      />
      <section className="grid min-w-0 max-w-full gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Buscar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, contacto, correo, categoría o ubicación" className="rounded-md border border-slate-300 px-3 py-3 text-base" />
        </label>
        <div className="grid gap-3 md:grid-cols-5">
          <Select label="Estado" value={status} onChange={(value) => setStatus(value as SupplierStatus | 'all')} options={[['all', 'Todos'], ...supplierStatuses.map((item) => [item, supplierStatusLabels[item]] as [string, string])]} />
          <Select label="Categoría" value={category} onChange={setCategory} options={[['all', 'Todas'], ...categories.map((item) => [item, item] as [string, string])]} />
          <Select label="Emite factura" value={invoice} onChange={(value) => setInvoice(value as typeof invoice)} options={[['all', 'Todas'], ['yes', 'Sí'], ['no', 'No'], ['unknown', 'Sin información']]} />
          <Select label="Cobertura" value={coverage} onChange={setCoverage} options={[['all', 'Todas'], ...coverages.map((item) => [item, item] as [string, string])]} />
          <Select label="Oportunidades" value={linked} onChange={(value) => setLinked(value as typeof linked)} options={[['all', 'Todas'], ['with', 'Con oportunidades'], ['without', 'Sin oportunidades']]} />
        </div>
      </section>

      {loading && <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />}
      {!loading && error && <ErrorState title="No fue posible cargar proveedores" error={error} onRetry={load} />}
      {!loading && !error && suppliers.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-semibold text-[#17202d]">Aún no hay proveedores</h2>
          <p className="mt-2 text-sm text-slate-600">Crea el primer proveedor asociado a un contacto existente.</p>
          <Link to="/admin/proveedores/nuevo" className="mt-5 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Nuevo proveedor</Link>
        </section>
      )}
      {!loading && !error && suppliers.length > 0 && visible.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No hay proveedores que coincidan con los filtros.</section>
      )}
      {!loading && !error && visible.length > 0 && <SupplierList suppliers={visible} onView={(supplier, trigger) => { detailTriggerRef.current = trigger; setDetailId(supplier.id) }} />}
      {detailId && <AdminDetailModal title="Detalle de proveedor" size="large" onClose={() => setDetailId(null)} returnFocusRef={detailTriggerRef}><AdminSupplierDetail detailId={detailId} embedded /></AdminDetailModal>}
    </div>
  )
}

function SupplierList({ suppliers, onView }: { suppliers: SupplierWithContact[]; onView: (supplier: SupplierWithContact, trigger: HTMLButtonElement) => void }) {
  return (
      <section className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-white">
      <div className="hidden w-full min-w-0 max-w-full overflow-x-auto lg:block">
        <table className="min-w-[1080px] w-full table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {['Proveedor', 'Contacto', 'Categorías', 'Cobertura', 'Emite factura', 'Estado', 'Oportunidades', 'Última actualización', 'Acción'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-3 py-4 font-semibold text-[#17202d]">{supplier.business_name}</td>
                <td className="px-3 py-4">{contactName(supplier.contact)}</td>
                <td className="px-3 py-4">{supplier.categories.join(', ')}</td>
                <td className="px-3 py-4">{supplier.geographic_coverage || '—'}</td>
                <td className="px-3 py-4">{invoiceLabel(supplier.issues_invoice)}</td>
                <td className="px-3 py-4">{supplierStatusLabels[supplier.status]}</td>
                <td className="px-3 py-4">{supplier.opportunityCount}</td>
                <td className="px-3 py-4">{formatDateTime(supplier.updated_at)}</td>
                <td className="px-3 py-4"><button type="button" onClick={(event) => onView(supplier, event.currentTarget)} className="font-semibold text-[#235b3e]">Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {suppliers.map((supplier) => (
          <article key={supplier.id} className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold text-[#17202d]">{supplier.business_name}</h2>
            <p className="mt-2 text-sm text-slate-700">{contactName(supplier.contact)}</p>
            <p className="mt-2 text-sm text-slate-600">{supplier.categories.join(', ') || 'Sin categorías'}</p>
            <p className="mt-2 text-sm text-slate-600">{supplierStatusLabels[supplier.status]} · {invoiceLabel(supplier.issues_invoice)}</p>
            <button type="button" onClick={(event) => onView(supplier, event.currentTarget)} className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver</button>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AdminSupplierFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState<SupplierFormValues>(emptySupplierForm)
  const [initialValues, setInitialValues] = useState<SupplierFormValues>(emptySupplierForm)
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormValues, string>>>({})
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showQuickContact, setShowQuickContact] = useState(false)
  const [quickContact, setQuickContact] = useState<QuickContactForm>(emptyQuickContact)
  const [creatingContact, setCreatingContact] = useState(false)
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
      const contactsResult = await adminRepository.listContactsForSelector()
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
        setLoadError('El identificador de proveedor no es válido.')
        setLoading(false)
        return
      }
      const supplierResult = await adminRepository.getSupplierById(id!)
      if (supplierResult.error) {
        setLoadError(supplierResult.error)
        setLoading(false)
        return
      }
      if (!supplierResult.data) {
        setLoadError('El proveedor no existe o no está autorizado para tu usuario.')
        setLoading(false)
        return
      }
      const next = supplierToForm(supplierResult.data)
      setValues(next)
      setInitialValues(next)
      setLoading(false)
    }
    void load()
  }, [id, mode])

  const filteredContacts = useMemo(() => {
    const normalized = contactQuery.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) => [contact.full_name, contact.company_name, contact.email, contact.phone].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)))
  }, [contactQuery, contacts])

  function setField<K extends keyof SupplierFormValues>(field: K, value: SupplierFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function addCategory() {
    const next = values.categoryInput.trim()
    if (!next) return
    if (values.categories.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setStatusMessage('La categoría ya existe.')
      return
    }
    setValues((current) => ({ ...current, categories: [...current.categories, next], categoryInput: '' }))
    setStatusMessage('')
  }

  function removeCategory(category: string) {
    setValues((current) => ({ ...current, categories: current.categories.filter((item) => item !== category) }))
  }

  function requestCancel() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) return
    navigate(mode === 'edit' && id ? `/admin/proveedores/${id}` : '/admin/proveedores')
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
    const nextErrors = validateSupplier(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('Revisa los campos marcados.')
      return
    }
    setSaving(true)
    setStatusMessage('')
    const payload = supplierPayload(values)
    const result = mode === 'create' ? await adminRepository.createSupplier(payload) : await adminRepository.updateSupplier(id!, payload)
    setSaving(false)
    if (result.error || !result.data) {
      setStatusMessage(result.error ?? 'No fue posible guardar el proveedor.')
      return
    }
    navigate(`/admin/proveedores/${result.data.id}`, { state: { saved: true } })
  }

  if (mode === 'edit' && !id) return <Navigate to="/admin/proveedores" replace />
  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando proveedor...</div>
  if (loadError) return <ErrorState title="No fue posible abrir el proveedor" error={loadError} href="/admin/proveedores" />

  return (
    <div className="grid gap-6">
      <AdminPageHeader title={mode === 'create' ? 'Nuevo proveedor' : 'Editar proveedor'} text="Registra datos comerciales del proveedor sin duplicar los datos de comunicación del contacto." />
      <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Identificación</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact-search">Buscar contacto<input id="contact-search" value={contactQuery} onChange={(event) => setContactQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
            <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contact_id">Contacto asociado *<select id="contact_id" value={values.contact_id} onChange={(event) => setField('contact_id', event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base"><option value="">Seleccionar contacto</option>{filteredContacts.map((contact) => <option key={contact.id} value={contact.id}>{contactName(contact)}{contact.company_name ? ` · ${contact.company_name}` : ''}</option>)}</select>{errors.contact_id && <span className="text-sm text-red-700">{errors.contact_id}</span>}</label>
          </div>
          <button type="button" onClick={() => setShowQuickContact((value) => !value)} className="mt-4 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Crear nuevo contacto</button>
          {showQuickContact && <QuickContactPanel values={quickContact} saving={creatingContact} onChange={setQuickContact} onCreate={() => void createQuickContact()} />}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField id="business_name" label="Nombre comercial *" value={values.business_name} error={errors.business_name} onChange={(value) => setField('business_name', value)} />
            <TextField id="legal_name" label="Razón social" value={values.legal_name} onChange={(value) => setField('legal_name', value)} />
            <TextField id="tax_id" label="RUT o identificación tributaria" value={values.tax_id} onChange={(value) => setField('tax_id', value)} />
          </div>
          <TextArea id="description" label="Descripción" value={values.description} onChange={(value) => setField('description', value)} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Oferta</h2>
          <CategoryEditor values={values.categories} input={values.categoryInput} error={errors.categories} onInput={(value) => setField('categoryInput', value)} onAdd={addCategory} onRemove={removeCategory} />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextField id="geographic_coverage" label="Cobertura geográfica" value={values.geographic_coverage} onChange={(value) => setField('geographic_coverage', value)} />
            <TextField id="supply_capacity" label="Capacidad de suministro o atención" value={values.supply_capacity} onChange={(value) => setField('supply_capacity', value)} />
            <TextField id="minimum_order" label="Pedido o contratación mínima" type="number" value={values.minimum_order} error={errors.minimum_order} onChange={(value) => setField('minimum_order', value)} />
            <CurrencySelect value={values.minimum_order_currency} error={errors.minimum_order_currency} onChange={(value) => setField('minimum_order_currency', value)} />
            <Select label="¿Emite factura?" value={values.issues_invoice} onChange={(value) => setField('issues_invoice', value as SupplierFormValues['issues_invoice'])} options={[['unknown', 'Sin información'], ['yes', 'Sí'], ['no', 'No']]} />
          </div>
          <TextArea id="commercial_terms" label="Condiciones comerciales" value={values.commercial_terms} onChange={(value) => setField('commercial_terms', value)} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-[#17202d]">Gestión interna</h2>
          <Select label="Estado *" value={values.status} onChange={(value) => setField('status', value as SupplierStatus)} options={supplierStatuses.map((item) => [item, supplierStatusLabels[item]] as [string, string])} />
          <TextArea id="internal_notes" label="Notas internas" value={values.internal_notes} onChange={(value) => setField('internal_notes', value)} />
        </section>

        <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{statusMessage}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={requestCancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar proveedor'}</button>
        </div>
      </form>
    </div>
  )
}

export function AdminSupplierDetail({ detailId, embedded = false }: { detailId?: string; embedded?: boolean } = {}) {
  const routeParams = useParams()
  const id = detailId ?? routeParams.id
  const [supplier, setSupplier] = useState<SupplierWithContact | null>(null)
  const [relations, setRelations] = useState<SupplierOpportunityRecord[]>([])
  const [available, setAvailable] = useState<OpportunityRecord[]>([])
  const [query, setQuery] = useState('')
  const [selectedOpportunity, setSelectedOpportunity] = useState('')
  const [editing, setEditing] = useState<SupplierOpportunityRecord | null>(null)
  const [relationForm, setRelationForm] = useState<OpportunitySupplierFormValues>(emptyRelationForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    if (!isUuid(id)) {
      setError('El identificador de proveedor no es válido.')
      setLoading(false)
      return
    }
    const [supplierResult, relationsResult, availableResult] = await Promise.all([
      adminRepository.getSupplierById(id!),
      adminRepository.listSupplierOpportunities(id!),
      adminRepository.listAvailableBuyOpportunities(id!),
    ])
    setLoading(false)
    if (supplierResult.error) {
      setError(supplierResult.error)
      return
    }
    if (!supplierResult.data) {
      setError('El proveedor no existe o no está autorizado para tu usuario.')
      return
    }
    setSupplier(supplierResult.data)
    if (!relationsResult.error) setRelations(relationsResult.data)
    if (!availableResult.error) setAvailable(availableResult.data)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const filteredAvailable = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return available
    return available.filter((opportunity) => [opportunity.reference_code, opportunity.title].some((value) => value.toLowerCase().includes(normalized)))
  }, [available, query])

  async function archive() {
    if (!supplier || processing) return
    if (!window.confirm('¿Archivar este proveedor? No se eliminará el registro ni sus relaciones.')) return
    setProcessing(true)
    const result = await adminRepository.updateSupplier(supplier.id, { status: 'archived' })
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible archivar el proveedor.')
      return
    }
    setSupplier((current) => (current ? { ...current, status: result.data!.status, updated_at: result.data!.updated_at } : current))
    setStatus('Proveedor archivado.')
  }

  async function linkOpportunity() {
    if (!supplier || !selectedOpportunity || processing) return
    setProcessing(true)
    const result = await adminRepository.linkSupplierToOpportunity({ supplier_id: supplier.id, opportunity_id: selectedOpportunity, notes: null, proposed_amount: null, currency: null })
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible vincular la oportunidad.')
      return
    }
    setStatus('Proveedor vinculado a la oportunidad.')
    setSelectedOpportunity('')
    await load()
  }

  function startEdit(relation: SupplierOpportunityRecord) {
    setEditing(relation)
    setRelationForm({
      status: relation.status,
      proposed_amount: relation.proposed_amount === null ? '' : String(relation.proposed_amount),
      currency: relation.currency ?? '',
      notes: relation.notes ?? '',
    })
  }

  async function saveRelation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || processing) return
    if (relationForm.proposed_amount.trim()) {
      const amount = Number(relationForm.proposed_amount)
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus('El monto propuesto debe ser cero o mayor.')
        return
      }
      if (!relationForm.currency.trim()) {
        setStatus('Selecciona moneda para el monto propuesto.')
        return
      }
    }
    if (editing.status === 'discarded' && relationForm.status !== 'discarded' && !window.confirm('¿Cambiar este proveedor desde descartado a otro estado?')) return
    setProcessing(true)
    const result = await adminRepository.updateOpportunitySupplier(editing.id, relationForm)
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible actualizar la relación.')
      return
    }
    setRelations((current) => current.map((item) => (item.id === result.data!.id ? { ...item, ...result.data! } : item)))
    setEditing(null)
    setStatus('Relación actualizada.')
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando proveedor...</div>
  if (error || !supplier) return <ErrorState title="Proveedor no disponible" error={error || 'No fue posible cargar el proveedor.'} href="/admin/proveedores" />

  return (
    <div className="grid gap-6">
      {!embedded && <AdminPageHeader eyebrow={supplier.categories.join(', ')} title={supplier.business_name} text={supplierStatusLabels[supplier.status]} />}
      <div className="flex flex-wrap gap-3">
        <Link to={`/admin/proveedores/${supplier.id}/editar`} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white"><Pencil size={18} aria-hidden="true" />Editar</Link>
        {supplier.status !== 'archived' && <button type="button" disabled={processing} onClick={() => void archive()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d] disabled:opacity-60"><Archive size={18} aria-hidden="true" />Archivar</button>}
      </div>
      <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{status}</div>

      <DetailSection title="Información comercial">
        <Info label="Nombre comercial" value={supplier.business_name} />
        <Info label="Razón social" value={supplier.legal_name} />
        <Info label="Descripción" value={supplier.description} />
        <Info label="Identificación tributaria interna" value={supplier.tax_id} />
        <Info label="Estado" value={supplierStatusLabels[supplier.status]} />
      </DetailSection>
      <DetailSection title="Contacto">
        {supplier.contact ? <ContactInfo contact={supplier.contact} /> : <p className="text-sm text-slate-600">No se pudo resolver el contacto vinculado.</p>}
        <Link to="/admin/contactos" className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Editar contacto</Link>
      </DetailSection>
      <DetailSection title="Capacidad y condiciones">
        <Info label="Categorías" value={supplier.categories.join(', ')} />
        <Info label="Cobertura" value={supplier.geographic_coverage} />
        <Info label="Capacidad" value={supplier.supply_capacity} />
        <Info label="Pedido mínimo" value={formatMoney(supplier.minimum_order, supplier.minimum_order_currency)} />
        <Info label="Emite factura" value={invoiceLabel(supplier.issues_invoice)} />
        <Info label="Condiciones comerciales" value={supplier.commercial_terms} />
      </DetailSection>
      <DetailSection title="Notas internas">
        <Info label="Notas internas" value={supplier.internal_notes} />
      </DetailSection>

      <DetailSection title="Oportunidades relacionadas">
        <div className="grid gap-3 rounded-md border border-slate-200 p-4">
          <h3 className="font-semibold text-[#17202d]">Vincular a oportunidad de compra</h3>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Buscar oportunidad<input value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={selectedOpportunity} onChange={(event) => setSelectedOpportunity(event.target.value)} className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-3 text-base" aria-label="Oportunidad de compra">
              <option value="">Seleccionar oportunidad</option>
              {filteredAvailable.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.reference_code} · {opportunity.title}</option>)}
            </select>
            <button type="button" disabled={!selectedOpportunity || processing} onClick={() => void linkOpportunity()} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"><LinkIcon size={18} aria-hidden="true" />Vincular</button>
          </div>
        </div>
        {relations.length === 0 && <p className="text-sm text-slate-600">Sin oportunidades vinculadas.</p>}
        {relations.map((relation) => (
          <article key={relation.id} className="rounded-md border border-slate-200 p-4">
            <Link to={`/admin/oportunidades/${relation.opportunity.id}`} className="font-semibold text-[#17202d]">{relation.opportunity.reference_code} · {relation.opportunity.title}</Link>
            <p className="mt-2 text-sm text-slate-600">{opportunitySupplierStatusLabels[relation.status]} · {formatMoney(relation.proposed_amount, relation.currency)}</p>
            {relation.notes && <p className="mt-2 text-sm text-slate-700">{relation.notes}</p>}
            <button type="button" onClick={() => startEdit(relation)} className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Editar relación</button>
          </article>
        ))}
      </DetailSection>

      {editing && (
        <RelationEditor
          title="Editar relación"
          values={relationForm}
          saving={processing}
          onChange={setRelationForm}
          onCancel={() => setEditing(null)}
          onSubmit={saveRelation}
        />
      )}
    </div>
  )
}

function CategoryEditor({ values, input, error, onInput, onAdd, onRemove }: { values: string[]; input: string; error?: string; onInput: (value: string) => void; onAdd: () => void; onRemove: (value: string) => void }) {
  return (
    <div className="mt-5 grid gap-2">
      <label htmlFor="category-input" className="text-sm font-medium text-slate-700">Categorías *</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input id="category-input" value={input} onChange={(event) => onInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onAdd() } }} className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-3 text-base" />
        <button type="button" onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]"><Plus size={18} aria-hidden="true" />Agregar</button>
      </div>
      {error && <span className="text-sm text-red-700">{error}</span>}
      <div className="flex flex-wrap gap-2">
        {values.map((category) => (
          <span key={category} className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-[#17202d]">
            {category}
            <button type="button" onClick={() => onRemove(category)} aria-label={`Quitar ${category}`} className="rounded p-1 hover:bg-slate-200"><X size={14} aria-hidden="true" /></button>
          </span>
        ))}
      </div>
    </div>
  )
}

function RelationEditor({ title, values, saving, onChange, onCancel, onSubmit }: { title: string; values: OpportunitySupplierFormValues; saving: boolean; onChange: (values: OpportunitySupplierFormValues) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const firstRef = useRef<HTMLSelectElement>(null)
  useEffect(() => {
    firstRef.current?.focus()
  }, [])
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">{title}</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Estado *<select ref={firstRef} value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value as OpportunitySupplierStatus })} className="rounded-md border border-slate-300 px-3 py-3 text-base">{opportunitySupplierStatuses.map((status) => <option key={status} value={status}>{opportunitySupplierStatusLabels[status]}</option>)}</select></label>
        <TextLike label="Monto propuesto" type="number" value={values.proposed_amount} onChange={(value) => onChange({ ...values, proposed_amount: value })} />
        <CurrencySelect value={values.currency} onChange={(value) => onChange({ ...values, currency: value })} />
        <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">Notas<textarea value={values.notes} onChange={(event) => onChange({ ...values, notes: event.target.value })} rows={3} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
        <div className="flex gap-3 md:col-span-2">
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar relación'}</button>
        </div>
      </form>
    </section>
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

function TextField({ id, label, value, error, type = 'text', onChange }: { id: keyof SupplierFormValues; label: string; value: string; error?: string; type?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>{label}<input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20" />{error && <span className="text-sm text-red-700">{error}</span>}</label>
}

function TextLike({ label, value, type = 'text', onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
}

function TextArea({ id, label, value, onChange }: { id: keyof SupplierFormValues; label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>{label}<textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

function CurrencySelect({ value, error, onChange }: { value: string; error?: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-medium text-slate-700">Moneda<select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base"><option value="">Seleccionar</option><option value="CLP">CLP</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="Otra">Otra</option></select>{error && <span className="text-sm text-red-700">{error}</span>}</label>
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
      <Info label="Sitio web" value={contact.website} />
      <Info label="Red social" value={contact.social_media} />
      <Info label="Ubicación" value={[contact.city, contact.region, contact.country].filter(Boolean).join(', ')} />
    </>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === '—') return null
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
