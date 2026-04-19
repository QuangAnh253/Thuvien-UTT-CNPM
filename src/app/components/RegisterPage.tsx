import { useEffect, useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getApiUrl } from '../lib/auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

type Step = 1 | 2 | 3 | 4;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';
const USERNAME_REGEX = /^(?=.{6,20}$)(?!.*[._]{2})(?!.*[._]$)[a-z][a-z0-9._]*$/;
const RESERVED_USERNAMES = new Set(['admin', 'root', 'system', 'support', 'null', 'undefined']);

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const validateUsername = (value: string): string | null => {
  const username = normalizeUsername(value);
  if (!username) return 'Vui lòng nhập tên đăng nhập';
  if (!USERNAME_REGEX.test(username)) {
    return 'Username phải từ 6-20 ký tự, bắt đầu bằng chữ thường, chỉ gồm a-z, 0-9, ., _';
  }
  if (RESERVED_USERNAMES.has(username)) {
    return 'Username này không được phép sử dụng';
  }
  return null;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameHint, setUsernameHint] = useState('');

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
  const usernameRuleError = validateUsername(formData.username);
  const canSubmitStep1 = !usernameRuleError && usernameStatus === 'available';

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const localUsernameError = validateUsername(formData.username);
    if (localUsernameError) {
      setError(localUsernameError);
      return;
    }

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

    if (usernameStatus === 'checking') {
      setError('Đang kiểm tra tên đăng nhập, vui lòng đợi...');
      return;
    }

    if (usernameStatus === 'taken') {
      setError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác');
      return;
    }

    if (usernameStatus === 'error') {
      setError('Không thể kiểm tra tên đăng nhập, vui lòng thử lại');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Vui lòng chờ kiểm tra username hoàn tất');
      return;
    }

    setCurrentStep(2);
  };

  const checkUsernameAvailability = async (usernameRaw: string) => {
    const username = normalizeUsername(usernameRaw);
    const localUsernameError = validateUsername(username);
    if (localUsernameError) {
      setUsernameStatus('idle');
      setUsernameHint(localUsernameError);
      return;
    }

    setUsernameStatus('checking');
    setUsernameHint('Đang kiểm tra...');

    try {
      const query = new URLSearchParams({ username });
      const res = await fetch(getApiUrl(`/api/auth/register/check-username?${query.toString()}`));
      const data = await res.json();

      if (!res.ok || data?.error) {
        setUsernameStatus('error');
        setUsernameHint(data?.error || 'Không thể kiểm tra username');
        return;
      }

      if (data?.available) {
        setUsernameStatus('available');
        setUsernameHint('Tên đăng nhập có thể sử dụng');
      } else {
        setUsernameStatus('taken');
        setUsernameHint('Tên đăng nhập đã tồn tại');
      }
    } catch {
      setUsernameStatus('error');
      setUsernameHint('Lỗi kết nối khi kiểm tra username');
    }
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

    if (!formData.email) {
      setError('Vui lòng nhập email để nhận mã OTP');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await fetch(getApiUrl('/api/auth/register/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          studentCode: formData.studentCode,
          email: formData.email,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const rawText = await res.text();
      let data: any = {};
      if (contentType.includes('application/json') && rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { error: 'Phản hồi từ máy chủ không hợp lệ' };
        }
      } else if (rawText) {
        data = { error: rawText };
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Đăng ký thất bại');
        return;
      }

      setOtpId(String(data.otpId || ''));
      setOtpCode('');
      setResendIn(Number(data.expiresIn || 300));
      setCurrentStep(3);

      if (data.devOtp) {
        alert(`Mã OTP (môi trường dev): ${data.devOtp}`);
      } else {
        alert('Đã gửi mã OTP, vui lòng kiểm tra email.');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length < 6) {
      setError('Vui lòng nhập mã OTP gồm 6 chữ số');
      return;
    }

    if (!otpId) {
      setError('OTP không hợp lệ. Vui lòng gửi lại mã OTP.');
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          studentCode: formData.studentCode,
          email: formData.email,
          phone: formData.phone,
          otpId,
          otpCode,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const rawText = await res.text();
      let data: any = {};
      if (contentType.includes('application/json') && rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { error: 'Phản hồi từ máy chủ không hợp lệ' };
        }
      } else if (rawText) {
        data = { error: rawText };
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Xác thực OTP thất bại');
        return;
      }

      setCurrentStep(4);
    } catch {
      setError('Lỗi kết nối server');
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || sendingOtp) {
      return;
    }

    setError('');
    try {
      setSendingOtp(true);
      const res = await fetch(getApiUrl('/api/auth/register/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          studentCode: formData.studentCode,
          email: formData.email,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      const rawText = await res.text();
      let data: any = {};
      if (contentType.includes('application/json') && rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { error: 'Phản hồi từ máy chủ không hợp lệ' };
        }
      } else if (rawText) {
        data = { error: rawText };
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Không thể gửi lại OTP');
        return;
      }

      setOtpId(String(data.otpId || ''));
      setResendIn(Number(data.expiresIn || 300));
      if (data.devOtp) {
        alert(`Mã OTP mới (môi trường dev): ${data.devOtp}`);
      } else {
        alert('Đã gửi lại OTP thành công.');
      }
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleBackToStep1 = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleBackToStep2 = () => {
    setError('');
    setCurrentStep(2);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  useEffect(() => {
    if (currentStep !== 3 || resendIn <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendIn((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentStep, resendIn]);

  useEffect(() => {
    if (currentStep !== 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      checkUsernameAvailability(formData.username);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [formData.username, currentStep]);

  useEffect(() => {
    if (currentStep !== 1) return;
    const localUsernameError = validateUsername(formData.username);
    if (localUsernameError) {
      setUsernameStatus('idle');
      setUsernameHint(localUsernameError);
    }
  }, [currentStep, formData.username]);

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
          {currentStep !== 4 && (
            <>
              <div className="mb-8">
                <div className="flex items-center">
                  <div className="flex flex-col items-center min-w-[110px] text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 1 ? 'bg-[#f79421] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      1
                    </div>
                    <span className={`mt-2 text-xs ${currentStep >= 1 ? 'text-[#262262]' : 'text-gray-500'}`}>
                      Tài khoản
                    </span>
                  </div>

                  <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-[#f79421]' : 'bg-gray-200'}`}></div>

                  <div className="flex flex-col items-center min-w-[110px] text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 2 ? 'bg-[#f79421] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      2
                    </div>
                    <span className={`mt-2 text-xs ${currentStep >= 2 ? 'text-[#262262]' : 'text-gray-500'}`}>
                      Thông tin cá nhân
                    </span>
                  </div>

                  <div className={`flex-1 h-0.5 mx-2 ${currentStep >= 3 ? 'bg-[#f79421]' : 'bg-gray-200'}`}></div>

                  <div className="flex flex-col items-center min-w-[110px] text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= 3 ? 'bg-[#f79421] text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      3
                    </div>
                    <span className={`mt-2 text-xs ${currentStep >= 3 ? 'text-[#262262]' : 'text-gray-500'}`}>
                      Xác thực tài khoản
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
                  onChange={(e) => setFormData({...formData, username: normalizeUsername(e.target.value)})}
                  placeholder="Nhập tên đăng nhập"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
                {!!formData.username.trim() && (
                  <p
                    className={`mt-2 text-sm ${
                      usernameStatus === 'available'
                        ? 'text-green-600'
                        : usernameStatus === 'taken' || usernameStatus === 'error'
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {usernameHint}
                  </p>
                )}
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
                disabled={!canSubmitStep1}
                className="w-full bg-[#f79421] hover:bg-[#e68414] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
              >
                {usernameStatus === 'checking' ? 'Đang kiểm tra username...' : 'Tiếp theo'}
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
                  Tiếp theo
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleVerifyOtpSubmit}>
              <div className="mb-4">
                <label htmlFor="otp" className="block mb-2 text-gray-700">
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => setOtpCode(value.replace(/\D/g, '').slice(0, 6))}
                    containerClassName="justify-center"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-12 text-base" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-base" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-base" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-base" />
                      <InputOTPSlot index={4} className="h-12 w-12 text-base" />
                      <InputOTPSlot index={5} className="h-12 w-12 text-base" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="mt-2 text-sm text-gray-500">Mã đã gửi đến email: {formData.email}</p>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : 'Bạn chưa nhận được mã?'}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendIn > 0 || sendingOtp}
                  className="text-sm text-[#262262] disabled:text-gray-400"
                >
                  Gửi lại OTP
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBackToStep2}
                  className="px-6 py-3 text-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={otpCode.length !== 6}
                  className="flex-1 bg-[#f79421] hover:bg-[#e68414] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  Xác nhận OTP
                </button>
              </div>
            </form>
          )}

          {currentStep === 4 && (
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
