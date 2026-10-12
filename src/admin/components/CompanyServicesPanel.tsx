import { BookOpen, CheckCircle2, Edit3, Plus, Power } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { adminRepository } from '../../repositories'
import type { RepresentedCompanyServicePriority, RepresentedCompanyServiceRecord } from '../../types/admin'

type ServiceDraft = Omit<Partial<RepresentedCompanyServiceRecord>, 'priority'> & { priority: RepresentedCompanyServicePriority }

const emptyDraft: ServiceDraft = {
  name: '', category: '', priority: 'C', is_active: true, short_description: '', problem_statement: '',
  ideal_customer: '', decision_makers: '', opportunity_signals: '', discovery_questions: '',
  required_information: '', suggested_pitch: '', reference_price: '', price_notes: '', handoff_guidance: '',
  restrictions: '', display_order: 0,
}

const fields: Array<{ key: keyof ServiceDraft; label: string; group: string; rows?: number }> = [
  { key: 'name', label: 'Nombre del servicio', group: 'Información general' },
  { key: 'category', label: 'Categoría', group: 'Información general' },
  { key: 'short_description', label: 'Descripción breve', group: 'Información general' },
  { key: 'problem_statement', label: 'Problema que resuelve', group: 'Cliente y problema', rows: 3 },
  { key: 'ideal_customer', label: 'Cliente ideal', group: 'Cliente y problema', rows: 3 },
  { key: 'decision_makers', label: 'Decisores', group: 'Cliente y problema', rows: 3 },
  { key: 'opportunity_signals', label: 'Señales de oportunidad', group: 'Prospección', rows: 3 },
  { key: 'discovery_questions', label: 'Preguntas de descubrimiento', group: 'Prospección', rows: 3 },
  { key: 'required_information', label: 'Información mínima a levantar', group: 'Prospección', rows: 3 },
  { key: 'suggested_pitch', label: 'Pitch sugerido', group: 'Venta', rows: 3 },
  { key: 'reference_price', label: 'Precio / orientación comercial', group: 'Venta' },
  { key: 'price_notes', label: 'Notas de precio', group: 'Venta', rows: 3 },
  { key: 'handoff_guidance', label: 'Cuándo derivar', group: 'Derivación', rows: 3 },
  { key: 'restrictions', label: 'Restricciones / qué no prometer', group: 'Restricciones', rows: 3 },
]

function priorityLabel(priority: RepresentedCompanyServicePriority) {
  return priority === 'complementary' ? 'Complementario' : `Prioridad ${priority}`
}

function priorityClass(priority: RepresentedCompanyServicePriority) {
  return priority === 'A' ? 'bg-[#e7f0ea] text-[#235b3e]' : priority === 'B' ? 'bg-[#eef4fb] text-[#315c86]' : priority === 'complementary' ? 'bg-[#f1edf8] text-[#654c87]' : 'bg-[#f1f2f3] text-slate-600'
}

function ServiceFieldControl({ field, value, onChange }: { field: { key: keyof ServiceDraft; rows?: number }; value: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void }) {
  const className = 'rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal outline-none focus:border-[#235b3e]'
  return field.rows ? <textarea rows={field.rows} value={value} onChange={onChange} className={className} /> : <input type="text" value={value} onChange={onChange} className={className} />
}

function toDraft(service: RepresentedCompanyServiceRecord): ServiceDraft {
  return Object.fromEntries(Object.keys(emptyDraft).map((key) => [key, service[key as keyof RepresentedCompanyServiceRecord] ?? emptyDraft[key as keyof ServiceDraft]])) as ServiceDraft
}

function ServicePlaybook({ service, onClose }: { service: RepresentedCompanyServiceRecord; onClose: () => void }) {
  const sections = [
    ['Problema que resuelve', service.problem_statement], ['Cliente ideal', service.ideal_customer], ['Decisores', service.decision_makers],
    ['Señales de oportunidad', service.opportunity_signals], ['Preguntas de descubrimiento', service.discovery_questions],
    ['Información mínima a levantar', service.required_information], ['Pitch sugerido', service.suggested_pitch],
    ['Precio / orientación comercial', service.reference_price || service.price_notes], ['Cuándo derivar', service.handoff_guidance],
    ['Restricciones / qué no prometer', service.restrictions],
  ]
  return <AdminDetailModal title={service.name} subtitle={`${priorityLabel(service.priority)}${service.category ? ` · ${service.category}` : ''}`} onClose={onClose} size="large">
    <div className="grid gap-3 md:grid-cols-2">
      <section className="rounded-lg border border-[#dbeade] bg-[#f7fbf8] p-3 md:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#235b3e]">Resumen</p><p className="mt-1 text-[12px] text-slate-700">{service.short_description || 'Sin descripción registrada.'}</p></section>
      {sections.map(([title, value]) => <section key={title} className="border-b border-[#eee8dd] pb-3"><h3 className="text-[12px] font-semibold text-[#17202d]">{title}</h3><p className="mt-1 whitespace-pre-line text-[12px] leading-5 text-slate-700">{value || 'Sin información registrada.'}</p></section>)}
    </div>
  </AdminDetailModal>
}

