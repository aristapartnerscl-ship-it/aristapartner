// Domain-friendly aliases derived from the generated Supabase schema types.
// Pending: keep regenerating src/types/supabase.generated.ts from Supabase CLI.

import type { Database, Json } from './supabase.generated'

export type { Database, Json }

type PublicTables = Database['public']['Tables']
type TableRow<TableName extends keyof PublicTables> = PublicTables[TableName]['Row']
type TableInsert<TableName extends keyof PublicTables> = PublicTables[TableName]['Insert']
type TableUpdate<TableName extends keyof PublicTables> = PublicTables[TableName]['Update']
type PublicFunctions = Database['public']['Functions']
type FunctionArgs<FunctionName extends keyof PublicFunctions> = PublicFunctions[FunctionName]['Args']
type FunctionReturns<FunctionName extends keyof PublicFunctions> = PublicFunctions[FunctionName]['Returns']
type Override<Base, Fields> = Omit<Base, keyof Fields> & Fields

export type ContactType = 'person' | 'company'
export type AdminRole = 'owner'
export type OpportunityType = 'buy' | 'sell'
export type OpportunityStatus =
  | 'new'
  | 'under_review'
  | 'information_requested'
  | 'accepted'
  | 'active'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'rejected'
  | 'archived'
export type Priority = 'low' | 'medium' | 'high'
export type SupplierStatus = 'pending' | 'under_review' | 'approved' | 'inactive' | 'rejected' | 'archived'
export type InquiryStatus = 'new' | 'read' | 'replied' | 'converted' | 'archived'
export type OpportunitySupplierStatus =
  | 'identified'
  | 'contacted'
  | 'information_requested'
  | 'quoted'
  | 'shortlisted'
  | 'selected'
  | 'discarded'
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'proposal' | 'quotation' | 'status_change' | 'follow_up'
export type CompensationModel = 'management_fee' | 'commission' | 'mixed'
export type CommissionType = 'percentage' | 'fixed_amount'
export type AgreementStatus = 'draft' | 'proposed' | 'accepted' | 'expired' | 'terminated'
export type AgreementCounterpartyType = 'contact' | 'supplier'
export type AgreementPayerType = 'buyer' | 'seller' | 'supplier' | 'both' | 'other'
export type SubmissionType = 'buy' | 'sell' | 'supplier' | 'contact'
export type SubmissionStatus = 'received' | 'under_review' | 'converted' | 'rejected' | 'spam' | 'archived'
export type OrganizationSettingsKey = 'arista_partners'
export type AdminNotificationType = 'form_submission_received'
export type AdminNotificationEntityType = 'form_submission'
export type ProspectType = 'person' | 'company'
export type ProspectTemperature = 'cold' | 'identified' | 'qualified'
export type ProspectLeadTemperature = ProspectTemperature
export type ProspectPriority = 'low' | 'medium' | 'high'
export type ProspectStatus =
  | 'new'
  | 'pending_contact'
  | 'attempted'
  | 'contacted'
  | 'awaiting_response'
  | 'follow_up'
  | 'interested'
  | 'qualified'
  | 'not_interested'
  | 'no_response'
  | 'converted'
  | 'archived'
export type ProspectActivityType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | 'status_change' | 'follow_up'
export type ProspectActivityOutcome =
  | 'answered'
  | 'no_answer'
  | 'message_sent'
  | 'interested'
  | 'call_later'
  | 'meeting_scheduled'
  | 'not_interested'
  | 'other'

export type AdminProfileRow = Override<TableRow<'admin_profiles'>, { role: AdminRole }>

export type ContactRow = Override<TableRow<'contacts'>, { contact_type: ContactType }>

export type OpportunityRow = Override<
  TableRow<'opportunities'>,
  {
    opportunity_type: OpportunityType
    status: OpportunityStatus
    priority: Priority
  }
>

export type SupplierRow = Override<TableRow<'suppliers'>, { status: SupplierStatus }>

export type InquiryRow = Override<TableRow<'inquiries'>, { status: InquiryStatus }>

export type OpportunitySupplierRow = Override<TableRow<'opportunity_suppliers'>, { status: OpportunitySupplierStatus }>

export type OpportunityActivityRow = Override<TableRow<'opportunity_activities'>, { activity_type: ActivityType }>

