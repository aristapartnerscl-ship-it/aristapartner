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
export type AdminRole = 'owner' | 'collaborator'
export type AdminInvitationStatus = 'pending' | 'accepted' | 'revoked'
export type RepresentedCompanyStatus = 'active' | 'inactive'
export type CompanyLogoSource = 'manual' | 'detected' | 'fallback'
export type RepresentedCompanyMembershipStatus = 'active' | 'inactive'
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
export type RedComercialProspectStatus =
  | 'to_contact'
  | 'contacted_no_response'
  | 'responded'
  | 'follow_up'
  | 'interested'
  | 'meeting_scheduled'
  | 'agreed'
  | 'not_interested'
  | 'archived'
export type RedComercialProspectChannel = 'email' | 'whatsapp' | 'linkedin' | 'phone' | 'website' | 'referral' | 'other'
export type RedComercialProspectActivityType =
  | 'call'
  | 'email'
  | 'whatsapp'
  | 'linkedin'
  | 'meeting'
  | 'note'
  | 'followup'
  | 'status_change'
  | 'assignment_change'
  | 'archive_change'

export type AdminProfileRow = Override<TableRow<'admin_profiles'>, {
  role: AdminRole
  email?: string | null
  last_activity_at?: string | null
  invitation_status?: AdminInvitationStatus
  invited_at?: string | null
  invitation_sent_at?: string | null
  invitation_revoked_at?: string | null
  onboarding_completed_at?: string | null
  invited_by?: string | null
}>

export type RepresentedCompanyRow = {
  id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  logo_storage_path: string | null
  logo_source: CompanyLogoSource
  status: RepresentedCompanyStatus
  offer_summary: string | null
  problem_solved: string | null
  ideal_customer: string | null
  target_industries: string[]
  territory: string | null
  keywords: string[]
  opportunity_examples: string[]
  what_not_to_promise: string | null
  internal_owner_id: string | null
  created_at: string
  updated_at: string
}

export type RepresentedCompanyInsert = Omit<RepresentedCompanyRow, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type RepresentedCompanyUpdate = Partial<RepresentedCompanyInsert>

export type RepresentedCompanyPrivateDetailsRow = {
  represented_company_id: string
  agreed_commission: string | null
  contract_notes: string | null
  economic_terms: string | null
  sensitive_notes: string | null
  created_at: string
  updated_at: string
}

