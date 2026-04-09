import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, Key, AlertTriangle, X, Shield } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

interface Staff {
  id: string;
  fullName: string;
  staffId: string;
  position: 'Thủ thư' | 'Quản lý';
  email: string;
  phone: string;
  username: string;
  accountStatus: 'active' | 'locked';
  permissions: string[];
}

const positions = ['Tất cả', 'Thủ thư', 'Quản lý'];

const permissionOptions = [
  { id: 'books', label: 'Quản lý sách' },
  { id: 'readers', label: 'Quản lý độc giả' },
  { id: 'borrow', label: 'Xử lý mượn trả' },
  { id: 'reports', label: 'Báo cáo' },
  { id: 'staff', label: 'Quản lý nhân viên' },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('Tất cả');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    fullName: '',
    staffId: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    position: 'Thủ thư' as 'Thủ thư' | 'Quản lý',
    permissions: [] as string[],
  });

  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const mapApiStaffToUi = (item: any): Staff => {
    const position = String(item.position || '').toLowerCase().includes('manager')
      ? 'Quản lý'
      : 'Thủ thư';
    const accountStatus = item.user?.status === 'locked' ? 'locked' : 'active';
    const permissions =
      item.user?.role === 'admin'
        ? ['books', 'readers', 'borrow', 'reports', 'staff']
        : position === 'Quản lý'
          ? ['books', 'readers', 'borrow', 'reports']
          : ['books', 'readers', 'borrow'];

    return {
      id: String(item.id),
      fullName: item.fullName || '',
      staffId: item.staffCode || `NV${String(item.id).padStart(3, '0')}`,
      position,
      email: item.email || '',
      phone: item.phone || '',
      username: item.user?.username || '',
      accountStatus,
      permissions,
    };
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/staff');
      if (res && !res.error) {
        setStaff(Array.isArray(res) ? res.map(mapApiStaffToUi) : []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách nhân viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition =
      selectedPosition === 'Tất cả' || member.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await apiFetch('/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        role: formData.position === 'Quản lý' ? 'admin' : 'librarian',
        staffId: formData.staffId,
      }),
    });

    if (res?.error) {
      alert(res.error);
      return;
    }

    const createdStaff = res ? mapApiStaffToUi(res) : null;

    if (createdStaff) {
      setStaff((prev) => [createdStaff, ...prev]);
    }

    alert('Thêm nhân viên thành công!');
    await fetchStaff();
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStaffId) {
      const res = await apiFetch(`/api/staff/${selectedStaffId}`, {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formData.fullName,
          staffId: formData.staffId,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          position: formData.position,
        }),
      });

      if (res?.error) {
        alert(res.error);
        return;
      }

      const updatedStaff = res ? mapApiStaffToUi(res) : null;
      if (updatedStaff) {
        setStaff((prev) => prev.map((member) => (member.id === selectedStaffId ? updatedStaff : member)));
      }
      await fetchStaff();
      alert('Cập nhật nhân viên thành công!');
      setIsEditModalOpen(false);
      setSelectedStaffId(null);
      resetForm();
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;

    const res = await apiFetch(`/api/staff/${id}`, { method: 'DELETE' });
    if (res?.error) return alert(res.error);

    alert('Xóa nhân viên thành công!');
    await fetchStaff();
    setIsDeleteModalOpen(false);
    setSelectedStaffId(null);
  };

  const handleResetPassword = async () => {
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!selectedStaffId) return;

    const res = await apiFetch(`/api/staff/${selectedStaffId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword: resetPasswordData.newPassword }),
    });

    if (res?.error) {
      alert(res.error);
      return;
    }

    alert('Đặt lại mật khẩu thành công!');
    setIsResetPasswordModalOpen(false);
    setSelectedStaffId(null);
    setResetPasswordData({ newPassword: '', confirmPassword: '' });
  };

  const openEditModal = (member: Staff) => {
    setSelectedStaffId(member.id);
    setFormData({
      fullName: member.fullName,
      staffId: member.staffId,
      email: member.email,
      phone: member.phone,
      username: member.username,
      password: '',
      position: member.position,
      permissions: member.permissions,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      staffId: '',
      email: '',
      phone: '',
      username: '',
      password: '',
      position: 'Thủ thư',
      permissions: [],
    });
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  const getPositionBadge = (position: string) => {
    return position === 'Thủ thư'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  };

  const togglePermission = (permissionId: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permissionId)
        ? formData.permissions.filter((p) => p !== permissionId)
        : [...formData.permissions, permissionId],
    });
  };

  return (
    <AdminLayout pageTitle="Quản lý Nhân viên">
      <div className="space-y-6">
        {/* Admin Only Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 border border-purple-300 text-purple-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Admin Only
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
            />
          </div>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white min-w-[200px]"
          >
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm nhân viên
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Họ tên</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã NV</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Chức vụ</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Email</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số điện thoại</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Username</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-[#f79421]/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f79421] text-white flex items-center justify-center">
                          {getInitial(member.fullName)}
                        </div>
                        <span className="text-[#262262]">{member.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{member.staffId}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getPositionBadge(
                          member.position
                        )}`}
                      >
                        {member.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{member.email}</td>
                    <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                    <td className="px-6 py-4 text-gray-600">{member.username}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(
                          member.accountStatus
                        )}`}
                      >
                        {member.accountStatus === 'active' ? 'Hoạt động' : 'Khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4 text-[#f79421]" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaffId(member.id);
                            setIsResetPasswordModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Đặt lại mật khẩu"
                        >
                          <Key className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaffId(member.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-gray-600 text-sm">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
                {Math.min(currentPage * itemsPerPage, filteredStaff.length)} trong số{' '}
                {filteredStaff.length} kết quả
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262] text-xl">Thêm nhân viên mới</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-[#262262] mb-4">Thông tin cá nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h3 className="text-[#262262] mb-4">Tài khoản</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Position */}
              <div>
                <h3 className="text-[#262262] mb-4">Chức vụ</h3>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: e.target.value as 'Thủ thư' | 'Quản lý',
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                >
                  <option value="Thủ thư">Thủ thư</option>
                  <option value="Quản lý">Quản lý</option>
                </select>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-[#262262] mb-4">Phân quyền</h3>
                <div className="space-y-2">
                  {permissionOptions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="w-4 h-4 text-[#f79421] focus:ring-[#f79421] rounded"
                      />
                      <span className="text-[#262262]">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262] text-xl">Chỉnh sửa nhân viên</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedStaffId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditStaff} className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-[#262262] mb-4">Thông tin cá nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.staffId}
                      onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-gray-700 text-sm">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h3 className="text-[#262262] mb-4">Tài khoản</h3>
                <div>
                  <label className="block mb-2 text-gray-700 text-sm">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Position */}
              <div>
                <h3 className="text-[#262262] mb-4">Chức vụ</h3>
                <select
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position: e.target.value as 'Thủ thư' | 'Quản lý',
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                >
                  <option value="Thủ thư">Thủ thư</option>
                  <option value="Quản lý">Quản lý</option>
                </select>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-[#262262] mb-4">Phân quyền</h3>
                <div className="space-y-2">
                  {permissionOptions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="w-4 h-4 text-[#f79421] focus:ring-[#f79421] rounded"
                      />
                      <span className="text-[#262262]">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedStaffId(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-3 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262] text-xl">Đặt lại mật khẩu</h2>
              <button
                onClick={() => {
                  setIsResetPasswordModalOpen(false);
                  setSelectedStaffId(null);
                  setResetPasswordData({ newPassword: '', confirmPassword: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-gray-700 text-sm">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={resetPasswordData.newPassword}
                  onChange={(e) =>
                    setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 text-sm">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setSelectedStaffId(null);
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-6 py-3 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    void handleResetPassword();
                  }}
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-[#262262] text-center mb-2">Xác nhận xóa nhân viên</h2>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedStaffId(null);
                }}
                className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (selectedStaffId) {
                    void handleDeleteStaff(Number(selectedStaffId));
                  }
                }}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
