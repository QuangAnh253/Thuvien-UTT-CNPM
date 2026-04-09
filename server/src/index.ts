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

dotenv.config();
const app = express();

// Cấu hình CORS để Frontend có thể gọi API không bị chặn
// Hỗ trợ cả development (localhost:5173) và production (từ env)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // Để Express hiểu được dữ liệu JSON gửi lên

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));