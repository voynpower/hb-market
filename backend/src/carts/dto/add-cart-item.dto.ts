import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @ApiProperty({ example: '1' })
  @Transform(({ value }) => String(value))
  @Matches(/^\d+$/)
  product_id!: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? value : String(value)))
  @Matches(/^\d+$/)
  product_option_id?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity!: number;
}
