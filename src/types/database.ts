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
