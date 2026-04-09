import { useEffect, useState } from 'react';
import { Search, Plus, X, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

interface Reader {
  id: string | number;
  userId: number;
  fullName: string;
  studentId: string;
  currentlyBorrowing: number;
  hasOverdue: boolean;
}

interface Book {
  id: string | number;
  name: string;
  code: string;
  availableQuantity: number;
}

interface SelectedBook {
  id: string | number;
  name: string;
}

interface BorrowRecord {
  id: string | number;
  borrowCode: string;
  readerName: string;
  studentId: string;
  bookCount: number;
  borrowDate: string;
  dueDate: string;
  status: 'active' | 'overdue';
}

interface PendingRequest {
  id: string | number;
  readerName: string;
  studentId: string;
  books: string[];
  requestDate: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getOverdueDaysByDate = (dueDateString: string) => {
  const due = toStartOfDay(new Date(dueDateString));
  const today = toStartOfDay(new Date());
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / MS_PER_DAY));
};

const isSameDate = (a: string, b: string) =>
  toStartOfDay(new Date(a)).getTime() === toStartOfDay(new Date(b)).getTime();

const isPendingLikeBorrow = (borrow: any) =>
  !borrow.returnDate &&
  borrow.status !== 'REJECTED' &&
  (borrow.status === 'PENDING' || (borrow.status === 'BORROWING' && isSameDate(borrow.borrowDate, borrow.dueDate)));

