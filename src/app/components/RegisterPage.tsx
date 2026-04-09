import { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentCode: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setCurrentStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.fullName || !formData.studentCode) {
      setError('Vui lòng nhập đủ các trường bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          studentCode: formData.studentCode,
          email: formData.email,
          phone: formData.phone,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Đăng ký thất bại');
        return;
      }

      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch {
      setError('Lỗi kết nối server');
    }
  };

  const handleBackToStep1 = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 mb-4">
            <img
              src='/LogoUTT_square_blue.png'
              alt="UTT Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[#262262]">
            Đăng ký tài khoản sinh viên
          </h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {currentStep !== 3 && (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1
                          ? 'bg-[#f79421] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      1
                    </div>
                    <span className={currentStep >= 1 ? 'text-[#262262]' : 'text-gray-500'}>
                      Tài khoản
                    </span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentStep >= 2 ? 'bg-[#f79421] w-full' : 'bg-gray-200 w-0'
                      }`}
                    ></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2
                          ? 'bg-[#f79421] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      2
                    </div>
                    <span className={currentStep >= 2 ? 'text-[#262262]' : 'text-gray-500'}>
                      Thông tin cá nhân
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </>
          )}

          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit}>
              <div className="mb-4">
                <label htmlFor="username" className="block mb-2 text-gray-700">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block mb-2 text-gray-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
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

              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#f79421] hover:bg-[#e68414] text-white py-3 rounded-lg transition-colors"
              >
                Tiếp theo
              </button>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit}>
              <div className="mb-4">
                <label htmlFor="fullName" className="block mb-2 text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Nhập họ và tên"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="studentId" className="block mb-2 text-gray-700">
                  Mã sinh viên <span className="text-red-500">*</span>
                </label>
                <input
                  id="studentCode"
                  type="text"
                  value={formData.studentCode}
                  onChange={(e) => setFormData({...formData, studentCode: e.target.value})}
                  placeholder="Nhập mã sinh viên"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="example@utt.edu.vn"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block mb-2 text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Nhập số điện thoại"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="address" className="block mb-2 text-gray-700">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Nhập địa chỉ"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="px-6 py-3 text-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#f79421] hover:bg-[#e68414] text-white py-3 rounded-lg transition-colors"
                >
                  Hoàn tất đăng ký
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-[#262262] mb-2">
                Đăng ký thành công!
              </h2>
              <p className="text-gray-600 mb-8">
                Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập ngay bây giờ.
              </p>
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-[#f79421] hover:bg-[#e68414] text-white py-3 rounded-lg transition-colors"
              >
                Đăng nhập ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
