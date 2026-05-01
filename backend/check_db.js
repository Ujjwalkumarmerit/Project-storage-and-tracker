const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`Email: ${u.email}, Hash: ${u.password}`);
    const match = await bcrypt.compare('admin123', u.password);
    console.log(`Matches admin123? ${match}`);
  }
}

check().finally(() => process.exit(0));
