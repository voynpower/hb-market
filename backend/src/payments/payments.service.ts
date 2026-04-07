import { Injectable, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { Request } from 'express';

@Injectable()
export class PaymentsService {
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (secretKey && secretKey.trim() !== '') {
      try {
        this.stripe = new Stripe(secretKey, {
          apiVersion: '2025-02-24-preview' as any,
        });
        console.log('Stripe initialized successfully.');
      } catch (e) {
        console.error('Failed to initialize Stripe:', e.message);
      }
    } else {
      console.error('CRITICAL: STRIPE_SECRET_KEY is not set. Payment features will be disabled.');
    }
  }

  async createCheckoutSession(orderIdValue: string, userIdValue: string) {
    if (!this.stripe) {
      throw new BadRequestException('Payment system is currently unavailable (missing API key)');
    }

    const orderId = BigInt(orderIdValue);
    
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: true,
        users: true,
      },
    });

    if (!order || order.user_id.toString() !== userIdValue) {
      throw new BadRequestException('Order not found');
    }

    if (order.payment_status === 'PAID') {
      throw new BadRequestException('Order is already paid');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: order.order_items.map((item) => ({
        price_data: {
          currency: 'krw',
          product_data: {
            name: item.product_name,
          },
          unit_amount: Math.round(Number(item.unit_price)),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}?payment=cancel`,
      metadata: {
        orderId: order.id.toString(),
      },
      customer_email: order.users.email,
    });

    return { url: session.url };
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    if (!this.stripe) {
      console.error('Webhook received but Stripe is not initialized.');
      return { received: false };
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error('Webhook missing signature or secret.');
      throw new BadRequestException('Invalid webhook signature');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig,
        webhookSecret,
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderIdStr = session.metadata?.orderId;

      if (orderIdStr) {
        await this.fulfillOrder(BigInt(orderIdStr), session.id, Number(session.amount_total) / 100);
      }
    }

    return { received: true };
  }

  private async fulfillOrder(orderId: bigint, sessionId: string, amount: number) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.update({
        where: { id: orderId },
        data: {
          payment_status: 'PAID',
          order_status: 'CONFIRMED',
        },
        include: {
          order_items: true,
        },
      });

      await tx.payments.upsert({
        where: { order_id: orderId },
        update: {
          payment_status: 'PAID',
          transaction_key: sessionId,
          paid_at: new Date(),
          amount: order.total_amount,
        },
        create: {
          order_id: orderId,
          payment_method: 'STRIPE',
          payment_status: 'PAID',
          transaction_key: sessionId,
          paid_at: new Date(),
          amount: order.total_amount,
        },
      });

      for (const item of order.order_items) {
        if (item.product_option_id) {
          await tx.product_options.update({
            where: { id: item.product_option_id },
            data: {
              stock_qty: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
    });

    console.log(`Order ${orderId.toString()} fulfilled successfully.`);
  }
}
