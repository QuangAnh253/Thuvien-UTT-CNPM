import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getApiUrl } from '../lib/auth';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

type Step = 1 | 2 | 3 | 4;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  if (contentType.includes('application/json') && rawText) {
    try {
      return JSON.parse(rawText);
    } catch {
      return { error: 'Phản hồi từ máy chủ không hợp lệ' };
    }
  }

  return rawText ? { error: rawText } : {};
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [resetId, setResetId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });

  const canSendOtp = isValidEmail(normalizeEmail(formData.email));

  const resetFlowState = () => {
    setError('');
    setLoading(false);
    setResendIn(0);
    setResetId('');
    setMaskedEmail('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData({
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    });
    setCurrentStep(1);
  };

  const requestOtp = async () => {
    const email = normalizeEmail(formData.email);

    if (!email || !isValidEmail(email)) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'email',
          email,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok || data.error) {
        setError(data.error || 'Không thể gửi OTP');
        return;
      }

      setResetId(String(data.resetId || ''));
      setMaskedEmail(String(data.maskedEmail || email));
      setFormData((prev) => ({ ...prev, otpCode: '' }));
      setResendIn(Number(data.expiresIn || 300));
      setCurrentStep(2);

      if (data.devOtp) {
        alert(`Mã OTP (môi trường dev): ${data.devOtp}`);
      } else {
        alert('Đã gửi OTP đặt lại mật khẩu, vui lòng kiểm tra email.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep !== 2 || resendIn <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendIn((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [currentStep, resendIn]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    await requestOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetId) {
      setError('Phiên OTP không hợp lệ. Vui lòng gửi lại OTP.');
      return;
    }

    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setError('Vui lòng nhập mã OTP gồm 6 chữ số');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetId,
          otpCode: formData.otpCode,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok || data.error) {
        setError(data.error || 'Xác thực OTP thất bại');
        return;
      }

      setCurrentStep(3);
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resetId) {
      setError('Phiên đặt lại mật khẩu không hợp lệ. Vui lòng gửi lại OTP.');
      return;
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/auth/forgot-password/confirm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetId,
          newPassword: formData.newPassword,
        }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok || data.error) {
        setError(data.error || 'Không thể đặt lại mật khẩu');
        return;
      }

      setCurrentStep(4);
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || loading || currentStep !== 2) return;
    setError('');
    await requestOtp();
  };

  const handleBackToStep1 = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleBackToStep2 = () => {
    setError('');
    setCurrentStep(2);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-[480px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 mb-4">
            <img
              src="/LogoUTT_square_blue.png"
              alt="UTT Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-[#262262]">Quên mật khẩu</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {currentStep !== 3 && (
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
                      Email
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
                      Xác thực OTP
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
                      Mật khẩu mới
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </>
          )}

          {currentStep === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="mb-6">
                <label htmlFor="email" className="block mb-2 text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@utt.edu.vn"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu.
                </p>
              </div>

              <button
                type="submit"
                disabled={!canSendOtp || loading}
                className="w-full bg-[#f79421] hover:bg-[#e68414] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
              >
                {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
              </button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-[#f79421] hover:text-[#e68414] hover:underline text-sm">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}

          {currentStep === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="mb-4">
                <label htmlFor="otp" className="block mb-2 text-gray-700">
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.otpCode}
                    onChange={(value) => setFormData((prev) => ({ ...prev, otpCode: value.replace(/\D/g, '').slice(0, 6) }))}
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
                <p className="mt-2 text-sm text-gray-500 text-center">Mã OTP đã gửi đến: {maskedEmail || formData.email}</p>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : 'Bạn chưa nhận được mã?'}
                </span>
                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={resendIn > 0 || loading}
                  className="text-sm text-[#262262] disabled:text-gray-400"
                >
                  Gửi lại OTP
                </button>
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
                  disabled={formData.otpCode.length !== 6 || loading}
                  className="flex-1 bg-[#f79421] hover:bg-[#e68414] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
                </button>
              </div>
            </form>
          )}

          {currentStep === 3 && (
            <form onSubmit={handleConfirmPassword}>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block mb-2 text-gray-700">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Nhập mật khẩu mới"
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
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
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

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 mb-6">
                Email xác thực: <span className="font-semibold">{maskedEmail || formData.email}</span>
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
                  disabled={loading}
                  className="flex-1 bg-[#f79421] hover:bg-[#e68414] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </form>
          )}

          {currentStep === 4 && (
            <div className="mt-8 text-center py-6">
              <div className="mb-4 flex justify-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-[#262262] mb-2">Đặt lại mật khẩu thành công!</h2>
              <p className="text-gray-600">Bạn có thể đăng nhập lại bằng mật khẩu mới.</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-6 w-full bg-[#f79421] hover:bg-[#e68414] text-white py-3 rounded-lg transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
