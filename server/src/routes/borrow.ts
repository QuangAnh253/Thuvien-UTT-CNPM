import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const buildAvatarKey = (userId: number) => `avatar:${userId}`;
const DEFAULT_WORK_START_HOUR = 8;
const DEFAULT_WORK_START_MINUTE = 0;
const DEFAULT_WORK_END_HOUR = 18;
const DEFAULT_WORK_END_MINUTE = 30;
const WORK_CLOSE_WEEKENDS_KEY = 'work_close_weekends';
const WORK_START_TIME_KEY = 'work_start_time';
const WORK_END_TIME_KEY = 'work_end_time';

type ReaderBorrowPolicy = {
  label: 'student' | 'lecturer';
  maxActiveBorrows: number;
  pendingExpiryLockThreshold: number;
  pickupWaitHours: number;
  borrowDurationDays: number;
  renewalWindowDays: number;
  renewalDurationDays: number;
};

const BORROW_POLICIES: Record<'student' | 'lecturer', ReaderBorrowPolicy> = {
  student: {
    label: 'student',
    maxActiveBorrows: 5,
    pendingExpiryLockThreshold: 5,
    pickupWaitHours: 24,
    borrowDurationDays: 14,
    renewalWindowDays: 3,
    renewalDurationDays: 7,
  },
  lecturer: {
    label: 'lecturer',
    maxActiveBorrows: 10,
    pendingExpiryLockThreshold: 10,
    pickupWaitHours: 48,
    borrowDurationDays: 60,
    renewalWindowDays: 7,
    renewalDurationDays: 14,
  },
};

const normalizeReaderType = (value: any): 'student' | 'lecturer' => {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'lecturer' ? 'lecturer' : 'student';
};

const getPolicyByReaderType = (readerType: any): ReaderBorrowPolicy => {
  return BORROW_POLICIES[normalizeReaderType(readerType)];
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toDateKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const parseHolidayDateSet = (raw: string): Set<string> => {
  return new Set(
    raw
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item))
  );
};

const parseBooleanValue = (value: unknown, fallback: boolean) => {
  const raw = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on'].includes(raw)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(raw)) return false;
  return fallback;
};

const parseTimeToParts = (value: unknown, fallbackHour: number, fallbackMinute: number) => {
  const raw = String(value || '').trim();
  const matched = raw.match(/^(\d{2}):(\d{2})$/);
  if (!matched) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: fallbackHour, minute: fallbackMinute };
  }

  return { hour, minute };
};

const dateToDateKey = (value: Date) => {
  const date = new Date(value);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
};

type WorkingCalendarSettings = {
  holidayDateSet: Set<string>;
  closeOnWeekends: boolean;
  workStartHour: number;
  workStartMinute: number;
  workEndHour: number;
  workEndMinute: number;
};

const getWorkingCalendarSettings = async (): Promise<WorkingCalendarSettings> => {
  const envRaw = String(process.env.HOLIDAY_DATES || '').trim();
  const envHolidays = parseHolidayDateSet(envRaw);
  const configRows = await prisma.config.findMany({
    where: { key: { in: [WORK_CLOSE_WEEKENDS_KEY, WORK_START_TIME_KEY, WORK_END_TIME_KEY] } },
  });
  const configMap = new Map(configRows.map((row) => [row.key, row.value]));

  const dbHolidays: Array<{ date: Date }> = await (prisma as any).holiday.findMany({
    select: { date: true },
  });
  const dbHolidaySet: Set<string> = new Set(dbHolidays.map((item) => dateToDateKey(item.date)));

  const closeOnWeekends = parseBooleanValue(configMap.get(WORK_CLOSE_WEEKENDS_KEY), true);
  const startTime = parseTimeToParts(
    configMap.get(WORK_START_TIME_KEY),
    DEFAULT_WORK_START_HOUR,
    DEFAULT_WORK_START_MINUTE
  );
  const endTime = parseTimeToParts(
    configMap.get(WORK_END_TIME_KEY),
    DEFAULT_WORK_END_HOUR,
    DEFAULT_WORK_END_MINUTE
  );

  return {
    holidayDateSet: new Set([...envHolidays, ...dbHolidaySet]),
    closeOnWeekends,
    workStartHour: startTime.hour,
    workStartMinute: startTime.minute,
    workEndHour: endTime.hour,
    workEndMinute: endTime.minute,
  };
};

