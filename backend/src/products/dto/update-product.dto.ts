import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateProductImageDto {
  @ApiPropertyOptional({ example: 'https://example.com/images/mug.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @ApiPropertyOptional({ example: 'Ceramic mug front view' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_primary?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2147483647)
  sort_order?: number;
}

export class UpdateProductOptionDto {
  @ApiPropertyOptional({ example: 'color' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  option_name?: string;

  @ApiPropertyOptional({ example: 'white' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  option_value?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @Transform(({ value }) => String(value))
  @Matches(/^\d+(\.\d{1,2})?$/)
  extra_price?: string;

  @ApiPropertyOptional({ example: 10 })
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

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Ceramic Mug' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '39.99' })
  @IsOptional()
  @Transform(({ value }) => String(value))
  @Matches(/^\d+(\.\d{1,2})?$/)
  base_price?: string;

  @ApiPropertyOptional({ example: 'OFF_SALE' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ type: () => [UpdateProductOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionDto)
  options?: UpdateProductOptionDto[];

  @ApiPropertyOptional({ type: () => [UpdateProductImageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductImageDto)
  images?: UpdateProductImageDto[];
}
