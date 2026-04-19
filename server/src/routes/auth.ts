import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { sendRegisterOtpEmail, sendResetPasswordOtpEmail } from '../lib/email';

const router = express.Router();

const buildPreferenceKey = (userId: number, scope: string) => `pref:${userId}:${scope}`;
const REGISTER_OTP_EXPIRES_SECONDS = 300;
const REGISTER_OTP_MAX_ATTEMPTS = 5;
const buildRegisterOtpKey = (otpId: string) => `otp:register:${otpId}`;
const RESET_PASSWORD_OTP_EXPIRES_SECONDS = 300;
const RESET_PASSWORD_OTP_MAX_ATTEMPTS = 5;
const buildResetPasswordOtpKey = (resetId: string) => `otp:reset-password:${resetId}`;
const USERNAME_REGEX = /^(?=.{6,20}$)(?!.*[._]{2})(?!.*[._]$)[a-z][a-z0-9._]*$/;
const RESERVED_USERNAMES = new Set(['admin', 'root', 'system', 'support', 'null', 'undefined']);

const normalizeEmail = (value: any) => String(value || '').trim().toLowerCase();
const normalizeUsername = (value: any) => String(value || '').trim().toLowerCase();

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateUsername = (value: any): string | null => {
  const username = normalizeUsername(value);
  if (!username) return 'Vui lòng nhập tên đăng nhập';
  if (!USERNAME_REGEX.test(username)) {
    return 'Username phải từ 6-20 ký tự, bắt đầu bằng chữ thường, chỉ gồm a-z, 0-9, ., _';
  }
  if (RESERVED_USERNAMES.has(username)) {
    return 'Username này không được phép sử dụng';
  }
  return null;
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const getAccountEmail = (user: any) => normalizeEmail(user?.student?.email || user?.staff?.email || '');

const maskEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const [localPart, domainPart] = normalized.split('@');

  if (!localPart || !domainPart) {
    return normalized;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] || '*'}***@${domainPart}`;
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`;
};

const findUserForPasswordResetByEmail = async (email: string) => {
  return prisma.user.findFirst({
    where: {
      OR: [
        { student: { email: { equals: email, mode: 'insensitive' } } },
        { staff: { email: { equals: email, mode: 'insensitive' } } },
      ],
    },
    include: {
      student: true,
      staff: true,
    },
  });
};

