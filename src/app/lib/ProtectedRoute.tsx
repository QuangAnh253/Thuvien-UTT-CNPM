import { Link, Navigate } from 'react-router'
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
    const userRole = String(user?.role || '').toLowerCase()
    const allowedRoles = roles.map((r) => String(r).toLowerCase())

    if (!user || !allowedRoles.includes(userRole)) {
      const isStudent = String(user?.role || '').toLowerCase() === 'student'
      const backTo = isStudent ? '/student/dashboard' : '/admin/dashboard'

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-xl bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-red-600 mb-2">Bạn không có quyền truy cập</h2>
            <p className="text-gray-600 mb-4">Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền.</p>
            <Link
              to={backTo}
              className="inline-flex px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
            >
              Quay lại trang phù hợp
            </Link>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}