export default function BorrowPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const [borrows, setBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [readerOptions, setReaderOptions] = useState<Reader[]>([]);
  const [bookOptions, setBookOptions] = useState<Book[]>([]);
  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<SelectedBook[]>([]);
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [readerSearch, setReaderSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [showReaderDropdown, setShowReaderDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  const fetchBorrows = async () => {
    setLoading(true);
    const res = await apiFetch('/api/borrow');
    if (res && !res.error) {
      setBorrows(Array.isArray(res) ? res : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBorrows();
  }, []);

  useEffect(() => {
    const fetchReaders = async () => {
      const query = new URLSearchParams();
      if (readerSearch.trim()) {
        query.set('search', readerSearch.trim());
      }

      const res = await apiFetch(`/api/readers?${query.toString()}`);
      if (res && !res.error && Array.isArray(res)) {
        const mappedReaders: Reader[] = res.map((reader: any) => {
          const userBorrows = borrows.filter((b: any) => b.userId === reader.userId);
          const currentlyBorrowing = userBorrows.filter(
            (b: any) => b.status === 'BORROWING' && !b.returnDate && !isPendingLikeBorrow(b)
          ).length;
          const hasOverdue = userBorrows.some(
            (b: any) => !b.returnDate && b.status === 'BORROWING' && getOverdueDaysByDate(b.dueDate) > 0
          );

          return {
            id: reader.id,
            userId: reader.userId,
            fullName: reader.fullName,
            studentId: reader.studentCode,
            currentlyBorrowing,
            hasOverdue,
          };
        });
        setReaderOptions(mappedReaders);
      }
    };

    fetchReaders();
  }, [readerSearch, borrows]);

  useEffect(() => {
    const fetchBooks = async () => {
      const query = new URLSearchParams();
      if (bookSearch.trim()) {
        query.set('search', bookSearch.trim());
      }

      const res = await apiFetch(`/api/books?${query.toString()}`);
      if (res && !res.error && Array.isArray(res)) {
        const mappedBooks: Book[] = res.map((book: any) => ({
          id: book.id,
          name: book.title,
          code: book.bookCode,
          availableQuantity: book.availableQty,
        }));
        setBookOptions(mappedBooks);
      }
    };

    fetchBooks();
  }, [bookSearch]);

  const handleApprove = async (id: number | string) => {
    const res = await apiFetch(`/api/borrow/${id}/approve`, { method: 'PUT' });
    if (res?.error) {
      alert(res.error);
      return;
    }
    alert('Đã duyệt phiếu mượn thành công!');
    fetchBorrows();
  };

  const handleReject = async (id: number | string) => {
    const res = await apiFetch(`/api/borrow/${id}/reject`, { method: 'PUT' });
    if (res?.error) {
      alert(res.error);
      return;
    }

    alert('Đã từ chối phiếu mượn!');
    fetchBorrows();
  };

  const filteredReaders = readerOptions.filter((reader) =>
    reader.fullName.toLowerCase().includes(readerSearch.toLowerCase()) ||
    reader.studentId.toLowerCase().includes(readerSearch.toLowerCase())
  );

  const filteredBooks = bookOptions.filter((book) =>
    book.name.toLowerCase().includes(bookSearch.toLowerCase()) &&
    book.availableQuantity > 0 &&
    !selectedBooks.some((sb) => sb.id === book.id)
  );

  const borrowRecords: BorrowRecord[] = borrows
    .filter((borrow: any) => !isPendingLikeBorrow(borrow) && (borrow.status === 'BORROWING' || borrow.status === 'OVERDUE'))
    .map((borrow: any) => {
      const isOverdue = !borrow.returnDate && getOverdueDaysByDate(borrow.dueDate) > 0;

      return {
        id: borrow.id,
        borrowCode: `PM${String(borrow.id).padStart(3, '0')}`,
        readerName: borrow.user?.student?.fullName || borrow.user?.username || 'N/A',
        studentId: borrow.user?.student?.studentCode || 'N/A',
        bookCount: 1,
        borrowDate: borrow.borrowDate,
        dueDate: borrow.dueDate,
        status: isOverdue ? 'overdue' : 'active',
      };
    });

  const pendingRequests: PendingRequest[] = borrows
    .filter((borrow: any) => isPendingLikeBorrow(borrow))
    .map((borrow: any) => ({
      id: borrow.id,
      readerName: borrow.user?.student?.fullName || borrow.user?.username || 'N/A',
      studentId: borrow.user?.student?.studentCode || 'N/A',
      books: [borrow.book?.title || 'N/A'],
      requestDate: borrow.borrowDate,
    }));

  const handleSelectReader = (reader: Reader) => {
    setSelectedReader(reader);
    setReaderSearch(reader.fullName);
    setShowReaderDropdown(false);
  };

  const handleAddBook = (book: Book) => {
    setSelectedBooks([...selectedBooks, { id: book.id, name: book.name }]);
    setBookSearch('');
    setShowBookDropdown(false);
  };

  const handleRemoveBook = (bookId: string | number) => {
    setSelectedBooks(selectedBooks.filter((book) => book.id !== bookId));
  };

  const handleCreateBorrow = async () => {
    if (!selectedReader || selectedBooks.length === 0 || !dueDate) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const diffDays = Math.ceil(
      (new Date(dueDate).getTime() - new Date(borrowDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const days = diffDays > 0 ? diffDays : 14;

    for (const book of selectedBooks) {
      const res = await apiFetch('/api/borrow', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedReader.userId,
          bookId: Number(book.id),
          days,
        }),
      });

      if (res?.error) {
        alert(res.error);
        return;
      }
    }

    alert('Tạo phiếu mượn thành công!');
    // Reset form
    setSelectedReader(null);
    setSelectedBooks([]);
    setReaderSearch('');
    setBorrowDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    fetchBorrows();
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const openBorrowDetail = (id: string | number) => {
    navigate(`/admin/borrow/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout pageTitle="Tạo Phiếu Mượn">
      <div className="space-y-6">
        {/* Warning Banner */}
        {selectedReader?.hasOverdue && (
          <div className="bg-yellow-50 border-l-4 border-[#f79421] p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#f79421]" />
            <p className="text-sm text-yellow-800">
              Sinh viên đang có sách quá hạn. Vui lòng kiểm tra trước khi cho mượn thêm.
            </p>
          </div>
        )}

        {/* Top Section: 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT - Form Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg text-[#262262] mb-4">Thông tin phiếu mượn</h3>

            {/* Reader Combobox */}
            <div className="relative">
              <label className="block mb-2 text-gray-700 text-sm">
                Tìm độc giả <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nhập tên hoặc mã sinh viên..."
                  value={readerSearch}
                  onChange={(e) => {
                    setReaderSearch(e.target.value);
                    setShowReaderDropdown(true);
                  }}
                  onFocus={() => setShowReaderDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              {showReaderDropdown && readerSearch && filteredReaders.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredReaders.map((reader) => (
                    <button
                      key={reader.id}
                      onClick={() => handleSelectReader(reader)}
                      className="w-full px-4 py-3 text-left hover:bg-[#f79421]/5 transition-colors"
                    >
                      <p className="text-[#262262]">{reader.fullName}</p>
                      <p className="text-sm text-gray-500">{reader.studentId}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Book Combobox */}
            <div className="relative">
              <label className="block mb-2 text-gray-700 text-sm">
                Thêm sách <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm sách..."
                  value={bookSearch}
                  onChange={(e) => {
                    setBookSearch(e.target.value);
                    setShowBookDropdown(true);
                  }}
                  onFocus={() => setShowBookDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>
              {showBookDropdown && bookSearch && filteredBooks.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleAddBook(book)}
                      className="w-full px-4 py-3 text-left hover:bg-[#f79421]/5 transition-colors"
                    >
                      <p className="text-[#262262]">{book.name}</p>
                      <p className="text-sm text-gray-500">Còn: {book.availableQuantity}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-gray-700 text-sm">
                  Ngày mượn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={borrowDate}
                    onChange={(e) => setBorrowDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-2 text-gray-700 text-sm">
                  Hạn trả <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-gray-700 text-sm">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Thêm ghi chú nếu cần..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* RIGHT - Preview Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg text-[#262262] mb-4">Chi tiết phiếu</h3>

            {selectedReader ? (
              <>
                {/* Student Info */}
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 rounded-full bg-[#f79421] text-white flex items-center justify-center text-lg">
                    {getInitial(selectedReader.fullName)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[#262262]">{selectedReader.fullName}</p>
                    <p className="text-sm text-gray-500">{selectedReader.studentId}</p>
                    <p className="text-xs text-gray-500">
                      Đang mượn: {selectedReader.currentlyBorrowing} sách
                    </p>
                  </div>
                </div>

                {/* Selected Books List */}
                <div>
                  <label className="block mb-2 text-gray-700 text-sm">
                    Danh sách sách đã chọn
                  </label>
                  {selectedBooks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBooks.map((book) => (
                        <div
                          key={book.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-[#262262]">{book.name}</span>
                          <button
                            onClick={() => handleRemoveBook(book.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Chưa có sách nào được chọn</p>
                  )}
                </div>

                {/* Total Books Badge */}
                {selectedBooks.length > 0 && (
                  <div className="bg-[#f79421]/10 border border-[#f79421] rounded-lg p-3 text-center">
                    <p className="text-[#f79421]">
                      Tổng số sách: {selectedBooks.length}
                    </p>
                  </div>
                )}

                {/* Create Button */}
                <button
                  onClick={handleCreateBorrow}
                  disabled={selectedBooks.length === 0 || !dueDate}
                  className="w-full px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận Tạo Phiếu
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 italic">Vui lòng chọn độc giả</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-6 py-4 text-sm transition-colors ${
                activeTab === 'active'
                  ? 'text-[#f79421] border-b-2 border-[#f79421] bg-[#f79421]/5'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Đang mượn
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-6 py-4 text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'text-[#f79421] border-b-2 border-[#f79421] bg-[#f79421]/5'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Chờ duyệt
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>
            ) : activeTab === 'active' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã phiếu</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sinh viên</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Số sách</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày mượn</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Hạn trả</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {borrowRecords.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => openBorrowDetail(record.id)}
                        className={`hover:bg-[#f79421]/5 transition-colors ${
                          record.status === 'overdue' ? 'bg-red-50' : ''
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/admin/borrow/${record.id}`}
                            className="text-[#262262] hover:text-[#f79421] transition-colors"
                          >
                            {record.borrowCode}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-[#262262]">{record.readerName}</td>
                        <td className="px-6 py-4 text-gray-600">{record.studentId}</td>
                        <td className="px-6 py-4 text-gray-600">{record.bookCount}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(record.borrowDate)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(record.dueDate)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              record.status === 'overdue'
                                ? 'bg-red-500 text-white'
                                : 'bg-[#262262] text-white'
                            }`}
                          >
                            {record.status === 'overdue' ? 'Quá hạn' : 'Đang mượn'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sinh viên</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Danh sách sách</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Ngày yêu cầu</th>
                      <th className="px-6 py-3 text-left text-gray-600 text-sm">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map((request) => (
                      <tr
                        key={request.id}
                        onClick={() => openBorrowDetail(request.id)}
                        className="hover:bg-[#f79421]/5 transition-colors"
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="px-6 py-4 text-[#262262]">{request.readerName}</td>
                        <td className="px-6 py-4 text-gray-600">{request.studentId}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {request.books.map((book, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                • {book}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(request.requestDate)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(request.id);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors text-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Duyệt
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(request.id);
                              }}
                              className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <XCircle className="w-4 h-4" />
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
