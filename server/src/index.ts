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

// Danh sách origin được phép — đọc từ env hoặc dùng mặc định
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (Postman, mobile app, v.v.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));