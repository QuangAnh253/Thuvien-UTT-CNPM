import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const buildAvatarKey = (userId: number) => `avatar:${userId}`;

const getAvatarUrl = async (userId: number) => {
  const key = buildAvatarKey(userId);
  const config = await prisma.config.findUnique({ where: { key } });
  return config?.value || '';
};

const parseDob = (value: any): Date => {
  const raw = String(value || '').trim();
  if (!raw) return new Date();

  const ddmmyyyy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

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
        user: {
          select: {
            username: true,
            role: true,
            status: true,
            _count: { select: { borrows: true } },
          },
        },
      },
      orderBy: { id: 'desc' }
    });

    const readersWithAvatars = await Promise.all(
      readers.map(async (reader) => ({
        ...reader,
        borrowedBooks: reader.user?._count.borrows ?? 0,
        avatarUrl: await getAvatarUrl(reader.userId),
      }))
    );

    res.json(readersWithAvatars);
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
              include: { book: true, returnRecord: true },
              orderBy: { borrowDate: 'desc' }
            }
          }
        }
      }
    });

    if (!reader) return res.status(404).json({ error: 'Không tìm thấy độc giả' });

    const avatarUrl = await getAvatarUrl(reader.userId);
    res.json({ ...reader, avatarUrl });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 3. THÊM ĐỘC GIẢ MỚI (Tương tự Register nhưng do Admin làm)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { studentCode, fullName, dob, email, phone, address, readerType, username, password } = req.body;

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
            readerType: String(readerType || '').toLowerCase().includes('giảng') ? 'lecturer' : 'student',
            dob: parseDob(dob)
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
    const { fullName, email, phone, address, readerType, studentCode, dob } = req.body;

    const normalizedReaderType = String(readerType || '').toLowerCase().includes('giảng')
      ? 'lecturer'
      : 'student';

    const updated = await prisma.student.update({
      where: { id: Number(req.params.id) },
      data: {
        fullName,
        email,
        phone,
        address,
        readerType: normalizedReaderType,
        studentCode: studentCode || undefined,
        dob: dob ? parseDob(dob) : undefined,
      }
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