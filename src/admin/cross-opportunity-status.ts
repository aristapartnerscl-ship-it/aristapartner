import type { RedComercialCrossOpportunityRecord } from '../types/admin'

type Status = RedComercialCrossOpportunityRecord['status']

const presentations: Record<Status, { label: string; className: string; tone: string }> = {
  detected: { label: 'Detectada', className: 'border-sky-200 bg-sky-50 text-sky-700', tone: 'bg-sky-50 text-sky-700' },
  under_review: { label: 'En revision', className: 'border-amber-200 bg-amber-50 text-amber-800', tone: 'bg-amber-50 text-amber-700' },
  assigned: { label: 'Asignada', className: 'border-violet-200 bg-violet-50 text-violet-700', tone: 'bg-violet-50 text-violet-700' },
  converted: { label: 'Convertida', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', tone: 'bg-emerald-50 text-emerald-700' },
  discarded: { label: 'Descartada', className: 'border-rose-200 bg-rose-50 text-rose-700', tone: 'bg-rose-50 text-rose-700' },
}

export function getCrossOpportunityStatusPresentation(status: string | null | undefined) {
  return presentations[(status || 'detected') as Status] ?? { label: status || 'Sin estado', className: 'border-slate-200 bg-slate-100 text-slate-600', tone: 'bg-slate-100 text-slate-600' }
}
