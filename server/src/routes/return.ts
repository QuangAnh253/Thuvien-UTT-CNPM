import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. XÁC NHẬN TRẢ SÁCH (FR-15, 16, 17, 18)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { borrowId, fineAmount, exemptionReason } = req.body;

    // Tìm phiếu mượn
    const borrow = await prisma.borrow.findUnique({
      where: { id: Number(borrowId) },
      include: { book: true }
    });

    if (!borrow || borrow.status === 'RETURNED') {
      return res.status(400).json({ error: 'Phiếu mượn không hợp lệ' });
    }

    // Thực hiện Transaction: Cập nhật phiếu mượn + Tăng số lượng sách + Tạo bản ghi Return
    await prisma.$transaction([
      prisma.borrow.update({
        where: { id: Number(borrowId) },
        data: {
          status: 'RETURNED',
          returnDate: new Date()
        }
      }),
      prisma.book.update({
        where: { id: borrow.bookId },
        data: { availableQty: { increment: 1 } }
      }),
      prisma.$executeRaw`
        INSERT INTO "ReturnRecord" ("borrowId", "returnDate", "fineAmount", "exemptionReason")
        VALUES (${Number(borrowId)}, ${new Date()}, ${Number(fineAmount || 0)}, ${String(exemptionReason || '')})
      `
    ]);

    res.json({ message: 'Đã hoàn tất thủ tục trả sách và lưu bản ghi.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xử lý trả sách' });
  }
});

// 2. TÌM KIẾM PHIẾU MƯỢN ĐỂ TRẢ (Search theo mã SV hoặc mã sách)
router.get('/search', authenticateToken, async (req: any, res) => {
  try {
    const rawQ = String(req.query.q || '').trim();
    const pmMatch = rawQ.match(/^PM(\d+)$/i);
    const numericId = pmMatch ? Number(pmMatch[1]) : Number(rawQ);
    const hasBorrowIdQuery = Number.isInteger(numericId) && numericId > 0;

    const orConditions: any[] = [
      { user: { student: { studentCode: { contains: rawQ } } } },
      { user: { student: { fullName: { contains: rawQ } } } },
      { book: { bookCode: { contains: rawQ } } }
    ];
    if (hasBorrowIdQuery) {
      orConditions.push({ id: numericId });
    }

    const borrows = await prisma.borrow.findMany({
      where: {
        status: 'BORROWING',
        ...(rawQ
          ? {
              OR: orConditions,
            }
          : {})
      },
      include: {
        book: true,
        user: { include: { student: true } }
      },
      take: 20,
      orderBy: { borrowDate: 'desc' }
    });

    const results = borrows.map((b) => {
      const due = new Date(b.dueDate);
      const today = new Date();
      const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const overdueDays =
        todayStart.getTime() > dueStart.getTime()
          ? Math.floor((todayStart.getTime() - dueStart.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      return {
        ...b,
        overdueDays,
        fine: overdueDays * 5000,
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tìm kiếm' });
  }
});

export default router;