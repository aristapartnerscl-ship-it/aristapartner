import type {
  AdminProfileRow,
  AgreementCounterpartyType,
  AgreementPayerType,
  AgreementStatus,
  CommissionType,
  CommercialAgreementRow,
  CommercialAgreementInsert,
  CommercialAgreementUpdate,
  CommercialProposalInsert,
  CommercialProposalRow,
  CommercialProposalUpdate,
  CommercialProposalDocumentInsert,
  CommercialProposalDocumentRow,
  CommercialProposalVersionRow,
  CommercialProposalPublicLinkInsert,
  CommercialProposalPublicLinkRow,
  CommercialProposalPublicLinkStatus,
  CommercialProposalPublicResponse,
  CompensationModel,
  ContactFormValues,
  ConvertBuySubmissionAtomicArgs,
  ConvertContactSubmissionAtomicArgs,
  ConvertInquiryToOpportunityAtomicRow,
  ConvertProspectToOpportunityArgs,
  ConvertProspectToOpportunityRow,
  ConvertSellSubmissionAtomicArgs,
  ConvertSubmissionAtomicRow,
  ConvertSupplierSubmissionAtomicArgs,
  ContactInsert,
  ContactRow,
  ContactType,
  FormSubmissionRow,
  FormSubmissionUpdate,
  InquiryInsert,
  ActivityType,
  AdminNotificationInsert,
  AdminNotificationRow,
  AdminNotificationUpdate,
  InquiryRow,
  InquiryStatus,
  OpportunityInsert,
  OrganizationSettingsInsert,
  OrganizationSettingsRow,
  OrganizationSettingsUpdate,
  OpportunityStatus,
  OpportunityType,
  ProposalStatus,
  OpportunityActivityRow,
  OpportunityActivityInsert,
  OpportunitySupplierInsert,
  OpportunitySupplierRow,
  OpportunitySupplierStatus,
  OpportunitySupplierUpdate,
  OpportunityRow,
  Priority,
  ProspectActivityInsert,
  ProspectActivityOutcome,
  ProspectActivityRow,
  ProspectActivityType,
  ProspectInsert,
  ProspectRow,
  ProspectStatus,
  ProspectTemperature,
  ProspectType,
  ProspectUpdate,
  RedComercialProspectActivity,
  RedComercialProspectActivityType,
  RedComercialProspectChannel,
  RedComercialProspectDetail,
  RedComercialProspectDuplicate,
  RedComercialProspectListRow,
  RedComercialProspectMetrics,
  RedComercialProspectPanel,
  RedComercialOpportunity,
  RedComercialOpportunityListRow,
  RedComercialOpportunityMetrics,
  RedComercialCrossOpportunity,
  RedComercialCrossOpportunityMetrics,
  RedComercialProspectNote,
  RedComercialProspectFile,
  RedComercialProspectStatus,
  RedComercialFollowupListRow,
  RedComercialFollowupMetrics,
  RedComercialFollowupView,
  RepresentedCompanyInsert,
  RepresentedCompanyMembershipRow,
  RepresentedCompanyPrivateDetailsRow,
  RepresentedCompanySalesPlaybookRow,
  RepresentedCompanyFaqRow,
  RepresentedCompanyMaterialRow,
  RepresentedCompanyRow,
  RepresentedCompanyUpdate,
  SupplierRow,
  SupplierStatus,
  SubmissionType,
  SubmissionStatus,
} from './database'

export type {
  ActivityType,
  AdminNotificationInsert,
  AdminNotificationRow,
  AdminNotificationUpdate,
  AgreementCounterpartyType,
  AgreementPayerType,
  AgreementStatus,
  CommissionType,
  CompensationModel,
  CommercialProposalInsert,
  CommercialProposalUpdate,
  CommercialProposalDocumentInsert,
  CommercialProposalDocumentRow,
  CommercialProposalVersionRow,
  CommercialProposalPublicLinkInsert,
  CommercialProposalPublicLinkStatus,
  CommercialProposalPublicResponse,
  ContactFormValues,
  ContactInsert,
  ContactType,
  FormSubmissionUpdate,
  InquiryInsert,
  InquiryStatus,
  OpportunityActivityInsert,
  OpportunitySupplierInsert,
  OpportunitySupplierStatus,
  OpportunitySupplierUpdate,
  OpportunityInsert,
  OrganizationSettingsInsert,
  OpportunityStatus,
  OpportunityType,
  ProposalStatus,
  ProspectActivityInsert,
  ProspectActivityOutcome,
  ProspectActivityType,
  ProspectInsert,
  ProspectStatus,
  ProspectTemperature,
  ProspectType,
  ProspectUpdate,
  RedComercialProspectActivityType,
  RedComercialProspectChannel,
  RedComercialProspectStatus,
  RepresentedCompanyInsert,
  RepresentedCompanyMembershipRow,
  RepresentedCompanyPrivateDetailsRow,
  RepresentedCompanySalesPlaybookRow,
  RepresentedCompanyFaqRow,
  RepresentedCompanyMaterialRow,
  RepresentedCompanyRow,
  RepresentedCompanyUpdate,
  Priority,
  SupplierStatus,
  SubmissionType,
  SubmissionStatus,
}

