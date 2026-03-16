import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profile updated' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateUserProfileDto) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @ApiOperation({ summary: 'Withdraw account (anonymize)' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Account withdrawn' })
  @UseGuards(JwtAuthGuard)
  @Delete('me')
  withdrawMe(@CurrentUser() user: AuthUser) {
    return this.usersService.withdraw(user.sub);
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiOkResponse({ description: 'User list returned' })
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get user detail' })
  @ApiOkResponse({ description: 'User detail returned' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
