import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBigIntId, serializePrisma } from '../common/prisma.utils';
import { hash, compare } from 'bcryptjs';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(id: string, body: UpdateAdminProfileDto) {
    const adminUserId = parseBigIntId(id, 'adminUserId');
    const user = await this.prisma.admin_users.findUnique({
      where: { id: adminUserId },
    });

    if (!user) {
      throw new NotFoundException(`Admin user ${id} not found`);
    }

    const data: any = {};
    if (body.name) data.name = body.name.trim();
    if (body.email) data.email = body.email.trim();

    if (body.new_password) {
      if (!body.current_password) {
        throw new BadRequestException('Current password is required to change password');
      }

      const isMatch = await compare(body.current_password, user.password_hash);
      if (!isMatch) {
        throw new BadRequestException('Current password does not match');
      }

      data.password_hash = await hash(body.new_password, 10);
    }

    const updated = await this.prisma.admin_users.update({
      where: { id: adminUserId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    return serializePrisma(updated);
  }

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
