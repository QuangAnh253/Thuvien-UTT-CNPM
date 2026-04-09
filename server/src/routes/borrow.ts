import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. TẠO PHIẾU MƯỢN MỚI (Admin/Librarian thực hiện tại quầy)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { studentId, bookId, days } = req.body;

    // Kiểm tra sách còn sẵn không
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableQty <= 0) {
      return res.status(400).json({ error: 'Sách đã hết trong kho' });
    }

    // Kiểm tra sinh viên có đang mượn quá hạn hoặc quá số lượng không (FR-11)
    const activeBorrows = await prisma.borrow.count({
      where: { userId: studentId, status: 'BORROWING' }
    });
    if (activeBorrows >= 5) {
      return res.status(400).json({ error: 'Sinh viên đã mượn tối đa 5 cuốn sách' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (days || 14));

    // Thực hiện Transaction: Tạo phiếu mượn + Trừ số lượng sách
    const result = await prisma.$transaction([
      prisma.borrow.create({
        data: {
          userId: studentId,
          bookId: bookId,
          dueDate: dueDate,
          status: 'BORROWING'
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

    // --- KIỂM TRA QUY ĐỊNH (FR-11 & FR-13) ---
    // 1. Kiểm tra nợ quá hạn (FR-13)
    const overdueBooks = await prisma.borrow.count({
      where: {
        userId: userId,
        status: 'BORROWING',
        dueDate: { lt: new Date() }
      }
    });
    if (overdueBooks > 0) {
      return res.status(400).json({ error: 'Bạn đang có sách mượn quá hạn! Vui lòng trả sách trước khi mượn mới. (FR-13)' });
    }

    // 2. Kiểm tra giới hạn số lượng sách (FR-11 - Tối đa 5 cuốn)
    const activeBorrows = await prisma.borrow.count({
      where: {
        userId: userId,
        status: { in: ['BORROWING', 'PENDING'] }
      }
    });
    if (activeBorrows >= 5) {
      return res.status(400).json({ error: 'Bạn đã đạt giới hạn mượn tối đa (5 cuốn). Vui lòng trả bớt sách. (FR-11)' });
    }
    // ----------------------------------------

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.availableQty <= 0) return res.status(400).json({ error: 'Sách không khả dụng' });

    const request = await prisma.borrow.create({
      data: {
        userId,
        bookId,
        dueDate: new Date(),
        status: 'PENDING'
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
    const borrow = await prisma.borrow.findUnique({ where: { id: borrowId }, include: { book: true } });

    if (!borrow || borrow.status !== 'PENDING') return res.status(400).json({ error: 'Phiên không hợp lệ' });
    if (borrow.book.availableQty <= 0) return res.status(400).json({ error: 'Sách đã hết' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const result = await prisma.$transaction([
      prisma.borrow.update({
        where: { id: borrowId },
        data: { status: 'BORROWING', borrowDate: new Date(), dueDate }
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
    const borrow = await prisma.borrow.findUnique({ where: { id: Number(req.params.id) } });
    if (!borrow || borrow.status !== 'BORROWING') return res.status(400).json({ error: 'Không thể gia hạn' });

    const newDueDate = new Date(borrow.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 7); // Gia hạn thêm 7 ngày

    const updated = await prisma.borrow.update({
      where: { id: borrow.id },
      data: { dueDate: newDueDate }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gia hạn' });
  }
});

// 5. LẤY DANH SÁCH PHIẾU QUÁ HẠN
router.get('/overdue', authenticateToken, async (req: any, res: any) => {
  try {
    const today = new Date();
    const overdueBorrows = await prisma.borrow.findMany({
      where: {
        status: 'BORROWING',
        dueDate: { lt: today }
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

    res.json(borrow);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết phiếu mượn' });
  }
});

export default router;