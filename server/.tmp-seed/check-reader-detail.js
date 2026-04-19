const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const reader = await prisma.student.findFirst({
    where: { id: 1 },
    include: { user: { include: { borrows: { include: { book: true, returnRecord: true }, orderBy: { borrowDate: 'desc' } } } } },
  });
  const borrows = reader?.user?.borrows || [];
  const stats = {
    total: borrows.length,
    active: borrows.filter((b) => !b.returnDate && b.status === 'BORROWING').length,
    overdue: borrows.filter((b) => !b.returnDate && b.status === 'BORROWING' && new Date(b.dueDate) < new Date()).length,
    fines: borrows.reduce((sum, b) => sum + Number(b.returnRecord?.fineAmount || b.fine || 0), 0),
  };
  console.log(JSON.stringify({ sampleBorrow: borrows[0] ? { id: borrows[0].id, book: borrows[0].book?.title, fine: borrows[0].returnRecord?.fineAmount, returnDate: borrows[0].returnDate } : null, stats }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
