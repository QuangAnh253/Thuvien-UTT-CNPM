const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const usernames = [
  'gv001','gv002','gv003','gv004','gv005','gv006','gv007','gv008','gv009','gv010','gv011','gv012','gv013','gv014','gv015',
  'sv020','sv021','sv022','sv023','sv024','sv025','sv026','sv027','sv028','sv029','sv030','sv031','sv032','sv033','sv034','sv035'
];

(async () => {
  const rows = [];
  for (const username of usernames) {
    const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    const borrowCount = user ? await prisma.borrow.count({ where: { userId: user.id } }) : 0;
    rows.push({ username, borrowCount });
  }
  console.table(rows);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
