import { useEffect, useState } from 'react';
import { Calendar, Download, FileText, TrendingUp, BookOpen, DollarSign, CheckCircle, BarChart3 } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';
import * as XLSX from 'xlsx';
import pdfMake from 'pdfmake/build/pdfmake.js';
import pdfFonts from 'pdfmake/build/vfs_fonts.js';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;

type ExportBorrow = {
  id: number;
  status?: string;
  borrowDate?: string;
  dueDate?: string;
  returnDate?: string | null;
  book?: { title?: string; bookCode?: string; category?: string };
  user?: { student?: { fullName?: string; studentCode?: string } };
};

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-12-31');
  const [quickPeriod, setQuickPeriod] = useState('Năm nay');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ totalBooks: 0, borrowing: 0, readers: 0, overdue: 0, fineCollected: 0, onTimeRate: 0 });
  const [lineChartData, setLineChartData] = useState<Array<{ id: string; name: string; value: number }>>([]);
  const [donutChartData, setDonutChartData] = useState<Array<{ id: string; name: string; value: number; color: string }>>([]);
  const [topReaders, setTopReaders] = useState<Array<{ rank: number; name: string; studentId: string; borrowCount: number }>>([]);
  const [topBooks, setTopBooks] = useState<Array<{ rank: number; name: string; category: string; borrowCount: number }>>([]);
  const [overdueList, setOverdueList] = useState<Array<{ id: string; readerName: string; studentId: string; bookName: string; overdueDays: number; fine: number }>>([]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const extractList = (res: any) => {
    if (!res || res.error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    return [];
  };

  const safeDate = (value: any) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getOverdueDays = (dueDate: any) => {
    const due = safeDate(dueDate);
    if (!due) return 0;
    const today = new Date();
    const a = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return Math.max(0, Math.floor((b - a) / (1000 * 60 * 60 * 24)));
  };

  const finePerDay = 5000;

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [statsRes, chartRes, readersRes, booksRes, exportRes] = await Promise.all([
          apiFetch('/api/reports/stats'),
          apiFetch(`/api/reports/borrow-by-month?period=${chartPeriod}`),
          apiFetch('/api/reports/top-readers'),
          apiFetch('/api/reports/top-books'),
          apiFetch('/api/reports/export-data'),
        ]);

        const exportData = extractList(exportRes) as ExportBorrow[];

        const totalBooks = Number(statsRes?.totalBooks ?? 0);
        const borrowing = Number(statsRes?.borrowing ?? exportData.filter((b) => b.status === 'BORROWING').length);
        const readers = Number(statsRes?.readers ?? 0);
        const overdue = Number(statsRes?.overdue ?? exportData.filter((b) => getOverdueDays(b.dueDate) > 0 && !b.returnDate).length);

        const overdueRows = exportData
          .filter((b) => !b.returnDate && getOverdueDays(b.dueDate) > 0)
          .map((b, idx) => {
            const overdueDays = getOverdueDays(b.dueDate);
            return {
              id: String(b.id),
              readerName: b.user?.student?.fullName || 'N/A',
              studentId: b.user?.student?.studentCode || 'N/A',
              bookName: b.book?.title || 'N/A',
              overdueDays,
              fine: overdueDays * finePerDay,
            };
          })
          .sort((a, b) => b.overdueDays - a.overdueDays)
          .slice(0, 10);

        const fineCollected = overdueRows.reduce((sum, item) => sum + item.fine, 0);

        const returnedCount = exportData.filter((b) => b.status === 'RETURNED' || b.returnDate).length;
        const onTimeCount = exportData.filter((b) => {
          if (!(b.status === 'RETURNED' || b.returnDate)) return false;
          const due = safeDate(b.dueDate);
          const ret = safeDate(b.returnDate);
          if (!due || !ret) return false;
          return ret.getTime() <= due.getTime();
        }).length;
        const onTimeRate = returnedCount > 0 ? Math.round((onTimeCount / returnedCount) * 100) : 0;

        setStats({ totalBooks, borrowing, readers, overdue, fineCollected, onTimeRate });
        setOverdueList(overdueRows);

        const chartList = extractList(chartRes);
        setLineChartData(
          chartList.map((item: any, idx: number) => ({
            id: String(item.id ?? idx + 1),
            name: item.name || item.month || item.label || `T${idx + 1}`,
            value: Number(item.value ?? item.borrows ?? item.count ?? 0),
          }))
        );

        const readerList = extractList(readersRes);
        setTopReaders(
          readerList.slice(0, 10).map((r: any, idx: number) => ({
            rank: idx + 1,
            name: r.name || r.fullName || r.user?.student?.fullName || 'N/A',
            studentId: r.studentId || r.studentCode || r.user?.student?.studentCode || 'N/A',
            borrowCount: Number(r.borrowCount ?? r.borrows ?? r.count ?? 0),
          }))
        );

        const bookList = extractList(booksRes);
        const mappedTopBooks = bookList.slice(0, 10).map((b: any, idx: number) => ({
          rank: idx + 1,
          name: b.name || b.title || b.book?.title || 'N/A',
          category: b.category || b.book?.category || 'Khác',
          borrowCount: Number(b.borrowCount ?? b.borrows ?? b.count ?? 0),
        }));
        setTopBooks(mappedTopBooks);

        const categoryMap = new Map<string, number>();
        mappedTopBooks.forEach((b: { category: string; borrowCount: number }) => {
          categoryMap.set(b.category, (categoryMap.get(b.category) || 0) + b.borrowCount);
        });
        const colors = ['#f79421', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
        setDonutChartData(
          Array.from(categoryMap.entries())
            .slice(0, 6)
            .map(([name, value], idx) => ({ id: `cat${idx + 1}`, name, value, color: colors[idx % colors.length] }))
        );
      } catch (error) {
        console.error('Lỗi tải báo cáo:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchReports();
  }, [dateFrom, dateTo, quickPeriod, chartPeriod]);

  const handleExportPDF = () => {
    const exportPDF = async () => {
      const res = await apiFetch('/api/reports/export-data');
      if (res?.error) return alert('Lỗi lấy dữ liệu');

      const rows = extractList(res) as ExportBorrow[];

      const tableBody = [
        ['Mã phiếu', 'Sinh viên', 'Mã SV', 'Tên sách', 'Ngày mượn', 'Trạng thái'],
        ...rows.map((b) => [
          `PM${b.id}`,
          b.user?.student?.fullName || 'N/A',
          b.user?.student?.studentCode || 'N/A',
          b.book?.title || 'N/A',
          safeDate(b.borrowDate)?.toLocaleDateString('vi-VN') || 'N/A',
          b.status || 'N/A',
        ]),
      ];

      const docDefinition = {
        content: [
          { text: 'BÁO CÁO MƯỢN TRẢ SÁCH - THƯ VIỆN UTT', style: 'header', margin: [0, 0, 0, 10] },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', '*', 'auto', 'auto'],
              body: tableBody,
            },
            layout: 'lightHorizontalLines',
          },
        ],
        styles: {
          header: {
            fontSize: 14,
            bold: true,
          },
        },
        defaultStyle: {
          font: 'Roboto',
          fontSize: 10,
        },
      } as any;

      pdfMake.createPdf(docDefinition).download(`BaoCao_ThuVien_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    void exportPDF();
  };

  const handleExportExcel = () => {
    const exportExcel = async () => {
      const res = await apiFetch('/api/reports/export-data');
      if (res?.error) return alert('Lỗi lấy dữ liệu');

      const rows = extractList(res) as ExportBorrow[];
      const exportData = rows.map((b) => ({
        'Ma phieu': `PM${b.id}`,
        'Ten sinh vien': b.user?.student?.fullName || 'N/A',
        'Ma sinh vien': b.user?.student?.studentCode || 'N/A',
        'Ten sach': b.book?.title || 'N/A',
        'Ma sach': b.book?.bookCode || 'N/A',
        'Ngay muon': safeDate(b.borrowDate)?.toLocaleDateString('vi-VN') || 'N/A',
        'Han tra': safeDate(b.dueDate)?.toLocaleDateString('vi-VN') || 'N/A',
        'Ngay tra': b.returnDate ? safeDate(b.returnDate)?.toLocaleDateString('vi-VN') || 'N/A' : 'Chua tra',
        'Trang thai': b.status || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoCaoMuonTra');
      XLSX.writeFile(workbook, `BaoCao_ThuVien_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    void exportExcel();
  };

  return (
    <AdminLayout pageTitle="Báo cáo & Thống kê">
      <div className="space-y-6">
        {/* Analytics Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 border border-purple-300 text-purple-700 px-3 py-1 rounded-full text-xs flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Analytics
          </div>
        </div>

        {/* Top Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div>
                <label className="block mb-1 text-xs text-gray-500">Từ ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="mt-5">→</div>
              <div>
                <label className="block mb-1 text-xs text-gray-500">Đến ngày</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Period */}
            <div>
              <label className="block mb-1 text-xs text-gray-500">Kỳ báo cáo</label>
              <select
                value={quickPeriod}
                onChange={(e) => setQuickPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f79421] focus:border-transparent bg-white text-sm"
              >
                <option>Tháng này</option>
                <option>Quý này</option>
                <option>Năm nay</option>
              </select>
            </div>

            {/* Export Actions */}
            <div className="ml-auto flex items-end gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                <FileText className="w-4 h-4" />
                Xuất PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 text-[#262262] border border-[#262262] hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Books */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#f79421]/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#f79421]" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl text-[#262262] mb-1">{stats.totalBooks}</p>
            <p className="text-sm text-gray-600">Tổng sách</p>
            <p className="text-xs text-green-500 mt-2">+12% so với kỳ trước</p>
          </div>

          {/* Borrow Count */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#f79421]/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#f79421]" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl text-[#262262] mb-1">{stats.borrowing}</p>
            <p className="text-sm text-gray-600">Lượt mượn kỳ</p>
            <p className="text-xs text-green-500 mt-2">+8% so với kỳ trước</p>
          </div>

          {/* Fine Collected */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-[#f79421]/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#f79421]" />
              </div>
            </div>
            <p className="text-3xl text-[#262262] mb-1">{formatCurrency(stats.fineCollected)}</p>
            <p className="text-sm text-gray-600">Tiền phạt thu (VND)</p>
            <p className="text-xs text-gray-500 mt-2">Tháng này</p>
          </div>

          {/* On-time Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#f79421] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl text-[#262262] mb-1">{stats.onTimeRate}%</p>
            <p className="text-sm text-gray-600">Tỷ lệ đúng hạn</p>
            <p className="text-xs text-green-500 mt-2">+3% so với kỳ trước</p>
          </div>
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg text-[#262262]">Lượt mượn theo thời gian</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartPeriod('day')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    chartPeriod === 'day'
                      ? 'bg-[#f79421] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Ngày
                </button>
                <button
                  onClick={() => setChartPeriod('month')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    chartPeriod === 'month'
                      ? 'bg-[#f79421] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Tháng
                </button>
                <button
                  onClick={() => setChartPeriod('year')}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    chartPeriod === 'year'
                      ? 'bg-[#f79421] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Năm
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#f79421"
                  strokeWidth={3}
                  dot={{ fill: '#f79421', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Lượt mượn"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Donut Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg text-[#262262] mb-6">Phân bổ theo thể loại</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={false}
                >
                  {donutChartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-600">
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Readers */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg text-[#262262]">Top 10 Độc giả</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Rank</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Họ tên</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Lượt mượn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topReaders.map((reader) => (
                    <tr key={reader.rank} className="hover:bg-[#f79421]/5 transition-colors">
                      <td className="px-6 py-4 text-2xl">{getRankIcon(reader.rank)}</td>
                      <td className="px-6 py-4 text-[#262262]">{reader.name}</td>
                      <td className="px-6 py-4 text-gray-600">{reader.studentId}</td>
                      <td className="px-6 py-4">
                        <span className="text-[#f79421] font-semibold">{reader.borrowCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Books */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg text-[#262262]">Top 10 Sách được mượn</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Rank</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sách</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Thể loại</th>
                    <th className="px-6 py-3 text-left text-gray-600 text-sm">Lượt mượn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topBooks.map((book) => (
                    <tr key={book.rank} className="hover:bg-[#f79421]/5 transition-colors">
                      <td className="px-6 py-4 text-2xl">{getRankIcon(book.rank)}</td>
                      <td className="px-6 py-4 text-[#262262]">{book.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{book.category}</td>
                      <td className="px-6 py-4">
                        <span className="text-[#f79421] font-semibold">{book.borrowCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Overdue List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg text-[#262262]">Danh sách quá hạn</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sinh viên</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sách</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Số ngày quá hạn</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Tiền phạt (VND)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {overdueList.map((record) => (
                  <tr
                    key={record.id}
                    className="bg-red-50 hover:bg-[#f79421]/10 transition-colors"
                  >
                    <td className="px-6 py-4 text-[#262262]">{record.readerName}</td>
                    <td className="px-6 py-4 text-gray-600">{record.studentId}</td>
                    <td className="px-6 py-4 text-gray-600">{record.bookName}</td>
                    <td className="px-6 py-4">
                      <span className="text-red-500 font-semibold">{record.overdueDays} ngày</span>
                    </td>
                    <td className="px-6 py-4 text-red-500 font-semibold">
                      {formatCurrency(record.fine)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
