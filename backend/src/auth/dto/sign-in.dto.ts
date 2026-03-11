import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: 'demo@hb.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password1234' })
  @IsString()
  @MaxLength(255)
  password!: string;
}
