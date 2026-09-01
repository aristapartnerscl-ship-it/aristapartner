import { Link, useLocation, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, Clock3, Plus, RotateCcw } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type {
  CommercialAgreementWithOpportunity,
  CommercialProposalRecord,
  ContactSelectorRecord,
  OpportunityActivityFormValues,
  OpportunityActivityRecord,
  OpportunityRecord,
  OpportunitySupplierFormValues,
  OpportunitySupplierStatus,
  OpportunitySupplierWithSupplier,
  SupplierWithContact,
} from '../../types/admin'
import {
  activityTypeLabels,
  activityTypes,
  agreementPayerTypeLabels,
  agreementStatusLabels,
  commissionTypeLabels,
  contactName,
  formatDate,
  formatDateTime,
  formatMoney,
  fromDateTimeLocal,
  opportunityStatusLabels,
  opportunitySupplierStatusLabels,
  opportunitySupplierStatuses,
  opportunityTypeLabels,
  priorityLabels,
  toDateTimeLocal,
} from '../opportunity-labels'
import { useAdminAuth } from '../useAdminAuth'

const emptyActivity = (): OpportunityActivityFormValues => ({
  activity_type: 'note',
  title: '',
  description: '',
  occurred_at: toDateTimeLocal(new Date().toISOString()),
  next_action_at: '',
})

const emptySupplierRelation: OpportunitySupplierFormValues = {
  status: 'identified',
  proposed_amount: '',
  currency: '',
  notes: '',
}

const opportunitySourceLabels: Record<string, string> = {
  public_form: 'Formulario p\u00fablico',
  internal: 'Registro interno',
  inquiry: 'Consulta',
}

