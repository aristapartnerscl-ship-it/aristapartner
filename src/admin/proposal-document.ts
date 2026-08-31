import type { CommercialProposalVersionRecord, CommercialProposalWithOpportunity, OrganizationSettingsRecord } from '../types/admin'

export type ProposalDocumentModel = {
  code: string
  version: number
  issuedAt: string
  validUntil: string | null
  title: string
  description: string | null
  clientNotes: string | null
  currency: string | null
  subtotal: number
  taxPercentage: number
  taxAmount: number
  totalAmount: number
  counterparty: string | null
  contactName: string | null
  opportunityTitle: string | null
  opportunityType: string | null
  companyName: string | null
  organization: {
    displayName: string
    legalName: string | null
    email: string | null
    phone: string | null
    website: string | null
    address: string | null
    cityRegion: string | null
    country: string | null
  }
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => Boolean(value?.trim()))?.trim() ?? null
}

export function formatProposalDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(`${value.length === 10 ? `${value}T12:00:00` : value}`)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(date)
}

export function formatProposalMoney(value: number, currency: string | null) {
  const amount = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
  return `${amount}${currency ? ` ${currency}` : ''}`
}

export function getProposalFileName(code: string, version: number) {
  const safeCode = code.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `Arista_${safeCode}_v${version}.pdf`
}

export function buildProposalDocumentModel(proposal: CommercialProposalWithOpportunity, version: CommercialProposalVersionRecord, organization: OrganizationSettingsRecord | null): ProposalDocumentModel {
  const contact = proposal.contact
  return {
    code: proposal.proposal_code,
    version: version.version_number,
    issuedAt: formatProposalDate(version.created_at) ?? formatProposalDate(proposal.created_at) ?? '',
    validUntil: formatProposalDate(version.valid_until),
    title: version.title,
    description: version.description,
    clientNotes: version.client_notes,
    currency: version.currency,
    subtotal: version.subtotal,
    taxPercentage: version.tax_percentage,
    taxAmount: version.tax_amount,
    totalAmount: version.total_amount,
    counterparty: firstText(contact?.company_name, contact?.full_name),
    contactName: firstText(contact?.full_name),
    opportunityTitle: firstText(proposal.opportunity.title),
    opportunityType: proposal.opportunity.opportunity_type === 'buy' ? 'Compra' : 'Venta',
    companyName: firstText(organization?.legal_name, organization?.display_name),
    organization: {
      displayName: organization?.display_name ?? 'ARISTA PARTNERS',
      legalName: organization?.legal_name ?? null,
      email: organization?.public_email ?? null,
      phone: organization?.public_phone ?? null,
      website: organization?.website_url ?? null,
      address: organization?.address_line ?? null,
      cityRegion: organization?.city_region ?? null,
      country: organization?.country_code ?? null,
    },
  }
}
