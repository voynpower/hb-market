import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serializePrisma } from '../common/prisma.utils';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
async getDashboard() {
  const [
    usersCount,
    productsCount,
    ordersCount,
    revenueAggregate,
    recentOrders,
    lowStockItems,
  ] = await Promise.all([
    this.prisma.users.count(),
    this.prisma.products.count(),
    this.prisma.orders.count(),
    this.prisma.orders.aggregate({
      _sum: {
        total_amount: true,
      },
      where: {
        payment_status: 'PAID',
      },
    }),
    this.prisma.orders.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
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
      },
    }),
    this.prisma.product_options.findMany({
      where: {
        stock_qty: { lte: 5 },
      },
      select: {
        id: true,
        option_name: true,
        option_value: true,
        stock_qty: true,
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10, // Limit to top 10 low stock items for dashboard
    }),
  ]);

  return serializePrisma({
    metrics: {
      users: usersCount,
      products: productsCount,
      orders: ordersCount,
      paid_revenue: revenueAggregate._sum.total_amount ?? new Prisma.Decimal(0),
      low_stock_count: lowStockItems.length,
    },
    recent_orders: recentOrders,
    low_stock_items: lowStockItems,
  });
}
}
