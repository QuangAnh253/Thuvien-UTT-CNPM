import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // === CONFIG ===
  await prisma.config.upsert({
    where: { key: 'fine_per_day' },
    update: {}, create: { key: 'fine_per_day', value: '5000' }
  })
  await prisma.config.upsert({
    where: { key: 'borrow_days' },
    update: {}, create: { key: 'borrow_days', value: '14' }
  })
  await prisma.config.upsert({
    where: { key: 'max_books' },
    update: {}, create: { key: 'max_books', value: '3' }
  })

  // === USERS ===
  const hash = async (p: string) => bcrypt.hash(p, 10)

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: await hash('admin123'), role: 'admin',
      staff: { create: { staffCode: 'NV001', fullName: 'Nguyễn Quản Trị', position: 'manager', email: 'admin@utt.edu.vn', phone: '' } }
    }
  })

  // Librarian
  await prisma.user.upsert({
    where: { username: 'thuthu' },
    update: {},
    create: { username: 'thuthu', password: await hash('thuthu123'), role: 'librarian',
      staff: { create: { staffCode: 'NV002', fullName: 'Trần Thị Thu', position: 'librarian', email: 'thuthu@utt.edu.vn', phone: '' } }
    }
  })

  // Student 1 (dùng để demo)
  const sv1 = await prisma.user.upsert({
    where: { username: 'sinhvien' },
    update: {},
    create: { username: 'sinhvien', password: await hash('sv123456'), role: 'student',
      student: { create: { studentCode: 'SV74001', fullName: 'Lê Văn Demo', readerType: 'student',
        email: 'demo@utt.edu.vn', phone: '0912345678', address: 'Hà Nội', dob: new Date('2003-01-15') } }
    },
    include: { student: true }
  })

  // === BOOKS (30 cuốn) ===
  const bookData = [
    { bookCode: 'IT001', title: 'Lập trình Java cơ bản', author: 'Nguyễn Văn A', category: 'Công nghệ thông tin', publisher: 'NXB ĐHQG', publishYear: 2022, totalQty: 5, availableQty: 3 },
    { bookCode: 'IT002', title: 'Cấu trúc dữ liệu và giải thuật', author: 'Trần Thị B', category: 'Công nghệ thông tin', publisher: 'NXB ĐHQG', publishYear: 2021, totalQty: 4, availableQty: 2 },
    { bookCode: 'IT003', title: 'Mạng máy tính', author: 'Lê Văn C', category: 'Công nghệ thông tin', publisher: 'NXB Bách Khoa', publishYear: 2020, totalQty: 6, availableQty: 4 },
    { bookCode: 'IT004', title: 'Hệ điều hành Linux', author: 'Phạm Thị D', category: 'Công nghệ thông tin', publisher: 'NXB TTTT', publishYear: 2022, totalQty: 3, availableQty: 1 },
    { bookCode: 'IT005', title: 'Lập trình Python', author: 'Hoàng Văn E', category: 'Công nghệ thông tin', publisher: 'NXB ĐHQG', publishYear: 2023, totalQty: 8, availableQty: 6 },
    { bookCode: 'IT006', title: 'Machine Learning cơ bản', author: 'Ngô Thị F', category: 'Công nghệ thông tin', publisher: 'NXB Khoa học', publishYear: 2022, totalQty: 3, availableQty: 0 },
    { bookCode: 'IT007', title: 'Lập trình Web với React', author: 'Vũ Văn G', category: 'Công nghệ thông tin', publisher: 'NXB TTTT', publishYear: 2023, totalQty: 5, availableQty: 3 },
    { bookCode: 'IT008', title: 'Thiết kế cơ sở dữ liệu', author: 'Đỗ Thị H', category: 'Công nghệ thông tin', publisher: 'NXB Bách Khoa', publishYear: 2021, totalQty: 4, availableQty: 2 },
    { bookCode: 'IT009', title: 'Trí tuệ nhân tạo', author: 'Bùi Văn I', category: 'Công nghệ thông tin', publisher: 'NXB ĐHQG', publishYear: 2023, totalQty: 3, availableQty: 3 },
    { bookCode: 'IT010', title: 'An toàn thông tin', author: 'Lý Thị K', category: 'Công nghệ thông tin', publisher: 'NXB TTTT', publishYear: 2022, totalQty: 2, availableQty: 2 },
    { bookCode: 'KT001', title: 'Kinh tế học vi mô', author: 'Mai Văn L', category: 'Kinh tế', publisher: 'NXB Kinh tế', publishYear: 2021, totalQty: 6, availableQty: 5 },
    { bookCode: 'KT002', title: 'Kế toán tài chính', author: 'Dương Thị M', category: 'Kinh tế', publisher: 'NXB Kinh tế', publishYear: 2020, totalQty: 4, availableQty: 4 },
    { bookCode: 'KT003', title: 'Quản trị học', author: 'Đinh Văn N', category: 'Kinh tế', publisher: 'NXB ĐHQG', publishYear: 2022, totalQty: 5, availableQty: 3 },
    { bookCode: 'VL001', title: 'Vật lý đại cương', author: 'Chu Thị O', category: 'Khoa học tự nhiên', publisher: 'NXB Bách Khoa', publishYear: 2020, totalQty: 8, availableQty: 7 },
    { bookCode: 'GT001', title: 'Cơ học kỹ thuật', author: 'Hà Văn P', category: 'Kỹ thuật', publisher: 'NXB GTVT', publishYear: 2021, totalQty: 5, availableQty: 4 },
  ]

  for (const b of bookData) {
    await prisma.book.upsert({ where: { bookCode: b.bookCode }, update: {}, create: b })
  }

  console.log('Seed completed!')
  console.log('Tài khoản demo:')
  console.log('  Admin: admin / admin123')
  console.log('  Thủ thư: thuthu / thuthu123')
  console.log('  Sinh viên: sinhvien / sv123456')
}

main().catch(console.error).finally(() => prisma.$disconnect())