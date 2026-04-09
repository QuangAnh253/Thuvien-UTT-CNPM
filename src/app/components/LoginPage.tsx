import { useEffect, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getToken, getUser, setAuth } from '../lib/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showLockedPopup, setShowLockedPopup] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const currentUser = getUser();
    const role = String(currentUser?.role || '').toLowerCase();
    if (role === 'student') {
      navigate('/student/dashboard', { replace: true });
      return;
    }

    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.status === 403 && data?.status === 'locked') {
        setShowLockedPopup(true);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác');
        return;
      }

      // Lưu Token và thông tin User vào LocalStorage qua helper auth.ts
      setAuth(data.token, data.user);

      // Điều hướng dựa trên vai trò trả về từ Backend
      if (data.user.role.toLowerCase() === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 mb-4">
            <img
              src="/LogoUTT_square_blue.png"
              alt="UTT Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[#262262]">
            Hệ thống Quản lý Thư viện UTT
          </h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block mb-2 text-gray-700">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
              />
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="block mb-2 text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#f79421] hover:bg-[#e68414] text-white py-3 rounded-lg transition-colors mb-4"
            >
              Đăng nhập
            </button>

            <div className="text-center mb-4">
              <a
                href="#"
                className="text-[#f79421] hover:text-[#e68414] hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Chức năng đang phát triển');
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-gray-500">hoặc</span>
              </div>
            </div>

            <Link to="/register">
              <button
                type="button"
                className="w-full bg-white border-2 border-[#262262] text-[#262262] hover:bg-gray-50 py-3 rounded-lg transition-colors"
              >
                Đăng ký tài khoản sinh viên
              </button>
            </Link>
          </form>
        </div>

        {showLockedPopup && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl text-[#262262] mb-3">Tài khoản bị khóa</h3>
              <p className="text-gray-600 mb-6">
                Tài khoản của bạn hiện đang bị khóa, vui lòng liên hệ quản trị viên.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowLockedPopup(false);
                    navigate('/books');
                  }}
                  className="px-5 py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e68414] transition-colors"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Browse Books Without Login */}
        <div className="mt-6 text-center">
          <Link
            to="/books"
            className="text-gray-600 hover:text-[#f79421] transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Tra cứu sách không cần đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
