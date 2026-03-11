import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminAccountGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { subject_type?: string } | undefined;

    if (user?.subject_type !== 'ADMIN') {
      throw new ForbiddenException('Admin account required');
    }

    return true;
  }
}
