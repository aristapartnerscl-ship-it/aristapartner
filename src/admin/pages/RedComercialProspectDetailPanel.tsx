import { Archive, Download, FileText, MoreHorizontal, Plus, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { adminRepository } from '../../repositories'
import type { CollaboratorRecord, RedComercialProspectDetailRecord, RedComercialProspectPanelRecord, RedComercialProspectStatus, RepresentedCompanyRecord } from '../../types/admin'
import { isRedComercialAdmin } from '../red-comercial-utils'
import { getOpportunityFinancialCue, getOpportunityPresentation } from '../opportunity-status'
import { getProspectStatusPresentation } from '../prospect-status'
import { useAdminAuth } from '../useAdminAuth'

type PanelProps = {
  prospect: RedComercialProspectDetailRecord
  opportunityId?: string
  onClose: () => void
  onEdit?: () => void
  onActivity?: () => void
  onArchive?: () => void
  onSchedule?: () => void
  onChanged?: () => void
}

const statuses: Array<[RedComercialProspectStatus, string]> = [
  ['to_contact', 'Por contactar'], ['contacted_no_response', 'Contactado - sin respuesta'], ['responded', 'Respondio'],
  ['follow_up', 'En seguimiento'], ['interested', 'Interesado'], ['meeting_scheduled', 'Reunion agendada'],
  ['agreed', 'Acordado'], ['not_interested', 'No interesado'], ['archived', 'Archivado'],
]

const statusTone: Record<string, string> = {
  to_contact: 'bg-stone-100 text-stone-700', contacted_no_response: 'bg-amber-50 text-amber-800', responded: 'bg-sky-50 text-sky-800',
  follow_up: 'bg-blue-50 text-blue-800', interested: 'bg-emerald-50 text-emerald-800', meeting_scheduled: 'bg-violet-50 text-violet-800',
  agreed: 'bg-[#e7f0ea] text-[#235b3e]', not_interested: 'bg-rose-50 text-rose-800', archived: 'bg-slate-100 text-slate-600',
}

function labelForStatus(status: string) { return statuses.find(([value]) => value === status)?.[1] ?? status }
function person(value: string | null | undefined) { return value?.trim().split(/\s+/).map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1).toLowerCase()}`).join(' ') || 'Sin definir' }
function date(value: string | null | undefined) { return value ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'short' }).format(new Date(value)) : 'Sin definir' }
function money(value: number | null, currency: string) { return value == null ? 'Por definir' : new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value) }

function StatusBadge({ status }: { status: string }) {
  const presentation = getProspectStatusPresentation(status)
  return <span className={`inline-flex h-6 max-w-full items-center rounded-full border px-2 text-[10.5px] font-semibold leading-none ${presentation.backgroundClass} ${presentation.borderClass} ${presentation.textClass}`}>{presentation.label}</span>
}

function PanelSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="border-b border-[#eee8dd] py-2 last:border-b-0"><div className="mb-1.5 flex items-center justify-between gap-2"><h3 className="text-[12.5px] font-semibold text-[#17202d]">{title}</h3>{action}</div>{children}</section>
}

function compensationText(opportunity: NonNullable<RedComercialProspectPanelRecord['opportunities']>[number]) {
  if (!opportunity.attributed_collaborator_id || !opportunity.collaborator_compensation_type) return 'Sin definir'
  if (opportunity.collaborator_compensation_type === 'fixed_amount') return money(opportunity.collaborator_compensation_amount, opportunity.currency)
  return opportunity.collaborator_compensation_rate == null ? 'Sin definir' : `${opportunity.collaborator_compensation_rate}%`
}

function OpportunityFinancialBadge({ kind, value }: { kind: 'payment' | 'commission'; value: string }) {
  const presentation = getOpportunityPresentation(kind, value)
  return <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[10.5px] font-semibold ${presentation.className}`}>{presentation.label}</span>
}