function opportunitySourceLabel(source: string | null) {
  if (!source) return 'Sin informaci\u00f3n'
  return opportunitySourceLabels[source] ?? 'Sin informaci\u00f3n'
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

export function AdminOpportunityDetail({ detailId, embedded = false }: { detailId?: string; embedded?: boolean } = {}) {
  const routeParams = useParams()
  const id = detailId ?? routeParams.id
  const location = useLocation()
  const auth = useAdminAuth()
  const [opportunity, setOpportunity] = useState<OpportunityRecord | null>(null)
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [activities, setActivities] = useState<OpportunityActivityRecord[]>([])
  const [activityForm, setActivityForm] = useState<OpportunityActivityFormValues>(emptyActivity)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activityStatus, setActivityStatus] = useState('')
  const [savingActivity, setSavingActivity] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [processingFollowUpId, setProcessingFollowUpId] = useState<string | null>(null)
  const [opportunitySuppliers, setOpportunitySuppliers] = useState<OpportunitySupplierWithSupplier[]>([])
  const [availableSuppliers, setAvailableSuppliers] = useState<SupplierWithContact[]>([])
  const [supplierStatus, setSupplierStatus] = useState('')
  const [commercialAgreements, setCommercialAgreements] = useState<CommercialAgreementWithOpportunity[]>([])
  const [commercialProposals, setCommercialProposals] = useState<CommercialProposalRecord[]>([])

  const load = useCallback(async function load() {
    setLoading(true)
    setError('')
    if (!isUuid(id)) {
      setError('El identificador de oportunidad no es válido.')
      setLoading(false)
      return
    }
    const [opportunityResult, contactsResult, activitiesResult, agreementsResult, proposalsResult] = await Promise.all([
      adminRepository.getOpportunityById(id!),
      adminRepository.listContactsForSelector(),
      adminRepository.listOpportunityActivities(id!),
      adminRepository.listAgreementsForOpportunity(id!),
      adminRepository.listCommercialProposalsForOpportunity?.(id!),
    ])
    setLoading(false)
    if (opportunityResult.error) {
      setError(opportunityResult.error)
      return
    }
    if (!opportunityResult.data) {
      setError('La oportunidad no existe o no está autorizada para tu usuario.')
      return
    }
    setOpportunity(opportunityResult.data)
    if (!contactsResult.error) setContacts(contactsResult.data)
    if (!activitiesResult.error) setActivities(activitiesResult.data)
    if (!agreementsResult.error) setCommercialAgreements(agreementsResult.data)
    if (proposalsResult && !proposalsResult.error) setCommercialProposals(proposalsResult.data)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function loadSupplierRelations(opportunityId: string) {
    const [relationsResult, availableResult] = await Promise.all([
      adminRepository.listOpportunitySuppliers(opportunityId),
      adminRepository.listAvailableSuppliersForOpportunity(opportunityId),
    ])
    if (!relationsResult.error) setOpportunitySuppliers(relationsResult.data)
    if (!availableResult.error) setAvailableSuppliers(availableResult.data)
  }

  useEffect(() => {
    if (opportunity?.opportunity_type !== 'buy') {
      setOpportunitySuppliers([])
      setAvailableSuppliers([])
      return
    }
    void loadSupplierRelations(opportunity.id)
  }, [opportunity?.id, opportunity?.opportunity_type])

  const contact = useMemo(() => {
    if (!opportunity?.contact_id) return null
    return contacts.find((item) => item.id === opportunity.contact_id) ?? null
  }, [contacts, opportunity?.contact_id])

  const nextAction = useMemo(
    () =>
      activities
        .filter((activity) => activity.next_action_at && !activity.completed_at)
        .sort((a, b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime())[0] ?? null,
    [activities],
  )

  function updateActivity(nextActivity: OpportunityActivityRecord) {
    setActivities((current) =>
      current
        .map((activity) => (activity.id === nextActivity.id ? nextActivity : activity))
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()),
    )
  }

  async function completeFollowUp(activity: OpportunityActivityRecord) {
    if (!window.confirm('¿Marcar este seguimiento como completado?')) return
    setProcessingFollowUpId(activity.id)
    setActivityStatus('')
    const result = await adminRepository.completeFollowUp(activity.id)
    setProcessingFollowUpId(null)
    if (result.error || !result.data) {
      setActivityStatus(result.error ?? 'No fue posible completar el seguimiento.')
      return
    }
    updateActivity(result.data)
    setActivityStatus('Seguimiento marcado como completado.')
  }

  async function reopenFollowUp(activity: OpportunityActivityRecord) {
    if (!window.confirm('¿Reabrir este seguimiento?')) return
    setProcessingFollowUpId(activity.id)
    setActivityStatus('')
    const result = await adminRepository.reopenFollowUp(activity.id)
    setProcessingFollowUpId(null)
    if (result.error || !result.data) {
      setActivityStatus(result.error ?? 'No fue posible reabrir el seguimiento.')
      return
    }
    updateActivity(result.data)
    setActivityStatus('Seguimiento reabierto.')
  }

  async function archiveOpportunity() {
    if (!opportunity || archiving) return
    if (!window.confirm('¿Archivar esta oportunidad? No se eliminará el registro.')) return
    setArchiving(true)
    const result = await adminRepository.updateOpportunity(opportunity.id, { status: 'archived' })
    if (result.error || !result.data) {
      setArchiving(false)
      setActivityStatus(result.error ?? 'No fue posible archivar la oportunidad.')
      return
    }
    const activity = await adminRepository.createOpportunityActivity({
      opportunity_id: opportunity.id,
      activity_type: 'status_change',
      title: 'Oportunidad archivada',
      description: `Estado anterior: ${opportunityStatusLabels[opportunity.status]}. Nuevo estado: Archivada.`,
      occurred_at: new Date().toISOString(),
      next_action_at: null,
    })
    setOpportunity(result.data)
    setArchiving(false)
    if (activity.data) setActivities((current) => [activity.data!, ...current])
    if (activity.error) setActivityStatus('La oportunidad fue archivada, pero el historial no pudo registrarse.')
  }

  async function submitActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!opportunity || savingActivity) return
    setActivityStatus('')
    if (!activityForm.title.trim()) {
      setActivityStatus('Ingresa un título para la actividad.')
      return
    }
    const occurredAt = fromDateTimeLocal(activityForm.occurred_at)
    const nextActionAt = fromDateTimeLocal(activityForm.next_action_at)
    if (!occurredAt) {
      setActivityStatus('Ingresa una fecha válida de realización.')
      return
    }

    setSavingActivity(true)
    const result = await adminRepository.createOpportunityActivity({
      opportunity_id: opportunity.id,
      activity_type: activityForm.activity_type,
      title: activityForm.title.trim(),
      description: activityForm.description.trim() || null,
      occurred_at: occurredAt,
      next_action_at: nextActionAt,
    })
    setSavingActivity(false)

    if (result.error || !result.data) {
      setActivityStatus(result.error ?? 'No fue posible registrar la actividad.')
      return
    }
    setActivities((current) => [result.data!, ...current].sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()))
    setActivityForm(emptyActivity())
    setActivityStatus('Actividad registrada correctamente.')
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando oportunidad...</div>

  if (error || !opportunity) {
    return (
      <div className="grid gap-6">
        <AdminPageHeader title="Oportunidad no disponible" />
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-slate-700">{error || 'No fue posible cargar la oportunidad.'}</p>
          <Link to="/admin/oportunidades" className="mt-4 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Volver al listado</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {!embedded && <AdminPageHeader
        eyebrow={opportunity.reference_code}
        title={opportunity.title}
        text={`${opportunityTypeLabels[opportunity.opportunity_type]} · ${opportunityStatusLabels[opportunity.status]} · ${priorityLabels[opportunity.priority]}`}
      />}
      {(location.state as { savedReference?: string } | null)?.savedReference && (
        <div className="rounded-lg border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm font-medium text-[#17202d]">
          Oportunidad guardada con código {(location.state as { savedReference: string }).savedReference}.
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to={`/admin/oportunidades/${opportunity.id}/editar`} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Editar</Link>
        {opportunity.status !== 'archived' && (
          <button type="button" disabled={archiving} onClick={() => void archiveOpportunity()} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d] disabled:opacity-60">
            {archiving ? 'Archivando...' : 'Archivar'}
          </button>
        )}
      </div>

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Resumen</h2>
        <Info label="Descripción" value={opportunity.description} />
        <Info label="Origen" value={opportunitySourceLabel(opportunity.source)} />
        <Info label="Fecha esperada" value={formatDate(opportunity.expected_date)} />
        <Info label="Valor estimado" value={formatMoney(opportunity.estimated_value, opportunity.currency)} />
        <Info label="Ubicación" value={[opportunity.city, opportunity.region, opportunity.country].filter(Boolean).join(', ')} />
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Contacto principal</h2>
        {contact ? (
          <>
            <Info label="Nombre" value={contactName(contact)} />
            {contact.company_name && <Info label="Empresa" value={contact.company_name} />}
            {contact.email && <Info label="Correo" value={contact.email} />}
            {contact.phone && <Info label="Teléfono" value={contact.phone} />}
            {(contact.city || contact.country) && <Info label="Ciudad/país" value={[contact.city, contact.country].filter(Boolean).join(', ')} />}
            <Link to="/admin/contactos" className="w-fit rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Ir a contactos</Link>
          </>
        ) : (
          <p className="text-sm text-slate-600">No se pudo resolver el contacto vinculado.</p>
        )}
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Gestión interna</h2>
        <Info label="Responsable" value={auth.profile?.full_name || auth.user?.email || 'Administrador actual'} />
        <Info label="Notas internas" value={opportunity.internal_notes} />
        {opportunity.status === 'rejected' && <Info label="Motivo de rechazo" value={opportunity.rejection_reason} />}
        <Info label="Creación" value={formatDateTime(opportunity.created_at)} />
        <Info label="Última actualización" value={formatDateTime(opportunity.updated_at)} />
      </section>

      <CommercialAgreementsSection opportunityId={opportunity.id} agreements={commercialAgreements} />
      <CommercialProposalsSection opportunityId={opportunity.id} proposals={commercialProposals} />

      {opportunity.opportunity_type === 'buy' && (
        <OpportunitySuppliersSection
          opportunityId={opportunity.id}
          relations={opportunitySuppliers}
          availableSuppliers={availableSuppliers}
          status={supplierStatus}
          setStatus={setSupplierStatus}
          onRelationsChange={setOpportunitySuppliers}
          onReload={() => void loadSupplierRelations(opportunity.id)}
        />
      )}

      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Actividad y seguimiento</h2>
        {nextAction && (
          <div className="rounded-md border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm text-[#17202d]">
            Próxima acción: {formatDateTime(nextAction.next_action_at)} · {nextAction.title}
          </div>
        )}
        <form className="grid gap-4 rounded-md border border-slate-200 p-4" onSubmit={submitActivity}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Tipo de actividad *
              <select value={activityForm.activity_type} onChange={(event) => setActivityForm((current) => ({ ...current, activity_type: event.target.value as OpportunityActivityFormValues['activity_type'] }))} className="rounded-md border border-slate-300 px-3 py-3 text-base">
                {activityTypes.map((type) => <option key={type} value={type}>{activityTypeLabels[type]}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Título *
              <input value={activityForm.title} onChange={(event) => setActivityForm((current) => ({ ...current, title: event.target.value }))} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Fecha y hora de realización *
              <input type="datetime-local" value={activityForm.occurred_at} onChange={(event) => setActivityForm((current) => ({ ...current, occurred_at: event.target.value }))} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Próxima acción
              <input type="datetime-local" value={activityForm.next_action_at} onChange={(event) => setActivityForm((current) => ({ ...current, next_action_at: event.target.value }))} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Descripción
            <textarea value={activityForm.description} onChange={(event) => setActivityForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
          </label>
          <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{activityStatus}</div>
          <button type="submit" disabled={savingActivity} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {savingActivity ? 'Registrando...' : 'Registrar actividad'}
          </button>
        </form>

        <div className="grid gap-3">
          {activities.length === 0 && <p className="text-sm text-slate-600">No hay actividades registradas.</p>}
          {activities.map((activity) => (
            <ActivityTimelineItem
              key={activity.id}
              activity={activity}
              processing={processingFollowUpId === activity.id}
              onComplete={completeFollowUp}
              onReopen={reopenFollowUp}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function CommercialProposalsSection({ opportunityId, proposals }: { opportunityId: string; proposals: CommercialProposalRecord[] }) {
  return <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-[#17202d]">Propuestas comerciales</h2><p className="mt-2 text-sm text-slate-600">Versiones de propuesta vinculadas a esta oportunidad.</p></div><Link to={`/admin/propuestas/nueva?opportunityId=${opportunityId}`} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white"><Plus size={18} />Nueva propuesta</Link></div>{proposals.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">Aún no hay propuestas para esta oportunidad.</p> : <div className="grid gap-3">{proposals.map((proposal) => <article key={proposal.id} className="rounded-md border border-slate-200 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><Link to={`/admin/propuestas/${proposal.id}`} className="font-semibold text-[#235b3e]">{proposal.proposal_code}</Link><p className="mt-1 text-sm text-slate-700">{proposal.title}</p><p className="mt-1 text-sm text-slate-600">{formatMoney(proposal.total_amount, proposal.currency)} · {proposal.valid_until || 'Sin vigencia'}</p></div><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">{proposal.status}</span></div></article>)}</div>}</section>
}

function CommercialAgreementsSection({
  opportunityId,
  agreements,
}: {
  opportunityId: string
  agreements: CommercialAgreementWithOpportunity[]
}) {
  const [showArchived, setShowArchived] = useState(false)
  const visibleAgreements = showArchived ? agreements : agreements.filter((agreement) => !agreement.archived_at)
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#17202d]">Acuerdos comerciales</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Condiciones comerciales vinculadas a esta oportunidad.</p>
        </div>
        <Link to={`/admin/acuerdos/nuevo?opportunityId=${opportunityId}`} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
          <Plus size={18} aria-hidden="true" />
          Nuevo acuerdo
        </Link>
      </div>
      <label className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
        Mostrar archivados
      </label>
      {visibleAgreements.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">No hay acuerdos comerciales relacionados con esta oportunidad.</p>
      ) : (
        <div className="grid gap-3">
          {visibleAgreements.map((agreement) => (
            <article key={agreement.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link to={`/admin/acuerdos/${agreement.id}`} className="font-semibold text-[#17202d]">
                    {agreement.agreement_code}
                  </Link>
                  <p className="mt-2 text-sm text-slate-600">
                    {agreementCounterpartySummary(agreement)} · {agreement.payer_type ? agreementPayerTypeLabels[agreement.payer_type] : 'Pagador pendiente'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {agreementStatusLabels[agreement.agreement_status]} · {agreement.archived_at ? 'Archivado' : 'Activo'}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {agreement.commission_type ? commissionTypeLabels[agreement.commission_type] : 'Sin tipo de comisión'} · {formatAgreementCommission(agreement)}
                  </p>
                </div>
                <Link to={`/admin/acuerdos/${agreement.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver acuerdo</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function agreementCounterpartySummary(agreement: CommercialAgreementWithOpportunity) {
  if (agreement.counterparty_type === 'contact') return contactName(agreement.contact)
  if (agreement.counterparty_type === 'supplier') return agreement.supplier?.business_name ?? 'Proveedor no resuelto'
  return 'Contraparte pendiente'
}

function formatAgreementCommission(agreement: CommercialAgreementWithOpportunity) {
  if (!agreement.commission_type || agreement.commission_value === null) return 'Sin comisión'
  if (agreement.commission_type === 'percentage') return `${agreement.commission_value}%`
  return formatMoney(agreement.commission_value, agreement.currency)
}

function ActivityTimelineItem({
  activity,
  processing,
  onComplete,
  onReopen,
}: {
  activity: OpportunityActivityRecord
  processing: boolean
  onComplete: (activity: OpportunityActivityRecord) => void
  onReopen: (activity: OpportunityActivityRecord) => void
}) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-[#17202d]">{activityTypeLabels[activity.activity_type]} · {activity.title}</p>
        {activity.next_action_at && (
          <span className={`inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${activity.completed_at ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
            {activity.completed_at ? <CheckCircle2 size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
            {activity.completed_at ? 'Completada' : 'Próxima acción pendiente'}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{formatDateTime(activity.occurred_at)}</p>
      {activity.description && <p className="mt-2 text-sm text-slate-700">{activity.description}</p>}
      {activity.next_action_at && <p className="mt-2 text-sm font-medium text-[#235b3e]">Próxima acción: {formatDateTime(activity.next_action_at)}</p>}
      {activity.completed_at && <p className="mt-2 text-sm text-green-800">Finalización: {formatDateTime(activity.completed_at)}</p>}
      {activity.next_action_at && (
        <div className="mt-4 flex flex-wrap gap-3">
          {activity.completed_at ? (
            <button type="button" disabled={processing} onClick={() => onReopen(activity)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d] disabled:opacity-60">
              <RotateCcw size={18} aria-hidden="true" />
              {processing ? 'Procesando...' : 'Reabrir seguimiento'}
            </button>
          ) : (
            <button type="button" disabled={processing} onClick={() => onComplete(activity)} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <CheckCircle2 size={18} aria-hidden="true" />
              {processing ? 'Procesando...' : 'Marcar como completada'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

function OpportunitySuppliersSection({
  opportunityId,
  relations,
  availableSuppliers,
  status,
  setStatus,
  onRelationsChange,
  onReload,
}: {
  opportunityId: string
  relations: OpportunitySupplierWithSupplier[]
  availableSuppliers: SupplierWithContact[]
  status: string
  setStatus: (value: string) => void
  onRelationsChange: (items: OpportunitySupplierWithSupplier[]) => void
  onReload: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [editing, setEditing] = useState<OpportunitySupplierWithSupplier | null>(null)
  const [form, setForm] = useState<OpportunitySupplierFormValues>(emptySupplierRelation)
  const [processing, setProcessing] = useState(false)

  const filteredSuppliers = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return availableSuppliers
    return availableSuppliers.filter((supplier) =>
      [supplier.business_name, supplier.geographic_coverage, ...supplier.categories]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    )
  }, [availableSuppliers, query])

  async function linkSupplier() {
    if (!selectedSupplier || processing) return
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.linkSupplierToOpportunity({
      opportunity_id: opportunityId,
      supplier_id: selectedSupplier,
      notes: null,
      proposed_amount: null,
      currency: null,
    })
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible agregar el proveedor.')
      return
    }
    setSelectedSupplier('')
    setStatus('Proveedor agregado a la oportunidad.')
    onReload()
  }

  function startEdit(relation: OpportunitySupplierWithSupplier) {
    setEditing(relation)
    setForm({
      status: relation.status,
      proposed_amount: relation.proposed_amount === null ? '' : String(relation.proposed_amount),
      currency: relation.currency ?? '',
      notes: relation.notes ?? '',
    })
  }

  async function saveRelation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || processing) return
    if (form.proposed_amount.trim()) {
      const amount = Number(form.proposed_amount)
      if (!Number.isFinite(amount) || amount < 0) {
        setStatus('El monto propuesto debe ser cero o mayor.')
        return
      }
      if (!form.currency.trim()) {
        setStatus('Selecciona moneda para el monto propuesto.')
        return
      }
    }
    if (editing.status === 'discarded' && form.status !== 'discarded' && !window.confirm('¿Cambiar este proveedor desde descartado a otro estado?')) return
    setProcessing(true)
    setStatus('')
    const result = await adminRepository.updateOpportunitySupplier(editing.id, form)
    setProcessing(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible actualizar el proveedor considerado.')
      return
    }
    onRelationsChange(relations.map((relation) => (relation.id === result.data!.id ? { ...relation, ...result.data! } : relation)))
    setEditing(null)
    setStatus('Proveedor considerado actualizado.')
  }

  return (
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">Proveedores considerados</h2>
      <div className="min-h-6 text-sm text-slate-700" aria-live="polite">{status}</div>
      <div className="grid gap-3 rounded-md border border-slate-200 p-4">
        <h3 className="font-semibold text-[#17202d]">Agregar proveedor</h3>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Buscar proveedor
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <select value={selectedSupplier} onChange={(event) => setSelectedSupplier(event.target.value)} className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-3 text-base" aria-label="Proveedor">
            <option value="">Seleccionar proveedor</option>
            {filteredSuppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.business_name}</option>)}
          </select>
          <button type="button" disabled={!selectedSupplier || processing} onClick={() => void linkSupplier()} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            <Plus size={18} aria-hidden="true" />
            Agregar proveedor
          </button>
        </div>
      </div>

      {relations.length === 0 && <p className="text-sm text-slate-600">No hay proveedores considerados.</p>}
      <div className="grid gap-3">
        {relations.map((relation) => (
          <article key={relation.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link to={`/admin/proveedores/${relation.supplier.id}`} className="font-semibold text-[#17202d]">{relation.supplier.business_name}</Link>
                <p className="mt-2 text-sm text-slate-600">{contactName(relation.contact)}</p>
                <p className="mt-2 text-sm text-slate-600">{opportunitySupplierStatusLabels[relation.status]} · {formatMoney(relation.proposed_amount, relation.currency)}</p>
                {relation.notes && <p className="mt-2 text-sm text-slate-700">{relation.notes}</p>}
              </div>
              <button type="button" onClick={() => startEdit(relation)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Editar relación</button>
            </div>
          </article>
        ))}
      </div>

      {editing && (
        <form className="grid gap-4 rounded-md border border-slate-200 p-4 md:grid-cols-2" onSubmit={saveRelation}>
          <h3 className="font-semibold text-[#17202d] md:col-span-2">Editar relación</h3>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Estado *<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OpportunitySupplierStatus }))} className="rounded-md border border-slate-300 px-3 py-3 text-base">{opportunitySupplierStatuses.map((state) => <option key={state} value={state}>{opportunitySupplierStatusLabels[state]}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Monto propuesto<input type="number" value={form.proposed_amount} onChange={(event) => setForm((current) => ({ ...current, proposed_amount: event.target.value }))} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Moneda<select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className="rounded-md border border-slate-300 px-3 py-3 text-base"><option value="">Seleccionar</option><option value="CLP">CLP</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="Otra">Otra</option></select></label>
          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">Notas<textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label>
          <div className="flex gap-3 md:col-span-2">
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">Cancelar</button>
            <button type="submit" disabled={processing} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{processing ? 'Guardando...' : 'Guardar relación'}</button>
          </div>
        </form>
      )}
    </section>
  )
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
