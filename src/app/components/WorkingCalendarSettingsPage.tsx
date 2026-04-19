import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import { apiFetch } from '../lib/auth';

type HolidayItem = {
  id: number;
  date: string;
  name: string;
};

const currentYear = new Date().getFullYear();

export default function WorkingCalendarSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [closeOnWeekends, setCloseOnWeekends] = useState(true);
  const [workStartTime, setWorkStartTime] = useState('08:00');
  const [workEndTime, setWorkEndTime] = useState('18:30');

  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const sortedHolidays = useMemo(
    () => [...holidays].sort((a, b) => a.date.localeCompare(b.date)),
    [holidays]
  );

  const fetchCalendar = async () => {
    setLoading(true);
    setMessage('');

    const [calendarRes, holidaysRes] = await Promise.all([
      apiFetch('/api/settings/working-calendar'),
      apiFetch(`/api/settings/holidays?year=${year}`),
    ]);

    if (calendarRes?.error) {
      setMessage(calendarRes.error);
    } else {
      setCloseOnWeekends(Boolean(calendarRes?.closeOnWeekends));
      setWorkStartTime(String(calendarRes?.workStartTime || '08:00'));
      setWorkEndTime(String(calendarRes?.workEndTime || '18:30'));
    }

    if (holidaysRes?.error) {
      setMessage((prev) => prev || holidaysRes.error);
      setHolidays([]);
    } else {
      setHolidays(Array.isArray(holidaysRes) ? holidaysRes : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchCalendar();
  }, [year]);

  const handleSaveCalendar = async () => {
    setSaving(true);
    setMessage('');

    const res = await apiFetch('/api/settings/working-calendar', {
      method: 'PUT',
      body: JSON.stringify({ closeOnWeekends, workStartTime, workEndTime }),
    });

    if (res?.error) {
      setMessage(res.error);
    } else {
      setMessage('Đã lưu cấu hình lịch làm việc.');
    }

    setSaving(false);
  };

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayName.trim()) {
      setMessage('Vui lòng nhập đủ ngày nghỉ và tên ngày nghỉ.');
      return;
    }

    setSaving(true);
    setMessage('');

    const res = await apiFetch('/api/settings/holidays', {
      method: 'POST',
      body: JSON.stringify({ date: holidayDate, name: holidayName.trim() }),
    });

    if (res?.error) {
      setMessage(res.error);
    } else {
      setHolidayDate('');
      setHolidayName('');
      setMessage('Đã cập nhật ngày nghỉ.');
      await fetchCalendar();
    }

    setSaving(false);
  };

  const handleDeleteHoliday = async (id: number) => {
    setSaving(true);
    setMessage('');

    const res = await apiFetch(`/api/settings/holidays/${id}`, { method: 'DELETE' });
    if (res?.error) {
      setMessage(res.error);
    } else {
      setMessage('Đã xóa ngày nghỉ.');
      await fetchCalendar();
    }

    setSaving(false);
  };

  return (
    <AdminLayout pageTitle="Lịch làm việc">
      <div className="max-w-5xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-[#262262] mb-4">Giờ mở cửa và chế độ cuối tuần</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Giờ mở cửa</span>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </label>

            <label className="block">
              <span className="block text-sm text-gray-600 mb-1">Giờ đóng cửa</span>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-[#262262]">Đóng cửa Thứ 7 và Chủ nhật</p>
              <p className="text-sm text-gray-500">Bật công tắc để xem T7/CN là ngày nghỉ trong toàn bộ nghiệp vụ mượn/trả.</p>
            </div>

            <button
              type="button"
              onClick={() => setCloseOnWeekends((prev) => !prev)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                closeOnWeekends ? 'bg-[#f79421]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  closeOnWeekends ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveCalendar}
              disabled={saving || loading}
              className="px-4 py-2 rounded-lg bg-[#262262] text-white disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
            <label>
              <span className="block text-sm text-gray-600 mb-1">Năm</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value || currentYear))}
                className="border border-gray-300 rounded-lg px-3 py-2 w-36"
              />
            </label>

            <label className="flex-1">
              <span className="block text-sm text-gray-600 mb-1">Ngày nghỉ (YYYY-MM-DD)</span>
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </label>

            <label className="flex-1">
              <span className="block text-sm text-gray-600 mb-1">Tên ngày nghỉ</span>
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="Ví dụ: Giỗ Tổ Hùng Vương"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </label>

            <button
              onClick={handleAddHoliday}
              disabled={saving || loading}
              className="px-4 py-2 rounded-lg bg-[#f79421] text-white disabled:opacity-50"
            >
              Thêm ngày nghỉ
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Ngày</th>
                  <th className="text-left px-4 py-3">Tên ngày nghỉ</th>
                  <th className="text-right px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={3}>Đang tải...</td>
                  </tr>
                ) : sortedHolidays.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-gray-500" colSpan={3}>Chưa có ngày nghỉ trong năm này.</td>
                  </tr>
                ) : (
                  sortedHolidays.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{item.date}</td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteHoliday(item.id)}
                          disabled={saving}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
            {message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
