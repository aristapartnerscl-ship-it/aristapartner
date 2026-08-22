import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type { ContactSelectorRecord, OpportunityRecord, OpportunityStatus, OpportunityType, Priority } from '../../types/admin'
import {
  contactName,
  formatDateTime,
  formatMoney,
  opportunityStatusLabels,
  opportunityStatuses,
  opportunityTypeLabels,
  priorities,
  priorityLabels,
} from '../opportunity-labels'

function nextActionFor(opportunityId: string, nextActions: Map<string, string | null>) {
  return nextActions.get(opportunityId) ?? null
}

export function AdminOpportunities() {
  const [searchParams] = useSearchParams()
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([])
  const [contacts, setContacts] = useState<ContactSelectorRecord[]>([])
  const [nextActions, setNextActions] = useState<Map<string, string | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState<OpportunityType | 'all'>((searchParams.get('type') as OpportunityType) || 'all')
  const [status, setStatus] = useState<OpportunityStatus | 'all'>((searchParams.get('status') as OpportunityStatus) || 'all')
  const [priority, setPriority] = useState<Priority | 'all'>('all')
  const [contactId, setContactId] = useState('all')
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get('followup') === 'overdue')

  async function load() {
    setLoading(true)
    setError('')
    const [opportunitiesResult, contactsResult, followUpsResult] = await Promise.all([
      adminRepository.listOpportunities(),
      adminRepository.listContactsForSelector(),
      adminRepository.listFollowUps(),
    ])
    setLoading(false)
    if (opportunitiesResult.error) {
      setError(opportunitiesResult.error)
      return
    }
    setOpportunities(opportunitiesResult.data)
    if (!contactsResult.error) setContacts(contactsResult.data)
    if (!followUpsResult.error) {
      const next = new Map<string, string | null>()
      followUpsResult.data.forEach((item) => {
        const current = next.get(item.opportunity_id)
        if (!current || (item.next_action_at && item.next_action_at < current)) next.set(item.opportunity_id, item.next_action_at)
      })
      setNextActions(next)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const contactMap = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const now = new Date().toISOString()

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return opportunities.filter((opportunity) => {
      const contact = opportunity.contact_id ? contactMap.get(opportunity.contact_id) : null
      const nextAction = nextActionFor(opportunity.id, nextActions)
      if (type !== 'all' && opportunity.opportunity_type !== type) return false
      if (status !== 'all' && opportunity.status !== status) return false
      if (priority !== 'all' && opportunity.priority !== priority) return false
      if (contactId !== 'all' && opportunity.contact_id !== contactId) return false
      if (overdueOnly && (!nextAction || nextAction >= now)) return false
      if (!normalized) return true
      return [opportunity.reference_code, opportunity.title, contactName(contact), contact?.company_name ?? '']
        .some((value) => value.toLowerCase().includes(normalized))
    })
  }, [contactId, contactMap, nextActions, now, opportunities, overdueOnly, priority, query, status, type])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Oportunidades"
        text="Necesidades de compra y ofertas comerciales gestionadas por Arista Partners."
        actionLabel="Nueva oportunidad"
        onAction={() => {
          window.location.href = '/admin/oportunidades/nueva'
        }}
      />

      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Buscar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código, título, contacto o empresa" className="rounded-md border border-slate-300 px-3 py-3 text-base" />
        </label>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Select label="Tipo" value={type} onChange={(value) => setType(value as OpportunityType | 'all')} options={[['all', 'Todas'], ['buy', 'Compra'], ['sell', 'Venta']]} />
          <Select label="Estado" value={status} onChange={(value) => setStatus(value as OpportunityStatus | 'all')} options={[['all', 'Todos'], ...opportunityStatuses.map((item) => [item, opportunityStatusLabels[item]] as [string, string])]} />
          <Select label="Prioridad" value={priority} onChange={(value) => setPriority(value as Priority | 'all')} options={[['all', 'Todas'], ...priorities.map((item) => [item, priorityLabels[item]] as [string, string])]} />
          <Select label="Contacto" value={contactId} onChange={setContactId} options={[['all', 'Todos'], ...contacts.map((contact) => [contact.id, contactName(contact)] as [string, string])]} />
          <label className="flex min-w-0 items-start gap-2 rounded-md border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 sm:items-center">
            <input type="checkbox" checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
            Próxima acción vencida
          </label>
        </div>
      </section>

      {loading && <div className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white" />}

      {!loading && error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">No fue posible cargar oportunidades</h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Reintentar</button>
        </section>
      )}

      {!loading && !error && opportunities.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-semibold text-[#17202d]">Aún no hay oportunidades</h2>
          <p className="mt-2 text-sm text-slate-600">Crea la primera oportunidad desde un contacto existente.</p>
          <Link to="/admin/oportunidades/nueva" className="mt-5 inline-flex rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Nueva oportunidad</Link>
        </section>
      )}

      {!loading && !error && opportunities.length > 0 && visible.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">No hay oportunidades que coincidan con los filtros.</section>
      )}

      {!loading && !error && visible.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="hidden max-w-full overflow-x-auto lg:block">
            <table className="min-w-[1100px] w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {['Código', 'Oportunidad', 'Tipo', 'Contacto', 'Estado', 'Prioridad', 'Valor estimado', 'Próxima acción', 'Última actualización', 'Acción'].map((head) => <th key={head} className="px-3 py-3">{head}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visible.map((opportunity) => {
                  const contact = opportunity.contact_id ? contactMap.get(opportunity.contact_id) : null
                  return (
                    <tr key={opportunity.id}>
                      <td className="px-3 py-4 font-semibold text-[#17202d]">{opportunity.reference_code}</td>
                      <td className="px-3 py-4">{opportunity.title}</td>
                      <td className="px-3 py-4">{opportunityTypeLabels[opportunity.opportunity_type]}</td>
                      <td className="px-3 py-4">{contactName(contact)}</td>
                      <td className="px-3 py-4">{opportunityStatusLabels[opportunity.status]}</td>
                      <td className="px-3 py-4">{priorityLabels[opportunity.priority]}</td>
                      <td className="px-3 py-4">{formatMoney(opportunity.estimated_value, opportunity.currency)}</td>
                      <td className="px-3 py-4">{formatDateTime(nextActionFor(opportunity.id, nextActions))}</td>
                      <td className="px-3 py-4">{formatDateTime(opportunity.updated_at)}</td>
                      <td className="px-3 py-4"><Link to={`/admin/oportunidades/${opportunity.id}`} className="font-semibold text-[#235b3e]">Ver</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {visible.map((opportunity) => {
              const contact = opportunity.contact_id ? contactMap.get(opportunity.contact_id) : null
              return (
                <article key={opportunity.id} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-[#235b3e]">{opportunity.reference_code}</p>
                  <h2 className="mt-1 font-semibold text-[#17202d]">{opportunity.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{opportunityTypeLabels[opportunity.opportunity_type]} · {opportunityStatusLabels[opportunity.status]} · {priorityLabels[opportunity.priority]}</p>
                  <p className="mt-2 text-sm text-slate-700">{contactName(contact)}</p>
                  <p className="mt-2 text-sm text-slate-600">Próxima acción: {formatDateTime(nextActionFor(opportunity.id, nextActions))}</p>
                  <Link to={`/admin/oportunidades/${opportunity.id}`} className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">Ver</Link>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
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
