import { prisma } from './prisma';
import {
  sendBorrowDueSoonReminderEmail,
  sendBorrowOverdueReminderEmail,
} from './email';

const ONE_HOUR_MS = 60 * 60 * 1000;
const REMINDER_3DAY_KEY_PREFIX = 'mail:borrow:due-soon';
const REMINDER_OVERDUE_KEY_PREFIX = 'mail:borrow:overdue';

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toSafeDate = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDiffDays = (fromDate: Date, toDate: Date) => {
  const fromStart = toStartOfDay(fromDate);
  const toStart = toStartOfDay(toDate);
  return Math.floor((toStart.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
};

const buildReminderSentKey = (prefix: string, borrowId: number, dateKey: string) =>
  `${prefix}:${borrowId}:${dateKey}`;

const wasReminderSent = async (key: string) => {
  const found = await prisma.config.findUnique({ where: { key } });
  return !!found;
};

const markReminderSent = async (key: string) => {
  await prisma.config.upsert({
    where: { key },
    create: { key, value: '1' },
    update: { value: '1' },
  });
};

const processBorrowReminders = async () => {
  const now = new Date();
  const dateKey = toDateKey(now);

  const borrows = await prisma.borrow.findMany({
    where: {
      status: 'BORROWING',
      returnDate: null,
    },
    include: {
      book: true,
      user: {
        include: {
          student: true,
        },
      },
    },
  });

  for (const borrow of borrows) {
    const dueDate = toSafeDate(borrow.dueDate);
    const student = borrow.user?.student;
    const email = String(student?.email || '').trim();

    if (!dueDate || !email || !student) {
      continue;
    }

    const diffDays = getDiffDays(now, dueDate);
    const readerName = String(student.fullName || borrow.user.username || 'Ban');
    const bookTitle = String(borrow.book?.title || 'Sach thu vien');

    if (diffDays === 3) {
      const key = buildReminderSentKey(REMINDER_3DAY_KEY_PREFIX, borrow.id, dateKey);
      if (await wasReminderSent(key)) {
        continue;
      }

      try {
        const sentResult = await sendBorrowDueSoonReminderEmail({
          to: email,
          readerName,
          bookTitle,
          dueDate,
          daysLeft: 3,
        });

        if (sentResult.sent) {
          await markReminderSent(key);
        }
      } catch (error) {
        console.error('[BorrowReminder] Failed to send due-soon email:', error);
      }
    }

    if (diffDays < 0) {
      const key = buildReminderSentKey(REMINDER_OVERDUE_KEY_PREFIX, borrow.id, dateKey);
      if (await wasReminderSent(key)) {
        continue;
      }

      try {
        const sentResult = await sendBorrowOverdueReminderEmail({
          to: email,
          readerName,
          bookTitle,
          dueDate,
          overdueDays: Math.abs(diffDays),
        });

        if (sentResult.sent) {
          await markReminderSent(key);
        }
      } catch (error) {
        console.error('[BorrowReminder] Failed to send overdue email:', error);
      }
    }
  }
};

export const startBorrowReminderJob = () => {
  const configuredMinutes = Number(process.env.BORROW_REMINDER_INTERVAL_MINUTES || '60');
  const intervalMs = Math.max(10, Number.isNaN(configuredMinutes) ? 60 : configuredMinutes) * 60 * 1000;

  const run = async () => {
    try {
      await processBorrowReminders();
    } catch (error) {
      console.error('[BorrowReminder] Job failed:', error);
    }
  };

  void run();
  setInterval(() => {
    void run();
  }, intervalMs || ONE_HOUR_MS);
};
