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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAccountGuard } from '../auth/admin-account.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'List all categories' })
  @ApiOkResponse({ description: 'Category list returned' })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Get category detail' })
  @ApiOkResponse({ description: 'Category detail returned' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create category (admin only)' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Category created' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @ApiOperation({ summary: 'Update category (admin only)' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Category updated' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.categoriesService.update(id, body);
  }

  @ApiOperation({ summary: 'Delete category (admin only)' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Category deleted' })
  @UseGuards(JwtAuthGuard, AdminAccountGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
