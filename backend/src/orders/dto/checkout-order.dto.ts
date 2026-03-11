import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CheckoutOrderDto {
  @ApiProperty({ example: '1' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+$/)
  address_id!: string;

  @ApiProperty({ example: 'CARD' })
  @IsString()
  @MaxLength(30)
  payment_method!: string;

  @ApiPropertyOptional({ example: 'checkout-key-123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transaction_key?: string;
}
