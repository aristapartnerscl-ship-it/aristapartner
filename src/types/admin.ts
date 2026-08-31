import type {
  AdminProfileRow,
  AgreementCounterpartyType,
  AgreementPayerType,
  AgreementStatus,
  CommissionType,
  CommercialAgreementRow,
  CommercialAgreementInsert,
  CommercialAgreementUpdate,
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
  ProspectActivityInsert,
  ProspectActivityOutcome,
  ProspectActivityType,
  ProspectInsert,
  ProspectStatus,
  ProspectTemperature,
  ProspectType,
  ProspectUpdate,
  Priority,
  SupplierStatus,
  SubmissionType,
  SubmissionStatus,
}

export type AdminProfile = AdminProfileRow

export type AdminNotificationRecord = AdminNotificationRow

export type ContactRecord = ContactRow

export type OpportunityRecord = OpportunityRow

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
  hasMetricErrors: boolean
  activityError: boolean
}

export type RepositoryErrorKind = 'auth' | 'authorization' | 'network' | 'validation' | 'not_found' | 'unknown'

export type RepositoryResult<T> = {
  data: T
  error: string | null
  errorKind?: RepositoryErrorKind
}
