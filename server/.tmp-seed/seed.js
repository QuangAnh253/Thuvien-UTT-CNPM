"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
const FINE_PER_DAY = 5000;
const studentNames = [
    'Lê Minh Anh',
    'Nguyễn Hoàng Anh',
    'Trần Gia Bảo',
    'Phạm Khánh Duy',
    'Hoàng Gia Hân',
    'Bùi Minh Khang',
    'Đỗ Ngọc Khánh',
    'Vũ Quỳnh Linh',
    'Nguyễn Hải Long',
    'Lý Minh Ngọc',
    'Phan Quốc Bảo',
    'Trịnh Thu Trang',
    'Ngô Đức Trọng',
    'Dương Hoài Vũ',
    'Mai Thu Yến',
    'Tạ Minh Châu',
    'Lê Quốc Duy',
    'Nguyễn Phương Anh',
    'Trần Nhật Nam',
    'Phạm Hoàng Phúc',
    'Hoàng Gia Bảo',
    'Bùi Thị Hồng',
    'Đỗ Minh Khoa',
    'Vũ Thanh Lam',
    'Nguyễn Khánh Vy',
    'Lâm Gia Huy',
    'Phan Minh Quân',
    'Trịnh Kim Ngân',
    'Ngô Thùy Dung',
    'Dương Đức Huy',
    'Mai Hồng Nhung',
    'Tô Gia Khánh',
    'Lê Thị Lan Anh',
    'Hà Quốc Bảo',
    'Chu Minh Đức',
];
const lecturerNames = [
    'TS. Nguyễn Quốc Anh',
    'ThS. Trần Thị Bích',
    'TS. Lê Minh Cường',
    'ThS. Phạm Ngọc Diệp',
    'TS. Hoàng Việt Đông',
    'ThS. Đào Tuấn Giang',
    'TS. Vũ Hồng Hải',
    'ThS. Bùi Thị Hạnh',
    'TS. Đặng Quang Khoa',
    'ThS. Lương Hải Nam',
    'TS. Phan Thu Oanh',
    'ThS. Chu Ngọc Phương',
    'TS. Hà Quốc Sơn',
    'ThS. Đinh Văn Tuyên',
    'TS. Nguyễn Minh Uyên',
];
const bookSeeds = [
    { bookCode: 'CNTT001', title: 'Clean Code', author: 'Robert C. Martin', category: 'Công nghệ thông tin', publisher: 'Prentice Hall', publishYear: 2008, totalQty: 6 },
    { bookCode: 'CNTT002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', category: 'Công nghệ thông tin', publisher: 'Addison-Wesley', publishYear: 2019, totalQty: 5 },
    { bookCode: 'CNTT003', title: 'Design Patterns', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', category: 'Công nghệ thông tin', publisher: 'Addison-Wesley', publishYear: 1994, totalQty: 5 },
    { bookCode: 'CNTT004', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', category: 'Công nghệ thông tin', publisher: 'MIT Press', publishYear: 2009, totalQty: 4 },
    { bookCode: 'CNTT005', title: 'Computer Networks', author: 'Andrew S. Tanenbaum, David J. Wetherall', category: 'Công nghệ thông tin', publisher: 'Pearson', publishYear: 2011, totalQty: 4 },
    { bookCode: 'CNTT006', title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', category: 'Công nghệ thông tin', publisher: 'Wiley', publishYear: 2018, totalQty: 5 },
    { bookCode: 'CNTT007', title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', category: 'Công nghệ thông tin', publisher: 'McGraw-Hill', publishYear: 2019, totalQty: 5 },
    { bookCode: 'CNTT008', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', category: 'Công nghệ thông tin', publisher: 'Pearson', publishYear: 2021, totalQty: 4 },
    { bookCode: 'CNTT009', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 'Công nghệ thông tin', publisher: "O'Reilly Media", publishYear: 2008, totalQty: 4 },
    { bookCode: 'CNTT010', title: "You Don't Know JS Yet: Get Started", author: 'Kyle Simpson', category: 'Công nghệ thông tin', publisher: 'Independently Published', publishYear: 2020, totalQty: 4 },
    { bookCode: 'KT001', title: 'Nguyên lý kinh tế học', author: 'N. Gregory Mankiw', category: 'Kinh tế', publisher: 'Cengage Learning', publishYear: 2021, totalQty: 5 },
    { bookCode: 'KT002', title: 'Kinh tế học', author: 'Paul A. Samuelson, William D. Nordhaus', category: 'Kinh tế', publisher: 'McGraw-Hill', publishYear: 2010, totalQty: 5 },
    { bookCode: 'KT003', title: 'Tư bản trong thế kỷ XXI', author: 'Thomas Piketty', category: 'Kinh tế', publisher: 'Harvard University Press', publishYear: 2014, totalQty: 4 },
    { bookCode: 'KT004', title: 'The Wealth of Nations', author: 'Adam Smith', category: 'Kinh tế', publisher: 'Penguin Classics', publishYear: 1776, totalQty: 4 },
    { bookCode: 'KT005', title: 'Freakonomics', author: 'Steven D. Levitt, Stephen J. Dubner', category: 'Kinh tế', publisher: 'William Morrow', publishYear: 2005, totalQty: 4 },
    { bookCode: 'KT006', title: 'The Intelligent Investor', author: 'Benjamin Graham', category: 'Kinh tế', publisher: 'Harper Business', publishYear: 2006, totalQty: 4 },
    { bookCode: 'KT007', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Kinh tế', publisher: 'Farrar, Straus and Giroux', publishYear: 2011, totalQty: 4 },
    { bookCode: 'KT008', title: 'Good Economics for Hard Times', author: 'Abhijit V. Banerjee, Esther Duflo', category: 'Kinh tế', publisher: 'PublicAffairs', publishYear: 2019, totalQty: 4 },
    { bookCode: 'KT009', title: 'Common Sense Economics', author: 'James D. Gwartney, Richard L. Stroup, Dwight R. Lee', category: 'Kinh tế', publisher: "St. Martin's Press", publishYear: 2016, totalQty: 4 },
    { bookCode: 'KT010', title: 'Business Model Generation', author: 'Alexander Osterwalder, Yves Pigneur', category: 'Kinh tế', publisher: 'Wiley', publishYear: 2010, totalQty: 4 },
    { bookCode: 'VH001', title: 'Truyện Kiều', author: 'Nguyễn Du', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 5 },
    { bookCode: 'VH002', title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài', category: 'Văn Học', publisher: 'NXB Kim Đồng', publishYear: 2018, totalQty: 5 },
    { bookCode: 'VH003', title: 'Số đỏ', author: 'Vũ Trọng Phụng', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2019, totalQty: 4 },
    { bookCode: 'VH004', title: 'Chí Phèo', author: 'Nam Cao', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 4 },
    { bookCode: 'VH005', title: 'Lão Hạc', author: 'Nam Cao', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 4 },
    { bookCode: 'VH006', title: 'Tắt đèn', author: 'Ngô Tất Tố', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2019, totalQty: 4 },
    { bookCode: 'VH007', title: 'Vợ nhặt', author: 'Kim Lân', category: 'Văn Học', publisher: 'NXB Kim Đồng', publishYear: 2018, totalQty: 4 },
    { bookCode: 'VH008', title: 'Nỗi buồn chiến tranh', author: 'Bảo Ninh', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2021, totalQty: 4 },
    { bookCode: 'VH009', title: 'Tôi thấy hoa vàng trên cỏ xanh', author: 'Nguyễn Nhật Ánh', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2022, totalQty: 5 },
    { bookCode: 'VH010', title: 'Cánh đồng bất tận', author: 'Nguyễn Ngọc Tư', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2021, totalQty: 4 },
    { bookCode: 'KH001', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Khoa học tự nhiên', publisher: 'Bantam Books', publishYear: 1988, totalQty: 4 },
    { bookCode: 'KH002', title: 'The Selfish Gene', author: 'Richard Dawkins', category: 'Khoa học tự nhiên', publisher: 'Oxford University Press', publishYear: 2006, totalQty: 4 },
    { bookCode: 'KH003', title: 'Cosmos', author: 'Carl Sagan', category: 'Khoa học tự nhiên', publisher: 'Random House', publishYear: 1980, totalQty: 4 },
    { bookCode: 'KH004', title: 'The Gene: An Intimate History', author: 'Siddhartha Mukherjee', category: 'Khoa học tự nhiên', publisher: 'Scribner', publishYear: 2016, totalQty: 4 },
    { bookCode: 'KH005', title: 'The Elegant Universe', author: 'Brian Greene', category: 'Khoa học tự nhiên', publisher: 'W. W. Norton & Company', publishYear: 1999, totalQty: 4 },
    { bookCode: 'KH006', title: 'On the Origin of Species', author: 'Charles Darwin', category: 'Khoa học tự nhiên', publisher: 'John Murray', publishYear: 1859, totalQty: 4 },
    { bookCode: 'KH007', title: 'Silent Spring', author: 'Rachel Carson', category: 'Khoa học tự nhiên', publisher: 'Houghton Mifflin', publishYear: 1962, totalQty: 4 },
    { bookCode: 'KH008', title: 'The Body: A Guide for Occupants', author: 'Bill Bryson', category: 'Khoa học tự nhiên', publisher: 'Doubleday', publishYear: 2019, totalQty: 4 },
    { bookCode: 'KH009', title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', category: 'Khoa học tự nhiên', publisher: 'Crown', publishYear: 2010, totalQty: 4 },
    { bookCode: 'KH010', title: 'The Hidden Life of Trees', author: 'Peter Wohlleben', category: 'Khoa học tự nhiên', publisher: 'Greystone Books', publishYear: 2015, totalQty: 4 },
    { bookCode: 'LS001', title: 'Việt Nam sử lược', author: 'Trần Trọng Kim', category: 'Lịch sử', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 5 },
    { bookCode: 'LS002', title: 'Sử ký', author: 'Tư Mã Thiên', category: 'Lịch sử', publisher: 'NXB Văn hóa - Văn nghệ', publishYear: 2019, totalQty: 4 },
    { bookCode: 'LS003', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Lịch sử', publisher: 'Harvill Secker', publishYear: 2014, totalQty: 4 },
    { bookCode: 'LS004', title: 'The Silk Roads: A New History of the World', author: 'Peter Frankopan', category: 'Lịch sử', publisher: 'Bloomsbury', publishYear: 2015, totalQty: 4 },
    { bookCode: 'LS005', title: "A People's History of the United States", author: 'Howard Zinn', category: 'Lịch sử', publisher: 'Harper & Row', publishYear: 2015, totalQty: 4 },
    { bookCode: 'LS006', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', category: 'Lịch sử', publisher: 'W. W. Norton & Company', publishYear: 1997, totalQty: 4 },
    { bookCode: 'LS007', title: 'The Rise and Fall of the Third Reich', author: 'William L. Shirer', category: 'Lịch sử', publisher: 'Simon & Schuster', publishYear: 1960, totalQty: 4 },
    { bookCode: 'LS008', title: 'The Second World War', author: 'Antony Beevor', category: 'Lịch sử', publisher: 'Back Bay Books', publishYear: 2012, totalQty: 4 },
    { bookCode: 'LS009', title: 'The Wright Brothers', author: 'David McCullough', category: 'Lịch sử', publisher: 'Simon & Schuster', publishYear: 2015, totalQty: 4 },
    { bookCode: 'LS010', title: 'History of the Peloponnesian War', author: 'Thucydides', category: 'Lịch sử', publisher: 'Penguin Classics', publishYear: 2009, totalQty: 4 },
    { bookCode: 'NN001', title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'Ngoại ngữ', publisher: 'Cambridge University Press', publishYear: 2019, totalQty: 6 },
    { bookCode: 'NN002', title: 'Practical English Usage', author: 'Michael Swan', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2016, totalQty: 5 },
    { bookCode: 'NN003', title: 'Oxford Word Skills', author: 'Ruth Gairns, Stuart Redman', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2012, totalQty: 5 },
    { bookCode: 'NN004', title: 'New Headway Beginner', author: 'Liz Soars, John Soars', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2015, totalQty: 4 },
    { bookCode: 'NN005', title: 'Japanese for Busy People I', author: 'AJALT', category: 'Ngoại ngữ', publisher: 'Kodansha International', publishYear: 2011, totalQty: 4 },
    { bookCode: 'NN006', title: 'Minna no Nihongo I', author: '3A Corporation', category: 'Ngoại ngữ', publisher: '3A Network', publishYear: 2018, totalQty: 4 },
    { bookCode: 'NN007', title: 'Korean Grammar in Use: Beginning', author: 'Ahn Jean-myung, Lee Kyung-ah, Han Hoo-youn', category: 'Ngoại ngữ', publisher: 'Darakwon', publishYear: 2010, totalQty: 4 },
    { bookCode: 'NN008', title: 'New Practical Chinese Reader 1', author: 'Liu Xun', category: 'Ngoại ngữ', publisher: 'Beijing Language and Culture University Press', publishYear: 2006, totalQty: 4 },
    { bookCode: 'NN009', title: 'Practice Makes Perfect: Complete Spanish Grammar', author: 'Gilda Nissenberg', category: 'Ngoại ngữ', publisher: 'McGraw-Hill Education', publishYear: 2013, totalQty: 4 },
    { bookCode: 'NN010', title: 'Easy French Step-by-Step', author: 'Myrna Bell Rochester', category: 'Ngoại ngữ', publisher: 'McGraw-Hill Education', publishYear: 2015, totalQty: 4 },
    { bookCode: 'KTH001', title: 'Mechanics of Materials', author: 'R.C. Hibbeler', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2017, totalQty: 5 },
    { bookCode: 'KTH002', title: 'Engineering Mechanics: Statics', author: 'J.L. Meriam, L.G. Kraige', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2015, totalQty: 5 },
    { bookCode: 'KTH003', title: 'Engineering Mechanics: Dynamics', author: 'J.L. Meriam, L.G. Kraige', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2016, totalQty: 5 },
    { bookCode: 'KTH004', title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Kỹ Thuật', publisher: 'McGraw-Hill', publishYear: 2016, totalQty: 4 },
    { bookCode: 'KTH005', title: 'Thermodynamics: An Engineering Approach', author: 'Yunus A. Cengel, Michael A. Boles', category: 'Kỹ Thuật', publisher: 'McGraw-Hill', publishYear: 2019, totalQty: 4 },
    { bookCode: 'KTH006', title: 'Electrical Engineering: Principles and Applications', author: 'Allan R. Hambley', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2017, totalQty: 4 },
    { bookCode: 'KTH007', title: 'Control Systems Engineering', author: 'Norman S. Nise', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2019, totalQty: 4 },
    { bookCode: 'KTH008', title: 'Manufacturing Engineering and Technology', author: 'Serope Kalpakjian, Steven R. Schmid', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2014, totalQty: 4 },
    { bookCode: 'KTH009', title: 'Fundamentals of Heat and Mass Transfer', author: 'Frank P. Incropera, David P. DeWitt', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2011, totalQty: 4 },
    { bookCode: 'KTH010', title: 'Structural Analysis', author: 'Russell C. Hibbeler', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2018, totalQty: 4 },
];
const BORROW_CATEGORY_CYCLE = [
    'Công nghệ thông tin',
    'Kinh tế',
    'Văn Học',
    'Khoa học tự nhiên',
    'Lịch sử',
    'Ngoại ngữ',
    'Kỹ Thuật',
];
const toStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setSeconds(0, 0);
    return next;
};
const addMinutes = (date, minutes) => {
    const next = new Date(date);
    next.setMinutes(next.getMinutes() + minutes);
    next.setSeconds(0, 0);
    return next;
};
const distributeDate = (start, end, index, total, minuteOffset = 0) => {
    const safeTotal = Math.max(1, total);
    const ratio = safeTotal === 1 ? 0 : index / (safeTotal - 1);
    const span = end.getTime() - start.getTime();
    const next = new Date(start.getTime() + Math.floor(span * ratio));
    next.setSeconds(0, 0);
    return addMinutes(next, minuteOffset);
};
const readerPlans = studentNames.map((_, index) => ({
    returned2025: index < 27 ? 30 : 31,
    returned2026: index < 22 ? 10 : 11,
    activeCurrent: index < 7 ? 1 : 0,
    overdueCurrent: index >= 7 && index < 11 ? 1 : 0,
}));
const fallbackReaderPlan = {
    returned2025: 12,
    returned2026: 5,
    activeCurrent: 0,
    overdueCurrent: 0,
};
const mustHaveBorrowUsernames = [
    'gv001', 'gv002', 'gv003', 'gv004', 'gv005',
    'gv006', 'gv007', 'gv008', 'gv009', 'gv010',
    'gv011', 'gv012', 'gv013', 'gv014', 'gv015',
    'sv020', 'sv021', 'sv022', 'sv023', 'sv024',
    'sv025', 'sv026', 'sv027', 'sv028', 'sv029',
    'sv030', 'sv031', 'sv032', 'sv033', 'sv034',
    'sv035',
];
async function seedBaseUsers(hash) {
    const baseUsers = [
        {
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            staff: {
                staffCode: 'NV001',
                fullName: 'Nguyễn Quản Trị',
                position: 'manager',
                email: 'admin@utt.edu.vn',
                phone: '0900000001',
            },
        },
        {
            username: 'thuthu',
            password: 'thuthu123',
            role: 'librarian',
            staff: {
                staffCode: 'NV002',
                fullName: 'Trần Thị Thu',
                position: 'librarian',
                email: 'thuthu@utt.edu.vn',
                phone: '0900000002',
            },
        },
    ];
    for (const item of baseUsers) {
        await prisma.user.upsert({
            where: { username: item.username },
            update: { role: item.role, status: 'active' },
            create: {
                username: item.username,
                password: await hash(item.password),
                role: item.role,
                staff: {
                    create: item.staff,
                },
            },
        });
    }
}
async function seedReaders(hash) {
    const readerSeeds = [
        ...studentNames.map((fullName, index) => ({
            username: `sv${String(index + 1).padStart(3, '0')}`,
            fullName,
            studentCode: `SV25${String(index + 1).padStart(3, '0')}`,
            readerType: 'student',
            email: `sv${String(index + 1).padStart(3, '0')}@utt.edu.vn`,
            phone: `0912${String(1000 + index).padStart(4, '0')}`,
            address: index % 2 === 0 ? 'Hà Nội' : 'Hưng Yên',
            dob: new Date(2001 + (index % 4), (index * 2) % 12, 3 + (index % 20)),
        })),
        ...lecturerNames.map((fullName, index) => ({
            username: `gv${String(index + 1).padStart(3, '0')}`,
            fullName,
            studentCode: `GV25${String(index + 1).padStart(3, '0')}`,
            readerType: 'lecturer',
            email: `gv${String(index + 1).padStart(3, '0')}@utt.edu.vn`,
            phone: `0988${String(2000 + index).padStart(4, '0')}`,
            address: index % 2 === 0 ? 'Hà Nội' : 'Nam Định',
            dob: new Date(1978 + (index % 12), (index * 3) % 12, 4 + (index % 20)),
        })),
    ];
    const readerRecords = [];
    for (const reader of readerSeeds) {
        const user = await prisma.user.upsert({
            where: { username: reader.username },
            update: { role: 'student', status: 'active' },
            create: {
                username: reader.username,
                password: await hash(reader.username.startsWith('gv') ? 'gv123456' : 'sv123456'),
                role: 'student',
                status: 'active',
            },
        });
        await prisma.student.upsert({
            where: { userId: user.id },
            update: {
                studentCode: reader.studentCode,
                fullName: reader.fullName,
                readerType: reader.readerType,
                email: reader.email,
                phone: reader.phone,
                address: reader.address,
                dob: reader.dob,
            },
            create: {
                userId: user.id,
                studentCode: reader.studentCode,
                fullName: reader.fullName,
                readerType: reader.readerType,
                email: reader.email,
                phone: reader.phone,
                address: reader.address,
                dob: reader.dob,
            },
        });
        readerRecords.push({
            id: user.id,
            username: reader.username,
            studentCode: reader.studentCode,
            fullName: reader.fullName,
            readerType: reader.readerType,
        });
    }
    return readerRecords;
}
async function seedBooks() {
    const seededBooks = [];
    for (const book of bookSeeds) {
        const created = await prisma.book.upsert({
            where: { bookCode: book.bookCode },
            update: {
                title: book.title,
                author: book.author,
                category: book.category,
                publisher: book.publisher,
                publishYear: book.publishYear,
                totalQty: book.totalQty,
                availableQty: book.totalQty,
            },
            create: {
                ...book,
                availableQty: book.totalQty,
            },
        });
        seededBooks.push({
            id: created.id,
            bookCode: created.bookCode,
            title: created.title,
            category: created.category,
        });
    }
    return seededBooks;
}
async function ensureBorrowSeed(seed) {
    const existing = await prisma.borrow.findFirst({
        where: {
            userId: seed.userId,
            bookId: seed.bookId,
            borrowDate: seed.borrowDate,
            dueDate: seed.dueDate,
            status: seed.status,
            returnDate: seed.returnDate,
        },
    });
    if (existing) {
        if (seed.status === 'RETURNED') {
            await prisma.returnRecord.upsert({
                where: { borrowId: existing.id },
                update: {
                    returnDate: seed.returnDate ?? existing.returnDate ?? new Date(),
                    fineAmount: seed.fineAmount,
                    exemptionReason: null,
                },
                create: {
                    borrowId: existing.id,
                    returnDate: seed.returnDate ?? new Date(),
                    fineAmount: seed.fineAmount,
                    exemptionReason: null,
                },
            });
        }
        return existing;
    }
    const created = await prisma.borrow.create({
        data: {
            userId: seed.userId,
            bookId: seed.bookId,
            borrowDate: seed.borrowDate,
            dueDate: seed.dueDate,
            returnDate: seed.returnDate,
            status: seed.status,
        },
    });
    if (seed.status === 'RETURNED') {
        await prisma.returnRecord.create({
            data: {
                borrowId: created.id,
                returnDate: seed.returnDate ?? new Date(),
                fineAmount: seed.fineAmount,
                exemptionReason: null,
            },
        });
    }
    return created;
}
async function seedBorrowHistory(readerRecords, books) {
    const todayStart = toStartOfDay(new Date());
    const year2025Start = new Date(2025, 0, 1, 8, 0, 0, 0);
    const year2025End = new Date(2025, 11, 31, 17, 0, 0, 0);
    const year2026Start = new Date(2026, 0, 1, 8, 0, 0, 0);
    const year2026End = addDays(todayStart, -20);
    let fine2025Total = 0;
    let fine2026Total = 0;
    const booksByCategory = new Map();
    for (const category of BORROW_CATEGORY_CYCLE) {
        booksByCategory.set(category, books.filter((book) => book.category === category));
    }
    const pickBook = (readerIndex, borrowIndex, phaseSeed) => {
        const category = BORROW_CATEGORY_CYCLE[(borrowIndex + phaseSeed) % BORROW_CATEGORY_CYCLE.length];
        const bucket = booksByCategory.get(category) || books;
        return bucket[(readerIndex * 17 + borrowIndex * 11 + phaseSeed) % bucket.length];
    };
    for (let readerIndex = 0; readerIndex < readerRecords.length; readerIndex++) {
        const reader = readerRecords[readerIndex];
        const plan = readerPlans[readerIndex] ?? fallbackReaderPlan;
        for (let i = 0; i < plan.returned2025; i++) {
            const book = pickBook(readerIndex, i, 1);
            const borrowDate = distributeDate(year2025Start, year2025End, i, plan.returned2025, readerIndex);
            const dueDate = addDays(borrowDate, 14);
            const overdueDays = 2 + ((readerIndex + i) % 4);
            const returnDate = addDays(dueDate, overdueDays);
            fine2025Total += overdueDays * FINE_PER_DAY;
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate,
                status: 'RETURNED',
                fineAmount: overdueDays * FINE_PER_DAY,
            });
        }
        for (let i = 0; i < plan.returned2026; i++) {
            const book = pickBook(readerIndex, i, 3);
            const borrowDate = distributeDate(year2026Start, year2026End, i, plan.returned2026, readerIndex);
            const dueDate = addDays(borrowDate, 14);
            const overdueDays = 2 + ((readerIndex + i) % 3);
            const returnDate = addDays(dueDate, overdueDays);
            fine2026Total += overdueDays * FINE_PER_DAY;
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate,
                status: 'RETURNED',
                fineAmount: overdueDays * FINE_PER_DAY,
            });
        }
        for (let i = 0; i < plan.activeCurrent; i++) {
            const book = pickBook(readerIndex, i, 5);
            const borrowDate = addMinutes(addDays(todayStart, -3), readerIndex * 7 + i);
            const dueDate = addDays(todayStart, 7 + ((readerIndex + i) % 7));
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate: null,
                status: 'BORROWING',
                fineAmount: 0,
            });
        }
        for (let i = 0; i < plan.overdueCurrent; i++) {
            const book = pickBook(readerIndex, i, 7);
            const borrowDate = addMinutes(addDays(todayStart, -18), readerIndex * 9 + i);
            const dueDate = addDays(todayStart, -(1 + ((readerIndex + i) % 7)));
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate: null,
                status: 'BORROWING',
                fineAmount: 0,
            });
        }
    }
    return {
        fine2025Total,
        fine2026Total,
    };
}
async function ensureListedAccountsHaveBorrows(readerRecords, books) {
    const start = new Date(2025, 0, 15, 9, 0, 0, 0);
    const end = new Date(2026, 3, 15, 17, 0, 0, 0);
    const booksByCategory = new Map();
    for (const category of BORROW_CATEGORY_CYCLE) {
        booksByCategory.set(category, books.filter((book) => book.category === category));
    }
    for (const username of mustHaveBorrowUsernames) {
        const reader = readerRecords.find((item) => item.username === username);
        if (!reader)
            continue;
        const totalBorrows = await prisma.borrow.count({ where: { userId: reader.id } });
        if (totalBorrows > 0)
            continue;
        for (let i = 0; i < 7; i++) {
            const category = BORROW_CATEGORY_CYCLE[i % BORROW_CATEGORY_CYCLE.length];
            const bucket = booksByCategory.get(category) || books;
            const book = bucket[(reader.id + i * 5) % bucket.length];
            const borrowDate = distributeDate(start, end, i, 7, reader.id);
            const dueDate = addDays(borrowDate, 14);
            const overdueDays = i % 2 === 0 ? 2 : 0;
            const returnDate = overdueDays > 0 ? addDays(dueDate, overdueDays) : dueDate;
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate,
                status: 'RETURNED',
                fineAmount: overdueDays * FINE_PER_DAY,
            });
        }
    }
}
async function syncAvailableQty(bookIds) {
    const activeBorrows = await prisma.borrow.groupBy({
        by: ['bookId'],
        where: {
            bookId: { in: bookIds },
            status: 'BORROWING',
        },
        _count: { bookId: true },
    });
    const activeMap = new Map();
    activeBorrows.forEach((item) => {
        activeMap.set(item.bookId, item._count.bookId);
    });
    const seededBookRows = await prisma.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, totalQty: true },
    });
    for (const book of seededBookRows) {
        const activeCount = activeMap.get(book.id) || 0;
        await prisma.book.update({
            where: { id: book.id },
            data: { availableQty: Math.max(0, book.totalQty - activeCount) },
        });
    }
}
async function rebalanceCategoryBorrowDistribution(readerRecords, books) {
    const bookIds = books.map((book) => book.id);
    const categoryOfBook = new Map();
    books.forEach((book) => {
        categoryOfBook.set(book.id, book.category);
    });
    const booksByCategory = new Map();
    for (const category of BORROW_CATEGORY_CYCLE) {
        booksByCategory.set(category, books.filter((book) => book.category === category));
    }
    const grouped = await prisma.borrow.groupBy({
        by: ['bookId'],
        where: { bookId: { in: bookIds } },
        _count: { bookId: true },
    });
    const currentByCategory = new Map();
    for (const category of BORROW_CATEGORY_CYCLE) {
        currentByCategory.set(category, 0);
    }
    grouped.forEach((item) => {
        const category = categoryOfBook.get(item.bookId);
        if (!category)
            return;
        currentByCategory.set(category, (currentByCategory.get(category) || 0) + item._count.bookId);
    });
    const maxCount = Math.max(...Array.from(currentByCategory.values()));
    const targetCount = Math.max(0, maxCount - 10);
    const start = new Date(2025, 0, 20, 8, 0, 0, 0);
    const end = new Date(2026, 3, 15, 18, 0, 0, 0);
    for (let categoryIndex = 0; categoryIndex < BORROW_CATEGORY_CYCLE.length; categoryIndex++) {
        const category = BORROW_CATEGORY_CYCLE[categoryIndex];
        const current = currentByCategory.get(category) || 0;
        const deficit = Math.max(0, targetCount - current);
        if (deficit === 0)
            continue;
        const bucket = booksByCategory.get(category) || [];
        if (bucket.length === 0)
            continue;
        for (let i = 0; i < deficit; i++) {
            const reader = readerRecords[(i + categoryIndex) % readerRecords.length];
            const book = bucket[(i * 7 + reader.id) % bucket.length];
            const borrowDate = distributeDate(start, end, i, deficit, categoryIndex * 13);
            const dueDate = addDays(borrowDate, 14);
            const overdueDays = (i + categoryIndex) % 4;
            const returnDate = overdueDays > 0 ? addDays(dueDate, overdueDays) : dueDate;
            await ensureBorrowSeed({
                userId: reader.id,
                bookId: book.id,
                borrowDate,
                dueDate,
                returnDate,
                status: 'RETURNED',
                fineAmount: overdueDays * FINE_PER_DAY,
            });
        }
    }
}
async function main() {
    const hash = async (password) => bcryptjs_1.default.hash(password, 10);
    await prisma.config.upsert({
        where: { key: 'fine_per_day' },
        update: { value: String(FINE_PER_DAY) },
        create: { key: 'fine_per_day', value: String(FINE_PER_DAY) },
    });
    await prisma.config.upsert({
        where: { key: 'borrow_days' },
        update: { value: '14' },
        create: { key: 'borrow_days', value: '14' },
    });
    await prisma.config.upsert({
        where: { key: 'max_books' },
        update: { value: '3' },
        create: { key: 'max_books', value: '3' },
    });
    await seedBaseUsers(hash);
    const readerRecords = await seedReaders(hash);
    const bookRecords = await seedBooks();
    const fines = await seedBorrowHistory(readerRecords, bookRecords);
    await ensureListedAccountsHaveBorrows(readerRecords, bookRecords);
    await rebalanceCategoryBorrowDistribution(readerRecords, bookRecords);
    await syncAvailableQty(bookRecords.map((book) => book.id));
    const todayStart = toStartOfDay(new Date());
    const readerUserIds = readerRecords.map((reader) => reader.id);
    const borrowCount2025 = await prisma.borrow.count({
        where: {
            userId: { in: readerUserIds },
            borrowDate: {
                gte: new Date(2025, 0, 1),
                lt: new Date(2026, 0, 1),
            },
        },
    });
    const borrowCount2026 = await prisma.borrow.count({
        where: {
            userId: { in: readerUserIds },
            borrowDate: {
                gte: new Date(2026, 0, 1),
                lt: addDays(todayStart, 1),
            },
        },
    });
    const activeBorrowCount = await prisma.borrow.count({
        where: {
            userId: { in: readerUserIds },
            status: 'BORROWING',
            dueDate: { gte: todayStart },
        },
    });
    const overdueBorrowCount = await prisma.borrow.count({
        where: {
            userId: { in: readerUserIds },
            status: 'BORROWING',
            dueDate: { lt: todayStart },
        },
    });
    console.log('Seed completed!');
    console.log('Khong xoa du lieu cu. Chi upsert va bo sung du lieu thieu.');
    console.log(`Doc gia da seed: ${readerRecords.length} (35 hoc sinh, 15 giao vien)`);
    console.log(`Dau sach da seed: ${bookRecords.length} (70 dau sach)`);
    console.log(`Tong luot muon 2025: ${borrowCount2025}`);
    console.log(`Tong luot muon tu dau 2026 den nay: ${borrowCount2026}`);
    console.log(`So phieu dang muon: ${activeBorrowCount}`);
    console.log(`So phieu qua han: ${overdueBorrowCount}`);
    console.log(`Tien phat 2025 (du kien): ${fines.fine2025Total}`);
    console.log(`Tien phat 2026 (du kien): ${fines.fine2026Total}`);
    console.log('Tai khoan mau:');
    console.log('  Admin: admin / admin123');
    console.log('  Thu thu: thuthu / thuthu123');
    console.log('  Sinh vien mau: sv001 / sv123456');
    console.log('  Giang vien mau: gv001 / gv123456');
}
main()
    .catch((error) => {
    console.error(error);
})
    .finally(async () => {
    await prisma.$disconnect();
});