const isNonWorkingDay = (date: Date, holidayDateSet: Set<string>, closeOnWeekends: boolean) => {
  return (closeOnWeekends && isWeekend(date)) || holidayDateSet.has(toDateKey(date));
};

const clampToWorkingHours = (date: Date, settings: WorkingCalendarSettings) => {
  const clamped = new Date(date);
  const hours = clamped.getHours();
  const minutes = clamped.getMinutes();

  if (hours < settings.workStartHour || (hours === settings.workStartHour && minutes < settings.workStartMinute)) {
    clamped.setHours(settings.workStartHour, settings.workStartMinute, 0, 0);
    return clamped;
  }

  if (hours > settings.workEndHour || (hours === settings.workEndHour && minutes > settings.workEndMinute)) {
    clamped.setHours(settings.workEndHour, settings.workEndMinute, 0, 0);
  }

  return clamped;
};

const moveToNextWorkingDayAtStart = (date: Date, settings: WorkingCalendarSettings) => {
  const next = new Date(date);
  while (isNonWorkingDay(next, settings.holidayDateSet, settings.closeOnWeekends)) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(settings.workStartHour, settings.workStartMinute, 0, 0);
  return next;
};

const countNonWorkingDaysBetween = (fromDate: Date, toDate: Date, settings: WorkingCalendarSettings) => {
  const start = toStartOfDay(fromDate);
  const end = toStartOfDay(toDate);
  let cursor = addDays(start, 1);
  let count = 0;

  while (cursor.getTime() <= end.getTime()) {
    if (isNonWorkingDay(cursor, settings.holidayDateSet, settings.closeOnWeekends)) {
      count += 1;
    }
    cursor = addDays(cursor, 1);
  }

  return count;
};

const addCalendarHoursWithNonWorkingOffset = (fromDate: Date, hours: number, settings: WorkingCalendarSettings) => {
  let target = new Date(fromDate.getTime() + hours * 60 * 60 * 1000);

  while (true) {
    const nonWorkingDays = countNonWorkingDaysBetween(fromDate, target, settings);
    const shifted = addDays(new Date(fromDate.getTime() + hours * 60 * 60 * 1000), nonWorkingDays);

    if (shifted.getTime() === target.getTime()) {
      break;
    }

    target = shifted;
  }

  target = clampToWorkingHours(target, settings);
  if (isNonWorkingDay(target, settings.holidayDateSet, settings.closeOnWeekends)) {
    target = moveToNextWorkingDayAtStart(target, settings);
  }

  return target;
};

const addCalendarDaysWithNonWorkingOffset = (fromDate: Date, calendarDays: number, settings: WorkingCalendarSettings) => {
  let target = addDays(fromDate, Math.max(0, Number(calendarDays || 0)));

  while (isNonWorkingDay(target, settings.holidayDateSet, settings.closeOnWeekends)) {
    target = addDays(target, 1);
  }

  return clampToWorkingHours(target, settings);
};

const expireUserPendingRequestsIfNeeded = async (userId: number, policy: ReaderBorrowPolicy) => {
  const now = new Date();
  const expiredPending = await prisma.borrow.findMany({
    where: {
      userId,
      status: 'PENDING',
      dueDate: { lt: now },
    },
    select: { id: true },
  });

  if (expiredPending.length > 0) {
    await prisma.borrow.updateMany({
      where: { id: { in: expiredPending.map((item) => item.id) } },
      data: { status: 'EXPIRED' },
    });
  }

  const expiredCount = await prisma.borrow.count({
    where: {
      userId,
      status: 'EXPIRED',
    },
  });

  if (expiredCount >= policy.pendingExpiryLockThreshold) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'locked' },
    });
    return { locked: true, expiredCount };
  }

  return { locked: false, expiredCount };
};

const getAvatarUrl = async (userId: number) => {
  const key = buildAvatarKey(userId);
  const config = await prisma.config.findUnique({ where: { key } });
  return config?.value || '';
};

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDateOnlyInput = (value: unknown) => {
  const raw = String(value || '').trim();
  const matched = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) return null;

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

