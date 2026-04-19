import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import readerRoutes from './routes/readers';
import borrowRoutes from './routes/borrow';
import returnRoutes from './routes/return';
import staffRoutes from './routes/staff';
import studentRoutes from './routes/student';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import { prisma } from './lib/prisma';
import { startBorrowReminderJob } from './lib/borrowReminderJob';

dotenv.config();
const app = express();

// Ưu tiên ALLOWED_ORIGINS (nhiều origin, cách nhau dấu phẩy).
// Tương thích ngược với FRONTEND_URL nếu dự án cũ đang dùng biến này.
const rawOrigins =
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  'http://localhost:5173';

const allowedOriginPatterns = rawOrigins
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isOriginAllowed = (origin: string) => {
  return allowedOriginPatterns.some((pattern) => {
    if (pattern === '*') return true;
    if (!pattern.includes('*')) return pattern === origin;

    const regexPattern = pattern
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\\\*/g, '.*');

    return new RegExp(`^${regexPattern}$`).test(origin);
  });
};

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, mobile app, v.v.)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Trả JSON rõ ràng khi bị chặn CORS để FE dễ debug khi deploy.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.message?.startsWith('CORS blocked:')) {
    return res.status(403).json({ error: err.message });
  }
  return next(err);
});

app.use(express.json());

// Route test để kiểm tra server
app.get('/api/ping', (req, res) => {
  res.json({ message: 'Server Thư viện UTT đang chạy mượt mà!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/readers', readerRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/return', returnRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Đã kết nối PostgreSQL thành công');
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
      startBorrowReminderJob();
    });
  } catch (error) {
    console.error('❌ Không thể kết nối PostgreSQL. Kiểm tra DATABASE_URL hoặc mạng:');
    console.error(error);
    process.exit(1);
  }
};

startServer();