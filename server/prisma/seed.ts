import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const FINE_PER_DAY = 5000

type ReaderSeed = {
  username: string
  fullName: string
  studentCode: string
  readerType: 'student' | 'lecturer'
  email: string
  phone: string
  address: string
  dob: Date
}

type BookSeed = {
  bookCode: string
  title: string
  author: string
  category: string
  publisher: string
  publishYear: number
  totalQty: number
  description?: string
}

type BorrowStatus = 'RETURNED' | 'BORROWING'

type BorrowSeed = {
  userId: number
  bookId: number
  borrowDate: Date
  dueDate: Date
  returnDate: Date | null
  status: BorrowStatus
  fineAmount: number
}

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
]

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
]

const bookSeeds: BookSeed[] = [
  { bookCode: 'BK001', title: 'Quản trị cơ sở dữ liệu', author: 'Nguyễn Văn A', category: 'Công nghệ thông tin', publisher: 'NXB Giáo dục', publishYear: 2023, totalQty: 20, description: 'Sách hướng dẫn toàn diện về quản trị cơ sở dữ liệu, bao gồm các khái niệm cơ bản, thiết kế, triển khai và tối ưu hóa hệ thống CSDL.' },
  { bookCode: 'BK002', title: 'Kinh tế vi mô', author: 'Trần Thị B', category: 'Kinh tế', publisher: 'NXB Kinh tế', publishYear: 2022, totalQty: 20, description: 'Giáo trình kinh tế vi mô cơ bản, giải thích hành vi của các chủ thể kinh tế, thị trường, giá cả và sự phân bổ tài nguyên hiệu quả.' },
  { bookCode: 'BK003', title: 'Lịch sử Việt Nam hiện đại', author: 'Lê Văn C', category: 'Lịch sử', publisher: 'NXB Lịch sử', publishYear: 2023, totalQty: 20, description: 'Tác phẩm khảo cứu chi tiết lịch sử Việt Nam từ thế kỷ XIX đến nay, phân tích những biến đổi chính trị, xã hội và kinh tế của đất nước.' },
  { bookCode: 'CNTT001', title: 'Clean Code', author: 'Robert C. Martin', category: 'Công nghệ thông tin', publisher: 'Prentice Hall', publishYear: 2008, totalQty: 6, description: 'Hướng dẫn viết mã sạch, dễ đọc và bảo trì; tập trung vào các nguyên tắc thiết kế, đặt tên biến, và tổ chức code một cách chuyên nghiệp.' },
  { bookCode: 'CNTT002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', category: 'Công nghệ thông tin', publisher: 'Addison-Wesley', publishYear: 2019, totalQty: 5, description: 'Sách dạy các kỹ năng lập trình thực tế, từ giải quyết vấn đề, tự động hóa, đến quản lý dự án và phát triển sự nghiệp.' },
  { bookCode: 'CNTT003', title: 'Design Patterns', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', category: 'Công nghệ thông tin', publisher: 'Addison-Wesley', publishYear: 1994, totalQty: 5, description: 'Tác phẩm kinh điển về các mẫu thiết kế, cung cấp giải pháp tái sử dụng cho các vấn đề thiết kế phía đối tượng thường gặp.' },
  { bookCode: 'CNTT004', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', category: 'Công nghệ thông tin', publisher: 'MIT Press', publishYear: 2009, totalQty: 4, description: 'Giáo trình toàn diện về thuật toán, bao gồm các cấu trúc dữ liệu, sắp xếp, tìm kiếm và các kỹ thuật tối ưu hóa nâng cao.' },
  { bookCode: 'CNTT005', title: 'Computer Networks', author: 'Andrew S. Tanenbaum, David J. Wetherall', category: 'Công nghệ thông tin', publisher: 'Pearson', publishYear: 2011, totalQty: 4, description: 'Sách về mạng máy tính, giải thích kiến trúc mạng, giao thức truyền thông, bảo mật và các ứng dụng mạng hiện đại.' },
  { bookCode: 'CNTT006', title: 'Operating System Concepts', author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne', category: 'Công nghệ thông tin', publisher: 'Wiley', publishYear: 2018, totalQty: 5, description: 'Giáo trình về hệ điều hành, bao gồm quản lý tiến trình, bộ nhớ, tập tin, và các khái niệm hệ điều hành cơ bản.' },
  { bookCode: 'CNTT007', title: 'Database System Concepts', author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', category: 'Công nghệ thông tin', publisher: 'McGraw-Hill', publishYear: 2019, totalQty: 5, description: 'Sách lý thuyết về hệ thống cơ sở dữ liệu, SQL, giao dịch, phục hồi và các kỹ thuật quản lý dữ liệu tiên tiến.' },
  { bookCode: 'CNTT008', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', category: 'Công nghệ thông tin', publisher: 'Pearson', publishYear: 2021, totalQty: 4, description: 'Giáo trình AI toàn diện, bao gồm tìm kiếm, lý thuyết trò chơi, học máy, xử lý ngôn ngữ tự nhiên và thị giác máy tính.' },
  { bookCode: 'CNTT009', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', category: 'Công nghệ thông tin', publisher: "O'Reilly Media", publishYear: 2008, totalQty: 4, description: 'Hướng dẫn lập trình JavaScript, nhấn mạnh các tính năng tốt và tránh những gotchas phổ biến trong ngôn ngữ.' },
  { bookCode: 'CNTT010', title: "You Don't Know JS Yet: Get Started", author: 'Kyle Simpson', category: 'Công nghệ thông tin', publisher: 'Independently Published', publishYear: 2020, totalQty: 4, description: 'Loạt sách JavaScript chuyên sâu, giải thích chi tiết cơ chế hoạt động của JavaScript từ căn bản đến nâng cao.' },
  { bookCode: 'KT001', title: 'Nguyên lý kinh tế học', author: 'N. Gregory Mankiw', category: 'Kinh tế', publisher: 'Cengage Learning', publishYear: 2021, totalQty: 5, description: 'Giáo trình kinh tế học căn bản, giới thiệu các khái niệm cơ bản này, cung-cầu, sản xuất và thương mại.' },
  { bookCode: 'KT002', title: 'Kinh tế học', author: 'Paul A. Samuelson, William D. Nordhaus', category: 'Kinh tế', publisher: 'McGraw-Hill', publishYear: 2010, totalQty: 5, description: 'Sách tổng hợp về kinh tế học, bao gồm vĩ kinh tế, vi kinh tế, chính sách tài chính và phát triển kinh tế.' },
  { bookCode: 'KT003', title: 'Tư bản trong thế kỷ XXI', author: 'Thomas Piketty', category: 'Kinh tế', publisher: 'Harvard University Press', publishYear: 2014, totalQty: 4, description: 'Phân tích kinh tế toàn cầu về bất bình đẳng của cải, lịch sử phân bổ tài sản và đề xuất cải cách chính sách.' },
  { bookCode: 'KT004', title: 'The Wealth of Nations', author: 'Adam Smith', category: 'Kinh tế', publisher: 'Penguin Classics', publishYear: 1776, totalQty: 4, description: 'Tác phẩm kinh điển nền tảng kinh tế học hiện đại, giới thiệu khái niệm bàn tay vô hình và lợi thế so sánh.' },
  { bookCode: 'KT005', title: 'Freakonomics', author: 'Steven D. Levitt, Stephen J. Dubner', category: 'Kinh tế', publisher: 'William Morrow', publishYear: 2005, totalQty: 4, description: 'Khám phá kinh tế học trong cuộc sống hàng ngày, phân tích các quyết định tài chính, động cơ và hành vi con người.' },
  { bookCode: 'KT006', title: 'The Intelligent Investor', author: 'Benjamin Graham', category: 'Kinh tế', publisher: 'Harper Business', publishYear: 2006, totalQty: 4, description: 'Hướng dẫn đầu tư giá trị, dạy chiến lược đầu tư dài hạn, phân tích cơ bản và quản lý rủi ro.' },
  { bookCode: 'KT007', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Kinh tế', publisher: 'Farrar, Straus and Giroux', publishYear: 2011, totalQty: 4, description: 'Khám phá tâm lý học nhận thức, giải thích hai hệ thống suy nghĩ, phỏng đoán và quyết định hợp lý.' },
  { bookCode: 'KT008', title: 'Good Economics for Hard Times', author: 'Abhijit V. Banerjee, Esther Duflo', category: 'Kinh tế', publisher: 'PublicAffairs', publishYear: 2019, totalQty: 4, description: 'Quan điểm kinh tế học hiện đại về bất bình đẳng, nhập cư, thương mại và các chính sách công công hiệu quả.' },
  { bookCode: 'KT009', title: 'Common Sense Economics', author: 'James D. Gwartney, Richard L. Stroup, Dwight R. Lee', category: 'Kinh tế', publisher: "St. Martin's Press", publishYear: 2016, totalQty: 4, description: 'Giáo trình kinh tế học ứng dụng, luận giải các nguyên tắc kinh tế trong bối cảnh thực tế hàng ngày.' },
  { bookCode: 'KT010', title: 'Business Model Generation', author: 'Alexander Osterwalder, Yves Pigneur', category: 'Kinh tế', publisher: 'Wiley', publishYear: 2010, totalQty: 4, description: 'Hướng dẫn thiết kế mô hình kinh doanh, cung cấp khung làm việc và công cụ tạo mô hình bằng hình ảnh.' },
  { bookCode: 'VH001', title: 'Truyện Kiều', author: 'Nguyễn Du', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 5, description: 'Tác phẩm văn học kinh điển Việt Nam, câu chuyện tình lầm lẫn thương đau của Thúy Kiều giữa hai kiếp người.' },
  { bookCode: 'VH002', title: 'Dế Mèn phiêu lưu ký', author: 'Tô Hoài', category: 'Văn Học', publisher: 'NXB Kim Đồng', publishYear: 2018, totalQty: 5, description: 'Tiểu thuyết phiêu lưu dành cho thiếu nhi, theo dõi hành trình tự do của Dế Mèn xa rời nhà để tìm kiếm tiếng ca.' },
  { bookCode: 'VH003', title: 'Số đỏ', author: 'Vũ Trọng Phụng', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2019, totalQty: 4, description: 'Tiểu thuyết hiện thực chỉ trích xã hội, khám phá tham nhũng, thối nát và các mộng mơ của người trẻ thời kỳ này.' },
  { bookCode: 'VH004', title: 'Chí Phèo', author: 'Nam Cao', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 4, description: 'Truyện ngắn lớp học về nhân vật Chí Phèo, nhân vật nạn nhân của hoàn cảnh xã hội tư bản chủ nghĩa.' },
  { bookCode: 'VH005', title: 'Lão Hạc', author: 'Nam Cao', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 4, description: 'Truyện ngắn cảm xúc về tình cha con, lão Hạc sống vất vả và hy sinh hết mình cho con trai.' },
  { bookCode: 'VH006', title: 'Tắt đèn', author: 'Ngô Tất Tố', category: 'Văn Học', publisher: 'NXB Văn học', publishYear: 2019, totalQty: 4, description: 'Tiểu thuyết xã hội kỳ tích, con người nông dân bị áp bức, dục vọng tự do và nêu cao tinh thần cách mạng.' },
  { bookCode: 'VH007', title: 'Vợ nhặt', author: 'Kim Lân', category: 'Văn Học', publisher: 'NXB Kim Đồng', publishYear: 2018, totalQty: 4, description: 'Truyện ngắn tình cảm, khám phá tình yêu và nhân tính thông qua câu chuyện của một người phụ nữ bị xã hội coi thường.' },
  { bookCode: 'VH008', title: 'Nỗi buồn chiến tranh', author: 'Bảo Ninh', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2021, totalQty: 4, description: 'Tiểu thuyết về những người lính chiến tranh, nỗi đau tâm lý và những vết sẹo chiến tranh còn sót lại.' },
  { bookCode: 'VH009', title: 'Tôi thấy hoa vàng trên cỏ xanh', author: 'Nguyễn Nhật Ánh', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2022, totalQty: 5, description: 'Tiểu thuyết dành cho thiếu nhi, câu chuyện tuổi thơ đầy màu sắc và những kỷ niệm đẹp của thế hệ 8x.' },
  { bookCode: 'VH010', title: 'Cánh đồng bất tận', author: 'Nguyễn Ngọc Tư', category: 'Văn Học', publisher: 'NXB Trẻ', publishYear: 2021, totalQty: 4, description: 'Tiểu thuyết về cuộc sống nông dân, đất liền miền Tây sông nước và những câu chuyện nhân tính sâu sắc.' },
  { bookCode: 'KH001', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Khoa học tự nhiên', publisher: 'Bantam Books', publishYear: 1988, totalQty: 4, description: 'Sách khoa phổ về vũ trụ, thời gian, hố đen và lý thuyết tương đối, viết cho độc giả không chuyên.' },
  { bookCode: 'KH002', title: 'The Selfish Gene', author: 'Richard Dawkins', category: 'Khoa học tự nhiên', publisher: 'Oxford University Press', publishYear: 2006, totalQty: 4, description: 'Lý thuyết tiến hóa dựa trên gen, giải thích hành vi động vật và con người từ góc độ gen tự ích.' },
  { bookCode: 'KH003', title: 'Cosmos', author: 'Carl Sagan', category: 'Khoa học tự nhiên', publisher: 'Random House', publishYear: 1980, totalQty: 4, description: 'Tác phẩm khoa phổ kinh điển, khám phá lịch sử vũ trụ, tiến hóa, sự sống và tương lai của nhân loại.' },
  { bookCode: 'KH004', title: 'The Gene: An Intimate History', author: 'Siddhartha Mukherjee', category: 'Khoa học tự nhiên', publisher: 'Scribner', publishYear: 2016, totalQty: 4, description: 'Lịch sử khoa học di truyền, từ Mendel đến công nghệ gen hiện đại, và tác động xã hội của nó.' },
  { bookCode: 'KH005', title: 'The Elegant Universe', author: 'Brian Greene', category: 'Khoa học tự nhiên', publisher: 'W. W. Norton & Company', publishYear: 1999, totalQty: 4, description: 'Sách khoa phổ về lý thuyết dây, chiều thêm và cấu trúc cơ bản của vũ trụ.' },
  { bookCode: 'KH006', title: 'On the Origin of Species', author: 'Charles Darwin', category: 'Khoa học tự nhiên', publisher: 'John Murray', publishYear: 1859, totalQty: 4, description: 'Tác phẩm kinh điển về tiến hóa, nền tảng sinh học hiện đại, giải thích đa dạng sinh học.' },
  { bookCode: 'KH007', title: 'Silent Spring', author: 'Rachel Carson', category: 'Khoa học tự nhiên', publisher: 'Houghton Mifflin', publishYear: 1962, totalQty: 4, description: 'Sách về môi trường và tác hại của thuốc trừ sâu, khơi dậy phong trào bảo vệ môi trường.' },
  { bookCode: 'KH008', title: 'The Body: A Guide for Occupants', author: 'Bill Bryson', category: 'Khoa học tự nhiên', publisher: 'Doubleday', publishYear: 2019, totalQty: 4, description: 'Khám phá cơ thể con người, hoạt động của các cơ quan và những điều thú vị về sinh lý học.' },
  { bookCode: 'KH009', title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', category: 'Khoa học tự nhiên', publisher: 'Crown', publishYear: 2010, totalQty: 4, description: 'Câu chuyện đích thực về Henrietta Lacks, tế bào của cô và cuộc cách mạng y học mà nó tạo nên.' },
  { bookCode: 'KH010', title: 'The Hidden Life of Trees', author: 'Peter Wohlleben', category: 'Khoa học tự nhiên', publisher: 'Greystone Books', publishYear: 2015, totalQty: 4, description: 'Khám phá mạng lưới cộng sinh của rừng, cách cây cối giao tiếp và hỗ trợ lẫn nhau.' },
  { bookCode: 'LS001', title: 'Việt Nam sử lược', author: 'Trần Trọng Kim', category: 'Lịch sử', publisher: 'NXB Văn học', publishYear: 2020, totalQty: 5, description: 'Tóm tắt lịch sử Việt Nam từ thời kỳ sơ khai đến hiện đại, bao gồm các triều đại và biến cố quan trọng.' },
  { bookCode: 'LS002', title: 'Sử ký', author: 'Tư Mã Thiên', category: 'Lịch sử', publisher: 'NXB Văn hóa - Văn nghệ', publishYear: 2019, totalQty: 4, description: 'Tác phẩm lịch sử cổ điển Trung Quốc, hồ sơ toàn diện các hoàng đế, vương lâm và sự kiện trong lịch sử.' },
  { bookCode: 'LS003', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'Lịch sử', publisher: 'Harvill Secker', publishYear: 2014, totalQty: 4, description: 'Lịch sử nhân loại từ thời kỳ Đá, cách nhân loại phát triển từ loài động vật thành nền văn minh.' },
  { bookCode: 'LS004', title: 'The Silk Roads: A New History of the World', author: 'Peter Frankopan', category: 'Lịch sử', publisher: 'Bloomsbury', publishYear: 2015, totalQty: 4, description: 'Lịch sử thế giới qua con đường tơ lụa, khám phá trao đổi hàng hóa, tôn giáo và nền văn minh.' },
  { bookCode: 'LS005', title: "A People's History of the United States", author: 'Howard Zinn', category: 'Lịch sử', publisher: 'Harper & Row', publishYear: 2015, totalQty: 4, description: 'Lịch sử Hoa Kỳ từ góc độ nhân dân, tập trung vào những cuộc đấu tranh và tiếng nói của dân thường.' },
  { bookCode: 'LS006', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', category: 'Lịch sử', publisher: 'W. W. Norton & Company', publishYear: 1997, totalQty: 4, description: 'Khám phá lý do tại sao một số nền văn minh phát triển hơn những nền khác, dựa trên địa lý và sinh học.' },
  { bookCode: 'LS007', title: 'The Rise and Fall of the Third Reich', author: 'William L. Shirer', category: 'Lịch sử', publisher: 'Simon & Schuster', publishYear: 1960, totalQty: 4, description: 'Lịch sử chi tiết của Đức Quốc xã, từ sự trỗi dậy đến sự sụp đổ của chế độ phát xít.' },
  { bookCode: 'LS008', title: 'The Second World War', author: 'Antony Beevor', category: 'Lịch sử', publisher: 'Back Bay Books', publishYear: 2012, totalQty: 4, description: 'Lịch sử toàn diện Thế chiến II, với các chi tiết về các trận chiến, chính trị và nhân vật chính.' },
  { bookCode: 'LS009', title: 'The Wright Brothers', author: 'David McCullough', category: 'Lịch sử', publisher: 'Simon & Schuster', publishYear: 2015, totalQty: 4, description: 'Tiểu sử nhà phát minh máy bay, cuộc đấu tranh để chế tạo máy bay bay và cuộc đua với các nhà cạnh tranh.' },
  { bookCode: 'LS010', title: 'History of the Peloponnesian War', author: 'Thucydides', category: 'Lịch sử', publisher: 'Penguin Classics', publishYear: 2009, totalQty: 4, description: 'Tài liệu lịch sử cổ điển về cuộc chiến Peloponnesian, chiến tranh giữa Athens và Sparta.' },
  { bookCode: 'NN001', title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'Ngoại ngữ', publisher: 'Cambridge University Press', publishYear: 2019, totalQty: 6, description: 'Sách giáo trình ngữ pháp tiếng Anh toàn diện, với các bài tập thực hành từ cơ bản đến nâng cao.' },
  { bookCode: 'NN002', title: 'Practical English Usage', author: 'Michael Swan', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2016, totalQty: 5, description: 'Tài liệu tham khảo ngữ pháp và cách sử dụng tiếng Anh thực tiễn, giải quyết các câu hỏi ngôn ngữ phổ biến.' },
  { bookCode: 'NN003', title: 'Oxford Word Skills', author: 'Ruth Gairns, Stuart Redman', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2012, totalQty: 5, description: 'Sách dạy từ vựng tiếng Anh hiệu quả, từ từ cơ bản đến cụm từ idiom và collocations nâng cao.' },
  { bookCode: 'NN004', title: 'New Headway Beginner', author: 'Liz Soars, John Soars', category: 'Ngoại ngữ', publisher: 'Oxford University Press', publishYear: 2015, totalQty: 4, description: 'Giáo trình tiếng Anh cho người mới bắt đầu, bao gồm giao tiếp cơ bản, ngữ pháp và kỹ năng.' },
  { bookCode: 'NN005', title: 'Japanese for Busy People I', author: 'AJALT', category: 'Ngoại ngữ', publisher: 'Kodansha International', publishYear: 2011, totalQty: 4, description: 'Giáo trình học tiếng Nhật cho người bận rộn, tập trung vào giao tiếp thực tế.' },
  { bookCode: 'NN006', title: 'Minna no Nihongo I', author: '3A Corporation', category: 'Ngoại ngữ', publisher: '3A Network', publishYear: 2018, totalQty: 4, description: 'Sách giáo trình tiếng Nhật độc quyền, được dạy rộng rãi trên thế giới để người nước ngoài học tiếng Nhật.' },
  { bookCode: 'NN007', title: 'Korean Grammar in Use: Beginning', author: 'Ahn Jean-myung, Lee Kyung-ah, Han Hoo-youn', category: 'Ngoại ngữ', publisher: 'Darakwon', publishYear: 2010, totalQty: 4, description: 'Giáo trình ngữ pháp tiếng Hàn cho người mới bắt đầu, giải thích từng quy tắc với ví dụ minh họa.' },
  { bookCode: 'NN008', title: 'New Practical Chinese Reader 1', author: 'Liu Xun', category: 'Ngoại ngữ', publisher: 'Beijing Language and Culture University Press', publishYear: 2006, totalQty: 4, description: 'Giáo trình tiếng Trung Quốc thực tế, phù hợp cho người bắt đầu học tiếng Hoa.' },
  { bookCode: 'NN009', title: 'Practice Makes Perfect: Complete Spanish Grammar', author: 'Gilda Nissenberg', category: 'Ngoại ngữ', publisher: 'McGraw-Hill Education', publishYear: 2013, totalQty: 4, description: 'Sách luyện tập ngữ pháp tiếng Tây Ban Nha toàn diện, với hàng trăm bài tập thực hành.' },
  { bookCode: 'NN010', title: 'Easy French Step-by-Step', author: 'Myrna Bell Rochester', category: 'Ngoại ngữ', publisher: 'McGraw-Hill Education', publishYear: 2015, totalQty: 4, description: 'Giáo trình tiếng Pháp từng bước, từ cơ bản đến nâng cao, dễ theo dõi cho người mới.' },
  { bookCode: 'KTH001', title: 'Mechanics of Materials', author: 'R.C. Hibbeler', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2017, totalQty: 5, description: 'Giáo trình cơ học vật liệu, bao gồm ứng suất, biến dạng, độ bền và cách tính toán của các kỹ sư.' },
  { bookCode: 'KTH002', title: 'Engineering Mechanics: Statics', author: 'J.L. Meriam, L.G. Kraige', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2015, totalQty: 5, description: 'Sách cơ học kỹ thuật tĩnh học, lực, mô men và cân bằng các hệ thống vật rắn không chuyển động.' },
  { bookCode: 'KTH003', title: 'Engineering Mechanics: Dynamics', author: 'J.L. Meriam, L.G. Kraige', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2016, totalQty: 5, description: 'Sách cơ học kỹ thuật động học, chuyển động, gia tốc, động lượng và năng lượng của các vật thể.' },
  { bookCode: 'KTH004', title: 'Fluid Mechanics', author: 'Frank M. White', category: 'Kỹ Thuật', publisher: 'McGraw-Hill', publishYear: 2016, totalQty: 4, description: 'Giáo trình cơ học chất lỏng, dòng chảy, áp suất, và các ứng dụng trong kỹ thuật.' },
  { bookCode: 'KTH005', title: 'Thermodynamics: An Engineering Approach', author: 'Yunus A. Cengel, Michael A. Boles', category: 'Kỹ Thuật', publisher: 'McGraw-Hill', publishYear: 2019, totalQty: 4, description: 'Giáo trình nhiệt động lực học kỹ thuật, năng lượng, entropy, chu trình và các hệ thống năng lượng.' },
  { bookCode: 'KTH006', title: 'Electrical Engineering: Principles and Applications', author: 'Allan R. Hambley', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2017, totalQty: 4, description: 'Giáo trình kỹ thuật điện cơ bản, mạch điện, điện từ, và các ứng dụng thực tế.' },
  { bookCode: 'KTH007', title: 'Control Systems Engineering', author: 'Norman S. Nise', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2019, totalQty: 4, description: 'Hệ thống điều khiển, phân tích ổn định, thiết phỏng PID, và các kỹ thuật điều khiển hiện đại.' },
  { bookCode: 'KTH008', title: 'Manufacturing Engineering and Technology', author: 'Serope Kalpakjian, Steven R. Schmid', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2014, totalQty: 4, description: 'Giáo trình công nghệ chế tạo, quy trình sản xuất, máy móc công nghiệp và kiểm soát chất lượng.' },
  { bookCode: 'KTH009', title: 'Fundamentals of Heat and Mass Transfer', author: 'Frank P. Incropera, David P. DeWitt', category: 'Kỹ Thuật', publisher: 'Wiley', publishYear: 2011, totalQty: 4, description: 'Giáo trình truyền nhiệt và khối lượng, dẫn nhiệt, đối lưu và bức xạ trong kỹ thuật.' },
  { bookCode: 'KTH010', title: 'Structural Analysis', author: 'Russell C. Hibbeler', category: 'Kỹ Thuật', publisher: 'Pearson', publishYear: 2018, totalQty: 4, description: 'Phân tích kết cấu, lực, biến dạng trong các cấu trúc xây dựng và máy móc.' },
]

const BORROW_CATEGORY_CYCLE = [
  'Công nghệ thông tin',
  'Kinh tế',
  'Văn Học',
  'Khoa học tự nhiên',
  'Lịch sử',
  'Ngoại ngữ',
  'Kỹ Thuật',
]

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  next.setSeconds(0, 0)
  return next
}

const addMinutes = (date: Date, minutes: number) => {
  const next = new Date(date)
  next.setMinutes(next.getMinutes() + minutes)
  next.setSeconds(0, 0)
  return next
}

const distributeDate = (start: Date, end: Date, index: number, total: number, minuteOffset = 0) => {
  const safeTotal = Math.max(1, total)
  const ratio = safeTotal === 1 ? 0 : index / (safeTotal - 1)
  const span = end.getTime() - start.getTime()
  const next = new Date(start.getTime() + Math.floor(span * ratio))
  next.setSeconds(0, 0)
  return addMinutes(next, minuteOffset)
}

const readerPlans = studentNames.map((_, index) => ({
  returned2025: index < 27 ? 30 : 31,
  returned2026: index < 22 ? 10 : 11,
  activeCurrent: index < 7 ? 1 : 0,
  overdueCurrent: index >= 7 && index < 11 ? 1 : 0,
}))

const fallbackReaderPlan = {
  returned2025: 12,
  returned2026: 5,
  activeCurrent: 0,
  overdueCurrent: 0,
}

const mustHaveBorrowUsernames = [
  'gv001', 'gv002', 'gv003', 'gv004', 'gv005',
  'gv006', 'gv007', 'gv008', 'gv009', 'gv010',
  'gv011', 'gv012', 'gv013', 'gv014', 'gv015',
  'sv020', 'sv021', 'sv022', 'sv023', 'sv024',
  'sv025', 'sv026', 'sv027', 'sv028', 'sv029',
  'sv030', 'sv031', 'sv032', 'sv033', 'sv034',
  'sv035',
]

async function seedBaseUsers(hash: (password: string) => Promise<string>) {
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
  ] as const

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
    })
  }
}

async function seedReaders(hash: (password: string) => Promise<string>) {
  const readerSeeds: ReaderSeed[] = [
    ...studentNames.map((fullName, index) => ({
      username: `sv${String(index + 1).padStart(3, '0')}`,
      fullName,
      studentCode: `SV25${String(index + 1).padStart(3, '0')}`,
      readerType: 'student' as const,
      email: `sv${String(index + 1).padStart(3, '0')}@utt.edu.vn`,
      phone: `0912${String(1000 + index).padStart(4, '0')}`,
      address: index % 2 === 0 ? 'Hà Nội' : 'Hưng Yên',
      dob: new Date(2001 + (index % 4), (index * 2) % 12, 3 + (index % 20)),
    })),
    ...lecturerNames.map((fullName, index) => ({
      username: `gv${String(index + 1).padStart(3, '0')}`,
      fullName,
      studentCode: `GV25${String(index + 1).padStart(3, '0')}`,
      readerType: 'lecturer' as const,
      email: `gv${String(index + 1).padStart(3, '0')}@utt.edu.vn`,
      phone: `0988${String(2000 + index).padStart(4, '0')}`,
      address: index % 2 === 0 ? 'Hà Nội' : 'Nam Định',
      dob: new Date(1978 + (index % 12), (index * 3) % 12, 4 + (index % 20)),
    })),
  ]

  const readerRecords = [] as Array<{ id: number; username: string; studentCode: string; fullName: string; readerType: 'student' | 'lecturer' }>

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
    })

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
    })

    readerRecords.push({
      id: user.id,
      username: reader.username,
      studentCode: reader.studentCode,
      fullName: reader.fullName,
      readerType: reader.readerType,
    })
  }

  return readerRecords
}

