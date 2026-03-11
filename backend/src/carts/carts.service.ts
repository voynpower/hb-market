import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseBigIntId,
  parseBigIntInput,
  serializePrisma,
} from '../common/prisma.utils';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCart(userIdValue: string) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const cart = await this.ensureCart(userId);
    return this.findCartById(cart.id);
  }

  async addItem(userIdValue: string, body: AddCartItemDto) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const cart = await this.ensureCart(userId);
    const productId = parseBigIntInput(body.product_id, 'product_id');
    const optionId = body.product_option_id
      ? parseBigIntInput(body.product_option_id, 'product_option_id')
      : null;

    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        base_price: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId.toString()} not found`);
    }

    if (product.status !== 'ON_SALE') {
      throw new BadRequestException('Product is not on sale');
    }

    const option = optionId
      ? await this.prisma.product_options.findUnique({
          where: { id: optionId },
          select: {
            id: true,
            product_id: true,
            extra_price: true,
            stock_qty: true,
          },
        })
      : null;

    if (optionId && !option) {
      throw new NotFoundException(`Option ${optionId.toString()} not found`);
    }

    if (option && option.product_id !== product.id) {
      throw new BadRequestException('Option does not belong to the selected product');
    }

    if (option && option.stock_qty < body.quantity) {
      throw new BadRequestException('Option stock is insufficient');
    }

    const unitPrice = option
      ? product.base_price.plus(option.extra_price)
      : product.base_price;

    const existingItem = await this.prisma.cart_items.findFirst({
      where: {
        cart_id: cart.id,
        product_id: product.id,
        product_option_id: option?.id ?? null,
      },
      select: { id: true, quantity: true },
    });

    if (existingItem) {
      await this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + body.quantity,
          unit_price: unitPrice,
        },
      });
    } else {
      await this.prisma.cart_items.create({
        data: {
          cart_id: cart.id,
          product_id: product.id,
          product_option_id: option?.id ?? null,
          quantity: body.quantity,
          unit_price: unitPrice,
        },
      });
    }

    return this.findCartById(cart.id);
  }

  async updateItem(
    userIdValue: string,
    cartItemIdValue: string,
    body: UpdateCartItemDto,
  ) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const cartItemId = parseBigIntId(cartItemIdValue, 'cartItemId');

    const cartItem = await this.prisma.cart_items.findUnique({
      where: { id: cartItemId },
      select: {
        id: true,
        cart_id: true,
        product_id: true,
        product_option_id: true,
        carts: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!cartItem || cartItem.carts.user_id !== userId) {
      throw new NotFoundException(`Cart item ${cartItemIdValue} not found`);
    }

    if (cartItem.product_option_id) {
      const option = await this.prisma.product_options.findUnique({
        where: { id: cartItem.product_option_id },
        select: { stock_qty: true },
      });

      if (!option || option.stock_qty < body.quantity) {
        throw new BadRequestException('Option stock is insufficient');
      }
    }

    await this.prisma.cart_items.update({
      where: { id: cartItem.id },
      data: { quantity: body.quantity },
    });

    return this.findCartById(cartItem.cart_id);
  }

  async removeItem(userIdValue: string, cartItemIdValue: string) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const cartItemId = parseBigIntId(cartItemIdValue, 'cartItemId');

    const cartItem = await this.prisma.cart_items.findUnique({
      where: { id: cartItemId },
      select: {
        id: true,
        cart_id: true,
        carts: {
          select: {
            user_id: true,
          },
        },
      },
    });

    if (!cartItem || cartItem.carts.user_id !== userId) {
      throw new NotFoundException(`Cart item ${cartItemIdValue} not found`);
    }

    await this.prisma.cart_items.delete({
      where: { id: cartItem.id },
    });

    return this.findCartById(cartItem.cart_id);
  }

  private async ensureCart(userId: bigint) {
    const existingCart = await this.prisma.carts.findUnique({
      where: { user_id: userId },
      select: { id: true, user_id: true },
    });

    if (existingCart) {
      return existingCart;
    }

    return this.prisma.carts.create({
      data: { user_id: userId },
      select: { id: true, user_id: true },
    });
  }

  private async findCartById(cartId: bigint) {
    const cart = await this.prisma.carts.findUnique({
      where: { id: cartId },
      select: {
        id: true,
        user_id: true,
        created_at: true,
        updated_at: true,
        cart_items: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            product_id: true,
            product_option_id: true,
            quantity: true,
            unit_price: true,
            created_at: true,
            updated_at: true,
            products: {
              select: {
                id: true,
                name: true,
                status: true,
                base_price: true,
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
              },
            },
            product_options: {
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
        },
      },
    });

    return serializePrisma(cart);
  }
}
