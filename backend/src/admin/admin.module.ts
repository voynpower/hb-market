import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersModule } from '../admin-users/admin-users.module';

@Module({
  imports: [AdminUsersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
