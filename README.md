# HỆ THỐNG QUẢN LÝ THƯ VIỆN 

## 1. Giới thiệu tổng quan
Dự án phần mềm Quản lý Thư viện được phát triển nhằm mục đích số hóa quy trình quản lý đầu sách, kiểm soát hoạt động mượn trả và hỗ trợ độc giả tra cứu tài liệu trực tuyến. Phần mềm cung cấp các phân hệ riêng biệt cho Quản trị viên (Admin), Thủ thư (Librarian) và Độc giả (Student).

## 2. Kiến trúc và Công nghệ sử dụng
- Khung giao diện (Frontend): ReactJS, Tailwind CSS
- Máy chủ ứng dụng (Backend): Node.js, Express
- Hệ quản trị cơ sở dữ liệu: SQLite
- Công cụ ánh xạ dữ liệu (ORM): Prisma

## 3. Cấu trúc thư mục cốt lõi
- /client: Chứa mã nguồn giao diện người dùng.
- /server: Chứa mã nguồn máy chủ, API và cấu hình cơ sở dữ liệu.
- /server/prisma/schema.prisma: File định nghĩa cấu trúc cơ sở dữ liệu vật lý.

## 4. Hướng dẫn cài đặt và vận hành (Môi trường phát triển)

### Yêu cầu hệ thống
- Node.js (phiên bản 18.x trở lên)
- Trình quản lý gói npm hoặc yarn

### Các bước cài đặt
Bước 1: Thiết lập môi trường máy chủ (Backend)
1. Di chuyển vào thư mục server: `cd server`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Cấu hình tệp biến môi trường `.env` theo mẫu: `DATABASE_URL="file:./dev.db"`
4. Khởi tạo cơ sở dữ liệu: `npx prisma db push` và `npx prisma generate`
5. Khởi động máy chủ: `npm run dev` (Máy chủ hoạt động tại cổng 3001)

Bước 2: Thiết lập giao diện người dùng (Frontend)
1. Mở một terminal mới, di chuyển vào thư mục client: `cd client`
2. Cài đặt các gói phụ thuộc: `npm install`
3. Khởi động ứng dụng: `npm run dev` (Giao diện hoạt động tại cổng 5173)

## 5. Nhóm phát triển
- Sinh viên thực hiện: Lê Quang Anh, Nguyễn Thị Hồng, Nguyễn Văn Lộc, Vũ Thị Thùy Trang, Nguyễn Duy Thành
- Lớp: 74DCHT22
- Đơn vị: Trường Đại học Công nghệ Giao thông Vận tải