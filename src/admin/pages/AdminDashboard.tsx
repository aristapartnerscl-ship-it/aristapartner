import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { DashboardActivity, DashboardData, DashboardProspectAction } from '../../types/admin'

const metricLabels: Array<[keyof DashboardData['metrics'], string]> = [
  ['proposalsOpen', 'Propuestas abiertas'],
  ['proposalsNegotiation', 'Propuestas en negociación'],
  ['proposalsAccepted', 'Propuestas aceptadas'],
  ['proposalsExpired', 'Propuestas vencidas'],
  ['prospectsTotal', 'Prospectos totales'],
  ['prospectsUncontacted', 'Prospectos sin contactar'],
  ['overdueProspectFollowUps', 'Prospectos vencidos'],
  ['prospectsConverted', 'Prospectos convertidos'],
  ['activeOpportunities', 'Oportunidades activas'],
  ['pendingFollowUpsToday', 'Seguimientos pendientes hoy'],
  ['newOpportunities', 'Oportunidades nuevas'],
  ['activeOpportunities', 'Oportunidades activas'],
  ['negotiations', 'Negociaciones en curso'],
  ['overdueFollowUps', 'Seguimientos vencidos'],
  ['pendingSuppliers', 'Proveedores pendientes'],
  ['newInquiries', 'Consultas nuevas'],
  ['newFormSubmissions', 'Recepciones nuevas'],
  ['prospectsDueToday', 'Prospectos para contactar hoy'],
  ['overdueProspectFollowUps', 'Seguimientos de prospectos vencidos'],
]

const quickLinks = [
  ['Nueva oportunidad', '/admin/oportunidades'],
  ['Nuevo proveedor', '/admin/proveedores'],
  ['Nuevo contacto', '/admin/contactos'],
  ['Nuevo prospecto', '/admin/prospeccion'],
  ['Nuevo acuerdo', '/admin/acuerdos/nuevo'],
  ['Ver seguimiento', '/admin/seguimiento'],
]