function ServiceEditor({ initial, onClose, onSaved, companyId }: { initial: ServiceDraft; onClose: () => void; onSaved: () => void; companyId: string }) {
  const [values, setValues] = useState<ServiceDraft>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const groups = [...new Set(fields.map((field) => field.group))]
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true); setError('')
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]))
    const result = initial.id ? await adminRepository.updateRedComercialCompanyService(initial.id, payload) : await adminRepository.createRedComercialCompanyService(companyId, payload)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    onSaved()
  }
  return <AdminDetailModal title={initial.id ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose} size="large"><form className="grid gap-4" onSubmit={(event) => void submit(event)}>
    {groups.map((group) => <section key={group} className="grid gap-2"><h3 className="border-b border-[#eee8dd] pb-1 text-[11px] font-bold uppercase tracking-wide text-[#235b3e]">{group}</h3><div className="grid gap-2 md:grid-cols-2">{fields.filter((field) => field.group === group).map((field) => <label key={String(field.key)} className={`grid gap-1 text-[11px] font-semibold text-slate-700 ${field.rows ? 'md:col-span-2' : ''}`}><span>{field.label}{field.key === 'name' ? ' *' : ''}</span><ServiceFieldControl field={field} value={String(values[field.key] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} /></label>)}</div>{group === 'Información general' && <div className="grid gap-2 md:grid-cols-3"><label className="grid gap-1 text-[11px] font-semibold text-slate-700"><span>Prioridad</span><select value={values.priority} onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value as RepresentedCompanyServicePriority }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px]"><option value="A">Prioridad A</option><option value="B">Prioridad B</option><option value="C">Prioridad C</option><option value="complementary">Complementario</option></select></label><label className="grid gap-1 text-[11px] font-semibold text-slate-700"><span>Orden</span><input type="number" value={Number(values.display_order ?? 0)} onChange={(event) => setValues((current) => ({ ...current, display_order: Number(event.target.value) }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px]" /></label><label className="flex items-end gap-2 pb-2 text-[11px] font-semibold text-slate-700"><input type="checkbox" checked={Boolean(values.is_active)} onChange={(event) => setValues((current) => ({ ...current, is_active: event.target.checked }))} /> Servicio activo</label></div>}</section>)}
    {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] text-rose-800">{error}</p>}<footer className="sticky bottom-0 flex justify-end gap-2 border-t border-[#eee8dd] bg-white pt-3"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-2 text-[12px] font-semibold">Cancelar</button><button type="submit" disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar'}</button></footer>
  </form></AdminDetailModal>
}

export function CompanyServicesPanel({ companyId, services, admin, onReload }: { companyId: string; services: RepresentedCompanyServiceRecord[]; admin: boolean; onReload: () => void }) {
  const [editing, setEditing] = useState<ServiceDraft | null>(null)
  const [viewing, setViewing] = useState<RepresentedCompanyServiceRecord | null>(null)
  const [error, setError] = useState('')
  async function toggle(service: RepresentedCompanyServiceRecord) {
    const result = await adminRepository.updateRedComercialCompanyService(service.id, { is_active: !service.is_active })
    if (result.error) setError(result.error); else onReload()
  }
  return <section className="grid gap-2.5"><header className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><BookOpen size={15} className="text-[#235b3e]" /><h2 className="text-[13px] font-semibold text-[#17202d]">Servicios</h2></div><p className="mt-0.5 text-[11px] text-slate-500">Productos y soluciones comercializables de esta empresa.</p></div>{admin && <button type="button" onClick={() => setEditing({ ...emptyDraft })} className="inline-flex items-center gap-1 rounded-md bg-[#235b3e] px-2.5 py-1.5 text-[11px] font-semibold text-white"><Plus size={13} />Nuevo servicio</button>}</header>{error && <p className="rounded-md bg-rose-50 px-3 py-2 text-[12px] text-rose-800">{error}</p>}{services.length === 0 ? <p className="rounded-lg border border-dashed border-[#d9d1c5] px-3 py-4 text-[12px] text-slate-500">No hay servicios estructurados. La oferta general sigue disponible más abajo.</p> : <div className="grid items-start gap-2.5 lg:grid-cols-2">{services.map((service) => <article key={service.id} className={`rounded-lg border p-3 ${service.is_active ? 'border-[#dbeade] bg-white' : 'border-[#e3e0db] bg-[#f7f6f3] opacity-75'}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate text-[13px] font-semibold text-[#17202d]">{service.name}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">{service.short_description || 'Sin descripción registrada.'}</p></div><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(service.priority)}`}>{priorityLabel(service.priority)}</span></div><div className="mt-3 flex items-center justify-between gap-2 border-t border-[#eee8dd] pt-2"><button type="button" onClick={() => setViewing(service)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#235b3e]"><BookOpen size={13} />Ver playbook</button>{admin && <div className="flex items-center gap-1"><button type="button" aria-label={`Editar ${service.name}`} onClick={() => setEditing(toDraft(service))} className="rounded-md p-1.5 text-slate-500 hover:bg-[#f3f8f4] hover:text-[#235b3e]"><Edit3 size={14} /></button><button type="button" aria-label={`${service.is_active ? 'Desactivar' : 'Activar'} ${service.name}`} onClick={() => void toggle(service)} className="rounded-md p-1.5 text-slate-500 hover:bg-[#f3f8f4] hover:text-[#235b3e]">{service.is_active ? <Power size={14} /> : <CheckCircle2 size={14} />}</button></div>}</div></article>)}</div>}{viewing && <ServicePlaybook service={viewing} onClose={() => setViewing(null)} />}{editing && <ServiceEditor companyId={companyId} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onReload() }} />}</section>
}