export type AdminProfile = AdminProfileRow

export type RedComercialRole = 'admin' | 'collaborator'

export type RepresentedCompanyRecord = RepresentedCompanyRow

export type RepresentedCompanyFormValues = {
  name: string
  slug: string
  description: string
  website_url: string
  status: RepresentedCompanyRow['status']
  offer_summary: string
  problem_solved: string
  ideal_customer: string
  target_industries: string
  territory: string
  keywords: string
  opportunity_examples: string
  what_not_to_promise: string
  logo_storage_path: string
  logo_source: RepresentedCompanyRow['logo_source']
}

export type RepresentedCompanyMembershipRecord = RepresentedCompanyMembershipRow
export type RepresentedCompanyPrivateDetailsRecord = RepresentedCompanyPrivateDetailsRow
export type RepresentedCompanySalesPlaybookRecord = RepresentedCompanySalesPlaybookRow
export type RepresentedCompanyFaqRecord = RepresentedCompanyFaqRow
export type RepresentedCompanyMaterialRecord = RepresentedCompanyMaterialRow
export type RedComercialCompanyWorkspace = {
  company: RepresentedCompanyRecord
  playbook: Partial<RepresentedCompanySalesPlaybookRecord>
  faqs: RepresentedCompanyFaqRecord[]
  materials: RepresentedCompanyMaterialRecord[]
  private_details: RepresentedCompanyPrivateDetailsRecord | null
  can_edit: boolean
  is_assigned: boolean
  updated_at: string | null
}
export type CollaboratorRecord = Pick<AdminProfileRow, 'id' | 'full_name' | 'email' | 'role' | 'is_active' | 'created_at' | 'updated_at' | 'last_activity_at' | 'invitation_status' | 'invited_at' | 'invitation_sent_at' | 'invitation_revoked_at' | 'onboarding_completed_at'>

export type RedComercialHomeData = {
  representedCompanies: number
  activeCollaborators: number
  activeMemberships: number
  myMemberships: RepresentedCompanyMembershipRecord[]
  myCompanies: RepresentedCompanyRecord[]
}
export type RedComercialDashboardData = {
  summary: { followups_today: number; followups_overdue: number; active_prospects: number; opportunities_in_process: number; opportunities_arista: number; payments_pending: number; won_this_month: number; commission_pending: number }
  attention_today: Array<{ type: string; label: string; prospect_id: string; prospect_name: string; company_id: string; company_name: string; reason: string; owner_name: string | null; at: string; href: string }>
  upcoming_followups: Array<{ prospect_id: string; prospect_name: string; company_id: string; company_name: string; owner_name: string | null; at: string; status: string; href: string }>
  opportunities: Array<{ id: string; prospect_id: string; prospect_name: string; company_id: string; company_name: string; control_mode: string; contract_status: string; payment_status: string; result_status: string; commission_status?: string | null; collaborator_compensation_type?: 'percentage' | 'fixed_amount' | null; collaborator_compensation_rate?: number | null; collaborator_compensation_amount?: number | null; currency?: string | null; collaborator_name: string | null; updated_at: string; href: string }>
  cross_opportunities: Array<{ id: string; prospect_id: string; prospect_name: string; target_company_id: string; target_company_name: string; detected_by_name: string | null; status: string; created_at: string; href: string }>
  recent_results: Array<{ id: string; prospect_id: string; prospect_name: string; company_id: string; company_name: string; result_status: string; payment_status: string; collaborator_name: string | null; closed_at: string; href: string }>
  portfolios: Array<{ id: string; name: string; logo_storage_path: string | null; active_prospects: number; overdue: number; opportunities_in_process: number; href: string }>
  recent_activity: Array<{ id: string; title: string; activity_type: string; created_by_name: string | null; created_at: string; prospect_name: string }>
}

