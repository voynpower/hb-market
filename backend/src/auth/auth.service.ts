import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { AdminUsersService } from '../admin-users/admin-users.service';
import { UsersService } from '../users/users.service';
import type { AuthUser } from './current-user.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

const jwtExpiresInSeconds = Number(
  process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24 * 7,
);

@Injectable()
export class AuthService {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(body: SignUpDto) {
    const existingUser = await this.usersService.findByEmailForAuth(body.email);
    if (existingUser) {
      throw new ConflictException(`User with email ${body.email} already exists`);
    }

    const user = await this.usersService.create({
      email: body.email,
      password: body.password,
      name: body.name,
      phone: body.phone,
      addresses: body.addresses,
    });

    const accessToken = await this.signToken({
      sub: String(user.id),
      email: user.email,
      role: user.role,
      subject_type: 'USER',
    });

    return {
      user: {
        ...user,
        subject_type: 'USER',
      },
      access_token: accessToken,
    };
  }

  async signIn(body: SignInDto) {
    const user = await this.usersService.findByEmailForAuth(body.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(body.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.signToken({
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
      subject_type: 'USER',
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        subject_type: 'USER',
      },
      access_token: accessToken,
    };
  }

  async adminSignIn(body: SignInDto) {
    const adminUser = await this.adminUsersService.findByEmailForAuth(body.email);
    if (!adminUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(body.password, adminUser.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.signToken({
      sub: adminUser.id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      subject_type: 'ADMIN',
    });

    await this.adminUsersService.touchLastLogin(adminUser.id.toString());

    return {
      user: {
        id: adminUser.id.toString(),
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        status: adminUser.status,
        subject_type: 'ADMIN',
      },
      access_token: accessToken,
    };
  }

  async me(authUser: AuthUser) {
    if (authUser.subject_type === 'ADMIN') {
      const adminUser = await this.adminUsersService.findOne(authUser.sub);
      return {
        ...adminUser,
        subject_type: 'ADMIN',
      };
    }

    const user = await this.usersService.findOne(authUser.sub);
    return {
      ...user,
      subject_type: 'USER',
    };
  }

  private signToken(payload: {
    sub: string;
    email: string;
    role: string;
    subject_type: 'USER' | 'ADMIN';
  }) {
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'hb-market-dev-secret',
      expiresIn: jwtExpiresInSeconds,
    });
  }
}
