import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware kiểm tra quyền (Chỉ sinh viên mới được gọi các API này)
const checkStudentRole = (req: any, res: any, next: any) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ sinh viên mới có quyền truy cập' });
  }
  next();
};

// 1. LẤY SÁCH ĐANG MƯỢN (Dùng cho Dashboard và ẩn nút mượn ở chi tiết sách)
router.get('/current-borrows', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    const currentBorrows = await prisma.borrow.findMany({
      where: {
        userId: req.user.id,
        status: 'BORROWING'
      },
      include: { book: true },
      orderBy: { dueDate: 'asc' } // Sắp xếp ngày phải trả gần nhất lên đầu
    });
    res.json(currentBorrows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải danh sách sách đang mượn' });
  }
});

// 2. LẤY LỊCH SỬ MƯỢN (Có filter cho trang History)
router.get('/history', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    const { status, from, to } = req.query;
    
    let whereClause: any = { userId: req.user.id };

    // Map status FE -> status DB
    const normalizedStatus = String(status || '').toLowerCase();
    const statusMap: Record<string, string> = {
      active: 'BORROWING',
      returned: 'RETURNED',
      overdue: 'BORROWING',
    };
    const dbStatus = normalizedStatus && normalizedStatus !== 'all'
      ? statusMap[normalizedStatus] || String(status)
      : undefined;

    if (dbStatus) {
      whereClause.status = dbStatus;
      // overdue = BORROWING + đã quá hạn
      if (normalizedStatus === 'overdue') {
        whereClause.dueDate = { lt: new Date() };
      }
    }

    // Filter theo khoảng thời gian
    if (from || to) {
      whereClause.borrowDate = {};
      if (from) whereClause.borrowDate.gte = new Date(String(from));
      if (to) whereClause.borrowDate.lte = new Date(String(to));
    }

    const history = await prisma.borrow.findMany({
      where: whereClause,
      include: { book: true },
      orderBy: { id: 'desc' } // Mới nhất lên đầu
    });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải lịch sử mượn sách' });
  }
});

// 3. LẤY YÊU CẦU ĐANG CHỜ DUYỆT (FR-33 - Dùng cho Dashboard)
router.get('/pending-requests', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    const pendingRequests = await prisma.borrow.findMany({
      where: {
        userId: req.user.id,
        status: 'PENDING'
      },
      include: { book: true },
      orderBy: { id: 'desc' }
    });
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải danh sách yêu cầu chờ duyệt' });
  }
});

// 4. LẤY THÔNG TIN HỒ SƠ SINH VIÊN (Dùng cho trang Profile)
router.get('/profile', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    const profile = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { 
        user: { select: { username: true, status: true } } 
      }
    });
    
    if (!profile) return res.status(404).json({ error: 'Không tìm thấy hồ sơ sinh viên' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải thông tin hồ sơ' });
  }
});

// 5. CẬP NHẬT THÔNG TIN HỒ SƠ SINH VIÊN
router.put('/profile', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    const { fullName, email, phone, address } = req.body;
    
    const updatedProfile = await prisma.student.update({
      where: { userId: req.user.id },
      data: { fullName, email, phone, address }
    });
    
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật thông tin hồ sơ' });
  }
});

// 6. LẤY DANH SÁCH THÔNG BÁO (Dùng cho quả chuông NotificationDropdown)
router.get('/notifications', authenticateToken, checkStudentRole, async (req: any, res: any) => {
  try {
    // Trả về mảng rỗng trước theo đúng chiến thuật. 
    // Sau này có thể query từ bảng Notification (nếu thêm vào schema)
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi tải thông báo' });
  }
});

export default router;