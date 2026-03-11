import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { AdminAccountGuard } from '../auth/admin-account.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'List orders' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Order list returned' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @ApiOperation({ summary: 'List current user orders' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user order list returned' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.sub);
  }

  @ApiOperation({ summary: 'Create order from current user cart' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Order created from current cart' })
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() body: CheckoutOrderDto) {
    return this.ordersService.checkout(user.sub, body);
  }

  @ApiOperation({ summary: 'Get order detail' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Order detail returned' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.findOne(id, user);
  }

  @ApiOperation({ summary: 'Create order' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Order created' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Post()
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }

  @ApiOperation({ summary: 'Cancel current user order' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Order cancelled' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ordersService.cancel(id, user);
  }

  @ApiOperation({ summary: 'Update order, payment, and delivery statuses' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Order status updated' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, body);
  }
}
