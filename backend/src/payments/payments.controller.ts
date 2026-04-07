import { Controller, Post, Body, UseGuards, Req, RawBodyRequest } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create a Stripe Checkout session' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-session')
  createSession(
    @CurrentUser() user: AuthUser,
    @Body('orderId') orderId: string,
  ) {
    return this.paymentsService.createCheckoutSession(orderId, user.sub);
  }

  @ApiOperation({ summary: 'Stripe Webhook handler' })
  @Post('webhook')
  handleWebhook(@Req() req: RawBodyRequest<Request>) {
    return this.paymentsService.handleWebhook(req);
  }
}