export type CommercialAgreementRow = Override<
  TableRow<'commercial_agreements'>,
  {
    counterparty_type: AgreementCounterpartyType | null
    payer_type: AgreementPayerType | null
    compensation_model: CompensationModel
    commission_type: CommissionType | null
    agreement_status: AgreementStatus
  }
>

export type FormSubmissionRow = Override<
  TableRow<'form_submissions'>,
  {
    submission_type: SubmissionType
    status: SubmissionStatus
  }
>

export type OrganizationSettingsRow = Override<
  TableRow<'organization_settings'>,
  {
    singleton_key: OrganizationSettingsKey
    default_opportunity_priority: Priority
    default_commission_type: CommissionType | null
  }
>

export type AdminNotificationRow = Override<
  TableRow<'admin_notifications'>,
  {
    notification_type: AdminNotificationType
    entity_type: AdminNotificationEntityType | null
  }
>
export type AdminNotificationInsert = Override<
  TableInsert<'admin_notifications'>,
  {
    notification_type: AdminNotificationType
    entity_type?: AdminNotificationEntityType | null
  }
>
export type AdminNotificationUpdate = Override<
  TableUpdate<'admin_notifications'>,
  {
    notification_type?: AdminNotificationType
    entity_type?: AdminNotificationEntityType | null
  }
>

export type ContactInsert = Override<Omit<TableInsert<'contacts'>, 'id' | 'created_at' | 'updated_at'>, { contact_type: ContactType }>
export type ContactUpdate = Override<Omit<TableUpdate<'contacts'>, 'id' | 'created_at' | 'created_by'>, { contact_type?: ContactType }>

export type OpportunityInsert = Override<
  Omit<TableInsert<'opportunities'>, 'id' | 'created_at' | 'updated_at'>,
  {
    opportunity_type: OpportunityType
    status?: OpportunityStatus
    priority?: Priority
  }
>
export type OpportunityUpdate = Override<
  Omit<TableUpdate<'opportunities'>, 'id' | 'created_at' | 'created_by'>,
  {
    opportunity_type?: OpportunityType
    status?: OpportunityStatus
    priority?: Priority
  }
>

export type SupplierInsert = Override<Omit<TableInsert<'suppliers'>, 'id' | 'created_at' | 'updated_at'>, { status?: SupplierStatus }>
export type SupplierUpdate = Override<Omit<TableUpdate<'suppliers'>, 'id' | 'created_at' | 'created_by'>, { status?: SupplierStatus }>

export type InquiryInsert = Override<Omit<TableInsert<'inquiries'>, 'id' | 'created_at' | 'updated_at'>, { status?: InquiryStatus }>
export type InquiryUpdate = Override<Omit<TableUpdate<'inquiries'>, 'id' | 'created_at'>, { status?: InquiryStatus }>

export type OpportunitySupplierInsert = Override<
  Omit<TableInsert<'opportunity_suppliers'>, 'id' | 'created_at' | 'updated_at'>,
  { status?: OpportunitySupplierStatus }
>
export type OpportunitySupplierUpdate = Override<
  Omit<TableUpdate<'opportunity_suppliers'>, 'id' | 'created_at'>,
  { status?: OpportunitySupplierStatus }
>

export type OpportunityActivityInsert = Override<
  Omit<TableInsert<'opportunity_activities'>, 'id' | 'created_at' | 'completed_at' | 'completed_by'>,
  {
    activity_type: ActivityType
    completed_at?: string | null
    completed_by?: string | null
  }
>
export type OpportunityActivityUpdate = Override<
  Omit<TableUpdate<'opportunity_activities'>, 'id' | 'created_at' | 'created_by'>,
  { activity_type?: ActivityType }
>

export type CommercialAgreementInsert = Override<
  Omit<TableInsert<'commercial_agreements'>, 'id' | 'created_at' | 'updated_at' | 'agreement_code' | 'archived_at' | 'archived_by'>,
  {
    counterparty_type?: AgreementCounterpartyType | null
    payer_type?: AgreementPayerType | null
    compensation_model: CompensationModel
    commission_type?: CommissionType | null
    agreement_status?: AgreementStatus
    agreement_code?: string
    archived_at?: string | null
    archived_by?: string | null
  }
