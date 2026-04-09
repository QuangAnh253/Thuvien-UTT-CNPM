import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Calendar, Filter, RefreshCw, X } from 'lucide-react';
import { Link } from 'react-router';
import NotificationDropdown, { Notification } from './NotificationDropdown';
import { apiFetch } from '../lib/auth';
import { useAuth } from '../lib/useAuth';

interface BorrowHistory {
  id: string;
  borrowCode: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  status: 'active' | 'returned' | 'overdue';
}

export default function StudentHistoryPage() {
  const { logout } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [historyData, setHistoryData] = useState<BorrowHistory[]>([]);
  const [totalBorrows, setTotalBorrows] = useState(0);
  const [activeBorrows, setActiveBorrows] = useState(0);
  const [totalFines, setTotalFines] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [renewalModal, setRenewalModal] = useState<{ show: boolean; book: BorrowHistory | null }>({ show: false, book: null });

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

  const normalizeStatus = (status: string) => {
    const value = String(status || '').toUpperCase();
    if (value === 'ALL') return 'ALL';
    if (value === 'ACTIVE') return 'BORROWING';
    return value;
  };

  const mapBorrowHistory = (item: any): BorrowHistory => ({
    id: String(item.id),
    borrowCode: item.borrowCode || `PM${String(item.id).padStart(4, '0')}`,
    bookTitle: item.book?.title || item.bookTitle || '',
    borrowDate: item.borrowDate ? new Date(item.borrowDate).toLocaleDateString('vi-VN') : '—',
    dueDate: item.dueDate ? new Date(item.dueDate).toLocaleDateString('vi-VN') : '—',
    returnDate: item.returnDate ? new Date(item.returnDate).toLocaleDateString('vi-VN') : null,
    fine: Number(item.fine ?? item.fineAmount ?? 0),
    status: (() => {
      const upperStatus = String(item.status || '').toUpperCase();
      if (item.returnDate || upperStatus === 'RETURNED') return 'returned';

      const dueDate = new Date(item.dueDate);
      const today = new Date();
      const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (!Number.isNaN(dueDate.getTime()) && dueStart.getTime() < todayStart.getTime()) {
        return 'overdue';
      }

      return 'active';
    })(),
  });

  const refreshHistory = async () => {
    const params = new URLSearchParams();
    const backendStatus = normalizeStatus(filterStatus);
    if (backendStatus !== 'ALL') params.set('status', backendStatus);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);

    const res = await apiFetch(`/api/student/history?${params.toString()}`);
    const data = extractList(res)
      .filter((item: any) => {
        const upperStatus = String(item.status || '').toUpperCase();
        return upperStatus !== 'PENDING' && upperStatus !== 'REJECTED';
      })
      .map(mapBorrowHistory);

    setHistoryData(data);
    setTotalBorrows(data.length);
    setActiveBorrows(data.filter((i: BorrowHistory) => i.status === 'active').length);
    setTotalFines(data.reduce((s: number, i: BorrowHistory) => s + (i.fine || 0), 0));
    setCurrentPage(1);
    return data;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        await refreshHistory();
      } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    const fetchStudentNotifications = async () => {
      try {
        const [currentBorrows, pendingRequests] = await Promise.all([
          apiFetch('/api/student/current-borrows'),
          apiFetch('/api/student/pending-requests'),
        ]);

        const readIds = JSON.parse(localStorage.getItem('readStudentNotifs') || '[]');
        const today = new Date();
        const generatedNotifs: Notification[] = [];

        extractList(currentBorrows).forEach((borrow: any) => {
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

        extractList(pendingRequests).forEach((request: any) => {
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
        console.error('Lỗi tải thông báo sinh viên:', error);
      }
    };

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

  const totalPages = Math.ceil(historyData.length / itemsPerPage);
  const paginatedData = historyData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: 'active' | 'returned' | 'overdue') => {
    const styles = {
      active: 'bg-[#262262] text-white',
      returned: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
    };

    const labels = {
      active: 'Đang mượn',
      returned: 'Đã trả',
      overdue: 'Quá hạn',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleRenewalRequest = (book: BorrowHistory) => {
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

      await refreshHistory();
    } catch {
      alert('Không thể kết nối server');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8 text-gray-500">Đang tải...</div>
      </div>
    );
  }

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
              <Link to="/student/history" className="text-[#f79421] font-semibold">
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
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-gray-300 rounded-lg hover:bg-gray-50">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl text-[#262262] mb-6">Lịch sử Mượn sách</h1>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <p className="text-sm text-gray-600 mb-2">Tổng mượn</p>
            <p className="text-3xl text-[#262262] font-semibold">{totalBorrows}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <p className="text-sm text-gray-600 mb-2">Đang mượn</p>
            <p className="text-3xl text-[#f79421] font-semibold">{activeBorrows}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <p className="text-sm text-gray-600 mb-2">Tổng phạt</p>
            <p className="text-3xl text-red-500 font-semibold">{formatCurrency(totalFines)} đ</p>
          </div>
        </div>

        {/* Filter Row */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Bộ lọc:</span>
            </div>

            {/* Status Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang mượn</option>
              <option value="returned">Đã trả</option>
              <option value="overdue">Quá hạn</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Từ ngày"
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent text-sm"
                />
              </div>
              <span className="text-gray-400">→</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Đến ngày"
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Mã phiếu</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tên sách</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày mượn</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Hạn trả</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Ngày trả</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Tiền phạt (VND)</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm text-gray-600">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.status === 'overdue'
                        ? 'bg-red-50 hover:bg-red-100'
                        : 'hover:bg-[#f79421]/5'
                    }`}
                  >
                    <td className="px-6 py-4 text-[#262262] font-mono">{item.borrowCode}</td>
                    <td className="px-6 py-4 text-[#262262]">{item.bookTitle}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.borrowDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.dueDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.returnDate || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {item.fine > 0 ? (
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(item.fine)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4">
                      {(item.status === 'active' || item.status === 'overdue') && (
                        <button
                          onClick={() => handleRenewalRequest(item)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors text-sm font-semibold"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Gia hạn
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#262262]"
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-[#f79421] text-white'
                    : 'border border-gray-300 text-[#262262] hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-[#262262]"
            >
              Sau
            </button>
          </div>
        )}
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
                <p className="text-[#262262] font-semibold">{renewalModal.book.bookTitle}</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Mã phiếu: {renewalModal.book.borrowCode}</p>
                  <p>Ngày mượn: {renewalModal.book.borrowDate}</p>
                  <p>Hạn trả hiện tại: {renewalModal.book.dueDate}</p>
                  <p className="text-[#f79421] font-semibold mt-2">
                    Hạn trả mới: {new Date(new Date(renewalModal.book.dueDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
