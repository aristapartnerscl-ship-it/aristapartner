import type {
  AdminProfile,
  AdminNotificationRecord,
  CommercialAgreementCreateValues,
  CommercialAgreementRecord,
  CommercialAgreementUpdateValues,
  CommercialAgreementWithOpportunity,
  CommercialProposalInsert,
  CommercialProposalRecord,
  CommercialProposalUpdate,
  CommercialProposalWithOpportunity,
  CommercialProposalDocumentInsert,
  CommercialProposalDocumentRecord,
  CommercialProposalVersionRecord,
  CommercialProposalPublicLinkInsert,
  CommercialProposalPublicLinkRecord,
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
  ProspectActivityRecord,
  ProspectContactStrategy,
  ProspectConversionResult,
  ProspectConversionValues,
  ProspectFollowUpRecord,
  ProspectInsert,
  ProspectRecord,
  ProspectUpdate,
  CollaboratorRecord,
  RedComercialProspectActivityFormValues,
  RedComercialProspectDetailRecord,
  RedComercialProspectDuplicateRecord,
  RedComercialProspectFilters,
  RedComercialProspectFormValues,
  RedComercialProspectListItem,
  RedComercialProspectMetricsRecord,
  RedComercialProspectPanelRecord,
  RedComercialOpportunityFilters,
  RedComercialOpportunityListItem,
  RedComercialOpportunityMetricsRecord,
  RedComercialCrossOpportunityFilters,
  RedComercialCrossOpportunityMetricsRecord,
  RedComercialResultsData,
  RedComercialResultsFilters,
  RedComercialCrossOpportunityRecord,
  RedComercialFollowupFilters,
  RedComercialFollowupListItem,
  RedComercialFollowupMetricsRecord,
  RedComercialHomeData,
  RedComercialDashboardData,
  RedComercialCompanyWorkspace,
  RepresentedCompanyFaqRecord,
  RepresentedCompanyFormValues,
  RepresentedCompanyMembershipRecord,
  RepresentedCompanyRecord,
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
  getRedComercialHomeData(): Promise<RepositoryResult<RedComercialHomeData>>
  getRedComercialDashboard(period?: 'today' | 'week'): Promise<RepositoryResult<RedComercialDashboardData>>
  listRepresentedCompanies(): Promise<RepositoryResult<RepresentedCompanyRecord[]>>
  listMyRepresentedCompanies(): Promise<RepositoryResult<RepresentedCompanyRecord[]>>
  getRepresentedCompanyById(id: string): Promise<RepositoryResult<RepresentedCompanyRecord | null>>
  getRedComercialCompanyWorkspace(id: string): Promise<RepositoryResult<RedComercialCompanyWorkspace | null>>
  updateRedComercialCompanyPlaybook(id: string, section: string, payload: Record<string, unknown>): Promise<RepositoryResult<RedComercialCompanyWorkspace | null>>
  upsertRedComercialCompanyFaq(companyId: string, values: Partial<RepresentedCompanyFaqRecord>): Promise<RepositoryResult<RepresentedCompanyFaqRecord | null>>
  createRepresentedCompany(values: RepresentedCompanyFormValues): Promise<RepositoryResult<RepresentedCompanyRecord | null>>
  updateRepresentedCompany(id: string, values: RepresentedCompanyFormValues): Promise<RepositoryResult<RepresentedCompanyRecord | null>>
  uploadCompanyLogo(companyId: string, file: File): Promise<RepositoryResult<string | null>>
  detectCompanyLogos(websiteUrl: string): Promise<RepositoryResult<Array<{ url: string; source: string; label: string }>>>
  importDetectedCompanyLogo(companyId: string, imageUrl: string): Promise<RepositoryResult<string | null>>
  listCollaborators(): Promise<RepositoryResult<CollaboratorRecord[]>>
  inviteCollaborator(email: string, fullName?: string): Promise<RepositoryResult<CollaboratorRecord | null>>
  reissueCollaboratorInvitation(userId: string): Promise<RepositoryResult<CollaboratorRecord | null>>
  revokeCollaboratorInvitation(userId: string): Promise<RepositoryResult<CollaboratorRecord | null>>
  removeCollaboratorInvitation(userId: string): Promise<RepositoryResult<boolean>>
  updateCollaboratorStatus(userId: string, isActive: boolean): Promise<RepositoryResult<CollaboratorRecord | null>>
  listCompanyMemberships(): Promise<RepositoryResult<RepresentedCompanyMembershipRecord[]>>
  upsertCompanyMembership(companyId: string, userId: string): Promise<RepositoryResult<RepresentedCompanyMembershipRecord | null>>
  deactivateCompanyMembership(companyId: string, userId: string): Promise<RepositoryResult<RepresentedCompanyMembershipRecord | null>>
  listRedComercialProspects(companyId: string, filters?: RedComercialProspectFilters): Promise<RepositoryResult<{ rows: RedComercialProspectListItem[]; total: number }>>
  getRedComercialProspectMetrics(companyId: string): Promise<RepositoryResult<RedComercialProspectMetricsRecord>>
  getRedComercialProspectDetail(id: string): Promise<RepositoryResult<RedComercialProspectDetailRecord | null>>
  getRedComercialProspectPanel(id: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  getRedComercialOpportunityPanel(opportunityId: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  createRedComercialOpportunity(prospectId: string, payload: Record<string, unknown>): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  updateRedComercialOpportunity(opportunityId: string, payload: Record<string, unknown>): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  createRedComercialCrossOpportunity(prospectId: string, targetCompanyId: string, reason: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  createRedComercialProspectNote(prospectId: string, body: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  updateRedComercialProspectNote(noteId: string, body: string, archived?: boolean): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  uploadRedComercialProspectFile(prospectId: string, file: File, category?: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  createRedComercialProspectFileSignedUrl(path: string): Promise<RepositoryResult<string | null>>
  archiveRedComercialProspectFile(fileId: string): Promise<RepositoryResult<RedComercialProspectPanelRecord | null>>
  detectRedComercialProspectDuplicates(values: Pick<RedComercialProspectFormValues, 'represented_company_id' | 'company_name' | 'website_url' | 'contact_email' | 'contact_phone'>, excludeProspectId?: string): Promise<RepositoryResult<RedComercialProspectDuplicateRecord[]>>
  createRedComercialProspect(values: RedComercialProspectFormValues): Promise<RepositoryResult<RedComercialProspectDetailRecord | null>>
  updateRedComercialProspect(id: string, values: Partial<RedComercialProspectFormValues & { is_archived: boolean }>): Promise<RepositoryResult<RedComercialProspectDetailRecord | null>>
  createRedComercialProspectActivity(prospectId: string, values: RedComercialProspectActivityFormValues): Promise<RepositoryResult<RedComercialProspectDetailRecord | null>>
  listRedComercialFollowups(filters?: RedComercialFollowupFilters): Promise<RepositoryResult<{ rows: RedComercialFollowupListItem[]; total: number }>>
  getRedComercialFollowupMetrics(filters?: Omit<RedComercialFollowupFilters, 'page' | 'pageSize' | 'view'>): Promise<RepositoryResult<RedComercialFollowupMetricsRecord>>
  listRedComercialOpportunities(filters?: RedComercialOpportunityFilters): Promise<RepositoryResult<{ rows: RedComercialOpportunityListItem[]; total: number }>>
  getRedComercialOpportunityMetrics(filters?: Pick<RedComercialOpportunityFilters, 'search' | 'companyId' | 'controlMode' | 'contractStatus' | 'paymentStatus' | 'responsibleId' | 'resultStatus'>): Promise<RepositoryResult<RedComercialOpportunityMetricsRecord>>
  listRedComercialCrossOpportunities(filters?: RedComercialCrossOpportunityFilters): Promise<RepositoryResult<{ rows: RedComercialCrossOpportunityRecord[]; total: number }>>
  getRedComercialCrossOpportunityMetrics(filters?: Pick<RedComercialCrossOpportunityFilters, 'search' | 'sourceCompanyId' | 'targetCompanyId' | 'assignedTo'>): Promise<RepositoryResult<RedComercialCrossOpportunityMetricsRecord>>
  getRedComercialResults(filters?: RedComercialResultsFilters): Promise<RepositoryResult<RedComercialResultsData>>
  getRedComercialCrossOpportunityDetail(id: string): Promise<RepositoryResult<RedComercialCrossOpportunityRecord | null>>
  updateRedComercialCrossOpportunityStatus(id: string, status: RedComercialCrossOpportunityRecord['status']): Promise<RepositoryResult<RedComercialCrossOpportunityRecord | null>>
  assignRedComercialCrossOpportunity(id: string, assignedTo: string | null): Promise<RepositoryResult<RedComercialCrossOpportunityRecord | null>>
  convertRedComercialCrossOpportunity(id: string): Promise<RepositoryResult<RedComercialCrossOpportunityRecord | null>>
  discardRedComercialCrossOpportunity(id: string, reason: NonNullable<RedComercialCrossOpportunityRecord['discard_reason']>, note?: string): Promise<RepositoryResult<RedComercialCrossOpportunityRecord | null>>
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
  listCommercialProposals(): Promise<RepositoryResult<CommercialProposalWithOpportunity[]>>
  getCommercialProposalById(id: string): Promise<RepositoryResult<CommercialProposalWithOpportunity | null>>
  createCommercialProposal(values: Omit<CommercialProposalInsert, 'created_by'>): Promise<RepositoryResult<CommercialProposalRecord | null>>
  updateCommercialProposal(id: string, values: CommercialProposalUpdate): Promise<RepositoryResult<CommercialProposalRecord | null>>
  listCommercialProposalsForOpportunity(opportunityId: string): Promise<RepositoryResult<CommercialProposalRecord[]>>
  createCommercialProposalVersion(proposalId: string): Promise<RepositoryResult<CommercialProposalVersionRecord | null>>
  listCommercialProposalVersions(proposalId: string): Promise<RepositoryResult<CommercialProposalVersionRecord[]>>
  listCommercialProposalDocuments(proposalId: string): Promise<RepositoryResult<CommercialProposalDocumentRecord[]>>
  createCommercialProposalDocument(values: Omit<CommercialProposalDocumentInsert, 'generated_by'>): Promise<RepositoryResult<CommercialProposalDocumentRecord | null>>
  listCommercialProposalPublicLinks(proposalId: string): Promise<RepositoryResult<CommercialProposalPublicLinkRecord[]>>
  createCommercialProposalPublicLink(values: Omit<CommercialProposalPublicLinkInsert, 'token_hash'> & { token_hash: string }): Promise<RepositoryResult<CommercialProposalPublicLinkRecord | null>>
  revokeCommercialProposalPublicLink(id: string): Promise<RepositoryResult<CommercialProposalPublicLinkRecord | null>>
  listOpportunityActivities(opportunityId: string): Promise<RepositoryResult<OpportunityActivityRecord[]>>
  createOpportunityActivity(values: Omit<OpportunityActivityInsert, 'created_by'>): Promise<RepositoryResult<OpportunityActivityRecord | null>>
  listProspects(): Promise<RepositoryResult<ProspectRecord[]>>
  getProspectById(id: string): Promise<RepositoryResult<ProspectRecord | null>>
  createProspect(values: Omit<ProspectInsert, 'created_by' | 'assigned_to'>): Promise<RepositoryResult<ProspectRecord | null>>
  updateProspect(id: string, values: ProspectUpdate): Promise<RepositoryResult<ProspectRecord | null>>
  listProspectActivities(prospectId: string): Promise<RepositoryResult<ProspectActivityRecord[]>>
  createProspectActivity(values: {
    prospect_id: string
    activity_type: ProspectActivityRecord['activity_type']
    outcome?: ProspectActivityRecord['outcome']
    subject: string
    notes?: string | null
    occurred_at?: string | null
    next_action_type?: string | null
    next_action_at?: string | null
    status?: ProspectRecord['status'] | null
  }): Promise<RepositoryResult<ProspectActivityRecord | null>>
  completeProspectFollowUp(activityId: string): Promise<RepositoryResult<ProspectActivityRecord | null>>
  reopenProspectFollowUp(activityId: string): Promise<RepositoryResult<ProspectActivityRecord | null>>
  listProspectFollowUps(): Promise<RepositoryResult<ProspectFollowUpRecord[]>>
  listCompletedProspectFollowUps(): Promise<RepositoryResult<ProspectFollowUpRecord[]>>
  findContactCandidatesForProspect(prospectId: string): Promise<RepositoryResult<ContactRecord[]>>
  convertProspectToOpportunity(id: string, values: ProspectConversionValues, strategy: ProspectContactStrategy): Promise<RepositoryResult<ProspectConversionResult>>
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
