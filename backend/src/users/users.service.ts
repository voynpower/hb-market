import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { parseBigIntId, serializePrisma } from '../common/prisma.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(id: string, body: UpdateUserProfileDto) {
    const userId = parseBigIntId(id, 'userId');
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const data: any = {};
    if (body.name) data.name = body.name.trim();
    if (body.phone) data.phone = body.phone.trim();

    if (body.email && body.email.trim() !== user.email) {
      const existing = await this.prisma.users.findUnique({
        where: { email: body.email.trim() },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      data.email = body.email.trim();
    }

    if (body.new_password) {
      if (!body.current_password) {
        throw new BadRequestException('Current password required to set new password');
      }
      const isMatch = await compare(body.current_password, user.password_hash);
      if (!isMatch) {
        throw new BadRequestException('Current password does not match');
      }
      data.password_hash = await hash(body.new_password, 10);
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    return serializePrisma(updated);
  }

  async findAll() {
    const users = await this.prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return serializePrisma(users);
  }

  async findOne(id: string) {
    const userId = parseBigIntId(id, 'userId');
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
        addresses: {
          select: {
            id: true,
            recipient_name: true,
            recipient_phone: true,
            zip_code: true,
            address1: true,
            address2: true,
            is_default: true,
          },
        },
        orders: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            order_number: true,
            order_status: true,
            payment_status: true,
            delivery_status: true,
            total_amount: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return serializePrisma(user);
  }

  async create(body: CreateUserDto) {
    if (!body.email?.trim()) {
      throw new BadRequestException('email is required');
    }

    if (!body.password?.trim()) {
      throw new BadRequestException('password is required');
    }

    if (!body.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const existingUser = await this.prisma.users.findUnique({
      where: { email: body.email.trim() },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${body.email} already exists`);
    }

    const defaultAddressCount =
      body.addresses?.filter((address) => address.is_default).length ?? 0;

    if (defaultAddressCount > 1) {
      throw new BadRequestException('Only one default address is allowed');
    }

    const passwordHash = await hash(body.password.trim(), 10);

    const user = await this.prisma.users.create({
      data: {
        email: body.email.trim(),
        password_hash: passwordHash,
        name: body.name.trim(),
        phone: body.phone?.trim(),
        role: 'USER',
        status: body.status?.trim() || 'ACTIVE',
        addresses: body.addresses?.length
          ? {
              create: body.addresses.map((address) => ({
                recipient_name: address.recipient_name.trim(),
                recipient_phone: address.recipient_phone.trim(),
                zip_code: address.zip_code.trim(),
                address1: address.address1.trim(),
                address2: address.address2?.trim(),
                is_default: address.is_default ?? false,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        updated_at: true,
        addresses: {
          select: {
            id: true,
            recipient_name: true,
            recipient_phone: true,
            zip_code: true,
            address1: true,
            address2: true,
            is_default: true,
          },
        },
      },
    });

    return serializePrisma(user);
  }

  findByEmailForAuth(email: string) {
    return this.prisma.users.findUnique({
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
}
