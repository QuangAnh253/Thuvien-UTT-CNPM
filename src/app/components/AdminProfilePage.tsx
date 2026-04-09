import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

export default function AdminProfilePage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    apiFetch('/api/staff/me').then((res) => {
      if (res.data) {
        setFullName(res.data.fullName || '');
        setEmail(res.data.email || '');
        setPhone(res.data.phone || '');
        setAddress(res.data.address || '');
      }
    });
  }, []);

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleSaveProfile = async () => {
    const res = await apiFetch('/api/staff/me', {
      method: 'PUT',
      body: JSON.stringify({ fullName, email, phone, address }),
    });
    alert(res.error ? res.error : 'Thông tin đã được cập nhật!');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu không khớp!');
      return;
    }

    const res = await apiFetch('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.error) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    alert(res.error || 'Đã đổi mật khẩu!');
  };

  return (
    <AdminLayout pageTitle="Hồ sơ Quản trị viên">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            {/* Avatar */}
            <div className="w-32 h-32 mx-auto mb-4 bg-[#f79421] rounded-full flex items-center justify-center">
              <span className="text-5xl text-white">{getInitial(fullName)}</span>
            </div>

            {/* Name and Role */}
            <h2 className="text-2xl text-[#262262] mb-1">{fullName}</h2>
            <p className="text-gray-600 mb-4">Quản trị viên</p>

            {/* Account Status */}
            <div className="mb-6">
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                Hoạt động
              </span>
            </div>

            {/* Join Date */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Ngày tham gia</p>
              <p className="text-[#262262] font-semibold">01/01/2023</p>
            </div>
          </div>
        </div>

        {/* Right - Editable Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl text-[#262262] mb-6">Thông tin cá nhân</h3>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <User className="w-4 h-4 inline mr-2" />
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Địa chỉ
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                className="w-full py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
              >
                Lưu thông tin
              </button>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl text-[#262262] mb-6">Đổi mật khẩu</h3>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-600">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

              {/* Change Password Button */}
              <button
                onClick={handleChangePassword}
                className="w-full py-3 bg-[#f79421] text-white rounded-lg hover:bg-[#e67d0f] transition-colors font-semibold"
              >
                Cập nhật mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
