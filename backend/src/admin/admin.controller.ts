import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAccountGuard } from '../auth/admin-account.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminService } from './admin.service';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { UpdateAdminProfileDto } from '../admin-users/dto/update-admin-profile.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminAccountGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @ApiOperation({ summary: 'Get admin dashboard summary' })
  @ApiOkResponse({ description: 'Admin dashboard data returned' })
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @ApiOperation({ summary: 'Update admin profile' })
  @ApiOkResponse({ description: 'Admin profile updated' })
  @Patch('profile')
  updateProfile(@CurrentUser() user: any, @Body() body: UpdateAdminProfileDto) {
    return this.adminUsersService.updateProfile(user.id, body);
  }
}
