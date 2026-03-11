import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import {
  parseBigIntId,
  parseBigIntInput,
  parsePositiveInt,
  serializePrisma,
} from '../common/prisma.utils';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

type RequestedOrderItem = {
  product_id: bigint;
  product_option_id: bigint | null;
  quantity: number;
  cart_item_id?: bigint;
};

type PreparedOrderItem = {
  product: {
    id: bigint;
    name: string;
    base_price: Prisma.Decimal;
    status: string;
  };
  option: {
    id: bigint;
    product_id: bigint;
    option_name: string;
    option_value: string;
    extra_price: Prisma.Decimal;
    stock_qty: number;
  } | null;
  quantity: number;
  unitPrice: Prisma.Decimal;
  totalPrice: Prisma.Decimal;
  cartItemId?: bigint;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const orders = await this.prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_number: true,
        order_status: true,
        payment_status: true,
        delivery_status: true,
        total_amount: true,
        created_at: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        addresses: {
          select: {
            id: true,
            recipient_name: true,
            recipient_phone: true,
            address1: true,
            address2: true,
            zip_code: true,
          },
        },
        order_items: {
          select: {
            id: true,
            product_name: true,
            option_name: true,
            option_value: true,
            quantity: true,
            unit_price: true,
            total_price: true,
          },
        },
        payments: {
          select: {
            id: true,
            payment_method: true,
            payment_status: true,
            amount: true,
            transaction_key: true,
            paid_at: true,
          },
        },
        shipments: {
          select: {
            id: true,
            shipment_status: true,
            courier: true,
            tracking_number: true,
          },
        },
      },
    });

    return serializePrisma(orders);
  }

  async findMine(userIdValue: string) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const orders = await this.prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_number: true,
        order_status: true,
        payment_status: true,
        delivery_status: true,
        total_amount: true,
        created_at: true,
        updated_at: true,
        order_items: {
          select: {
            id: true,
            product_name: true,
            option_name: true,
            option_value: true,
            quantity: true,
            unit_price: true,
            total_price: true,
          },
        },
        payments: {
          select: {
            id: true,
            payment_method: true,
            payment_status: true,
            amount: true,
            paid_at: true,
          },
        },
        shipments: {
          select: {
            id: true,
            shipment_status: true,
            courier: true,
            tracking_number: true,
          },
        },
      },
    });

    return serializePrisma(orders);
  }

  async findOne(id: string, authUser: AuthUser) {
    const orderId = parseBigIntId(id, 'orderId');
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        order_number: true,
        order_status: true,
        payment_status: true,
        delivery_status: true,
        total_amount: true,
        created_at: true,
        updated_at: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
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
        order_items: {
          select: {
            id: true,
            product_id: true,
            product_option_id: true,
            product_name: true,
            option_name: true,
            option_value: true,
            quantity: true,
            unit_price: true,
            total_price: true,
          },
        },
        payments: true,
        shipments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (
      authUser.subject_type !== 'ADMIN' &&
      order.users.id.toString() !== authUser.sub
    ) {
      throw new ForbiddenException('You can only access your own orders');
    }

    return serializePrisma(order);
  }

  async create(body: CreateOrderDto) {
    const userId = parseBigIntInput(body.user_id, 'user_id');
    const addressId = parseBigIntInput(body.address_id, 'address_id');
    const normalizedItems = this.normalizeRequestedItems(body.items);

    return this.createOrderForUser({
      userId,
      addressId,
      paymentMethod: body.payment_method,
      transactionKey: body.transaction_key,
      items: normalizedItems,
    });
  }

  async checkout(userIdValue: string, body: CheckoutOrderDto) {
    const userId = parseBigIntInput(userIdValue, 'userId');
    const addressId = parseBigIntInput(body.address_id, 'address_id');
    const cart = await this.prisma.carts.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        cart_items: {
          select: {
            id: true,
            product_id: true,
            product_option_id: true,
            quantity: true,
          },
        },
      },
    });

    if (!cart?.cart_items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const items: RequestedOrderItem[] = cart.cart_items.map((item) => ({
      product_id: item.product_id,
      product_option_id: item.product_option_id ?? null,
      quantity: item.quantity,
      cart_item_id: item.id,
    }));

    return this.createOrderForUser({
      userId,
      addressId,
      paymentMethod: body.payment_method,
      transactionKey: body.transaction_key,
      items,
      clearCartItemIds: cart.cart_items.map((item) => item.id),
    });
  }

  async cancel(id: string, authUser: AuthUser) {
    const orderId = parseBigIntId(id, 'orderId');
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        user_id: true,
        order_status: true,
        payment_status: true,
        delivery_status: true,
        order_items: {
          select: {
            product_option_id: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    if (
      authUser.subject_type !== 'ADMIN' &&
      order.user_id.toString() !== authUser.sub
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.delivery_status === 'SHIPPED' || order.delivery_status === 'DELIVERED') {
      throw new BadRequestException('Shipped or delivered orders cannot be cancelled');
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: 'CANCELLED',
          payment_status: order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status,
        },
      });

      if (order.payment_status === 'PAID') {
        await tx.payments.update({
          where: { order_id: orderId },
          data: {
            payment_status: 'REFUNDED',
          },
        });
      }

      for (const item of order.order_items) {
        if (!item.product_option_id) {
          continue;
        }

        await tx.product_options.update({
          where: { id: item.product_option_id },
          data: {
            stock_qty: {
              increment: item.quantity,
            },
          },
        });
      }

      return tx.orders.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          order_number: true,
          order_status: true,
          payment_status: true,
          delivery_status: true,
          total_amount: true,
          created_at: true,
          updated_at: true,
          payments: true,
          shipments: true,
        },
      });
    });

    return serializePrisma(updatedOrder);
  }

  async updateStatus(id: string, body: UpdateOrderStatusDto) {
    if (
      !body.order_status &&
      !body.payment_status &&
      !body.delivery_status &&
      !body.courier &&
      !body.tracking_number
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    const orderId = parseBigIntId(id, 'orderId');
    const existingOrder = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    const now = new Date();
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: orderId },
        data: {
          order_status: body.order_status,
          payment_status: body.payment_status,
          delivery_status: body.delivery_status,
        },
      });

      if (body.payment_status) {
        await tx.payments.update({
          where: { order_id: orderId },
          data: {
            payment_status: body.payment_status,
            paid_at: body.payment_status === 'PAID' ? now : undefined,
          },
        });
      }

      if (body.delivery_status || body.courier || body.tracking_number) {
        await tx.shipments.update({
          where: { order_id: orderId },
          data: {
            shipment_status: body.delivery_status,
            courier: body.courier,
            tracking_number: body.tracking_number,
            shipped_at:
              body.delivery_status === 'SHIPPED' ||
              body.delivery_status === 'DELIVERED'
                ? now
                : undefined,
            delivered_at:
              body.delivery_status === 'DELIVERED' ? now : undefined,
          },
        });
      }

      return tx.orders.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          order_number: true,
          order_status: true,
          payment_status: true,
          delivery_status: true,
          total_amount: true,
          created_at: true,
          updated_at: true,
          payments: true,
          shipments: true,
        },
      });
    });

    return serializePrisma(updatedOrder);
  }

  private normalizeRequestedItems(items: CreateOrderDto['items']): RequestedOrderItem[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('items must contain at least one order item');
    }

    return items.map((item, index) => ({
      product_id: parseBigIntInput(item.product_id, `items[${index}].product_id`),
      product_option_id:
        item.product_option_id === undefined || item.product_option_id === null
          ? null
          : parseBigIntInput(
              item.product_option_id,
              `items[${index}].product_option_id`,
            ),
      quantity: parsePositiveInt(item.quantity, `items[${index}].quantity`),
    }));
  }

  private async createOrderForUser(input: {
    userId: bigint;
    addressId: bigint;
    paymentMethod: string;
    transactionKey?: string;
    items: RequestedOrderItem[];
    clearCartItemIds?: bigint[];
  }) {
    if (!input.paymentMethod?.trim()) {
      throw new BadRequestException('payment_method is required');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: input.userId },
      select: { id: true, status: true },
    });

    if (!user) {
      throw new NotFoundException(`User ${input.userId.toString()} not found`);
    }

    const address = await this.prisma.addresses.findFirst({
      where: { id: input.addressId, user_id: input.userId },
      select: { id: true },
    });

    if (!address) {
      throw new NotFoundException(
        `Address ${input.addressId.toString()} not found for user ${input.userId.toString()}`,
      );
    }

    const preparedItems = await this.prepareOrderItems(input.items);
    const totalAmount = preparedItems.reduce(
      (sum, item) => sum.plus(item.totalPrice),
      new Prisma.Decimal(0),
    );

    const orderNumber = `ORD-${Date.now()}`;

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          user_id: input.userId,
          address_id: input.addressId,
          order_number: orderNumber,
          order_status: 'CREATED',
          payment_status: 'PENDING',
          delivery_status: 'READY',
          total_amount: totalAmount,
          order_items: {
            create: preparedItems.map((item) => ({
              product_id: item.product.id,
              product_option_id: item.option?.id ?? null,
              product_name: item.product.name,
              option_name: item.option?.option_name ?? null,
              option_value: item.option?.option_value ?? null,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total_price: item.totalPrice,
            })),
          },
          payments: {
            create: {
              payment_method: input.paymentMethod.trim(),
              payment_status: 'PENDING',
              amount: totalAmount,
              transaction_key: input.transactionKey?.trim(),
            },
          },
          shipments: {
            create: {
              shipment_status: 'READY',
            },
          },
        },
        select: { id: true },
      });

      for (const item of preparedItems) {
        if (!item.option) {
          continue;
        }

        await tx.product_options.update({
          where: { id: item.option.id },
          data: {
            stock_qty: {
              decrement: item.quantity,
            },
          },
        });
      }

      if (input.clearCartItemIds?.length) {
        await tx.cart_items.deleteMany({
          where: {
            id: { in: input.clearCartItemIds },
          },
        });
      }

      return tx.orders.findUnique({
        where: { id: order.id },
        select: {
          id: true,
          order_number: true,
          order_status: true,
          payment_status: true,
          delivery_status: true,
          total_amount: true,
          created_at: true,
          users: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          addresses: {
            select: {
              id: true,
              recipient_name: true,
              recipient_phone: true,
              zip_code: true,
              address1: true,
              address2: true,
            },
          },
          order_items: {
            select: {
              id: true,
              product_id: true,
              product_option_id: true,
              product_name: true,
              option_name: true,
              option_value: true,
              quantity: true,
              unit_price: true,
              total_price: true,
            },
          },
          payments: true,
          shipments: true,
        },
      });
    });

    return serializePrisma(createdOrder);
  }

  private async prepareOrderItems(items: RequestedOrderItem[]) {
    const productIds = [...new Set(items.map((item) => item.product_id.toString()))].map(
      (id) => BigInt(id),
    );
    const optionIds = [
      ...new Set(
        items
          .map((item) => item.product_option_id?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    ].map((id) => BigInt(id));

    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        base_price: true,
        status: true,
      },
    });

    const productMap = new Map(products.map((product) => [product.id.toString(), product]));

    const productOptions = optionIds.length
      ? await this.prisma.product_options.findMany({
          where: { id: { in: optionIds } },
          select: {
            id: true,
            product_id: true,
            option_name: true,
            option_value: true,
            extra_price: true,
            stock_qty: true,
          },
        })
      : [];

    const optionMap = new Map(
      productOptions.map((option) => [option.id.toString(), option]),
    );

    return items.map((item, index): PreparedOrderItem => {
      const product = productMap.get(item.product_id.toString());
      if (!product) {
        throw new NotFoundException(
          `items[${index}] product ${item.product_id.toString()} not found`,
        );
      }

      if (product.status !== 'ON_SALE') {
        throw new BadRequestException(
          `items[${index}] product ${item.product_id.toString()} is not on sale`,
        );
      }

      const option = item.product_option_id
        ? optionMap.get(item.product_option_id.toString())
        : null;

      if (item.product_option_id && !option) {
        throw new NotFoundException(
          `items[${index}] option ${item.product_option_id.toString()} not found`,
        );
      }

      if (option && option.product_id !== product.id) {
        throw new BadRequestException(
          `items[${index}] option does not belong to product ${product.id.toString()}`,
        );
      }

      if (option && option.stock_qty < item.quantity) {
        throw new BadRequestException(
          `items[${index}] option stock is insufficient for quantity ${item.quantity}`,
        );
      }

      const unitPrice = option
        ? product.base_price.plus(option.extra_price)
        : product.base_price;
      const totalPrice = unitPrice.mul(item.quantity);

      return {
        product,
        option: option ?? null,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        cartItemId: item.cart_item_id,
      };
    });
  }
}