const readPreferenceIds = async (userId: number, scope: string): Promise<string[]> => {
  const key = buildPreferenceKey(userId, scope);
  const pref = await prisma.config.findUnique({ where: { key } });
  if (!pref?.value) return [];

  try {
    const parsed = JSON.parse(pref.value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
};

const writePreferenceIds = async (userId: number, scope: string, ids: string[]) => {
  const uniqueIds = Array.from(new Set(ids.map((item) => String(item).trim()).filter(Boolean)));
  const key = buildPreferenceKey(userId, scope);

  await prisma.config.upsert({
    where: { key },
    create: { key, value: JSON.stringify(uniqueIds) },
    update: { value: JSON.stringify(uniqueIds) },
  });

  return uniqueIds;
};

router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;
    const credential = String(username || '').trim();

    if (!credential || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập/email và mật khẩu' });
    }

    // 1. Tìm user trong database
    const user: any = await prisma.user.findFirst({
      where: {
        OR: [
          { username: credential },
          { student: { email: { equals: credential, mode: 'insensitive' } } },
          { staff: { email: { equals: credential, mode: 'insensitive' } } },
        ],
      },
      include: {
        staff: true,
        student: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Tên đăng nhập/email hoặc mật khẩu không chính xác' });
    }

    // 2. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Tên đăng nhập/email hoặc mật khẩu không chính xác' });
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
        studentCode: user.student?.studentCode || '',
        status: user.status,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// --- API KIỂM TRA USERNAME CÒN TRỐNG ---
router.get('/register/check-username', async (req, res): Promise<any> => {
  try {
    const username = normalizeUsername(req.query.username);

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({
        available: false,
        error: usernameError,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    return res.json({ available: !existingUser });
  } catch (error) {
    console.error('Check username error:', error);
    return res.status(500).json({ available: false, error: 'Lỗi server khi kiểm tra username' });
  }
});

// --- API GỬI OTP CHO ĐĂNG KÝ ---
router.post('/register/send-otp', async (req, res): Promise<any> => {
  try {
    const username = normalizeUsername(req.body?.username);
    const studentCode = String(req.body?.studentCode || '').trim();
    const email = normalizeEmail(req.body?.email);

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ error: usernameError });
    }

    if (!username || !studentCode || !email) {
      return res.status(400).json({ error: 'Vui lòng nhập đủ tên đăng nhập, mã sinh viên và email' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    const [existingUser, existingStudent] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.student.findUnique({ where: { studentCode } }),
    ]);

    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại!' });
    }

    if (existingStudent) {
      return res.status(400).json({ error: 'Mã sinh viên này đã được đăng ký!' });
    }

    const otpId = crypto.randomUUID();
    const otpCode = generateOtpCode();
    const expiresAt = Date.now() + REGISTER_OTP_EXPIRES_SECONDS * 1000;
    const key = buildRegisterOtpKey(otpId);

    await prisma.config.create({
      data: {
        key,
        value: JSON.stringify({
          code: otpCode,
          email,
          attempts: 0,
          expiresAt,
        }),
      },
    });

    let emailSent = false;
    try {
      const mailResult = await sendRegisterOtpEmail({
        to: email,
        otpCode,
        expiresInSeconds: REGISTER_OTP_EXPIRES_SECONDS,
      });
      emailSent = mailResult.sent;
    } catch (mailError) {
      console.error('Send OTP via Resend failed:', mailError);
    }

    if (!emailSent) {
      console.log(`[REGISTER OTP][DEV FALLBACK] ${email}: ${otpCode}`);
    }

    return res.json({
      message: emailSent
        ? 'Đã gửi mã OTP, vui lòng kiểm tra email.'
        : 'Đã tạo mã OTP. Môi trường hiện tại chưa gửi email thực tế.',
      otpId,
      expiresIn: REGISTER_OTP_EXPIRES_SECONDS,
      ...(process.env.NODE_ENV === 'production' || emailSent ? {} : { devOtp: otpCode }),
    });
  } catch (error) {
    console.error('Send register OTP error:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi OTP' });
  }
});

// --- API DANG KY (Danh cho Sinh vien) ---
router.post('/register', async (req, res): Promise<any> => {
  try {
    const username = normalizeUsername(req.body?.username);
    const { password, fullName, studentCode, email, phone, address, otpId, otpCode } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const usernameError = validateUsername(username);
    if (usernameError) {
      return res.status(400).json({ error: usernameError });
    }

    // 1. Kiem tra dau vao co ban
    if (!username || !password || !fullName || !studentCode || !normalizedEmail || !otpId || !otpCode) {
      return res.status(400).json({ error: 'Vui long nhap du cac truong bat buoc' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    const otpKey = buildRegisterOtpKey(String(otpId));
    const otpConfig = await prisma.config.findUnique({ where: { key: otpKey } });
    if (!otpConfig?.value) {
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    let otpPayload: {
      code: string;
      email: string;
      attempts: number;
      expiresAt: number;
    };

    try {
      otpPayload = JSON.parse(otpConfig.value);
    } catch {
      await prisma.config.deleteMany({ where: { key: otpKey } });
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (Date.now() > Number(otpPayload.expiresAt || 0)) {
      await prisma.config.deleteMany({ where: { key: otpKey } });
      return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.' });
    }

    if (normalizeEmail(otpPayload.email) !== normalizedEmail) {
      return res.status(400).json({ error: 'OTP không khớp với email đăng ký' });
    }

    if (Number(otpPayload.attempts || 0) >= REGISTER_OTP_MAX_ATTEMPTS) {
      await prisma.config.deleteMany({ where: { key: otpKey } });
      return res.status(400).json({ error: 'Bạn đã nhập sai OTP quá số lần cho phép' });
    }

    if (String(otpCode).trim() !== String(otpPayload.code || '').trim()) {
      const nextAttempts = Number(otpPayload.attempts || 0) + 1;

      if (nextAttempts >= REGISTER_OTP_MAX_ATTEMPTS) {
        await prisma.config.deleteMany({ where: { key: otpKey } });
        return res.status(400).json({ error: 'OTP không đúng. Bạn đã hết lượt thử, vui lòng gửi lại OTP.' });
      }

      await prisma.config.update({
        where: { key: otpKey },
        data: {
          value: JSON.stringify({
            ...otpPayload,
            attempts: nextAttempts,
          }),
        },
      });

      return res.status(400).json({ error: `OTP không đúng. Còn ${REGISTER_OTP_MAX_ATTEMPTS - nextAttempts} lượt thử.` });
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
            email: normalizedEmail,
            phone: phone || '',
            readerType: 'student',
            address: String(address || '').trim(),
            dob: new Date('2000-01-01'), // Mac dinh, cap nhat sau
          },
        },
      },
    });

    await prisma.config.deleteMany({ where: { key: otpKey } });

    res.json({ message: 'Dang ky tai khoan thanh cong!' });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Loi server khi dang ky' });
  }
});

router.post('/forgot-password/request', async (req, res): Promise<any> => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email' });
    }

    const user = await findUserForPasswordResetByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản phù hợp' });
    }

    const targetEmail = getAccountEmail(user);
    if (!targetEmail) {
      return res.status(400).json({ error: 'Tài khoản này chưa có email liên kết' });
    }

    const resetId = crypto.randomUUID();
    const otpCode = generateOtpCode();
    const expiresAt = Date.now() + RESET_PASSWORD_OTP_EXPIRES_SECONDS * 1000;
    const key = buildResetPasswordOtpKey(resetId);

    await prisma.config.create({
      data: {
        key,
        value: JSON.stringify({
          userId: user.id,
          email: targetEmail,
          code: otpCode,
          attempts: 0,
          expiresAt,
          verified: false,
        }),
      },
    });

    let emailSent = false;
    try {
      const mailResult = await sendResetPasswordOtpEmail({
        to: targetEmail,
        otpCode,
        expiresInSeconds: RESET_PASSWORD_OTP_EXPIRES_SECONDS,
      });
      emailSent = mailResult.sent;
    } catch (mailError) {
      console.error('Send reset OTP via Resend failed:', mailError);
    }

    if (!emailSent) {
      console.log(`[RESET OTP][DEV FALLBACK] ${targetEmail}: ${otpCode}`);
    }

    return res.json({
      message: emailSent
        ? 'Đã gửi mã OTP đặt lại mật khẩu, vui lòng kiểm tra email.'
        : 'Đã tạo mã OTP đặt lại mật khẩu. Môi trường hiện tại chưa gửi email thực tế.',
      resetId,
      maskedEmail: maskEmail(targetEmail),
      expiresIn: RESET_PASSWORD_OTP_EXPIRES_SECONDS,
      ...(process.env.NODE_ENV === 'production' || emailSent ? {} : { devOtp: otpCode }),
    });
  } catch (error) {
    console.error('Forgot password request error:', error);
    return res.status(500).json({ error: 'Lỗi server khi gửi OTP đặt lại mật khẩu' });
  }
});

