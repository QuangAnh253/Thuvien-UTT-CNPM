const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthlyFine = await prisma.returnRecord.aggregate({
    _sum: { fineAmount: true },
    where: { returnDate: { gte: monthStart, lt: nextMonthStart } },
  });
  const monthlyReturns = await prisma.returnRecord.count({
    where: { returnDate: { gte: monthStart, lt: nextMonthStart } },
  });
  console.log(JSON.stringify({ monthlyFine: monthlyFine._sum.fineAmount || 0, monthlyReturns }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
