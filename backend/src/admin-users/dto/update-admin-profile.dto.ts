import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'Admin User' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'admin@hb.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Current password for verification' })
  @IsOptional()
  @IsString()
  current_password?: string;

  @ApiPropertyOptional({ description: 'New password to set', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  new_password?: string;
}
