import { Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './AdminAuthContext'
import { AdminGuard } from './AdminGuard'
import { AdminContacts } from './pages/AdminContacts'
import { AdminDashboard } from './pages/AdminDashboard'
import { AdminFollowUps } from './pages/AdminFollowUps'
import { AdminFormSubmissions } from './pages/AdminFormSubmissions'
import { AdminInquiries, AdminInquiryDetail, AdminInquiryFormPage } from './pages/AdminInquiries'
import { AdminCommercialAgreementDetail, AdminCommercialAgreementFormPage, AdminCommercialAgreements } from './pages/AdminCommercialAgreements'
import { AdminOpportunityDetail } from './pages/AdminOpportunityDetail'
import { AdminOpportunityFormPage } from './pages/AdminOpportunityForm'
import { AdminOpportunities } from './pages/AdminOpportunities'
import { AdminSupplierDetail, AdminSupplierFormPage, AdminSuppliers } from './pages/AdminSuppliers'
import { AdminSettings } from './pages/AdminSettings'
import { AdminLogin } from './pages/AdminLogin'

export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route index element={<AdminDashboard />} />
          <Route path="oportunidades" element={<AdminOpportunities />} />
          <Route path="oportunidades/nueva" element={<AdminOpportunityFormPage mode="create" />} />
          <Route path="oportunidades/:id" element={<AdminOpportunityDetail />} />
          <Route path="oportunidades/:id/editar" element={<AdminOpportunityFormPage mode="edit" />} />
          <Route path="proveedores" element={<AdminSuppliers />} />
          <Route path="proveedores/nuevo" element={<AdminSupplierFormPage mode="create" />} />
          <Route path="proveedores/:id" element={<AdminSupplierDetail />} />
          <Route path="proveedores/:id/editar" element={<AdminSupplierFormPage mode="edit" />} />
          <Route path="contactos" element={<AdminContacts />} />
          <Route path="consultas" element={<AdminInquiries />} />
          <Route path="consultas/nueva" element={<AdminInquiryFormPage mode="create" />} />
          <Route path="consultas/:id" element={<AdminInquiryDetail />} />
          <Route path="consultas/:id/editar" element={<AdminInquiryFormPage mode="edit" />} />
          <Route path="recepciones" element={<AdminFormSubmissions />} />
          <Route path="seguimiento" element={<AdminFollowUps />} />
          <Route path="acuerdos" element={<AdminCommercialAgreements />} />
          <Route path="acuerdos/nuevo" element={<AdminCommercialAgreementFormPage mode="create" />} />
          <Route path="acuerdos/:id" element={<AdminCommercialAgreementDetail />} />
          <Route path="acuerdos/:id/editar" element={<AdminCommercialAgreementFormPage mode="edit" />} />
          <Route path="configuracion" element={<AdminSettings />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}