async function seedBooks() {
  const seededBooks = [] as Array<{ id: number; bookCode: string; title: string; category: string }>

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
        description: book.description,
        availableQty: book.totalQty,
      },
      create: {
        ...book,
        availableQty: book.totalQty,
      },
    })

    seededBooks.push({
      id: created.id,
      bookCode: created.bookCode,
      title: created.title,
      category: created.category,
    })
  }

  return seededBooks
}

async function ensureBorrowSeed(seed: BorrowSeed) {
  const existing = await prisma.borrow.findFirst({
    where: {
      userId: seed.userId,
      bookId: seed.bookId,
      borrowDate: seed.borrowDate,
      dueDate: seed.dueDate,
      status: seed.status,
      returnDate: seed.returnDate,
    },
  })

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
      })
    }

    return existing
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
  })

  if (seed.status === 'RETURNED') {
    await prisma.returnRecord.create({
      data: {
        borrowId: created.id,
        returnDate: seed.returnDate ?? new Date(),
        fineAmount: seed.fineAmount,
        exemptionReason: null,
      },
    })
  }

  return created
}

async function seedBorrowHistory(readerRecords: Array<{ id: number; username: string; studentCode: string; fullName: string; readerType: 'student' | 'lecturer' }>, books: Array<{ id: number; bookCode: string; title: string; category: string }>) {
  const todayStart = toStartOfDay(new Date())
  const year2025Start = new Date(2025, 0, 1, 8, 0, 0, 0)
  const year2025End = new Date(2025, 11, 31, 17, 0, 0, 0)
  const year2026Start = new Date(2026, 0, 1, 8, 0, 0, 0)
  const year2026End = addDays(todayStart, -20)

  let fine2025Total = 0
  let fine2026Total = 0

  const booksByCategory = new Map<string, Array<{ id: number; bookCode: string; title: string; category: string }>>()
  for (const category of BORROW_CATEGORY_CYCLE) {
    booksByCategory.set(category, books.filter((book) => book.category === category))
  }

  const pickBook = (readerIndex: number, borrowIndex: number, phaseSeed: number) => {
    const category = BORROW_CATEGORY_CYCLE[(borrowIndex + phaseSeed) % BORROW_CATEGORY_CYCLE.length]
    const bucket = booksByCategory.get(category) || books
    return bucket[(readerIndex * 17 + borrowIndex * 11 + phaseSeed) % bucket.length]
  }

  for (let readerIndex = 0; readerIndex < readerRecords.length; readerIndex++) {
    const reader = readerRecords[readerIndex]
    const plan = readerPlans[readerIndex] ?? fallbackReaderPlan

    for (let i = 0; i < plan.returned2025; i++) {
      const book = pickBook(readerIndex, i, 1)
      const borrowDate = distributeDate(year2025Start, year2025End, i, plan.returned2025, readerIndex)
      const dueDate = addDays(borrowDate, 14)
      const overdueDays = 2 + ((readerIndex + i) % 4)
      const returnDate = addDays(dueDate, overdueDays)
      fine2025Total += overdueDays * FINE_PER_DAY

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate,
        status: 'RETURNED',
        fineAmount: overdueDays * FINE_PER_DAY,
      })
    }

    for (let i = 0; i < plan.returned2026; i++) {
      const book = pickBook(readerIndex, i, 3)
      const borrowDate = distributeDate(year2026Start, year2026End, i, plan.returned2026, readerIndex)
      const dueDate = addDays(borrowDate, 14)
      const overdueDays = 2 + ((readerIndex + i) % 3)
      const returnDate = addDays(dueDate, overdueDays)
      fine2026Total += overdueDays * FINE_PER_DAY

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate,
        status: 'RETURNED',
        fineAmount: overdueDays * FINE_PER_DAY,
      })
    }

    for (let i = 0; i < plan.activeCurrent; i++) {
      const book = pickBook(readerIndex, i, 5)
      const borrowDate = addMinutes(addDays(todayStart, -3), readerIndex * 7 + i)
      const dueDate = addDays(todayStart, 7 + ((readerIndex + i) % 7))

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate: null,
        status: 'BORROWING',
        fineAmount: 0,
      })
    }

    for (let i = 0; i < plan.overdueCurrent; i++) {
      const book = pickBook(readerIndex, i, 7)
      const borrowDate = addMinutes(addDays(todayStart, -18), readerIndex * 9 + i)
      const dueDate = addDays(todayStart, -(1 + ((readerIndex + i) % 7)))

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate: null,
        status: 'BORROWING',
        fineAmount: 0,
      })
    }
  }

  return {
    fine2025Total,
    fine2026Total,
  }
}