>
export type CommercialAgreementUpdate = Override<
  Omit<TableUpdate<'commercial_agreements'>, 'id' | 'created_at' | 'created_by' | 'agreement_code'>,
  {
    counterparty_type?: AgreementCounterpartyType | null
    payer_type?: AgreementPayerType | null
    compensation_model?: CompensationModel
    commission_type?: CommissionType | null
    agreement_status?: AgreementStatus
  }
>

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'negotiation' | 'accepted' | 'rejected' | 'expired'

export type CommercialProposalRow = {
  id: string
  proposal_code: string
  opportunity_id: string
  title: string
  description: string | null
  currency: string | null
  subtotal: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  valid_until: string | null
  status: ProposalStatus
  sent_at: string | null
  viewed_at: string | null
  accepted_at: string | null
  accepted_version_id?: string | null
  rejected_at: string | null
  internal_notes: string | null
  client_notes: string | null
  archived_at: string | null
  archived_by: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type CommercialProposalInsert = Omit<CommercialProposalRow, 'id' | 'proposal_code' | 'tax_amount' | 'total_amount' | 'archived_at' | 'archived_by' | 'created_by' | 'created_at' | 'updated_at' | 'sent_at' | 'viewed_at' | 'accepted_at' | 'accepted_version_id' | 'rejected_at'> & Partial<Pick<CommercialProposalRow, 'sent_at' | 'viewed_at' | 'accepted_at' | 'rejected_at'>>
export type CommercialProposalUpdate = Partial<Omit<CommercialProposalRow, 'id' | 'proposal_code' | 'tax_amount' | 'total_amount' | 'created_by' | 'created_at' | 'updated_at' | 'archived_by' | 'accepted_version_id'>>

// These aliases stay local until the versions migration is applied remotely and types are regenerated.
export type CommercialProposalVersionRow = {
  id: string
  proposal_id: string
  version_number: number
  title: string
  description: string | null
  currency: string | null
  subtotal: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  valid_until: string | null
  client_notes: string | null
  snapshot_data: Json
  created_by: string
  created_at: string
}
export type CommercialProposalVersionInsert = Omit<CommercialProposalVersionRow, 'id' | 'created_by' | 'created_at'> & { created_by?: string; created_at?: string }
export type CommercialProposalVersionUpdate = never
export type CommercialProposalDocumentRow = {
  id: string
  proposal_id: string
  version_id: string
  document_type: 'pdf'
  file_name: string
  generated_at: string
  generated_by: string
}
export type CommercialProposalDocumentInsert = Omit<CommercialProposalDocumentRow, 'id' | 'generated_at' | 'generated_by'> & { generated_at?: string; generated_by?: string }
export type CommercialProposalDocumentUpdate = never

export type CommercialProposalPublicLinkStatus = 'active' | 'revoked' | 'expired' | 'responded'
export type CommercialProposalPublicResponse = 'accepted' | 'rejected'
export type CommercialProposalPublicLinkRow = {
  id: string
  proposal_id: string
  version_id: string
  token_hash: string
  status: CommercialProposalPublicLinkStatus
  expires_at: string | null
  created_by: string
  created_at: string
  revoked_at: string | null
  first_viewed_at: string | null
  last_viewed_at: string | null
  view_count: number
  responded_at: string | null
  response: CommercialProposalPublicResponse | null
  response_name: string | null
  response_email: string | null
  response_comment: string | null
}
export type CommercialProposalPublicLinkInsert = Pick<CommercialProposalPublicLinkRow, 'proposal_id' | 'version_id' | 'token_hash' | 'expires_at'>
export type CommercialProposalPublicLinkUpdate = Pick<CommercialProposalPublicLinkRow, 'status' | 'revoked_at'>

export type FormSubmissionInsert = Override<
  Omit<TableInsert<'form_submissions'>, 'id' | 'submitted_at'>,
  {
    submission_type: SubmissionType
    status?: SubmissionStatus
  }
>
export type FormSubmissionUpdate = Override<Omit<TableUpdate<'form_submissions'>, 'id' | 'submitted_at'>, { status?: SubmissionStatus }>

export type OrganizationSettingsInsert = Override<
  Omit<TableInsert<'organization_settings'>, 'created_at' | 'updated_at'>,
  {
    singleton_key?: OrganizationSettingsKey
    default_opportunity_priority?: Priority
    default_commission_type?: CommissionType | null
  }
>
export type OrganizationSettingsUpdate = Override<
  Omit<TableUpdate<'organization_settings'>, 'singleton_key' | 'created_at' | 'created_by'>,
  {
    default_opportunity_priority?: Priority
    default_commission_type?: CommissionType | null
  }
>

export type ContactFormValues = {
  contact_type: ContactType
  full_name: string
  company_name: string
  position: string
  email: string
  phone: string
  website: string
  social_media: string
  country: string
  region: string
  city: string
  source: string
  notes: string
}

export type ProspectRow = Override<
  TableRow<'prospects'>,
  {
    prospect_type: ProspectType
    lead_temperature: ProspectLeadTemperature
    status: ProspectStatus
    priority: ProspectPriority
  }
>
export type ProspectInsert = Override<
  TableInsert<'prospects'>,
  {
    prospect_type: ProspectType
    lead_temperature?: ProspectLeadTemperature
    status?: ProspectStatus
    priority?: ProspectPriority
  }
>
export type ProspectUpdate = Override<
  TableUpdate<'prospects'>,
  {
    prospect_type?: ProspectType
    lead_temperature?: ProspectLeadTemperature
    status?: ProspectStatus
    priority?: ProspectPriority
  }
>

export type ProspectActivityRow = Override<
  TableRow<'prospect_activities'>,
  {
    activity_type: ProspectActivityType
    outcome: ProspectActivityOutcome | null
  }
>
export type ProspectActivityInsert = Override<
  TableInsert<'prospect_activities'>,
  {
    activity_type: ProspectActivityType
    outcome?: ProspectActivityOutcome | null
  }
>
export type ProspectActivityUpdate = Override<
  TableUpdate<'prospect_activities'>,
  {
    activity_type?: ProspectActivityType
    outcome?: ProspectActivityOutcome | null
  }
>

export type CreateProspectActivityAtomicArgs = Override<
  FunctionArgs<'create_prospect_activity_atomic'>,
  {
    p_activity_type: ProspectActivityType
    p_outcome?: ProspectActivityOutcome | null
    p_subject?: string | null
    p_notes?: string | null
    p_occurred_at?: string | null
    p_next_action_type?: string | null
    p_next_action_at?: string | null
    p_status?: ProspectStatus | null
  }
>
export type ConvertProspectToOpportunityArgs = Override<
  FunctionArgs<'convert_prospect_to_opportunity'>,
  {
    p_opportunity_type: OpportunityType
    p_description?: string | null
    p_expected_date?: string | null
    p_country?: string | null
    p_region?: string | null
    p_city?: string | null
    p_estimated_value?: number | null
    p_currency?: string | null
    p_internal_notes?: string | null
    p_existing_contact_id?: string | null
    p_contact_type?: ContactType | null
    p_contact_full_name?: string | null
    p_contact_company_name?: string | null
    p_contact_position?: string | null
    p_contact_email?: string | null
    p_contact_phone?: string | null
    p_contact_website?: string | null
    p_contact_social_media?: string | null
    p_contact_country?: string | null
    p_contact_region?: string | null
    p_contact_city?: string | null
    p_contact_notes?: string | null
  }
>
export type ConvertProspectToOpportunityRow = FunctionReturns<'convert_prospect_to_opportunity'>[number]

export type ConvertInquiryToOpportunityAtomicArgs = FunctionArgs<'convert_inquiry_to_opportunity_atomic'>
export type ConvertInquiryToOpportunityAtomicRow = FunctionReturns<'convert_inquiry_to_opportunity_atomic'>[number]
export type ConvertSubmissionAtomicRow =
  | FunctionReturns<'convert_contact_submission_atomic'>[number]
  | FunctionReturns<'convert_buy_submission_atomic'>[number]
  | FunctionReturns<'convert_sell_submission_atomic'>[number]
  | FunctionReturns<'convert_supplier_submission_atomic'>[number]
export type ConvertContactSubmissionAtomicArgs = FunctionArgs<'convert_contact_submission_atomic'>
export type ConvertBuySubmissionAtomicArgs = FunctionArgs<'convert_buy_submission_atomic'>
export type ConvertSellSubmissionAtomicArgs = FunctionArgs<'convert_sell_submission_atomic'>
export type ConvertSupplierSubmissionAtomicArgs = FunctionArgs<'convert_supplier_submission_atomic'>
