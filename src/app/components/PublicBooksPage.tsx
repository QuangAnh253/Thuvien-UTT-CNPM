import { useState, useEffect } from 'react';
import { Search, BookOpen, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { isLoggedIn, getUser, clearAuth, apiFetch } from '../lib/auth';
import NotificationDropdown, { Notification } from './NotificationDropdown';

interface Book {
  id: string;
  bookCode: string;
  title: string;
  author: string;
  imageUrl?: string;
  category: string;
  publishYear: number;
  availableQty: number;
  totalQty: number;
}
const categories = [
  'Tất cả',
  'Công nghệ thông tin',
  'Kinh tế',
  'Văn học',
  'Khoa học',
  'Lịch sử',
  'Ngoại ngữ',
];

export default function PublicBooksPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const itemsPerPage = 12;

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

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') ?? '';
    const category = params.get('category') ?? 'Tất cả';

    setSearchQuery(q);
    setSelectedCategory(category);
  }, [location.search]);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const fetchStudentNotifications = async () => {
      if (!loggedIn || user?.role !== 'student') {
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
  }, [loggedIn, user?.role]);

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

  const fetchBooks = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const query = new URLSearchParams();
      if (searchQuery) query.append('search', searchQuery);
      if (selectedCategory !== 'Tất cả') query.append('category', selectedCategory);

      const res = await apiFetch(`/api/books?${query.toString()}`);
      setBooks((Array.isArray(res) ? res : []) || []);
    } catch (error) {
      console.error('Lỗi fetch sách:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(books.length / itemsPerPage);
  const paginatedBooks = books.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50">
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
              {loggedIn ? (
                <>
                  {user?.role === 'student' && (
                    <NotificationDropdown
                      notifications={notifications}
                      onMarkAsRead={handleMarkAsRead}
                      onMarkAllAsRead={handleMarkAllAsRead}
                    />
                  )}
                  <span className="text-sm font-medium text-[#262262]">
                    Chào, {user?.fullName || user?.username || 'Bạn'}
                  </span>
                  <Link
                    to={user?.role === 'student' ? '/student/dashboard' : '/admin/dashboard'}
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

      {/* Hero Section */}
      <div className="bg-[#262262] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl text-white text-center mb-8">
            Tra cứu Tài liệu Thư viện UTT
          </h1>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-r border-gray-200 focus:outline-none text-[#262262] bg-transparent"
            >
              <option>Tất cả</option>
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên sách, tác giả..."
              className="flex-1 px-4 py-3 focus:outline-none text-[#262262]"
            />

            <button
              className="flex items-center gap-2 px-6 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Filter Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg text-[#262262] mb-4">Bộ lọc</h3>

              {/* Category Filter Buttons */}
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category ? 'bg-[#f79421] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Book Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f79421]"></div>
              </div>
            ) : paginatedBooks.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl text-[#262262] mb-2">
                  Không tìm thấy kết quả phù hợp
                </h3>
                <p className="text-gray-600 mb-4">
                  Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Tất cả');
                  }}
                  className="px-4 py-2 text-[#f79421] border border-[#f79421] rounded-lg hover:bg-[#f79421] hover:text-white transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                {/* Book Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {paginatedBooks.map((book) => (
                    <Link key={book.id} to={`/books/${book.id}`} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        {book.imageUrl ? (
                          <img
                            src={book.imageUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white font-bold opacity-20 text-4xl select-none">UTT</div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs font-bold text-[#262262]">{book.bookCode}</div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="text-xs text-[#f79421] font-bold uppercase mb-2">{book.category}</div>
                        <h3 className="font-bold text-[#262262] text-lg mb-1 group-hover:text-[#f79421] transition-colors line-clamp-2">{book.title}</h3>
                        <p className="text-gray-500 text-sm mb-4">TG: {book.author}</p>
                        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
                          <span className={book.availableQty > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                            {book.availableQty > 0 ? `Còn ${book.availableQty} cuốn` : 'Hết sách'}
                          </span>
                          <span className="text-gray-400">Năm: {book.publishYear}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
