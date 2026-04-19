const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const cnt = await prisma.student.count();
  console.log(JSON.stringify({ studentCount: cnt }, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
