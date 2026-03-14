import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAccountGuard } from '../auth/admin-account.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List products' })
  @ApiOkResponse({ description: 'Product list returned' })
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category_id') category_id?: string,
  ) {
    return this.productsService.findAll(status, category_id);
  }

  @ApiOperation({ summary: 'Get product detail' })
  @ApiOkResponse({ description: 'Product detail returned' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create product' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Product created' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Post()
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  @ApiOperation({ summary: 'Update product' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Product updated' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @ApiOperation({ summary: 'Delete product' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Product deleted' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
