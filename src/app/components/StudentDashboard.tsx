import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Search, Clock, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import { apiFetch } from '../lib/auth';
import { useAuth } from '../lib/useAuth';

interface BorrowedBook {
  id: string;
  title: string;
  borrowDate: string;
  dueDate: string;
  daysRemaining: number;
  coverColor: string;
  dueDateRaw?: string;
}

interface OnlineRequest {
  id: string;
  bookTitle: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface RecentBorrow {
  id: string;
  bookTitle: string;
  borrowDate: string;
  returnDate: string;
  status: 'returned' | 'overdue' | 'active';
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentlyBorrowed, setCurrentlyBorrowed] = useState<BorrowedBook[]>([]);
  const [onlineRequests, setOnlineRequests] = useState<OnlineRequest[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<RecentBorrow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [renewalModal, setRenewalModal] = useState<{ show: boolean; book: BorrowedBook | null }>({ show: false, book: null });

  const extractList = (res: any) => {
    if (!res || res.error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    return [];
  };

  const toDateText = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('vi-VN');
  };

  const calculateDaysRemaining = (dueDateValue: any) => {
    if (!dueDateValue) return 0;

    const due = new Date(dueDateValue);
    if (Number.isNaN(due.getTime())) return 0;

    const today = new Date();
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.floor((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDateYMD = (value: any) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
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

  const mapCurrentBorrow = (borrow: any): BorrowedBook => ({
    id: String(borrow.id),
    title: borrow.book?.title || borrow.title || '',
    borrowDate: toDateText(borrow.borrowDate),
    dueDate: toDateText(borrow.dueDate),
    daysRemaining:
      typeof borrow.daysRemaining === 'number'
        ? borrow.daysRemaining
        : typeof borrow.overdueDays === 'number'
          ? borrow.daysRemaining ?? (borrow.overdueDays > 0 ? -borrow.overdueDays : calculateDaysRemaining(borrow.dueDate))
          : calculateDaysRemaining(borrow.dueDate),
    coverColor: borrow.coverColor || '#262262',
    dueDateRaw: borrow.dueDate,
  });

  const mapPendingRequest = (request: any): OnlineRequest => ({
    id: String(request.id),
    bookTitle: request.book?.title || request.bookTitle || '',
    requestDate: toDateText(request.requestDate || request.borrowDate || request.createdAt),
    status:
      request.status === 'approved' || request.status === 'rejected'
        ? request.status
        : 'pending',
  });

  const mapRecentBorrow = (borrow: any): RecentBorrow => ({
    id: String(borrow.id),
    bookTitle: borrow.book?.title || borrow.bookTitle || '',
    borrowDate: toDateText(borrow.borrowDate),
    returnDate: toDateText(borrow.returnDate || borrow.updatedAt || ''),
    status: (() => {
      const upperStatus = String(borrow.status || '').toUpperCase();
      if (borrow.returnDate || upperStatus === 'RETURNED') return 'returned';

      const dueDate = new Date(borrow.dueDate);
      if (!Number.isNaN(dueDate.getTime()) && calculateDaysRemaining(dueDate) < 0) return 'overdue';

      return 'active';
    })(),
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [borrowsRes, requestsRes, histRes] = await Promise.all([
          apiFetch('/api/student/current-borrows'),
          apiFetch('/api/student/pending-requests'),
          apiFetch('/api/student/history?limit=4'),
        ]);

        const currentBorrows = extractList(borrowsRes);
        const pendingRequests = extractList(requestsRes);
        const readIds = JSON.parse(localStorage.getItem('readStudentNotifs') || '[]');
        const today = new Date();

        setCurrentlyBorrowed(currentBorrows.map(mapCurrentBorrow));
        setOnlineRequests(pendingRequests.map(mapPendingRequest));
        const filteredRecent = extractList(histRes).filter((item: any) => {
          const upperStatus = String(item.status || '').toUpperCase();
          return upperStatus !== 'PENDING' && upperStatus !== 'REJECTED';
        });
        setRecentBorrows(filteredRecent.map(mapRecentBorrow));

        let generatedNotifs: Notification[] = [];

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

        generatedNotifs.sort((a, b) => {
          if (a.type === 'error' && b.type !== 'error') return -1;
          if (a.type !== 'error' && b.type === 'error') return 1;
          return 0;
        });

        setNotifications(generatedNotifs);
      } catch (error) {
        console.error('Lỗi tải dữ liệu Dashboard:', error);
      }
    };

    void fetchDashboardData();
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

  const getStatusBadge = (status: 'pending' | 'approved' | 'rejected') => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    const labels = {
      pending: 'Đang chờ',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getReturnStatusBadge = (status: 'returned' | 'overdue' | 'active') => {
    const styles = {
      returned: 'bg-gray-100 text-gray-700',
      overdue: 'bg-red-100 text-red-700',
      active: 'bg-green-100 text-green-700',
    };

    const labels = {
      returned: 'Đã trả',
      overdue: 'Quá hạn',
      active: 'Đang mượn',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleSearch = () => {
    if (searchQuery.trim()) navigate(`/books?q=${searchQuery}`);
  };

  const handleRenewalRequest = (book: BorrowedBook) => {
    setRenewalModal({ show: true, book });
  };

  const confirmRenewal = async () => {
    if (!renewalModal.book) return;

    try {
      const res = await apiFetch(`/api/borrow/${renewalModal.book.id}/extend`, {
        method: 'PUT',
      });
      if (res.error) {
        alert(res.error);
        return;
      }

      alert('Gia hạn thành công! Hạn trả mới được cập nhật.');
      setRenewalModal({ show: false, book: null });

      apiFetch('/api/student/current-borrows').then((r) => {
        const refreshed = extractList(r).map(mapCurrentBorrow);
        if (refreshed.length) setCurrentlyBorrowed(refreshed);
      });
    } catch {
      alert('Không thể kết nối server');
    }
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
              <Link to="/student/dashboard" className="text-[#f79421] font-semibold">
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
              <Link
                to="/student/profile"
                className="text-gray-600 hover:text-[#f79421] transition-colors"
              >
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
                className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Welcome Banner */}
      <div className="bg-[#262262] text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">Xin chào, {user?.fullName || user?.username}</h1>
              <p className="text-white/80">Mã sinh viên: {user?.studentId || ''}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-[#f79421]" />
                <div>
                  <p className="text-2xl font-semibold">{currentlyBorrowed.length}</p>
                  <p className="text-sm text-white/80">Sách đang mượn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm sách nhanh..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Currently Borrowed Books */}
        <div className="mb-8">
          <h2 className="text-2xl text-[#262262] mb-4">Sách đang mượn</h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
              {currentlyBorrowed.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#f79421] transition-all w-64 flex-shrink-0"
                >
                  {/* Book Cover */}
                  <div
                    className="h-40 flex items-center justify-center"
                    style={{ backgroundColor: book.coverColor }}
                  >
                    <BookOpen className="w-12 h-12 text-white opacity-50" />
                  </div>

                  {/* Book Info */}
                  <div className="p-4">
                    <h3 className="text-[#262262] font-semibold mb-3 line-clamp-2">
                      {book.title}
                    </h3>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Mượn: {book.borrowDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>Hạn: {book.dueDate}</span>
                      </div>
                    </div>

                    {/* Countdown Badge */}
                    {book.daysRemaining >= 0 ? (
                      <div className="bg-green-100 text-green-700 px-3 py-2 rounded-lg text-center text-sm font-semibold mb-3">
                        Còn {book.daysRemaining} ngày
                      </div>
                    ) : (
                      <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-center text-sm font-semibold mb-3">
                        Quá hạn {Math.abs(book.daysRemaining)} ngày
                      </div>
                    )}

                    {/* Renewal Button */}
                    <button
                      onClick={() => handleRenewalRequest(book)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors text-sm font-semibold"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Gia hạn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Layout for Online Requests and Recent Borrows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Online Requests */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-[#262262] mb-4">Đặt mượn online</h2>
            <div className="space-y-3">
              {onlineRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#f79421] transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="text-[#262262] font-semibold mb-1">{request.bookTitle}</h4>
                    <p className="text-sm text-gray-600">Yêu cầu: {request.requestDate}</p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Borrows */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl text-[#262262] mb-4">Mượn gần đây</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-gray-600">Tên sách</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-600">Ngày mượn</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-600">Ngày trả</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-600">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentBorrows.map((borrow) => (
                    <tr key={borrow.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[#262262]">{borrow.bookTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{borrow.borrowDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{borrow.returnDate}</td>
                      <td className="px-4 py-3">{getReturnStatusBadge(borrow.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Confirmation Modal */}
      {renewalModal.show && renewalModal.book && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-[#262262] font-semibold">Xác nhận gia hạn</h3>
              <button
                onClick={() => setRenewalModal({ show: false, book: null })}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">Bạn có muốn gia hạn sách này không?</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-[#262262] font-semibold">{renewalModal.book.title}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Ngày mượn: {renewalModal.book.borrowDate}</p>
                  <p>Hạn trả hiện tại: {renewalModal.book.dueDate}</p>
                  <p className="text-[#f79421] font-semibold mt-2">
                    Hạn trả mới: {formatDateYMD(new Date((renewalModal.book.dueDateRaw || renewalModal.book.dueDate) as string).getTime() + 14 * 24 * 60 * 60 * 1000)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                * Sách sẽ được gia hạn thêm 14 ngày kể từ hạn trả hiện tại
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRenewalModal({ show: false, book: null })}
                className="flex-1 px-4 py-2 border border-gray-300 text-[#262262] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmRenewal}
                className="flex-1 px-4 py-2 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