async function ensureListedAccountsHaveBorrows(
  readerRecords: Array<{ id: number; username: string; studentCode: string; fullName: string; readerType: 'student' | 'lecturer' }>,
  books: Array<{ id: number; bookCode: string; title: string; category: string }>
) {
  const start = new Date(2025, 0, 15, 9, 0, 0, 0)
  const end = new Date(2026, 3, 15, 17, 0, 0, 0)

  const booksByCategory = new Map<string, Array<{ id: number; bookCode: string; title: string; category: string }>>()
  for (const category of BORROW_CATEGORY_CYCLE) {
    booksByCategory.set(category, books.filter((book) => book.category === category))
  }

  for (const username of mustHaveBorrowUsernames) {
    const reader = readerRecords.find((item) => item.username === username)
    if (!reader) continue

    const totalBorrows = await prisma.borrow.count({ where: { userId: reader.id } })
    if (totalBorrows > 0) continue

    for (let i = 0; i < 7; i++) {
      const category = BORROW_CATEGORY_CYCLE[i % BORROW_CATEGORY_CYCLE.length]
      const bucket = booksByCategory.get(category) || books
      const book = bucket[(reader.id + i * 5) % bucket.length]
      const borrowDate = distributeDate(start, end, i, 7, reader.id)
      const dueDate = addDays(borrowDate, 14)
      const overdueDays = i % 2 === 0 ? 2 : 0
      const returnDate = overdueDays > 0 ? addDays(dueDate, overdueDays) : dueDate

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate,
        status: 'RETURNED',
        fineAmount: overdueDays * FINE_PER_DAY,
      })
    }
  }
}

