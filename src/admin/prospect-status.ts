import type { RedComercialProspectStatus } from '../types/admin'

export type ProspectStatusPresentation = {
  label: string
  textClass: string
  backgroundClass: string
  borderClass: string
  accentClass: string
}

const statusPresentation: Record<RedComercialProspectStatus, ProspectStatusPresentation> = {
  to_contact: { label: 'Por contactar', textClass: 'text-slate-700', backgroundClass: 'bg-stone-100', borderClass: 'border-stone-200', accentClass: 'border-l-stone-300' },
  contacted_no_response: { label: 'Contactado - sin respuesta', textClass: 'text-amber-800', backgroundClass: 'bg-amber-50', borderClass: 'border-amber-200', accentClass: 'border-l-amber-300' },
  responded: { label: 'Respondió', textClass: 'text-sky-800', backgroundClass: 'bg-sky-50', borderClass: 'border-sky-200', accentClass: 'border-l-sky-300' },
  follow_up: { label: 'En seguimiento', textClass: 'text-blue-800', backgroundClass: 'bg-blue-50', borderClass: 'border-blue-200', accentClass: 'border-l-blue-300' },
  interested: { label: 'Interesado', textClass: 'text-emerald-800', backgroundClass: 'bg-emerald-50', borderClass: 'border-emerald-200', accentClass: 'border-l-emerald-300' },
  meeting_scheduled: { label: 'Reunión agendada', textClass: 'text-violet-800', backgroundClass: 'bg-violet-50', borderClass: 'border-violet-200', accentClass: 'border-l-violet-300' },
  agreed: { label: 'Acordado', textClass: 'text-[#235b3e]', backgroundClass: 'bg-[#e7f0ea]', borderClass: 'border-[#c8d9cf]', accentClass: 'border-l-[#57906c]' },
  not_interested: { label: 'No interesado', textClass: 'text-rose-800', backgroundClass: 'bg-rose-50', borderClass: 'border-rose-200', accentClass: 'border-l-rose-300' },
  archived: { label: 'Archivado', textClass: 'text-slate-600', backgroundClass: 'bg-slate-100', borderClass: 'border-slate-200', accentClass: 'border-l-slate-300' },
}

export function getProspectStatusPresentation(status: RedComercialProspectStatus | string): ProspectStatusPresentation {
  return statusPresentation[status as RedComercialProspectStatus] ?? statusPresentation.to_contact
}