function metricHref(key: keyof DashboardData['metrics']) {
  if (key === 'proposalsOpen' || key === 'proposalsNegotiation') return '/admin/propuestas?status=negotiation'
  if (key === 'proposalsAccepted') return '/admin/propuestas?status=accepted'
  if (key === 'proposalsExpired') return '/admin/propuestas?vigencia=expired'
  if (key === 'prospectsTotal') return '/admin/prospeccion'
  if (key === 'prospectsUncontacted') return '/admin/prospeccion?view=uncontacted'
  if (key === 'prospectsConverted') return '/admin/prospeccion?view=converted'
  if (key === 'pendingFollowUpsToday') return '/admin/seguimiento?fecha=today'
  if (key === 'newOpportunities') return '/admin/oportunidades?status=new'
  if (key === 'activeOpportunities') return '/admin/oportunidades?status=active'
  if (key === 'negotiations') return '/admin/oportunidades?status=negotiating'
  if (key === 'overdueFollowUps') return '/admin/oportunidades?followup=overdue'
  if (key === 'pendingSuppliers') return '/admin/proveedores?status=pending'
  if (key === 'newInquiries') return '/admin/consultas?status=new'
  if (key === 'newFormSubmissions') return '/admin/recepciones?status=received'
  if (key === 'prospectsDueToday') return '/admin/prospeccion?view=today'
  if (key === 'overdueProspectFollowUps') return '/admin/prospeccion?view=overdue'
  return '/admin'
}

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function ProspectActionList({ items }: { items: DashboardProspectAction[] }) {
  if (items.length === 0) return <EmptyState title="Próximas acciones de prospectos" text="No hay acciones de prospectos para mostrar." />

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">Próximas acciones de prospectos</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-slate-200 p-4">
            <Link to={`/admin/prospeccion/${item.id}`} className="text-sm font-semibold text-[#17202d] hover:text-[#235b3e]">
              {item.full_name || item.company_name || 'Prospecto sin nombre'}
            </Link>
            <p className="mt-1 text-sm text-slate-600">{item.next_action_type || 'Seguimiento'} · {formatDate(item.next_action_at)}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function ActivityList({ title, items, dateField }: { title: string; items: DashboardActivity[]; dateField: 'next_action_at' | 'occurred_at' }) {
  if (items.length === 0) return <EmptyState title={title} text="No hay registros para mostrar." />

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-[#17202d]">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-slate-200 p-4">
            <Link to={`/admin/oportunidades/${item.opportunity_id}`} className="text-sm font-semibold text-[#17202d] hover:text-[#235b3e]">{item.title}</Link>
            <p className="mt-1 text-sm text-slate-600">{formatDate(item[dateField])}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RecentProspects({ items }: { items: DashboardData['recentProspects'] }) {
  if (!items) return <EmptyState title="Prospectos recientes" text="No fue posible consultar prospectos recientes." />
  if (items.length === 0) return <EmptyState title="Prospectos recientes" text="No hay prospectos recientes." />
  return <section className="rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-[#17202d]">Prospectos recientes</h2><div className="mt-4 grid gap-3">{items.map((item) => <Link key={item.id} to={`/admin/prospeccion/${item.id}`} className="rounded-md border border-slate-200 p-4 hover:border-[#235b3e]"><p className="font-semibold text-[#17202d]">{item.full_name || item.company_name || 'Prospecto sin nombre'}</p><p className="mt-1 text-sm text-slate-600">{item.company_name || 'Sin empresa'} · {item.status}</p></Link>)}</div></section>
}

function RecentOpportunities({ items }: { items: DashboardData['recentOpportunities'] }) {
  if (!items) return <EmptyState title="Oportunidades recientes" text="No fue posible consultar oportunidades recientes." />
  if (items.length === 0) return <EmptyState title="Oportunidades recientes" text="No hay oportunidades recientes." />
  return <section className="rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-[#17202d]">Oportunidades recientes</h2><div className="mt-4 grid gap-3">{items.map((item) => <Link key={item.id} to={`/admin/oportunidades/${item.id}`} className="rounded-md border border-slate-200 p-4 hover:border-[#235b3e]"><p className="font-semibold text-[#17202d]">{item.reference_code}</p><p className="mt-1 text-sm text-slate-600">{item.title}</p></Link>)}</div></section>
}

function RecentProposals({ items }: { items: DashboardData['recentProposals'] }) {
  if (!items) return <EmptyState title="Propuestas recientes" text="No fue posible consultar propuestas recientes." />
  if (items.length === 0) return <EmptyState title="Propuestas recientes" text="No hay propuestas recientes." />
  return <section className="rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold text-[#17202d]">Propuestas recientes</h2><div className="mt-4 grid gap-3">{items.map((item) => <Link key={item.id} to={`/admin/propuestas/${item.id}`} className="rounded-md border border-slate-200 p-4 hover:border-[#235b3e]"><p className="font-semibold text-[#17202d]">{item.proposal_code}</p><p className="mt-1 text-sm text-slate-600">{item.contact?.company_name || item.contact?.full_name || 'Sin contraparte'} · {item.total_amount.toLocaleString('es-CL')} {item.currency || ''} · {item.status}</p></Link>)}</div></section>
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    setLoading(true)
    setError('')
    const result = await adminRepository.getDashboardData()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDashboard(result.data)
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Dashboard" text="Vista inicial del panel privado de Arista Partners." />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Cargando métricas">
          {metricLabels.map(([, label]) => (
            <div key={label} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">No fue posible cargar el dashboard</h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void loadDashboard()} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Reintentar
          </button>
        </section>
      )}

      {!loading && dashboard && (
        <>
          {dashboard.hasMetricErrors && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Algunas métricas no pudieron consultarse. Se muestran con guion para evitar ceros engañosos.
            </div>
          )}
          {dashboard.activityError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Algunas actividades no pudieron cargarse.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metricLabels.map(([key, label]) => (
              <Link key={key} to={metricHref(key)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-[#235b3e]">
                <p className="text-sm text-slate-600">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#17202d]">{dashboard.metrics[key] ?? '—'}</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ActivityList title="Próximas acciones" items={dashboard.upcomingActions} dateField="next_action_at" />
            <ProspectActionList items={dashboard.upcomingProspectActions} />
            <ActivityList title="Actividad reciente" items={dashboard.recentActivities} dateField="occurred_at" />
            <RecentProspects items={dashboard.recentProspects} />
            <RecentOpportunities items={dashboard.recentOpportunities} />
            <RecentProposals items={dashboard.recentProposals} />
            <EmptyState title="Oportunidades que requieren atención" text="No hay oportunidades que requieran atención." />
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-[#17202d]">Accesos rápidos</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {quickLinks.map(([label, href]) => (
                  <Link key={href} to={href} className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-[#17202d] hover:border-[#235b3e]">
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