// 1. TẠO PHIẾU MƯỢN MỚI (Admin/Librarian thực hiện tại quầy)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { studentId, bookId, borrowDate } = req.body;

    const borrowerId = Number(studentId);
    if (Number.isNaN(borrowerId)) {
      return res.status(400).json({ error: 'Độc giả không hợp lệ' });
    }

    const borrower = await prisma.user.findUnique({
      where: { id: borrowerId },
      include: { student: true },
    });

    if (!borrower || borrower.role !== 'student' || !borrower.student) {
      return res.status(400).json({ error: 'Không tìm thấy độc giả hợp lệ' });
    }

    const policy = getPolicyByReaderType(borrower.student.readerType);
    const workingCalendar = await getWorkingCalendarSettings();

    const pendingResult = await expireUserPendingRequestsIfNeeded(borrowerId, policy);
    if (pendingResult.locked) {
      return res.status(403).json({
        error: 'Tài khoản đã bị khóa do số lần yêu cầu mượn quá hạn vượt ngưỡng cho phép',
      });
    }

    if (borrower.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản độc giả đang bị khóa' });
    }

    // Kiểm tra sách còn sẵn không
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableQty <= 0) {
      return res.status(400).json({ error: 'Sách đã hết trong kho' });
    }

    const todayStart = toStartOfDay(new Date());

    const overdueBooks = await prisma.borrow.count({
      where: {
        userId: borrowerId,
        status: 'BORROWING',
        dueDate: { lt: todayStart },
      },
    });
    if (overdueBooks > 0) {
      return res.status(400).json({ error: 'Độc giả đang có sách quá hạn, không thể mượn thêm' });
    }

    const activeBorrows = await prisma.borrow.count({
      where: {
        userId: borrowerId,
        status: { in: ['BORROWING', 'PENDING'] },
      },
    });
    if (activeBorrows >= policy.maxActiveBorrows) {
      return res.status(400).json({
        error: `Độc giả đã đạt giới hạn mượn tối đa (${policy.maxActiveBorrows} cuốn, gồm cả chờ duyệt)`,
      });
    }

    const borrowStartDate = parseDateOnlyInput(borrowDate);
    if (!borrowStartDate) {
      return res.status(400).json({ error: 'Ngày mượn không hợp lệ, dùng định dạng YYYY-MM-DD' });
    }

    const dueDate = addCalendarDaysWithNonWorkingOffset(borrowStartDate, policy.borrowDurationDays, workingCalendar);

    // Thực hiện Transaction: Tạo phiếu mượn + Trừ số lượng sách
    const result = await prisma.$transaction([
      prisma.borrow.create({
        data: {
          userId: borrowerId,
          bookId: bookId,
          borrowDate: borrowStartDate,
          dueDate: dueDate,
          status: 'BORROWING',
          extensionCount: 0,
        }
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { availableQty: { decrement: 1 } }
      })
    ]);

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo phiếu mượn' });
  }
});

