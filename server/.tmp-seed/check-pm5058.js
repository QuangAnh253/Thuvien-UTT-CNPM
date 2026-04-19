const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const borrow = await prisma.borrow.findFirst({
    where: { id: 5058 },
    include: { book: true, user: { include: { student: true } }, returnRecord: true },
  });
  console.log(JSON.stringify({
    id: borrow?.id,
    status: borrow?.status,
    dueDate: borrow?.dueDate,
    returnDate: borrow?.returnDate,
    fineAmount: borrow?.returnRecord?.fineAmount ?? null,
    derivedFine: borrow && borrow.dueDate && borrow.returnDate ? Math.max(0, Math.floor((new Date(borrow.returnDate).setHours(0,0,0,0) - new Date(borrow.dueDate).setHours(0,0,0,0)) / 86400000)) * 5000 : null,
    book: borrow?.book?.title,
    student: borrow?.user?.student?.fullName,
  }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
