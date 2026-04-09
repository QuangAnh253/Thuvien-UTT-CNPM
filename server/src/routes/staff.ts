import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 1. LẤY THÔNG TIN CÁ NHÂN (Dùng cho trang Profile của Staff)
router.get('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { username: true, role: true } } }
    });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy thông tin nhân viên' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 2. CẬP NHẬT THÔNG TIN CÁ NHÂN
router.put('/me', authenticateToken, async (req: any, res: any) => {
  try {
    const { fullName, email } = req.body;
    const updated = await prisma.staff.update({
      where: { userId: req.user.id },
      data: { fullName, email }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin' });
  }
});

// 2b. ĐỔI MẬT KHẨU NHÂN VIÊN (Dùng cho màn hình reset password)
router.put('/:id/password', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });

    const staffId = Number(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 1) {
      return res.status(400).json({ error: 'Mật khẩu mới không hợp lệ' });
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    const hashedPassword = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: staff.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi đặt lại mật khẩu' });
  }
});

// 3. LẤY CHI TIẾT NHÂN VIÊN
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });

    const staff = await prisma.staff.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { username: true, role: true, status: true } } },
    });

    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 4. CẬP NHẬT NHÂN VIÊN THEO ID
router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });

    const staffId = Number(req.params.id);
    const { fullName, email, phone, username, position, staffId: staffCode } = req.body;

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });

    const existingUsername = username
      ? await prisma.user.findFirst({ where: { username, NOT: { id: staff.userId } } })
      : null;
    if (existingUsername) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: staff.userId },
        data: {
          username: username || undefined,
          role: position === 'Quản lý' ? 'admin' : 'librarian',
        },
      }),
      prisma.staff.update({
        where: { id: staffId },
        data: {
          fullName,
          email,
          phone,
          staffCode: staffCode || undefined,
          position: position === 'Quản lý' ? 'manager' : 'librarian',
        } as any,
      }),
    ]);

    const updated = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: { select: { username: true, role: true, status: true } } },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật nhân viên' });
  }
});

// 5. LẤY DANH SÁCH NHÂN VIÊN (Chỉ Admin)
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền truy cập' });

    const staffList = await prisma.staff.findMany({
      include: { user: { select: { username: true, role: true, status: true } } },
      orderBy: { id: 'desc' }
    });
    res.json(staffList);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// 6. THÊM NHÂN VIÊN MỚI (Chỉ Admin)
router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });

    const { username, password, fullName, email, phone, role, staffId: staffCode, position } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'librarian',
        staff: {
          create: {
            fullName,
            email: email || '',
            phone: phone || '',
            position: position === 'Quản lý' || role === 'admin' ? 'manager' : 'librarian',
            staffCode: staffCode || `NV${Date.now()}`
          } as any
        }
      }
    });

    const createdStaff = await prisma.staff.findUnique({
      where: { userId: newUser.id },
      include: { user: { select: { username: true, role: true, status: true } } },
    });

    res.json(createdStaff);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo nhân viên' });
  }
});

// 7. XÓA NHÂN VIÊN (Chỉ Admin)
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });

    const staffId = Number(req.params.id);
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    
    if (!staff) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    if (staff.userId === req.user.id) return res.status(400).json({ error: 'Không thể tự xóa chính mình' });

    await prisma.user.delete({ where: { id: staff.userId } });
    res.json({ message: 'Đã xóa nhân viên' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;