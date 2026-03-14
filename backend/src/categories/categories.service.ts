import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseBigIntId, serializePrisma } from '../common/prisma.utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.categories.findMany({
      orderBy: { name: 'asc' },
    });
    return serializePrisma(categories);
  }

  async findOne(id: string) {
    const categoryId = parseBigIntId(id, 'categoryId');
    const category = await this.prisma.categories.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return serializePrisma(category);
  }

  async create(body: CreateCategoryDto) {
    const category = await this.prisma.categories.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim(),
      },
    });
    return serializePrisma(category);
  }

  async update(id: string, body: UpdateCategoryDto) {
    const categoryId = parseBigIntId(id, 'categoryId');
    const category = await this.prisma.categories.update({
      where: { id: categoryId },
      data: {
        name: body.name?.trim(),
        description: body.description?.trim(),
      },
    });
    return serializePrisma(category);
  }

  async remove(id: string) {
    const categoryId = parseBigIntId(id, 'categoryId');
    
    // Check if any products belong to this category
    const productsCount = await this.prisma.products.count({
      where: { category_id: categoryId },
    });

    if (productsCount > 0) {
      throw new Error(`Cannot delete category with ${productsCount} products. Move them first.`);
    }

    await this.prisma.categories.delete({
      where: { id: categoryId },
    });
    return { success: true };
  }
}
