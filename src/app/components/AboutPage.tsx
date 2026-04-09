import { Link } from 'react-router';
import { useNavigate } from 'react-router';
import { BookOpen, User, BarChart3, Search, ShoppingCart, Clock, Users, Shield, FileText, CheckCircle } from 'lucide-react';
import { clearAuth, getUser, isLoggedIn } from '../lib/auth';

export default function AboutPage() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const teamMembers = [
    {
      name: 'Lê Quang Anh',
      studentId: '74DCHT21175',
      role: 'Trưởng nhóm',
      avatar: '/Le_Quang_Anh-74DCHT21175.jpg',
    },
    { name: 'Nguyễn Thị Hồng', studentId: '74DCHT21284', role: 'Thành viên nhóm' },
    { name: 'Nguyễn Văn Lộc', studentId: '74DCHT22244', role: 'Thành viên nhóm' },
    { name: 'Vũ Thị Thùy Trang', studentId: '74DCHT22166', role: 'Thành viên nhóm' },
    { name: 'Nguyễn Duy Thành', studentId: '74DCHT22236', role: 'Thành viên nhóm' },
  ];

  const techStack = [
    { label: 'Frontend', value: 'React + TailwindCSS' },
    { label: 'Backend', value: 'Node.js / Express' },
    { label: 'Database', value: 'MySQL' },
    { label: 'Other', value: 'TypeScript, React Router' },
  ];

  const getInitial = (name: string) => {
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#f79421] rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-[#262262]">Thư viện UTT</div>
                <div className="text-xs text-gray-500">Quản lý thư viện</div>
              </div>
            </Link>
            <div className="flex items-center gap-8">
              <Link to="/" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Trang chủ
              </Link>
              <Link to="/books" className="text-gray-600 hover:text-[#f79421] transition-colors">
                Tra cứu
              </Link>
              <Link to="/about" className="text-[#f79421] font-semibold">
                Giới thiệu
              </Link>
            </div>
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
                  className="px-6 py-2 bg-[#f79421] text-white rounded-lg hover:bg-[#e68419] transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-[#262262] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Hệ thống Quản lý Thư viện UTT</h1>
          <p className="text-xl text-white/80 mb-2">Sản phẩm demo học phần Công nghệ phần mềm</p>
          <p className="text-white/70 max-w-3xl mx-auto">
            Xây dựng hệ thống quản lý thư viện hiện đại, hỗ trợ tra cứu, mượn trả và quản lý dữ liệu hiệu quả cho sinh viên và cán bộ thư viện.
          </p>
        </div>
      </div>

      {/* Project Overview Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Tổng quan dự án</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-[#262262] mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[#f79421]" />
              Mục tiêu
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Số hóa quy trình quản lý thư viện</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Tăng hiệu quả tra cứu và mượn sách</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Giảm thiểu sai sót trong quản lý dữ liệu</span>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-[#262262] mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#f79421]" />
              Phạm vi
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Sinh viên</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Thủ thư</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-[#f79421] rounded-full mt-2 flex-shrink-0"></span>
                <span>Quản trị viên</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Problem & Solution Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Vấn đề & Giải pháp</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Problem */}
            <div className="bg-red-50 rounded-lg p-8 border border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-6">Vấn đề hiện tại</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-700 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Quản lý sách thủ công, khó kiểm soát</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-700 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Sinh viên khó tra cứu tài liệu</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-700 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Quy trình mượn/trả mất thời gian</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-700 text-sm">✗</span>
                  </div>
                  <span className="text-gray-700">Dễ xảy ra sai sót dữ liệu</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-green-50 rounded-lg p-8 border border-green-200">
              <h3 className="text-xl font-bold text-green-700 mb-6">Giải pháp đề xuất</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-700 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Hệ thống web quản lý tập trung</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-700 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Tra cứu sách nhanh theo nhiều tiêu chí</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-700 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Hỗ trợ mượn/trả và theo dõi trạng thái</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-700 text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Báo cáo và thống kê tự động</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* System Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Chức năng hệ thống</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sinh viên */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-[#f79421] transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-[#262262] mb-4">Sinh viên</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#f79421]" />
                <span>Tra cứu sách</span>
              </li>
              <li className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#f79421]" />
                <span>Đặt mượn online</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f79421]" />
                <span>Theo dõi lịch sử mượn</span>
              </li>
            </ul>
          </div>

          {/* Thủ thư */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-[#f79421] transition-all">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-[#f79421]" />
            </div>
            <h3 className="text-xl font-bold text-[#262262] mb-4">Thủ thư</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#f79421]" />
                <span>Quản lý sách</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#f79421]" />
                <span>Tạo phiếu mượn / xử lý trả</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f79421]" />
                <span>Theo dõi quá hạn</span>
              </li>
            </ul>
          </div>

          {/* Quản trị viên */}
          <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-[#f79421] transition-all">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-[#262262] mb-4">Quản trị viên</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#f79421]" />
                <span>Quản lý nhân viên</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#f79421]" />
                <span>Phân quyền hệ thống</span>
              </li>
              <li className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#f79421]" />
                <span>Xem báo cáo & thống kê</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* System Workflow Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Quy trình hệ thống</h2>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Tra cứu</div>
            <div className="text-[#f79421] text-2xl">→</div>
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Đặt mượn</div>
            <div className="text-[#f79421] text-2xl">→</div>
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Duyệt</div>
            <div className="text-[#f79421] text-2xl">→</div>
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Nhận sách</div>
            <div className="text-[#f79421] text-2xl">→</div>
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Trả sách</div>
            <div className="text-[#f79421] text-2xl">→</div>
            <div className="px-6 py-3 bg-[#262262] text-white rounded-lg font-semibold">Thống kê</div>
          </div>
          <div className="bg-gray-100 rounded-lg p-12 border-2 border-dashed border-gray-300 text-center">
            <img
              src="/Workflow_Diagram.png"
              alt="Workflow Diagram"
              className="mx-auto max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Technology Stack Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Công nghệ sử dụng</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {techStack.map((tech, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <div className="text-sm text-gray-500 mb-2">{tech.label}</div>
              <div className="font-bold text-[#262262]">{tech.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[#262262] mb-8 text-center">Nhóm thực hiện</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200 hover:border-[#f79421] transition-all">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-[#f79421] flex items-center justify-center">
                  {'avatar' in member && member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-bold">{getInitial(member.name)}</span>
                  )}
                </div>
                <h3 className="font-bold text-[#262262] mb-1">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-1">{member.studentId}</p>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-[#262262] text-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/80">
            Sản phẩm được phát triển phục vụ mục đích học tập trong học phần Công nghệ phần mềm – Trường Đại học Công nghệ GTVT.
          </p>
          <p className="text-white/60 mt-2 text-sm">© 2026 Thư viện UTT. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
