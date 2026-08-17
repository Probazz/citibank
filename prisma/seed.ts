import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up admin only...');

  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@citibank.com' },
    update: {},
    create: {
      email: 'admin@citibank.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  console.log('✅ Admin ready: admin@citibank.com / Admin@123456');
  console.log('Real users must register through the app.');
}

main().catch(console.error).finally(() => prisma.$disconnect());