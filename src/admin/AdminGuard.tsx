import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AdminShell } from '../components/admin/AdminShell'
import { ConfigurationPending } from '../components/admin/ConfigurationPending'
import { useAdminAuth } from './useAdminAuth'

export function AdminGuard() {
  const auth = useAdminAuth()
  const location = useLocation()

  if (auth.status === 'configuration_pending') {
    return (
      <AdminShell>
        <ConfigurationPending />
      </AdminShell>
    )
  }

  if (auth.status === 'loading') {
    return (
      <AdminShell>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando panel administrativo...</div>
      </AdminShell>
    )
  }

  if (auth.status === 'signed_out') {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (auth.status === 'unauthorized') {
    return (
      <AdminShell>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h1 className="text-2xl font-semibold text-[#17202d]">Acceso no autorizado</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            La sesión existe, pero no tiene un perfil administrador activo. El acceso al panel requiere un registro activo
            en `admin_profiles`.
          </p>
        </div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
