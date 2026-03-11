import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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

export class CreateUserDto {
  @ApiProperty({ example: 'demo@hb.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password1234' })
  @IsString()
  @MaxLength(255)
  password!: string;

  @ApiProperty({ example: 'Demo User' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '01012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @ApiPropertyOptional({ type: () => [CreateAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAddressDto)
  addresses?: CreateAddressDto[];
}
