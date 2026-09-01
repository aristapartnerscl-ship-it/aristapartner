import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Archive, ExternalLink, RefreshCcw, RotateCcw, Save } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type {
  AgreementCounterpartyType,
  AgreementPayerType,
  CommercialAgreementFormValues,
  CommercialAgreementRecord,
  CommercialAgreementWithOpportunity,
  CompensationModel,
  ContactSelectorRecord,
  OpportunityRecord,
  SupplierWithContact,
} from '../../types/admin'
import {
  agreementCounterpartyTypeLabels,
  agreementCounterpartyTypes,
  agreementPayerTypeLabels,
  agreementPayerTypes,
  agreementStatusLabels,
  agreementStatuses,
  commissionTypeLabels,
  commissionTypes,
  compensationModelLabels,
  compensationModels,
  contactName,
  formatDate,
  formatDateTime,
  formatMoney,
  opportunityTypeLabels,
} from '../opportunity-labels'

const emptyAgreementForm = (opportunityId = ''): CommercialAgreementFormValues => ({
  opportunity_id: opportunityId,
  counterparty_type: '',
  contact_id: '',
  supplier_id: '',
  payer_type: '',
  compensation_model: 'commission',
  management_fee: '',
  commission_type: 'percentage',
  commission_value: '',
  currency: '',
  attribution_start: '',
  attribution_end: '',
  agreement_status: 'draft',
  notes: '',
})

const currencyOptions = ['CLP', 'USD', 'EUR', 'Otra']

function todayDate() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  const offset = next.getTimezoneOffset()
  return new Date(next.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
}

function agreementIdentifier(agreement: Pick<CommercialAgreementRecord, 'agreement_code' | 'id'>) {
  return agreement.agreement_code || `AGR-${agreement.id.slice(0, 8).toUpperCase()}`
}

function normalize(value: string) {
  const next = value.trim()
  return next || null
}

