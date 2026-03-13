"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bcryptjs_1 = require("bcryptjs");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("@prisma/client");
function readArg(flag) {
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
        throw new Error('Usage: npm run admin:create -- --email admin@hb.com --password your-password --name "Admin User"');
    }
    const parsedUrl = new URL(databaseUrl);
    const adapter = new adapter_mariadb_1.PrismaMariaDb({
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port || 3306),
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: parsedUrl.pathname.replace(/^\//, ''),
    });
    const prisma = new client_1.PrismaClient({ adapter });
    try {
        const passwordHash = await (0, bcryptjs_1.hash)(password, 10);
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
        console.log(`Admin user ready: ${adminUser.email} (${adminUser.role}, ${adminUser.status})`);
    }
    finally {
        await prisma.$disconnect();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
//# sourceMappingURL=create-admin-user.js.map