// 2. SINH VIÊN ĐĂNG KÝ MƯỢN ONLINE (FR-33, FR-11, FR-13)
router.post('/request', authenticateToken, async (req: any, res: any) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Chỉ sinh viên mới được tự mượn sách' });
    }

    const borrower = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!borrower || !borrower.student) {
      return res.status(400).json({ error: 'Không tìm thấy hồ sơ độc giả' });
    }

    const policy = getPolicyByReaderType(borrower.student.readerType);
    const workingCalendar = await getWorkingCalendarSettings();

    const pendingResult = await expireUserPendingRequestsIfNeeded(userId, policy);
    if (pendingResult.locked || borrower.status === 'locked') {
      return res.status(403).json({
        error: 'Tài khoản đã bị khóa do số lần yêu cầu mượn quá hạn vượt ngưỡng cho phép',
        status: 'locked',
      });
    }

    const todayStart = toStartOfDay(new Date());

    // --- KIỂM TRA QUY ĐỊNH (FR-11 & FR-13) ---
    // 1. Kiểm tra nợ quá hạn (FR-13)
    const overdueBooks = await prisma.borrow.count({
      where: {
        userId: userId,
        status: 'BORROWING',
        dueDate: { lt: todayStart }
      }
    });
    if (overdueBooks > 0) {
      return res.status(400).json({ error: 'Bạn đang có sách mượn quá hạn! Vui lòng trả sách trước khi mượn mới. (FR-13)' });
    }

    // 2. Kiểm tra giới hạn số lượng sách (bao gồm đang chờ duyệt)
    const activeBorrows = await prisma.borrow.count({
      where: {
        userId: userId,
        status: { in: ['BORROWING', 'PENDING'] }
      }
    });
    if (activeBorrows >= policy.maxActiveBorrows) {
      return res.status(400).json({
        error: `Bạn đã đạt giới hạn mượn tối đa (${policy.maxActiveBorrows} cuốn, gồm cả chờ duyệt). Vui lòng trả bớt sách.`,
      });
    }
    // ----------------------------------------

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableQty <= 0) return res.status(400).json({ error: 'Sách không khả dụng' });

    const pickupDeadline = addCalendarHoursWithNonWorkingOffset(new Date(), policy.pickupWaitHours, workingCalendar);

    const request = await prisma.borrow.create({
      data: {
        userId,
        bookId,
        dueDate: pickupDeadline,
        status: 'PENDING',
        extensionCount: 0,
      }
    });
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đăng ký mượn' });
  }
});

// 3. DUYỆT PHIẾU MƯỢN ONLINE
router.put('/:id/approve', authenticateToken, async (req: any, res: any) => {
  try {
    const borrowId = Number(req.params.id);
    const borrow = await prisma.borrow.findUnique({
      where: { id: borrowId },
      include: {
        book: true,
        user: { include: { student: true } },
      },
    });

    if (!borrow || borrow.status !== 'PENDING') return res.status(400).json({ error: 'Phiên không hợp lệ' });
    if (borrow.book.availableQty <= 0) return res.status(400).json({ error: 'Sách đã hết' });

    const readerType = borrow.user?.student?.readerType;
    const policy = getPolicyByReaderType(readerType);
    const workingCalendar = await getWorkingCalendarSettings();

    if (new Date() > new Date(borrow.dueDate)) {
      await prisma.borrow.update({
        where: { id: borrowId },
        data: { status: 'EXPIRED' },
      });

      await expireUserPendingRequestsIfNeeded(borrow.userId, policy);
      return res.status(400).json({ error: 'Yêu cầu mượn đã quá hạn nhận sách' });
    }

    const dueDate = addCalendarDaysWithNonWorkingOffset(new Date(), policy.borrowDurationDays, workingCalendar);

    const result = await prisma.$transaction([
      prisma.borrow.update({
        where: { id: borrowId },
        data: { status: 'BORROWING', borrowDate: new Date(), dueDate, extensionCount: 0 }
      }),
      prisma.book.update({
        where: { id: borrow.bookId },
        data: { availableQty: { decrement: 1 } }
      })
    ]);
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi duyệt phiếu' });
  }
});

