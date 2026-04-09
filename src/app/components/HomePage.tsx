import { useEffect, useState } from 'react';
import { BookOpen, LogIn, Search, Users, TrendingUp, CheckCircle, Clock, Zap, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { clearAuth, getUser, isLoggedIn, apiFetch } from '../lib/auth';

interface FeaturedBook {
  id: string;
  title: string;
  author: string;
  availableQty: number;
  imageUrl?: string;
}

const categories = ['Tất cả', 'Công nghệ thông tin', 'Kinh tế', 'Văn học', 'Khoa học'];
const fallbackCoverColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [featuredBooks, setFeaturedBooks] = useState<FeaturedBook[]>([]);
  const loggedIn = isLoggedIn();
  const user = getUser();

  const handleSearch = () => {
    window.location.href = `/books?q=${searchQuery}&category=${selectedCategory}`;
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    const fetchFeaturedBooks = async () => {
      try {
        const res = await apiFetch('/api/books');
        const list = (Array.isArray(res) ? res : []) || [];

        setFeaturedBooks(
          list.slice(0, 4).map((book: any) => ({
            id: String(book.id),
            title: book.title || 'N/A',
            author: book.author || 'N/A',
            availableQty: Number(book.availableQty ?? 0),
            imageUrl: book.imageUrl || undefined,
          }))
        );
      } catch {
        setFeaturedBooks([]);
      }
    };

    void fetchFeaturedBooks();
  }, []);

  return (
    <div className="min-h-screen bg-white">
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
              <Link to="/" className="text-[#f79421] font-semibold">
                Trang chủ
              </Link>
              <Link to="/books" className="text-gray-600 hover:text-[#f79421] transition-colors">
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
      <div className="bg-[#262262] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl mb-4">Hệ thống Quản lý Thư viện UTT</h1>
            <p className="text-xl text-white/80">
              Tra cứu, mượn và quản lý tài liệu nhanh chóng, tiện lợi
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-xl p-2 flex items-center gap-2 mb-8 max-w-3xl mx-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border-r border-gray-200 focus:outline-none text-[#262262] bg-transparent"
            >
              {categories.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm kiếm sách, tác giả..."
              className="flex-1 px-4 py-3 focus:outline-none text-[#262262]"
            />

            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-6 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors"
            >
              <Search className="w-5 h-5" />
              Tìm kiếm
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/books"
              className="px-8 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
            >
              Tra cứu ngay
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Books */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#f79421] transition-colors">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421]/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#f79421]" />
              </div>
              <p className="text-4xl text-[#262262] font-semibold mb-2">10,000+</p>
              <p className="text-gray-600">Tổng sách</p>
            </div>

            {/* Students */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#f79421] transition-colors">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421]/10 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-[#f79421]" />
              </div>
              <p className="text-4xl text-[#262262] font-semibold mb-2">5,000+</p>
              <p className="text-gray-600">Sinh viên</p>
            </div>

            {/* Borrows */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#f79421] transition-colors">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421]/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-[#f79421]" />
              </div>
              <p className="text-4xl text-[#262262] font-semibold mb-2">20,000+</p>
              <p className="text-gray-600">Lượt mượn</p>
            </div>

            {/* On-time Rate */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-[#f79421] transition-colors">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421]/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[#f79421]" />
              </div>
              <p className="text-4xl text-[#262262] font-semibold mb-2">95%</p>
              <p className="text-gray-600">Tỷ lệ đúng hạn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-[#262262] text-center mb-12">Sách nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <Link
                key={book.id}
                to={`/books/${book.id}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#f79421] transition-all"
              >
                {/* Book Cover */}
                <div
                  className="h-48 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: fallbackCoverColors[Number(book.id) % fallbackCoverColors.length] }}
                >
                  {book.imageUrl ? (
                    <img
                      src={book.imageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  )}
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="text-[#262262] font-semibold mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">{book.author}</p>

                  {book.availableQty > 0 ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Có sẵn
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Hết sách
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl text-[#262262] text-center mb-12">Tính năng nổi bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421] rounded-lg flex items-center justify-center">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-[#262262] mb-2">Tra cứu nhanh</h3>
              <p className="text-gray-600">
                Tìm kiếm sách theo tên, tác giả, thể loại với kết quả chính xác
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421] rounded-lg flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-[#262262] mb-2">Mượn online</h3>
              <p className="text-gray-600">
                Đặt mượn sách trực tuyến, nhận thông báo khi sách sẵn sàng
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421] rounded-lg flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-[#262262] mb-2">Quản lý dễ dàng</h3>
              <p className="text-gray-600">
                Theo dõi lịch sử mượn, hạn trả, tiền phạt một cách đơn giản
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f79421] rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-[#262262] mb-2">Báo cáo thông minh</h3>
              <p className="text-gray-600">
                Thống kê chi tiết về hoạt động mượn trả và xu hướng đọc
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-16 bg-[#262262] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl mb-4">Bắt đầu sử dụng hệ thống ngay hôm nay</h2>
          <p className="text-xl text-white/80 mb-8">
            Tham gia cùng hàng ngàn sinh viên đang sử dụng hệ thống thư viện hiện đại
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
            >
              Đăng nhập
            </Link>
            <Link
              to="/books"
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-semibold"
            >
              Tra cứu
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2026 Thư viện Đại học Công nghệ Giao thông Vận tải. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
