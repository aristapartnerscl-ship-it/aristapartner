import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Download, FileText, Link as LinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RepresentedCompanyFaqRecord, RepresentedCompanyMaterialRecord } from '../../types/admin'

const visibilityLabels = { directory: 'Directorio', assigned_only: 'Solo asignados', admin_only: 'Solo Arista' } as const

export function CompanyWorkspaceSection({ title, children, icon: Icon, tone = 'neutral', canEdit, onEdit, className = '' }: { title: string; children: ReactNode; icon?: LucideIcon; tone?: 'neutral' | 'positive' | 'info' | 'attention' | 'danger' | 'private'; canEdit?: boolean; onEdit?: () => void; className?: string }) {
  const tones = { neutral: 'bg-white border-[#e6e2da]', positive: 'bg-[#f4faf6] border-[#dbeade]', info: 'bg-[#f4f8fb] border-[#dce7f0]', attention: 'bg-[#fffaf0] border-[#f0e3c4]', danger: 'bg-[#fff8f7] border-[#f0dedd]', private: 'bg-[#f4f5f3] border-[#d9ded9]' }
  return <section className={`company-workspace-section rounded-[10px] border p-3.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)] ${tones[tone]} ${className}`}><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2">{Icon && <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/75 text-[#235b3e]"><Icon size={15} aria-hidden="true" /></span>}<h2 className="truncate text-[13px] font-semibold text-[#17202d]">{title}</h2></div>{canEdit && <button type="button" onClick={onEdit} className="shrink-0 text-[10px] font-semibold text-[#235b3e]">Editar</button>}</div><div className="mt-2 text-[12px] leading-[1.5] text-slate-700">{children}</div></section>
}

export function CompanyWorkspaceChips({ items, limit = 15 }: { items: string[]; limit?: number }) {
  const clean = items.map((item) => item.trim()).filter(Boolean)
  const visible = clean.slice(0, limit)
  return visible.length ? <div className="flex flex-wrap gap-1.5">{visible.map((item) => <span key={item} className="rounded-full border border-[#dfe7e1] bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[#235b3e]">{item}</span>)}{clean.length > limit && <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-slate-500">+{clean.length - limit} más</span>}</div> : <p className="text-slate-500">Sin información cargada.</p>
}

export function CompanyWorkspaceList({ items, icon = 'check', tone = 'neutral', limit = 8 }: { items: string[]; icon?: 'check' | 'alert' | 'arrow'; tone?: 'neutral' | 'danger' | 'attention'; limit?: number }) {
  const colors = { neutral: 'text-[#235b3e]', danger: 'text-rose-600', attention: 'text-amber-600' }
  const clean = items.map((item) => item.trim()).filter(Boolean)
  const visible = clean.slice(0, limit)
  return visible.length ? <div className="grid gap-0.5">{visible.map((item) => <div key={item} className="flex min-h-[28px] items-start gap-2 border-b border-black/[0.045] py-1 last:border-0"><span className={`mt-0.5 text-[11px] font-bold ${colors[tone]}`}>{icon === 'alert' ? '!' : icon === 'arrow' ? '›' : '✓'}</span><span>{item}</span></div>)}{clean.length > limit && <span className="pt-1 text-[10px] font-semibold text-slate-500">+{clean.length - limit} más</span>}</div> : <p className="text-slate-500">Sin información cargada.</p>
}

export function CompanyWorkspaceFaqList({ faqs, limit = 3 }: { faqs: RepresentedCompanyFaqRecord[]; limit?: number }) {
  const visible = faqs.slice(0, limit)
  return visible.length ? <div className="grid gap-0.5">{visible.map((faq) => <div key={faq.id} className="border-b border-black/[0.045] py-1.5 last:border-0"><div className="flex items-center gap-1.5"><span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#235b3e]">{faq.type === 'objection' ? 'Objeción' : 'FAQ'}</span>{faq.requires_escalation && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">Escalar</span>}</div><p className="mt-1 font-semibold text-[#17202d]">{faq.question}</p><p className="mt-0.5 line-clamp-2 text-[12px] text-slate-600">{faq.answer}</p></div>)}</div> : <p className="text-slate-500">Sin FAQ cargadas.</p>
}

export function CompanyWorkspaceMaterialList({ materials, limit = 3, onMore, onView, onDownload }: { materials: RepresentedCompanyMaterialRecord[]; limit?: number; onMore?: () => void; onView?: (material: RepresentedCompanyMaterialRecord) => void; onDownload?: (material: RepresentedCompanyMaterialRecord) => void }) {
  const visible = materials.slice(0, limit)
  return <div className="grid gap-0.5">{visible.length ? visible.map((material) => <div key={material.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-black/[0.045] py-1.5 last:border-0"><span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 text-[#235b3e]">{material.material_type === 'link' ? <LinkIcon size={14} /> : <FileText size={14} />}</span><span className="min-w-0"><strong className="block truncate text-[11px] text-[#17202d]">{material.title}</strong><span className="block truncate text-[10px] text-slate-500">{material.material_type === 'link' ? 'Enlace externo' : 'Archivo'} · {material.category || visibilityLabels[material.visibility]}</span></span><span className="flex items-center gap-1"><button type="button" onClick={() => onView?.(material)} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-[#235b3e] hover:bg-[#eef7f1]">Ver</button><button type="button" onClick={() => onDownload?.(material)} className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-[#235b3e] hover:bg-[#eef7f1]"><Download size={11} />Descargar</button></span></div>) : <p className="text-slate-500">Sin materiales cargados.</p>}{materials.length > limit && onMore && <button type="button" onClick={onMore} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#235b3e]">Ver todos los materiales <ArrowRight size={12} /></button>}</div>
}