export type RedComercialProspectListItem = RedComercialProspectListRow
export type RedComercialProspectDetailRecord = RedComercialProspectDetail
export type RedComercialProspectMetricsRecord = RedComercialProspectMetrics
export type RedComercialProspectPanelRecord = RedComercialProspectPanel
export type RedComercialOpportunityRecord = RedComercialOpportunity
export type RedComercialOpportunityListItem = RedComercialOpportunityListRow
export type RedComercialOpportunityMetricsRecord = RedComercialOpportunityMetrics
export type RedComercialCrossOpportunityRecord = RedComercialCrossOpportunity
export type RedComercialCrossOpportunityMetricsRecord = RedComercialCrossOpportunityMetrics
export type RedComercialResultsFilters = {
  from?: string
  to?: string
  companyId?: string
  collaboratorId?: string
  resultStatus?: string
  paymentStatus?: string
  controlMode?: string
  search?: string
  page?: number
  pageSize?: number
}
export type RedComercialResultsSummary = {
  closures: number
  won: number
  lost: number
  cancelled: number
  in_process: number
  paid: number
  payment_pending: number
  commission_pending: number
  close_rate: number | null
  avg_close_days: number | null
}
export type RedComercialResultsCompany = {
  company_id: string
  company_name: string
  company_logo_storage_path: string | null
  closed: number
  won: number
  lost: number
  in_process: number
  paid: number
  payment_pending: number
  volume_by_currency: Record<string, number>
  average_ticket_by_currency: Record<string, number>
}
export type RedComercialResultsCollaborator = {
  collaborator_id: string
  collaborator_name: string | null
  attributed: number
  closed: number
  won: number
  lost: number
  in_process: number
  generated: number
  pending: number
  paid: number
}
export type RedComercialClosure = {
  id: string
  prospect_id: string
  company_id: string
  company_name: string
  company_logo_storage_path: string | null
  prospect_name: string
  result_status: 'won' | 'lost'
  payment_status: string
  commission_status: string
  control_mode: string
  collaborator_id: string | null
  collaborator_name: string | null
  sale_net_amount: number | null
  currency: string
  closed_at: string | null
  created_at: string
}
export type RedComercialResultsData = {
  summary: RedComercialResultsSummary
  volume_by_currency: Record<string, number>
  companies: RedComercialResultsCompany[]
  collaborators: RedComercialResultsCollaborator[]
  closures: RedComercialClosure[]
  total_closures: number
}
export type RedComercialProspectNoteRecord = RedComercialProspectNote
export type RedComercialProspectFileRecord = RedComercialProspectFile
export type RedComercialFollowupListItem = RedComercialFollowupListRow
export type RedComercialFollowupMetricsRecord = RedComercialFollowupMetrics
export type RedComercialProspectDuplicateRecord = RedComercialProspectDuplicate
export type RedComercialProspectActivityRecord = RedComercialProspectActivity

export type RedComercialProspectFilters = {
  search?: string
  status?: RedComercialProspectStatus | ''
  channel?: RedComercialProspectChannel | ''
  ownerUserId?: string
  followupFilter?: 'today' | 'overdue' | ''
  mine?: boolean
  quickFilter?: 'all' | 'today' | 'overdue' | 'no_response' | 'interested'
  includeArchived?: boolean
  pageSize?: number
  page?: number
}

export type RedComercialFollowupFilters = {
  search?: string
  companyId?: string
  responsibleId?: string
  status?: RedComercialProspectStatus | ''
  channel?: RedComercialProspectChannel | ''
  view?: RedComercialFollowupView
  mine?: boolean
  pageSize?: number
  page?: number
}

export type RedComercialOpportunityView = 'all' | 'in_process' | 'arista' | 'contract_pending' | 'payment_pending' | 'commission_pending' | 'won' | 'lost'

export type RedComercialOpportunityFilters = {
  search?: string
  companyId?: string
  controlMode?: RedComercialOpportunity['control_mode'] | ''
  contractStatus?: string
  paymentStatus?: string
  responsibleId?: string
  resultStatus?: RedComercialOpportunity['result_status'] | ''
  view?: RedComercialOpportunityView
  page?: number
  pageSize?: number
}

export type RedComercialCrossOpportunityView = 'all' | RedComercialCrossOpportunityRecord['status']

