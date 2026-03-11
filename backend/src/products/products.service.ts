import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseBigIntId,
  parseDecimalInput,
  parseNonNegativeInt,
  serializePrisma,
} from '../common/prisma.utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const products = await this.prisma.products.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        product_images: {
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            is_primary: true,
            sort_order: true,
          },
        },
        product_options: {
          orderBy: [{ option_name: 'asc' }, { option_value: 'asc' }],
          select: {
            id: true,
            option_name: true,
            option_value: true,
            extra_price: true,
            stock_qty: true,
            sku: true,
          },
        },
      },
    });

    return serializePrisma(products);
  }

  async findOne(id: string) {
    const productId = parseBigIntId(id, 'productId');
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        product_images: {
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            is_primary: true,
            sort_order: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_options: {
          orderBy: [{ option_name: 'asc' }, { option_value: 'asc' }],
          select: {
            id: true,
            option_name: true,
            option_value: true,
            extra_price: true,
            stock_qty: true,
            sku: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return serializePrisma(product);
  }

  async create(body: CreateProductDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    const basePrice = parseDecimalInput(body.base_price, 'base_price');
    const options = body.options ?? [];
    const images = this.normalizeImages(body.images ?? []);

    const uniqueOptions = new Set<string>();
    for (const [index, option] of options.entries()) {
      if (!option.option_name?.trim()) {
        throw new BadRequestException(
          `options[${index}].option_name is required`,
        );
      }

      if (!option.option_value?.trim()) {
        throw new BadRequestException(
          `options[${index}].option_value is required`,
        );
      }

      const key = `${option.option_name.trim()}:${option.option_value.trim()}`;
      if (uniqueOptions.has(key)) {
        throw new BadRequestException(`Duplicate product option ${key}`);
      }
      uniqueOptions.add(key);
    }

    const product = await this.prisma.products.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim(),
        base_price: new Prisma.Decimal(basePrice),
        status: body.status?.trim() || 'ON_SALE',
        product_images: images.length
          ? {
              create: images,
            }
          : undefined,
        product_options: options.length
          ? {
              create: options.map((option, index) => ({
                option_name: option.option_name.trim(),
                option_value: option.option_value.trim(),
                extra_price: parseDecimalInput(
                  option.extra_price ?? 0,
                  `options[${index}].extra_price`,
                ),
                stock_qty:
                  option.stock_qty === undefined
                    ? 0
                    : parseNonNegativeInt(
                        option.stock_qty,
                        `options[${index}].stock_qty`,
                      ),
                sku: option.sku?.trim() || null,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        product_images: {
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            is_primary: true,
            sort_order: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_options: {
          orderBy: [{ option_name: 'asc' }, { option_value: 'asc' }],
          select: {
            id: true,
            option_name: true,
            option_value: true,
            extra_price: true,
            stock_qty: true,
            sku: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    return serializePrisma(product);
  }

  async update(id: string, body: UpdateProductDto) {
    const productId = parseBigIntId(id, 'productId');
    await this.ensureProductExists(productId, id);

    const options = body.options ?? [];
    const images =
      body.images === undefined ? undefined : this.normalizeImages(body.images ?? []);
    const uniqueOptions = new Set<string>();
    for (const [index, option] of options.entries()) {
      const optionName = option.option_name?.trim() || '';
      const optionValue = option.option_value?.trim() || '';
      if (!optionName || !optionValue) {
        throw new BadRequestException(
          `options[${index}] requires both option_name and option_value`,
        );
      }

      const key = `${optionName}:${optionValue}`;
      if (uniqueOptions.has(key)) {
        throw new BadRequestException(`Duplicate product option ${key}`);
      }
      uniqueOptions.add(key);
    }

    if (options.length) {
      await this.prisma.product_options.deleteMany({
        where: { product_id: productId },
      });
    }

    if (images !== undefined) {
      await this.prisma.product_images.deleteMany({
        where: { product_id: productId },
      });
    }

    const product = await this.prisma.products.update({
      where: { id: productId },
      data: {
        name: body.name?.trim(),
        description: body.description?.trim(),
        base_price: body.base_price
          ? parseDecimalInput(body.base_price, 'base_price')
          : undefined,
        status: body.status?.trim(),
        product_images:
          images && images.length
            ? {
                create: images,
              }
            : images !== undefined
              ? { create: [] }
              : undefined,
        product_options: options.length
          ? {
              create: options.map((option, index) => ({
                option_name: option.option_name!.trim(),
                option_value: option.option_value!.trim(),
                extra_price: parseDecimalInput(
                  option.extra_price ?? 0,
                  `options[${index}].extra_price`,
                ),
                stock_qty:
                  option.stock_qty === undefined
                    ? 0
                    : parseNonNegativeInt(
                        option.stock_qty,
                        `options[${index}].stock_qty`,
                      ),
                sku: option.sku?.trim() || null,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        product_images: {
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            is_primary: true,
            sort_order: true,
            created_at: true,
            updated_at: true,
          },
        },
        product_options: {
          orderBy: [{ option_name: 'asc' }, { option_value: 'asc' }],
          select: {
            id: true,
            option_name: true,
            option_value: true,
            extra_price: true,
            stock_qty: true,
            sku: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    });

    return serializePrisma(product);
  }

  async remove(id: string) {
    const productId = parseBigIntId(id, 'productId');
    await this.ensureProductExists(productId, id);

    const dependentRows = await Promise.all([
      this.prisma.cart_items.count({ where: { product_id: productId } }),
      this.prisma.order_items.count({ where: { product_id: productId } }),
    ]);

    if (dependentRows.some((count) => count > 0)) {
      throw new BadRequestException(
        'Cannot delete a product referenced by cart items or order items',
      );
    }

    await this.prisma.product_options.deleteMany({
      where: { product_id: productId },
    });
    await this.prisma.products.delete({
      where: { id: productId },
    });

    return { success: true };
  }

  private async ensureProductExists(productId: bigint, rawId: string) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${rawId} not found`);
    }
  }

  private normalizeImages(
    images: Array<{
      url?: string;
      alt?: string;
      is_primary?: boolean;
      sort_order?: number;
    }>,
  ) {
    if (!images.length) {
      return [];
    }

    const normalized = images.map((image, index) => {
      const url = image.url?.trim();
      if (!url) {
        throw new BadRequestException(`images[${index}].url is required`);
      }

      return {
        url,
        alt: image.alt?.trim() || null,
        is_primary: Boolean(image.is_primary),
        sort_order:
          image.sort_order === undefined
            ? index
            : parseNonNegativeInt(image.sort_order, `images[${index}].sort_order`),
      };
    });

    if (!normalized.some((img) => img.is_primary)) {
      normalized[0].is_primary = true;
    }

    return normalized;
  }
}
