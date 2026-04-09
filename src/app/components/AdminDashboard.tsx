import { useEffect, useState } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,} from 'recharts';
import AdminLayout from './AdminLayout';
import { BookOpen, BookPlus, Users, FileText } from 'lucide-react';
import { apiFetch } from '../lib/auth';

interface Stats {
  totalBooks: number;
  borrowing: number;
  readers: number;
  overdue: number;
}

interface ChartItem {
  id?: string;
  month: string;
  value: number;
}

interface RecentBorrowItem {
  id: number | string;
  book: string;
  student: string;
  studentId: string;
  date: string;
}

interface OverdueItem {
  id: number | string;
  book: string;
  student: string;
  studentId: string;
  dueDate: string;
  overdueDays: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    borrowing: 0,
    readers: 0,
    overdue: 0,
  });
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [recentBorrows, setRecentBorrows] = useState<RecentBorrowItem[]>([]);
  const [overdueList, setOverdueList] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const extractList = (res: any) => {
    if (!res || res.error) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    return [];
  };

  const formatDate = (value: any) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
  };

  useEffect(() => {
    Promise.all([
      apiFetch('/api/reports/stats'),
      apiFetch('/api/reports/borrow-by-month?period=month'),
      apiFetch('/api/borrow?limit=5'),
      apiFetch('/api/borrow/overdue'),
    ])
      .then(([statsRes, chartRes, recentRes, overdueRes]) => {
        if (statsRes && !statsRes.error) {
          setStats({
            totalBooks: Number(statsRes.totalBooks ?? 0),
            borrowing: Number(statsRes.borrowing ?? 0),
            readers: Number(statsRes.readers ?? 0),
            overdue: Number(statsRes.overdue ?? 0),
          });
        }

        setChartData(
          extractList(chartRes).map((item: any, idx: number) => ({
            id: String(item.id ?? idx + 1),
            month: item.month || item.name || `T${idx + 1}`,
            value: Number(item.value ?? item.borrows ?? item.count ?? 0),
          }))
        );

        setRecentBorrows(
          extractList(recentRes).map((borrow: any) => ({
            id: borrow.id,
            book: borrow.book?.title || borrow.book?.name || 'N/A',
            student: borrow.user?.student?.fullName || 'N/A',
            studentId: borrow.user?.student?.studentCode || 'N/A',
            date: formatDate(borrow.borrowDate),
          }))
        );

        setOverdueList(
          extractList(overdueRes).map((item: any) => ({
            id: item.id,
            book: item.book?.title || 'N/A',
            student: item.user?.student?.fullName || 'N/A',
            studentId: item.user?.student?.studentCode || 'N/A',
            dueDate: formatDate(item.dueDate),
            overdueDays: Math.max(
              0,
              Math.floor((Date.now() - new Date(item.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            ),
          }))
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const metrics = [
    { label: 'Tổng sách', value: stats.totalBooks.toLocaleString(), trend: '', icon: BookOpen },
    { label: 'Đang mượn', value: stats.borrowing.toLocaleString(), trend: '', icon: BookPlus },
    { label: 'Độc giả', value: stats.readers.toLocaleString(), trend: '', icon: Users },
    { label: 'Quá hạn', value: stats.overdue.toLocaleString(), trend: '', icon: FileText, alert: true },
  ];

  if (loading)
    return (
      <AdminLayout pageTitle="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );

  return (
    <AdminLayout pageTitle="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    metric.alert ? 'bg-red-50' : 'bg-orange-50'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      metric.alert ? 'text-red-500' : 'text-[#f79421]'
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    metric.trend.startsWith('+')
                      ? 'text-green-600'
                      : metric.trend.startsWith('-')
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{metric.trend}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
                <p className="text-[#262262]">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-[#262262] mb-6">Lượt mượn theo tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" stroke="#888" tick={{ fill: '#888' }} axisLine={{ stroke: '#888' }} />
              <YAxis stroke="#888" tick={{ fill: '#888' }} axisLine={{ stroke: '#888' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#f79421" radius={[8, 8, 0, 0]} name="Lượt mượn" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-[#262262] mb-6">Mượn sách gần đây</h3>
          <div className="space-y-4">
            {recentBorrows.map((borrow) => (
              <div
                key={borrow.id}
                className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <p className="text-[#262262]">{borrow.book}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {borrow.student} ({borrow.studentId})
                </p>
                <p className="text-gray-500 text-xs mt-1">{borrow.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
          <h3 className="text-[#262262]">Danh sách quá hạn</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Tên sách</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Sinh viên</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Mã SV</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Hạn trả</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Số ngày quá hạn</th>
                <th className="px-6 py-3 text-left text-gray-600 text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overdueList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-[#262262]">{item.book}</td>
                  <td className="px-6 py-4 text-gray-600">{item.student}</td>
                  <td className="px-6 py-4 text-gray-600">{item.studentId}</td>
                  <td className="px-6 py-4 text-gray-600">{item.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                      {item.overdueDays} ngày
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex items-center gap-1 text-[#f79421] hover:text-[#e68414] transition-colors">
                      Nhắc nhở
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