export type RedComercialCrossOpportunityFilters = {
  search?: string
  sourceCompanyId?: string
  targetCompanyId?: string
  status?: RedComercialCrossOpportunityRecord['status'] | ''
  assignedTo?: string
  view?: RedComercialCrossOpportunityView
  page?: number
  pageSize?: number
}

export type RedComercialProspectFormValues = {
  represented_company_id: string
  company_name: string
  website_url: string
  rut: string
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  channel: RedComercialProspectChannel | ''
  status: RedComercialProspectStatus
  first_contact_at: string
  last_contact_at: string
  next_followup_at: string
  owner_user_id: string
  collaborator_ids: string[]
  internal_notes: string
}

export type RedComercialProspectActivityFormValues = {
  activity_type: RedComercialProspectActivityType
  title: string
  description: string
  activity_at: string
  next_followup_at: string
  status: RedComercialProspectStatus | ''
}

export type AdminNotificationRecord = AdminNotificationRow

export type ContactRecord = ContactRow

export type OpportunityRecord = OpportunityRow

export type CommercialProposalRecord = CommercialProposalRow

export type CommercialProposalVersionRecord = CommercialProposalVersionRow
export type CommercialProposalDocumentRecord = CommercialProposalDocumentRow
export type CommercialProposalPublicLinkRecord = CommercialProposalPublicLinkRow

export type PublicProposalPayload = {
  status: CommercialProposalPublicLinkStatus
  response: CommercialProposalPublicResponse | null
  response_name: string | null
  response_email: string | null
  response_comment: string | null
  responded_at: string | null
  code: string
  version: number
  issued_at: string
  valid_until: string | null
  title: string
  description: string | null
  currency: string | null
  subtotal: number
  tax_percentage: number
  tax_amount: number
  total_amount: number
  client_notes: string | null
  counterparty_name: string | null
  contact_name: string | null
  opportunity_title: string | null
  opportunity_type: 'buy' | 'sell' | null
  organization: {
    display_name: string | null
    legal_name: string | null
    public_email: string | null
    public_phone: string | null
    website_url: string | null
    address_line: string | null
    city_region: string | null
    country_code: string | null
  }
}

export type CommercialProposalWithOpportunity = CommercialProposalRecord & {
  opportunity: Pick<OpportunityRow, 'id' | 'reference_code' | 'title' | 'opportunity_type' | 'status' | 'contact_id'>
  contact: ContactSelectorRecord | null
}

export type CommercialProposalFormValues = {
  opportunity_id: string
  title: string
  description: string
  currency: string
  subtotal: string
  tax_percentage: string
  valid_until: string
  client_notes: string
  internal_notes: string
}

export type ProspectRecord = ProspectRow

export type ProspectActivityRecord = ProspectActivityRow

export type OrganizationSettingsRecord = OrganizationSettingsRow & {
  updatedByProfile: Pick<AdminProfileRow, 'id' | 'full_name'> | null
}

export type OrganizationSettingsFormValues = {
  display_name: string
  legal_name: string
  tax_identifier: string
  public_email: string
  public_phone: string
  website_url: string
  address_line: string
  city_region: string
  country_code: string
  timezone: string
  locale: string
  default_currency: string
  default_opportunity_priority: Priority
  default_follow_up_days: string
  default_attribution_days: string
  default_commission_type: CommissionType | ''
  default_commission_value: string
}

export type OrganizationSettingsUpdateValues = Omit<
  OrganizationSettingsUpdate,
  'singleton_key' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'
>

export type OrganizationSettingsCreateValues = Omit<
  OrganizationSettingsInsert,
  'singleton_key' | 'created_at' | 'created_by' | 'updated_at' | 'updated_by'
>

export type OpportunityFormValues = {
  opportunity_type: OpportunityType
  title: string
  description: string
  contact_id: string
  status: OpportunityStatus
  priority: Priority
  source: string
  assigned_to: string
  expected_date: string
  country: string
  region: string
  city: string
  estimated_value: string
  currency: string
  internal_notes: string
  rejection_reason: string
}

export type OpportunityActivityRecord = OpportunityActivityRow

export type OpportunityActivityFormValues = {
  activity_type: ActivityType
  title: string
  description: string
  occurred_at: string
  next_action_at: string
}

export type ProspectFormValues = {
  prospect_type: ProspectType
  full_name: string
  company_name: string
  role_or_activity: string
  email: string
  phone: string
  website: string
  social_network: string
  country: string
  city_region: string
  source: string
  product_or_service: string
  commercial_origin: string
  lead_temperature: ProspectTemperature
  status: ProspectStatus
  priority: Priority
  preferred_contact_method: string
  next_action_type: string
  next_action_at: string
  notes: string
}