function parseAmount(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function includesCommission(model: CompensationModel) {
  return model === 'commission' || model === 'mixed'
}

function includesManagementFee(model: CompensationModel) {
  return model === 'management_fee' || model === 'mixed'
}

function formatCommission(agreement: CommercialAgreementRecord) {
  if (!agreement.commission_type || agreement.commission_value === null) return 'Sin comisión'
  if (agreement.commission_type === 'percentage') return `${agreement.commission_value}%`
  return formatMoney(agreement.commission_value, agreement.currency)
}

function formatManagementFee(agreement: CommercialAgreementRecord) {
  return agreement.management_fee === null ? 'Sin fee de gestión' : formatMoney(agreement.management_fee, agreement.currency)
}

function adminStatusLabel(agreement: Pick<CommercialAgreementRecord, 'archived_at'>) {
  return agreement.archived_at ? 'Archivado' : 'Activo'
}

function counterpartyLabel(agreement: CommercialAgreementWithOpportunity | CommercialAgreementRecord & { contact?: ContactSelectorRecord | null; supplier?: SupplierWithContact | null }) {
  if (agreement.counterparty_type === 'contact') return contactName(agreement.contact)
  if (agreement.counterparty_type === 'supplier') return agreement.supplier?.business_name ?? 'Proveedor no resuelto'
  return 'Pendiente de completar'
}

function payerLabel(value: AgreementPayerType | null | '') {
  return value ? agreementPayerTypeLabels[value] : 'Pendiente de definir'
}

function validateAgreementForm(form: CommercialAgreementFormValues) {
  const errors: Partial<Record<keyof CommercialAgreementFormValues, string>> = {}
  if (!form.opportunity_id) errors.opportunity_id = 'Selecciona una oportunidad relacionada.'
  if (!form.counterparty_type) errors.counterparty_type = 'Selecciona el tipo de contraparte.'
  if (form.counterparty_type === 'contact' && !form.contact_id) errors.contact_id = 'Selecciona el contacto de la contraparte.'
  if (form.counterparty_type === 'supplier' && !form.supplier_id) errors.supplier_id = 'Selecciona el proveedor de la contraparte.'
  if (!form.payer_type) errors.payer_type = 'Define quién paga la comisión.'
  if (!form.compensation_model) errors.compensation_model = 'Selecciona el tipo de acuerdo.'
  if (!form.agreement_status) errors.agreement_status = 'Selecciona el estado contractual.'

  const managementFee = parseAmount(form.management_fee)
  if (managementFee !== null && (!Number.isFinite(managementFee) || managementFee < 0)) errors.management_fee = 'El fee de gestión debe ser cero o mayor.'

  if (includesCommission(form.compensation_model)) {
    if (!form.commission_type) errors.commission_type = 'Selecciona el tipo de comisión.'
    const commissionValue = parseAmount(form.commission_value)
    if (commissionValue === null || !Number.isFinite(commissionValue)) errors.commission_value = 'Ingresa el valor de comisión.'
    else if (form.commission_type === 'percentage' && (commissionValue < 0 || commissionValue > 100)) errors.commission_value = 'El porcentaje debe estar entre 0 y 100.'
    else if (form.commission_type === 'fixed_amount' && commissionValue < 0) errors.commission_value = 'El monto fijo debe ser cero o mayor.'
    if (form.commission_type === 'fixed_amount' && !form.currency.trim()) errors.currency = 'Selecciona moneda para el monto fijo.'
  }

  if (form.attribution_start && form.attribution_end && form.attribution_end < form.attribution_start) {
    errors.attribution_end = 'La fecha de término no puede ser anterior a la fecha de inicio.'
  }

  return errors
}

function buildAgreementPayload(form: CommercialAgreementFormValues) {
  const hasCommission = includesCommission(form.compensation_model)
  const hasFee = includesManagementFee(form.compensation_model)
  const commissionValue = hasCommission ? parseAmount(form.commission_value) : null
  const managementFee = hasFee ? parseAmount(form.management_fee) : null
  const counterpartyType = form.counterparty_type as AgreementCounterpartyType
  return {
    opportunity_id: form.opportunity_id,
    counterparty_type: counterpartyType,
    contact_id: counterpartyType === 'contact' ? form.contact_id : null,
    supplier_id: counterpartyType === 'supplier' ? form.supplier_id : null,
    payer_type: form.payer_type as AgreementPayerType,
    compensation_model: form.compensation_model,
    management_fee: managementFee,
    commission_type: hasCommission ? (form.commission_type || null) : null,
    commission_value: commissionValue,
    currency: (hasCommission && form.commission_type === 'fixed_amount') || managementFee !== null ? normalize(form.currency) : null,
    attribution_start: normalize(form.attribution_start),
    attribution_end: normalize(form.attribution_end),
    agreement_status: form.agreement_status,
    notes: normalize(form.notes),
  }
}

export function AdminCommercialAgreements() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState<CommercialAgreementWithOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const query = searchParams.get('q') ?? ''
  const status = searchParams.get('status') ?? 'all'
  const adminStatus = searchParams.get('adminStatus') ?? 'active'
  const counterpartyType = searchParams.get('counterpartyType') ?? 'all'
  const payer = searchParams.get('payer') ?? 'all'
  const commission = searchParams.get('commission') ?? 'all'

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listCommercialAgreements()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setAgreements(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function updateFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === 'all' || (name === 'adminStatus' && value === 'active')) next.delete(name)
    else next.set(name, value)
    setSearchParams(next)
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return agreements.filter((agreement) => {
      if (status !== 'all' && agreement.agreement_status !== status) return false
      if (adminStatus === 'active' && agreement.archived_at) return false
      if (adminStatus === 'archived' && !agreement.archived_at) return false
      if (counterpartyType !== 'all' && agreement.counterparty_type !== counterpartyType) return false
      if (payer !== 'all' && agreement.payer_type !== payer) return false
      if (commission !== 'all' && agreement.commission_type !== commission) return false
      if (!normalized) return true
      const values = [
        agreement.agreement_code,
        agreement.opportunity?.reference_code,
        agreement.opportunity?.title,
        contactName(agreement.contact),
        agreement.contact?.company_name,
        agreement.supplier?.business_name,
        ...(agreement.supplier?.categories ?? []),
      ]
      return values.filter(Boolean).some((value) => value!.toLowerCase().includes(normalized))
    })
  }, [adminStatus, agreements, commission, counterpartyType, payer, query, status])

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <AdminPageHeader
        title="Acuerdos comerciales"
        text="Condiciones comerciales asociadas a oportunidades gestionadas por Arista Partners."
        actionLabel="Nuevo acuerdo"
        onAction={() => navigate('/admin/acuerdos/nuevo')}
      />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Buscar acuerdos
          <input value={query} onChange={(event) => updateFilter('q', event.target.value)} placeholder="Código, contraparte u oportunidad" className="rounded-md border border-slate-300 px-3 py-3 text-base" />
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <FilterSelect label="Estado contractual" value={status} onChange={(value) => updateFilter('status', value)} options={agreementStatuses.map((item): [string, string] => [item, agreementStatusLabels[item]])} />
          <FilterSelect label="Estado administrativo" value={adminStatus} onChange={(value) => updateFilter('adminStatus', value)} options={[['active', 'Activos'], ['archived', 'Archivados']]} includeAll />
          <FilterSelect label="Tipo de contraparte" value={counterpartyType} onChange={(value) => updateFilter('counterpartyType', value)} options={agreementCounterpartyTypes.map((item): [string, string] => [item, agreementCounterpartyTypeLabels[item]])} />
          <FilterSelect label="Quién paga" value={payer} onChange={(value) => updateFilter('payer', value)} options={agreementPayerTypes.map((item): [string, string] => [item, agreementPayerTypeLabels[item]])} />
          <FilterSelect label="Tipo de comisión" value={commission} onChange={(value) => updateFilter('commission', value)} options={commissionTypes.map((item): [string, string] => [item, commissionTypeLabels[item]])} />
        </div>
      </section>

      {loading && <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando acuerdos...</section>}
      {error && (
        <section className="grid gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void load()} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            <RefreshCcw size={18} aria-hidden="true" />
            Reintentar
          </button>
        </section>
      )}
      {!loading && !error && agreements.length === 0 && (
        <div className="grid gap-4">
          <EmptyState title="Aún no hay acuerdos comerciales" text="Crea el primer acuerdo desde una oportunidad revisada." />
          <Link to="/admin/acuerdos/nuevo" className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Crear acuerdo</Link>
        </div>
      )}
      {!loading && !error && agreements.length > 0 && filtered.length === 0 && <EmptyState title="Sin resultados" text="No hay acuerdos que coincidan con los filtros actuales." />}
      {!loading && !error && filtered.length > 0 && <AgreementsList agreements={filtered} />}
    </div>
  )
}

