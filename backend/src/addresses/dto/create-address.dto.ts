import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Demo User' })
  @IsString()
  @MaxLength(100)
  recipient_name!: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @MaxLength(30)
  recipient_phone!: string;

  @ApiProperty({ example: '12345' })
  @IsString()
  @MaxLength(20)
  zip_code!: string;

  @ApiProperty({ example: 'Seoul, Gangnam-gu' })
  @IsString()
  @MaxLength(255)
  address1!: string;

  @ApiPropertyOptional({ example: '101' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address2?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
