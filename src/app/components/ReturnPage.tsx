import { useEffect, useState } from 'react';
import { Search, X, CheckCircle, Printer } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

interface BorrowRecord {
  id: string;
  borrowCode: string;
  readerName: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  books: string[];
  overdueDays: number;
  fine: number;
}

interface OverdueRecord {
  id: string;
  borrowCode: string;
  readerName: string;
  bookCount: number;
  overdueDays: number;
  fine: number;
}

export default function ReturnPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundBorrows, setFoundBorrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editableFine, setEditableFine] = useState(0);
  const [exemptionReason, setExemptionReason] = useState('');
  const [physicalCondition, setPhysicalCondition] = useState('tốt');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [returnedRecord, setReturnedRecord] = useState<BorrowRecord | null>(null);
  const [overdueRecords, setOverdueRecords] = useState<OverdueRecord[]>([]);

  const calculateOverdueDays = (dueDateString: string) => {
    const due = new Date(dueDateString);
    const today = new Date();
    const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diff = Math.floor((todayStart.getTime() - dueStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const mapBorrowToRecord = (borrow: any): BorrowRecord => {
    const overdueDays = Math.max(0, Number(borrow.overdueDays ?? calculateOverdueDays(borrow.dueDate)));
    const fine = Math.max(0, Number(borrow.fine ?? overdueDays * 5000));

    return {
      id: String(borrow.id),
      borrowCode: `PM${String(borrow.id).padStart(3, '0')}`,
      readerName: borrow.user?.student?.fullName || borrow.user?.username || 'N/A',
      studentId: borrow.user?.student?.studentCode || 'N/A',
      borrowDate: borrow.borrowDate,
      dueDate: borrow.dueDate,
      books: [borrow.book?.title || 'N/A'],
      overdueDays,
      fine,
    };
  };

  const fetchBorrows = async (query: string = '') => {
    setLoading(true);
    const res = await apiFetch(`/api/return/search?q=${encodeURIComponent(query)}`);
    const hasQuery = query.trim().length > 0;
    setSearchPerformed(hasQuery);

    if (res && !res.error && Array.isArray(res)) {
      const mapped = res.map(mapBorrowToRecord);
      const latest = query ? mapped : mapped.slice(0, 10);

      setFoundBorrows(latest);
      setOverdueRecords(
        latest.map((item) => ({
          id: item.id,
          borrowCode: item.borrowCode,
          readerName: item.readerName,
          bookCount: item.books.length,
          overdueDays: item.overdueDays,
          fine: item.fine,
        }))
      );

      // Do not auto-select any borrow when list is loaded/refreshed.
      setSelectedRecord(null);
      setShowReturnModal(false);

      setExemptionReason('');
    } else {
      setFoundBorrows([]);
      setOverdueRecords([]);
      setSelectedRecord(null);
      setShowReturnModal(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchBorrows('');
  }, []);

  const handleSearch = async (query?: string) => {
    const q = (query ?? searchQuery).trim();
    await fetchBorrows(q);
  };

  const handleSelectRecord = (recordId: string) => {
    const matched = foundBorrows.find((b) => String(b.id) === String(recordId));
    if (!matched) return;

    setSelectedRecord(matched);
    setEditableFine(Math.max(0, Number(matched.fine || 0)));
    setExemptionReason('');
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async (borrowId?: number) => {
    const targetBorrowId = borrowId ?? (selectedRecord ? Number(selectedRecord.id) : undefined);
    if (!targetBorrowId) return;

    const res = await apiFetch('/api/return', {
      method: 'POST',
      body: JSON.stringify({
        borrowId: targetBorrowId,
        fineAmount: editableFine,
        exemptionReason,
      }),
    });

    if (res.error) {
      alert(res.error);
      return;
    }

    if (selectedRecord && Number(selectedRecord.id) === targetBorrowId) {
      setReturnedRecord(selectedRecord);
    }
    setShowReturnModal(false);
    setShowReceiptModal(true);
    setSelectedRecord(null);
    await fetchBorrows(searchQuery.trim());
  };

  const handlePrint = () => {
    window.print();
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const calculateFine = (overdueDays: number, ratePerDay: number = 5000) => {
    return Math.max(0, overdueDays) * ratePerDay;
  };

  const getPhysicalConditionExtraFine = (condition: string) => {
    switch (condition) {
      case 'hỏng':
        return 20000;
      case 'rách':
        return 50000;
      case 'mất':
        return 100000;
      default:
        return 0;
    }
  };

  const handlePhysicalConditionChange = (condition: string) => {
    setPhysicalCondition(condition);

    if (!selectedRecord) return;

    const baseFine = calculateFine(selectedRecord.overdueDays);
    const extraFine = getPhysicalConditionExtraFine(condition);
    setEditableFine(baseFine + extraFine);

    if (condition !== 'tốt') {
      setExemptionReason(`Phạt thêm do tình trạng sách: ${condition}`);
    } else {
      setExemptionReason('');
    }
  };

  return (
    <AdminLayout pageTitle="Xử lý Trả Sách">
      <div className="space-y-6">
        {/* Top Section: Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Nhập mã phiếu hoặc tên sinh viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                void handleSearch();
              }}
              className="px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Result Card */}
        {selectedRecord && !showReturnModal && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 rounded-full bg-[#f79421] text-white flex items-center justify-center text-2xl">
                {getInitial(selectedRecord.readerName)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl text-[#262262]">{selectedRecord.readerName}</h3>
                <p className="text-gray-600">{selectedRecord.studentId}</p>
              </div>
              {selectedRecord.overdueDays > 0 && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
                  Quá hạn {selectedRecord.overdueDays} ngày
                </div>
              )}
            </div>

            {/* Borrow Info */}
            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày mượn</p>
                <p className="text-[#262262]">{formatDate(selectedRecord.borrowDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Hạn trả</p>
                <p className="text-[#262262]">{formatDate(selectedRecord.dueDate)}</p>
              </div>
            </div>

            {/* Books List */}
            <div className="pb-6 border-b border-gray-200">
              <p className="text-sm text-gray-500 mb-3">Danh sách sách</p>
              <div className="space-y-2">
                {selectedRecord.books.map((book, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-[#f79421] rounded-full"></div>
                    <span className="text-[#262262]">{book}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fine Calculation */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">Tính tiền phạt</p>
                <p className="text-[#262262]">
                  Số ngày trễ: {selectedRecord.overdueDays} × 5,000 VND ={' '}
                  <span className="text-red-500 font-semibold">
                    {formatCurrency(calculateFine(selectedRecord.overdueDays))} VND
                  </span>
                </p>
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-700">
                  Số tiền phạt (có thể chỉnh sửa)
                </label>
                <input
                  type="number"
                  value={editableFine}
                  onChange={(e) => setEditableFine(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                />
              </div>

                <div className="pt-2 border-t border-yellow-200">
                  <label className="block mb-2 text-sm text-gray-700 font-semibold">
                    Tình trạng vật lý của sách
                  </label>
                  <select
                    value={physicalCondition}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                    onChange={(e) => handlePhysicalConditionChange(e.target.value)}
                  >
                    <option value="tốt">Bình thường (Không phạt thêm)</option>
                    <option value="hỏng">Hư hỏng nhẹ (+ 20.000 VNĐ)</option>
                    <option value="rách">Rách/Mất trang (+ 50.000 VNĐ)</option>
                    <option value="mất">Mất sách (Đền bù sách mới)</option>
                  </select>
                </div>

              <div>
                <label className="block mb-2 text-sm text-gray-700">
                  Lý do miễn/giảm phạt (nếu có)
                </label>
                <textarea
                  value={exemptionReason}
                  onChange={(e) => setExemptionReason(e.target.value)}
                  rows={2}
                  placeholder="Nhập lý do nếu có miễn/giảm phạt..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                void handleConfirmReturn();
              }}
              className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Xác nhận Trả Sách
            </button>
          </div>
        )}

        {/* Overdue Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg text-[#262262]">Danh sách quá hạn</h3>
            <p className="text-sm text-gray-500 mt-1">Sắp xếp theo số ngày quá hạn</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã phiếu</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sinh viên</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số sách</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số ngày quá hạn</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tiền phạt (VND)</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overdueRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchPerformed ? 'Không tìm thấy phiếu mượn phù hợp' : 'Không có phiếu mượn nào'}
                    </td>
                  </tr>
                ) : (
                  overdueRecords.map((record) => (
                    <tr
                      key={record.id}
                      onClick={() => handleSelectRecord(String(record.id))}
                      className={`transition-colors cursor-pointer ${
                        record.overdueDays > 0
                          ? 'bg-red-50 hover:bg-[#f79421]/10'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 text-[#262262] font-medium">{record.borrowCode}</td>
                      <td className="px-6 py-4 text-[#262262]">{record.readerName}</td>
                      <td className="px-6 py-4 text-gray-600">{record.bookCount}</td>
                      <td className="px-6 py-4">
                        <span className={record.overdueDays > 0 ? 'text-red-500 font-semibold' : 'text-gray-600'}>
                          {record.overdueDays} ngày
                        </span>
                      </td>
                      <td className={record.overdueDays > 0 ? 'px-6 py-4 text-red-500 font-semibold' : 'px-6 py-4 text-gray-600'}>
                        {formatCurrency(record.fine)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRecord(String(record.id));
                          }}
                          className="px-4 py-2 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors text-sm"
                        >
                          Xử lý trả
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Return Modal */}
      {showReturnModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 space-y-4">
              <h3 className="text-xl text-[#262262]">Xử lý trả sách nhanh</h3>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Sinh viên</p>
                <p className="text-[#262262]">
                  {selectedRecord.readerName} ({selectedRecord.studentId})
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">Danh sách sách</p>
                <div className="space-y-1">
                  {selectedRecord.books.map((book, idx) => (
                    <p key={idx} className="text-sm text-[#262262]">
                      • {book}
                    </p>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
                <p className="text-[#262262] text-sm">
                  Số ngày trễ: {selectedRecord.overdueDays} × 5,000 VND ={' '}
                  <span className="text-red-500 font-semibold">
                    {formatCurrency(calculateFine(selectedRecord.overdueDays))} VND
                  </span>
                </p>

                  <div className="pt-2 border-t border-yellow-200">
                    <label className="block mb-2 text-sm text-gray-700 font-semibold">
                      Tình trạng vật lý của sách
                    </label>
                    <select
                      value={physicalCondition}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white"
                      onChange={(e) => handlePhysicalConditionChange(e.target.value)}
                    >
                      <option value="tốt">Bình thường (Không phạt thêm)</option>
                      <option value="hỏng">Hư hỏng nhẹ (+ 20.000 VNĐ)</option>
                      <option value="rách">Rách/Mất trang (+ 50.000 VNĐ)</option>
                      <option value="mất">Mất sách (Đền bù sách mới)</option>
                    </select>
                  </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-700">Số tiền phạt</label>
                  <input
                    type="number"
                    value={editableFine}
                    onChange={(e) => setEditableFine(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm text-gray-700">Lý do miễn/giảm phạt (nếu có)</label>
                  <textarea
                    value={exemptionReason}
                    onChange={(e) => setExemptionReason(e.target.value)}
                    rows={2}
                    placeholder="Nhập lý do nếu có miễn/giảm phạt..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedRecord(null);
                    setPhysicalCondition('tốt');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    void handleConfirmReturn(Number(selectedRecord.id));
                  }}
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  Xác nhận trả
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Receipt Modal */}
      {showReceiptModal && returnedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 space-y-4">
              {/* Success Icon */}
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl text-[#262262] text-center">
                Trả sách thành công
              </h2>

              {/* Receipt Info */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Thông tin sinh viên</p>
                  <p className="text-[#262262]">
                    {returnedRecord.readerName} ({returnedRecord.studentId})
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Danh sách sách đã trả</p>
                  <div className="space-y-1 mt-2">
                    {returnedRecord.books.map((book, idx) => (
                      <p key={idx} className="text-sm text-[#262262]">
                        • {book}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Số tiền phạt</p>
                  <p className="text-lg text-red-500 font-semibold">
                    {formatCurrency(editableFine)} VND
                  </p>
                </div>

                {exemptionReason && (
                  <div>
                    <p className="text-sm text-gray-500">Lý do miễn/giảm phạt</p>
                    <p className="text-sm text-[#262262] italic">{exemptionReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  In phiếu
                </button>
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setReturnedRecord(null);
                  }}
                  className="flex-1 px-6 py-3 bg-[#f79421] hover:bg-[#e68414] text-white rounded-lg transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
