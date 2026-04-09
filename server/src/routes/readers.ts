import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. LẤY DANH SÁCH ĐỘC GIẢ (Chỉ Admin/Librarian)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Không có quyền' });

    const { search } = req.query;
    
    const readers = await prisma.student.findMany({
      where: {
        OR: [
          { fullName: { contains: String(search || '') } },
          { studentCode: { contains: String(search || '') } },
        ]
      },
      include: {
        user: { select: { username: true, role: true, status: true } }
      },
      orderBy: { id: 'desc' }
    });
    
    res.json(readers);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi tải danh sách độc giả' });
  }
});

// 2. LẤY CHI TIẾT ĐỘC GIẢ + LỊCH SỬ MƯỢN (ReaderDetailPage dùng cái này)
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const readerId = Number(req.params.id);
    const reader = await prisma.student.findUnique({
      where: { id: readerId },
      include: {
        user: {
          include: {
            borrows: {
              include: { book: true },
              orderBy: { borrowDate: 'desc' }
            }
          }
        }
      }
    });

    if (!reader) return res.status(404).json({ error: 'Không tìm thấy độc giả' });
    res.json(reader);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. THÊM ĐỘC GIẢ MỚI (Tương tự Register nhưng do Admin làm)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { studentCode, fullName, email, phone, address, username, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });

    const hashedPwd = await bcrypt.hash(password || 'default123', 10);

    // Tạo user và profile student cùng lúc
    const newReader = await prisma.user.create({
      data: {
        username,
        password: hashedPwd,
        role: 'student',
        student: {
          create: {
            studentCode, fullName, email, phone, address,
            readerType: 'student',
            dob: new Date()
          }
        }
      }
    });
    res.json(newReader);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo độc giả' });
  }
});

// 4. CẬP NHẬT THÔNG TIN
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { fullName, email, phone, address, readerType } = req.body;
    const updated = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: { fullName, email, phone, address, readerType }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật' });
  }
});

// 5. XÓA ĐỘC GIẢ (Chỉ xóa được nếu chưa từng mượn sách để đảm bảo data integrity)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { include: { _count: { select: { borrows: true } } } } }
    });

    if (student?.user._count.borrows && student.user._count.borrows > 0) {
      return res.status(400).json({ error: 'Không thể xóa độc giả đã có lịch sử mượn sách!' });
    }

    await prisma.user.delete({ where: { id: student?.userId } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa' });
  }
});

// 6. CẬP NHẬT TRẠNG THÁI KHÓA/MỞ KHÓA TÀI KHOẢN
router.put('/:id/status', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role === 'student') return res.status(403).json({ error: 'Không có quyền' });

    const studentId = Number(req.params.id);
    const { status } = req.body; // 'active' hoặc 'locked'

    // Tìm userId liên kết với studentId này
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Không tìm thấy sinh viên' });

    const updatedUser: any = await prisma.user.update({
      where: { id: student.userId },
      data: { status: status }
    });

    res.json({ message: 'Cập nhật trạng thái thành công', status: updatedUser.status });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật trạng thái' });
  }
});

export default router;