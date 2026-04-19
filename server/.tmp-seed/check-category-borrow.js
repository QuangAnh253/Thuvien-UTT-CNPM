const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const all = await prisma.borrow.groupBy({ by: ['bookId'], _count: { bookId: true } });
  const books = await prisma.book.findMany({ select: { id: true, category: true } });
  const catByBook = new Map(books.map((b) => [b.id, b.category]));
  const agg = {};
  for (const row of all) {
    const cat = catByBook.get(row.bookId) || 'Khac';
    agg[cat] = (agg[cat] || 0) + row._count.bookId;
  }
  console.table(agg);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
