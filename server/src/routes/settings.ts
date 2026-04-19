import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

const canManageSettings = (role: unknown) => {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'librarian';
};

const WORK_CLOSE_WEEKENDS_KEY = 'work_close_weekends';
const WORK_START_TIME_KEY = 'work_start_time';
const WORK_END_TIME_KEY = 'work_end_time';

const DEFAULT_WORK_CLOSE_WEEKENDS = true;
const DEFAULT_WORK_START_TIME = '08:00';
const DEFAULT_WORK_END_TIME = '18:30';

const parseBooleanValue = (value: unknown, fallback: boolean) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(raw)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(raw)) return false;
  return fallback;
};

const isValidTimeHHMM = (value: unknown) => {
  const raw = String(value || '').trim();
  const matched = raw.match(/^(\d{2}):(\d{2})$/);
  if (!matched) return false;
  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const getWorkingCalendarSettings = async () => {
  const keys = [WORK_CLOSE_WEEKENDS_KEY, WORK_START_TIME_KEY, WORK_END_TIME_KEY];
  const rows = await prisma.config.findMany({ where: { key: { in: keys } } });
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const closeOnWeekends = parseBooleanValue(map.get(WORK_CLOSE_WEEKENDS_KEY), DEFAULT_WORK_CLOSE_WEEKENDS);
  const workStartTime = isValidTimeHHMM(map.get(WORK_START_TIME_KEY))
    ? String(map.get(WORK_START_TIME_KEY))
    : DEFAULT_WORK_START_TIME;
  const workEndTime = isValidTimeHHMM(map.get(WORK_END_TIME_KEY))
    ? String(map.get(WORK_END_TIME_KEY))
    : DEFAULT_WORK_END_TIME;

  return {
    closeOnWeekends,
    workStartTime,
    workEndTime,
  };
};

const parseDateOnly = (value: unknown): Date | null => {
  const raw = String(value || '').trim();
  const matched = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const expandDateRange = (startDate: Date, endDate: Date) => {
  const result: Date[] = [];
  let cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    result.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  return result;
};

const toDateOnlyString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get('/working-calendar', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const settings = await getWorkingCalendarSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải cấu hình lịch làm việc' });
  }
});

router.put('/working-calendar', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const current = await getWorkingCalendarSettings();

    const closeOnWeekends = Object.prototype.hasOwnProperty.call(req.body || {}, 'closeOnWeekends')
      ? parseBooleanValue(req.body?.closeOnWeekends, current.closeOnWeekends)
      : current.closeOnWeekends;

    const workStartTime = Object.prototype.hasOwnProperty.call(req.body || {}, 'workStartTime')
      ? String(req.body?.workStartTime || '').trim()
      : current.workStartTime;
    const workEndTime = Object.prototype.hasOwnProperty.call(req.body || {}, 'workEndTime')
      ? String(req.body?.workEndTime || '').trim()
      : current.workEndTime;

    if (!isValidTimeHHMM(workStartTime) || !isValidTimeHHMM(workEndTime)) {
      return res.status(400).json({ error: 'Giờ mở/đóng cửa phải đúng định dạng HH:mm' });
    }

    await prisma.$transaction([
      prisma.config.upsert({
        where: { key: WORK_CLOSE_WEEKENDS_KEY },
        create: { key: WORK_CLOSE_WEEKENDS_KEY, value: String(closeOnWeekends) },
        update: { value: String(closeOnWeekends) },
      }),
      prisma.config.upsert({
        where: { key: WORK_START_TIME_KEY },
        create: { key: WORK_START_TIME_KEY, value: workStartTime },
        update: { value: workStartTime },
      }),
      prisma.config.upsert({
        where: { key: WORK_END_TIME_KEY },
        create: { key: WORK_END_TIME_KEY, value: workEndTime },
        update: { value: workEndTime },
      }),
    ]);

    res.json({ closeOnWeekends, workStartTime, workEndTime });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lưu cấu hình lịch làm việc' });
  }
});

router.get('/holidays', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const year = Number(req.query.year || 0);
    const hasYearFilter = Number.isInteger(year) && year >= 1970 && year <= 3000;

    const holidays = await prisma.holiday.findMany({
      where: hasYearFilter
        ? {
            date: {
              gte: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
              lt: new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0)),
            },
          }
        : undefined,
      orderBy: { date: 'asc' },
    });

    res.json(
      holidays.map((item) => ({
        id: item.id,
        date: toDateOnlyString(item.date),
        name: item.name,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải danh sách ngày nghỉ' });
  }
});

router.post('/holidays', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const date = parseDateOnly(req.body?.date);
    const name = String(req.body?.name || '').trim();

    if (!date) {
      return res.status(400).json({ error: 'Ngày nghỉ không hợp lệ, dùng định dạng YYYY-MM-DD' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Vui lòng nhập tên ngày nghỉ' });
    }

    const saved = await prisma.holiday.upsert({
      where: { date },
      update: { name },
      create: { date, name },
    });

    res.json({ id: saved.id, date: toDateOnlyString(saved.date), name: saved.name });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lưu ngày nghỉ' });
  }
});

router.post('/holidays/bulk', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const rangeName = String(req.body?.name || '').trim();
    const startDate = parseDateOnly(req.body?.startDate);
    const endDate = parseDateOnly(req.body?.endDate);

    let normalized: Array<{ date: Date; name: string }> = [];

    if (items.length > 0) {
      normalized = items.map((item: any, index: number) => {
        const date = parseDateOnly(item?.date);
        const name = String(item?.name || '').trim();
        if (!date || !name) {
          throw new Error(`Dữ liệu không hợp lệ tại phần tử ${index + 1}`);
        }
        return { date, name };
      });
    } else if (startDate && endDate) {
      if (startDate.getTime() > endDate.getTime()) {
        return res.status(400).json({ error: 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc' });
      }
      if (!rangeName) {
        return res.status(400).json({ error: 'Vui lòng nhập tên cho khoảng ngày nghỉ' });
      }

      normalized = expandDateRange(startDate, endDate).map((date) => ({
        date,
        name: rangeName,
      }));
    } else {
      return res.status(400).json({ error: 'Danh sách ngày nghỉ trống hoặc thiếu khoảng ngày' });
    }

    await prisma.$transaction(
      normalized.map((item) =>
        prisma.holiday.upsert({
          where: { date: item.date },
          update: { name: item.name },
          create: { date: item.date, name: item.name },
        })
      )
    );

    res.json({ message: 'Đã cập nhật lịch nghỉ thành công', count: normalized.length });
  } catch (error: any) {
    if (error?.message?.startsWith('Dữ liệu không hợp lệ')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Lỗi cập nhật danh sách ngày nghỉ' });
  }
});

router.delete('/holidays/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (!canManageSettings(req.user?.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'ID ngày nghỉ không hợp lệ' });
    }

    await prisma.holiday.delete({ where: { id } });
    res.json({ message: 'Đã xóa ngày nghỉ' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Không tìm thấy ngày nghỉ cần xóa' });
    }
    res.status(500).json({ error: 'Lỗi xóa ngày nghỉ' });
  }
});

export default router;