export type ProspectActivityFormValues = {
  activity_type: ProspectActivityType
  outcome: ProspectActivityOutcome | ''
  subject: string
  notes: string
  occurred_at: string
  next_action_type: string
  next_action_at: string
  status: ProspectStatus | ''
}

export type ProspectConversionValues = {
  opportunity_type: OpportunityType
  title: string
  description: string
  expected_date: string
  estimated_value: string
  currency: string
  internal_notes: string
}

export type ContactSelectorRecord = Pick<ContactRow, 'id' | 'contact_type' | 'full_name' | 'company_name' | 'email' | 'phone' | 'city' | 'country'>

export type FollowUpRecord = OpportunityActivityRow & {
  opportunity: Pick<OpportunityRow, 'id' | 'reference_code' | 'title' | 'status' | 'contact_id'>
  contact: ContactSelectorRecord | null
  completedByProfile: Pick<AdminProfileRow, 'id' | 'full_name'> | null
}

export type ProspectFollowUpRecord = ProspectActivityRow & {
  prospect: Pick<ProspectRow, 'id' | 'full_name' | 'company_name' | 'status' | 'priority' | 'phone' | 'email'>
  completedByProfile: Pick<AdminProfileRow, 'id' | 'full_name'> | null
}

export type AgendaFollowUpRecord =
  | (FollowUpRecord & { sourceType: 'opportunity' })
  | (ProspectFollowUpRecord & { sourceType: 'prospect' })

export type SupplierRecord = SupplierRow

export type SupplierFormValues = {
  contact_id: string
  business_name: string
  legal_name: string
  tax_id: string
  description: string
  categories: string[]
  categoryInput: string
  geographic_coverage: string
  supply_capacity: string
  minimum_order: string
  minimum_order_currency: string
  issues_invoice: 'yes' | 'no' | 'unknown'
  commercial_terms: string
  status: SupplierStatus
  internal_notes: string
}

export type SupplierWithContact = SupplierRow & {
  contact: ContactRecord | null
  opportunityCount: number
}

export type OpportunitySupplierRecord = OpportunitySupplierRow

export type SupplierOpportunityRecord = OpportunitySupplierRow & {
  opportunity: Pick<OpportunityRow, 'id' | 'reference_code' | 'title' | 'opportunity_type' | 'status' | 'contact_id'>
  contact: ContactSelectorRecord | null
}

export type OpportunitySupplierWithSupplier = OpportunitySupplierRow & {
  supplier: Pick<SupplierRow, 'id' | 'business_name' | 'categories' | 'status' | 'contact_id'>
  contact: ContactSelectorRecord | null
}

export type OpportunitySupplierFormValues = {
  status: OpportunitySupplierStatus
  proposed_amount: string
  currency: string
  notes: string
}

export type InquiryRecord = InquiryRow

export type InquiryReason =
  | 'services'
  | 'commercial_representation'
  | 'supplier_search'
  | 'b2b_opportunity'
  | 'collaboration'
  | 'press'
  | 'other'

export type PreferredContactMethod = 'email' | 'phone_whatsapp' | 'any'

export type InquiryFormValues = {
  contact_id: string
  reason: InquiryReason | ''
  subject: string
  message: string
  preferred_contact_method: PreferredContactMethod | ''
  status: InquiryStatus
  internal_notes: string
}

export type InquiryWithContact = InquiryRow & {
  contact: ContactRecord | null
  linkedOpportunity: Pick<OpportunityRow, 'id' | 'reference_code' | 'title' | 'status' | 'opportunity_type'> | null
}

export type InquiryConversionValues = {
  opportunity_type: OpportunityType
  title: string
  description: string
  internal_notes: string
}

export type InquiryConversionResult = {
  inquiry: InquiryRecord | null
  opportunity: OpportunityRecord | null
  alreadyConverted: boolean
  rpcResult: ConvertInquiryToOpportunityAtomicRow | null
}

export type CommercialAgreementRecord = CommercialAgreementRow

export type CommercialAgreementWithOpportunity = CommercialAgreementRow & {
  opportunity: OpportunityRecord | null
  contact: ContactSelectorRecord | null
  supplier: SupplierWithContact | null
  archivedByProfile: Pick<AdminProfileRow, 'id' | 'full_name'> | null
}

