import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. LẤY DANH SÁCH SÁCH (Public - Ai cũng xem được để tra cứu)
router.get('/', async (req, res) => {
  try {
    const { search, category, available } = req.query;
    let whereClause: any = {};

    // Tìm kiếm theo tên, tác giả, hoặc mã sách
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { author: { contains: String(search) } },
        { bookCode: { contains: String(search) } }
      ];
    }

    // Lọc theo thể loại
    if (category && category !== 'Tất cả') {
      whereClause.category = String(category);
    }

    // Lọc sách còn sẵn
    if (available === 'true') {
      whereClause.availableQty = { gt: 0 };
    }

    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy: { id: 'desc' }
    });
    
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách sách' });
  }
});

// 2. LẤY CHI TIẾT 1 CUỐN SÁCH (Public)
router.get('/:id', async (req: any, res: any) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: Number(req.params.id) },
      // Lấy kèm lịch sử mượn để sau này hiển thị ở BookDetailPage
      include: {
        borrows: {
          include: { user: { include: { student: true, staff: true } } },
          orderBy: { borrowDate: 'desc' }
        }
      }
    });
    
    if (!book) return res.status(404).json({ error: 'Không tìm thấy sách' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. THÊM SÁCH MỚI (Bảo vệ: Chỉ Admin/Librarian)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Không có quyền truy cập' });

    const { bookCode, title, author, category, publisher, publishYear, totalQty, imageUrl } = req.body;

    // Check trùng mã (FR-01)
    const existing = await prisma.book.findUnique({ where: { bookCode } });
    if (existing) return res.status(400).json({ error: 'Mã sách đã tồn tại trong hệ thống!' });

    const book = await prisma.book.create({
      data: {
        bookCode, title, author, category, publisher, 
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        publishYear: Number(publishYear),
        totalQty: Number(totalQty), 
        availableQty: Number(totalQty) // Mới thêm thì số lượng sẵn có = tổng số lượng
      }
    });
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi thêm sách' });
  }
});

// 4. SỬA THÔNG TIN SÁCH (Bảo vệ)
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Không có quyền truy cập' });

    const { bookCode, title, author, category, publisher, publishYear, totalQty, imageUrl } = req.body;
    const bookId = Number(req.params.id);

    const oldBook = await prisma.book.findUnique({ where: { id: bookId } });
    if (!oldBook) return res.status(404).json({ error: 'Không tìm thấy sách' });

    // Logic tính toán: Không cho giảm số lượng tổng xuống thấp hơn số sách đang bị mượn
    const borrowedQty = oldBook.totalQty - oldBook.availableQty;
    if (Number(totalQty) < borrowedQty) {
      return res.status(400).json({ error: `Không thể giảm tổng số lượng xuống dưới ${borrowedQty} vì sách đang được mượn!` });
    }

    const newAvailableQty = Number(totalQty) - borrowedQty;

    // Nếu đổi mã sách, check xem mã mới có bị trùng không
    if (bookCode !== oldBook.bookCode) {
       const existing = await prisma.book.findUnique({ where: { bookCode } });
       if (existing) return res.status(400).json({ error: 'Mã sách mới đã bị trùng với sách khác!' });
    }

    const updated = await prisma.book.update({
      where: { id: bookId },
      data: {
        bookCode, title, author, category, publisher, 
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        publishYear: Number(publishYear),
        totalQty: Number(totalQty), 
        availableQty: newAvailableQty
      }
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật sách' });
  }
});

// 5. XÓA SÁCH (Bảo vệ)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Không có quyền truy cập' });

    const bookId = Number(req.params.id);
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    
    if (!book) return res.status(404).json({ error: 'Không tìm thấy sách' });

    // Check điều kiện xóa: Chỉ được xóa khi toàn bộ sách đã nằm trong kho (không ai mượn)
    if (book.availableQty < book.totalQty) {
      return res.status(400).json({ error: 'Không thể xóa vì sách này đang có độc giả mượn!' });
    }

    await prisma.book.delete({ where: { id: bookId } });
    res.json({ message: 'Xóa sách thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi xóa sách' });
  }
});

export default router;