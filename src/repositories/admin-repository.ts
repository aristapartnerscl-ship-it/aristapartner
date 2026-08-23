import type {
  AdminProfile,
  AdminNotificationRecord,
  CommercialAgreementCreateValues,
  CommercialAgreementRecord,
  CommercialAgreementUpdateValues,
  CommercialAgreementWithOpportunity,
  ContactInsert,
  ContactRecord,
  ContactSelectorRecord,
  DashboardData,
  FormSubmissionListItem,
  FormSubmissionRecord,
  FormSubmissionUpdate,
  FollowUpRecord,
  InquiryConversionResult,
  InquiryConversionValues,
  InquiryInsert,
  InquiryRecord,
  InquiryWithContact,
  OpportunityActivityInsert,
  OpportunityActivityRecord,
  OpportunitySupplierFormValues,
  OpportunitySupplierInsert,
  OpportunitySupplierRecord,
  OpportunitySupplierWithSupplier,
  OpportunityInsert,
  OrganizationSettingsCreateValues,
  OrganizationSettingsRecord,
  OrganizationSettingsUpdateValues,
  OpportunityRecord,
  SupplierOpportunityRecord,
  RepositoryResult,
  SupplierRecord,
  SupplierWithContact,
  SubmissionContactStrategy,
  SubmissionConversionResult,
} from '../types/admin'

