import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'

interface Props {
  children: React.ReactNode
  role?: UserRole | UserRole[]
  redirectTo?: string
}

export default function PrivateRoute({ children, role, redirectTo }: Props) {
  const { user, tokens } = useAuthStore()
  const location = useLocation()

  if (!tokens?.accessToken) {
    const isPro = Array.isArray(role)
      ? role.some(r => r === 'huissier' || r === 'agent')
      : role === 'huissier' || role === 'agent'
    const loginPath = isPro ? '/huissier/login' : (redirectTo ?? '/login')
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />
  }

  const roles = Array.isArray(role) ? role : role ? [role] : []
  if (roles.length > 0 && !roles.includes(user?.role as UserRole)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