async function syncAvailableQty(bookIds: number[]) {
  const activeBorrows = await prisma.borrow.groupBy({
    by: ['bookId'],
    where: {
      bookId: { in: bookIds },
      status: 'BORROWING',
    },
    _count: { bookId: true },
  })

  const activeMap = new Map<number, number>()
  activeBorrows.forEach((item) => {
    activeMap.set(item.bookId, item._count.bookId)
  })

  const seededBookRows = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, totalQty: true },
  })

  for (const book of seededBookRows) {
    const activeCount = activeMap.get(book.id) || 0
    await prisma.book.update({
      where: { id: book.id },
      data: { availableQty: Math.max(0, book.totalQty - activeCount) },
    })
  }
}

async function rebalanceCategoryBorrowDistribution(
  readerRecords: Array<{ id: number; username: string; studentCode: string; fullName: string; readerType: 'student' | 'lecturer' }>,
  books: Array<{ id: number; bookCode: string; title: string; category: string }>
) {
  const bookIds = books.map((book) => book.id)

  const categoryOfBook = new Map<number, string>()
  books.forEach((book) => {
    categoryOfBook.set(book.id, book.category)
  })

  const booksByCategory = new Map<string, Array<{ id: number; bookCode: string; title: string; category: string }>>()
  for (const category of BORROW_CATEGORY_CYCLE) {
    booksByCategory.set(category, books.filter((book) => book.category === category))
  }

  const grouped = await prisma.borrow.groupBy({
    by: ['bookId'],
    where: { bookId: { in: bookIds } },
    _count: { bookId: true },
  })

  const currentByCategory = new Map<string, number>()
  for (const category of BORROW_CATEGORY_CYCLE) {
    currentByCategory.set(category, 0)
  }

  grouped.forEach((item) => {
    const category = categoryOfBook.get(item.bookId)
    if (!category) return
    currentByCategory.set(category, (currentByCategory.get(category) || 0) + item._count.bookId)
  })

  const maxCount = Math.max(...Array.from(currentByCategory.values()))
  const targetCount = Math.max(0, maxCount - 10)

  const start = new Date(2025, 0, 20, 8, 0, 0, 0)
  const end = new Date(2026, 3, 15, 18, 0, 0, 0)

  for (let categoryIndex = 0; categoryIndex < BORROW_CATEGORY_CYCLE.length; categoryIndex++) {
    const category = BORROW_CATEGORY_CYCLE[categoryIndex]
    const current = currentByCategory.get(category) || 0
    const deficit = Math.max(0, targetCount - current)
    if (deficit === 0) continue

    const bucket = booksByCategory.get(category) || []
    if (bucket.length === 0) continue

    for (let i = 0; i < deficit; i++) {
      const reader = readerRecords[(i + categoryIndex) % readerRecords.length]
      const book = bucket[(i * 7 + reader.id) % bucket.length]
      const borrowDate = distributeDate(start, end, i, deficit, categoryIndex * 13)
      const dueDate = addDays(borrowDate, 14)
      const overdueDays = (i + categoryIndex) % 4
      const returnDate = overdueDays > 0 ? addDays(dueDate, overdueDays) : dueDate

      await ensureBorrowSeed({
        userId: reader.id,
        bookId: book.id,
        borrowDate,
        dueDate,
        returnDate,
        status: 'RETURNED',
        fineAmount: overdueDays * FINE_PER_DAY,
      })
    }
  }
}

