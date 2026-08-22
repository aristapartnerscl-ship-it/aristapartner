import type { ActivityType, AgreementCounterpartyType, AgreementPayerType, AgreementStatus, CommissionType, CompensationModel, InquiryReason, InquiryStatus, OpportunityStatus, OpportunitySupplierStatus, OpportunityType, PreferredContactMethod, Priority, SupplierStatus } from '../types/admin'

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  buy: 'Compra',
  sell: 'Venta',
}

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  new: 'Nueva',
  under_review: 'En evaluación',
  information_requested: 'Información solicitada',
  accepted: 'Aceptada',
  active: 'Activa',
  negotiating: 'En negociación',
  won: 'Concretada',
  lost: 'No concretada',
  rejected: 'Rechazada',
  archived: 'Archivada',
}

export const priorityLabels: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export const activityTypeLabels: Record<ActivityType, string> = {
  note: 'Nota',
  call: 'Llamada',
  email: 'Correo',
  meeting: 'Reunión',
  proposal: 'Propuesta',
  quotation: 'Cotización',
  status_change: 'Cambio de estado',
  follow_up: 'Seguimiento',
}

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  pending: 'Pendiente',
  under_review: 'En evaluación',
  approved: 'Aprobado',
  inactive: 'Inactivo',
  rejected: 'Rechazado',
  archived: 'Archivado',
}

export const opportunitySupplierStatusLabels: Record<OpportunitySupplierStatus, string> = {
  identified: 'Identificado',
  contacted: 'Contactado',
  information_requested: 'Información solicitada',
  quoted: 'Cotizó',
  shortlisted: 'Preseleccionado',
  selected: 'Seleccionado',
  discarded: 'Descartado',
}

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: 'Nueva',
  read: 'Leída',
  replied: 'Respondida',
  converted: 'Convertida',
  archived: 'Archivada',
}

export const inquiryReasonLabels: Record<InquiryReason, string> = {
  services: 'Consulta sobre servicios',
  commercial_representation: 'Representación comercial',
  supplier_search: 'Búsqueda de proveedores',
  b2b_opportunity: 'Oportunidad B2B',
  collaboration: 'Propuesta de colaboración',
  press: 'Prensa o comunicación',
  other: 'Otro',
}

export const preferredContactMethodLabels: Record<PreferredContactMethod, string> = {
  email: 'Correo electrónico',
  phone_whatsapp: 'Teléfono o WhatsApp',
  any: 'Cualquiera',
}

export const compensationModelLabels: Record<CompensationModel, string> = {
  management_fee: 'Fee de gestion',
  commission: 'Comision',
  mixed: 'Mixto',
}

export const commissionTypeLabels: Record<CommissionType, string> = {
  percentage: 'Porcentaje',
  fixed_amount: 'Monto fijo',
}

export const agreementStatusLabels: Record<AgreementStatus, string> = {
  draft: 'Borrador',
  proposed: 'Propuesto',
  accepted: 'Aceptado',
  expired: 'Vencido',
  terminated: 'Terminado',
}

export const agreementCounterpartyTypeLabels: Record<AgreementCounterpartyType, string> = {
  contact: 'Contacto',
  supplier: 'Proveedor',
}

export const agreementPayerTypeLabels: Record<AgreementPayerType, string> = {
  buyer: 'Comprador',
  seller: 'Vendedor',
  supplier: 'Proveedor',
  both: 'Ambas partes',
  other: 'Otro',
}

export const opportunityStatuses = Object.keys(opportunityStatusLabels) as OpportunityStatus[]
export const priorities = Object.keys(priorityLabels) as Priority[]
export const activityTypes = Object.keys(activityTypeLabels) as ActivityType[]
export const supplierStatuses = Object.keys(supplierStatusLabels) as SupplierStatus[]
export const opportunitySupplierStatuses = Object.keys(opportunitySupplierStatusLabels) as OpportunitySupplierStatus[]
export const inquiryStatuses = Object.keys(inquiryStatusLabels) as InquiryStatus[]
export const inquiryReasons = Object.keys(inquiryReasonLabels) as InquiryReason[]
export const preferredContactMethods = Object.keys(preferredContactMethodLabels) as PreferredContactMethod[]
export const compensationModels = Object.keys(compensationModelLabels) as CompensationModel[]
export const commissionTypes = Object.keys(commissionTypeLabels) as CommissionType[]
export const agreementStatuses = Object.keys(agreementStatusLabels) as AgreementStatus[]
export const agreementCounterpartyTypes = Object.keys(agreementCounterpartyTypeLabels) as AgreementCounterpartyType[]
export const agreementPayerTypes = Object.keys(agreementPayerTypeLabels) as AgreementPayerType[]

export function contactName(contact: { full_name: string | null; company_name: string | null } | null | undefined) {
  if (!contact) return 'Sin contacto'
  return contact.full_name?.trim() || contact.company_name?.trim() || 'Sin nombre'
}

export function contactCompany(contact: { company_name: string | null } | null | undefined) {
  return contact?.company_name?.trim() || ''
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`))
}

export function formatMoney(value: number | null, currency: string | null) {
  if (value === null) return '—'
  if (!currency || currency === 'Otra') return new Intl.NumberFormat('es-CL').format(value)
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(value)
}

export function toDateTimeLocal(value: string | null | undefined) {
  const date = value ? new Date(value) : new Date()
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return offsetDate.toISOString().slice(0, 16)
}

export function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null
}

export function isTerminalOpportunityStatus(status: OpportunityStatus) {
  return status === 'archived' || status === 'rejected' || status === 'won' || status === 'lost'
}