function AgreementsList({ agreements }: { agreements: CommercialAgreementWithOpportunity[] }) {
  return (
      <section className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-white">
        <div className="hidden w-full max-w-full overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Contraparte</th>
              <th className="px-4 py-3">Quién paga</th>
              <th className="px-4 py-3">Oportunidad</th>
              <th className="px-4 py-3">Comisión</th>
              <th className="px-4 py-3">Contractual</th>
              <th className="px-4 py-3">Administrativo</th>
              <th className="px-4 py-3">Última actualización</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {agreements.map((agreement) => (
              <tr key={agreement.id}>
                <td className="px-4 py-4 font-semibold text-[#17202d]">{agreementIdentifier(agreement)}</td>
                <td className="px-4 py-4 text-slate-700">{counterpartyLabel(agreement)}</td>
                <td className="px-4 py-4 text-slate-700">{payerLabel(agreement.payer_type)}</td>
                <td className="px-4 py-4 text-slate-700">{agreement.opportunity?.reference_code ?? 'Sin oportunidad'} · {agreement.opportunity?.title ?? ''}</td>
                <td className="px-4 py-4 text-slate-700">{commissionTypeLabel(agreement)} · {formatCommission(agreement)}</td>
                <td className="px-4 py-4 text-slate-700">{agreementStatusLabels[agreement.agreement_status]}</td>
                <td className="px-4 py-4 text-slate-700">{adminStatusLabel(agreement)}</td>
                <td className="px-4 py-4 text-slate-700">{formatDateTime(agreement.updated_at)}</td>
                <td className="px-4 py-4"><Link to={`/admin/acuerdos/${agreement.id}`} className="font-semibold text-[#235b3e]">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {agreements.map((agreement) => (
          <article key={agreement.id} className="rounded-md border border-slate-200 p-4">
            <p className="text-sm font-semibold text-[#17202d]">{agreementIdentifier(agreement)}</p>
            <p className="mt-2 text-sm text-slate-700">{counterpartyLabel(agreement)}</p>
            <p className="mt-2 text-sm text-slate-600">{payerLabel(agreement.payer_type)} · {adminStatusLabel(agreement)}</p>
            <p className="mt-2 text-sm text-slate-600">{agreement.opportunity?.reference_code} · {agreement.opportunity?.title}</p>
            <p className="mt-2 text-sm text-slate-600">{commissionTypeLabel(agreement)} · {formatCommission(agreement)}</p>
            <Link to={`/admin/acuerdos/${agreement.id}`} className="mt-3 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver</Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export function AdminCommercialAgreementDetail() {
  const { id } = useParams()
  const [agreement, setAgreement] = useState<CommercialAgreementWithOpportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    if (!isUuid(id)) {
      setError('El identificador de acuerdo no es válido.')
      setLoading(false)
      return
    }
    const result = await adminRepository.getCommercialAgreementById(id!)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (!result.data) {
      setError('El acuerdo no existe o no está autorizado para tu usuario.')
      return
    }
    setAgreement(result.data)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function archiveAgreement() {
    if (!agreement || processing) return
    if (!window.confirm('¿Archivar este acuerdo comercial? No se eliminará el registro.')) return
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.archiveCommercialAgreement(agreement.id)
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible archivar el acuerdo.')
      return
    }
    setStatus('Acuerdo archivado correctamente.')
    setAgreement((current) => (current ? { ...current, ...result.data } : current))
  }

  async function restoreAgreement() {
    if (!agreement || processing) return
    if (!window.confirm('¿Restaurar este acuerdo comercial?')) return
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.restoreCommercialAgreement(agreement.id)
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible restaurar el acuerdo.')
      return
    }
    setStatus('Acuerdo restaurado correctamente.')
    setAgreement((current) => (current ? { ...current, ...result.data } : current))
  }

  if (loading) return <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando acuerdo...</section>

  if (error || !agreement) {
    return (
      <div className="grid gap-6">
        <AdminPageHeader title="Acuerdo no disponible" />
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-slate-700">{error || 'No fue posible cargar el acuerdo.'}</p>
          <Link to="/admin/acuerdos" className="mt-4 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Volver al listado</Link>
        </section>
      </div>
    )
  }

  const archived = Boolean(agreement.archived_at)

  return (
    <div className="grid gap-6">
      <AdminPageHeader eyebrow={agreementIdentifier(agreement)} title="Acuerdo comercial" text={`${compensationModelLabels[agreement.compensation_model]} · ${agreementStatusLabels[agreement.agreement_status]} · ${adminStatusLabel(agreement)}`} />
      <div className="flex flex-wrap gap-3">
        {!archived && <Link to={`/admin/acuerdos/${agreement.id}/editar`} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Editar</Link>}
        {!archived ? (
          <button type="button" disabled={processing} onClick={() => void archiveAgreement()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d] disabled:opacity-60">
            <Archive size={18} aria-hidden="true" />
            {processing ? 'Archivando...' : 'Archivar'}
          </button>
        ) : (
          <button type="button" disabled={processing} onClick={() => void restoreAgreement()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d] disabled:opacity-60">
            <RotateCcw size={18} aria-hidden="true" />
            {processing ? 'Restaurando...' : 'Restaurar'}
          </button>
        )}
      </div>
      <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Resumen</h2>
        <Info label="Código del acuerdo" value={agreementIdentifier(agreement)} />
        <Info label="Quién paga" value={payerLabel(agreement.payer_type)} />
        <Info label="Modelo de compensación" value={compensationModelLabels[agreement.compensation_model]} />
        <Info label="Tipo de comisión" value={commissionTypeLabel(agreement)} />
        <Info label="Valor de comisión" value={formatCommission(agreement)} />
        <Info label="Moneda" value={agreement.currency} />
        <Info label="Fee de gestión" value={formatManagementFee(agreement)} />
        <Info label="Vigencia" value={`${formatDate(agreement.attribution_start)} / ${formatDate(agreement.attribution_end)}`} />
        <Info label="Estado contractual" value={agreementStatusLabels[agreement.agreement_status]} />
        <Info label="Estado administrativo" value={adminStatusLabel(agreement)} />
        {agreement.archived_at && <Info label="Fecha de archivo" value={formatDateTime(agreement.archived_at)} />}
        {agreement.archivedByProfile && <Info label="Archivado por" value={agreement.archivedByProfile.full_name ?? 'Administrador'} />}
        <Info label="Notas" value={agreement.notes} />
        <Info label="Creación" value={formatDateTime(agreement.created_at)} />
        <Info label="Última actualización" value={formatDateTime(agreement.updated_at)} />
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Oportunidad vinculada</h2>
        {agreement.opportunity ? (
          <>
            <Info label="Código" value={agreement.opportunity.reference_code} />
            <Info label="Título" value={agreement.opportunity.title} />
            <Info label="Tipo" value={opportunityTypeLabels[agreement.opportunity.opportunity_type]} />
            <Link to={`/admin/oportunidades/${agreement.opportunity.id}`} className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">
              Ver oportunidad
              <ExternalLink size={16} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="text-sm text-slate-600">La oportunidad vinculada no pudo resolverse.</p>
        )}
      </section>

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Contraparte</h2>
        <Info label="Tipo" value={agreement.counterparty_type ? agreementCounterpartyTypeLabels[agreement.counterparty_type] : 'Pendiente de completar'} />
        <Info label="Contraparte" value={counterpartyLabel(agreement)} />
        {agreement.counterparty_type === 'contact' && agreement.contact && <Link to="/admin/contactos" className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Ir a contactos</Link>}
        {agreement.counterparty_type === 'supplier' && agreement.supplier && <Link to={`/admin/proveedores/${agreement.supplier.id}`} className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Ver proveedor</Link>}
      </section>
    </div>
  )
}

export function AdminCommercialAgreementFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState<CommercialAgreementFormValues>(() => emptyAgreementForm(searchParams.get('opportunityId') ?? ''))
  const [initialSignature, setInitialSignature] = useState('')
  const [agreement, setAgreement] = useState<CommercialAgreementWithOpportunity | null>(null)
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([])
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [suppliers, setSuppliers] = useState<SupplierWithContact[]>([])
  const [contactQuery, setContactQuery] = useState('')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CommercialAgreementFormValues, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')

  const dirty = initialSignature ? JSON.stringify(form) !== initialSignature : false
  const archived = Boolean(agreement?.archived_at)

  const filteredContacts = useMemo(() => {
    const normalized = contactQuery.trim().toLowerCase()
    if (!normalized) return contacts
    return contacts.filter((contact) => [contact.full_name, contact.company_name, contact.email, contact.phone].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)))
  }, [contactQuery, contacts])

  const filteredSuppliers = useMemo(() => {
    const normalized = supplierQuery.trim().toLowerCase()
    const active = suppliers.filter((supplier) => supplier.status !== 'archived' && supplier.status !== 'rejected')
    if (!normalized) return active
    return active.filter((supplier) => [supplier.business_name, supplier.geographic_coverage, ...supplier.categories].filter(Boolean).some((value) => value!.toLowerCase().includes(normalized)))
  }, [supplierQuery, suppliers])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setStatus('')
      const [opportunitiesResult, contactsResult, suppliersResult, agreementResult] = await Promise.all([
        adminRepository.listOpportunitiesForAgreementSelector(),
        adminRepository.listContactsForAgreementSelector(),
        adminRepository.listSuppliersForAgreementSelector(),
        mode === 'edit' && isUuid(id) ? adminRepository.getCommercialAgreementById(id!) : Promise.resolve({ data: null, error: null }),
      ])
      const settingsResult = mode === 'create' ? await adminRepository.getOrganizationSettings() : { data: null, error: null }

      setLoading(false)
      if (opportunitiesResult.error) setStatus(opportunitiesResult.error)
      else setOpportunities(opportunitiesResult.data)
      if (!contactsResult.error) setContacts(contactsResult.data)
      if (!suppliersResult.error) setSuppliers(suppliersResult.data)

      if (mode === 'edit') {
        if (!isUuid(id)) {
          setStatus('El identificador de acuerdo no es válido.')
          return
        }
        if (agreementResult.error) {
          setStatus(agreementResult.error)
          return
        }
        if (!agreementResult.data) {
          setStatus('El acuerdo no existe o no está autorizado para tu usuario.')
          return
        }
        setAgreement(agreementResult.data)
        const nextForm = formFromAgreement(agreementResult.data)
        setForm(nextForm)
        setInitialSignature(JSON.stringify(nextForm))
      } else {
        const nextForm = emptyAgreementForm(searchParams.get('opportunityId') ?? '')
        if (settingsResult.data) {
          nextForm.currency = settingsResult.data.default_currency
          if (settingsResult.data.default_commission_type) {
            nextForm.commission_type = settingsResult.data.default_commission_type
            nextForm.commission_value = settingsResult.data.default_commission_value === null ? '' : String(settingsResult.data.default_commission_value)
          }
          if (settingsResult.data.default_attribution_days > 0) {
            nextForm.attribution_start = todayDate()
            nextForm.attribution_end = addDays(nextForm.attribution_start, settingsResult.data.default_attribution_days)
          }
        }
        setForm(nextForm)
        setInitialSignature(JSON.stringify(nextForm))
      }
    }
    void load()
  }, [id, mode, searchParams])

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'compensation_model' && !includesCommission(value as CompensationModel)) {
        next.commission_type = ''
        next.commission_value = ''
      }
      if (name === 'commission_type' && value !== 'fixed_amount') {
        next.currency = includesManagementFee(next.compensation_model) && next.management_fee.trim() ? next.currency : ''
      }
      return next
    })
  }

  function changeCounterpartyType(nextType: AgreementCounterpartyType) {
    if ((form.contact_id || form.supplier_id) && form.counterparty_type !== nextType && !window.confirm('Cambiar el tipo de contraparte limpiará la selección actual. ¿Continuar?')) return
    setFieldErrors((current) => ({ ...current, counterparty_type: undefined, contact_id: undefined, supplier_id: undefined }))
    setForm((current) => ({ ...current, counterparty_type: nextType, contact_id: '', supplier_id: '' }))
  }

  function cancel() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Descartarlos?')) return
    navigate('/admin/acuerdos')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || archived) return
    setStatus('')
    const errors = validateAgreementForm(form)
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) {
      setStatus('Revisa los campos marcados antes de guardar.')
      return
    }

    setSaving(true)
    const payload = buildAgreementPayload(form)
    const result = mode === 'edit' && agreement ? await adminRepository.updateCommercialAgreement(agreement.id, payload) : await adminRepository.createCommercialAgreement(payload)
    setSaving(false)

    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible guardar el acuerdo.')
      return
    }

    setInitialSignature(JSON.stringify(form))
    navigate(`/admin/acuerdos/${result.data.id}`, { state: { savedAgreement: agreementIdentifier(result.data) } })
  }

  if (loading) return <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando formulario...</section>

  return (
    <div className="grid gap-6">
      <AdminPageHeader title={mode === 'edit' ? 'Editar acuerdo comercial' : 'Nuevo acuerdo comercial'} text="Registra condiciones comerciales con contraparte y pagador trazables." />
      {archived && <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Este acuerdo está archivado administrativamente. La edición normal queda bloqueada para conservar el historial.</section>}
      <form className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6" onSubmit={submit}>
        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-[#17202d]">Relación comercial</h2>
          <ReadonlyInfo label="Código del acuerdo" value={agreement?.agreement_code ?? 'Se generará automáticamente al guardar'} />
          <FieldError id="agreement-code-help" message="" />
          <LabeledSelect label="Oportunidad relacionada *" name="opportunity_id" value={form.opportunity_id} onChange={updateField} disabled={archived} error={fieldErrors.opportunity_id}>
            <option value="">Seleccionar oportunidad</option>
            {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.reference_code} · {opportunity.title}</option>)}
          </LabeledSelect>
        </section>

        <section className="grid gap-4">
          <h2 className="text-lg font-semibold text-[#17202d]">Contraparte del acuerdo</h2>
          <fieldset className="grid gap-3" aria-describedby={fieldErrors.counterparty_type ? 'counterparty_type-error' : undefined}>
            <legend className="text-sm font-medium text-slate-700">Selecciona una contraparte *</legend>
            <div className="flex flex-wrap gap-3">
              {agreementCounterpartyTypes.map((type) => (
                <label key={type} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">
                  <input type="radio" name="counterparty_type" checked={form.counterparty_type === type} disabled={archived} onChange={() => changeCounterpartyType(type)} />
                  {agreementCounterpartyTypeLabels[type]}
                </label>
              ))}
            </div>
            <FieldError id="counterparty_type-error" message={fieldErrors.counterparty_type} />
          </fieldset>

          {form.counterparty_type === 'contact' && (
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Buscar contacto
                <input value={contactQuery} onChange={(event) => setContactQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
              </label>
              <LabeledSelect label="Contacto *" name="contact_id" value={form.contact_id} onChange={updateField} disabled={archived} error={fieldErrors.contact_id}>
                <option value="">Seleccionar contacto</option>
                {filteredContacts.map((contact) => <option key={contact.id} value={contact.id}>{contactName(contact)}{contact.company_name ? ` · ${contact.company_name}` : ''}</option>)}
              </LabeledSelect>
            </div>
          )}

          {form.counterparty_type === 'supplier' && (
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Buscar proveedor
                <input value={supplierQuery} onChange={(event) => setSupplierQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
              </label>
              <LabeledSelect label="Proveedor *" name="supplier_id" value={form.supplier_id} onChange={updateField} disabled={archived} error={fieldErrors.supplier_id}>
                <option value="">Seleccionar proveedor</option>
                {filteredSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.business_name}{supplier.categories.length ? ` · ${supplier.categories.slice(0, 2).join(', ')}` : ''}</option>)}
              </LabeledSelect>
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <h2 className="text-lg font-semibold text-[#17202d] md:col-span-2">Condiciones</h2>
          <LabeledSelect label="Quién paga la comisión *" name="payer_type" value={form.payer_type} onChange={updateField} disabled={archived} error={fieldErrors.payer_type}>
            <option value="">Pendiente de definir</option>
            {agreementPayerTypes.map((item) => <option key={item} value={item}>{agreementPayerTypeLabels[item]}</option>)}
          </LabeledSelect>
          <LabeledSelect label="Estado contractual *" name="agreement_status" value={form.agreement_status} onChange={updateField} disabled={archived} error={fieldErrors.agreement_status}>
            {agreementStatuses.map((item) => <option key={item} value={item}>{agreementStatusLabels[item]}</option>)}
          </LabeledSelect>
          <LabeledSelect label="Modelo de compensación *" name="compensation_model" value={form.compensation_model} onChange={updateField} disabled={archived} error={fieldErrors.compensation_model}>
            {compensationModels.map((item) => <option key={item} value={item}>{compensationModelLabels[item]}</option>)}
          </LabeledSelect>
          {includesManagementFee(form.compensation_model) && <LabeledInput label="Fee de gestión" name="management_fee" type="number" value={form.management_fee} onChange={updateField} disabled={archived} error={fieldErrors.management_fee} />}
          {includesCommission(form.compensation_model) && (
            <>
              <LabeledSelect label="Tipo de comisión *" name="commission_type" value={form.commission_type} onChange={updateField} disabled={archived} error={fieldErrors.commission_type}>
                {commissionTypes.map((item) => <option key={item} value={item}>{commissionTypeLabels[item]}</option>)}
              </LabeledSelect>
              <LabeledInput label="Valor de comisión *" name="commission_value" type="number" value={form.commission_value} onChange={updateField} disabled={archived} error={fieldErrors.commission_value} />
            </>
          )}
          {(form.commission_type === 'fixed_amount' || (includesManagementFee(form.compensation_model) && form.management_fee.trim())) && (
            <LabeledSelect label="Moneda" name="currency" value={form.currency} onChange={updateField} disabled={archived} error={fieldErrors.currency}>
              <option value="">Seleccionar</option>
              {currencyOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </LabeledSelect>
          )}
          <LabeledInput label="Fecha de inicio" name="attribution_start" type="date" value={form.attribution_start} onChange={updateField} disabled={archived} error={fieldErrors.attribution_start} />
          <LabeledInput label="Fecha de término" name="attribution_end" type="date" value={form.attribution_end} onChange={updateField} disabled={archived} error={fieldErrors.attribution_end} />
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Notas internas
            <textarea name="notes" value={form.notes} onChange={updateField} disabled={archived} rows={4} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
          </label>
        </section>

        <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={cancel} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
          <button type="submit" disabled={saving || archived} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            <Save size={18} aria-hidden="true" />
            {saving ? 'Guardando...' : 'Guardar acuerdo'}
          </button>
        </div>
      </form>
    </div>
  )
}

function formFromAgreement(agreement: CommercialAgreementRecord): CommercialAgreementFormValues {
  return {
    opportunity_id: agreement.opportunity_id,
    counterparty_type: agreement.counterparty_type ?? '',
    contact_id: agreement.contact_id ?? '',
    supplier_id: agreement.supplier_id ?? '',
    payer_type: agreement.payer_type ?? '',
    compensation_model: agreement.compensation_model,
    management_fee: agreement.management_fee === null ? '' : String(agreement.management_fee),
    commission_type: agreement.commission_type ?? '',
    commission_value: agreement.commission_value === null ? '' : String(agreement.commission_value),
    currency: agreement.currency ?? '',
    attribution_start: agreement.attribution_start ?? '',
    attribution_end: agreement.attribution_end ?? '',
    agreement_status: agreement.agreement_status,
    notes: agreement.notes ?? '',
  }
}

function commissionTypeLabel(agreement: Pick<CommercialAgreementRecord, 'commission_type'>) {
  return agreement.commission_type ? commissionTypeLabels[agreement.commission_type] : 'Sin tipo de comisión'
}

function FilterSelect({ label, value, onChange, options, includeAll = true }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][]; includeAll?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base">
        {includeAll && <option value="all">Todos</option>}
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  )
}

function ReadonlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#17202d]">{value}</p>
    </div>
  )
}

function LabeledInput({ label, name, type, value, onChange, disabled, error }: { label: string; name: keyof CommercialAgreementFormValues; type: string; value: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; error?: string }) {
  const errorId = `${name}-error`
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input name={name} type={type} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} value={value} onChange={onChange} disabled={disabled} aria-describedby={error ? errorId : undefined} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
      <FieldError id={errorId} message={error} />
    </label>
  )
}

function LabeledSelect({ label, name, value, onChange, disabled, error, children }: { label: string; name: keyof CommercialAgreementFormValues; value: string; onChange: (event: ChangeEvent<HTMLSelectElement>) => void; disabled?: boolean; error?: string; children: ReactNode }) {
  const errorId = `${name}-error`
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <select name={name} value={value} onChange={onChange} disabled={disabled} aria-describedby={error ? errorId : undefined} className="rounded-md border border-slate-300 px-3 py-3 text-base">
        {children}
      </select>
      <FieldError id={errorId} message={error} />
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <span id={id} className="text-sm text-red-700">{message}</span>
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === '—') return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{value}</dd>
    </div>
  )
}