async function main() {
  const hash = async (password: string) => bcrypt.hash(password, 10)

  await prisma.config.upsert({
    where: { key: 'fine_per_day' },
    update: { value: String(FINE_PER_DAY) },
    create: { key: 'fine_per_day', value: String(FINE_PER_DAY) },
  })
  await prisma.config.upsert({
    where: { key: 'borrow_days' },
    update: { value: '14' },
    create: { key: 'borrow_days', value: '14' },
  })
  await prisma.config.upsert({
    where: { key: 'max_books' },
    update: { value: '3' },
    create: { key: 'max_books', value: '3' },
  })

  await seedBaseUsers(hash)
  const readerRecords = await seedReaders(hash)
  const bookRecords = await seedBooks()
  const fines = await seedBorrowHistory(readerRecords, bookRecords)
  await ensureListedAccountsHaveBorrows(readerRecords, bookRecords)
  await rebalanceCategoryBorrowDistribution(readerRecords, bookRecords)

  await syncAvailableQty(bookRecords.map((book) => book.id))

  const todayStart = toStartOfDay(new Date())
  const readerUserIds = readerRecords.map((reader) => reader.id)

  const borrowCount2025 = await prisma.borrow.count({
    where: {
      userId: { in: readerUserIds },
      borrowDate: {
        gte: new Date(2025, 0, 1),
        lt: new Date(2026, 0, 1),
      },
    },
  })

  const borrowCount2026 = await prisma.borrow.count({
    where: {
      userId: { in: readerUserIds },
      borrowDate: {
        gte: new Date(2026, 0, 1),
        lt: addDays(todayStart, 1),
      },
    },
  })

  const activeBorrowCount = await prisma.borrow.count({
    where: {
      userId: { in: readerUserIds },
      status: 'BORROWING',
      dueDate: { gte: todayStart },
    },
  })

  const overdueBorrowCount = await prisma.borrow.count({
    where: {
      userId: { in: readerUserIds },
      status: 'BORROWING',
      dueDate: { lt: todayStart },
    },
  })

  console.log('Seed completed!')
  console.log('Khong xoa du lieu cu. Chi upsert va bo sung du lieu thieu.')
  console.log(`Doc gia da seed: ${readerRecords.length} (35 hoc sinh, 15 giao vien)`)
  console.log(`Dau sach da seed: ${bookRecords.length} (70 dau sach)`)
  console.log(`Tong luot muon 2025: ${borrowCount2025}`)
  console.log(`Tong luot muon tu dau 2026 den nay: ${borrowCount2026}`)
  console.log(`So phieu dang muon: ${activeBorrowCount}`)
  console.log(`So phieu qua han: ${overdueBorrowCount}`)
  console.log(`Tien phat 2025 (du kien): ${fines.fine2025Total}`)
  console.log(`Tien phat 2026 (du kien): ${fines.fine2026Total}`)
  console.log('Tai khoan mau:')
  console.log('  Admin: admin / admin123')
  console.log('  Thu thu: thuthu / thuthu123')
  console.log('  Sinh vien mau: sv001 / sv123456')
  console.log('  Giang vien mau: gv001 / gv123456')
}

main()
  .catch((error) => {
    console.error(error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
