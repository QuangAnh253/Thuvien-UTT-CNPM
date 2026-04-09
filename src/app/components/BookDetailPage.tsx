import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Pencil, Trash2, AlertTriangle, Plus, Minus, BookOpen, Users, Package, X } from 'lucide-react';
import AdminLayout from './AdminLayout';

interface BorrowHistory {
  id: string;
  studentName: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'borrowed' | 'overdue' | 'returned';
}

const mockBook = {
  id: '1',
  code: 'BK001',
  name: 'Lập trình Java cơ bản',
  author: 'Nguyễn Văn A',
  category: 'Công nghệ thông tin',
  publisher: 'NXB Giáo dục',
  year: 2023,
  description: 'Cuốn sách cung cấp kiến thức nền tảng về lập trình Java, bao gồm cú pháp cơ bản, lập trình hướng đối tượng, xử lý ngoại lệ, và các khái niệm quan trọng khác. Phù hợp cho sinh viên mới bắt đầu học lập trình.',
  totalQuantity: 50,
  borrowedQuantity: 15,
  availableQuantity: 35,
};

const mockBorrowHistory: BorrowHistory[] = [
  {
    id: '1',
    studentName: 'Trần Văn B',
    studentId: 'SV001',
    borrowDate: '01/04/2026',
    dueDate: '15/04/2026',
    returnDate: null,
    status: 'borrowed',
  },
  {
    id: '2',
    studentName: 'Lê Thị C',
    studentId: 'SV002',
    borrowDate: '28/03/2026',
    dueDate: '05/04/2026',
    returnDate: null,
    status: 'overdue',
  },
  {
    id: '3',
    studentName: 'Phạm Văn D',
    studentId: 'SV003',
    borrowDate: '25/03/2026',
    dueDate: '08/04/2026',
    returnDate: '06/04/2026',
    status: 'returned',
  },
  {
    id: '4',
    studentName: 'Hoàng Thị E',
    studentId: 'SV004',
    borrowDate: '20/03/2026',
    dueDate: '03/04/2026',
    returnDate: '02/04/2026',
    status: 'returned',
  },
];

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(mockBook);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: mockBook.code,
    name: mockBook.name,
    author: mockBook.author,
    category: mockBook.category,
    publisher: mockBook.publisher,
    year: mockBook.year,
    description: mockBook.description,
  });

  const handleQuantityChange = (field: 'totalQuantity', delta: number) => {
    setBook((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  const handleEditBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBook((prev) => ({
      ...prev,
      ...formData,
    }));
    setIsEditModalOpen(false);
  };

  const openEditModal = () => {
    setFormData({
      code: book.code,
      name: book.name,
      author: book.author,
      category: book.category,
      publisher: book.publisher,
      year: book.year,
      description: book.description,
    });
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'borrowed':
        return 'bg-[#262262] text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'returned':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'borrowed':
        return 'Đang mượn';
      case 'overdue':
        return 'Quá hạn';
      case 'returned':
        return 'Đã trả';
      default:
        return status;
    }
  };

  return (
    <AdminLayout pageTitle="Chi tiết sách">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/admin/books" className="hover:text-[#f79421] transition-colors">
            Sách
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#262262]">Chi tiết</span>
        </div>

        {/* Top Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
            {/* Book Cover */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-40 h-56 bg-gradient-to-br from-[#f79421]/20 to-[#262262]/20 rounded-lg flex items-center justify-center border border-gray-200">
                <BookOpen className="w-16 h-16 text-gray-400" />
              </div>
            </div>

            {/* Book Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-[#262262] mb-2">{book.name}</h2>
                  <p className="text-gray-600 mb-3">Tác giả: {book.author}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-[#f79421]/10 text-[#f79421] rounded-full text-sm">
                      {book.category}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      <span className="text-gray-500">Nhà xuất bản:</span> {book.publisher}
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-500">Năm xuất bản:</span> {book.year}
                    </p>
                    <p className="text-gray-600">
                      <span className="text-gray-500">Mã sách:</span> {book.code}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-4 py-2 border border-[#262262] text-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Sửa
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-[#262262] text-sm mb-2">Mô tả</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{book.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421]/30 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-[#f79421]" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange('totalQuantity', -1)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleQuantityChange('totalQuantity', 1)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Tổng số lượng</p>
            <p className="text-[#262262]">{book.totalQuantity}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#262262]" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Đang mượn</p>
            <p className="text-[#262262]">{book.borrowedQuantity}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Có sẵn</p>
            <p className="text-[#262262]">{book.availableQuantity}</p>
          </div>
        </div>

        {/* Borrow History Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-[#262262]">Lịch sử mượn</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sinh viên</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày mượn</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Hạn trả</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày trả</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockBorrowHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f79421]/5 transition-colors">
                    <td className="px-6 py-4 text-[#262262]">{item.studentName}</td>
                    <td className="px-6 py-4 text-gray-600">{item.studentId}</td>
                    <td className="px-6 py-4 text-gray-600">{item.borrowDate}</td>
                    <td className="px-6 py-4 text-gray-600">{item.dueDate}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.returnDate || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Book Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262]">Chỉnh sửa sách</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditBook} className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-gray-700">
                  Mã sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Tên sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Thể loại <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                >
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                  <option value="Kinh tế">Kinh tế</option>
                  <option value="Văn học">Văn học</option>
                  <option value="Khoa học">Khoa học</option>
                  <option value="Lịch sử">Lịch sử</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Nhà xuất bản</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Năm xuất bản</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                />
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

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <h2 className="text-[#262262] text-center mb-2">Xác nhận xóa sách</h2>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn xóa sách "{book.name}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  window.location.href = '/admin/books';
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
