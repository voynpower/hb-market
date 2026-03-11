import 'dotenv/config';
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { UsersModule } from '../users/users.module';
import { AdminAccountGuard } from './admin-account.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const jwtExpiresInSeconds = Number(
  process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24 * 7,
);

@Global()
@Module({
  imports: [
    AdminUsersModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'hb-market-dev-secret',
      signOptions: {
        expiresIn: jwtExpiresInSeconds,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminAccountGuard, RolesGuard, Reflector],
  exports: [JwtModule, JwtAuthGuard, AdminAccountGuard, RolesGuard],
})
export class AuthModule {}
