const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const fineCollected = await prisma.returnRecord.aggregate({ _sum: { fineAmount: true } });
  const overdueOnly = await prisma.borrow.findMany({ where: { status: 'BORROWING', dueDate: { lt: new Date() } }, select: { id: true } });
  console.log(JSON.stringify({ fineCollected: fineCollected._sum.fineAmount || 0, overdueOnlyCount: overdueOnly.length }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