export type AdminRepository = {
  getCurrentAdminProfile(userId: string): Promise<RepositoryResult<AdminProfile | null>>
  listAdminNotifications(limit?: number): Promise<RepositoryResult<AdminNotificationRecord[]>>
  getUnreadAdminNotificationCount(): Promise<RepositoryResult<number>>
  markAdminNotificationRead(id: string): Promise<RepositoryResult<AdminNotificationRecord | null>>
  markAllAdminNotificationsRead(): Promise<RepositoryResult<number>>
  getOrganizationSettings(): Promise<RepositoryResult<OrganizationSettingsRecord | null>>
  updateOrganizationSettings(input: OrganizationSettingsUpdateValues): Promise<RepositoryResult<OrganizationSettingsRecord | null>>
  createOrganizationSettingsIfMissing(input?: OrganizationSettingsCreateValues): Promise<RepositoryResult<OrganizationSettingsRecord | null>>
  getDashboardData(): Promise<RepositoryResult<DashboardData>>
  listOpportunities(): Promise<RepositoryResult<OpportunityRecord[]>>
  getOpportunityById(id: string): Promise<RepositoryResult<OpportunityRecord | null>>
  createOpportunity(values: Omit<OpportunityInsert, 'created_by' | 'reference_code'>): Promise<RepositoryResult<OpportunityRecord | null>>
  updateOpportunity(id: string, values: Partial<Omit<OpportunityInsert, 'created_by' | 'reference_code'>>): Promise<RepositoryResult<OpportunityRecord | null>>
  listOpportunityActivities(opportunityId: string): Promise<RepositoryResult<OpportunityActivityRecord[]>>
  createOpportunityActivity(values: Omit<OpportunityActivityInsert, 'created_by'>): Promise<RepositoryResult<OpportunityActivityRecord | null>>
  listContactsForSelector(): Promise<RepositoryResult<ContactSelectorRecord[]>>
  listFollowUps(): Promise<RepositoryResult<FollowUpRecord[]>>
  listCompletedFollowUps(): Promise<RepositoryResult<FollowUpRecord[]>>
  completeFollowUp(activityId: string): Promise<RepositoryResult<OpportunityActivityRecord | null>>
  reopenFollowUp(activityId: string): Promise<RepositoryResult<OpportunityActivityRecord | null>>
  listSuppliers(): Promise<RepositoryResult<SupplierWithContact[]>>
  getSupplierById(id: string): Promise<RepositoryResult<SupplierWithContact | null>>
  createSupplier(values: Omit<SupplierRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<RepositoryResult<SupplierRecord | null>>
  updateSupplier(id: string, values: Partial<Omit<SupplierRecord, 'id' | 'created_at' | 'created_by'>>): Promise<RepositoryResult<SupplierRecord | null>>
  listSupplierOpportunities(supplierId: string): Promise<RepositoryResult<SupplierOpportunityRecord[]>>
  listAvailableBuyOpportunities(supplierId: string): Promise<RepositoryResult<OpportunityRecord[]>>
  linkSupplierToOpportunity(values: Omit<OpportunitySupplierInsert, 'status'> & { status?: OpportunitySupplierInsert['status'] }): Promise<RepositoryResult<OpportunitySupplierRecord | null>>
  updateOpportunitySupplier(id: string, values: OpportunitySupplierFormValues): Promise<RepositoryResult<OpportunitySupplierRecord | null>>
  listOpportunitySuppliers(opportunityId: string): Promise<RepositoryResult<OpportunitySupplierWithSupplier[]>>
  listAvailableSuppliersForOpportunity(opportunityId: string): Promise<RepositoryResult<SupplierWithContact[]>>
  listContacts(): Promise<RepositoryResult<ContactRecord[]>>
  getContactById(id: string): Promise<RepositoryResult<ContactRecord | null>>
  createContact(values: Omit<ContactInsert, 'created_by'>): Promise<RepositoryResult<ContactRecord | null>>
  updateContact(id: string, values: Partial<Omit<ContactInsert, 'created_by'>>): Promise<RepositoryResult<ContactRecord | null>>
  listInquiries(): Promise<RepositoryResult<InquiryWithContact[]>>
  getInquiryById(id: string): Promise<RepositoryResult<InquiryWithContact | null>>
  createInquiry(values: Omit<InquiryInsert, 'assigned_to' | 'converted_opportunity_id'>): Promise<RepositoryResult<InquiryRecord | null>>
  updateInquiry(id: string, values: Partial<Omit<InquiryInsert, 'assigned_to' | 'converted_opportunity_id'>>): Promise<RepositoryResult<InquiryRecord | null>>
  convertInquiryToOpportunity(id: string, values: InquiryConversionValues): Promise<RepositoryResult<InquiryConversionResult>>
  repairInquiryConversionLink(inquiryId: string, opportunityId: string): Promise<RepositoryResult<InquiryConversionResult>>
  listContactsForInquirySelector(): Promise<RepositoryResult<ContactSelectorRecord[]>>
  listAgreements(): Promise<RepositoryResult<CommercialAgreementRecord[]>>
  listCommercialAgreements(): Promise<RepositoryResult<CommercialAgreementWithOpportunity[]>>
  getCommercialAgreementById(id: string): Promise<RepositoryResult<CommercialAgreementWithOpportunity | null>>
  createCommercialAgreement(values: CommercialAgreementCreateValues): Promise<RepositoryResult<CommercialAgreementRecord | null>>
  updateCommercialAgreement(id: string, values: CommercialAgreementUpdateValues): Promise<RepositoryResult<CommercialAgreementRecord | null>>
  archiveCommercialAgreement(id: string): Promise<RepositoryResult<CommercialAgreementRecord | null>>
  restoreCommercialAgreement(id: string): Promise<RepositoryResult<CommercialAgreementRecord | null>>
  listOpportunitiesForAgreementSelector(): Promise<RepositoryResult<OpportunityRecord[]>>
  listContactsForAgreementSelector(): Promise<RepositoryResult<ContactSelectorRecord[]>>
  listSuppliersForAgreementSelector(): Promise<RepositoryResult<SupplierWithContact[]>>
  listAgreementsForOpportunity(opportunityId: string): Promise<RepositoryResult<CommercialAgreementWithOpportunity[]>>
  listFormSubmissions(): Promise<RepositoryResult<FormSubmissionListItem[]>>
  getFormSubmissionById(id: string): Promise<RepositoryResult<FormSubmissionRecord | null>>
  updateFormSubmission(id: string, values: Pick<FormSubmissionUpdate, 'status'>): Promise<RepositoryResult<FormSubmissionRecord | null>>
  findContactCandidatesForSubmission(submissionId: string): Promise<RepositoryResult<ContactRecord[]>>
  convertContactSubmission(submissionId: string, strategy: SubmissionContactStrategy): Promise<RepositoryResult<SubmissionConversionResult>>
  convertBuySubmission(submissionId: string, strategy: SubmissionContactStrategy): Promise<RepositoryResult<SubmissionConversionResult>>
  convertSellSubmission(submissionId: string, strategy: SubmissionContactStrategy): Promise<RepositoryResult<SubmissionConversionResult>>
  convertSupplierSubmission(submissionId: string, strategy: SubmissionContactStrategy): Promise<RepositoryResult<SubmissionConversionResult>>
  getConvertedSubmissionEntity(submission: FormSubmissionRecord): Promise<RepositoryResult<SubmissionConversionResult['entity']>>
}
