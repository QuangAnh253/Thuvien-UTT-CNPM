import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware: Chỉ Admin mới xem được báo cáo
const checkAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền truy cập' });
  next();
};

// 1. THỐNG KÊ TỔNG QUAN (Stats)
router.get('/stats', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const totalBooks = await prisma.book.aggregate({ _sum: { totalQty: true } });
    const borrowing = await prisma.borrow.count({ where: { status: 'BORROWING' } });
    const readers = await prisma.student.count();
    const overdue = await prisma.borrow.count({ 
      where: { status: 'BORROWING', dueDate: { lt: new Date() } } 
    });

    res.json({
      totalBooks: totalBooks._sum.totalQty || 0,
      borrowing,
      readers,
      overdue
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải thống kê' });
  }
});

// 2. MƯỢN THEO THÁNG (Borrow by month - cho biểu đồ)
router.get('/borrow-by-month', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const period = String(req.query.period || 'month');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const borrows = await prisma.borrow.findMany({
      where:
        period === 'day'
          ? {
              borrowDate: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
            }
          : period === 'year'
            ? {
                borrowDate: {
                  gte: new Date(`${currentYear - 4}-01-01`),
                  lt: new Date(`${currentYear + 1}-01-01`),
                },
              }
            : {
                borrowDate: {
                  gte: new Date(`${currentYear}-01-01`),
                  lt: new Date(`${currentYear + 1}-01-01`),
                },
              },
      select: { borrowDate: true }
    });

    let formattedData: Array<{ month: string; value: number }> = [];

    if (period === 'day') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const dailyData = Array(daysInMonth).fill(0);
      borrows.forEach((b) => {
        if (b.borrowDate) {
          const day = new Date(b.borrowDate).getDate();
          dailyData[day - 1]++;
        }
      });

      formattedData = dailyData.map((count, index) => ({
        month: `${index + 1}`,
        value: count,
      }));
    } else if (period === 'year') {
      const startYear = currentYear - 4;
      const yearData = Array(5).fill(0);
      borrows.forEach((b) => {
        if (b.borrowDate) {
          const year = new Date(b.borrowDate).getFullYear();
          const idx = year - startYear;
          if (idx >= 0 && idx < yearData.length) yearData[idx]++;
        }
      });

      formattedData = yearData.map((count, index) => ({
        month: `${startYear + index}`,
        value: count,
      }));
    } else {
      // Gom nhóm theo tháng bằng JS để an toàn với mọi loại Database (SQLite/Postgres)
      const monthlyData = Array(12).fill(0);
      borrows.forEach((b) => {
        if (b.borrowDate) {
          const month = new Date(b.borrowDate).getMonth();
          monthlyData[month]++;
        }
      });

      formattedData = monthlyData.map((count, index) => ({
        month: `T${index + 1}`,
        value: count,
      }));
    }

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải dữ liệu biểu đồ' });
  }
});

// 3. TOP ĐỘC GIẢ (Top Readers)
router.get('/top-readers', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const topUsers = await prisma.borrow.groupBy({
      by: ['userId'],
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5
    });

    const result = await Promise.all(topUsers.map(async (u) => {
      const student = await prisma.student.findUnique({ where: { userId: u.userId } });
      return {
        name: student?.fullName || 'Không rõ',
        studentId: student?.studentCode || '',
        borrows: u._count.userId
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải top độc giả' });
  }
});

// 4. TOP SÁCH MƯỢN NHIỀU NHẤT (Top Books)
router.get('/top-books', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const topBooks = await prisma.borrow.groupBy({
      by: ['bookId'],
      _count: { bookId: true },
      orderBy: { _count: { bookId: 'desc' } },
      take: 5
    });

    const result = await Promise.all(topBooks.map(async (b) => {
      const bookDetail = await prisma.book.findUnique({ where: { id: b.bookId } });
      return {
        name: bookDetail?.title || 'Không rõ',
        title: bookDetail?.title || 'Không rõ',
        category: bookDetail?.category || 'Khác',
        borrowCount: b._count.bookId,
        borrows: b._count.bookId,
      };
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải top sách' });
  }
});

// 5. DỮ LIỆU ĐỂ XUẤT EXCEL/PDF (Lấy toàn bộ phiếu mượn)
router.get('/export-data', authenticateToken, checkAdmin, async (req, res) => {
  try {
    const data = await prisma.borrow.findMany({
      include: { book: true, user: { include: { student: true } } },
      orderBy: { borrowDate: 'desc' }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải dữ liệu xuất' });
  }
});

export default router;