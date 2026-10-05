import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { AdminSelect } from '../../components/admin/AdminSelect'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { AristaBusinessProspectRecord } from '../../types/admin'

const statuses = [
  ['to_research', 'Por investigar'], ['to_contact', 'Por contactar'], ['contacted_no_response', 'Sin respuesta'],
  ['responded', 'Respondió'], ['interested', 'Interesada'], ['meeting_scheduled', 'Reunión agendada'],
  ['evaluation', 'Evaluación'], ['proposal_sent', 'Propuesta enviada'], ['negotiation', 'Negociación'],
  ['agreed', 'Acordada'], ['not_interested', 'No interesada'], ['discarded', 'Descartada'], ['converted', 'Convertida'],
] as const
const statusLabel = (value: string) => statuses.find(([key]) => key === value)?.[1] ?? value
const sourceOptions = [['manual', 'Manual'], ['web_submission', 'Solicitud web'], ['referral', 'Referido'], ['linkedin', 'LinkedIn'], ['email', 'Email'], ['other', 'Otro']] as const

function ProspectField({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return <label className="grid gap-1 text-[13px] font-medium text-slate-700"><span>{label}{required && <span className="ml-1 text-red-700">*</span>}</span><input aria-label={label} required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-h-9 rounded-md border border-[#c9c1b4] bg-white px-2.5 py-2 text-sm outline-none transition focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/10" /></label>
}

function ProspectTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="grid gap-1 text-[13px] font-medium text-slate-700 md:col-span-2"><span>{label}</span><textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={2} className="rounded-md border border-[#c9c1b4] bg-white px-2.5 py-2 text-sm outline-none transition focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/10" /></label>
}

function blank(): Partial<AristaBusinessProspectRecord> {
  return { company_name: '', website: '', industry: '', contact_name: '', contact_role: '', contact_email: '', contact_phone: '', source: 'manual', what_they_sell: '', why_interesting: '', fit_notes: '', territory: '', status: 'to_research' }
}

export function AristaBusinessProspectsPage() {
  const [items, setItems] = useState<AristaBusinessProspectRecord[]>([])
  const [selected, setSelected] = useState<AristaBusinessProspectRecord | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<Partial<AristaBusinessProspectRecord>>(blank())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const result = await adminRepository.listAristaBusinessProspects({ search, status })
    setItems(result.data)
    setError(result.error ?? '')
    setLoading(false)
  }, [search, status])
  useEffect(() => { void load() }, [load])

  const counts = useMemo(() => ({ total: items.length, contact: items.filter((item) => item.status === 'to_contact').length, followup: items.filter((item) => ['contacted_no_response', 'responded', 'interested'].includes(item.status)).length, meetings: items.filter((item) => item.status === 'meeting_scheduled').length, negotiation: items.filter((item) => item.status === 'negotiation').length, agreed: items.filter((item) => item.status === 'agreed').length }), [items])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (saving || !form.company_name?.trim()) return
    setSaving(true); setError('')
    const result = await adminRepository.createAristaBusinessProspect(form)
    setSaving(false)
    if (result.error || !result.data) { setError(result.error ?? 'No fue posible crear la prospección.'); return }
    setFormOpen(false); setForm(blank()); setMessage('Prospección creada.'); await load()
  }

  async function updateStatus(nextStatus: string) {
    if (!selected) return
    const result = await adminRepository.updateAristaBusinessProspect(selected.id, { status: nextStatus })
    if (result.error || !result.data) { setError(result.error ?? 'No fue posible actualizar el estado.'); return }
    setSelected(result.data); await load()
  }

  async function convert() {
    if (!selected || !window.confirm('¿Convertir esta prospección en Empresa Arista?')) return
    const result = await adminRepository.convertAristaBusinessProspect(selected.id)
    if (result.error || !result.data) { setError(result.error ?? 'No fue posible convertir la empresa.'); return }
    setSelected(result.data); setMessage('La prospección se convirtió y conserva su historial.'); await load()
  }

  return (
    <div className="grid gap-3">
      <AdminPageHeader eyebrow="Red Comercial / Administración" title="Prospección Arista" text="Empresas que Arista está evaluando para incorporar a su portafolio comercial." actionLabel="+ Nueva prospección" onAction={() => { setForm(blank()); setFormOpen(true) }} />
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      {message && <div className="rounded-lg border border-[#b8d8c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#235b3e]">{message}</div>}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {([['Total', counts.total], ['Por contactar', counts.contact], ['En seguimiento', counts.followup], ['Reuniones', counts.meetings], ['Negociación', counts.negotiation], ['Acordadas', counts.agreed]] as const).map(([label, value]) => <div key={label} className="rounded-lg border border-[#ddd6ca] bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-[#17202d]">{value}</p></div>)}
      </div>
      <section className="rounded-lg border border-[#ddd6ca] bg-white p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px]">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar empresa, contacto o industria" className="rounded-md border border-[#c9c1b4] px-3 py-2 text-sm outline-none focus:border-[#235b3e]" />
          <AdminSelect aria-label="Estado" width="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos los estados</option>{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</AdminSelect>
        </div>
      </section>
      {loading && <div className="h-32 animate-pulse rounded-lg border border-[#ddd6ca] bg-white" />}
      {!loading && !error && items.length === 0 && <EmptyState title="Sin prospecciones Arista" text="Aún no hay empresas en evaluación." />}
      {!loading && items.length > 0 && <section className="overflow-x-auto rounded-lg border border-[#ddd6ca] bg-white"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-[#fbfaf7] text-[10px] font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Empresa</th><th className="px-3 py-2">Contacto</th><th className="px-3 py-2">Industria</th><th className="px-3 py-2">Canal / origen</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Próximo seguimiento</th><th className="px-3 py-2">Acción</th></tr></thead><tbody className="divide-y divide-[#eee8dd]">{items.map((item) => <tr key={item.id} className="hover:bg-[#fbfaf7]"><td className="px-3 py-2 font-semibold text-[#17202d]">{item.company_name}</td><td className="px-3 py-2 text-slate-600">{item.contact_name || 'Sin contacto'}</td><td className="px-3 py-2 text-slate-600">{item.industry || '—'}</td><td className="px-3 py-2 text-slate-600">{item.source}</td><td className="px-3 py-2"><span className="rounded-full bg-[#eef5f1] px-2 py-1 text-xs font-semibold text-[#235b3e]">{statusLabel(item.status)}</span></td><td className="px-3 py-2 text-slate-600">{item.next_followup_at ? new Date(item.next_followup_at).toLocaleDateString('es-CL') : '—'}</td><td className="px-3 py-2"><button type="button" onClick={async () => { const result = await adminRepository.getAristaBusinessProspect(item.id); setSelected(result.data) }} className="rounded-md border border-[#c9c1b4] px-2.5 py-1.5 text-xs font-semibold">Abrir</button></td></tr>)}</tbody></table></section>}
      {formOpen && <AdminDetailModal title="Nueva prospección Arista" onClose={() => setFormOpen(false)}>
        <form className="flex max-h-[min(78vh,720px)] flex-col" onSubmit={save}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            <section>
              <h3 className="border-b border-[#eee8dd] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#235b3e]">Información de empresa</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ProspectField label="Empresa" value={String(form.company_name ?? '')} onChange={(value) => setForm((current) => ({ ...current, company_name: value }))} placeholder="Ej: Empresa XYZ" required />
                <ProspectField label="Sitio web" value={String(form.website ?? '')} onChange={(value) => setForm((current) => ({ ...current, website: value }))} placeholder="https://empresa.cl" type="url" />
                <ProspectField label="Industria / rubro" value={String(form.industry ?? '')} onChange={(value) => setForm((current) => ({ ...current, industry: value }))} placeholder="Ej: Software, Salud, Retail" />
                <ProspectField label="Territorio" value={String(form.territory ?? '')} onChange={(value) => setForm((current) => ({ ...current, territory: value }))} placeholder="Ej: Chile" />
              </div>
            </section>
            <section>
              <h3 className="border-b border-[#eee8dd] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#235b3e]">Contacto</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ProspectField label="Nombre del contacto" value={String(form.contact_name ?? '')} onChange={(value) => setForm((current) => ({ ...current, contact_name: value }))} placeholder="Nombre y apellido" />
                <ProspectField label="Cargo / área" value={String(form.contact_role ?? '')} onChange={(value) => setForm((current) => ({ ...current, contact_role: value }))} placeholder="Ej: CEO, Gerente Comercial" />
                <ProspectField label="Email" value={String(form.contact_email ?? '')} onChange={(value) => setForm((current) => ({ ...current, contact_email: value }))} type="email" placeholder="contacto@empresa.cl" />
                <ProspectField label="Teléfono" value={String(form.contact_phone ?? '')} onChange={(value) => setForm((current) => ({ ...current, contact_phone: value }))} placeholder="+56 9..." />
              </div>
            </section>
            <section>
              <h3 className="border-b border-[#eee8dd] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#235b3e]">Evaluación comercial</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <ProspectTextarea label="¿Qué vende / qué ofrece?" value={String(form.what_they_sell ?? '')} onChange={(value) => setForm((current) => ({ ...current, what_they_sell: value }))} placeholder="Describe brevemente su oferta." />
                <ProspectTextarea label="¿Por qué nos interesa?" value={String(form.why_interesting ?? '')} onChange={(value) => setForm((current) => ({ ...current, why_interesting: value }))} placeholder="Qué potencial ves para Arista..." />
                <ProspectTextarea label="Encaje con Arista" value={String(form.fit_notes ?? '')} onChange={(value) => setForm((current) => ({ ...current, fit_notes: value }))} placeholder="Tipo de cliente, oportunidad B2B, diferenciadores..." />
                <ProspectField label="Ticket estimado" value={String(form.estimated_ticket ?? '')} onChange={(value) => setForm((current) => ({ ...current, estimated_ticket: value ? Number(value) : null }))} placeholder="Ej: 5000000" type="number" />
              </div>
            </section>
            <section>
              <h3 className="border-b border-[#eee8dd] pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#235b3e]">Gestión</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-[13px] font-medium text-slate-700"><span>Origen</span><select value={String(form.source ?? 'manual')} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className="min-h-9 rounded-md border border-[#c9c1b4] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#235b3e]">{sourceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="grid gap-1 text-[13px] font-medium text-slate-700"><span>Estado</span><select value={String(form.status ?? 'to_research')} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="min-h-9 rounded-md border border-[#c9c1b4] bg-white px-2.5 py-2 text-sm outline-none focus:border-[#235b3e]">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <ProspectField label="Responsable" value={String(form.owner_user_id ?? '')} onChange={(value) => setForm((current) => ({ ...current, owner_user_id: value || null }))} placeholder="Asignar responsable" />
                <ProspectField label="Próximo seguimiento" value={String(form.next_followup_at ?? '')} onChange={(value) => setForm((current) => ({ ...current, next_followup_at: value || null }))} type="datetime-local" />
              </div>
            </section>
          </div>
          <div className="sticky bottom-0 mt-4 flex shrink-0 justify-end gap-2 border-t border-[#eee8dd] bg-white pt-3">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-[#c9c1b4] px-3 py-2 text-sm font-semibold text-[#17202d]">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Crear prospección'}</button>
          </div>
        </form>
      </AdminDetailModal>}
      {selected && <AdminDetailModal title={selected.company_name} subtitle="Prospección Arista" onClose={() => setSelected(null)}><div className="grid gap-4 text-sm"><div className="grid gap-1"><span className="text-xs font-semibold uppercase text-slate-500">Estado</span><select value={selected.status} onChange={(event) => void updateStatus(event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2">{statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><dl className="grid gap-2 md:grid-cols-2">{[['Sitio web', selected.website], ['Industria', selected.industry], ['Contacto', selected.contact_name], ['Cargo', selected.contact_role], ['Email', selected.contact_email], ['Teléfono', selected.contact_phone], ['Por qué interesa', selected.why_interesting], ['Encaje con Arista', selected.fit_notes]].map(([label, value]) => <div key={label} className="rounded-md bg-[#fbfaf7] p-2"><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-slate-700">{value || 'Sin información'}</dd></div>)}</dl>{selected.status === 'agreed' && !selected.converted_represented_company_id && <button type="button" onClick={() => void convert()} className="w-fit rounded-md bg-[#235b3e] px-3 py-2 font-semibold text-white">Convertir en Empresa Arista</button>}{selected.converted_represented_company_id && <p className="rounded-md bg-[#eef7f1] p-3 text-[#235b3e]">Convertida en Empresa Arista. La prospección conserva su historial.</p>}<div><h3 className="font-semibold text-[#17202d]">Actividad</h3><p className="mt-1 text-slate-600">{selected.activities?.length ?? 0} registros. El historial permanece asociado a esta prospección.</p></div></div></AdminDetailModal>}
    </div>
  )
}
