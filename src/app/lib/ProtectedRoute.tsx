import { Navigate } from 'react-router'
import { isLoggedIn, getUser } from './auth'

interface Props {
  children: React.ReactNode
  roles?: string[]  // ['admin', 'librarian'] hoặc ['student']
}

export default function ProtectedRoute({ children, roles }: Props) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0) {
    const user = getUser()
    if (!user || !roles.includes(user.role)) {
      // Sai role → redirect về trang phù hợp
      const u = getUser()
      if (u?.role === 'student') return <Navigate to="/student/dashboard" replace />
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  return <>{children}</>
}