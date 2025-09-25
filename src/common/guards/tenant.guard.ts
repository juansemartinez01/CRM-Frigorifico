// src/common/guards/tenant.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@app/auth/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private cfg: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Si la ruta es pública, no exigimos tenantId
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user as Express.User | undefined;

    if (user?.tid) {
      req.tenantId = user.tid;
      return true;
    }

    // Fallback opcional por header (solo si lo habilitás por env)
    const allowHeader = this.cfg.get('ALLOW_HEADER_TENANT') === 'true';
    if (allowHeader) {
      const headerName = this.cfg.get<string>('TENANT_HEADER') || 'X-Tenant-Id';
      const fallback = this.cfg.get<string>('DEFAULT_TENANT') || 'public';
      req.tenantId = (req.header(headerName) || fallback).trim();
      return true;
    }

    throw new UnauthorizedException('No se pudo determinar el tenant (tid)');
  }
}
