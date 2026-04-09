import { BookOpen } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from './useAuth'
import NotificationDropdown from '../components/NotificationDropdown'

interface Props {
  children: React.ReactNode
  activeTab?: 'search' | 'history' | 'profile'
  notifications?: any[]
  onMarkAsRead?: (id: string) => void
  onMarkAllAsRead?: () => void
}

export default function StudentLayout({ children, activeTab, notifications=[], onMarkAsRead, onMarkAllAsRead }: Props) {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#f79421] rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-[#262262]">Thư viện UTT</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/books" className={activeTab==='search' ? 'text-[#f79421] font-semibold' : 'text-gray-600 hover:text-[#f79421]'}>Tra cứu</Link>
            <Link to="/student/history" className={activeTab==='history' ? 'text-[#f79421] font-semibold' : 'text-gray-600 hover:text-[#f79421]'}>Lịch sử</Link>
            <Link to="/student/profile" className={activeTab==='profile' ? 'text-[#f79421] font-semibold' : 'text-gray-600 hover:text-[#f79421]'}>Hồ sơ</Link>
            <NotificationDropdown notifications={notifications} onMarkAsRead={onMarkAsRead||(() => {})} onMarkAllAsRead={onMarkAllAsRead||(() => {})} />
            <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-gray-300 rounded-lg hover:bg-gray-50">Đăng xuất</button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}