export type CommercialAgreementFormValues = {
  opportunity_id: string
  counterparty_type: AgreementCounterpartyType | ''
  contact_id: string
  supplier_id: string
  payer_type: AgreementPayerType | ''
  compensation_model: CompensationModel
  management_fee: string
  commission_type: CommissionType | ''
  commission_value: string
  currency: string
  attribution_start: string
  attribution_end: string
  agreement_status: AgreementStatus
  notes: string
}

export type CommercialAgreementCreateValues = Omit<CommercialAgreementInsert, 'created_by' | 'agreement_code' | 'archived_at' | 'archived_by'>

export type CommercialAgreementUpdateValues = Omit<CommercialAgreementUpdate, 'agreement_code' | 'created_by' | 'archived_at' | 'archived_by'>

export type FormSubmissionRecord = FormSubmissionRow

export type FormSubmissionPayload = Record<string, string | number | boolean | null | string[]>

export type FormSubmissionListItem = FormSubmissionRow

export type ConvertedSubmissionEntity =
  | { type: 'inquiry'; record: InquiryRow }
  | { type: 'opportunity'; record: OpportunityRow }
  | { type: 'supplier'; record: SupplierRow }
  | null

export type SubmissionConversionResult = {
  submission: FormSubmissionRecord | null
  contact: ContactRecord | null
  entity: ConvertedSubmissionEntity
  alreadyConverted: boolean
  rpcResult: ConvertSubmissionAtomicRow | null
}

export type SubmissionExistingContactStrategy = {
  existing_contact_id: string
  contact?: never
}

export type SubmissionNewContactStrategy = {
  existing_contact_id?: null
  contact: ContactFormValues
}

export type SubmissionContactStrategy = SubmissionExistingContactStrategy | SubmissionNewContactStrategy

export type ProspectExistingContactStrategy = {
  existing_contact_id: string
  contact?: never
}

export type ProspectNewContactStrategy = {
  existing_contact_id?: null
  contact: ContactFormValues
}

export type ProspectContactStrategy = ProspectExistingContactStrategy | ProspectNewContactStrategy

export type ProspectConversionResult = {
  prospect: ProspectRecord | null
  contact: ContactRecord | null
  opportunity: OpportunityRecord | null
  alreadyConverted: boolean
  rpcResult: ConvertProspectToOpportunityRow | null
}

export type ContactSubmissionRpcArgs = ConvertContactSubmissionAtomicArgs
export type BuySubmissionRpcArgs = ConvertBuySubmissionAtomicArgs
export type SellSubmissionRpcArgs = ConvertSellSubmissionAtomicArgs
export type SupplierSubmissionRpcArgs = ConvertSupplierSubmissionAtomicArgs
export type ProspectConversionRpcArgs = ConvertProspectToOpportunityArgs

export type DashboardMetrics = {
  proposalsOpen?: number | null
  proposalsNegotiation?: number | null
  proposalsAccepted?: number | null
  proposalsExpired?: number | null
  prospectsTotal?: number | null
  prospectsUncontacted?: number | null
  prospectsConverted?: number | null
  pendingFollowUpsToday?: number | null
  newOpportunities: number | null
  activeOpportunities: number | null
  negotiations: number | null
  overdueFollowUps: number | null
  pendingSuppliers: number | null
  newInquiries: number | null
  newFormSubmissions: number | null
  prospectsDueToday: number | null
  overdueProspectFollowUps: number | null
}

export type DashboardActivity = Pick<
  OpportunityActivityRow,
  'id' | 'opportunity_id' | 'title' | 'activity_type' | 'next_action_at' | 'occurred_at' | 'completed_at' | 'completed_by'
>

export type DashboardProspectAction = Pick<
  ProspectRow,
  'id' | 'full_name' | 'company_name' | 'status' | 'priority' | 'next_action_type' | 'next_action_at'
>

export type DashboardData = {
  metrics: DashboardMetrics
  upcomingActions: DashboardActivity[]
  upcomingProspectActions: DashboardProspectAction[]
  recentActivities: DashboardActivity[]
  recentProspects?: ProspectRecord[]
  recentOpportunities?: OpportunityRecord[]
  recentProposals?: CommercialProposalWithOpportunity[]
  hasMetricErrors: boolean
  activityError: boolean
}

export type RepositoryErrorKind = 'auth' | 'authorization' | 'network' | 'validation' | 'not_found' | 'unknown'

export type RepositoryResult<T> = {
  data: T
  error: string | null
  errorKind?: RepositoryErrorKind
}
