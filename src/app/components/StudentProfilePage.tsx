import { useEffect, useState } from 'react';
import { BookOpen, LogOut, User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { Link } from 'react-router';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import { apiFetch } from '../lib/auth';
import { useAuth } from '../lib/useAuth';

export default function StudentProfilePage() {
  const { user, logout } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const extractList = (res: any) => {
    if (!res || res.error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    return [];
  };

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
    const fetchStudentProfile = async () => {
      const res = await apiFetch('/api/student/profile');
      if (res && !res.error) {
        setFullName(res.fullName || '');
        setEmail(res.email || '');
        setPhone(res.phone || '');
        setAddress(res.address || '');
      }
    };

    const fetchStudentNotifications = async () => {
      try {
        const [currentBorrows, pendingRequests] = await Promise.all([
          apiFetch('/api/student/current-borrows'),
          apiFetch('/api/student/pending-requests'),
        ]);

        let generatedNotifs: Notification[] = [];
        const readIds = JSON.parse(localStorage.getItem('readStudentNotifs') || '[]');
        const today = new Date();

        if (!currentBorrows.error && Array.isArray(currentBorrows)) {
          currentBorrows.forEach((borrow: any) => {
            const dueDate = new Date(borrow.dueDate);
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              generatedNotifs.push({
                id: `overdue-${borrow.id}`,
                type: 'error',
                icon: 'error',
                title: 'Sách quá hạn!',
                message: `Cuốn "${borrow.book?.title || 'N/A'}" đã quá hạn ${Math.abs(diffDays)} ngày. Vui lòng trả sách ngay để tránh phạt thêm.`,
                time: formatDateTime(dueDate),
                isRead: readIds.includes(`overdue-${borrow.id}`),
                link: '/student/history',
              });
            } else if (diffDays <= 3) {
              generatedNotifs.push({
                id: `warning-${borrow.id}`,
                type: 'warning',
                icon: 'alert',
                title: 'Sắp đến hạn trả sách',
                message: `Cuốn "${borrow.book?.title || 'N/A'}" sẽ đến hạn trả trong ${diffDays} ngày tới.`,
                time: formatDateTime(dueDate),
                isRead: readIds.includes(`warning-${borrow.id}`),
                link: '/student/dashboard',
              });
            }
          });
        }

        if (!pendingRequests.error && Array.isArray(pendingRequests)) {
          pendingRequests.forEach((request: any) => {
            const requestDate = new Date(request.borrowDate || request.createdAt || Date.now());
            const pickupDeadline = new Date(requestDate);
            pickupDeadline.setDate(pickupDeadline.getDate() + 2);

            generatedNotifs.push({
              id: `pending-${request.id}`,
              type: 'success',
              icon: 'check',
              title: 'Đăng ký mượn thành công',
              message: `Bạn đã đăng ký mượn cuốn "${request.book?.title || 'N/A'}". Vui lòng đến thư viện nhận sách trước ${formatDateTime(pickupDeadline)}. Nếu không nhận sách quá 3 lần sẽ bị phạt 50.000 VNĐ.`,
              time: formatDateTime(requestDate),
              isRead: readIds.includes(`pending-${request.id}`),
              link: '/student/dashboard',
            });
          });
        }

        generatedNotifs.sort((a, b) => {
          if (a.type === 'error' && b.type !== 'error') return -1;
          if (a.type !== 'error' && b.type === 'error') return 1;
          return 0;
        });

        setNotifications(generatedNotifs);
      } catch (error) {
        console.error('Lỗi tạo thông báo Sinh viên:', error);
      }
    };

    void fetchStudentProfile();
    void fetchStudentNotifications();
  }, []);

  const handleMarkAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem('readStudentNotifs') || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem('readStudentNotifs', JSON.stringify([...readIds, id]));
    }

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readStudentNotifs', JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleSaveProfile = async () => {
    const res = await apiFetch('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, email, phone, address }),
    });
    if (res.error) {
      alert(res.error);
      return;
    }
    alert('Thông tin đã được cập nhật!');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    const res = await apiFetch('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.error) {
      alert(res.error);
      return;
    }

    alert('Mật khẩu đã được thay đổi!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Student Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#f79421] rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-[#262262]">Thư viện UTT</span>
            </Link>

            {/* Nav Links and Actions */}
            <div className="flex items-center gap-8">
              <Link to="/" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Trang chủ
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Giới thiệu
              </Link>
              <Link
                to="/student/dashboard"
                className="text-gray-600 hover:text-[#f79421] transition-colors"
              >
                Dashboard
              </Link>
              <Link to="/books" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Tra cứu
              </Link>
              <Link
                to="/student/history"
                className="text-gray-600 hover:text-[#f79421] transition-colors"
              >
                Lịch sử
              </Link>
              <Link to="/student/profile" className="text-[#f79421] font-semibold">
                Hồ sơ
              </Link>

              {/* Notification Dropdown */}
              <NotificationDropdown
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl text-[#262262] mb-6">Hồ sơ Sinh viên</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
              {/* Avatar */}
              <div className="w-32 h-32 mx-auto mb-4 bg-[#f79421] rounded-full flex items-center justify-center">
                <span className="text-5xl text-white">{getInitial(fullName)}</span>
              </div>

              {/* Name and Student ID */}
              <h2 className="text-2xl text-[#262262] mb-1">{fullName}</h2>
              <p className="text-gray-600 mb-4">Mã sinh viên: {user?.studentId || ''}</p>

              {/* Account Status */}
              <div className="mb-6">
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                  Hoạt động
                </span>
              </div>

              {/* Join Date */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">Ngày tham gia</p>
                <p className="text-[#262262] font-semibold">15/09/2023</p>
              </div>
            </div>
          </div>

          {/* Right - Editable Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl text-[#262262] mb-6">Thông tin cá nhân</h3>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <User className="w-4 h-4 inline mr-2" />
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Địa chỉ
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveProfile}
                  className="w-full py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
                >
                  Lưu thông tin
                </button>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl text-[#262262] mb-6">Đổi mật khẩu</h3>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block mb-2 text-sm text-gray-600">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                {/* Change Password Button */}
                <button
                  onClick={handleChangePassword}
                  className="w-full py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
