import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBigIntId, serializePrisma } from '../common/prisma.utils';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailForAuth(email: string) {
    return this.prisma.admin_users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password_hash: true,
        name: true,
        role: true,
        status: true,
      },
    });
  }

  async findAll() {
    const users = await this.prisma.admin_users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });
    return serializePrisma(users);
  }

  async create(data: { email: string; password_hash: string; name: string }) {
    const user = await this.prisma.admin_users.create({
      data: {
        ...data,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    return serializePrisma(user);
  }

  async findOne(id: string) {
    const adminUserId = parseBigIntId(id, 'adminUserId');
    const adminUser = await this.prisma.admin_users.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!adminUser) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    return serializePrisma(adminUser);
  }

  async touchLastLogin(id: string) {
    const adminUserId = parseBigIntId(id, 'adminUserId');
    await this.prisma.admin_users.update({
      where: { id: adminUserId },
      data: {
        last_login_at: new Date(),
      },
    });
  }
}
