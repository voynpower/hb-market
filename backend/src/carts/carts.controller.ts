import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartsService } from './carts.service';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @ApiOperation({ summary: 'Get current user cart' })
  @ApiOkResponse({ description: 'Cart returned' })
  @Get('me')
  getMyCart(@CurrentUser() user: AuthUser) {
    return this.cartsService.getMyCart(user.sub);
  }

  @ApiOperation({ summary: 'Add item to current user cart' })
  @ApiOkResponse({ description: 'Cart updated' })
  @Post('items')
  addItem(@CurrentUser() user: AuthUser, @Body() body: AddCartItemDto) {
    return this.cartsService.addItem(user.sub, body);
  }

  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiOkResponse({ description: 'Cart updated' })
  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(user.sub, id, body);
  }

  @ApiOperation({ summary: 'Remove item from current user cart' })
  @ApiOkResponse({ description: 'Cart updated' })
  @Delete('items/:id')
  removeItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cartsService.removeItem(user.sub, id);
  }
}
