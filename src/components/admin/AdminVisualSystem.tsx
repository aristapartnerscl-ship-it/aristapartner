import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function AdminKpiCard({ label, value, icon: Icon, tone = 'neutral' }: { label: string; value: string | number; icon?: LucideIcon; tone?: 'neutral' | 'positive' | 'negative' | 'process' | 'pending' | 'collaborator' }) {
  const tones = { neutral: 'bg-white text-slate-600', positive: 'bg-emerald-50 text-emerald-700', negative: 'bg-rose-50 text-rose-700', process: 'bg-sky-50 text-sky-700', pending: 'bg-amber-50 text-amber-700', collaborator: 'bg-violet-50 text-violet-700' }
  const isPendingParticipation = label === 'Participaciones pendientes' && Number(value) > 0
  return <div className={`admin-kpi-card ${tones[tone]} ${isPendingParticipation ? 'ring-1 ring-amber-200 shadow-[0_2px_8px_rgba(180,120,20,0.12)]' : ''}`}><div className="flex items-center justify-between gap-2"><span className="admin-kpi-label">{label}</span>{Icon && <Icon size={15} aria-hidden="true" />}</div><strong>{value}</strong></div>
}

export function AdminMetricStrip({ children }: { children: ReactNode }) {
  return <div className="admin-metric-strip">{children}</div>
}

export function AdminTabs({ items, active, onChange }: { items: Array<{ key: string; label: string }>; active: string; onChange: (key: string) => void }) {
  return <nav className="admin-tabs" aria-label="Secciones"><div className="flex flex-wrap gap-1">{items.map((item) => <button key={item.key} type="button" className={active === item.key ? 'is-active' : ''} onClick={() => onChange(item.key)}>{item.label}</button>)}</div></nav>
}
