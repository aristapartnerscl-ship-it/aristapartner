import { Navigate, Outlet } from 'react-router-dom'
import { isRedComercialAdmin } from './red-comercial-utils'
import { useAdminAuth } from './useAdminAuth'

export function AdminRoleGuard() {
  const auth = useAdminAuth()
  if (!isRedComercialAdmin(auth.profile)) {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}
