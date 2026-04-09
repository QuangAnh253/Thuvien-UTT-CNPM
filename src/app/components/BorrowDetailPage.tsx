import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Calendar, Clock, BookOpen, User, FileText } from 'lucide-react';
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

interface BorrowDetail {
  id: string;
  borrowCode: string;
  readerName: string;
  studentId: string;
  readerId: string;
  readerType: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  books: {
    id: string;
    name: string;
    code: string;
    status: 'borrowed' | 'returned' | 'pending';
  }[];
  notes: string;
  status: 'active' | 'overdue' | 'returned' | 'pending';
  overdueDays: number;
  fine: number;
}

export default function BorrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [borrow, setBorrow] = useState<BorrowDetail | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBorrowDetail = async () => {
      if (!id) {
        setBorrow(undefined);
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await apiFetch(`/api/borrow/${id}`);

      if (res?.error || !res) {
        setBorrow(undefined);
        setLoading(false);
        return;
      }

      const isPending =
        !res.returnDate &&
        (res.status === 'PENDING' ||
          toStartOfDay(new Date(res.borrowDate)).getTime() ===
            toStartOfDay(new Date(res.dueDate)).getTime());
      const calculatedOverdueDays = getOverdueDaysByDate(res.dueDate);
      const isOverdue = !isPending && !res.returnDate && calculatedOverdueDays > 0;
      const overdueDays = isOverdue ? calculatedOverdueDays : 0;

      const mapped: BorrowDetail = {
        id: String(res.id),
        borrowCode: `PM${String(res.id).padStart(3, '0')}`,
        readerName: res.user?.student?.fullName || res.user?.username || 'N/A',
        studentId: res.user?.student?.studentCode || 'N/A',
        readerId: String(res.user?.student?.id || ''),
        readerType: 'Sinh viên',
        borrowDate: res.borrowDate,
        dueDate: res.dueDate,
        returnDate: res.returnDate || null,
        books: [
          {
            id: String(res.book?.id || ''),
            name: res.book?.title || 'N/A',
            code: res.book?.bookCode || 'N/A',
            status: res.returnDate || res.status === 'RETURNED' ? 'returned' : isPending ? 'pending' : 'borrowed',
          },
        ],
        notes: '',
        status: res.returnDate || res.status === 'RETURNED' ? 'returned' : isPending ? 'pending' : isOverdue ? 'overdue' : 'active',
        overdueDays,
        fine: Math.max(0, overdueDays * 5000),
      };

      setBorrow(mapped);
      setLoading(false);
    };

    fetchBorrowDetail();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout pageTitle="Chi tiết phiếu mượn">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Đang tải thông tin phiếu mượn...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!borrow) {
    return (
      <AdminLayout pageTitle="Chi tiết phiếu mượn">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">Không tìm thấy thông tin phiếu mượn</p>
        </div>
      </AdminLayout>
    );
  }

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#262262] text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      case 'returned':
        return 'bg-green-500 text-white';
      case 'pending':
        return 'bg-[#f79421] text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang mượn';
      case 'overdue':
        return 'Quá hạn';
      case 'returned':
        return 'Đã trả';
      case 'pending':
        return 'Chờ duyệt';
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

  return (
    <AdminLayout pageTitle="Chi tiết phiếu mượn">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/admin/borrow" className="hover:text-[#f79421] transition-colors">
            Mượn sách
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#262262]">{borrow.borrowCode}</span>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#f79421] text-white flex items-center justify-center text-2xl">
                {getInitial(borrow.readerName)}
              </div>
              <div>
                <h2 className="text-2xl text-[#262262]">{borrow.borrowCode}</h2>
                <p className="text-gray-600">
                  {borrow.readerName} ({borrow.studentId})
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-lg text-sm ${getStatusStyle(borrow.status)}`}
            >
              {getStatusText(borrow.status)}
            </span>
          </div>

          {borrow.status === 'overdue' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-800">
                  Quá hạn {borrow.overdueDays} ngày • Tiền phạt: {formatCurrency(borrow.fine)} VND
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {/* Reader Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[#f79421]" />
                <h3 className="text-lg text-[#262262]">Thông tin độc giả</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Họ tên</p>
                  <Link
                    to={`/admin/readers/${borrow.readerId}`}
                    className="text-sm text-[#262262] hover:text-[#f79421] transition-colors"
                  >
                    {borrow.readerName}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mã sinh viên</p>
                  <p className="text-sm text-[#262262]">{borrow.studentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Loại độc giả</p>
                  <p className="text-sm text-[#262262]">{borrow.readerType}</p>
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-[#f79421]" />
                <h3 className="text-lg text-[#262262]">Thời gian</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Ngày mượn</p>
                  <p className="text-sm text-[#262262]">{formatDate(borrow.borrowDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hạn trả</p>
                  <p className="text-sm text-[#262262]">{formatDate(borrow.dueDate)}</p>
                </div>
                {borrow.returnDate && (
                  <div>
                    <p className="text-xs text-gray-500">Ngày trả</p>
                    <p className="text-sm text-[#262262]">{formatDate(borrow.returnDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Card */}
            {borrow.notes && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#f79421]" />
                  <h3 className="text-lg text-[#262262]">Ghi chú</h3>
                </div>
                <p className="text-sm text-gray-600">{borrow.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Books List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#f79421]" />
                  <h3 className="text-lg text-[#262262]">Danh sách sách ({borrow.books.length})</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {borrow.books.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#f79421]/5 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <Link
                          to={`/admin/books/${book.id}`}
                          className="text-[#262262] hover:text-[#f79421] transition-colors"
                        >
                          {book.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{book.code}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          book.status === 'borrowed'
                            ? 'bg-[#262262] text-white'
                            : book.status === 'pending'
                              ? 'bg-[#f79421] text-white'
                              : 'bg-green-500 text-white'
                        }`}
                      >
                        {book.status === 'borrowed' ? 'Đang mượn' : book.status === 'pending' ? 'Chờ duyệt' : 'Đã trả'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
