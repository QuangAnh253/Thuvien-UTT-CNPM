import { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

interface Book {
  id: string | number;
  bookCode: string;
  title: string;
  author: string;
  imageUrl?: string;
  category: string;
  publisher?: string;
  publishYear?: number;
  totalQty: number;
  availableQty: number;
}

const categories = [
  'Tất cả',
  'Công nghệ thông tin',
  'Kinh tế',
  'Văn học',
  'Khoa học',
  'Lịch sử',
];

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    bookCode: '',
    title: '',
    author: '',
    imageUrl: '',
    category: 'Công nghệ thông tin',
    publisher: '',
    publishYear: new Date().getFullYear(),
    totalQty: 1,
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }
        if (selectedCategory !== 'Tất cả') {
          params.set('category', selectedCategory);
        }

        const query = params.toString();
        const res = await apiFetch(`/api/books${query ? `?${query}` : ''}`);

        if (res?.error) {
          alert(res.error || 'Không thể tải danh sách sách');
          setBooks([]);
          return;
        }

        const bookList = Array.isArray(res) ? res : (res?.books ?? []);
        setBooks(bookList);
      } catch {
        alert('Không thể kết nối tới máy chủ');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredBooks = books;

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFormData = () => {
    setFormData({
      bookCode: '',
      title: '',
      author: '',
      imageUrl: '',
      category: 'Công nghệ thông tin',
      publisher: '',
      publishYear: new Date().getFullYear(),
      totalQty: 1,
    });
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (selectedCategory !== 'Tất cả') {
        params.set('category', selectedCategory);
      }

      const query = params.toString();
      const res = await apiFetch(`/api/books${query ? `?${query}` : ''}`);

      if (res?.error) {
        alert(res.error || 'Không thể tải danh sách sách');
        setBooks([]);
        return;
      }

      const bookList = Array.isArray(res) ? res : (res?.books ?? []);
      setBooks(bookList);
    } catch {
      alert('Không thể kết nối tới máy chủ');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    const method = editingBook ? 'PUT' : 'POST';
    const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books';

    try {
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (res?.error) {
        alert(res.error || 'Không thể lưu thông tin sách');
        return;
      }

      alert(editingBook ? 'Cập nhật thành công' : 'Thêm sách thành công');
      setIsAddModalOpen(false);
      setEditingBook(null);
      resetFormData();
      await fetchBooks();
    } catch {
      alert('Không thể kết nối tới máy chủ');
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBookId) {
      return;
    }

    if (!token) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      const res = await apiFetch(`/api/books/${selectedBookId}`, {
        method: 'DELETE',
      });

      if (res?.error) {
        alert(res.error || 'Không thể xóa sách');
        return;
      }

      setIsDeleteModalOpen(false);
      setSelectedBookId(null);
      await fetchBooks();
    } catch {
      alert('Không thể kết nối tới máy chủ');
    }
  };

  const getStatusColor = (availableQty: number) => {
    const status = availableQty > 0 ? 'available' : 'unavailable';
    return status === 'available'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white';
  };

  return (
    <AdminLayout pageTitle="Quản lý Sách">
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, tác giả, mã sách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white min-w-[200px]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingBook(null);
              resetFormData();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm sách
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã sách</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sách</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tác giả</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Thể loại</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">SL tổng</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">SL còn</th>
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
                {!loading && paginatedBooks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Không có sách phù hợp
                    </td>
                  </tr>
                )}
                {paginatedBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-[#f79421]/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-[#262262]">
                      <Link
                        to={`/admin/books/${book.id}`}
                        className="hover:text-[#f79421] transition-colors"
                      >
                        {book.bookCode}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[#262262]">
                      <Link
                        to={`/admin/books/${book.id}`}
                        className="hover:text-[#f79421] transition-colors"
                      >
                        {book.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{book.author}</td>
                    <td className="px-6 py-4 text-gray-600">{book.category}</td>
                    <td className="px-6 py-4 text-gray-600">{book.totalQty}</td>
                    <td className="px-6 py-4 text-gray-600">{book.availableQty}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                          book.availableQty
                        )}`}
                      >
                        {book.availableQty > 0 ? 'Có sẵn' : 'Hết'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingBook(book);
                            setFormData({
                              bookCode: book.bookCode ?? '',
                              title: book.title ?? '',
                              author: book.author ?? '',
                              imageUrl: book.imageUrl ?? '',
                              category: book.category ?? 'Công nghệ thông tin',
                              publisher: book.publisher ?? '',
                              publishYear: book.publishYear ?? new Date().getFullYear(),
                              totalQty: book.totalQty ?? 1,
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-[#f79421]" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBookId(book.id);
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
                {Math.min(currentPage * itemsPerPage, filteredBooks.length)} trong số{' '}
                {filteredBooks.length} kết quả
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

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-[#262262]">
                {editingBook ? 'Sửa thông tin sách' : 'Thêm sách mới'}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBook(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBook} className="p-6 space-y-4">
              <div>
                <label className="block mb-2 text-gray-700">
                  Mã sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.bookCode}
                  onChange={(e) => setFormData({ ...formData, bookCode: e.target.value })}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                <label className="block mb-2 text-gray-700">URL ảnh bìa</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
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
                  {categories.filter((c) => c !== 'Tất cả').map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
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
                  value={formData.publishYear}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publishYear: Number.isNaN(parseInt(e.target.value, 10))
                        ? new Date().getFullYear()
                        : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalQty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalQty: Number.isNaN(parseInt(e.target.value, 10))
                        ? 1
                        : parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBook(null);
                  }}
                  className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  {editingBook ? 'Cập nhật' : 'Lưu'}
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
              Bạn có chắc chắn muốn xóa sách này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-3 text-[#262262] border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteBook}
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
