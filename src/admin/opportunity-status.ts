export const opportunityControlLabels: Record<string, string> = {
  collaborator: 'Gestión colaborador',
  arista: 'Gestión Arista',
  shared: 'Gestión compartida',
}

export const opportunityContractLabels: Record<string, string> = {
  not_required: 'No requerido', pending: 'Pendiente', sent: 'Enviado', under_review: 'En revisión',
  signed: 'Firmado', not_signed: 'No firmado', withdrawn: 'Cliente se retractó', cancelled: 'Cancelado',
}

export const opportunityPaymentLabels: Record<string, string> = {
  not_applicable: 'No aplica', pending: 'Pago cliente pendiente', partial: 'Pago parcial', paid: 'Cliente pagó', overdue: 'Pago vencido', refunded: 'Reembolsado', cancelled: 'Cancelado',
}

export const opportunityCommissionLabels: Record<string, string> = {
  not_generated: 'Aun no generada', to_validate: 'Por validar', generated: 'Generada', pending_payment: 'Pendiente de pago', paid: 'Pagada', void: 'Anulada',
}

export const opportunityResultLabels: Record<string, string> = {
  in_process: 'En proceso', won: 'Ganada', lost: 'Perdida', cancelled: 'Cancelada',
}

export function getOpportunityPresentation(kind: 'control' | 'contract' | 'payment' | 'commission' | 'result', value: string) {
  const labels = kind === 'control' ? opportunityControlLabels : kind === 'contract' ? opportunityContractLabels : kind === 'payment' ? opportunityPaymentLabels : kind === 'commission' ? opportunityCommissionLabels : opportunityResultLabels
  const tone = kind === 'result' && value === 'won' ? 'bg-[#e7f0ea] text-[#235b3e] border-[#c9dfd0]' : kind === 'result' && value === 'lost' ? 'bg-rose-50 text-rose-700 border-rose-100' : kind === 'control' && value === 'arista' ? 'bg-[#e7f0ea] text-[#235b3e] border-[#c9dfd0]' : kind === 'control' && value === 'collaborator' ? 'bg-violet-50 text-violet-700 border-violet-100' : kind === 'payment' && value === 'paid' ? 'bg-[#e7f0ea] text-[#235b3e] border-[#c9dfd0]' : kind === 'payment' && value === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-100' : kind === 'payment' && ['pending', 'partial'].includes(value) ? 'bg-amber-50 text-amber-800 border-amber-100' : kind === 'commission' && value === 'paid' ? 'bg-[#e7f0ea] text-[#235b3e] border-[#c9dfd0]' : kind === 'commission' && value === 'pending_payment' ? 'bg-amber-50 text-amber-800 border-amber-100' : kind === 'commission' && ['to_validate', 'generated'].includes(value) ? 'bg-sky-50 text-sky-800 border-sky-100' : kind === 'commission' && value === 'void' ? 'bg-rose-50 text-rose-700 border-rose-100' : kind === 'contract' && value === 'signed' ? 'bg-[#e7f0ea] text-[#235b3e] border-[#c9dfd0]' : 'bg-slate-50 text-slate-600 border-slate-200'
  return { label: labels[value] ?? 'Sin definir', className: tone }
}

const commissionPendingStates = ['to_validate', 'generated', 'pending_payment']

export function getOpportunityFinancialCue(paymentStatus: string, commissionStatus: string) {
  if (paymentStatus === 'paid' && commissionPendingStates.includes(commissionStatus)) {
    return { label: 'Cliente pago · Participacion pendiente', className: 'bg-emerald-50 text-emerald-800 border-emerald-100', rowClassName: 'border-l-2 border-l-amber-400 bg-amber-50/30' }
  }
  if (commissionStatus === 'paid') {
    return { label: 'Participacion pagada', className: 'bg-emerald-50 text-emerald-800 border-emerald-100', rowClassName: '' }
  }
  if (paymentStatus === 'overdue') {
    return { label: 'Pago cliente vencido', className: 'bg-rose-50 text-rose-700 border-rose-100', rowClassName: 'border-l-2 border-l-rose-300 bg-rose-50/20' }
  }
  if (paymentStatus === 'partial') {
    return { label: 'Pago parcial', className: 'bg-amber-50 text-amber-800 border-amber-100', rowClassName: '' }
  }
  if (paymentStatus === 'pending') {
    return { label: 'Pago cliente pendiente', className: 'bg-amber-50 text-amber-800 border-amber-100', rowClassName: '' }
  }
  return { label: getOpportunityPresentation('commission', commissionStatus).label, className: getOpportunityPresentation('commission', commissionStatus).className, rowClassName: '' }
}

export function isCommissionPending(status: string) {
  return commissionPendingStates.includes(status)
}