export type RepresentedCompanySalesPlaybookRow = {
  represented_company_id: string
  value_proposition: string | null
  sales_offerings: string | null
  modalities: string | null
  plans: string | null
  inclusions: string | null
  exclusions: string | null
  use_cases: string | null
  recurring_model: string | null
  buyer_roles: string | null
  decision_makers: string | null
  influencers: string | null
  needs: string | null
  intent_signals: string | null
  qualification_criteria: string | null
  disqualification_criteria: string | null
  short_pitch: string | null
  introduction_guidance: string | null
  discovery_questions: string[]
  sales_process: string | null
  required_information: string | null
  material_guidance: string | null
  recommended_next_step: string | null
  sales_plan: string | null
  opportunity_triggers: string[]
  cross_sell_use_cases: string[]
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type RepresentedCompanyFaqRow = {
  id: string
  represented_company_id: string
  type: 'faq' | 'objection'
  question: string
  answer: string
  requires_escalation: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RepresentedCompanyMaterialRow = {
  id: string
  represented_company_id: string
  title: string
  description: string | null
  material_type: string
  storage_path: string | null
  external_url: string | null
  visibility: 'directory' | 'assigned_only' | 'admin_only'
  uploaded_by: string | null
  created_at: string
  is_archived: boolean
}

export type RepresentedCompanyMembershipRow = {
  id: string
  represented_company_id: string
  user_id: string
  status: RepresentedCompanyMembershipStatus
  assigned_at: string
  assigned_by: string | null
  created_at: string
  updated_at: string
}

export type RedComercialProspectListRow = {
  id: string
  represented_company_id: string
  company_name: string
  logo_storage_path?: string | null
  logo_source?: CompanyLogoSource
  logo_updated_at?: string | null
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  contact_phone: string | null
  channel: RedComercialProspectChannel | null
  status: RedComercialProspectStatus
  first_contact_at: string | null
  last_contact_at: string | null
  next_followup_at: string | null
  owner_user_id: string | null
  owner_name: string | null
  is_archived: boolean
  can_view_detail: boolean
  total_count: number
}

export type RedComercialProspectMetrics = {
  total_prospects: number
  to_contact: number
  contacted_no_response: number
  follow_up: number
  agreed: number
  overdue: number
  today: number
  interested: number
}

export type RedComercialProspectAssignee = {
  id: string
  full_name: string | null
  email: string | null
}

export type RedComercialProspectActivity = {
  id: string
  activity_type: RedComercialProspectActivityType
  title: string
  description: string | null
  activity_at: string
  created_at: string
  created_by: string
  created_by_name: string | null
}

export type RedComercialProspectDetail = {
  id: string
  represented_company_id: string
  company_name: string
  logo_storage_path?: string | null
  logo_source?: CompanyLogoSource
  logo_updated_at?: string | null
  website_url: string | null
  domain: string | null
  rut: string | null
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  contact_phone: string | null
  channel: RedComercialProspectChannel | null
  status: RedComercialProspectStatus
  first_contact_at: string | null
  last_contact_at: string | null
  next_followup_at: string | null
  owner_user_id: string | null
  owner: RedComercialProspectAssignee | null
  collaborators: RedComercialProspectAssignee[]
  internal_notes: string | null
  is_archived: boolean
  can_view_detail: boolean
  activities: RedComercialProspectActivity[]
  created_at: string
  updated_at: string
}

export type RedComercialFollowupView = 'all' | 'today' | 'overdue' | 'upcoming' | 'no_followup' | 'stale'

export type RedComercialFollowupListRow = {
  id: string
  represented_company_id: string
  represented_company_name: string
  represented_company_logo_storage_path: string | null
  company_name: string
  logo_storage_path?: string | null
  logo_source?: CompanyLogoSource
  logo_updated_at?: string | null
  status: RedComercialProspectStatus
  channel: RedComercialProspectChannel | null
  last_contact_at: string | null
  next_followup_at: string | null
  owner_user_id: string | null
  owner_name: string | null
  latest_activity_title: string | null
  latest_activity_type: RedComercialProspectActivityType | null
  latest_activity_at: string | null
  is_no_movement: boolean
  days_overdue: number
  total_count: number
}

export type RedComercialFollowupMetrics = {
  today: number
  overdue: number
  upcoming: number
  no_followup: number
  no_movement: number
  total: number
}

export type RedComercialProspectDuplicate = {
  id: string
  company_name: string
  status: RedComercialProspectStatus
  owner_name: string | null
  duplicate_reason: string
  same_company: boolean
}

export type RedComercialOpportunity = {
  id: string
  prospect_id: string
  status: 'in_process' | 'won' | 'lost' | 'cancelled'
  control_mode: 'collaborator' | 'arista' | 'shared'
  contract_status: string
  payment_status: string
  commission_status: string
  result_status: 'in_process' | 'won' | 'lost' | 'cancelled'
  attributed_collaborator_id: string | null
  attributed_collaborator_name?: string | null
  collaborator_compensation_type: 'percentage' | 'fixed_amount' | null
  collaborator_compensation_rate: number | null
  collaborator_compensation_amount: number | null
  sale_net_amount: number | null
  currency: string
  handed_off_at: string | null
  closed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type RedComercialOpportunityListRow = RedComercialOpportunity & {
  represented_company_name: string
  represented_company_logo_storage_path: string | null
  prospect_company_name: string
  prospect_logo_storage_path: string | null
  attributed_collaborator_name: string | null
  can_edit: boolean
}

export type RedComercialOpportunityMetrics = {
  total: number
  in_process: number
  arista: number
  collaborator: number
  contract_pending: number
  payment_pending: number
  commission_pending: number
  won: number
  lost: number
}

export type RedComercialCrossOpportunity = {
  id: string
  source_prospect_id: string
  source_prospect_company_name: string
  source_prospect_logo_storage_path: string | null
  source_represented_company_id: string
  source_represented_company_name: string
  source_represented_company_logo_storage_path: string | null
  target_represented_company_id: string
  target_company_name: string
  target_company_logo_storage_path: string | null
  detected_by: string
  detected_by_name: string | null
  reason: string
  status: 'detected' | 'under_review' | 'assigned' | 'converted' | 'discarded'
  assigned_to: string | null
  assigned_to_name: string | null
  converted_prospect_id: string | null
  converted_prospect_company_name: string | null
  converted_at: string | null
  converted_by: string | null
  converted_by_name: string | null
  discarded_at: string | null
  discarded_by: string | null
  discarded_by_name: string | null
  discard_reason: 'not_applicable' | 'already_exists' | 'no_fit' | 'insufficient_info' | 'other' | null
  discard_note: string | null
  created_at: string
  updated_at: string
  can_manage: boolean
}

export type RedComercialCrossOpportunityMetrics = {
  total: number
  detected: number
  under_review: number
  assigned: number
  converted: number
  discarded: number
}

export type RedComercialProspectNote = {
  id: string
  prospect_id: string
  body: string
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type RedComercialProspectFile = {
  id: string
  prospect_id: string
  opportunity_id: string | null
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  category: 'general' | 'proposal' | 'contract' | 'commercial' | 'other'
  uploaded_by: string
  created_at: string
}

export type RedComercialProspectPanel = {
  prospect: RedComercialProspectDetail
  opportunities: RedComercialOpportunity[]
  cross_opportunities: RedComercialCrossOpportunity[]
  notes: RedComercialProspectNote[]
  files: RedComercialProspectFile[]
}

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
