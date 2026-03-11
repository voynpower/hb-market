import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBigIntId, parseBigIntInput, serializePrisma } from '../common/prisma.utils';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userIdValue: string) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const addresses = await this.prisma.addresses.findMany({
      where: { user_id: userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      select: {
        id: true,
        recipient_name: true,
        recipient_phone: true,
        zip_code: true,
        address1: true,
        address2: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });

    return serializePrisma(addresses);
  }

  async create(userIdValue: string, body: CreateAddressDto) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    await this.ensureSingleDefault(userId, body.is_default ?? false);

    const address = await this.prisma.addresses.create({
      data: {
        user_id: userId,
        recipient_name: body.recipient_name.trim(),
        recipient_phone: body.recipient_phone.trim(),
        zip_code: body.zip_code.trim(),
        address1: body.address1.trim(),
        address2: body.address2?.trim(),
        is_default: body.is_default ?? false,
      },
      select: {
        id: true,
        recipient_name: true,
        recipient_phone: true,
        zip_code: true,
        address1: true,
        address2: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });

    return serializePrisma(address);
  }

  async update(userIdValue: string, addressIdValue: string, body: UpdateAddressDto) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const addressId = parseBigIntId(addressIdValue, 'addressId');
    await this.ensureAddressOwner(userId, addressId);

    await this.ensureSingleDefault(userId, body.is_default ?? false, addressId);

    const address = await this.prisma.addresses.update({
      where: { id: addressId },
      data: {
        recipient_name: body.recipient_name?.trim(),
        recipient_phone: body.recipient_phone?.trim(),
        zip_code: body.zip_code?.trim(),
        address1: body.address1?.trim(),
        address2: body.address2?.trim(),
        is_default: body.is_default,
      },
      select: {
        id: true,
        recipient_name: true,
        recipient_phone: true,
        zip_code: true,
        address1: true,
        address2: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
    });

    return serializePrisma(address);
  }

  async remove(userIdValue: string, addressIdValue: string) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const addressId = parseBigIntId(addressIdValue, 'addressId');
    await this.ensureAddressOwner(userId, addressId);

    const linkedOrders = await this.prisma.orders.count({
      where: { address_id: addressId },
    });

    if (linkedOrders > 0) {
      throw new BadRequestException('Cannot delete an address linked to existing orders');
    }

    await this.prisma.addresses.delete({
      where: { id: addressId },
    });

    return { success: true };
  }

  private async ensureAddressOwner(userId: bigint, addressId: bigint) {
    const address = await this.prisma.addresses.findFirst({
      where: { id: addressId, user_id: userId },
      select: { id: true },
    });

    if (!address) {
      throw new NotFoundException(`Address ${addressId.toString()} not found`);
    }
  }

  private async ensureSingleDefault(
    userId: bigint,
    wantsDefault: boolean,
    currentAddressId?: bigint,
  ) {
    if (!wantsDefault) {
      return;
    }

    await this.prisma.addresses.updateMany({
      where: {
        user_id: userId,
        ...(currentAddressId ? { NOT: { id: currentAddressId } } : {}),
      },
      data: { is_default: false },
    });
  }
}
