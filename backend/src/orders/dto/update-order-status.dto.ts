import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const ORDER_STATUS_VALUES = ['CREATED', 'CONFIRMED', 'CANCELLED'] as const;
export const PAYMENT_STATUS_VALUES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export const DELIVERY_STATUS_VALUES = ['READY', 'SHIPPED', 'DELIVERED'] as const;

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: ORDER_STATUS_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(ORDER_STATUS_VALUES)
  order_status?: string;

  @ApiPropertyOptional({ enum: PAYMENT_STATUS_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(PAYMENT_STATUS_VALUES)
  payment_status?: string;

  @ApiPropertyOptional({ enum: DELIVERY_STATUS_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(DELIVERY_STATUS_VALUES)
  delivery_status?: string;

  @ApiPropertyOptional({ example: 'CJ Logistics' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  courier?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tracking_number?: string;
}
