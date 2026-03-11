import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser, type AuthUser } from './current-user.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up a new user account' })
  @ApiCreatedResponse({ description: 'Account created and JWT returned' })
  @Post('signup')
  signUp(@Body() body: SignUpDto) {
    return this.authService.signUp(body);
  }

  @ApiOperation({ summary: 'Sign in and receive a JWT token' })
  @ApiOkResponse({ description: 'JWT token returned' })
  @Post('login')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body);
  }

  @ApiOperation({ summary: 'Sign in as an admin and receive a JWT token' })
  @ApiOkResponse({ description: 'Admin JWT token returned' })
  @Post('admin/login')
  adminSignIn(@Body() body: SignInDto) {
    return this.authService.adminSignIn(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiOkResponse({ description: 'Current user returned' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
