import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { apiFetch, clearAuth } from '../lib/auth';
import { useNavigate } from 'react-router';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookPlus,
  BookCheck,
  UserCog,
  FileText,
  LogOut,
  UserCircle,
  ChevronDown,
} from 'lucide-react';
import NotificationDropdown, { Notification } from './NotificationDropdown';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Sách', icon: BookOpen, path: '/admin/books' },
  { label: 'Độc giả', icon: Users, path: '/admin/readers' },
  { label: 'Mượn sách', icon: BookPlus, path: '/admin/borrow' },
  { label: 'Trả sách', icon: BookCheck, path: '/admin/return' },
  { label: 'Nhân viên', icon: UserCog, path: '/admin/staff' },
  { label: 'Báo cáo', icon: FileText, path: '/admin/reports' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export default function AdminLayout({ children, pageTitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const formatDateTime = (value: any) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
  };

  useEffect(() => {
    const fetchAdminNotifications = async () => {
      try {
        const [pendingRes, overdueRes] = await Promise.all([
          apiFetch('/api/borrow?status=PENDING'),
          apiFetch('/api/borrow/overdue'),
        ]);

        const readIds: string[] = JSON.parse(localStorage.getItem('readAdminNotifs') || '[]');
        const generatedNotifs: Notification[] = [];

        if (!pendingRes?.error && Array.isArray(pendingRes)) {
          pendingRes.forEach((req: any) => {
            const sourceTime = req.borrowDate || req.createdAt || req.dueDate || Date.now();
            generatedNotifs.push({
              id: `req-${req.id}`,
              type: 'info',
              icon: 'user',
              title: 'Yêu cầu mượn sách mới',
              message: `${req.user?.student?.fullName || 'Sinh viên'} vừa đăng ký mượn cuốn "${req.book?.title || 'N/A'}".`,
              time: formatDateTime(sourceTime),
              isRead: readIds.includes(`req-${req.id}`),
              link: '/admin/borrow',
            });
          });
        }

        if (!overdueRes?.error && Array.isArray(overdueRes)) {
          overdueRes.forEach((req: any) => {
            const sourceTime = req.dueDate || req.borrowDate || Date.now();
            generatedNotifs.push({
              id: `overdue-${req.id}`,
              type: 'error',
              icon: 'alert',
              title: 'Cảnh báo sách quá hạn',
              message: `Phiếu mượn của ${req.user?.student?.fullName || 'Sinh viên'} đã quá hạn!`,
              time: formatDateTime(sourceTime),
              isRead: readIds.includes(`overdue-${req.id}`),
              link: '/admin/return',
            });
          });
        }

        setNotifications(generatedNotifs);
      } catch (error) {
        console.error('Lỗi tạo thông báo Admin:', error);
      }
    };

    void fetchAdminNotifications();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleMarkAsRead = (id: string) => {
    const readIds: string[] = JSON.parse(localStorage.getItem('readAdminNotifs') || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem('readAdminNotifs', JSON.stringify([...readIds, id]));
    }

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('readAdminNotifs', JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-[#262262] text-white flex flex-col fixed h-screen">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
              <img src='../../../public/LogoUTT_square.png' alt="UTT Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-white">UTT Library</h2>
              <p className="text-white/60 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#f79421] text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/admin/profile"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#f79421] flex items-center justify-center">
              <span className="text-white">AD</span>
            </div>
            <div>
              <p className="text-white text-sm">Admin User</p>
              <p className="text-white/60 text-xs">admin@utt.edu.vn</p>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/5"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <h1 className="text-[#262262]">{pageTitle}</h1>
            <div className="flex items-center gap-4">
              {/* Notification Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f79421] flex items-center justify-center">
                    <span className="text-white">AD</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/admin/profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      <UserCircle className="w-5 h-5 text-gray-600" />
                      <span className="text-[#262262]">Hồ sơ</span>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
