import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // 1. Tìm user trong database
    const user: any = await prisma.user.findUnique({
      where: { username },
      include: {
        staff: true,
        student: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
    }

    // 2.5. Chặn sinh viên bị khóa đăng nhập
    if (user.role === 'student' && user.status === 'locked') {
      return res.status(403).json({
        error: 'Tài khoản bị khóa, vui lòng liên hệ quản trị viên',
        status: 'locked',
      });
    }

    // 3. Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' } // Token hết hạn sau 1 ngày
    );

    // Lấy tên hiển thị tùy theo role
    const fullName = user.staff ? user.staff.fullName : (user.student ? user.student.fullName : user.username);

    // 4. Trả về kết quả
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: fullName,
        status: user.status,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// --- API DANG KY (Danh cho Sinh vien) ---
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { username, password, fullName, studentCode, email, phone } = req.body;

    // 1. Kiem tra dau vao co ban
    if (!username || !password || !fullName || !studentCode) {
      return res.status(400).json({ error: 'Vui long nhap du cac truong bat buoc' });
    }

    // 2. Kiem tra xem username hoac ma SV da ton tai chua
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Ten dang nhap da ton tai!' });
    }

    const existingStudent = await prisma.student.findUnique({ where: { studentCode } });
    if (existingStudent) {
      return res.status(400).json({ error: 'Ma sinh vien nay da duoc dang ky!' });
    }

    // 3. Ma hoa mat khau
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Luu vao Database (Tao ca User va Student cung luc)
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'student', // Mac dinh dang ky moi la sinh vien
        student: {
          create: {
            studentCode,
            fullName,
            email: email || '',
            phone: phone || '',
            readerType: 'student',
            address: '', // Co the cho cap nhat sau o trang Profile
            dob: new Date('2000-01-01'), // Mac dinh, cap nhat sau
          },
        },
      },
    });

    res.json({ message: 'Dang ky tai khoan thanh cong!' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Loi server khi dang ky' });
  }
});

// --- API ĐỔI MẬT KHẨU (Cần đăng nhập) ---
router.put('/change-password', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Lấy ID từ token do middleware cung cấp

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
    }

    // 1. Tìm user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    // 2. Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    // 3. Cập nhật mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Đổi mật khẩu thành công!' });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: 'Lỗi server khi đổi mật khẩu' });
  }
});

export default router;