router.post('/forgot-password/verify', async (req, res): Promise<any> => {
  try {
    const resetId = String(req.body?.resetId || '').trim();
    const otpCode = String(req.body?.otpCode || '').trim();

    if (!resetId || !otpCode) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mã OTP' });
    }

    const resetKey = buildResetPasswordOtpKey(resetId);
    const resetConfig = await prisma.config.findUnique({ where: { key: resetKey } });
    if (!resetConfig?.value) {
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    let resetPayload: {
      userId: number;
      email: string;
      code: string;
      attempts: number;
      expiresAt: number;
      verified: boolean;
    };

    try {
      resetPayload = JSON.parse(resetConfig.value);
    } catch {
      await prisma.config.deleteMany({ where: { key: resetKey } });
      return res.status(400).json({ error: 'OTP không hợp lệ hoặc đã hết hạn' });
    }

    if (Date.now() > Number(resetPayload.expiresAt || 0)) {
      await prisma.config.deleteMany({ where: { key: resetKey } });
      return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.' });
    }

    if (String(otpCode).trim() !== String(resetPayload.code || '').trim()) {
      const nextAttempts = Number(resetPayload.attempts || 0) + 1;

      if (nextAttempts >= RESET_PASSWORD_OTP_MAX_ATTEMPTS) {
        await prisma.config.deleteMany({ where: { key: resetKey } });
        return res.status(400).json({ error: 'OTP không đúng. Bạn đã hết lượt thử, vui lòng gửi lại OTP.' });
      }

      await prisma.config.update({
        where: { key: resetKey },
        data: {
          value: JSON.stringify({
            ...resetPayload,
            attempts: nextAttempts,
          }),
        },
      });

      return res.status(400).json({ error: `OTP không đúng. Còn ${RESET_PASSWORD_OTP_MAX_ATTEMPTS - nextAttempts} lượt thử.` });
    }

    await prisma.config.update({
      where: { key: resetKey },
      data: {
        value: JSON.stringify({
          ...resetPayload,
          verified: true,
          attempts: Number(resetPayload.attempts || 0),
          verifiedAt: Date.now(),
        }),
      },
    });

    return res.json({ message: 'OTP hợp lệ' });
  } catch (error) {
    console.error('Forgot password verify error:', error);
    return res.status(500).json({ error: 'Lỗi server khi xác thực OTP' });
  }
});

