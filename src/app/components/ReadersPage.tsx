import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

interface Reader {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  readerType: 'Sinh viên' | 'Giảng viên';
  borrowedBooks: number;
  accountStatus: 'active' | 'locked';
  user?: {
    status?: 'active' | 'locked';
  };
}

const mockReaders: Reader[] = [
  {
    id: '1',
    fullName: 'Nguyễn Văn An',
    studentId: 'SV001',
    email: 'an.nguyen@university.edu.vn',
    phone: '0912345678',
    dateOfBirth: '2003-05-15',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    readerType: 'Sinh viên',
    borrowedBooks: 3,
    accountStatus: 'active',
  },
  {
    id: '2',
    fullName: 'Trần Thị Bảo',
    studentId: 'SV002',
    email: 'bao.tran@university.edu.vn',
    phone: '0923456789',
    dateOfBirth: '2003-08-20',
    address: '456 Lê Lợi, Q1, TP.HCM',
    readerType: 'Sinh viên',
    borrowedBooks: 2,
    accountStatus: 'active',
  },
  {
    id: '3',
    fullName: 'Lê Minh Châu',
    studentId: 'SV003',
    email: 'chau.le@university.edu.vn',
    phone: '0934567890',
    dateOfBirth: '2002-11-10',
    address: '789 Trần Hưng Đạo, Q5, TP.HCM',
    readerType: 'Sinh viên',
    borrowedBooks: 0,
    accountStatus: 'locked',
  },
  {
    id: '4',
    fullName: 'TS. Phạm Văn Dũng',
    studentId: 'GV001',
    email: 'dung.pham@university.edu.vn',
    phone: '0945678901',
    dateOfBirth: '1985-03-25',
    address: '321 Nguyễn Thị Minh Khai, Q3, TP.HCM',
    readerType: 'Giảng viên',
    borrowedBooks: 5,
    accountStatus: 'active',
  },
  {
    id: '5',
    fullName: 'Hoàng Thu Eya',
    studentId: 'SV004',
    email: 'eya.hoang@university.edu.vn',
    phone: '0956789012',
    dateOfBirth: '2003-07-18',
    address: '654 Điện Biên Phủ, Q10, TP.HCM',
    readerType: 'Sinh viên',
    borrowedBooks: 1,
    accountStatus: 'active',
  },
];

const readerTypes = ['Tất cả', 'Sinh viên', 'Giảng viên'];

export default function ReadersPage() {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReaderType, setSelectedReaderType] = useState('Tất cả');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReaderId, setSelectedReaderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    readerType: 'Sinh viên' as 'Sinh viên' | 'Giảng viên',
  });

  useEffect(() => {
    const fetchReaders = async () => {
      setLoading(true);
      const query = new URLSearchParams();
      if (searchQuery.trim()) {
        query.set('search', searchQuery.trim());
      }

      const res = await apiFetch(`/api/readers?${query.toString()}`);
      if (res && !res.error) {
        setReaders(Array.isArray(res) ? res : []);
      } else {
        setReaders([]);
      }
      setLoading(false);
    };
    fetchReaders();
  }, [searchQuery]);

  const filteredReaders = readers.filter((reader) => {
    const matchesSearch =
      reader.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reader.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reader.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedReaderType === 'Tất cả' || reader.readerType === selectedReaderType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredReaders.length / itemsPerPage);
  const paginatedReaders = filteredReaders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddReader = (e: React.FormEvent) => {
    e.preventDefault();
    const newReader: Reader = {
      id: String(readers.length + 1),
      fullName: formData.fullName,
      studentId: formData.studentId,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      readerType: formData.readerType,
      borrowedBooks: 0,
      accountStatus: 'active',
    };
    setReaders([...readers, newReader]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditReader = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReaderId) {
      setReaders(
        readers.map((reader) =>
          reader.id === selectedReaderId
            ? {
                ...reader,
                fullName: formData.fullName,
                studentId: formData.studentId,
                email: formData.email,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                address: formData.address,
                readerType: formData.readerType,
              }
            : reader
        )
      );
      setIsEditModalOpen(false);
      setSelectedReaderId(null);
      resetForm();
    }
  };

  const handleDeleteReader = () => {
    if (selectedReaderId) {
      setReaders(readers.filter((reader) => reader.id !== selectedReaderId));
      setIsDeleteModalOpen(false);
      setSelectedReaderId(null);
    }
  };

  const openEditModal = (reader: Reader) => {
    setSelectedReaderId(reader.id);
    setFormData({
      fullName: reader.fullName,
      studentId: reader.studentId,
      dateOfBirth: reader.dateOfBirth,
      email: reader.email,
      phone: reader.phone,
      address: reader.address,
      readerType: reader.readerType,
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      studentId: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      address: '',
      readerType: 'Sinh viên',
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

  const getReaderTypeBadge = (type: string) => {
    return type === 'Sinh viên'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  };

  return (
    <AdminLayout pageTitle="Quản lý Độc giả">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã SV, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
            />
          </div>
          <select
            value={selectedReaderType}
            onChange={(e) => setSelectedReaderType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white min-w-[200px]"
          >
            {readerTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm độc giả
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Họ tên</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Email</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số điện thoại</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Loại độc giả</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số sách mượn</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}
                {paginatedReaders.map((reader) => (
                  <tr
                    key={reader.id}
                    onClick={() => window.location.href = `/admin/readers/${reader.id}`}
                    className="hover:bg-[#f79421]/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f79421] text-white flex items-center justify-center">
                          {getInitial(reader.fullName)}
                        </div>
                        <span className="text-[#262262]">{reader.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{reader.studentId}</td>
                    <td className="px-6 py-4 text-gray-600">{reader.email}</td>
                    <td className="px-6 py-4 text-gray-600">{reader.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getReaderTypeBadge(
                          reader.readerType
                        )}`}
                      >
                        {reader.readerType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{reader.borrowedBooks}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(
                          reader.user?.status || reader.accountStatus
                        )}`}
                      >
                        {(reader.user?.status || reader.accountStatus) === 'active'
                          ? 'Hoạt động'
                          : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/readers/${reader.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReaderId(reader.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                {Math.min(currentPage * itemsPerPage, filteredReaders.length)} trong số{' '}
                {filteredReaders.length} kết quả
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

      {/* Add Reader Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262]">Thêm độc giả mới</h2>
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
            <form onSubmit={handleAddReader} className="p-6 space-y-4">
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
                  Mã sinh viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
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

      {/* Edit Reader Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262]">Chỉnh sửa độc giả</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedReaderId(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
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
                  Mã sinh viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedReaderId(null);
                    resetForm();
                  }}
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-[#262262] text-center mb-2">Xác nhận xóa độc giả</h2>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn xóa độc giả này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedReaderId(null);
                }}
                className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteReader}
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
