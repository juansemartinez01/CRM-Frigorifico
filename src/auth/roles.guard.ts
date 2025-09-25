import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from './roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true; // si no pide roles, basta con estar autenticado

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as Express.User | undefined;
    if (!user || !Array.isArray(user.roles)) {
      throw new ForbiddenException('Usuario sin roles');
    }

    // admin siempre puede
    if (user.roles.includes(Role.Admin)) return true;

    // intersección
    const ok = required.some((r) => user.roles.includes(r));
    if (!ok)
      throw new ForbiddenException('No tienes permisos para esta operación');
    return ok;
  }
}