// 3.1 TỪ CHỐI PHIẾU MƯỢN ONLINE
router.put('/:id/reject', authenticateToken, async (req: any, res: any) => {
  try {
    const borrowId = Number(req.params.id);
    const borrow = await prisma.borrow.findUnique({ where: { id: borrowId } });

    const isLegacyPendingLike =
      !!borrow &&
      borrow.status === 'BORROWING' &&
      !borrow.returnDate &&
      new Date(borrow.borrowDate).toDateString() === new Date(borrow.dueDate).toDateString();

    if (!borrow || (borrow.status !== 'PENDING' && !isLegacyPendingLike)) {
      return res.status(400).json({ error: 'Phiếu mượn không hợp lệ để từ chối' });
    }

    const updated = await prisma.borrow.update({
      where: { id: borrowId },
      data: { status: 'REJECTED', returnDate: null }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi từ chối phiếu mượn' });
  }
});

// 4. GIA HẠN SÁCH (FR-14)
router.put('/:id/extend', authenticateToken, async (req: any, res: any) => {
  try {
    const todayStart = toStartOfDay(new Date());
    const borrow = await prisma.borrow.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { include: { student: true } } },
    });

    if (!borrow || borrow.status !== 'BORROWING') return res.status(400).json({ error: 'Không thể gia hạn' });
    if (borrow.returnDate) return res.status(400).json({ error: 'Sách đã trả, không thể gia hạn' });

    const policy = getPolicyByReaderType(borrow.user?.student?.readerType);
    const workingCalendar = await getWorkingCalendarSettings();
    const dueDateStart = toStartOfDay(new Date(borrow.dueDate));

    if (dueDateStart.getTime() < todayStart.getTime()) {
      return res.status(400).json({ error: 'Sách đã quá hạn, không được phép gia hạn' });
    }

    const extensionCount = Number((borrow as any).extensionCount || 0);
    if (extensionCount >= 2) {
      return res.status(400).json({ error: 'Đã đạt số lần gia hạn tối đa (2 lần)' });
    }

    const renewalWindowStart = addDays(dueDateStart, -policy.renewalWindowDays);
    if (todayStart.getTime() < renewalWindowStart.getTime() || todayStart.getTime() > dueDateStart.getTime()) {
      return res.status(400).json({
        error: `Chỉ được gia hạn trong khoảng ${policy.renewalWindowDays} ngày trước hạn trả đến hết ngày hạn trả`,
      });
    }

    const newDueDate = new Date(borrow.dueDate);
    const extendedDueDate = addCalendarDaysWithNonWorkingOffset(newDueDate, policy.renewalDurationDays, workingCalendar);

    const updated = await prisma.borrow.update({
      where: { id: borrow.id },
      data: {
        dueDate: extendedDueDate,
        extensionCount: { increment: 1 },
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gia hạn' });
  }
});

// 5. LẤY DANH SÁCH PHIẾU QUÁ HẠN
router.get('/overdue', authenticateToken, async (req: any, res: any) => {
  try {
    const todayStart = toStartOfDay(new Date());
    const overdueBorrows = await prisma.borrow.findMany({
      where: {
        status: 'BORROWING',
        dueDate: { lt: todayStart }
      },
      include: {
        book: true,
        user: { include: { student: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(overdueBorrows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải danh sách quá hạn' });
  }
});

// 6. TÌM KIẾM PHIẾU MƯỢN TỔNG QUÁT
router.get('/search', authenticateToken, async (req: any, res: any) => {
  try {
    const { q } = req.query;
    const rawQ = String(q || '');
    const results = await prisma.borrow.findMany({
      where: {
        OR: [
          { user: { student: { studentCode: { contains: rawQ } } } },
          { book: { bookCode: { contains: rawQ } } },
          { book: { title: { contains: rawQ } } },
        ]
      },
      include: {
        book: true,
        user: { include: { student: true } }
      },
      take: 10,
      orderBy: { borrowDate: 'desc' }
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tìm kiếm phiếu mượn' });
  }
});

// 7. LẤY DANH SÁCH PHIẾU MƯỢN (Có lọc)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const { status, limit } = req.query;
    const whereClause = status && String(status).toLowerCase() !== 'all'
      ? { status: String(status) }
      : {};

    const borrows = await prisma.borrow.findMany({
      where: whereClause,
      include: {
        book: true,
        user: { include: { student: true } }
      },
      orderBy: { borrowDate: 'desc' },
      take: limit ? Number(limit) : undefined
    });
    res.json(borrows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải danh sách phiếu mượn' });
  }
});

// 8. LẤY CHI TIẾT 1 PHIẾU MƯỢN
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const borrowId = Number(req.params.id);
    if (Number.isNaN(borrowId)) {
      return res.status(400).json({ error: 'ID phiếu mượn không hợp lệ' });
    }

    const borrow = await prisma.borrow.findUnique({
      where: { id: borrowId },
      include: {
        book: true,
        user: { include: { student: true } }
      }
    });

    if (!borrow) {
      return res.status(404).json({ error: 'Không tìm thấy phiếu mượn' });
    }

    const avatarUrl = await getAvatarUrl(borrow.userId);
    res.json({
      ...borrow,
      user: {
        ...(borrow.user || {}),
        avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết phiếu mượn' });
  }
});

export default router;