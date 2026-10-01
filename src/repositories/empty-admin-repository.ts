import type { AdminRepository } from './admin-repository'

const emptyDashboardData = {
  metrics: {
    newOpportunities: null,
    activeOpportunities: null,
    negotiations: null,
    overdueFollowUps: null,
    pendingSuppliers: null,
    newInquiries: null,
    newFormSubmissions: null,
    prospectsDueToday: null,
    overdueProspectFollowUps: null,
  },
  upcomingActions: [],
  upcomingProspectActions: [],
  recentActivities: [],
  hasMetricErrors: true,
  activityError: true,
}

export const emptyAdminRepository: AdminRepository = {
  async getCurrentAdminProfile() {
    return { data: null, error: null }
  },
  async getRedComercialHomeData() {
    return { data: { representedCompanies: 0, activeCollaborators: 0, activeMemberships: 0, myMemberships: [], myCompanies: [] }, error: null }
  },
  async listRepresentedCompanies() {
    return { data: [], error: null }
  },
  async listMyRepresentedCompanies() {
    return { data: [], error: null }
  },
  async getRepresentedCompanyById() {
    return { data: null, error: null }
  },
  async createRepresentedCompany() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateRepresentedCompany() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async uploadCompanyLogo() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async detectCompanyLogos() {
    return { data: [], error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async importDetectedCompanyLogo() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listCollaborators() {
    return { data: [], error: null }
  },
  async inviteCollaborator() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async reissueCollaboratorInvitation() {
    return { data: null, error: 'La conexion del panel administrativo aun no esta disponible.', errorKind: 'auth' }
  },
  async revokeCollaboratorInvitation() {
    return { data: null, error: 'La conexion del panel administrativo aun no esta disponible.', errorKind: 'auth' }
  },
  async removeCollaboratorInvitation() {
    return { data: false, error: 'La conexion del panel administrativo aun no esta disponible.', errorKind: 'auth' }
  },
  async updateCollaboratorStatus() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listCompanyMemberships() {
    return { data: [], error: null }
  },
  async upsertCompanyMembership() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async deactivateCompanyMembership() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listAdminNotifications() {
    return { data: [], error: null }
  },
  async getUnreadAdminNotificationCount() {
    return { data: 0, error: null }
  },
  async markAdminNotificationRead() {
    return { data: null, error: 'La conexion del panel administrativo aun no esta disponible.', errorKind: 'auth' }
  },
  async markAllAdminNotificationsRead() {
    return { data: 0, error: 'La conexion del panel administrativo aun no esta disponible.', errorKind: 'auth' }
  },
  async getOrganizationSettings() {
    return { data: null, error: null }
  },
  async updateOrganizationSettings() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async createOrganizationSettingsIfMissing() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async getDashboardData() {
    return { data: emptyDashboardData, error: null }
  },
  async listOpportunities() {
    return { data: [], error: null }
  },
  async getOpportunityById() {
    return { data: null, error: null }
  },
  async createOpportunity() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateOpportunity() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listOpportunityActivities() {
    return { data: [], error: null }
  },
  async listCommercialProposals() {
    return { data: [], error: null }
  },
  async getCommercialProposalById() {
    return { data: null, error: null }
  },
  async createCommercialProposal() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateCommercialProposal() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listCommercialProposalsForOpportunity() {
    return { data: [], error: null }
  },
  async createCommercialProposalVersion() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listCommercialProposalVersions() {
    return { data: [], error: null }
  },
  async listCommercialProposalDocuments() {
    return { data: [], error: null }
  },
  async createCommercialProposalDocument() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listCommercialProposalPublicLinks() {
    return { data: [], error: null }
  },
  async createCommercialProposalPublicLink() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async revokeCommercialProposalPublicLink() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async createOpportunityActivity() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listProspects() {
    return { data: [], error: null }
  },
  async getProspectById() {
    return { data: null, error: null }
  },
  async createProspect() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateProspect() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listProspectActivities() {
    return { data: [], error: null }
  },
  async createProspectActivity() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async completeProspectFollowUp() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async reopenProspectFollowUp() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listProspectFollowUps() {
    return { data: [], error: null }
  },
  async listCompletedProspectFollowUps() {
    return { data: [], error: null }
  },
  async findContactCandidatesForProspect() {
    return { data: [], error: null }
  },
  async convertProspectToOpportunity() {
    return { data: { prospect: null, contact: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listContactsForSelector() {
    return { data: [], error: null }
  },
  async listFollowUps() {
    return { data: [], error: null }
  },
  async listCompletedFollowUps() {
    return { data: [], error: null }
  },
  async completeFollowUp() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async reopenFollowUp() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listSuppliers() {
    return { data: [], error: null }
  },
  async getSupplierById() {
    return { data: null, error: null }
  },
  async createSupplier() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateSupplier() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listSupplierOpportunities() {
    return { data: [], error: null }
  },
  async listAvailableBuyOpportunities() {
    return { data: [], error: null }
  },
  async linkSupplierToOpportunity() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateOpportunitySupplier() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listOpportunitySuppliers() {
    return { data: [], error: null }
  },
  async listAvailableSuppliersForOpportunity() {
    return { data: [], error: null }
  },
  async listContacts() {
    return { data: [], error: null }
  },
  async getContactById() {
    return { data: null, error: null }
  },
  async createContact() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateContact() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listInquiries() {
    return { data: [], error: null }
  },
  async getInquiryById() {
    return { data: null, error: null }
  },
  async createInquiry() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateInquiry() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async convertInquiryToOpportunity() {
    return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async repairInquiryConversionLink() {
    return { data: { inquiry: null, opportunity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listContactsForInquirySelector() {
    return { data: [], error: null }
  },
  async listAgreements() {
    return { data: [], error: null }
  },
  async listCommercialAgreements() {
    return { data: [], error: null }
  },
  async getCommercialAgreementById() {
    return { data: null, error: null }
  },
  async createCommercialAgreement() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async updateCommercialAgreement() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async archiveCommercialAgreement() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async restoreCommercialAgreement() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async listOpportunitiesForAgreementSelector() {
    return { data: [], error: null }
  },
  async listContactsForAgreementSelector() {
    return { data: [], error: null }
  },
  async listSuppliersForAgreementSelector() {
    return { data: [], error: null }
  },
  async listAgreementsForOpportunity() {
    return { data: [], error: null }
  },
  async listFormSubmissions() {
    return { data: [], error: null }
  },
  async getFormSubmissionById() {
    return { data: null, error: null }
  },
  async updateFormSubmission() {
    return { data: null, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async findContactCandidatesForSubmission() {
    return { data: [], error: null }
  },
  async convertContactSubmission() {
    return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async convertBuySubmission() {
    return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async convertSellSubmission() {
    return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async convertSupplierSubmission() {
    return { data: { submission: null, contact: null, entity: null, alreadyConverted: false, rpcResult: null }, error: 'La conexión del panel administrativo aún no está disponible.', errorKind: 'auth' }
  },
  async getConvertedSubmissionEntity() {
    return { data: null, error: null }
  },
}
