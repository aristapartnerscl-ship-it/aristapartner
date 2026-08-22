import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Clock3, RotateCcw } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type { FollowUpRecord, OpportunityActivityRecord } from '../../types/admin'
import { activityTypeLabels, contactName, formatDateTime } from '../opportunity-labels'
import { useAdminAuth } from '../useAdminAuth'

type GroupKey = 'overdue' | 'today' | 'next7' | 'later'

const groupLabels: Record<GroupKey, string> = {
  overdue: 'Vencidas',
  today: 'Hoy',
  next7: 'Próximos 7 días',
  later: 'Más adelante',
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function groupFor(value: string): GroupKey {
  const date = new Date(value)
  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const next7 = new Date(today)
  next7.setDate(today.getDate() + 8)

  if (date < today) return 'overdue'
  if (date < tomorrow) return 'today'
  if (date < next7) return 'next7'
  return 'later'
}

function mergeActivity(record: FollowUpRecord, activity: OpportunityActivityRecord, completedByName: string | null): FollowUpRecord {
  return {
    ...record,
    ...activity,
    completedByProfile: activity.completed_by ? { id: activity.completed_by, full_name: completedByName } : null,
  }
}

export function AdminFollowUps() {
  const auth = useAdminAuth()
  const [items, setItems] = useState<FollowUpRecord[]>([])
  const [completed, setCompleted] = useState<FollowUpRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  function announce(message: string) {
    setStatus(message)
    window.setTimeout(() => statusRef.current?.focus(), 0)
  }

  async function load() {
    setLoading(true)
    setError('')
    const [pendingResult, completedResult] = await Promise.all([
      adminRepository.listFollowUps(),
      adminRepository.listCompletedFollowUps(),
    ])
    setLoading(false)
    if (pendingResult.error) {
      setError(pendingResult.error)
      return
    }
    setItems(pendingResult.data)
    if (!completedResult.error) setCompleted(completedResult.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const groups = useMemo(() => {
    const grouped: Record<GroupKey, FollowUpRecord[]> = { overdue: [], today: [], next7: [], later: [] }
    items.forEach((item) => {
      if (!item.next_action_at || item.completed_at) return
      grouped[groupFor(item.next_action_at)].push(item)
    })
    return grouped
  }, [items])

  async function complete(item: FollowUpRecord) {
    if (!window.confirm('¿Marcar este seguimiento como completado?')) return
    setProcessingId(item.id)
    setStatus('')
    const result = await adminRepository.completeFollowUp(item.id)
    setProcessingId(null)
    if (result.error || !result.data) {
      announce(result.error ?? 'No fue posible completar el seguimiento.')
      return
    }
    const nextCompleted = mergeActivity(item, result.data, auth.profile?.full_name ?? auth.user?.email ?? null)
    setItems((current) => current.filter((followUp) => followUp.id !== item.id))
    setCompleted((current) => [nextCompleted, ...current.filter((followUp) => followUp.id !== item.id)].slice(0, 50))
    announce('Seguimiento marcado como completado.')
  }

  async function reopen(item: FollowUpRecord) {
    if (!window.confirm('¿Reabrir este seguimiento?')) return
    setProcessingId(item.id)
    setStatus('')
    const result = await adminRepository.reopenFollowUp(item.id)
    setProcessingId(null)
    if (result.error || !result.data) {
      announce(result.error ?? 'No fue posible reabrir el seguimiento.')
      return
    }
    const reopened = mergeActivity(item, result.data, null)
    setCompleted((current) => current.filter((followUp) => followUp.id !== item.id))
    setItems((current) => [...current.filter((followUp) => followUp.id !== item.id), reopened].sort((a, b) => new Date(a.next_action_at!).getTime() - new Date(b.next_action_at!).getTime()))
    announce('Seguimiento reabierto.')
  }

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Seguimiento" text="Próximas acciones pendientes y completadas en oportunidades activas." />
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        Las acciones completadas salen de pendientes y se conservan en el historial de cada oportunidad.
      </div>
      <div ref={statusRef} tabIndex={-1} className="min-h-6 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-[#17202d]" aria-live="polite">
        {status}
      </div>

      {loading && <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />}
      {!loading && error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">No fue posible cargar seguimiento</h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Reintentar
          </button>
        </section>
      )}
      {!loading && !error && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {(Object.keys(groupLabels) as GroupKey[]).map((key) => (
              <section key={key} className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-[#17202d]">{groupLabels[key]}</h2>
                <div className="mt-4 grid gap-3">
                  {groups[key].length === 0 && <p className="text-sm text-slate-600">Sin acciones registradas.</p>}
                  {groups[key].map((item) => (
                    <FollowUpCard
                      key={item.id}
                      item={item}
                      processing={processingId === item.id}
                      actionLabel="Marcar como completada"
                      actionIcon="complete"
                      onAction={() => void complete(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <button
              type="button"
              onClick={() => setShowCompleted((value) => !value)}
              className="flex w-full items-center justify-between gap-3 text-left text-xl font-semibold text-[#17202d]"
              aria-expanded={showCompleted}
            >
              Completadas
              <span className="text-sm font-medium text-slate-600">{showCompleted ? 'Ocultar' : 'Mostrar'}</span>
            </button>
            {showCompleted && (
              <div className="mt-4 grid gap-3">
                {completed.length === 0 && <p className="text-sm text-slate-600">Sin seguimientos completados recientemente.</p>}
                {completed.map((item) => (
                  <FollowUpCard
                    key={item.id}
                    item={item}
                    completed
                    processing={processingId === item.id}
                    actionLabel="Reabrir"
                    actionIcon="reopen"
                    onAction={() => void reopen(item)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function FollowUpCard({
  item,
  completed = false,
  processing,
  actionLabel,
  actionIcon,
  onAction,
}: {
  item: FollowUpRecord
  completed?: boolean
  processing: boolean
  actionLabel: string
  actionIcon: 'complete' | 'reopen'
  onAction: () => void
}) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#17202d]">{formatDateTime(item.next_action_at)}</p>
          <p className="mt-1 text-sm text-slate-700">{item.opportunity.reference_code} · {item.opportunity.title}</p>
          <p className="mt-1 text-sm text-slate-600">{activityTypeLabels[item.activity_type]} · {item.title}</p>
          {item.contact && <p className="mt-1 text-sm text-slate-600">{contactName(item.contact)}</p>}
          {completed && (
            <div className="mt-2 text-sm text-slate-700">
              <p>Finalización: {formatDateTime(item.completed_at)}</p>
              {item.completedByProfile?.full_name && <p>Completado por: {item.completedByProfile.full_name}</p>}
            </div>
          )}
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${completed ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}>
          {completed ? <CheckCircle2 size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
          {completed ? 'Completada' : 'Pendiente'}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to={`/admin/oportunidades/${item.opportunity.id}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">
          Ver oportunidad
        </Link>
        <button
          type="button"
          disabled={processing}
          onClick={onAction}
          className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionIcon === 'complete' ? <CheckCircle2 size={18} aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
          {processing ? 'Procesando...' : actionLabel}
        </button>
      </div>
    </article>
  )
}