router.post('/forgot-password/confirm', async (req, res): Promise<any> => {
  try {
    const resetId = String(req.body?.resetId || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!resetId || !newPassword) {
      return res.status(400).json({ error: 'Vui lòng nhập mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const resetKey = buildResetPasswordOtpKey(resetId);
    const resetConfig = await prisma.config.findUnique({ where: { key: resetKey } });
    if (!resetConfig?.value) {
      return res.status(400).json({ error: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    let resetPayload: {
      userId: number;
      email: string;
      code: string;
      attempts: number;
      expiresAt: number;
      verified: boolean;
    };

    try {
      resetPayload = JSON.parse(resetConfig.value);
    } catch {
      await prisma.config.deleteMany({ where: { key: resetKey } });
      return res.status(400).json({ error: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    if (Date.now() > Number(resetPayload.expiresAt || 0)) {
      await prisma.config.deleteMany({ where: { key: resetKey } });
      return res.status(400).json({ error: 'Phiên đặt lại mật khẩu đã hết hạn' });
    }

    if (!resetPayload.verified) {
      return res.status(400).json({ error: 'Vui lòng xác thực OTP trước khi đặt lại mật khẩu' });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(resetPayload.userId) } });
    if (!user) {
      await prisma.config.deleteMany({ where: { key: resetKey } });
      return res.status(404).json({ error: 'Không tìm thấy tài khoản cần đặt lại mật khẩu' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.config.deleteMany({ where: { key: resetKey } });

    return res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    console.error('Forgot password confirm error:', error);
    return res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu' });
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

// --- API LƯU CÀI ĐẶT CÁ NHÂN (đọc/trạng thái thông báo) ---
router.get('/preferences/:scope', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const userId = Number(req.user?.id);
    const scope = String(req.params.scope || '').trim();

    if (!userId || !scope) {
      return res.status(400).json({ error: 'Thiếu user hoặc scope hợp lệ' });
    }

    const ids = await readPreferenceIds(userId, scope);
    return res.json({ ids });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi server khi tải preferences' });
  }
});

router.put('/preferences/:scope', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const userId = Number(req.user?.id);
    const scope = String(req.params.scope || '').trim();
    const incomingIds = Array.isArray(req.body?.ids) ? req.body.ids : [];

    if (!userId || !scope) {
      return res.status(400).json({ error: 'Thiếu user hoặc scope hợp lệ' });
    }

    const ids = await writePreferenceIds(userId, scope, incomingIds);
    return res.json({ ids });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi server khi lưu preferences' });
  }
});

router.patch('/preferences/:scope', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const userId = Number(req.user?.id);
    const scope = String(req.params.scope || '').trim();
    const id = String(req.body?.id || '').trim();

    if (!userId || !scope || !id) {
      return res.status(400).json({ error: 'Thiếu user/scope/id hợp lệ' });
    }

    const currentIds = await readPreferenceIds(userId, scope);
    const ids = await writePreferenceIds(userId, scope, [...currentIds, id]);
    return res.json({ ids });
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi server khi cập nhật preferences' });
  }
});

export default router;