function ReadOnlyOpportunity({ opportunity, attributedName, isAttributedUser }: { opportunity: NonNullable<RedComercialProspectPanelRecord['opportunities']>[number]; attributedName: string | null; isAttributedUser: boolean }) {
  const cue = getOpportunityFinancialCue(opportunity.payment_status, opportunity.commission_status)
  const ownParticipation = Boolean(opportunity.attributed_collaborator_id && isAttributedUser)
  return <div data-readonly="true" className="grid gap-2 text-[12px]">
    <div className="grid gap-1.5 rounded-md border border-[#eee8dd] bg-[#fbfaf7] p-2">
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Estado cliente</span><OpportunityFinancialBadge kind="payment" value={opportunity.payment_status} /></div>
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{ownParticipation ? 'Mi participacion' : 'Participacion del colaborador'}</span><OpportunityFinancialBadge kind="commission" value={opportunity.commission_status} /></div>
      {opportunity.payment_status === 'paid' && ['to_validate', 'generated', 'pending_payment'].includes(opportunity.commission_status) && <p className="rounded border border-amber-100 bg-amber-50 px-2 py-1.5 text-[11px] font-semibold text-amber-800">Cliente pago · Tu participacion esta pendiente</p>}
    </div>
    <div className="grid text-[12px]">
      <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">Control actual</span><span className="text-[11.5px] text-[#17202d]">{getOpportunityPresentation('control', opportunity.control_mode).label}</span></div>
      <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">Resultado</span><span className="text-[11.5px] text-[#17202d]">{getOpportunityPresentation('result', opportunity.result_status).label}</span></div>
      <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">Contrato</span><span className="text-[11.5px] text-[#17202d]">{getOpportunityPresentation('contract', opportunity.contract_status).label}</span></div>
      <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">Colaborador atribuido</span><span className={attributedName ? 'text-[11.5px] text-[#17202d]' : 'text-[11.5px] text-slate-400'}>{attributedName ? person(attributedName) : 'Sin atribuir'}</span></div>
      {ownParticipation && <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2"><span className="text-[10.5px] font-semibold text-slate-500">Mi participacion</span><span className="font-semibold text-[#17202d]">{compensationText(opportunity)}</span></div>}
    </div>
    {cue.label === 'Participacion pagada' && <p className="text-[11px] font-semibold text-emerald-700">✓ Participacion pagada</p>}
  </div>
}

function OpportunityEditor({ opportunity, collaborators, onChange, disabled }: { opportunity: NonNullable<RedComercialProspectPanelRecord['opportunities']>[number]; collaborators: CollaboratorRecord[]; onChange: (payload: Record<string, unknown>) => Promise<void>; disabled?: boolean }) {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const readOnly = disabled ?? !admin
  const select = (key: string, value: string) => { void onChange({ [key]: value }) }
  const labels: Record<string, string> = {
    collaborator: 'Gestion colaborador', arista: 'Gestion Arista', shared: 'Gestion compartida',
    in_process: 'En proceso', won: 'Ganada', lost: 'Perdida', cancelled: 'Cancelada',
    not_required: 'No requerido', pending: 'Pendiente', sent: 'Enviado', under_review: 'En revision',
    signed: 'Firmado', not_signed: 'No firmado', withdrawn: 'Retirado', not_applicable: 'No aplica',
    partial: 'Parcial', paid: 'Pagado', overdue: 'Vencido', refunded: 'Reembolsado',
    not_generated: 'No generada', to_validate: 'Por validar', generated: 'Generada', pending_payment: 'Pago pendiente', void: 'Anulada',
  }
  const attributedName = opportunity.attributed_collaborator_name || collaborators.find((item) => item.id === opportunity.attributed_collaborator_id)?.full_name || null
  const isAttributedUser = Boolean(opportunity.attributed_collaborator_id && opportunity.attributed_collaborator_id === auth.user?.id)
  if (readOnly) return <ReadOnlyOpportunity opportunity={opportunity} attributedName={attributedName} isAttributedUser={isAttributedUser} />
  const readOnlyRow = (label: string, value: string) => <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">{label}</span><span className="text-[11.5px] text-[#17202d]">{labels[value] ?? value}</span></div>
  const detailRow = (label: string, value: string | null) => <div className="grid min-h-[28px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">{label}</span><span className={value ? 'text-[11.5px] text-[#17202d]' : 'text-[11.5px] text-slate-400'}>{value || 'Sin definir'}</span></div>
  if (readOnly) return <div data-readonly="true" className="grid text-[12px]">{readOnlyRow('Control actual', opportunity.control_mode)}{readOnlyRow('Resultado', opportunity.result_status)}{readOnlyRow('Contrato', opportunity.contract_status)}{readOnlyRow('Pago cliente', opportunity.payment_status)}{readOnlyRow('Comision colaborador', opportunity.commission_status)}{detailRow('Colaborador atribuido', attributedName ? person(attributedName) : null)}{opportunity.attributed_collaborator_id && isAttributedUser && detailRow('Tu participacion atribuida', compensationText(opportunity))}</div>
  return <div className="grid gap-1.5 text-[12px]">
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-slate-500">Control actual<select value={opportunity.control_mode} onChange={(event) => select('control_mode', event.target.value)} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="collaborator">Gestion colaborador</option><option value="arista">Gestion Arista</option><option value="shared">Gestion compartida</option></select></label><label className="grid gap-1 text-slate-500">Resultado<select value={opportunity.result_status} onChange={(event) => select('result_status', event.target.value)} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="in_process">En proceso</option><option value="won">Ganada</option><option value="lost">Perdida</option><option value="cancelled">Cancelada</option></select></label></div>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-slate-500">Contrato<select value={opportunity.contract_status} onChange={(event) => select('contract_status', event.target.value)} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="not_required">No requerido</option><option value="pending">Pendiente</option><option value="sent">Enviado</option><option value="under_review">En revision</option><option value="signed">Firmado</option><option value="not_signed">No firmado</option><option value="withdrawn">Retirado</option><option value="cancelled">Cancelado</option></select></label><label className="grid gap-1 text-slate-500">Pago cliente<select value={opportunity.payment_status} onChange={(event) => select('payment_status', event.target.value)} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="not_applicable">No aplica</option><option value="pending">Pendiente</option><option value="partial">Parcial</option><option value="paid">Pagado</option><option value="overdue">Vencido</option><option value="refunded">Reembolsado</option><option value="cancelled">Cancelado</option></select></label></div>
    <label className="grid gap-1 text-slate-500">Comision colaborador<select value={opportunity.commission_status} onChange={(event) => select('commission_status', event.target.value)} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="not_generated">No generada</option><option value="to_validate">Por validar</option><option value="generated">Generada</option><option value="pending_payment">Pago pendiente</option><option value="paid">Pagada</option><option value="void">Anulada</option></select></label>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-slate-500">Colaborador atribuido<select value={opportunity.attributed_collaborator_id ?? ''} onChange={(event) => void onChange({ attributed_collaborator_id: event.target.value })} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="">Sin atribuir</option>{collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || collaborator.email}</option>)}</select></label><label className="grid gap-1 text-slate-500">Tipo de participacion<select value={opportunity.collaborator_compensation_type ?? ''} onChange={(event) => void onChange({ collaborator_compensation_type: event.target.value })} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]"><option value="">Sin participacion</option><option value="percentage">Porcentaje</option><option value="fixed_amount">Monto fijo</option></select></label></div>
    <div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-slate-500">Porcentaje<input type="number" min="0" step="0.01" value={opportunity.collaborator_compensation_rate ?? ''} onChange={(event) => void onChange({ collaborator_compensation_rate: event.target.value })} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]" /></label><label className="grid gap-1 text-slate-500">Monto fijo<input type="number" min="0" step="1" value={opportunity.collaborator_compensation_amount ?? ''} onChange={(event) => void onChange({ collaborator_compensation_amount: event.target.value })} className="rounded border border-[#d7d0c4] bg-white px-2 py-1.5 text-[#17202d]" /></label></div>
    {detailRow('Participacion atribuida', compensationText(opportunity))}
  </div>
}

function NewOpportunityModal({ prospectId, collaborators, isAdmin, onClose, onSaved }: { prospectId: string; collaborators: CollaboratorRecord[]; isAdmin: boolean; onClose: () => void; onSaved: (data: RedComercialProspectPanelRecord) => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('')
    const data = new FormData(event.currentTarget)
    const compensationType = String(data.get('compensation_type') ?? '')
    const attributedCollaboratorId = String(data.get('attributed_collaborator_id') ?? '')
    if (isAdmin && compensationType && !attributedCollaboratorId) {
      setSaving(false); setError('Selecciona un colaborador atribuido para registrar participacion.')
      return
    }
    const result = await adminRepository.createRedComercialOpportunity(prospectId, { control_mode: data.get('control_mode'), attributed_collaborator_id: attributedCollaboratorId, collaborator_compensation_type: compensationType, collaborator_compensation_rate: data.get('compensation_rate') })
    setSaving(false)
    if (result.error || !result.data) { setError(result.error ?? 'No fue posible crear la oportunidad.'); return }
    onSaved(result.data); onClose()
  }
  return <AdminDetailModal title="Crear oportunidad" onClose={onClose}><form className="grid gap-3 text-sm" onSubmit={(event) => void submit(event)}>{error && <p className="rounded bg-rose-50 px-3 py-2 text-rose-800">{error}</p>}<label className="grid gap-1 font-medium text-slate-700">Control actual<select name="control_mode" defaultValue="collaborator" className="rounded border border-[#c9c1b4] px-3 py-2"><option value="collaborator">Gestion colaborador</option><option value="arista">Gestion Arista</option><option value="shared">Gestion compartida</option></select></label>{isAdmin && <label className="grid gap-1 font-medium text-slate-700">Colaborador atribuido<select name="attributed_collaborator_id" defaultValue="" className="rounded border border-[#c9c1b4] px-3 py-2"><option value="">Sin atribuir</option>{collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.full_name || collaborator.email}</option>)}</select></label>}<label className="grid gap-1 font-medium text-slate-700">Tipo de participacion<select name="compensation_type" defaultValue="" className="rounded border border-[#c9c1b4] px-3 py-2"><option value="">Sin participacion</option><option value="percentage">Porcentaje</option><option value="fixed_amount">Monto fijo</option></select></label><label className="grid gap-1 font-medium text-slate-700">Participacion atribuida<input name="compensation_rate" type="number" min="0" step="0.01" className="rounded border border-[#c9c1b4] px-3 py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-[#c9c1b4] px-3 py-2 font-semibold">Cancelar</button><button disabled={saving} className="rounded bg-[#235b3e] px-3 py-2 font-semibold text-white">Crear oportunidad</button></div></form></AdminDetailModal>
}

function CrossOpportunityModal({ prospectId, companies, currentCompanyId, onClose, onSaved }: { prospectId: string; companies: RepresentedCompanyRecord[]; currentCompanyId: string; onClose: () => void; onSaved: (data: RedComercialProspectPanelRecord) => void }) {
  const [error, setError] = useState(''); const [saving, setSaving] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); const data = new FormData(event.currentTarget); const result = await adminRepository.createRedComercialCrossOpportunity(prospectId, String(data.get('target_company_id') ?? ''), String(data.get('reason') ?? '')); setSaving(false); if (result.error || !result.data) { setError(result.error ?? 'No fue posible registrar la oportunidad.'); return } onSaved(result.data); onClose() }
  return <AdminDetailModal title="Agregar oportunidad cruzada" onClose={onClose}><form className="grid gap-3 text-sm" onSubmit={(event) => void submit(event)}>{error && <p className="rounded bg-rose-50 px-3 py-2 text-rose-800">{error}</p>}<label className="grid gap-1 font-medium text-slate-700">Empresa Arista destino *<select name="target_company_id" required className="rounded border border-[#c9c1b4] px-3 py-2"><option value="">Seleccionar</option>{companies.filter((company) => company.id !== currentCompanyId && company.status === 'active').map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label className="grid gap-1 font-medium text-slate-700">Por que detectaste esta oportunidad? *<textarea name="reason" required rows={4} className="rounded border border-[#c9c1b4] px-3 py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-[#c9c1b4] px-3 py-2 font-semibold">Cancelar</button><button disabled={saving} className="rounded bg-[#235b3e] px-3 py-2 font-semibold text-white">Registrar oportunidad</button></div></form></AdminDetailModal>
}

export function RedComercialProspectDetailPanel({ prospect, opportunityId, onClose, onEdit, onActivity, onArchive, onSchedule, onChanged }: PanelProps) {
  const auth = useAdminAuth(); const admin = isRedComercialAdmin(auth.profile)
  const [tab, setTab] = useState<'summary' | 'activities' | 'files' | 'notes'>('summary')
  const [panel, setPanel] = useState<RedComercialProspectPanelRecord | null>(null)
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [opportunityModal, setOpportunityModal] = useState(false); const [crossModal, setCrossModal] = useState(false); const [noteModal, setNoteModal] = useState(false); const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([])
  const current = panel?.prospect ?? prospect
  const opportunity = panel?.opportunities[0]

  const loadPanel = useCallback(async () => { setLoading(true); setError(''); const result = opportunityId ? await adminRepository.getRedComercialOpportunityPanel(opportunityId) : await adminRepository.getRedComercialProspectPanel(prospect.id); if (result.data) setPanel(result.data); else if (result.error) { setPanel(null); setError(result.error) }; setLoading(false) }, [opportunityId, prospect.id])
  useEffect(() => { void loadPanel() }, [loadPanel])
  useEffect(() => { if (!admin) return; adminRepository.listCollaborators().then((result) => setCollaborators(result.data)) }, [admin])
  useEffect(() => { function onKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') onClose() } document.addEventListener('keydown', onKeyDown); return () => document.removeEventListener('keydown', onKeyDown) }, [onClose])
  async function refresh(data?: RedComercialProspectPanelRecord | null) { if (data) setPanel(data); else await loadPanel(); onChanged?.() }
  async function updateOpportunity(payload: Record<string, unknown>) { if (!opportunity) return; const result = await adminRepository.updateRedComercialOpportunity(opportunity.id, payload); if (result.error) setError(result.error); else await refresh(result.data) }
  async function changeStatus(status: RedComercialProspectStatus) { const result = await adminRepository.updateRedComercialProspect(current.id, { status }); if (result.error) setError(result.error); else await refresh() }
  async function loadCompanies() { const result = admin ? await adminRepository.listRepresentedCompanies() : await adminRepository.listMyRepresentedCompanies(); setCompanies(result.data) }
  async function submitNote(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const body = String(new FormData(event.currentTarget).get('body') ?? ''); const result = await adminRepository.createRedComercialProspectNote(current.id, body); if (result.error) setError(result.error); else { setNoteModal(false); await refresh(result.data) } }
  async function uploadFile(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const result = await adminRepository.uploadRedComercialProspectFile(current.id, file); if (result.error) setError(result.error); else await refresh(result.data) }
  async function downloadFile(path: string) { const result = await adminRepository.createRedComercialProspectFileSignedUrl(path); if (result.data) window.open(result.data, '_blank', 'noopener,noreferrer'); else setError(result.error ?? 'No fue posible abrir el archivo.') }

  return <aside className="min-h-[640px] min-w-0 w-full rounded-lg border border-[#ddd6ca] bg-white shadow-[0_6px_20px_rgba(23,32,45,0.06)] xl:fixed xl:right-0 xl:top-[var(--admin-topbar-height)] xl:bottom-0 xl:z-40 xl:h-[calc(100vh-var(--admin-topbar-height))] xl:min-h-0 xl:min-w-[390px] xl:w-[var(--detail-panel-width)] xl:overflow-y-auto">
    <div className="sticky top-0 z-10 border-b border-[#eee8dd] bg-white px-3 py-2.5"><div className="flex items-start gap-2.5"><CompanyLogo company={{ name: current.company_name, logo_storage_path: current.logo_storage_path }} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-[15px] font-semibold text-[#17202d]">{current.company_name}</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Empresa prospecto</p></div><button type="button" className="rounded border border-[#c9c1b4] p-1.5 text-[#17202d]" aria-label="Cerrar panel" onClick={onClose}><X size={15} /></button></div><div className="mt-2 flex items-center gap-1.5"><select aria-label="Estado del prospecto" value={current.status} onChange={(event) => void changeStatus(event.target.value as RedComercialProspectStatus)} className={`rounded-full border-0 px-2 py-1 text-[11px] font-semibold outline-none ${statusTone[current.status] ?? 'bg-slate-100 text-slate-700'}`}>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{current.can_view_detail && onEdit && <button type="button" onClick={onEdit} className="rounded border border-[#c9c1b4] px-2 py-1 text-[11px] font-semibold">Editar</button>}{current.can_view_detail && onActivity && <button type="button" onClick={onActivity} className="rounded bg-[#235b3e] px-2 py-1 text-[11px] font-semibold text-white">+ Actividad</button>}{current.can_view_detail && onSchedule && <button type="button" onClick={onSchedule} className="rounded border border-[#c9c1b4] px-2 py-1 text-[11px] font-semibold">Reprogramar</button>}{current.can_view_detail && onArchive && <button type="button" onClick={onArchive} className="rounded border border-[#c9c1b4] p-1" aria-label={current.is_archived ? 'Restaurar prospecto' : 'Archivar prospecto'}><Archive size={13} /></button>}<button type="button" className="ml-auto rounded border border-[#c9c1b4] p-1" aria-label="Mas acciones"><MoreHorizontal size={14} /></button></div><div className="mt-2 grid grid-cols-4 border-b border-[#eee8dd] text-[11px]">{(['summary', 'activities', 'files', 'notes'] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`px-1 py-2 font-semibold ${tab === item ? 'border-b-2 border-[#235b3e] text-[#235b3e]' : 'text-slate-500'}`}>{item === 'summary' ? 'Resumen' : item === 'activities' ? 'Actividades' : item === 'files' ? 'Archivos' : 'Notas'}</button>)}</div></div>
    <div className="px-3 pb-5 text-[12px]">{error && <p className="mt-2 rounded bg-rose-50 px-2.5 py-2 text-rose-800">{error}</p>}{loading ? <p className="py-5 text-slate-500">Cargando panel...</p> : !current.can_view_detail ? <div className="py-5 text-slate-600">Este prospecto esta siendo gestionado por otro colaborador.<br />Responsable: {person(current.owner?.full_name)}</div> : <>
      {tab === 'summary' && <><PanelSection title="Informacion general" action={onEdit && <button type="button" onClick={onEdit} className="text-[11px] font-semibold text-[#235b3e]">Editar</button>}><div>{[['Empresa', current.company_name], ['Contacto', current.contact_name], ['Cargo / area', current.contact_role], ['Email', current.contact_email], ['Telefono', current.contact_phone], ['Canal', current.channel], ['Responsable', current.owner?.full_name ? person(current.owner.full_name) : null], ['Coasignados', current.collaborators.map((item) => person(item.full_name)).join(', ')], ['Fecha primer contacto', date(current.first_contact_at)], ['Ultimo contacto', date(current.last_contact_at)], ['Proximo seguimiento', date(current.next_followup_at)]].map(([label, value]) => <div key={label} className="grid min-h-[32px] grid-cols-[118px_minmax(0,1fr)] items-center gap-2 border-b border-[#f1ece3]"><span className="text-[10.5px] font-semibold text-slate-500">{label}</span><span className={value ? 'text-[#17202d]' : 'text-slate-400'}>{value || 'Sin definir'}</span></div>)}</div></PanelSection><PanelSection title="Estado de la venta" action={!opportunity && !error && <button type="button" onClick={() => setOpportunityModal(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#235b3e]"><Plus size={13} />Crear oportunidad</button>}>{!opportunity ? error ? <p className="text-slate-500">No fue posible cargar el estado de la venta.</p> : <p className="text-slate-500">Aun no existe una oportunidad comercial.</p> : <><div className="mb-2 flex items-center justify-between"><StatusBadge status={opportunity.result_status} /><span className="text-[11px] text-slate-500">{opportunity.control_mode === 'arista' ? 'Gestion entregada a Arista' : opportunity.control_mode === 'shared' ? 'Gestion compartida' : 'Gestion colaborador'}</span></div><OpportunityEditor opportunity={opportunity} collaborators={collaborators} onChange={updateOpportunity} /></>}</PanelSection><PanelSection title="Oportunidad cruzada" action={<button type="button" onClick={() => { setCrossModal(true); void loadCompanies() }} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#235b3e]"><Plus size={13} />Agregar</button>}><p className="mb-2 text-[11px] text-slate-500">Ves potencial para otra empresa de Arista?</p>{panel?.cross_opportunities.map((item) => <div key={item.id} className="mb-1.5 flex items-start gap-2 rounded bg-[#fbfaf7] px-2.5 py-2"><CompanyLogo company={{ name: item.target_company_name, logo_storage_path: item.target_company_logo_storage_path }} size="xs" /><div className="min-w-0"><p className="font-semibold text-[#17202d]">{item.target_company_name}</p><p className="text-[11px] text-slate-600">{item.reason}</p><span className="text-[10px] text-slate-500">{labelForStatus(item.status)}</span></div></div>)}</PanelSection></>}
      {tab === 'activities' && <PanelSection title="Actividad" action={onActivity && <button type="button" onClick={onActivity} className="text-[11px] font-semibold text-[#235b3e]">+ Registrar</button>}><div className="grid gap-2">{current.activities.length ? current.activities.map((activity) => <div key={activity.id} className="border-l-2 border-[#c9dfd0] pl-2.5"><p className="text-[10px] text-slate-500">{date(activity.activity_at)} - {person(activity.created_by_name)}</p><p className="font-semibold text-[#17202d]">{activity.title}</p>{activity.description && <p className="text-[11px] text-slate-600">{activity.description}</p>}</div>) : <p className="text-slate-500">Sin actividad registrada.</p>}</div></PanelSection>}
      {tab === 'files' && <PanelSection title="Archivos" action={<label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#235b3e]"><Upload size={13} />Subir<input type="file" className="hidden" onChange={(event) => void uploadFile(event)} /></label>}><div className="grid gap-1.5">{panel?.files.length ? panel.files.map((file) => <div key={file.id} className="flex items-center gap-2 rounded bg-[#fbfaf7] px-2.5 py-2"><FileText size={15} className="shrink-0 text-[#235b3e]" /><span className="min-w-0 flex-1 truncate"><strong className="block text-[11px] text-[#17202d]">{file.file_name}</strong><small className="text-[10px] text-slate-500">{Math.round(file.size_bytes / 1024)} KB - {file.category}</small></span><button type="button" onClick={() => void downloadFile(file.storage_path)} aria-label={`Abrir ${file.file_name}`} className="rounded p-1 text-[#235b3e]"><Download size={14} /></button><Archive size={14} className="text-slate-400" /></div>) : <p className="text-slate-500">No hay archivos.</p>}</div></PanelSection>}
      {tab === 'notes' && <PanelSection title="Notas" action={<button type="button" onClick={() => setNoteModal(true)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#235b3e]"><Plus size={13} />Nueva nota</button>}><div className="grid gap-2">{panel?.notes.length ? panel.notes.map((note) => <div key={note.id} className="rounded bg-[#fbfaf7] px-2.5 py-2"><p className="text-[10px] text-slate-500">{date(note.created_at)}</p><p className="mt-1 whitespace-pre-wrap text-[12px] text-[#17202d]">{note.body}</p></div>) : current.internal_notes ? <div className="rounded bg-[#fbfaf7] px-2.5 py-2"><p className="text-[10px] text-slate-500">Nota legacy</p><p className="mt-1 whitespace-pre-wrap text-[12px] text-[#17202d]">{current.internal_notes}</p></div> : <p className="text-slate-500">Sin notas.</p>}</div></PanelSection>}
    </>}</div>
    {opportunityModal && <NewOpportunityModal prospectId={current.id} collaborators={collaborators} isAdmin={admin} onClose={() => setOpportunityModal(false)} onSaved={(data) => void refresh(data)} />}
    {crossModal && <CrossOpportunityModal prospectId={current.id} companies={companies} currentCompanyId={current.represented_company_id} onClose={() => setCrossModal(false)} onSaved={(data) => void refresh(data)} />}
    {noteModal && <AdminDetailModal title="Nueva nota" onClose={() => setNoteModal(false)}><form className="grid gap-3" onSubmit={(event) => void submitNote(event)}><textarea name="body" rows={5} required className="rounded border border-[#c9c1b4] px-3 py-2" placeholder="Escribe una nota interna..." /><div className="flex justify-end gap-2"><button type="button" onClick={() => setNoteModal(false)} className="rounded border border-[#c9c1b4] px-3 py-2 font-semibold">Cancelar</button><button className="rounded bg-[#235b3e] px-3 py-2 font-semibold text-white">Guardar nota</button></div></form></AdminDetailModal>}
  </aside>
}
