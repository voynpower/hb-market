import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
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

export class CreateOrderItemDto {
  @ApiProperty({ example: '1' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+$/)
  product_id!: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : String(value)))
  @Matches(/^\d+$/)
  product_option_id?: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '1' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+$/)
  user_id!: string;

  @ApiProperty({ example: '1' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+$/)
  address_id!: string;

  @ApiProperty({ example: 'CARD' })
  @IsString()
  @MaxLength(30)
  payment_method!: string;

  @ApiPropertyOptional({ example: 'temp-key-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transaction_key?: string;

  @ApiProperty({ type: () => [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
