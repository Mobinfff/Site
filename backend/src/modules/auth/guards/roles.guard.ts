import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity'; // Adjust path
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity'; // Adjust path

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles specified, access granted
    }

    const { user } = context.switchToHttp().getRequest<{ user?: User }>();

    if (!user || !user.role) {
      throw new ForbiddenException('شما دسترسی لازم برای انجام این عملیات را ندارید (نقش کاربر مشخص نیست).');
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    if (!hasRequiredRole) {
        throw new ForbiddenException(`شما دسترسی لازم برای انجام این عملیات را ندارید. نقش مورد نیاز: ${requiredRoles.join(' یا ')}`);
    }
    return true;
  }
}
