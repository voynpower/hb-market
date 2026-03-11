import 'dotenv/config';
import { hash } from 'bcryptjs';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

function readArg(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = readArg('--email');
  const password = readArg('--password');
  const name = readArg('--name');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  if (!email || !password || !name) {
    throw new Error(
      'Usage: npm run admin:create -- --email admin@hb.com --password your-password --name "Admin User"',
    );
  }

  const parsedUrl = new URL(databaseUrl);
  const adapter = new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 3306),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.replace(/^\//, ''),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await hash(password, 10);
    const adminUser = await prisma.admin_users.upsert({
      where: { email },
      update: {
        name,
        password_hash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      create: {
        email,
        password_hash: passwordHash,
        name,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    console.log(
      `Admin user ready: ${adminUser.email} (${adminUser.role}, ${adminUser.status})`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
