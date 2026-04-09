import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, BookOpen, Clock, AlertCircle, DollarSign, Pencil, Lock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getOverdueDaysByDate = (dueDateString: string) => {
  const due = toStartOfDay(new Date(dueDateString));
  const today = toStartOfDay(new Date());
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / MS_PER_DAY));
};

interface BorrowHistory {
  id: string;
  borrowCode: string;
  bookName: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  fine: number;
  status: 'borrowing' | 'overdue' | 'returned';
}

interface ReaderDetail {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  readerType: 'Sinh viên' | 'Giảng viên';
  accountStatus: 'active' | 'locked';
  totalBorrowed: number;
  currentlyBorrowing: number;
  overdue: number;
  totalFines: number;
  borrowHistory: BorrowHistory[];
}

export default function ReaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [reader, setReader] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    readerType: 'Sinh viên' as 'Sinh viên' | 'Giảng viên',
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchReaderDetail = async () => {
      try {
        const res = await apiFetch(`/api/readers/${id}`);
        if (res && !res.error) {
          setReader(res);
        } else {
          setReader(null);
        }
      } catch (error) {
        console.error('Lỗi fetch chi tiết độc giả:', error);
        setReader(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReaderDetail();
  }, [id]);

  const openEditModal = () => {
    if (!reader) return;

    setFormData({
      fullName: reader.fullName || '',
      email: reader.email || '',
      phone: reader.phone || '',
      address: reader.address || '',
      readerType: reader.readerType || 'Sinh viên',
    });
    setIsEditModalOpen(true);
  };

  const handleEditReader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    const res = await apiFetch(`/api/readers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        readerType: formData.readerType,
      }),
    });

    if (res?.error) {
      alert(res.error);
      return;
    }

    const refresh = await apiFetch(`/api/readers/${id}`);
    if (refresh && !refresh.error) {
      setReader(refresh);
    }

    alert('Cập nhật độc giả thành công!');
    setIsEditModalOpen(false);
  };

  const handleToggleStatus = async () => {
    if (!reader || !id) return;

    const newStatus = accountStatus === 'active' ? 'locked' : 'active';
    const res = await apiFetch(`/api/readers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.error) {
      const refresh = async () => {
        const next = await apiFetch(`/api/readers/${id}`);
        if (next && !next.error) setReader(next);
      };
      refresh();
    }
  };

  if (loading)
    return (
      <AdminLayout pageTitle="Chi tiết độc giả">
        <p className="p-8 text-gray-500">Đang tải...</p>
      </AdminLayout>
    );

  if (!reader)
    return (
      <AdminLayout pageTitle="Chi tiết độc giả">
        <p className="p-8 text-gray-600">Không tìm thấy độc giả</p>
      </AdminLayout>
    );

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  const getReaderTypeBadge = (type: string) => {
    return type === 'Sinh viên'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  };

  const getBorrowStatusStyle = (status: string) => {
    switch (status) {
      case 'borrowing':
        return 'bg-[#262262] text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'returned':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getBorrowStatusText = (status: string) => {
    switch (status) {
      case 'borrowing':
        return 'Đang mượn';
      case 'overdue':
        return 'Quá hạn';
      case 'returned':
        return 'Đã trả';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const borrowHistory = reader?.user?.borrows || [];
  const currentlyBorrowing = borrowHistory.filter((b: any) => !b.returnDate).length;
  const overdueCount = borrowHistory.filter(
    (b: any) => !b.returnDate && b.status === 'BORROWING' && getOverdueDaysByDate(b.dueDate) > 0
  ).length;
  const totalFines = borrowHistory.reduce(
    (sum: number, item: any) => sum + Math.max(0, Number(item.fine || 0)),
    0
  );
  const accountStatus = reader?.user?.status === 'locked' ? 'locked' : 'active';

  return (
    <AdminLayout pageTitle="Chi tiết độc giả">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/admin/readers" className="hover:text-[#f79421] transition-colors">
            Độc giả
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#262262]">{reader.fullName}</span>
        </div>

        {/* Main Layout: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-[#f79421] text-white flex items-center justify-center text-3xl">
                  {getInitial(reader.fullName)}
                </div>
              </div>

              {/* Info */}
              <div className="text-center space-y-2">
                <h2 className="text-xl text-[#262262]">{reader.fullName}</h2>
                <p className="text-gray-600">{reader.studentId}</p>
                <div className="flex justify-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getReaderTypeBadge(
                      reader.readerType
                    )}`}
                  >
                    {reader.readerType}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(
                      accountStatus
                    )}`}
                  >
                    {accountStatus === 'active' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
              </div>

              {/* Borrowing Status Chip */}
              <div className="bg-[#f79421]/10 border border-[#f79421] rounded-lg p-3 text-center">
                <p className="text-[#f79421] text-sm">
                  Đang mượn {currentlyBorrowing} sách
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-[#262262]">{reader.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Số điện thoại</p>
                  <p className="text-sm text-[#262262]">{reader.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ngày sinh</p>
                  <p className="text-sm text-[#262262]">{formatDate(reader.dob || reader.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Địa chỉ</p>
                  <p className="text-sm text-[#262262]">{reader.address}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Sửa thông tin
                </button>
                <button
                  onClick={handleToggleStatus}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  {accountStatus === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Borrowed */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#f79421] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-[#f79421]" />
                </div>
                <p className="text-2xl text-[#262262] mb-1">{borrowHistory.length}</p>
                <p className="text-xs text-gray-600">Tổng mượn</p>
              </div>

              {/* Currently Borrowing */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#f79421] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-[#f79421]" />
                </div>
                <p className="text-2xl text-[#262262] mb-1">{currentlyBorrowing}</p>
                <p className="text-xs text-gray-600">Đang mượn</p>
              </div>

              {/* Overdue */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#f79421] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-[#f79421]" />
                </div>
                <p className="text-2xl text-red-500 mb-1">{overdueCount}</p>
                <p className="text-xs text-gray-600">Quá hạn</p>
              </div>

              {/* Total Fines */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#f79421] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-[#f79421]" />
                </div>
                <p className="text-2xl text-[#262262] mb-1">{formatCurrency(totalFines)}</p>
                <p className="text-xs text-gray-600">Tiền phạt (VND)</p>
              </div>
            </div>

            {/* Borrow History Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg text-[#262262]">Lịch sử mượn</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã phiếu</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sách</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày mượn</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Hạn trả</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày trả</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Phạt (VND)</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {borrowHistory.map((record: any) => (
                      <tr
                        key={record.id}
                        className={`hover:bg-[#f79421]/5 transition-colors ${
                          record.status === 'overdue' ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-[#262262]">{record.borrowCode}</td>
                        <td className="px-6 py-4 text-[#262262]">{record.bookName}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(record.borrowDate)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(record.dueDate)}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.returnDate ? formatDate(record.returnDate) : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {record.fine > 0 ? formatCurrency(record.fine) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${getBorrowStatusStyle(
                              record.status
                            )}`}
                          >
                            {getBorrowStatusText(record.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262]">Chỉnh sửa độc giả</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="sr-only">Đóng</span>
                ×
              </button>
            </div>
            <form onSubmit={handleEditReader} className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-gray-700">
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
                <label className="block mb-2 text-gray-700">
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
                <label className="block mb-2 text-gray-700">
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
              <div>
                <label className="block mb-2 text-gray-700">Địa chỉ</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Loại độc giả <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.readerType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      readerType: e.target.value as 'Sinh viên' | 'Giảng viên',
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                >
                  <option value="Sinh viên">Sinh viên</option>
                  <option value="Giảng viên">Giảng viên</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
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
    </AdminLayout>
  );
}
