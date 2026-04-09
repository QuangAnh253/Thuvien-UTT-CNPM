import { useState, useEffect } from 'react';
import { BookOpen, LogIn, ChevronRight, Star, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { apiFetch, clearAuth, getUser, isLoggedIn } from '../lib/auth';
import NotificationDropdown, { Notification } from './NotificationDropdown';

interface Book {
  id: string;
  bookCode: string;
  title: string;
  author: string;
  imageUrl?: string;
  publisher: string;
  publishYear: number;
  category: string;
  description: string;
  availableQty: number;
  totalQty: number;
  rating?: number;
}

export default function PublicBookDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [authState, setAuthState] = useState(() => ({
    loggedIn: isLoggedIn(),
    user: getUser(),
  }));
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
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

  const refreshAuthState = () => {
    setAuthState({
      loggedIn: isLoggedIn(),
      user: getUser(),
    });
  };

  const handleLogout = () => {
    clearAuth();
    refreshAuthState();
    navigate('/login');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-[#f79421] text-[#f79421]'
            : i < rating
            ? 'fill-[#f79421]/50 text-[#f79421]'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      setSuccess(false);
      try {
        const res = await fetch(`/api/books/${id}`);
        const data = await res.json();
        setBook(data);

        // Fetch related books (same category)
        if (data.category) {
          const query = new URLSearchParams({ category: data.category });
          const relatedRes = await fetch(`/api/books?${query.toString()}`);
          const relatedData = await relatedRes.json();
          // Filter out current book and get first 4
          setRelatedBooks(relatedData.filter((b: Book) => b.id !== id).slice(0, 4));
        }
      } catch (error) {
        console.error('Lỗi fetch sách:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchBook();
    }
  }, [id]);

  const handleBorrowRequest = async () => {
    if (!book || submitting || success) {
      return;
    }

    if (!isLoggedIn()) {
      alert('Vui lòng đăng nhập để thực hiện đăng ký mượn sách!');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/borrow/request', {
        method: 'POST',
        body: JSON.stringify({ bookId: Number(book.id) }),
      });

      if (res?.error) {
        alert(res.error);
      } else {
        setSuccess(true);
        alert('Đã gửi yêu cầu mượn sách! Vui lòng chờ thủ thư phê duyệt.');
      }
    } catch {
      alert('Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    refreshAuthState();

    const handleFocus = () => refreshAuthState();
    const handleStorage = () => refreshAuthState();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [location.pathname]);

  useEffect(() => {
    const fetchStudentNotifications = async () => {
      if (!authState.loggedIn || authState.user?.role !== 'student') {
        setNotifications([]);
        return;
      }

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
              message: `Cuốn "${borrow.book?.title || 'N/A'}" đã quá hạn ${Math.abs(diffDays)} ngày.`,
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
            message: `Bạn đã đăng ký mượn cuốn "${request.book?.title || 'N/A'}". Nhận sách trước ${formatDateTime(pickupDeadline)}.`,
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
  }, [authState.loggedIn, authState.user?.role]);

  const handleMarkAsRead = (id: string) => {
    const readIds = JSON.parse(localStorage.getItem('readStudentNotifs') || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem('readStudentNotifs', JSON.stringify([...readIds, id]));
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem('readStudentNotifs', JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f79421]"></div>
        </div>
      ) : !book ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[#262262] mb-4">Không tìm thấy sách</p>
            <Link to="/books" className="text-[#f79421] hover:underline">Quay lại danh sách</Link>
          </div>
        </div>
      ) : (
      <div>
        {/* Top Navbar */}
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

            {/* Nav Links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Trang chủ
              </Link>
              <Link to="/books" className="text-[#f79421] font-semibold">
                Tra cứu
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Giới thiệu
              </Link>
            </div>

            {/* Login/User Actions */}
            <div className="flex items-center gap-4">
              {authState.loggedIn ? (
                <>
                  {authState.user?.role === 'student' && (
                    <NotificationDropdown
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                    />
                  )}
                  <span className="text-sm font-medium text-[#262262]">
                    Chào, {authState.user?.fullName || authState.user?.username || 'Bạn'}
                  </span>
                  <Link
                    to={authState.user?.role === 'student' ? '/student/dashboard' : '/admin/dashboard'}
                    className="px-4 py-2 bg-[#262262] text-white rounded-lg hover:bg-[#1a1745] transition-colors"
                  >
                    Bảng điều khiển
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-500 text-sm font-semibold"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-[#f79421] transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/books" className="hover:text-[#f79421] transition-colors">
            Tra cứu
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#262262]">{book.title}</span>
        </div>

        {/* Book Details - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left - Book Cover */}
          <div className="lg:col-span-1">
            <div
              className="w-full h-[400px] rounded-lg shadow-lg flex items-center justify-center bg-[#262262] overflow-hidden"
            >
              {book.imageUrl ? (
                <button
                  type="button"
                  onClick={() => setShowImagePreview(true)}
                  className="w-full h-full"
                  title="Nhấn để xem ảnh lớn"
                >
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-full object-cover rounded-lg cursor-zoom-in"
                  />
                </button>
              ) : (
                <BookOpen className="w-32 h-32 text-white opacity-50" />
              )}
            </div>
            {book.imageUrl && (
              <p className="text-xs text-gray-500 mt-2 text-center">Nhấn vào ảnh để xem lớn</p>
            )}
          </div>

          {/* Right - Book Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h1 className="text-3xl text-[#262262] mb-4">{book.title}</h1>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-32">Tác giả:</span>
                  <span className="text-[#262262]">{book.author}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-32">Nhà xuất bản:</span>
                  <span className="text-[#262262]">{book.publisher}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-32">Năm xuất bản:</span>
                  <span className="text-[#262262]">{book.publishYear}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-32">Thể loại:</span>
                  <span className="bg-[#f79421]/10 text-[#f79421] px-3 py-1 rounded-full text-sm">
                    {book.category}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-32">Mã sách:</span>
                  <span className="text-[#262262] font-mono">{book.bookCode}</span>
                </div>
                {book.rating && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-32">Đánh giá:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">{renderStars(book.rating)}</div>
                      <span className="text-sm text-gray-600">({book.rating}/5)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-lg text-[#262262] mb-3">Mô tả</h3>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>

              {/* Availability Card */}
              <div className="bg-gradient-to-br from-[#f79421]/5 to-[#f79421]/10 border border-[#f79421]/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tình trạng</p>
                    <p className="text-[#262262]">
                      Số lượng: <span className="font-semibold">{book.totalQty}</span> cuốn | Còn
                      sẵn: <span className="font-semibold">{book.availableQty}</span> cuốn
                    </p>
                  </div>
                  {book.availableQty > 0 ? (
                    <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                      Có thể mượn
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                      Hết sách
                    </span>
                  )}
                </div>

                {book.availableQty > 0 ? (
                  <button
                    onClick={handleBorrowRequest}
                    disabled={submitting || success}
                    className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
                      success
                        ? 'bg-green-600 cursor-default'
                        : authState.loggedIn
                        ? 'bg-[#f79421] hover:bg-[#e67d0f]'
                        : 'bg-[#262262] hover:bg-[#1a1745]'
                    } ${submitting ? 'opacity-80' : ''}`}
                  >
                    {success
                      ? 'Đã gửi yêu cầu'
                      : submitting
                      ? 'Đang xử lý...'
                      : authState.loggedIn
                      ? 'Đăng ký mượn ngay'
                      : 'Đăng nhập để mượn sách'}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg text-white font-semibold transition-colors bg-gray-300 cursor-not-allowed"
                  >
                    Hết sách
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Books Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl text-[#262262] mb-6">Sách cùng thể loại</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedBooks.map((relatedBook) => (
              <Link
                key={relatedBook.id}
                to={`/books/${relatedBook.id}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#f79421] transition-all"
              >
                {/* Book Cover */}
                <div className="h-48 flex items-center justify-center text-white bg-[#262262] overflow-hidden">
                  {relatedBook.imageUrl ? (
                    <img
                      src={relatedBook.imageUrl}
                      alt={relatedBook.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 opacity-50" />
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h4 className="text-[#262262] font-semibold mb-2 line-clamp-2">
                    {relatedBook.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{relatedBook.author}</p>

                  {/* Availability */}
                  {relatedBook.availableQty > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-semibold">
                        Còn {relatedBook.availableQty} cuốn
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600 font-semibold">Hết sách</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Borrow Confirmation Modal */}
      {showBorrowModal && book && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl text-[#262262] mb-4">Xác nhận đăng ký mượn sách</h3>

            {/* Book Thumbnail */}
            <div className="flex items-start gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div
                className="w-20 h-28 rounded flex items-center justify-center flex-shrink-0 bg-[#262262]"
              >
                <BookOpen className="w-8 h-8 text-white opacity-50" />
              </div>
              <div>
                <h4 className="text-[#262262] font-semibold mb-1">{book.title}</h4>
                <p className="text-sm text-gray-600">{book.author}</p>
                <p className="text-sm text-gray-600">Mã: {book.bookCode}</p>
              </div>
            </div>

            {/* Student Info (placeholder) */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[#262262] mb-1">
                <span className="font-semibold">Sinh viên:</span>{' '}
                {authState.loggedIn
                  ? authState.user?.fullName || authState.user?.username || 'Đã đăng nhập'
                  : 'Chưa đăng nhập'}
              </p>
              <p className="text-xs text-gray-600">
                {authState.loggedIn
                  ? 'Vui lòng vào Bảng điều khiển để hoàn tất đăng ký mượn sách'
                  : 'Vui lòng đăng nhập để hoàn tất đăng ký mượn sách'}
              </p>
            </div>

            {/* Notice */}
            <div className="mb-6 p-4 bg-[#f79421]/10 border border-[#f79421]/20 rounded-lg">
              <p className="text-sm text-[#262262]">
                <span className="font-semibold">Lưu ý:</span> Nhận sách tại thư viện trong 2 ngày
                làm việc sau khi đăng ký được duyệt.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBorrowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-[#262262] rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              {authState.loggedIn ? (
                <Link
                  to={authState.user?.role === 'student' ? '/student/dashboard' : '/admin/dashboard'}
                  className="flex-1 px-4 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors text-center"
                >
                  Bảng điều khiển
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 px-4 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors text-center"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {showImagePreview && book?.imageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={book.imageUrl}
              alt={book.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
