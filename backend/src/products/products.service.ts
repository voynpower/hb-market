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

  async findAll(status?: string, category_id?: string, search?: string, sort?: string) {
    const where: Prisma.productsWhereInput = {};
    
    // Status filter
    if (status) where.status = status;
    
    // Category filter
    if (category_id) where.category_id = parseBigIntId(category_id, 'categoryId');
    
    // Search filter (Name or Description)
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Sorting logic
    let orderBy: Prisma.productsOrderByWithRelationInput = { created_at: 'desc' }; // Default: Latest
    
    if (sort === 'price_asc') {
      orderBy = { base_price: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { base_price: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    }

    const products = await this.prisma.products.findMany({
      where,
      orderBy,
      select: {
        id: true,
        category_id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: { id: true, name: true }
        },
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
        category_id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: { id: true, name: true }
        },
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
    const categoryId = body.category_id ? parseBigIntId(body.category_id, 'categoryId') : null;

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
        category_id: categoryId,
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
        category_id: true,
        name: true,
        description: true,
        base_price: true,
        status: true,
        created_at: true,
        updated_at: true,
        categories: {
          select: { id: true, name: true }
        },
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
    const categoryId = body.category_id !== undefined 
      ? (body.category_id ? parseBigIntId(body.category_id, 'categoryId') : null)
      : undefined;

    // 1. Update the main product information first (always should succeed)
    await this.prisma.products.update({
      where: { id: productId },
      data: {
        name: body.name?.trim(),
        description: body.description?.trim(),
        base_price: body.base_price
          ? parseDecimalInput(body.base_price, 'base_price')
          : undefined,
        status: body.status?.trim(),
        category_id: categoryId,
      },
    });

    // 2. Try to update images if provided
    if (images !== undefined) {
      try {
        await this.prisma.$transaction([
          this.prisma.product_images.deleteMany({ where: { product_id: productId } }),
          this.prisma.product_images.createMany({
            data: images.map((img) => ({ ...img, product_id: productId })),
          }),
        ]);
      } catch (e) {
        console.warn(`Could not update images for product ${id}: ${e.message}`);
      }
    }

    // 3. Try to update options if provided
    if (options.length) {
      try {
        await this.prisma.$transaction([
          this.prisma.product_options.deleteMany({ where: { product_id: productId } }),
          this.prisma.product_options.createMany({
            data: options.map((option, index) => ({
              product_id: productId,
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
          }),
        ]);
      } catch (e) {
        console.warn(`Could not update options for product ${id}: ${e.message}`);
      }
    }

    // Return the final state of the product
    return this.findOne(id);
  }

  async remove(id: string) {
    const productId = parseBigIntId(id, 'productId');
    await this.ensureProductExists(productId, id);

    // Force delete: Remove all references first to satisfy foreign key constraints.
    // This allows the admin to delete any product, even if it was previously ordered.
    await this.prisma.$transaction(async (tx) => {
      // 1. Remove from cart items
      await tx.cart_items.deleteMany({
        where: { product_id: productId },
      });

      // 2. Remove from order items
      await tx.order_items.deleteMany({
        where: { product_id: productId },
      });

      // 3. Remove product images
      await tx.product_images.deleteMany({
        where: { product_id: productId },
      });

      // 4. Remove product options
      await tx.product_options.deleteMany({
        where: { product_id: productId },
      });

      // 5. Finally remove the product itself
      await tx.products.delete({
        where: { id: productId },
      });
    });

    return { success: true };
  }

  async updateOptionStock(optionIdValue: string, stockQty: number) {
    const optionId = parseBigIntId(optionIdValue, 'optionId');
    const updated = await this.prisma.product_options.update({
      where: { id: optionId },
      data: { stock_qty: stockQty },
    });
    return serializePrisma(updated);
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
