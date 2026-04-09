import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Middleware kiểm tra token
export const authenticateToken = (req: any, res: Response, next: NextFunction): any => {
  const authHeader = req.headers['authorization'];
  // FE gửi lên dạng: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Chưa xác thực (Không tìm thấy Token)' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    
    // Gắn thông tin user (đã giải mã từ token) vào request để các API sau dùng
    req.user = user; 
    next();
  });
};