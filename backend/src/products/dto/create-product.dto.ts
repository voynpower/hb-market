import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://example.com/images/mug.jpg' })
  @IsString()
  @MaxLength(500)
  url!: string;

  @ApiPropertyOptional({ example: 'Ceramic mug front view' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  is_primary?: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort_order?: number;
}

export class CreateProductOptionDto {
  @ApiProperty({ example: 'color' })
  @IsString()
  @MaxLength(100)
  option_name!: string;

  @ApiProperty({ example: 'white' })
  @IsString()
  @MaxLength(100)
  option_value!: string;

  @ApiPropertyOptional({ example: '0.00', default: '0.00' })
  @IsOptional()
  @Transform(({ value }) => String(value))
  @Matches(/^\d+(\.\d{1,2})?$/)
  extra_price?: string;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stock_qty?: number;

  @ApiPropertyOptional({ example: 'MUG-WHITE' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;
}

export class CreateProductDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ example: 'Ceramic Mug' })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ example: 'Small batch mug' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '29.99' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+(\.\d{1,2})?$/)
  base_price!: string;

  @ApiPropertyOptional({ example: 'ON_SALE', default: 'ON_SALE' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ type: () => [CreateProductOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOptionDto)
  options?: CreateProductOptionDto[];

  @ApiPropertyOptional({ type: () => [CreateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}
