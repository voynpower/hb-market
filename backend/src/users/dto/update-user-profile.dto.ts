import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Hasanboy' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

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
